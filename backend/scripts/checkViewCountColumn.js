const { pool } = require('../src/config/database');

async function checkViewCountColumn() {
    try {
        console.log('Checking view_count column in contents table...');
        
        // Check if column exists
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'contents' 
            AND COLUMN_NAME = 'view_count'
        `);
        
        if (columns.length === 0) {
            console.log('❌ view_count column does NOT exist in contents table');
            
            // Add the column
            console.log('Adding view_count column...');
            await pool.query(`
                ALTER TABLE contents 
                ADD COLUMN view_count INT DEFAULT 0
            `);
            console.log('✅ view_count column added successfully');
        } else {
            console.log('✅ view_count column exists:', columns[0]);
        }
        
        // Check current view counts
        const [rows] = await pool.query('SELECT id, title, view_count FROM contents LIMIT 5');
        console.log('\nCurrent view counts:');
        rows.forEach(row => {
            console.log(`  ID ${row.id}: ${row.title} - ${row.view_count} views`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkViewCountColumn();
