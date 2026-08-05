const { pool } = require('../src/config/database');

async function clearAuditLogs() {
    try {
        console.log('Clearing sample data from audit_logs table...');
        
        await pool.query('DELETE FROM audit_logs');
        console.log('✅ All audit logs cleared');
        
        // Verify
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM audit_logs');
        console.log(`📊 Current audit logs count: ${rows[0].count}`);
        
        console.log('\n✅ Sample data cleared. Now only real-time actions will be logged.');
        console.log('   - Login will create login log');
        console.log('   - Create content will create create log');
        console.log('   - Update content will create update log');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

clearAuditLogs();
