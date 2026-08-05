const { pool } = require('../src/config/database');

async function createAuditLogsTable() {
    try {
        console.log('Creating audit_logs table...');
        
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS audit_logs (
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
                INDEX idx_user_id (user_id),
                INDEX idx_action (action),
                INDEX idx_entity_type (entity_type),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        await pool.query(createTableSQL);
        console.log('✅ audit_logs table created successfully');
        
        // Insert sample data
        const [users] = await pool.query('SELECT id, email FROM users LIMIT 1');
        const userId = users.length > 0 ? users[0].id : null;
        
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
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

createAuditLogsTable();
