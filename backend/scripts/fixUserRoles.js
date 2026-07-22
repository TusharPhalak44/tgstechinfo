/**
 * fixUserRoles.js
 * Assigns the Contributor role to every user who has no role in user_roles,
 * and Admin role to users with role='admin'.
 * Safe to run multiple times (uses INSERT IGNORE).
 */
const { pool } = require('../src/config/database');

const fixRoles = async () => {
    try {
        console.log('🔧 Fixing user roles...');

        // Get role IDs
        const [[contributor]] = await pool.query("SELECT id FROM roles WHERE name = 'Contributor'");
        const [[admin]] = await pool.query("SELECT id FROM roles WHERE name = 'Admin'");
        const [[superAdmin]] = await pool.query("SELECT id FROM roles WHERE name = 'Super Admin'");

        if (!contributor) {
            console.error('❌ Contributor role not found. Run migrateAll.js first.');
            process.exit(1);
        }

        // Assign Contributor to all regular users with no role assigned
        const [result1] = await pool.query(`
            INSERT IGNORE INTO user_roles (user_id, role_id)
            SELECT u.id, ?
            FROM users u
            WHERE u.role = 'user'
              AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id)
        `, [contributor.id]);
        console.log(`✅ Assigned Contributor role to ${result1.affectedRows} user(s)`);

        // Assign Admin role to admin users with no role assigned
        if (admin) {
            const [result2] = await pool.query(`
                INSERT IGNORE INTO user_roles (user_id, role_id)
                SELECT u.id, ?
                FROM users u
                WHERE u.role = 'admin'
                  AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id)
            `, [admin.id]);
            console.log(`✅ Assigned Admin role to ${result2.affectedRows} admin(s)`);
        }

        // Also assign Super Admin role to the first admin as fallback
        if (superAdmin) {
            await pool.query(`
                INSERT IGNORE INTO user_roles (user_id, role_id)
                SELECT u.id, ?
                FROM users u
                WHERE u.role = 'admin'
                  AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = ?)
                LIMIT 1
            `, [superAdmin.id, superAdmin.id]);
        }

        // Show all user role assignments
        const [assignments] = await pool.query(`
            SELECT u.id, u.email, u.role as user_role_col, r.name as assigned_role
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            ORDER BY u.id
        `);
        console.log('\n📋 Current user role assignments:');
        assignments.forEach(a => {
            console.log(`  User #${a.id} (${a.email}) → ${a.assigned_role || 'NO ROLE'}`);
        });

        console.log('\n🎉 Done!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

fixRoles();
