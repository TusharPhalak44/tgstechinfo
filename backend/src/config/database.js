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
