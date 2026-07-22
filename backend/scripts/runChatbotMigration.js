const { pool } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('Starting chatbot tables migration...');
        
        const sqlPath = path.join(__dirname, '../database/chatbot_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Split by semicolon to handle multiple statements
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
            if (statement.trim()) {
                await pool.query(statement.trim());
                console.log('✅ Executed statement successfully');
            }
        }
        
        console.log('✅ Chatbot tables migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
