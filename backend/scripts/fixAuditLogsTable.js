const { pool } = require('../src/config/database');

async function fixAuditLogsTable() {
    try {
        console.log('Checking current audit_logs table structure...');
        
        // Check if table exists first
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
            // Get current table structure
            const [columns] = await pool.query("DESCRIBE audit_logs");
            console.log('Current columns:');
            console.table(columns);
        
        // Check if required columns exist
        const columnNames = columns.map(col => col.Field);
        const requiredColumns = ['id', 'user_id', 'action', 'entity_type', 'entity_id', 'ip_address', 'details', 'status', 'created_at'];
        
        const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
        
        if (missingColumns.length > 0) {
            console.log(`❌ Missing columns: ${missingColumns.join(', ')}`);
            console.log('Dropping and recreating table...');
            
            await pool.query('DROP TABLE IF EXISTS audit_logs');
            console.log('✅ Old table dropped');
            
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
                    INDEX idx_user_id (user_id),
                    INDEX idx_action (action),
                    INDEX idx_entity_type (entity_type),
                    INDEX idx_status (status),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `;
            
            await pool.query(createTableSQL);
            console.log('✅ audit_logs table recreated with correct structure');
        } else {
            console.log('✅ Table structure is correct');
        }
        
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

fixAuditLogsTable();
