const path = require('path');
const pool = require(path.join(__dirname, '../backend/src/config/database')).pool;
const VisitorSession = require(path.join(__dirname, '../backend/src/models/VisitorSession'));

async function testEndpoints() {
  try {
    console.log('=== TEST VisitorSession.getAnalytics() ===');
    const analytics = await VisitorSession.getAnalytics({});
    console.log('getAnalytics count:', analytics.length);
    console.log('sample analytics row:', analytics[0]);

    const [recentSessions] = await pool.query(
      `SELECT session_uuid, session_start, country, device_type, browser, landing_page, total_pages_visited FROM visitor_sessions ORDER BY session_start DESC LIMIT 10`
    );
    console.log('recentSessions count:', recentSessions.length);

    console.log('=== TEST OVERVIEW QUERY ===');
    const [pageViewsRes] = await pool.query('SELECT COUNT(*) as totalPageViews FROM page_views');
    console.log('totalPageViews from page_views:', pageViewsRes[0].totalPageViews);

    const [countryDist] = await pool.query(`
      SELECT country, COUNT(*) as session_count, SUM(total_pages_visited) as page_views
      FROM visitor_sessions
      GROUP BY country
      ORDER BY session_count DESC
    `);
    console.log('countryDist from DB:', countryDist);

  } catch (err) {
    console.error('Endpoint Test Error:', err);
  } finally {
    process.exit(0);
  }
}

testEndpoints();
