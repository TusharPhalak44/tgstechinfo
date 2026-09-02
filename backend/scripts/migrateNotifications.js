const { pool } = require('../src/config/database');

const migrate = async () => {
    try {
        // First check if table exists
        const [tables] = await pool.query(`SHOW TABLES LIKE 'notifications'`);
        
        if (tables.length === 0) {
            // Create table with title column
            await pool.query(`
                CREATE TABLE notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    content_id INT NULL,
                    type VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NULL,
                    message TEXT NOT NULL,
                    is_read TINYINT(1) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Notifications table created with title column');
        } else {
            // Check if title column exists
            const [columns] = await pool.query(`SHOW COLUMNS FROM notifications LIKE 'title'`);
            
            if (columns.length === 0) {
                // Add title column if it doesn't exist
                await pool.query(`ALTER TABLE notifications ADD COLUMN title VARCHAR(255) NULL AFTER type`);
                console.log('✅ Title column added to notifications table');
            } else {
                console.log('✅ Title column already exists in notifications table');
            }
        }
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err.message);
        process.exit(1);
    }
};

migrate();
