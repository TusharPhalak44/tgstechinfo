const pool = require('../backend/src/config/database').pool;
const VisitorSession = require('../backend/src/models/VisitorSession');

async function testIceland() {
  try {
    const sessionUuid = 'sess_test_iceland_' + Date.now();
    await pool.query(
      `INSERT INTO visitor_sessions 
       (session_uuid, country, device_type, browser, operating_system, landing_page, session_start, total_pages_visited, ip_address)
       VALUES (?, 'Iceland', 'desktop', 'Chrome', 'Windows', '/', NOW(), 3, '185.220.101.5')`,
      [sessionUuid]
    );

    console.log('Inserted test Iceland session:', sessionUuid);

    const analytics = await VisitorSession.getAnalytics();
    console.log('Analytics breakdown by country:');
    console.table(analytics.filter(a => a.country === 'Iceland' || a.country === 'India'));

    const [activeRows] = await pool.query(
      `SELECT country, COUNT(*) as active_visitors
       FROM visitor_sessions 
       WHERE session_start >= NOW() - INTERVAL 15 MINUTE
       GROUP BY country`
    );
    console.log('Active live visitors breakdown (last 15m):');
    console.table(activeRows);

    process.exit(0);
  } catch (err) {
    console.error('Error testing Iceland session:', err);
    process.exit(1);
  }
}

testIceland();
