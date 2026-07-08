const { pool } = require('../src/config/database');
const { hashPassword } = require('../src/config/auth');

async function setup() {
    try {
        console.log('🔧 Creating tables...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user') DEFAULT 'user',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ users table ready');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                type VARCHAR(50),
                parent_id INT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ categories table ready');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS content_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ content_types table ready');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS contents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                content_type_id INT,
                category_id INT,
                title VARCHAR(500) NOT NULL,
                slug VARCHAR(500) UNIQUE NOT NULL,
                short_description TEXT,
                tags JSON,
                banner_image VARCHAR(500),
                content LONGTEXT,
                seo_meta_title VARCHAR(255),
                seo_meta_description TEXT,
                seo_meta_keywords TEXT,
                scheduled_publish_date DATETIME,
                published_date DATETIME,
                reading_time INT DEFAULT 0,
                view_count INT DEFAULT 0,
                status ENUM('draft','pending','approved','published','rejected','changes_requested') DEFAULT 'draft',
                admin_comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (content_type_id) REFERENCES content_types(id),
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        `);
        console.log('✅ contents table ready');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS landing_page_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                contact_number VARCHAR(20),
                content_id INT,
                has_access BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (content_id) REFERENCES contents(id)
            )
        `);
        console.log('✅ landing_page_submissions table ready');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ newsletter_subscribers table ready');

        console.log('\n🌱 Seeding users...');

        const [adminRows] = await pool.query("SELECT id FROM users WHERE email = 'admin@tgstechinfo.com'");
        if (adminRows.length === 0) {
            const adminPassword = await hashPassword('Admin@123');
            await pool.query(
                'INSERT INTO users (first_name, last_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
                ['Admin', 'User', 'admin@tgstechinfo.com', adminPassword, 'admin', true]
            );
            console.log('✅ Admin user created');
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        const [userRows] = await pool.query("SELECT id FROM users WHERE email = 'user@tgstechinfo.com'");
        if (userRows.length === 0) {
            const userPassword = await hashPassword('User@123');
            await pool.query(
                'INSERT INTO users (first_name, last_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
                ['John', 'Doe', 'user@tgstechinfo.com', userPassword, 'user', true]
            );
            console.log('✅ Regular user created');
        } else {
            console.log('ℹ️  Regular user already exists');
        }

        // Seed default categories
        const [catRows] = await pool.query("SELECT id FROM categories LIMIT 1");
        if (catRows.length === 0) {
            await pool.query(`
                INSERT INTO categories (name, slug, type) VALUES
                ('Technology', 'technology', 'main'),
                ('Business', 'business', 'main'),
                ('Marketing', 'marketing', 'main'),
                ('Finance', 'finance', 'main')
            `);
            console.log('✅ Default categories created');
        }

        // Seed default content types
        const [ctRows] = await pool.query("SELECT id FROM content_types LIMIT 1");
        if (ctRows.length === 0) {
            await pool.query(`
                INSERT INTO content_types (name, slug) VALUES
                ('Article', 'article'),
                ('Blog', 'blog'),
                ('Case Study', 'case-study'),
                ('Whitepaper', 'whitepaper')
            `);
            console.log('✅ Default content types created');
        }

        console.log('\n✅ Setup complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👑 Admin:  admin@tgstechinfo.com  /  Admin@123');
        console.log('👤 User:   user@tgstechinfo.com   /  User@123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        await pool.end();
    } catch (error) {
        console.error('❌ Setup error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

setup();
