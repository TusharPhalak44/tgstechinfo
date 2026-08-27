const { pool } = require('./src/config/database');

async function updateDates() {
  try {
    // Update all published content that don't have published_date but have scheduled_publish_date
    const [result] = await pool.query(`
      UPDATE contents 
      SET published_date = COALESCE(scheduled_publish_date, created_at)
      WHERE status = 'published' AND (published_date IS NULL OR published_date = '0000-00-00 00:00:00')
    `);
    console.log('Updated', result.affectedRows, 'published content records');
    
    // Check current state
    const [rows] = await pool.query(`
      SELECT id, title, status, scheduled_publish_date, published_date, created_at
      FROM contents 
      WHERE status = 'published'
      LIMIT 5
    `);
    console.log('Sample published content:');
    console.table(rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateDates();