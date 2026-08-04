const { pool } = require('../src/config/database');

async function createSiteSettingsTable() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS site_settings (
                id INT PRIMARY KEY,
                site_name VARCHAR(255) DEFAULT 'TgsTechInfo',
                cms_logo1 LONGTEXT,
                cms_logo2 LONGTEXT,
                cms_favicon LONGTEXT,
                website_logo LONGTEXT,
                website_favicon LONGTEXT,
                website_main_logo LONGTEXT,
                website_navbar_logo LONGTEXT,
                website_footer_logo LONGTEXT,
                logo_sizes JSON,
                site_description TEXT,
                site_keywords TEXT,
                seo_site_title VARCHAR(255),
                seo_site_separator VARCHAR(50) DEFAULT '|',
                seo_meta_description TEXT,
                seo_meta_keywords TEXT,
                seo_og_image LONGTEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;

        await pool.query(createTableQuery);
        console.log('Site settings table created successfully');

        // Insert default settings if not exists
        const insertQuery = `
            INSERT IGNORE INTO site_settings (id, site_name)
            VALUES (1, 'TgsTechInfo')
        `;
        await pool.query(insertQuery);
        console.log('Default settings inserted');

        process.exit(0);
    } catch (error) {
        console.error('Error creating site settings table:', error);
        process.exit(1);
    }
}

createSiteSettingsTable();
