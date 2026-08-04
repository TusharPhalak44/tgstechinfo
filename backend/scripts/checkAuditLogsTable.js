const { pool } = require('../src/config/database');

async function checkAndCreateAuditLogsTable() {
    try {
        console.log('Checking if audit_logs table exists...');
        
        // Check if table exists
        const [tables] = await pool.query("SHOW TABLES LIKE 'audit_logs'");
        
        if (tables.length === 0) {
            console.log('❌ audit_logs table does not exist. Creating it now...');
            
            const createTableSQL = `
                CREATE TABLE audit_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NULL,
                    action VARCHAR(100) NOT NULL,
                    entity_type VARCHAR(50) NULL,
                    entity_id INT NULL,
                    ip_address VARCHAR(45) NULL,
                    details TEXT NULL,
                    status ENUM('success', 'failed', 'warning') DEFAULT 'success',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_user_id (user_id),
                    INDEX idx_action (action),
                    INDEX idx_entity_type (entity_type),
                    INDEX idx_status (status),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `;
            
            await pool.query(createTableSQL);
            console.log('✅ audit_logs table created successfully');
        } else {
            console.log('✅ audit_logs table already exists');
        }
        
        // Check if there's any data
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM audit_logs');
        console.log(`📊 Current audit logs count: ${rows[0].count}`);
        
        if (rows[0].count === 0) {
            console.log('⚠️ No audit logs found. Inserting sample data...');
            
            // Get a user ID
            const [users] = await pool.query('SELECT id, email FROM users LIMIT 1');
            const userId = users.length > 0 ? users[0].id : null;
            
            // Insert sample audit logs
            const sampleLogs = [
                {
                    user_id: userId,
                    action: 'login',
                    entity_type: 'user',
                    entity_id: userId,
                    ip_address: '192.168.1.1',
                    details: 'User logged in from Chrome on Windows',
                    status: 'success'
                },
                {
                    user_id: userId,
                    action: 'create',
                    entity_type: 'content',
                    entity_id: 1,
                    ip_address: '192.168.1.1',
                    details: 'Created content: Sample Article',
                    status: 'success'
                },
                {
                    user_id: userId,
                    action: 'update',
                    entity_type: 'user',
                    entity_id: userId,
                    ip_address: '192.168.1.1',
                    details: 'Updated user status to active',
                    status: 'success'
                }
            ];
            
            for (const log of sampleLogs) {
                await pool.query(
                    'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, details, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [log.user_id, log.action, log.entity_type, log.entity_id, log.ip_address, log.details, log.status]
                );
            }
            
            console.log('✅ Sample audit logs inserted successfully');
        }
        
        // Show current logs
        const [logs] = await pool.query(`
            SELECT al.*, u.email as user_email 
            FROM audit_logs al 
            LEFT JOIN users u ON al.user_id = u.id 
            ORDER BY al.created_at DESC 
            LIMIT 5
        `);
        
        console.log('\n📋 Recent audit logs:');
        console.table(logs);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkAndCreateAuditLogsTable();
