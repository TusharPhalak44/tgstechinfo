const { pool } = require('./src/config/database');

(async () => {
  try {
    const [rows] = await pool.query('SELECT id, title, webhook_url, LEFT(content, 1000) as content_preview FROM contents WHERE builder_layout LIKE "%html%" OR content LIKE "%api/users%" LIMIT 5');
    console.log(JSON.stringify(rows, null, 2));
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
