const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Enforce Asia/Kolkata (IST) timezone globally for Node.js runtime
process.env.TZ = process.env.TZ || 'Asia/Kolkata';

// Do NOT override env vars already set by Docker
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: false });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'publishing_platform',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    timezone: '+05:30',
    dateStrings: true
});

// Enforce Indian Standard Time (+05:30) on EVERY connection in the pool
pool.on('connection', (connection) => {
    connection.query("SET time_zone = '+05:30'", (err) => {
        if (err) {
            console.warn('⚠️ Could not set time_zone = +05:30 on pool connection:', err.message);
        }
    });
});

const testConnection = async (retries = 15, delay = 3000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const conn = await pool.getConnection();
            await conn.query("SET time_zone = '+05:30'");
            try {
                await conn.query("SET GLOBAL time_zone = '+05:30'");
            } catch (_) {
                // If lacks SUPER / SYSTEM_VARIABLES_ADMIN privilege, session level is already guaranteed
            }
            console.log(`✅ Connected to MySQL database [${process.env.DB_NAME || 'publishing_platform'}] successfully (Timezone: +05:30 IST)`);
            // Auto-clean legacy placeholder contacts in email_templates table
            try {
                await conn.query(`
                    UPDATE email_templates 
                    SET html_body = REPLACE(REPLACE(html_body, 'max.brown@tgstechinfo.com', 'info@tgstechinfo.com'), 'Mark Jason', 'TGS Tech Info Team') 
                    WHERE html_body LIKE '%max.brown%' OR html_body LIKE '%Mark Jason%'
                `);
                await conn.query(`
                    UPDATE email_templates 
                    SET html_body = REPLACE(
                        html_body, 
                        'feel free to reach out to our support team.</p>', 
                        'feel free to reach out to our support team at <a href="mailto:info@tgstechinfo.com" style="color: #F7941D; font-weight: bold; text-decoration: none;">info@tgstechinfo.com</a>.</p>'
                    ) 
                    WHERE html_body LIKE '%reach out to our support team.%' AND html_body NOT LIKE '%info@tgstechinfo.com%'
                `);
                await conn.query(`
                    UPDATE email_templates 
                    SET subject = 'We’ve Received Your Inquiry - TGS Tech Info' 
                    WHERE template_type IN ('contact_form', 'contact', 'inquiry') 
                       OR subject LIKE '%Inquiry Received%'
                `);

                // Ensure users table has avatar, bio, phone, and social media columns for user & author profiles
                try {
                    await conn.query('ALTER TABLE users ADD COLUMN avatar VARCHAR(500) DEFAULT NULL');
                } catch (_) {}
                try {
                    await conn.query('ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL');
                } catch (_) {}
                try {
                    await conn.query('ALTER TABLE users ADD COLUMN phone VARCHAR(50) DEFAULT NULL');
                } catch (_) {}
                try {
                    await conn.query('ALTER TABLE users ADD COLUMN linkedin_url VARCHAR(500) DEFAULT NULL');
                } catch (_) {}
                try {
                    await conn.query('ALTER TABLE users ADD COLUMN twitter_url VARCHAR(500) DEFAULT NULL');
                } catch (_) {}
                try {
                    await conn.query('ALTER TABLE users ADD COLUMN website_url VARCHAR(500) DEFAULT NULL');
                } catch (_) {}
                try {
                    await conn.query('ALTER TABLE users ADD COLUMN github_url VARCHAR(500) DEFAULT NULL');
                } catch (_) {}
            } catch (_) {}
            conn.release();
            return true;
        } catch (err) {
            console.log(`❌ Connection attempt ${i + 1}/${retries} failed:`, err.message);
            if (i < retries - 1) {
                console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    console.error('❌ All connection attempts failed. Please check:');
    console.error('1. DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in environment');
    console.error('2. MySQL container is healthy');
    console.error('3. Database exists');
    return false;
};

testConnection();

module.exports = { pool };
