const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function syncPublishingPlatform() {
    console.log('Connecting to database:', process.env.DB_NAME || 'publishing_platform');
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'publishing_platform'
    });

    console.log('Connected! Checking and synchronizing schema for publishing_platform...');

    // 1. users: avatar, reset_token, reset_token_expires
    const [userCols] = await conn.query('SHOW COLUMNS FROM users');
    const userColNames = userCols.map(c => c.Field);
    if (!userColNames.includes('avatar')) {
        await conn.query('ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL AFTER country');
        console.log('✅ Added users.avatar');
    }
    if (!userColNames.includes('reset_token')) {
        await conn.query('ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL');
        console.log('✅ Added users.reset_token');
    }
    if (!userColNames.includes('reset_token_expires')) {
        await conn.query('ALTER TABLE users ADD COLUMN reset_token_expires DATETIME NULL');
        console.log('✅ Added users.reset_token_expires');
    }

    // 2. notifications: title
    const [notifCols] = await conn.query('SHOW COLUMNS FROM notifications');
    const notifColNames = notifCols.map(c => c.Field);
    if (!notifColNames.includes('title')) {
        await conn.query('ALTER TABLE notifications ADD COLUMN title VARCHAR(255) NULL AFTER type');
        console.log('✅ Added notifications.title');
    }

    // 3. newsletter_subscribers: unsubscribe_token, unsubscribed_at
    const [newsCols] = await conn.query('SHOW COLUMNS FROM newsletter_subscribers');
    const newsColNames = newsCols.map(c => c.Field);
    if (!newsColNames.includes('unsubscribe_token')) {
        await conn.query('ALTER TABLE newsletter_subscribers ADD COLUMN unsubscribe_token VARCHAR(64) NULL, ADD INDEX idx_unsubscribe_token (unsubscribe_token)');
        console.log('✅ Added newsletter_subscribers.unsubscribe_token');
    }
    if (!newsColNames.includes('unsubscribed_at')) {
        await conn.query('ALTER TABLE newsletter_subscribers ADD COLUMN unsubscribed_at TIMESTAMP NULL');
        console.log('✅ Added newsletter_subscribers.unsubscribed_at');
    }

    // 4. site_settings: website_main_logo, website_navbar_logo, website_footer_logo, logo_sizes
    const [siteCols] = await conn.query('SHOW COLUMNS FROM site_settings');
    const siteColNames = siteCols.map(c => c.Field);
    if (!siteColNames.includes('website_main_logo')) {
        await conn.query('ALTER TABLE site_settings ADD COLUMN website_main_logo LONGTEXT NULL');
        console.log('✅ Added site_settings.website_main_logo');
    }
    if (!siteColNames.includes('website_navbar_logo')) {
        await conn.query('ALTER TABLE site_settings ADD COLUMN website_navbar_logo LONGTEXT NULL');
        console.log('✅ Added site_settings.website_navbar_logo');
    }
    if (!siteColNames.includes('website_footer_logo')) {
        await conn.query('ALTER TABLE site_settings ADD COLUMN website_footer_logo LONGTEXT NULL');
        console.log('✅ Added site_settings.website_footer_logo');
    }
    if (!siteColNames.includes('logo_sizes')) {
        await conn.query('ALTER TABLE site_settings ADD COLUMN logo_sizes JSON NULL');
        console.log('✅ Added site_settings.logo_sizes');
    }

    // Copy logo data from tgstechinfo if empty in publishing_platform
    try {
        const [currSettings] = await conn.query('SELECT website_main_logo FROM site_settings LIMIT 1');
        if (currSettings.length > 0 && !currSettings[0].website_main_logo) {
            const [tgsSettings] = await conn.query('SELECT website_main_logo, website_navbar_logo, website_footer_logo, logo_sizes FROM tgstechinfo.site_settings LIMIT 1');
            if (tgsSettings.length > 0 && tgsSettings[0].website_main_logo) {
                await conn.query(
                    'UPDATE site_settings SET website_main_logo = ?, website_navbar_logo = ?, website_footer_logo = ?, logo_sizes = ? WHERE id = ?',
                    [
                        tgsSettings[0].website_main_logo,
                        tgsSettings[0].website_navbar_logo,
                        tgsSettings[0].website_footer_logo,
                        typeof tgsSettings[0].logo_sizes === 'string' ? tgsSettings[0].logo_sizes : JSON.stringify(tgsSettings[0].logo_sizes),
                        currSettings[0].id || 1
                    ]
                );
                console.log('✅ Copied website logos from tgstechinfo to publishing_platform site_settings');
            }
        }
    } catch (e) {
        console.log('Note on site_settings copy:', e.message);
    }

    // 5. webhook_failures table
    await conn.query(`
        CREATE TABLE IF NOT EXISTS webhook_failures (
            id INT AUTO_INCREMENT PRIMARY KEY,
            content_id INT NOT NULL,
            webhook_url TEXT NOT NULL,
            payload JSON,
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            retry_count INT DEFAULT 0,
            last_retry_at TIMESTAMP NULL,
            resolved BOOLEAN DEFAULT FALSE,
            INDEX idx_content_id (content_id),
            INDEX idx_created_at (created_at),
            INDEX idx_resolved (resolved),
            FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ webhook_failures table ready');

    // 6. email_templates table
    await conn.query(`
        CREATE TABLE IF NOT EXISTS email_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            template_type VARCHAR(100) NOT NULL,
            template_name VARCHAR(255) NOT NULL,
            subject VARCHAR(500) NOT NULL,
            html_body TEXT NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            include_logo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_template_type (template_type),
            INDEX idx_is_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ email_templates table ready');

    // Populate email_templates if empty
    const [tmplCount] = await conn.query('SELECT COUNT(*) as c FROM email_templates');
    if (tmplCount[0].c === 0) {
        try {
            const [tgsTemplates] = await conn.query('SELECT template_type, template_name, subject, html_body, is_active, include_logo FROM tgstechinfo.email_templates');
            for (const t of tgsTemplates) {
                await conn.query(
                    'INSERT INTO email_templates (template_type, template_name, subject, html_body, is_active, include_logo) VALUES (?, ?, ?, ?, ?, ?)',
                    [t.template_type, t.template_name, t.subject, t.html_body, t.is_active, t.include_logo]
                );
            }
            console.log('✅ Seeded ' + tgsTemplates.length + ' email templates from tgstechinfo');
        } catch (err) {
            console.log('Could not copy templates from tgstechinfo, will use createEmailTemplatesTable script if needed:', err.message);
        }
    } else {
        console.log('✅ email_templates already contains ' + tmplCount[0].c + ' templates');
    }

    // 7. form_submissions_176
    try {
        const [formTables] = await conn.query("SHOW TABLES LIKE 'form_submissions_176'");
        if (formTables.length > 0) {
            const [fCols] = await conn.query('SHOW COLUMNS FROM form_submissions_176');
            const fColNames = fCols.map(c => c.Field);
            if (!fColNames.includes('fname')) await conn.query('ALTER TABLE form_submissions_176 ADD COLUMN fname VARCHAR(255) NULL');
            if (!fColNames.includes('lname')) await conn.query('ALTER TABLE form_submissions_176 ADD COLUMN lname VARCHAR(255) NULL');
            if (!fColNames.includes('phone')) await conn.query('ALTER TABLE form_submissions_176 ADD COLUMN phone VARCHAR(255) NULL');
            console.log('✅ form_submissions_176 columns synchronized');
        }
    } catch (e) {
        console.log('Note on form_submissions_176:', e.message);
    }

    console.log('\n🎉 SUCCESS: Database `' + (process.env.DB_NAME || 'publishing_platform') + '` is completely synchronized and ready for production/development use!');
    await conn.end();
}

syncPublishingPlatform().catch(err => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
});
