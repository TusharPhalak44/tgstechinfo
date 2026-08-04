const { pool } = require('../src/config/database');

async function addWebsiteLogoColumns() {
    try {
        console.log('Adding website logo and SEO columns to site_settings table...');

        // Add website_main_logo column
        await pool.query(`
            ALTER TABLE site_settings
            ADD COLUMN IF NOT EXISTS website_main_logo LONGTEXT
        `);
        console.log('✓ Added website_main_logo column');

        // Add website_navbar_logo column
        await pool.query(`
            ALTER TABLE site_settings
            ADD COLUMN IF NOT EXISTS website_navbar_logo LONGTEXT
        `);
        console.log('✓ Added website_navbar_logo column');

        // Add website_footer_logo column
        await pool.query(`
            ALTER TABLE site_settings
            ADD COLUMN IF NOT EXISTS website_footer_logo LONGTEXT
        `);
        console.log('✓ Added website_footer_logo column');

        // Add logo_sizes column (JSON for storing size settings)
        await pool.query(`
            ALTER TABLE site_settings
            ADD COLUMN IF NOT EXISTS logo_sizes JSON
        `);
        console.log('✓ Added logo_sizes column');

        // Add SEO columns
        await pool.query(`
            ALTER TABLE site_settings
            ADD COLUMN IF NOT EXISTS seo_site_title VARCHAR(255)
        `);
        console.log('✓ Added seo_site_title column');

        await pool.query(`
            ALTER TABLE site_settings
            ADD COLUMN IF NOT EXISTS seo_site_separator VARCHAR(50) DEFAULT '|'
        `);
        console.log('✓ Added seo_site_separator column');

        await pool.query(`
            ALTER TABLE site_settings
            ADD COLUMN IF NOT EXISTS seo_meta_description TEXT
        `);
        console.log('✓ Added seo_meta_description column');

        await pool.query(`
            ALTER TABLE site_settings
            ADD COLUMN IF NOT EXISTS seo_meta_keywords TEXT
        `);
        console.log('✓ Added seo_meta_keywords column');

        await pool.query(`
            ALTER TABLE site_settings
            ADD COLUMN IF NOT EXISTS seo_og_image LONGTEXT
        `);
        console.log('✓ Added seo_og_image column');

        console.log('All columns added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error adding columns:', error);
        process.exit(1);
    }
}

addWebsiteLogoColumns();
