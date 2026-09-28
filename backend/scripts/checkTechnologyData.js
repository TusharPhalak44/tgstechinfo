const { pool } = require('../src/config/database');

async function checkTechnologyData() {
    try {
        console.log('Checking Technology Data Source...\n');

        // Check what technology data exists in visitor_sessions
        const [techData] = await pool.query(`
            SELECT 
                browser,
                operating_system,
                device_type,
                screen_resolution,
                COUNT(*) as session_count,
                COUNT(DISTINCT session_uuid) as unique_sessions,
                MIN(session_start) as first_session,
                MAX(session_start) as last_session
            FROM visitor_sessions
            WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
            GROUP BY browser, operating_system, device_type, screen_resolution
            ORDER BY session_count DESC
            LIMIT 20
        `);

        console.log('Technology Data from Visitor Sessions (Last 30 Days):');
        console.table(techData);

        // Check overall technology distribution
        const [browserDist] = await pool.query(`
            SELECT 
                browser,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM visitor_sessions WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)), 2) as percentage
            FROM visitor_sessions
            WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
            GROUP BY browser
            ORDER BY count DESC
        `);

        console.log('\nBrowser Distribution:');
        console.table(browserDist);

        const [osDist] = await pool.query(`
            SELECT 
                operating_system,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM visitor_sessions WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)), 2) as percentage
            FROM visitor_sessions
            WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
            GROUP BY operating_system
            ORDER BY count DESC
        `);

        console.log('\nOperating System Distribution:');
        console.table(osDist);

        const [deviceDist] = await pool.query(`
            SELECT 
                device_type,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM visitor_sessions WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)), 2) as percentage
            FROM visitor_sessions
            WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
            GROUP BY device_type
            ORDER BY count DESC
        `);

        console.log('\nDevice Type Distribution:');
        console.table(deviceDist);

        const [screenDist] = await pool.query(`
            SELECT 
                screen_resolution,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM visitor_sessions WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)), 2) as percentage
            FROM visitor_sessions
            WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
            AND screen_resolution IS NOT NULL
            GROUP BY screen_resolution
            ORDER BY count DESC
            LIMIT 10
        `);

        console.log('\nScreen Resolution Distribution:');
        console.table(screenDist);

        // Total sessions analysis
        const [totalSessions] = await pool.query(`
            SELECT 
                COUNT(*) as total_sessions,
                COUNT(DISTINCT browser) as unique_browsers,
                COUNT(DISTINCT operating_system) as unique_os,
                COUNT(DISTINCT device_type) as unique_devices,
                COUNT(DISTINCT screen_resolution) as unique_resolutions
            FROM visitor_sessions
            WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
        `);

        console.log('\n=== TECHNOLOGY DATA SUMMARY ===');
        console.table(totalSessions);

        console.log('\n🔍 ASSESSMENT:');
        const total = totalSessions[0].total_sessions;
        if (total > 100) {
            console.log('✅ This is REAL user technology data');
            console.log(`   - Based on ${total} real visitor sessions`);
            console.log(`   - ${totalSessions[0].unique_browsers} different browsers detected`);
            console.log(`   - ${totalSessions[0].unique_os} different operating systems`);
            console.log(`   - ${totalSessions[0].unique_devices} different device types`);
            console.log(`   - ${totalSessions[0].unique_resolutions} different screen resolutions`);
        } else if (total > 0) {
            console.log('⚠️ Limited real data - mostly real but small sample');
            console.log(`   - Based on only ${total} visitor sessions`);
        } else {
            console.log('❌ No real technology data available');
        }

    } catch (error) {
        console.error('Error checking technology data:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

checkTechnologyData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));