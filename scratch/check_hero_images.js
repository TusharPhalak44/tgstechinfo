const { pool } = require('../backend/src/config/database');

async function check() {
  const [rows] = await pool.query(`
    SELECT c.id, c.title, c.banner_image, cat.name AS category_name 
    FROM contents c 
    LEFT JOIN categories cat ON c.category_id = cat.id 
    WHERE c.status = 'published' AND c.banner_image IS NOT NULL AND c.banner_image != ''
    ORDER BY c.views_count DESC
    LIMIT 10
  `);
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

check();
