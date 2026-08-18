const { pool } = require('../src/config/database');

async function addIncludeLogoColumn() {
    try {
        console.log('Adding include_logo column to email_templates table...');
        
        // Check if column already exists
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'email_templates' 
            AND COLUMN_NAME = 'include_logo'
        `);
        
        if (columns.length > 0) {
            console.log('Column include_logo already exists in email_templates table');
            return;
        }
        
        // Add the column
        await pool.query(`
            ALTER TABLE email_templates 
            ADD COLUMN include_logo TINYINT(1) DEFAULT 0 
            AFTER is_active
        `);
        
        console.log('✅ Successfully added include_logo column to email_templates table');
        
        // Update existing templates to set include_logo to 0 by default
        await pool.query(`
            UPDATE email_templates 
            SET include_logo = 0 
            WHERE include_logo IS NULL
        `);
        
        console.log('✅ Updated existing templates with default include_logo value');
        
    } catch (error) {
        console.error('Error adding include_logo column:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

addIncludeLogoColumn();