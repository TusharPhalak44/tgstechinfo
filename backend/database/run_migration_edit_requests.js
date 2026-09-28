const { pool } = require('../src/config/database');

async function runMigration() {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS content_edit_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                content_id INT(11) NOT NULL,
                requested_by BIGINT(20) UNSIGNED NOT NULL COMMENT 'Admin user ID who requested the edit',
                requested_to BIGINT(20) UNSIGNED NOT NULL COMMENT 'Content creator user ID',
                status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
                admin_comment TEXT COMMENT 'Admin comment/reason for edit request',
                creator_comment TEXT COMMENT 'Creator comment when accepting/rejecting',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
                FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (requested_to) REFERENCES users(id) ON DELETE CASCADE,
                
                INDEX idx_content_id (content_id),
                INDEX idx_requested_to (requested_to),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await pool.query(sql);
        console.log('✅ content_edit_requests table created successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
