const { pool } = require('../src/config/database');

async function migrate() {
    try {
        console.log('Modifying contents.user_id to BIGINT(20) UNSIGNED NULL...');
        await pool.query(`
            ALTER TABLE contents 
            MODIFY COLUMN user_id BIGINT(20) UNSIGNED NULL
        `);
        console.log('✅ contents.user_id altered successfully to BIGINT(20) UNSIGNED NULL');

        const [c] = await pool.query('SHOW COLUMNS FROM contents WHERE Field="user_id"');
        console.log('New contents.user_id definition:', c[0]);

        // Add index on user_id if not present for faster joins with users
        try {
            await pool.query('CREATE INDEX idx_contents_user_id ON contents (user_id)');
            console.log('✅ Added index on contents.user_id');
        } catch (idxErr) {
            console.log('Index info:', idxErr.message);
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
