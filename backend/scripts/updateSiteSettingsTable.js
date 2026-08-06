const { pool } = require('../src/config/database');

async function updateSiteSettingsTable() {
    try {
        // Alter columns to LONGTEXT to support larger base64 images
        const alterQuery = `
            ALTER TABLE site_settings
            MODIFY COLUMN cms_logo1 LONGTEXT,
            MODIFY COLUMN cms_logo2 LONGTEXT,
            MODIFY COLUMN cms_favicon LONGTEXT,
            MODIFY COLUMN website_logo LONGTEXT,
            MODIFY COLUMN website_favicon LONGTEXT,
            MODIFY COLUMN website_main_logo LONGTEXT,
            MODIFY COLUMN website_navbar_logo LONGTEXT,
            MODIFY COLUMN website_footer_logo LONGTEXT,
            MODIFY COLUMN seo_og_image LONGTEXT
        `;

        await pool.query(alterQuery);
        console.log('Site settings table columns updated to LONGTEXT successfully');

        process.exit(0);
    } catch (error) {
        console.error('Error updating site settings table:', error);
        process.exit(1);
    }
}

updateSiteSettingsTable();
