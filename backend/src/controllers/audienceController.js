/**
 * B2B Audience Intelligence Public & Sales Analytics Controller
 * Handles aggregated demographic queries, high-speed multi-dimensional filtering,
 * share token generation, and sales presentation event tracking.
 */

const { pool } = require('../config/database');
const crypto = require('crypto');

// In-memory cache for static taxonomies and metadata (5 min TTL)
let metadataCache = null;
let metadataCacheExpiry = 0;

/**
 * Get all taxonomies, geography hierarchies, and global commercial settings
 */
exports.getMetadata = async (req, res, next) => {
    try {
        const now = Date.now();
        if (metadataCache && now < metadataCacheExpiry) {
            return res.json({ success: true, data: metadataCache });
        }

        // Fetch all active taxonomies in parallel
        const [
            [regions],
            [countries],
            [regionCountries],
            [industries],
            [employeeSizes],
            [departments],
            [jobLevels],
            [settingsRows]
        ] = await Promise.all([
            pool.query('SELECT id, name, code, region_type, parent_id, lat, lon, default_zoom, display_order FROM audience_geo_regions WHERE is_active = TRUE ORDER BY display_order ASC'),
            pool.query('SELECT id, name, iso_code, iso3_code, lat, lon, display_order FROM audience_countries WHERE is_active = TRUE ORDER BY display_order ASC, name ASC'),
            pool.query('SELECT region_id, country_id FROM audience_geo_region_countries'),
            pool.query('SELECT id, name, code, parent_id, display_order FROM audience_industries WHERE is_active = TRUE ORDER BY display_order ASC'),
            pool.query('SELECT id, name, code, min_employees, max_employees, display_order FROM audience_employee_sizes WHERE is_active = TRUE ORDER BY display_order ASC'),
            pool.query('SELECT id, name, code, display_order FROM audience_departments WHERE is_active = TRUE ORDER BY display_order ASC'),
            pool.query('SELECT id, name, code, rank_order, display_order FROM audience_job_levels WHERE is_active = TRUE ORDER BY display_order ASC'),
            pool.query('SELECT setting_key, setting_value, description FROM audience_global_settings')
        ]);

        // Build global settings map
        const settings = {};
        for (const row of settingsRows) {
            settings[row.setting_key] = row.setting_value;
        }

        // Map countries into regions
        const regionCountryMap = {};
        for (const rc of regionCountries) {
            if (!regionCountryMap[rc.region_id]) regionCountryMap[rc.region_id] = [];
            regionCountryMap[rc.region_id].push(rc.country_id);
        }

        const enrichedRegions = regions.map(r => ({
            ...r,
            country_ids: regionCountryMap[r.id] || []
        }));

        const metadata = {
            regions: enrichedRegions,
            countries,
            industries,
            employee_sizes: employeeSizes,
            departments,
            job_levels: jobLevels,
            settings
        };

        metadataCache = metadata;
        metadataCacheExpiry = now + 5 * 60 * 1000; // 5 mins

        res.json({
            success: true,
            data: metadata
        });
    } catch (err) {
        next(err);
    }
};

/**
 * High-performance Dynamic Audience Filtering & Breakdown Calculation
 * Logical AND across dimensions, logical OR within multi-selects.
 */
