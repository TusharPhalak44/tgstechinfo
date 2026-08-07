const { pool } = require('../config/database');

class SiteSettings {

    static async getSettings() {
        const [rows] = await pool.query('SELECT * FROM site_settings WHERE id = 1');
        return rows[0] || null;
    }

    static async updateSettings(settingsData) {
        const {
            site_name,
            cms_logo1,
            cms_logo2,
            cms_favicon,
            website_logo,
            website_favicon,
            website_main_logo,
            website_navbar_logo,
            website_footer_logo,
            site_description,
            site_keywords,
            seo_site_title,
            seo_site_separator,
            seo_meta_description,
            seo_meta_keywords,
            seo_og_image
        } = settingsData;

        const query = `
            INSERT INTO site_settings (
                id, site_name, cms_logo1, cms_logo2, cms_favicon,
                website_logo, website_favicon, website_main_logo, website_navbar_logo, website_footer_logo,
                site_description, site_keywords,
                seo_site_title, seo_site_separator, seo_meta_description, seo_meta_keywords, seo_og_image, updated_at
            )
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
                site_name = VALUES(site_name),
                cms_logo1 = VALUES(cms_logo1),
                cms_logo2 = VALUES(cms_logo2),
                cms_favicon = VALUES(cms_favicon),
                website_logo = VALUES(website_logo),
                website_favicon = VALUES(website_favicon),
                website_main_logo = VALUES(website_main_logo),
                website_navbar_logo = VALUES(website_navbar_logo),
                website_footer_logo = VALUES(website_footer_logo),
                site_description = VALUES(site_description),
                site_keywords = VALUES(site_keywords),
                seo_site_title = VALUES(seo_site_title),
                seo_site_separator = VALUES(seo_site_separator),
                seo_meta_description = VALUES(seo_meta_description),
                seo_meta_keywords = VALUES(seo_meta_keywords),
                seo_og_image = VALUES(seo_og_image),
                updated_at = CURRENT_TIMESTAMP
        `;

        await pool.query(query, [
            site_name,
            cms_logo1,
            cms_logo2,
            cms_favicon,
            website_logo,
            website_favicon,
            website_main_logo,
            website_navbar_logo,
            website_footer_logo,
            site_description,
            site_keywords,
            seo_site_title,
            seo_site_separator,
            seo_meta_description,
            seo_meta_keywords,
            seo_og_image
        ]);

        return await SiteSettings.getSettings();
    }

    static async updateLogo(type, imageData) {
        const columnMap = {
            'cms_logo1': 'cms_logo1',
            'cms_logo2': 'cms_logo2',
            'cms_favicon': 'cms_favicon',
            'website_logo': 'website_logo',
            'website_favicon': 'website_favicon',
            'website_main_logo': 'website_main_logo',
            'website_navbar_logo': 'website_navbar_logo',
            'website_footer_logo': 'website_footer_logo'
        };

        const column = columnMap[type];
        if (!column) {
            throw new Error('Invalid logo type');
        }

        const query = `
            INSERT INTO site_settings (id, ${column}, updated_at)
            VALUES (1, ?, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
                ${column} = VALUES(${column}),
                updated_at = CURRENT_TIMESTAMP
        `;

        // Use a single dedicated connection so SET SESSION and INSERT are
        // guaranteed to run on the same connection. pool.query() can hand out
        // a different connection for each call, making SET SESSION ineffective.
       const conn = await pool.getConnection();
try {
    await conn.query(query, [imageData]);
} finally {
    conn.release();
}

return await SiteSettings.getSettings();
    }
}

module.exports = SiteSettings;
