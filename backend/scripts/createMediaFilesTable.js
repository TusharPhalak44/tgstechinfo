const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function createMediaFilesTable() {
    try {
        console.log('Creating media_files table...');
        
        const sqlPath = path.join(__dirname, '../database/media_files.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        await pool.query(sql);
        console.log('✅ media_files table created successfully');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating media_files table:', error.message);
        process.exit(1);
    }
}

createMediaFilesTable();
