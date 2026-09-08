const { pool } = require('./src/config/database');

async function testDatabase() {
    console.log('Testing Database Operations...\n');

    try {
        // Test 1: Check if visitor_sessions table exists and has records
        console.log('1. Checking visitor_sessions table...');
        const [sessions] = await pool.query('SELECT COUNT(*) as count FROM visitor_sessions');
        console.log('✅ Visitor sessions count:', sessions[0].count);

        // Test 2: Try to insert a simple session
        console.log('\n2. Testing session insertion...');
        const { v4: uuidv4 } = require('uuid');
        const session_uuid = uuidv4();
        
        const insertQuery = `
            INSERT INTO visitor_sessions (
                session_uuid, consent_uuid, user_id, country, browser, operating_system,
                device_type, screen_resolution, language, timezone, ip_address, referrer, landing_page
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            session_uuid, null, null, 'India', 'Chrome', 'Windows',
            'desktop', '1920x1080', 'en-US', 'Asia/Kolkata', '127.0.0.1', null, 'http://test.com'
        ];
        
        await pool.query(insertQuery, values);
        console.log('✅ Session inserted successfully:', session_uuid);

        // Test 3: Check if the session was created
        console.log('\n3. Verifying session creation...');
        const [newSessions] = await pool.query('SELECT * FROM visitor_sessions WHERE session_uuid = ?', [session_uuid]);
        console.log('✅ Session found:', newSessions[0]);

        // Test 4: Check page_views table
        console.log('\n4. Checking page_views table...');
        const [pageViews] = await pool.query('SELECT COUNT(*) as count FROM page_views');
        console.log('✅ Page views count:', pageViews[0].count);

        console.log('\n✅ All Database Tests Passed!');

    } catch (error) {
        console.error('❌ Database Test Failed:', error.message);
        console.error('Error details:', error);
        process.exit(1);
    }
}

testDatabase();