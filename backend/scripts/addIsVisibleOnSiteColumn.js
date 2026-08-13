const { pool } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function addIsVisibleOnSiteColumn() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('🔄 Starting migration: Adding is_visible_on_site column to contents table...');

        // Read the SQL file
        const sqlPath = path.join(__dirname, '../database/add_is_visible_on_site_column.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

        for (const statement of statements) {
            console.log('Executing:', statement.substring(0, 100) + '...');
            await connection.query(statement);
        }

        console.log('✅ Successfully added is_visible_on_site column to contents table');
        console.log('✅ All existing content set to visible by default');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}

addIsVisibleOnSiteColumn();
