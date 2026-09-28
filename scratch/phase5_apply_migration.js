const { pool } = require('../backend/src/config/database');

(async () => {
    try {
        console.log('Applying fk_contents_user to publishing_platform.contents...');
        await pool.query(`
            ALTER TABLE contents
                ADD CONSTRAINT fk_contents_user
                FOREIGN KEY (user_id)
                REFERENCES users (id)
                ON DELETE SET NULL
                ON UPDATE CASCADE
        `);
        console.log('✅ Applied fk_contents_user successfully!');

        const [show] = await pool.query('SHOW CREATE TABLE contents');
        console.log('=== SHOW CREATE TABLE contents ===');
        console.log(show[0]['Create Table']);

        const [fks] = await pool.query(`
            SELECT 
                CONSTRAINT_NAME, 
                TABLE_NAME, 
                COLUMN_NAME, 
                REFERENCED_TABLE_NAME, 
                REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = 'publishing_platform'
              AND TABLE_NAME = 'contents'
              AND REFERENCED_TABLE_NAME IS NOT NULL
        `);
        console.log('=== KEY_COLUMN_USAGE ===', fks);

        const [rc] = await pool.query(`
            SELECT 
                CONSTRAINT_NAME, 
                UPDATE_RULE, 
                DELETE_RULE, 
                REFERENCED_TABLE_NAME
            FROM information_schema.REFERENTIAL_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = 'publishing_platform'
              AND TABLE_NAME = 'contents'
        `);
        console.log('=== REFERENTIAL_CONSTRAINTS ===', rc);

    } catch (err) {
        console.error('Error applying FK:', err);
    } finally {
        await pool.end();
    }
})();
