const { pool } = require('../src/config/database');

async function addBuilderLayoutColumn() {
    try {
        console.log('Adding builder_layout column to contents table...');
        
        // Check if column already exists
        const [columns] = await pool.query(`
            SHOW COLUMNS FROM contents LIKE 'builder_layout'
        `);
        
        if (columns.length > 0) {
            console.log('Column builder_layout already exists');
            return;
        }
        
        // Add the column
        await pool.query(`
            ALTER TABLE contents 
            ADD COLUMN builder_layout TEXT NULL 
            AFTER webhook_field_mapping
        `);
        
        console.log('✅ Successfully added builder_layout column to contents table');
    } catch (error) {
        console.error('Error adding builder_layout column:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

addBuilderLayoutColumn();
