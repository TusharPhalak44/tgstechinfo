const { pool } = require('../src/config/database');

async function addBuilderContentElementsColumn() {
    try {
        console.log('Adding builder_content_elements column to contents table...');
        
        // Check if column already exists
        const [columns] = await pool.query(`
            SHOW COLUMNS FROM contents LIKE 'builder_content_elements'
        `);
        
        if (columns.length > 0) {
            console.log('Column builder_content_elements already exists');
            return;
        }
        
        // Add the column
        await pool.query(`
            ALTER TABLE contents 
            ADD COLUMN builder_content_elements JSON NULL 
            AFTER builder_layout
        `);
        
        console.log('✅ Successfully added builder_content_elements column to contents table');
    } catch (error) {
        console.error('Error adding builder_content_elements column:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

addBuilderContentElementsColumn();
