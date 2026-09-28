const { pool } = require('../src/config/database');

async function checkCurrentData() {
    try {
        console.log('Checking current data in database...\n');

        // Check CTA clicks
        const [ctaData] = await pool.query(`
            SELECT 
                cta_type,
                COUNT(*) as click_count,
                COUNT(DISTINCT session_uuid) as unique_sessions,
                MIN(clicked_at) as first_click,
                MAX(clicked_at) as last_click,
                COUNT(DISTINCT cta_text) as unique_texts
            FROM cta_clicks
            GROUP BY cta_type
            ORDER BY click_count DESC
        `);

        console.log('CTA Clicks Data:');
        console.table(ctaData);

        // Check user journey data
        const [journeyData] = await pool.query(`
            SELECT 
                action_type,
                COUNT(*) as count,
                COUNT(DISTINCT session_uuid) as unique_sessions,
                MIN(timestamp) as first_action,
                MAX(timestamp) as last_action
            FROM user_journey
            GROUP BY action_type
            ORDER BY count DESC
        `);

        console.log('\nUser Journey Data:');
        console.table(journeyData);

        // Check visitor sessions
        const [sessionData] = await pool.query(`
            SELECT 
                COUNT(*) as total_sessions,
                COUNT(DISTINCT country) as unique_countries,
                COUNT(DISTINCT device_type) as unique_device_types,
                MIN(session_start) as earliest_session,
                MAX(session_start) as latest_session
            FROM visitor_sessions
        `);

        console.log('\nVisitor Sessions Summary:');
        console.table(sessionData);

        // Check recent activity
        const [recentCTA] = await pool.query(`
            SELECT 
                cta_type,
                cta_text,
                clicked_at
            FROM cta_clicks
            ORDER BY clicked_at DESC
            LIMIT 5
        `);

        console.log('\nRecent CTA Activity (last 5):');
        console.table(recentCTA);

        // Determine if data looks like real or dummy
        const totalCTAClicks = ctaData.reduce((sum, item) => sum + item.click_count, 0);
        const totalJourneyActions = journeyData.reduce((sum, item) => sum + item.count, 0);
        
        console.log('\n=== DATA ANALYSIS ===');
        console.log(`Total CTA Clicks: ${totalCTAClicks}`);
        console.log(`Total Journey Actions: ${totalJourneyActions}`);
        console.log(`Total Sessions: ${sessionData[0].total_sessions}`);
        
        if (totalCTAClicks <= 35 && totalJourneyActions <= 4000) {
            console.log('\n🔍 ASSESSMENT: This appears to be SAMPLE/DUMMY data');
            console.log('   - Limited number of CTA clicks (inserted for testing)');
            console.log('   - Pattern suggests artificially generated data');
            console.log('   - Created on:', new Date().toISOString());
        } else {
            console.log('\n🔍 ASSESSMENT: This appears to be REAL user data');
            console.log('   - Substantial number of user interactions');
            console.log('   - Natural distribution across time periods');
        }

    } catch (error) {
        console.error('Error checking data:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

checkCurrentData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));