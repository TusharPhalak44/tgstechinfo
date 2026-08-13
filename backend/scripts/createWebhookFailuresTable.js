const mysql = require('mysql2/promise');
require('dotenv').config();

async function createWebhookFailuresTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tgstechinfo',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('Creating webhook_failures table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS webhook_failures (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content_id INT NOT NULL,
        webhook_url TEXT NOT NULL,
        payload JSON,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        retry_count INT DEFAULT 0,
        last_retry_at TIMESTAMP NULL,
        resolved BOOLEAN DEFAULT FALSE,
        
        INDEX idx_content_id (content_id),
        INDEX idx_created_at (created_at),
        INDEX idx_resolved (resolved),
        
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.query(createTableSQL);
    console.log('✅ webhook_failures table created successfully');
    
    // Check if table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'webhook_failures'");
    if (tables.length > 0) {
      console.log('✅ Verified: webhook_failures table exists');
      
      // Show table structure
      const [columns] = await connection.query('DESCRIBE webhook_failures');
      console.log('\nTable structure:');
      columns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error creating webhook_failures table:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (require.main === module) {
  createWebhookFailuresTable()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createWebhookFailuresTable };
