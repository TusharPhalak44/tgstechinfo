const { pool } = require('../config/database');
const { sendEventConfirmationEmail, generateIcsCalendar } = require('../services/eventEmailService');
const crypto = require('crypto');

/**
 * Generate a clean URL slug from string
 */
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

/**
 * Validate HTTP/HTTPS URLs
 */
function isValidHttpUrl(str) {
    if (!str || typeof str !== 'string') return false;
    const trimmed = str.trim();
    if (!trimmed) return false;
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Normalize banner image URLs
 */
function formatBannerUrl(img) {
    if (!img) return null;
    if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) return img;
    if (img.startsWith('/')) return img;
    return `/uploads/${img}`;
}

/**
 * Public: Get published events with search, filters & pagination
 */
exports.getPublicEvents = async (req, res) => {
    try {
        const { search, type, mode, timeline = 'upcoming', page = 1, limit = 12 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
        const offset = (pageNum - 1) * limitNum;

        let query = `
            SELECT e.*, 
                   COALESCE(e.banner_image, c.banner_image) AS banner_image,
                   (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id = e.id AND r.status != 'cancelled') AS registered_count
            FROM events e
            LEFT JOIN contents c ON c.slug = e.slug COLLATE utf8mb4_unicode_ci AND c.content_type_id = 5
            WHERE e.status = 'published'
        `;
        const params = [];

        // Search in title, short_description, speaker
        if (search && search.trim()) {
            query += ` AND (e.title LIKE ? OR e.short_description LIKE ? OR e.speaker_name LIKE ? OR e.speaker_company LIKE ?)`;
            const s = `%${search.trim()}%`;
            params.push(s, s, s, s);
        }

        // Filter by event_type (webinar, workshop, conference, etc.)
        if (type && type !== 'all') {
            query += ` AND e.event_type = ?`;
            params.push(type);
        }

        // Filter by event_mode (online, offline, hybrid)
        if (mode && mode !== 'all') {
            query += ` AND e.event_mode = ?`;
            params.push(mode);
        }

        // Timeline filter (upcoming vs past)
        if (timeline === 'past') {
            query += ` AND e.start_date < NOW()`;
        } else {
            // Default upcoming
            query += ` AND e.start_date >= NOW()`;
        }

        // Ordering: upcoming events soonest first, past events most recent first
        if (timeline === 'past') {
            query += ` ORDER BY e.start_date DESC`;
        } else {
            query += ` ORDER BY e.featured DESC, e.start_date ASC`;
        }

        // Count total matching
        const [allMatching] = await pool.query(query, params);
        const total = allMatching.length;

        // Add pagination
        query += ` LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);

        const [events] = await pool.query(query, params);

        // Sanitize sensitive URLs before returning publicly
        const sanitizedEvents = events.map(evt => {
            const isFull = evt.max_capacity > 0 && evt.registered_count >= evt.max_capacity;
            const safe = { ...evt };
            
            // SECURITY: Never expose private virtual join urls in public listings
            delete safe.virtual_join_url;
            delete safe.online_join_url;

            return {
                ...safe,
                banner_image: formatBannerUrl(safe.banner_image),
                is_full: Boolean(isFull),
                seats_left: evt.max_capacity > 0 ? Math.max(0, evt.max_capacity - evt.registered_count) : null
            };
        });

        res.json({
            success: true,
            events: sanitizedEvents,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum) || 1
            }
        });
    } catch (err) {
        console.error('[getPublicEvents] Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch events.' });
    }
};

/**
 * Public: Get single event by slug
 */
exports.getPublicEventBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const [rows] = await pool.query(`
            SELECT e.*, 
                   COALESCE(e.banner_image, c.banner_image) AS banner_image,
                   (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id = e.id AND r.status != 'cancelled') AS registered_count
            FROM events e
            LEFT JOIN contents c ON c.slug = e.slug COLLATE utf8mb4_unicode_ci AND c.content_type_id = 5
            WHERE e.slug = ? AND e.status = 'published'
            LIMIT 1
        `, [slug]);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found or not published.' });
        }

        const event = rows[0];

        // Increment view count
        pool.query('UPDATE events SET view_count = view_count + 1 WHERE id = ?', [event.id]).catch(() => {});

        const isFull = event.max_capacity > 0 && event.registered_count >= event.max_capacity;
        const isPast = new Date(event.start_date) < new Date();

        const safeEvent = { ...event };
        // SECURITY: Never expose private virtual join urls in public detail before registration
        delete safeEvent.virtual_join_url;
        delete safeEvent.online_join_url;

        res.json({
            success: true,
            event: {
                ...safeEvent,
                banner_image: formatBannerUrl(safeEvent.banner_image),
                is_full: Boolean(isFull),
                is_past: isPast,
                seats_left: event.max_capacity > 0 ? Math.max(0, event.max_capacity - event.registered_count) : null
            }
        });
    } catch (err) {
        console.error('[getPublicEventBySlug] Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch event details.' });
    }
};

/**
 * Public: Register for an Event
 */
exports.registerForEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            first_name,
            last_name,
            email,
            phone,
            job_title,
            company_name,
            city_country,
            notes,
            website_url // Honeypot spam trap
        } = req.body;

        // 1. Anti-spam honeypot detection
        if (website_url) {
            console.warn(`[Anti-Spam] Bot submission blocked on event registration`);
            return res.status(400).json({ success: false, message: 'Invalid submission request.' });
        }

        // 2. Validate mandatory inputs
        if (!first_name || !first_name.trim() || !last_name || !last_name.trim()) {
            return res.status(400).json({ success: false, message: 'First name and Last name are required.' });
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return res.status(400).json({ success: false, message: 'A valid email address is required.' });
        }

        const cleanEmail = email.trim().toLowerCase();

        // 3. Check event existence & status
        const [eventRows] = await pool.query('SELECT * FROM events WHERE id = ? LIMIT 1', [id]);
        if (!eventRows || eventRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }

        const event = eventRows[0];
        if (event.status !== 'published') {
            return res.status(400).json({ success: false, message: 'This event is currently not open for registration.' });
        }

        // Check if event uses external registration
        if (event.registration_type === 'external') {
            return res.status(400).json({
                success: false,
                is_external: true,
                registration_url: event.registration_url,
                message: 'This event uses external registration. Please register directly on the organizer website.'
            });
        }

        if (new Date(event.start_date) < new Date()) {
            return res.status(400).json({ success: false, message: 'This event has already concluded.' });
        }

        // 4. Check for duplicate registration by email
        const [existing] = await pool.query(
            'SELECT * FROM event_registrations WHERE event_id = ? AND email = ? LIMIT 1',
            [id, cleanEmail]
        );

        if (existing && existing.length > 0) {
            const prior = existing[0];
            return res.status(409).json({
                success: false,
                is_duplicate: true,
                message: `You are already registered for this event! Your Ticket Code is: ${prior.registration_code}`,
                registration: {
                    registration_code: prior.registration_code,
                    first_name: prior.first_name,
                    email: prior.email
                }
            });
        }

        // 5. Capacity Check
        if (event.max_capacity > 0) {
            const [countResult] = await pool.query(
                `SELECT COUNT(id) AS total FROM event_registrations WHERE event_id = ? AND status != 'cancelled'`,
                [id]
            );
            const currentTotal = countResult[0].total || 0;
            if (currentTotal >= event.max_capacity) {
                return res.status(400).json({
                    success: false,
                    is_full: true,
                    message: 'Registration is now closed because this event has reached full seating capacity.'
                });
            }
        }

        // 6. Generate Unique Ticket / Registration Code
        const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
        const registration_code = `TGS-EVT-${event.id}-${randomHex}`;

        // 7. Save Registration
        const [insertResult] = await pool.query(`
            INSERT INTO event_registrations 
            (event_id, registration_code, first_name, last_name, email, phone, job_title, company_name, city_country, notes, status, registered_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', NOW())
        `, [
            event.id,
            registration_code,
            first_name.trim(),
            last_name.trim(),
            cleanEmail,
            phone ? phone.trim() : null,
            job_title ? job_title.trim() : null,
            company_name ? company_name.trim() : null,
            city_country ? city_country.trim() : null,
            notes ? notes.trim() : null
        ]);

        const attendeeRecord = {
            id: insertResult.insertId,
            event_id: event.id,
            registration_code,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: cleanEmail,
            phone: phone ? phone.trim() : null,
            company_name: company_name ? company_name.trim() : null,
            job_title: job_title ? job_title.trim() : null
        };

        // 8. Send Instant Confirmation Email asynchronously
        sendEventConfirmationEmail({ attendee: attendeeRecord, event })
            .then(emailRes => {
                if (emailRes && emailRes.success) {
                    pool.query('UPDATE event_registrations SET email_sent = 1 WHERE id = ?', [insertResult.insertId]).catch(() => {});
                }
            })
            .catch(emailErr => {
                console.error('[registerForEvent] Email sending error:', emailErr.message);
            });

        res.status(201).json({
            success: true,
            message: 'Registration successful! Confirmation details and calendar invite have been sent to your email.',
            registration: {
                id: insertResult.insertId,
                registration_code,
                first_name: attendeeRecord.first_name,
                last_name: attendeeRecord.last_name,
                email: attendeeRecord.email,
                event_title: event.title,
                start_date: event.start_date,
                event_mode: event.event_mode,
                virtual_join_url: (event.event_mode === 'online' || event.event_mode === 'hybrid') ? (event.virtual_join_url || event.online_join_url || null) : null,
                online_join_url: (event.event_mode === 'online' || event.event_mode === 'hybrid') ? (event.virtual_join_url || event.online_join_url || null) : null,
                venue_name: event.venue_name,
                calendar_download_url: `/api/public/events/${event.id}/calendar.ics`
            }
        });
    } catch (err) {
        console.error('[registerForEvent] Error:', err);
        res.status(500).json({ success: false, message: 'Failed to process event registration. Please try again.' });
    }
};

/**
 * Public: Download iCalendar .ics file directly
 */
exports.downloadCalendarIcs = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM events WHERE id = ? LIMIT 1', [id]);
        if (!rows || rows.length === 0) {
            return res.status(404).send('Event not found');
        }

        const event = rows[0];
        const icsContent = generateIcsCalendar(event);

        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${event.slug || 'event'}-invite.ics"`);
        res.send(icsContent);
    } catch (err) {
        console.error('[downloadCalendarIcs] Error:', err);
        res.status(500).send('Error generating calendar file');
    }
};

/* ==============================================================
   ADMIN CONTROLLER METHODS
============================================================== */

/**
 * Admin: Get all events (including drafts & stats)
 */
exports.getAdminEvents = async (req, res) => {
    try {
        const { search, status, type } = req.query;

        let query = `
            SELECT e.*, 
                   (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id = e.id AND r.status != 'cancelled') AS total_registered,
                   (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id = e.id AND r.status = 'attended') AS total_attended
            FROM events e
            WHERE 1=1
        `;
        const params = [];

        if (search && search.trim()) {
            query += ` AND (e.title LIKE ? OR e.speaker_name LIKE ? OR e.venue_name LIKE ?)`;
            const s = `%${search.trim()}%`;
            params.push(s, s, s);
        }

        if (status && status !== 'all') {
            query += ` AND e.status = ?`;
            params.push(status);
        }

        if (type && type !== 'all') {
            query += ` AND e.event_type = ?`;
            params.push(type);
        }

        query += ` ORDER BY e.created_at DESC`;

        const [rows] = await pool.query(query, params);
        res.json({ success: true, events: rows });
    } catch (err) {
        console.error('[getAdminEvents] Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch admin events.' });
    }
};

/**
 * Admin: Get event by ID for editing
 */
exports.getAdminEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM events WHERE id = ? LIMIT 1', [id]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }
        res.json({ success: true, event: rows[0] });
    } catch (err) {
        console.error('[getAdminEventById] Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch event.' });
    }
};

/**
 * Admin: Create a new Event
 */
exports.createEvent = async (req, res) => {
    try {
        const {
            title,
            slug,
            short_description,
            description,
            event_type = 'webinar',
            event_mode = 'online',
            start_date,
            end_date,
            timezone = 'IST (UTC+5:30)',
            venue_name,
            venue_address,
            venue_city,
            venue_map_url,
            source_url,
            registration_type = 'tgs',
            registration_url,
            online_platform = 'Zoom',
            online_join_url,
            virtual_join_url,
            banner_image,
            speaker_name,
            speaker_role,
            speaker_company,
            speaker_bio,
            speaker_image,
            ticket_type = 'free',
            ticket_price = 0,
            max_capacity = 0,
            status = 'published',
            featured = 0,
            seo_meta_title,
            seo_meta_description,
            seo_keywords
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Event title is required.' });
        }

        if (!start_date) {
            return res.status(400).json({ success: false, message: 'Start date and time are required.' });
        }

        // Validate URLs
        const cleanSourceUrl = source_url && typeof source_url === 'string' ? source_url.trim() : null;
        if (cleanSourceUrl && !isValidHttpUrl(cleanSourceUrl)) {
            return res.status(400).json({ success: false, message: 'Event Source URL must be a valid HTTP or HTTPS URL.' });
        }

        const validRegType = registration_type === 'external' ? 'external' : 'tgs';
        const cleanRegUrl = registration_url && typeof registration_url === 'string' ? registration_url.trim() : null;
        if (validRegType === 'external') {
            if (!cleanRegUrl || !isValidHttpUrl(cleanRegUrl)) {
                return res.status(400).json({ success: false, message: 'External Registration URL is required and must be a valid HTTP or HTTPS URL.' });
            }
        } else if (cleanRegUrl && !isValidHttpUrl(cleanRegUrl)) {
            return res.status(400).json({ success: false, message: 'Registration URL must be a valid HTTP or HTTPS URL.' });
        }

        const rawJoinUrl = ((virtual_join_url || online_join_url || '')).toString().trim();
        let finalVirtualJoinUrl = null;
        if (event_mode === 'offline') {
            finalVirtualJoinUrl = null;
        } else {
            if (rawJoinUrl) {
                if (!isValidHttpUrl(rawJoinUrl)) {
                    return res.status(400).json({ success: false, message: 'Virtual Join URL must be a valid HTTP or HTTPS URL (e.g. Zoom, Google Meet).' });
                }
                finalVirtualJoinUrl = rawJoinUrl;
            }
        }

        // Determine unique slug
        let finalSlug = slug ? slugify(slug) : slugify(title);
        const [existing] = await pool.query('SELECT id FROM events WHERE slug = ? LIMIT 1', [finalSlug]);
        if (existing && existing.length > 0) {
            finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
        }

        const [result] = await pool.query(`
            INSERT INTO events 
            (title, slug, short_description, description, event_type, event_mode, start_date, end_date, timezone,
             venue_name, venue_address, venue_city, venue_map_url,
             source_url, registration_type, registration_url,
             online_platform, online_join_url, virtual_join_url,
             banner_image, speaker_name, speaker_role, speaker_company, speaker_bio, speaker_image,
             ticket_type, ticket_price, max_capacity, status, featured,
             seo_meta_title, seo_meta_description, seo_keywords, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title.trim(),
            finalSlug,
            short_description || null,
            description || null,
            event_type,
            event_mode,
            new Date(start_date),
            end_date ? new Date(end_date) : null,
            timezone,
            venue_name || null,
            venue_address || null,
            venue_city || null,
            venue_map_url || null,
            cleanSourceUrl,
            validRegType,
            cleanRegUrl,
            online_platform || null,
            finalVirtualJoinUrl, // backward compatibility online_join_url
            finalVirtualJoinUrl, // new virtual_join_url
            banner_image || null,
            speaker_name || null,
            speaker_role || null,
            speaker_company || null,
            speaker_bio || null,
            speaker_image || null,
            ticket_type,
            Number(ticket_price) || 0,
            parseInt(max_capacity, 10) || 0,
            status,
            featured ? 1 : 0,
            seo_meta_title || title.trim(),
            seo_meta_description || short_description || null,
            seo_keywords || null,
            req.user?.id || null
        ]);

        res.status(201).json({
            success: true,
            message: 'Event created and published successfully!',
            eventId: result.insertId,
            slug: finalSlug
        });
    } catch (err) {
        console.error('[createEvent] Error:', err);
        res.status(500).json({ success: false, message: 'Failed to create event.' });
    }
};

/**
 * Admin: Update Event
 */
exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            slug,
            short_description,
            description,
            event_type,
            event_mode,
            start_date,
            end_date,
            timezone,
            venue_name,
            venue_address,
            venue_city,
            venue_map_url,
            source_url,
            registration_type,
            registration_url,
            online_platform,
            online_join_url,
            virtual_join_url,
            banner_image,
            speaker_name,
            speaker_role,
            speaker_company,
            speaker_bio,
            speaker_image,
            ticket_type,
            ticket_price,
            max_capacity,
            status,
            featured,
            seo_meta_title,
            seo_meta_description,
            seo_keywords
        } = req.body;

        const [existing] = await pool.query('SELECT * FROM events WHERE id = ? LIMIT 1', [id]);
        if (!existing || existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }

        const effectiveMode = event_mode || existing[0].event_mode;

        // Validate URLs
        const cleanSourceUrl = source_url !== undefined 
            ? (source_url && typeof source_url === 'string' ? source_url.trim() : null)
            : existing[0].source_url;
        if (cleanSourceUrl && !isValidHttpUrl(cleanSourceUrl)) {
            return res.status(400).json({ success: false, message: 'Event Source URL must be a valid HTTP or HTTPS URL.' });
        }

        const effectiveRegType = registration_type || existing[0].registration_type || 'tgs';
        const cleanRegUrl = registration_url !== undefined
            ? (registration_url && typeof registration_url === 'string' ? registration_url.trim() : null)
            : existing[0].registration_url;
        if (effectiveRegType === 'external') {
            if (!cleanRegUrl || !isValidHttpUrl(cleanRegUrl)) {
                return res.status(400).json({ success: false, message: 'External Registration URL is required and must be a valid HTTP or HTTPS URL.' });
            }
        } else if (cleanRegUrl && !isValidHttpUrl(cleanRegUrl)) {
            return res.status(400).json({ success: false, message: 'Registration URL must be a valid HTTP or HTTPS URL.' });
        }

        const inputJoinUrl = virtual_join_url !== undefined ? virtual_join_url : online_join_url;
        const rawJoinUrl = inputJoinUrl !== undefined 
            ? (inputJoinUrl ? String(inputJoinUrl).trim() : null)
            : (existing[0].virtual_join_url || existing[0].online_join_url);

        let finalVirtualJoinUrl = null;
        if (effectiveMode === 'offline') {
            finalVirtualJoinUrl = null;
        } else {
            if (rawJoinUrl) {
                if (!isValidHttpUrl(rawJoinUrl)) {
                    return res.status(400).json({ success: false, message: 'Virtual Join URL must be a valid HTTP or HTTPS URL (e.g. Zoom, Google Meet).' });
                }
                finalVirtualJoinUrl = rawJoinUrl;
            }
        }

        let finalSlug = existing[0].slug;
        if (slug && slug.trim() && slug !== existing[0].slug) {
            finalSlug = slugify(slug);
            const [slugCheck] = await pool.query('SELECT id FROM events WHERE slug = ? AND id != ? LIMIT 1', [finalSlug, id]);
            if (slugCheck && slugCheck.length > 0) {
                finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
            }
        }

        await pool.query(`
            UPDATE events SET
              title = ?,
              slug = ?,
              short_description = ?,
              description = ?,
              event_type = ?,
              event_mode = ?,
              start_date = ?,
              end_date = ?,
              timezone = ?,
              venue_name = ?,
              venue_address = ?,
              venue_city = ?,
              venue_map_url = ?,
              source_url = ?,
              registration_type = ?,
              registration_url = ?,
              online_platform = ?,
              online_join_url = ?,
              virtual_join_url = ?,
              banner_image = ?,
              speaker_name = ?,
              speaker_role = ?,
              speaker_company = ?,
              speaker_bio = ?,
              speaker_image = ?,
              ticket_type = ?,
              ticket_price = ?,
              max_capacity = ?,
              status = ?,
              featured = ?,
              seo_meta_title = ?,
              seo_meta_description = ?,
              seo_keywords = ?
            WHERE id = ?
        `, [
            title ? title.trim() : existing[0].title,
            finalSlug,
            short_description !== undefined ? short_description : existing[0].short_description,
            description !== undefined ? description : existing[0].description,
            event_type || existing[0].event_type,
            effectiveMode,
            start_date ? new Date(start_date) : existing[0].start_date,
            end_date ? new Date(end_date) : existing[0].end_date,
            timezone || existing[0].timezone,
            venue_name !== undefined ? venue_name : existing[0].venue_name,
            venue_address !== undefined ? venue_address : existing[0].venue_address,
            venue_city !== undefined ? venue_city : existing[0].venue_city,
            venue_map_url !== undefined ? venue_map_url : existing[0].venue_map_url,
            cleanSourceUrl,
            effectiveRegType,
            cleanRegUrl,
            online_platform !== undefined ? online_platform : existing[0].online_platform,
            finalVirtualJoinUrl, // backward compatibility online_join_url
            finalVirtualJoinUrl, // new virtual_join_url
            banner_image !== undefined ? banner_image : existing[0].banner_image,
            speaker_name !== undefined ? speaker_name : existing[0].speaker_name,
            speaker_role !== undefined ? speaker_role : existing[0].speaker_role,
            speaker_company !== undefined ? speaker_company : existing[0].speaker_company,
            speaker_bio !== undefined ? speaker_bio : existing[0].speaker_bio,
            speaker_image !== undefined ? speaker_image : existing[0].speaker_image,
            ticket_type || existing[0].ticket_type,
            ticket_price !== undefined ? Number(ticket_price) : existing[0].ticket_price,
            max_capacity !== undefined ? parseInt(max_capacity, 10) : existing[0].max_capacity,
            status || existing[0].status,
            featured !== undefined ? (featured ? 1 : 0) : existing[0].featured,
            seo_meta_title !== undefined ? seo_meta_title : existing[0].seo_meta_title,
            seo_meta_description !== undefined ? seo_meta_description : existing[0].seo_meta_description,
            seo_keywords !== undefined ? seo_keywords : existing[0].seo_keywords,
            id
        ]);

        res.json({ success: true, message: 'Event updated successfully!', slug: finalSlug });
    } catch (err) {
        console.error('[updateEvent] Error:', err);
        res.status(500).json({ success: false, message: 'Failed to update event.' });
    }
};

/**
 * Admin: Delete Event
 */
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM events WHERE id = ?', [id]);
        res.json({ success: true, message: 'Event deleted successfully.' });
    } catch (err) {
        console.error('[deleteEvent] Error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete event.' });
    }
};

/**
 * Admin: Get Event Attendees / Registrations
 */
exports.getEventAttendees = async (req, res) => {
    try {
        const { id } = req.params;
        const { search, status, page = 1, limit = 50 } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
        const offset = (pageNum - 1) * limitNum;

        let query = `SELECT * FROM event_registrations WHERE event_id = ?`;
        const params = [id];

        if (status && status !== 'all') {
            query += ` AND status = ?`;
            params.push(status);
        }

        if (search && search.trim()) {
            query += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR company_name LIKE ? OR registration_code LIKE ?)`;
            const s = `%${search.trim()}%`;
            params.push(s, s, s, s, s);
        }

        // Count total
        const [countRows] = await pool.query(query, params);
        const total = countRows.length;

        query += ` ORDER BY registered_at DESC LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);

        const [attendees] = await pool.query(query, params);

        res.json({
            success: true,
            attendees,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum) || 1
            }
        });
    } catch (err) {
        console.error('[getEventAttendees] Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch attendees.' });
    }
};

/**
 * Admin: Update Attendee Status (e.g., mark Attended, Cancelled)
 */
exports.updateAttendeeStatus = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { status } = req.body;

        if (!['confirmed', 'attended', 'cancelled', 'waitlisted'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value.' });
        }

        await pool.query('UPDATE event_registrations SET status = ? WHERE id = ?', [status, registrationId]);
        res.json({ success: true, message: `Attendee status updated to ${status}.` });
    } catch (err) {
        console.error('[updateAttendeeStatus] Error:', err);
        res.status(500).json({ success: false, message: 'Failed to update attendee status.' });
    }
};

/**
 * Admin: Export Event Attendees to CSV
 */
exports.exportAttendeesCsv = async (req, res) => {
    try {
        const { id } = req.params;

        const [eventRows] = await pool.query('SELECT title, slug FROM events WHERE id = ? LIMIT 1', [id]);
        if (!eventRows || eventRows.length === 0) {
            return res.status(404).send('Event not found');
        }

        const event = eventRows[0];
        const [attendees] = await pool.query(
            'SELECT registration_code, first_name, last_name, email, phone, job_title, company_name, city_country, status, registered_at FROM event_registrations WHERE event_id = ? ORDER BY registered_at DESC',
            [id]
        );

        // Build CSV string
        const headers = ['Registration Code', 'First Name', 'Last Name', 'Email', 'Phone', 'Job Title', 'Company', 'City/Country', 'Status', 'Registered At'];
        const rows = attendees.map(a => [
            `"${(a.registration_code || '').replace(/"/g, '""')}"`,
            `"${(a.first_name || '').replace(/"/g, '""')}"`,
            `"${(a.last_name || '').replace(/"/g, '""')}"`,
            `"${(a.email || '').replace(/"/g, '""')}"`,
            `"${(a.phone || '').replace(/"/g, '""')}"`,
            `"${(a.job_title || '').replace(/"/g, '""')}"`,
            `"${(a.company_name || '').replace(/"/g, '""')}"`,
            `"${(a.city_country || '').replace(/"/g, '""')}"`,
            `"${(a.status || '').replace(/"/g, '""')}"`,
            `"${(a.registered_at ? new Date(a.registered_at).toISOString() : '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${event.slug || 'event'}-attendees.csv"`);
        res.send(csvContent);
    } catch (err) {
        console.error('[exportAttendeesCsv] Error:', err);
        res.status(500).send('Error exporting attendees CSV');
    }
};

/**
 * Admin: Delete Event
 */
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await pool.query('SELECT title, slug FROM events WHERE id = ? LIMIT 1', [id]);
        if (!existing || existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }

        const event = existing[0];

        // Delete from events table (cascade deletes registrations)
        await pool.query('DELETE FROM events WHERE id = ?', [id]);

        // Also clean up contents table if matching event exists there
        if (event.slug) {
            await pool.query('DELETE FROM contents WHERE slug = ? AND content_type_id = 5', [event.slug]).catch(() => {});
        }

        res.json({ success: true, message: 'Event deleted successfully.' });
    } catch (err) {
        console.error('[deleteEvent] Error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete event.' });
    }
};
