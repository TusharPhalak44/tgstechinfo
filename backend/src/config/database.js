    const mysql = require('mysql2/promise');
    const dotenv = require('dotenv');

    // Do NOT override env vars already set by Docker
    dotenv.config({ override: false });

    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'publishing_platform',
        waitForConnections: true,
        connectionLimit: 20,
        queueLimit: 0
    });

    const testConnection = async (retries = 15, delay = 3000) => {
        for (let i = 0; i < retries; i++) {
            try {
                const conn = await pool.getConnection();
                console.log('✅ Connected to MySQL database successfully');
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
