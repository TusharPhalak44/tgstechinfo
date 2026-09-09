const path = require('path');
const pool = require(path.join(__dirname, '../backend/src/config/database')).pool;

async function testDateFilter() {
  try {
    const s = '2026-08-27';
    const e = '2026-09-03 23:59:59';
    
    const [pvCreated] = await pool.query('SELECT COUNT(*) as cnt FROM page_views WHERE created_at >= ? AND created_at <= ?', [s, e]);
    console.log('page_views with date filter (created_at):', pvCreated[0].cnt);

    const [sessDate] = await pool.query('SELECT COUNT(*) as cnt FROM visitor_sessions WHERE session_start >= ? AND session_start <= ?', [s, e]);
    console.log('visitor_sessions with date filter (session_start):', sessDate[0].cnt);

    const [sessAll] = await pool.query('SELECT COUNT(*) as cnt FROM visitor_sessions');
    console.log('visitor_sessions total:', sessAll[0].cnt);

    const [pvAll] = await pool.query('SELECT COUNT(*) as cnt FROM page_views');
    console.log('page_views total:', pvAll[0].cnt);

  } catch (err) {
    console.error('Date Filter Test Error:', err);
  } finally {
    process.exit(0);
  }
}

testDateFilter();
