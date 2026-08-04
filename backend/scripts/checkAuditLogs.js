const { pool } = require('../src/config/database');

async function checkAuditLogs() {
    try {
        console.log('Checking audit_logs table...');
        
        const [logs] = await pool.query(`
            SELECT al.*, u.email as user_email 
            FROM audit_logs al 
            LEFT JOIN users u ON al.user_id = u.id 
            ORDER BY al.created_at DESC 
            LIMIT 10
        `);
        
        console.log(`📊 Total audit logs: ${logs.length}`);
        
        if (logs.length > 0) {
            console.log('\n📋 Recent audit logs:');
            console.table(logs);
        } else {
            console.log('⚠️ No audit logs found in database');
            console.log('\nThis means:');
            console.log('1. Auth controller login logging not implemented (edit was blocked)');
            console.log('2. No content created/updated yet');
            console.log('3. No admin actions performed');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkAuditLogs();
