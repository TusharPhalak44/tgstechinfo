const { pool } = require('../src/config/database');

async function check() {
    try {
        const [u] = await pool.query('SHOW COLUMNS FROM users WHERE Field="id"');
        const [c] = await pool.query('SHOW COLUMNS FROM contents WHERE Field="user_id"');
        console.log('users.id:', u[0]);
        console.log('contents.user_id:', c[0]);

        const [fk] = await pool.query(`
            SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'contents' AND COLUMN_NAME = 'user_id'
        `);
        console.log('Foreign keys on contents.user_id:', fk);

        // Check if any contents have user_id not in users
        const [orphans] = await pool.query(`
            SELECT c.id, c.user_id, c.title 
            FROM contents c 
            LEFT JOIN users u ON c.user_id = u.id 
            WHERE c.user_id IS NOT NULL AND u.id IS NULL
        `);
        console.log('Orphan count in contents where user_id not found in users:', orphans.length);
        if (orphans.length > 0) {
            console.log('Orphans sample:', orphans.slice(0, 5));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
