const path = require('path');
const pool = require(path.join(__dirname, '../backend/src/config/database')).pool;

async function checkAnalyticsData() {
  try {
    const [sessions] = await pool.query('SELECT COUNT(*) as cnt FROM visitor_sessions');
    const [pageViews] = await pool.query('SELECT COUNT(*) as cnt FROM page_views');
    const [ctaClicks] = await pool.query('SELECT COUNT(*) as cnt FROM cta_clicks');
    const [consents] = await pool.query('SELECT COUNT(*) as cnt FROM cookie_consents');
    
    console.log('--- DATABASE RECORD COUNTS ---');
    console.log('visitor_sessions:', sessions[0].cnt);
    console.log('page_views:', pageViews[0].cnt);
    console.log('cta_clicks:', ctaClicks[0].cnt);
    console.log('cookie_consents:', consents[0].cnt);

    const [recentSessions] = await pool.query('SELECT session_uuid, session_start, country, landing_page, total_pages_visited FROM visitor_sessions ORDER BY session_start DESC LIMIT 5');
    console.log('--- RECENT SESSIONS ---');
    console.log(JSON.stringify(recentSessions, null, 2));

  } catch (err) {
    console.error('DB Check Error:', err);
  } finally {
    process.exit(0);
  }
}

checkAnalyticsData();
