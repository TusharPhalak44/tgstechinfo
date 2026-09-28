const path = require('path');
const mysql = require(path.join(__dirname, '../backend/node_modules/mysql2/promise'));

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'publishing_platform'
    });
    
    // Check total users
    const [[{ totalUsers }]] = await conn.query("SELECT COUNT(*) as totalUsers FROM users");
    console.log('Total users:', totalUsers);

    // Check users.role distribution
    const [roleDist] = await conn.query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
    console.log('users.role distribution:', roleDist);

    // Check users.role_id distribution
    const [roleIdDist] = await conn.query("SELECT role_id, COUNT(*) as count FROM users GROUP BY role_id");
    console.log('users.role_id distribution:', roleIdDist);

    // Check roles table
    const [roles] = await conn.query("SELECT * FROM roles");
    console.log('roles table:', roles);

    // Check user_roles table
    const [userRoles] = await conn.query("SELECT ur.*, u.email, u.role as user_role, r.name as role_name FROM user_roles ur JOIN users u ON ur.user_id = u.id JOIN roles r ON ur.role_id = r.id");
    console.log('user_roles joined count:', userRoles.length);
    console.log('user_roles sample:', userRoles.slice(0, 10));

    // Check permissions and role_permissions count
    const [[{ permCount }]] = await conn.query("SELECT COUNT(*) as permCount FROM permissions");
    const [[{ rpCount }]] = await conn.query("SELECT COUNT(*) as rpCount FROM role_permissions");
    console.log('permissions count:', permCount, 'role_permissions count:', rpCount);

    await conn.end();
  } catch(e) {
    console.error('Error:', e);
  }
})();
