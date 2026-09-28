const { pool } = require('../src/config/database');

async function insertSampleCTAData() {
    try {
        console.log('Starting sample CTA data insertion...');

        // Check existing data
        const [sessions] = await pool.query('SELECT COUNT(*) as count FROM visitor_sessions');
        const [consents] = await pool.query('SELECT COUNT(*) as count FROM cookie_consents');
        const [ctaData] = await pool.query('SELECT COUNT(*) as count FROM cta_clicks');

        console.log(`Existing data - Sessions: ${sessions[0].count}, Consents: ${consents[0].count}, CTA clicks: ${ctaData[0].count}`);

        // Create minimal test data if needed
        if (consents[0].count === 0) {
            console.log('Creating sample cookie consents...');
            for (let i = 0; i < 5; i++) {
                await pool.query(
                    'INSERT INTO cookie_consents (uuid, analytics_cookies, marketing_cookies, functional_cookies, created_at) VALUES (?, TRUE, TRUE, TRUE, NOW() - INTERVAL ? DAY)',
                    [require('crypto').randomUUID(), Math.floor(Math.random() * 30)]
                );
            }
        }

        if (sessions[0].count === 0) {
            console.log('Creating sample visitor sessions...');
            const [consentRows] = await pool.query('SELECT uuid FROM cookie_consents');
            const countries = ['USA', 'India', 'UK', 'Germany', 'Other'];
            const deviceTypes = ['desktop', 'mobile', 'tablet'];
            const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
            const operatingSystems = ['Windows', 'macOS', 'Linux', 'Android'];

            for (let i = 0; i < 10; i++) {
                const consent = consentRows[Math.floor(Math.random() * consentRows.length)];
                await pool.query(
                    `INSERT INTO visitor_sessions (session_uuid, consent_uuid, session_start, landing_page, country, device_type, browser, operating_system) 
                     VALUES (?, ?, NOW() - INTERVAL ? DAY, '/', ?, ?, ?, ?)`,
                    [
                        require('crypto').randomUUID(),
                        consent.uuid,
                        Math.floor(Math.random() * 30),
                        countries[Math.floor(Math.random() * countries.length)],
                        deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
                        browsers[Math.floor(Math.random() * browsers.length)],
                        operatingSystems[Math.floor(Math.random() * operatingSystems.length)]
                    ]
                );
            }
        }

        // Get sessions for CTA data
        const [sessionRows] = await pool.query(
            'SELECT session_uuid, consent_uuid, session_start FROM visitor_sessions WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)'
        );

        if (sessionRows.length === 0) {
            console.log('No sessions found in the last 30 days. Creating more recent sessions...');
            // Create recent sessions
            const [consentRows] = await pool.query('SELECT uuid FROM cookie_consents LIMIT 5');
            for (let i = 0; i < 15; i++) {
                const consent = consentRows[Math.floor(Math.random() * consentRows.length)];
                await pool.query(
                    `INSERT INTO visitor_sessions (session_uuid, consent_uuid, session_start, landing_page, country, device_type, browser, operating_system) 
                     VALUES (?, ?, NOW() - INTERVAL ? DAY, '/', 'USA', 'desktop', 'Chrome', 'Windows')`,
                    [require('crypto').randomUUID(), consent.uuid, Math.floor(Math.random() * 30)]
                );
            }
            
            // Refresh session rows
            const [newSessionRows] = await pool.query(
                'SELECT session_uuid, consent_uuid, session_start FROM visitor_sessions WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)'
            );
            sessionRows.push(...newSessionRows);
        }

        console.log(`Found ${sessionRows.length} sessions for CTA data insertion`);

        // CTA types and texts
        const ctaTypes = ['download_whitepaper', 'request_demo', 'contact_sales', 'subscribe', 'register_webinar', 'request_quote', 'other'];
        const ctaTexts = ['Download Now', 'Get Started', 'Contact Us', 'Subscribe', 'Learn More', 'Download Whitepaper', 'Request Demo', 'Contact Sales', 'Subscribe Now', 'Get Quote'];
        const ctaLocations = ['hero_section', 'sidebar', 'footer', 'inline'];

        // Insert first round of CTA clicks
        console.log('Inserting first round of CTA clicks...');
        for (const session of sessionRows.slice(0, 20)) {
            const randomOffset = Math.floor(Math.random() * 300); // 0-300 seconds after session start
            const clickedAt = new Date(new Date(session.session_start).getTime() + randomOffset * 1000);
            
            await pool.query(
                `INSERT INTO cta_clicks (session_uuid, consent_uuid, cta_type, cta_text, cta_location, clicked_at) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    session.session_uuid,
                    session.consent_uuid,
                    ctaTypes[Math.floor(Math.random() * ctaTypes.length)],
                    ctaTexts[Math.floor(Math.random() * ctaTexts.length)],
                    ctaLocations[Math.floor(Math.random() * ctaLocations.length)],
                    clickedAt
                ]
            );
        }

        // Insert second round for variety (50% of sessions)
        console.log('Inserting second round of CTA clicks...');
        for (const session of sessionRows.slice(0, 15)) {
            if (Math.random() > 0.5) {
                const randomOffset = Math.floor(Math.random() * 600); // 0-600 seconds after session start
                const clickedAt = new Date(new Date(session.session_start).getTime() + randomOffset * 1000);
                
                await pool.query(
                    `INSERT INTO cta_clicks (session_uuid, consent_uuid, cta_type, cta_text, cta_location, clicked_at) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        session.session_uuid,
                        session.consent_uuid,
                        ctaTypes[Math.floor(Math.random() * ctaTypes.length)],
                        ctaTexts[Math.floor(Math.random() * ctaTexts.length)],
                        ctaLocations[Math.floor(Math.random() * ctaLocations.length)],
                        clickedAt
                    ]
                );
            }
        }

        // Verify the inserted data
        const [results] = await pool.query(
            `SELECT 
                cta_type,
                COUNT(*) as click_count,
                COUNT(DISTINCT session_uuid) as unique_sessions,
                MIN(clicked_at) as first_click,
                MAX(clicked_at) as last_click
            FROM cta_clicks
            WHERE clicked_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
            GROUP BY cta_type
            ORDER BY click_count DESC`
        );

        console.log('\nCTA Data Summary:');
        console.table(results);

        console.log('Sample CTA data insertion completed successfully!');
    } catch (error) {
        console.error('Error inserting sample CTA data:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the function
insertSampleCTAData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));