const { pool } = require('../src/config/database');
const { hashPassword } = require('../src/config/auth');

async function resetAdminPassword() {
    try {
        console.log('Resetting password for user@tgstechinfo.com...\n');
        
        // Check if user exists
        const [users] = await pool.query('SELECT id, email, first_name, last_name FROM users WHERE email = ?', ['user@tgstechinfo.com']);
        
        if (users.length === 0) {
            console.log('❌ User not found in database');
            console.log('Creating user...');
            
            // Create the user
            const passwordHash = await hashPassword('User@123');
            const [result] = await pool.query(`
                INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
                VALUES (?, ?, ?, ?, 'admin', 1)
            `, ['TGS', '', 'user@tgstechinfo.com', passwordHash]);
            
            console.log('✅ User created successfully');
            console.log(`   User ID: ${result.insertId}`);
            console.log(`   Email: user@tgstechinfo.com`);
            console.log(`   Password: User@123`);
            console.log(`   Role: admin`);
            
        } else {
            const user = users[0];
            console.log('✅ User found in database');
            console.log(`   User ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Name: ${user.first_name} ${user.last_name}`);
            
            // Update password
            const passwordHash = await hashPassword('User@123');
            await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);
            
            console.log('✅ Password reset successfully');
            console.log(`   New Password: User@123`);
            
            // Check if user has content
            const [contentCount] = await pool.query('SELECT COUNT(*) as count FROM contents WHERE user_id = ?', [user.id]);
            console.log(`   Content count: ${contentCount[0].count}`);
        }
        
        console.log('\n⚠️  Please save these credentials:');
        console.log('   Email: user@tgstechinfo.com');
        console.log('   Password: User@123');
        
    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        await pool.end();
    }
}

resetAdminPassword();
