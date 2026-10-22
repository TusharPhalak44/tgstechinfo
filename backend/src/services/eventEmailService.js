const { sendEmail, escapeHtml, getWebsiteLogoUrl, buildLogoHtml, getPublicUrl } = require('../config/email');

/**
 * Generate iCalendar (RFC 5545 .ics) content for an event
 */
function generateIcsCalendar({ title, description, start_date, end_date, venue_name, venue_address, online_join_url, virtual_join_url, event_mode }) {
    const formatDateToIcs = (date) => {
        const d = new Date(date);
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startIcs = formatDateToIcs(start_date);
    const endIcs = end_date ? formatDateToIcs(end_date) : formatDateToIcs(new Date(new Date(start_date).getTime() + 2 * 60 * 60 * 1000));
    const nowIcs = formatDateToIcs(new Date());
    const uid = `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@tgstechinfo.com`;
    const effectiveJoin = virtual_join_url || online_join_url || null;
    const location = (event_mode === 'online' || event_mode === 'hybrid')
        ? (effectiveJoin || 'Online Virtual Meeting') 
        : `${venue_name || ''}, ${venue_address || ''}`.trim().replace(/^,\s*|,\s*$/g, '');

    const cleanSummary = (title || 'TGS Tech Info Event').replace(/\r?\n/g, ' ');
    const cleanDesc = (description || '').replace(/<[^>]*>/g, '').replace(/\r?\n/g, '\\n').slice(0, 500);

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TGS Tech Info//Event Registration//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${nowIcs}`,
        `DTSTART:${startIcs}`,
        `DTEND:${endIcs}`,
        `SUMMARY:${cleanSummary}`,
        `DESCRIPTION:${cleanDesc}`,
        `LOCATION:${location.replace(/\r?\n/g, ' ')}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'BEGIN:VALARM',
        'TRIGGER:-PT30M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Event Reminder',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
}

/**
 * Send Event Registration Confirmation Email
 */
async function sendEventConfirmationEmail({ attendee, event }) {
    const publicUrl = getPublicUrl();
    const eventUrl = `${publicUrl}/events/${event.slug}`;
    const safeFirstName = escapeHtml(attendee.first_name);
    const safeEventTitle = escapeHtml(event.title);
    const safeSpeaker = event.speaker_name ? escapeHtml(event.speaker_name) : null;
    const safeSpeakerRole = event.speaker_role ? escapeHtml(event.speaker_role) : '';
    const safeSpeakerCompany = event.speaker_company ? escapeHtml(event.speaker_company) : '';

    const startDateFormatted = new Date(event.start_date).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    const isOnline = event.event_mode === 'online' || event.event_mode === 'hybrid';
    const isOffline = event.event_mode === 'offline' || event.event_mode === 'hybrid';
    const virtualJoinUrl = event.virtual_join_url || event.online_join_url || null;

    // Fetch site logo
    const logoData = await getWebsiteLogoUrl();
    const logoHtml = buildLogoHtml(logoData);

    const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f1f5f9; }
            .container { max-width: 620px; margin: 24px auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
            .header-banner { background: linear-gradient(135deg, #0B1F4D 0%, #1e3a8a 100%); color: #ffffff; padding: 36px 30px; text-align: center; }
            .badge-confirmed { display: inline-block; background: #10b981; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 14px; border-radius: 20px; margin-bottom: 12px; }
            .content { padding: 32px 30px; }
            .ticket-card { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; margin: 24px 0; }
            .ticket-code { font-family: monospace; font-size: 20px; font-weight: bold; color: #0284c7; letter-spacing: 0.1em; background: #e0f2fe; padding: 6px 14px; border-radius: 8px; display: inline-block; margin-top: 6px; }
            .info-grid { display: table; width: 100%; margin: 18px 0; }
            .info-row { display: table-row; }
            .info-label { display: table-cell; padding: 6px 0; font-weight: 600; color: #64748b; font-size: 13px; width: 130px; }
            .info-value { display: table-cell; padding: 6px 0; color: #0f172a; font-weight: 600; font-size: 14px; }
            .join-btn { display: inline-block; background: linear-gradient(135deg, #F7941D 0%, #EA580C 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 15px 0 20px; box-shadow: 0 4px 14px rgba(247, 148, 29, 0.4); text-align: center; }
            .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 30px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
    </head>
    <body>
        <div class="container">
            ${logoHtml}
            <div class="header-banner">
                <span class="badge-confirmed">✓ Registration Confirmed</span>
                <h1 style="margin: 0; font-size: 22px; line-height: 1.3;">${safeEventTitle}</h1>
            </div>
            <div class="content">
                <p style="font-size: 16px; margin-top: 0;">Hi <strong>${safeFirstName}</strong>,</p>
                <p>Thank you for registering for our upcoming event! Your registration is officially confirmed. Please save the details below:</p>

                <div class="ticket-card">
                    <div style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700;">Your Registration Ticket Code</div>
                    <div class="ticket-code">${attendee.registration_code}</div>

                    <div class="info-grid">
                        <div class="info-row">
                            <div class="info-label">🗓️ Date & Time:</div>
                            <div class="info-value">${startDateFormatted}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">📍 Mode:</div>
                            <div class="info-value" style="text-transform: capitalize;">${event.event_mode} (${event.event_type})</div>
                        </div>
                        ${isOnline && event.online_platform ? `
                        <div class="info-row">
                            <div class="info-label">💻 Platform:</div>
                            <div class="info-value">${escapeHtml(event.online_platform)}</div>
                        </div>` : ''}
                        ${isOffline && event.venue_name ? `
                        <div class="info-row">
                            <div class="info-label">🏢 Venue:</div>
                            <div class="info-value">${escapeHtml(event.venue_name)}${event.venue_address ? `, ${escapeHtml(event.venue_address)}` : ''}</div>
                        </div>` : ''}
                        ${safeSpeaker ? `
                        <div class="info-row">
                            <div class="info-label">🎤 Keynote Speaker:</div>
                            <div class="info-value">${safeSpeaker} ${safeSpeakerRole ? `(${safeSpeakerRole}${safeSpeakerCompany ? `, ${safeSpeakerCompany}` : ''})` : ''}</div>
                        </div>` : ''}
                    </div>

                    ${isOnline && virtualJoinUrl ? `
                    <div style="text-align: center; margin-top: 15px;">
                        <a href="${virtualJoinUrl}" target="_blank" class="join-btn">🚀 Join Event</a>
                        <div style="font-size: 12px; color: #64748b;">Direct Link: <a href="${virtualJoinUrl}" style="color: #0284c7;">${virtualJoinUrl}</a></div>
                    </div>` : `
                    <div style="text-align: center; margin-top: 15px;">
                        <a href="${eventUrl}" target="_blank" class="join-btn">View Event Details & Agenda</a>
                    </div>`}
                </div>

                <div style="background: #eef2ff; border-left: 4px solid #6366f1; padding: 14px 16px; border-radius: 6px; font-size: 13px; color: #3730a3; margin-bottom: 20px;">
                    <strong>📎 Calendar Invite Attached:</strong> We have attached an official <code>.ics</code> calendar file to this email. Open it to add this event directly to your Google, Apple, or Outlook calendar with auto-reminders!
                </div>

                <p style="font-size: 14px; color: #475569;">
                    If you have any questions or need assistance prior to the event, please reply directly to this email or reach us at <a href="mailto:support@tgstechinfo.com" style="color: #0284c7;">support@tgstechinfo.com</a>.
                </p>

                <p style="font-size: 14px; color: #475569; margin-bottom: 0;">
                    Looking forward to hosting you!<br>
                    <strong>TGS Tech Info Events Team</strong>
                </p>
            </div>
            <div class="footer">
                <p style="margin: 0 0 6px;">© ${new Date().getFullYear()} TGS Tech Info. All rights reserved.</p>
                <p style="margin: 0;">You received this email because you registered for ${safeEventTitle} on tgstechinfo.com.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Generate .ics attachment
    const icsContent = generateIcsCalendar(event);

    return await sendEmail(
        attendee.email,
        `Confirmed: Registration for ${event.title} [${attendee.registration_code}]`,
        emailHtml,
        {
            attachments: [
                {
                    filename: `${event.slug || 'event'}-invite.ics`,
                    content: icsContent,
                    contentType: 'text/calendar; charset=utf-8; method=REQUEST'
                }
            ]
        }
    );
}

/**
 * Send Automated Event Reminder Email (24h or 1h before)
 */
async function sendEventReminderEmail({ attendee, event, timingLabel = 'Starting Soon' }) {
    const publicUrl = getPublicUrl();
    const eventUrl = `${publicUrl}/events/${event.slug}`;
    const safeFirstName = escapeHtml(attendee.first_name);
    const safeEventTitle = escapeHtml(event.title);
    const virtualJoinUrl = event.virtual_join_url || event.online_join_url || null;

    const startDateFormatted = new Date(event.start_date).toLocaleString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    const isOnline = event.event_mode === 'online' || event.event_mode === 'hybrid';
    const logoData = await getWebsiteLogoUrl();
    const logoHtml = buildLogoHtml(logoData);

    const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f1f5f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
            .header { background: #0B1F4D; color: #ffffff; padding: 28px 24px; text-align: center; }
            .content { padding: 28px 24px; }
            .reminder-banner { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 12px 16px; border-radius: 8px; font-weight: bold; margin-bottom: 20px; }
            .btn { display: inline-block; background: #F7941D; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; margin: 15px 0; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
    </head>
    <body>
        <div class="container">
            ${logoHtml}
            <div class="header">
                <h2 style="margin: 0; font-size: 20px;">⏰ Event Reminder: ${timingLabel}</h2>
            </div>
            <div class="content">
                <div class="reminder-banner">
                    🔔 Reminder: <strong>${safeEventTitle}</strong> is scheduled for ${startDateFormatted}.
                </div>

                <p>Hi <strong>${safeFirstName}</strong>,</p>
                <p>This is a quick reminder that your registered session is right around the corner! Get ready with your questions and notes.</p>

                <p><strong>Your Ticket Code:</strong> <code>${attendee.registration_code}</code></p>

                ${isOnline && virtualJoinUrl ? `
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${virtualJoinUrl}" target="_blank" class="btn">🚀 Join Event</a>
                    <div style="font-size: 12px; color: #64748b;">Link: ${virtualJoinUrl}</div>
                </div>` : `
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${eventUrl}" target="_blank" class="btn">View Event Details & Venue</a>
                </div>`}

                <p style="font-size: 13px; color: #64748b;">See you at the event!<br><strong>TGS Tech Info Team</strong></p>
            </div>
            <div class="footer">
                © ${new Date().getFullYear()} TGS Tech Info. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;

    return await sendEmail(
        attendee.email,
        `Reminder [${timingLabel}]: ${event.title}`,
        emailHtml
    );
}

module.exports = {
    generateIcsCalendar,
    sendEventConfirmationEmail,
    sendEventReminderEmail
};
