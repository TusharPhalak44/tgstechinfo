const { pool } = require('../config/database');

class SiteSettings {

    static async getSettings() {
        const [rows] = await pool.query('SELECT * FROM site_settings WHERE id = 1');
        return rows[0] || null;
    }

    static async updateSettings(settingsData) {
        // Only update columns that were explicitly included in the request body.
        // If a field is absent (undefined), leave it unchanged in the database.
        // This prevents a partial update (e.g. { logo_sizes }) from wiping
        // logo columns with NULL.
        const allowed = [
            'site_name', 'cms_logo1', 'cms_logo2', 'cms_favicon',
            'website_logo', 'website_favicon', 'website_main_logo',
            'website_navbar_logo', 'website_footer_logo',
            'site_description', 'site_keywords', 'logo_sizes',
            'seo_site_title', 'seo_site_separator', 'seo_meta_description',
            'seo_meta_keywords', 'seo_og_image'
        ];

        const setClauses = [];
        const values = [];

        for (const col of allowed) {
            if (Object.prototype.hasOwnProperty.call(settingsData, col)) {
                const val = settingsData[col];
                setClauses.push(`${col} = ?`);
                // Serialize objects (e.g. logo_sizes JSON) to strings
                values.push(typeof val === 'object' && val !== null ? JSON.stringify(val) : val);
            }
        }

        if (setClauses.length === 0) {
            return await SiteSettings.getSettings();
        }

        setClauses.push('updated_at = CURRENT_TIMESTAMP');

        // Ensure the row exists before updating
        await pool.query('INSERT IGNORE INTO site_settings (id) VALUES (1)');

        const query = `UPDATE site_settings SET ${setClauses.join(', ')} WHERE id = 1`;
        await pool.query(query, values);

        return await SiteSettings.getSettings();
    }

    static async updateLogo(type, imageData) {
        const columnMap = {
            cms_logo1: 'cms_logo1',
            cms_logo2: 'cms_logo2',
            cms_favicon: 'cms_favicon',
            website_logo: 'website_logo',
            website_favicon: 'website_favicon',
            website_main_logo: 'website_main_logo',
            website_navbar_logo: 'website_navbar_logo',
            website_footer_logo: 'website_footer_logo'
        };

        const column = columnMap[type];
        if (!column) {
            throw new Error('Invalid logo type');
        }

        const conn = await pool.getConnection();
        try {
            const sql = `
                UPDATE site_settings
                SET ${column} = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = 1
            `;
            const [result] = await conn.query(sql, [imageData]);
            console.log(`[updateLogo] type=${type} affectedRows=${result.affectedRows} changedRows=${result.changedRows}`);

            return await SiteSettings.getSettings();
        } finally {
            conn.release();
        }
    }
}

module.exports = SiteSettings;
