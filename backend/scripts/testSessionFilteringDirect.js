const { pool } = require('../src/config/database');

async function testSessionFilteringDirect() {
    try {
        console.log('Testing Session Analytics Time Filtering (Direct DB)...\n');

        // Test 1: All time (no filters)
        console.log('1. Testing ALL TIME (no filters)...');
        const [allTimeSessions] = await pool.query(`
            SELECT 
                session_uuid,
                session_start,
                browser,
                operating_system,
                device_type,
                screen_resolution
            FROM visitor_sessions
            ORDER BY session_start DESC
            LIMIT 5
        `);
        console.log('All Time Sessions:', allTimeSessions.length);
        if (allTimeSessions.length > 0) {
            console.log('Date range:', allTimeSessions[allTimeSessions.length - 1].session_start, 'to', allTimeSessions[0].session_start);
        }

        // Test 2: Last 7 days
        console.log('\n2. Testing LAST 7 DAYS...');
        const startDate7 = '2026-09-17';
        const endDate7 = '2026-09-24';
        const [last7DaysSessions] = await pool.query(`
            SELECT 
                session_uuid,
                session_start,
                browser,
                operating_system,
                device_type,
                screen_resolution
            FROM visitor_sessions
            WHERE session_start >= ? AND session_start <= ?
            ORDER BY session_start DESC
            LIMIT 5
        `, [`${startDate7} 00:00:00`, `${endDate7} 23:59:59`]);
        console.log('Last 7 Days Sessions:', last7DaysSessions.length);
        if (last7DaysSessions.length > 0) {
            console.log('Date range:', last7DaysSessions[last7DaysSessions.length - 1].session_start, 'to', last7DaysSessions[0].session_start);
        }

        // Test 3: Last 30 days
        console.log('\n3. Testing LAST 30 DAYS...');
        const startDate30 = '2026-08-25';
        const endDate30 = '2026-09-24';
        const [last30DaysSessions] = await pool.query(`
            SELECT 
                session_uuid,
                session_start,
                browser,
                operating_system,
                device_type,
                screen_resolution
            FROM visitor_sessions
            WHERE session_start >= ? AND session_start <= ?
            ORDER BY session_start DESC
            LIMIT 5
        `, [`${startDate30} 00:00:00`, `${endDate30} 23:59:59`]);
        console.log('Last 30 Days Sessions:', last30DaysSessions.length);
        if (last30DaysSessions.length > 0) {
            console.log('Date range:', last30DaysSessions[last30DaysSessions.length - 1].session_start, 'to', last30DaysSessions[0].session_start);
        }

        // Test 4: Last 90 days
        console.log('\n4. Testing LAST 90 DAYS...');
        const startDate90 = '2026-06-26';
        const endDate90 = '2026-09-24';
        const [last90DaysSessions] = await pool.query(`
            SELECT 
                session_uuid,
                session_start,
                browser,
                operating_system,
                device_type,
                screen_resolution
            FROM visitor_sessions
            WHERE session_start >= ? AND session_start <= ?
            ORDER BY session_start DESC
            LIMIT 5
        `, [`${startDate90} 00:00:00`, `${endDate90} 23:59:59`]);
        console.log('Last 90 Days Sessions:', last90DaysSessions.length);
        if (last90DaysSessions.length > 0) {
            console.log('Date range:', last90DaysSessions[last90DaysSessions.length - 1].session_start, 'to', last90DaysSessions[0].session_start);
        }

        // Technology distribution comparison
        console.log('\n=== TECHNOLOGY DISTRIBUTION COMPARISON ===');
        
        const [browserAll] = await pool.query(`
            SELECT browser, COUNT(*) as count FROM visitor_sessions GROUP BY browser ORDER BY count DESC
        `);
        
        const [browser7Days] = await pool.query(`
            SELECT browser, COUNT(*) as count FROM visitor_sessions 
            WHERE session_start >= ? AND session_start <= ? 
            GROUP BY browser ORDER BY count DESC
        `, [`${startDate7} 00:00:00`, `${endDate7} 23:59:59`]);

        console.log('\nBrowser Distribution - All Time:');
        console.table(browserAll);
        console.log('\nBrowser Distribution - Last 7 Days:');
        console.table(browser7Days);

        console.log('\n✅ Direct database filtering test completed!');

    } catch (error) {
        console.error('Error testing session filtering:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

testSessionFilteringDirect()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));