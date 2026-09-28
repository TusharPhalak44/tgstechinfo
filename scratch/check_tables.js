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
    
    // Check view_count_backup
    try {
      const [backupRows] = await conn.query("SELECT COUNT(*) as count FROM view_count_backup");
      console.log('view_count_backup count:', backupRows[0].count);
    } catch(e) {
      console.log('view_count_backup error:', e.message);
    }

    // Check comments
    try {
      const [commentRows] = await conn.query("SELECT COUNT(*) as count FROM comments");
      console.log('comments count:', commentRows[0].count);
    } catch(e) {
      console.log('comments error:', e.message);
    }

    // Check content_revisions
    try {
      const [revRows] = await conn.query("SELECT COUNT(*) as count FROM content_revisions");
      console.log('content_revisions count:', revRows[0].count);
    } catch(e) {
      console.log('content_revisions error:', e.message);
    }

    // Check dynamic form tables
    const [dynamicTables] = await conn.query("SHOW TABLES LIKE 'form_submissions_%'");
    console.log('Dynamic form tables:', dynamicTables.map(r => Object.values(r)[0]));

    // Check landing_page_submissions
    try {
      const [lpRows] = await conn.query("SELECT COUNT(*) as count FROM landing_page_submissions");
      console.log('landing_page_submissions count:', lpRows[0].count);
    } catch(e) {
      console.log('landing_page_submissions error:', e.message);
    }

    // Check dynamic tables row counts
    for (const t of dynamicTables.map(r => Object.values(r)[0])) {
      const [r] = await conn.query(`SELECT COUNT(*) as count FROM \`${t}\``);
      console.log(`${t} count:`, r[0].count);
    }

    await conn.end();
  } catch(e) {
    console.error('Error:', e);
  }
})();
