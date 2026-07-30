const { pool } = require('../src/config/database');

async function addSeoColumnsToSiteSettings() {
    try {
        console.log('Adding SEO columns to site_settings table...');
        
        // Check if columns already exist
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'site_settings' 
            AND COLUMN_NAME IN ('seo_site_title', 'seo_site_separator', 'seo_meta_description', 'seo_meta_keywords', 'seo_og_image')
        `);
        
        const existingColumns = columns.map(col => col.COLUMN_NAME);
        console.log('Existing SEO columns:', existingColumns);
        
        const columnsToAdd = [
            'seo_site_title',
            'seo_site_separator', 
            'seo_meta_description',
            'seo_meta_keywords',
            'seo_og_image'
        ].filter(col => !existingColumns.includes(col));
        
        if (columnsToAdd.length === 0) {
            console.log('All SEO columns already exist');
            process.exit(0);
        }
        
        console.log('Adding columns:', columnsToAdd);
        
        // Add each column
        for (const column of columnsToAdd) {
            let columnDefinition = '';
            
            switch(column) {
                case 'seo_site_title':
                    columnDefinition = 'VARCHAR(255) DEFAULT NULL';
                    break;
                case 'seo_site_separator':
                    columnDefinition = 'VARCHAR(10) DEFAULT " - "';
                    break;
                case 'seo_meta_description':
                    columnDefinition = 'TEXT DEFAULT NULL';
                    break;
                case 'seo_meta_keywords':
                    columnDefinition = 'VARCHAR(500) DEFAULT NULL';
                    break;
                case 'seo_og_image':
                    columnDefinition = 'VARCHAR(500) DEFAULT NULL';
                    break;
            }
            
            await pool.query(`ALTER TABLE site_settings ADD COLUMN ${column} ${columnDefinition}`);
            console.log(`✓ Added column: ${column}`);
        }
        
        console.log('\n=== SEO columns added successfully ===');
        process.exit(0);
    } catch (error) {
        console.error('Error adding SEO columns:', error);
        process.exit(1);
    }
}

addSeoColumnsToSiteSettings();
