const path = require('path');
const mysql = require(path.join(__dirname, '../backend/node_modules/mysql2/promise'));

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'publishing_platform'
    });
    const [cols] = await conn.query("SHOW COLUMNS FROM contents LIKE '%view%'");
    console.log('View columns in contents:', JSON.stringify(cols, null, 2));
    
    const [triggers] = await conn.query("SHOW TRIGGERS WHERE `Table` = 'contents'");
    console.log('Triggers on contents:', JSON.stringify(triggers.map(t => ({ Trigger: t.Trigger, Event: t.Event, Timing: t.Timing, Statement: t.Statement })), null, 2));
    
    const [counts] = await conn.query("SELECT COUNT(*) as total, SUM(view_count) as total_view_count, SUM(views_count) as total_views_count FROM contents");
    console.log('Sum comparison:', JSON.stringify(counts, null, 2));
    
    const [diff] = await conn.query("SELECT id, title, view_count, views_count FROM contents WHERE view_count != views_count OR (view_count IS NULL AND views_count IS NOT NULL) OR (views_count IS NULL AND view_count IS NOT NULL) LIMIT 10");
    console.log('Diff count sample (mismatches):', JSON.stringify(diff, null, 2));
    
    await conn.end();
  } catch(e) {
    console.error('Error:', e);
  }
})();