exports.calculateAudienceStats = async (req, res, next) => {
    try {
        const filters = req.method === 'POST' ? req.body : req.query;

        // Parse and normalize filter inputs (support arrays or comma-delimited strings)
        const normalizeArray = (val) => {
            if (!val) return [];
            if (Array.isArray(val)) return val.filter(Boolean);
            return String(val).split(',').map(s => s.trim()).filter(Boolean);
        };

        const regionCodes = normalizeArray(filters.region || filters.regions || filters.region_code);
        const countryIsos = normalizeArray(filters.country || filters.countries || filters.iso_code);
        const industryCodes = normalizeArray(filters.industry || filters.industries || filters.industry_code);
        const employeeSizeCodes = normalizeArray(filters.employee_size || filters.employee_sizes || filters.size_code);
        const departmentCodes = normalizeArray(filters.department || filters.departments || filters.department_code);
        const jobLevelCodes = normalizeArray(filters.job_level || filters.job_levels || filters.level_code);

        // Build WHERE clauses dynamically
        const whereClauses = ["s.status = 'Published'"];
        const params = [];

        // 1. Regional Filter (If region specified but no specific countries, filter by region's mapped countries)
        let resolvedCountryIds = [];
        if (countryIsos.length > 0) {
            const placeholders = countryIsos.map(() => '?').join(',');
            whereClauses.push(`c.iso_code IN (${placeholders})`);
            params.push(...countryIsos);
        } else if (regionCodes.length > 0 && !regionCodes.includes('GLOBAL')) {
            const placeholders = regionCodes.map(() => '?').join(',');
            whereClauses.push(`r.code IN (${placeholders})`);
            params.push(...regionCodes);
        }

        // 2. Industry Filter
        if (industryCodes.length > 0) {
            const placeholders = industryCodes.map(() => '?').join(',');
            whereClauses.push(`ind.code IN (${placeholders})`);
            params.push(...industryCodes);
        }

        // 3. Employee Size Filter
        if (employeeSizeCodes.length > 0) {
            const placeholders = employeeSizeCodes.map(() => '?').join(',');
            whereClauses.push(`sz.code IN (${placeholders})`);
            params.push(...employeeSizeCodes);
        }

        // 4. Department Filter
        if (departmentCodes.length > 0) {
            const placeholders = departmentCodes.map(() => '?').join(',');
            whereClauses.push(`dept.code IN (${placeholders})`);
            params.push(...departmentCodes);
        }

        // 5. Job Level Filter
        if (jobLevelCodes.length > 0) {
            const placeholders = jobLevelCodes.map(() => '?').join(',');
            whereClauses.push(`lvl.code IN (${placeholders})`);
            params.push(...jobLevelCodes);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Base JOIN structure
        const joinSql = `
            FROM audience_statistics s
            JOIN audience_geo_regions r ON s.region_id = r.id
            JOIN audience_countries c ON s.country_id = c.id
            JOIN audience_industries ind ON s.industry_id = ind.id
            JOIN audience_employee_sizes sz ON s.employee_size_id = sz.id
            JOIN audience_departments dept ON s.department_id = dept.id
            JOIN audience_job_levels lvl ON s.job_level_id = lvl.id
        `;

        // 1. Calculate Totals
        const totalQuery = `
            SELECT 
                COALESCE(SUM(s.contact_count), 0) AS matching_contacts,
                COALESCE(SUM(s.company_count), 0) AS matching_companies,
                COUNT(DISTINCT s.country_id) AS matching_countries_count,
                COUNT(DISTINCT s.industry_id) AS matching_industries_count
            ${joinSql}
            ${whereSql}
        `;

        // 2. Country Breakdown
        const countryBreakdownQuery = `
            SELECT 
                c.id AS country_id,
                c.name AS country_name,
                c.iso_code,
                c.iso3_code,
                c.lat,
                c.lon,
                SUM(s.contact_count) AS contact_count,
                SUM(s.company_count) AS company_count
            ${joinSql}
            ${whereSql}
            GROUP BY c.id, c.name, c.iso_code, c.iso3_code, c.lat, c.lon
            ORDER BY contact_count DESC
        `;

        // 3. Industry Breakdown
        const industryBreakdownQuery = `
            SELECT 
                ind.id AS industry_id,
                ind.name AS industry_name,
                ind.code AS industry_code,
                SUM(s.contact_count) AS contact_count,
                SUM(s.company_count) AS company_count
            ${joinSql}
            ${whereSql}
            GROUP BY ind.id, ind.name, ind.code
            ORDER BY contact_count DESC
        `;

        // 4. Employee Size Breakdown
        const employeeSizeBreakdownQuery = `
            SELECT 
                sz.id AS size_id,
                sz.name AS size_name,
                sz.code AS size_code,
                sz.display_order,
                SUM(s.contact_count) AS contact_count,
                SUM(s.company_count) AS company_count
            ${joinSql}
            ${whereSql}
            GROUP BY sz.id, sz.name, sz.code, sz.display_order
            ORDER BY sz.display_order ASC
        `;

        // 5. Department Breakdown
        const departmentBreakdownQuery = `
            SELECT 
                dept.id AS department_id,
                dept.name AS department_name,
                dept.code AS department_code,
                SUM(s.contact_count) AS contact_count,
                SUM(s.company_count) AS company_count
            ${joinSql}
            ${whereSql}
            GROUP BY dept.id, dept.name, dept.code
            ORDER BY contact_count DESC
        `;

        // 6. Job Level Breakdown
        const jobLevelBreakdownQuery = `
            SELECT 
                lvl.id AS job_level_id,
                lvl.name AS job_level_name,
                lvl.code AS job_level_code,
                lvl.rank_order,
                SUM(s.contact_count) AS contact_count,
                SUM(s.company_count) AS company_count
            ${joinSql}
            ${whereSql}
            GROUP BY lvl.id, lvl.name, lvl.code, lvl.rank_order
            ORDER BY lvl.rank_order ASC
        `;

        // Execute all aggregations in parallel for maximum query speed
        const [
            [totalRows],
            [countryRows],
            [industryRows],
            [sizeRows],
            [deptRows],
            [levelRows]
        ] = await Promise.all([
            pool.query(totalQuery, params),
            pool.query(countryBreakdownQuery, params),
            pool.query(industryBreakdownQuery, params),
            pool.query(employeeSizeBreakdownQuery, params),
            pool.query(departmentBreakdownQuery, params),
            pool.query(jobLevelBreakdownQuery, params)
        ]);

        const matchingContacts = parseInt(totalRows[0]?.matching_contacts || 0, 10);
        const matchingCompanies = parseInt(totalRows[0]?.matching_companies || 0, 10);

        // Calculate percentage distribution for each dimension
        const calculatePct = (items) => {
            return items.map(item => ({
                ...item,
                contact_count: parseInt(item.contact_count || 0, 10),
                company_count: parseInt(item.company_count || 0, 10),
                percentage: matchingContacts > 0 
                    ? Number(((parseInt(item.contact_count || 0, 10) / matchingContacts) * 100).toFixed(1))
                    : 0
            }));
        };

        // Privacy threshold check
        const [[thresholdRow]] = await pool.query("SELECT setting_value FROM audience_global_settings WHERE setting_key = 'privacy_threshold'");
        const privacyThreshold = parseInt(thresholdRow?.setting_value || '25', 10);
        const isLimitedAudience = matchingContacts > 0 && matchingContacts < privacyThreshold;

        res.json({
            success: true,
            filters: {
                regions: regionCodes,
                countries: countryIsos,
                industries: industryCodes,
                employee_sizes: employeeSizeCodes,
                departments: departmentCodes,
                job_levels: jobLevelCodes
            },
            data: {
                matching_contacts: matchingContacts,
                matching_companies: matchingCompanies,
                matching_countries_count: parseInt(totalRows[0]?.matching_countries_count || 0, 10),
                matching_industries_count: parseInt(totalRows[0]?.matching_industries_count || 0, 10),
                is_limited_audience: isLimitedAudience,
                privacy_threshold: privacyThreshold,
                country_breakdown: calculatePct(countryRows),
                industry_breakdown: calculatePct(industryRows),
                employee_size_breakdown: calculatePct(sizeRows),
                department_breakdown: calculatePct(deptRows),
                job_level_breakdown: calculatePct(levelRows),
                updated_at: new Date().toISOString()
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Generate a secure read-only token for client presentation sharing
 */
exports.createShareToken = async (req, res, next) => {
    try {
        const { filters, title, client_name, total_contacts, total_companies } = req.body;
        const token = crypto.randomBytes(24).toString('hex');
        
        // 30 days expiration by default
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await pool.query(`
            INSERT INTO audience_share_tokens 
            (token, title, client_name, filters_json, total_matching_contacts, total_matching_companies, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            token,
            title || 'Target B2B Audience Intelligence',
            client_name || 'Valued Client',
            JSON.stringify(filters || {}),
            total_contacts || 0,
            total_companies || 0,
            expiresAt
        ]);

        res.json({
            success: true,
            data: {
                token,
                share_url: `/audience/view/${token}`,
                expires_at: expiresAt
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get shared audience definition and live calculated breakdowns by token
 */
exports.getSharedAudience = async (req, res, next) => {
    try {
        const { token } = req.params;
        const [rows] = await pool.query(`
            SELECT id, token, title, client_name, filters_json, total_matching_contacts, total_matching_companies, expires_at, created_at
            FROM audience_share_tokens
            WHERE token = ? AND (expires_at IS NULL OR expires_at > NOW())
        `, [token]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Audience link is invalid or has expired.'
            });
        }

        const record = rows[0];
        const filters = typeof record.filters_json === 'string' ? JSON.parse(record.filters_json) : record.filters_json;

        res.json({
            success: true,
            data: {
                token: record.token,
                title: record.title,
                client_name: record.client_name,
                filters,
                created_at: record.created_at
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Track Sales Demonstration Analytics Event
 */
exports.trackEvent = async (req, res, next) => {
    try {
        const { event_type, filters_applied, result_count, session_id } = req.body;
        if (!event_type) return res.status(400).json({ error: 'event_type is required' });

        await pool.query(`
            INSERT INTO audience_analytics_events (event_type, filters_applied, result_count, session_id)
            VALUES (?, ?, ?, ?)
        `, [
            event_type,
            JSON.stringify(filters_applied || {}),
            result_count || 0,
            session_id || null
        ]);

        res.json({ success: true });
    } catch (err) {
        // Silently handle analytics tracking failures to not block UI
        console.warn('Analytics event tracking error:', err.message);
        res.json({ success: false });
    }
};

// Invalidation helper for admin changes
exports.invalidateMetadataCache = () => {
    metadataCache = null;
    metadataCacheExpiry = 0;
};
