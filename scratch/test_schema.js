const path = require('path');
const pool = require(path.join(__dirname, '../backend/src/config/database')).pool;

async function checkSchemas() {
  try {
    const tables = ['page_views', 'downloads', 'cta_clicks', 'visitor_sessions', 'conversions', 'content_engagement'];
    for (const t of tables) {
      try {
        const [cols] = await pool.query(`SHOW COLUMNS FROM ${t}`);
        console.log(`=== TABLE ${t} ===`);
        console.log(cols.map(c => c.Field).join(', '));
      } catch (err) {
        console.error(`Table ${t} error:`, err.message);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkSchemas();
