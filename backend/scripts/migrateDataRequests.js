const { pool } = require('../src/config/database');

const migrate = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS data_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                request_type ENUM('dsar', 'do_not_sell') NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                alt_email VARCHAR(255),
                phone VARCHAR(50),
                company VARCHAR(255),
                job_title VARCHAR(255),
                country VARCHAR(100),
                state VARCHAR(100),
                dsar_type ENUM('access','correct','delete','restrict','portability','object','withdraw','other'),
                dns_type ENUM('do_not_sell','do_not_share','both'),
                details TEXT,
                status ENUM('pending','in_progress','completed','rejected') NOT NULL DEFAULT 'pending',
                admin_notes TEXT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ data_requests table created successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
};

migrate();
