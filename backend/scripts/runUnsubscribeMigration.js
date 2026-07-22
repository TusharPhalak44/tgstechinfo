const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../database/newsletter_unsubscribe.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
        console.log('✅ Executed:', statement.substring(0, 50) + '...');
      }
    }
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
