const { pool } = require('../src/config/database');

async function insertSampleJourneyData() {
    try {
        console.log('Starting sample user journey data insertion...');

        // Get sessions for journey data that don't already have journey data and have consent_uuid
        const [sessionRows] = await pool.query(
            `SELECT vs.session_uuid, vs.consent_uuid, vs.session_start 
             FROM visitor_sessions vs
             WHERE vs.session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
             AND vs.session_uuid NOT IN (SELECT DISTINCT session_uuid FROM user_journey)
             AND vs.consent_uuid IS NOT NULL
             LIMIT 50`
        );

        console.log(`Found ${sessionRows.length} sessions without journey data for insertion`);

        // Action types for user journey
        const actionTypes = ['page_view', 'content_view', 'download', 'search', 'cta_click', 'form_submit', 'other'];
        const pageUrls = ['/', '/about', '/contact', '/articles', '/blog', '/category/technology', '/category/industries'];
        const pageTitles = ['Home', 'About Us', 'Contact', 'Articles', 'Blog', 'Technology', 'Industries'];
        const contentTypes = ['article', 'blog', 'news', 'interview', 'ebook', 'whitepaper', null];

        // Insert journey steps for each session
        for (const session of sessionRows) {
            const stepsCount = Math.floor(Math.random() * 5) + 2; // 2-6 steps per journey
            
            for (let step = 1; step <= stepsCount; step++) {
                const randomOffset = step * Math.floor(Math.random() * 120) + 30; // 30-150 seconds between steps
                const timestamp = new Date(new Date(session.session_start).getTime() + randomOffset * 1000);
                
                const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
                const pageUrl = pageUrls[Math.floor(Math.random() * pageUrls.length)];
                const pageTitle = pageTitles[pageUrls.indexOf(pageUrl)];
                const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
                
                // Skip if consent_uuid is null
                if (!session.consent_uuid) {
                    console.log(`Skipping session ${session.session_uuid} - no consent_uuid`);
                    continue;
                }
                
                await pool.query(
                    `INSERT INTO user_journey (session_uuid, consent_uuid, step_number, page_url, page_title, content_type, content_id, action_type, action_data, timestamp) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        session.session_uuid,
                        session.consent_uuid,
                        step,
                        pageUrl,
                        pageTitle,
                        contentType,
                        Math.floor(Math.random() * 100) + 1, // random content_id
                        actionType,
                        JSON.stringify({ source: 'navigation' }),
                        timestamp
                    ]
                );
            }
        }

        // Verify the inserted data
        const [results] = await pool.query(
            `SELECT 
                action_type,
                COUNT(*) as count,
                COUNT(DISTINCT session_uuid) as unique_sessions,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
            FROM user_journey
            WHERE timestamp >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
            GROUP BY action_type
            ORDER BY count DESC`
        );

        console.log('\nUser Journey Data Summary:');
        console.table(results);

        console.log('Sample user journey data insertion completed successfully!');
    } catch (error) {
        console.error('Error inserting sample journey data:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the function
insertSampleJourneyData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));