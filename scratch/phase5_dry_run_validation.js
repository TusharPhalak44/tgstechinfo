const mysql = require('../backend/node_modules/mysql2/promise');
require('../backend/node_modules/dotenv').config({ path: 'backend/.env' });
const { execSync } = require('child_process');

(async () => {
    const rootConn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    try {
        console.log('1. Creating dry-run database...');
        await rootConn.query('CREATE DATABASE IF NOT EXISTS dryrun_phase5');

        console.log('2. Restoring pre-migration backup into dryrun_phase5...');
        execSync('cmd.exe /c "C:\\xampp\\mysql\\bin\\mysql.exe -u root dryrun_phase5 < c:\\xampp\\htdocs\\tgspublish\\backend\\database\\backups\\phase5_pre_migration_backup_20260926.sql"');

        const dryConn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'dryrun_phase5'
        });

        console.log('3. Applying migration statement to dryrun_phase5...');
        await dryConn.query(`
            ALTER TABLE contents
                ADD CONSTRAINT fk_contents_user
                FOREIGN KEY (user_id)
                REFERENCES users (id)
                ON DELETE SET NULL
                ON UPDATE CASCADE
        `);
        console.log('✅ Migration applied successfully in dry-run database!');

        // Check SHOW CREATE TABLE
        const [showCreate] = await dryConn.query('SHOW CREATE TABLE contents');
        const ddl = showCreate[0]['Create Table'];
        const hasFk = ddl.includes('CONSTRAINT `fk_contents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE');
        console.log('4. SHOW CREATE TABLE verified constraint exists:', hasFk);
        if (!hasFk) {
            console.log('Actual DDL:', ddl);
            throw new Error('FK constraint missing in SHOW CREATE TABLE');
        }

        // Test inserting invalid user_id
        console.log('5. Testing invalid foreign key rejection...');
        let rejected = false;
        try {
            await dryConn.query(`
                INSERT INTO contents (title, slug, status, user_id, content)
                VALUES ('FK Test', 'fk-test-invalid-user', 'draft', 9999999, 'Test content')
            `);
        } catch (fkErr) {
            rejected = true;
            console.log('✅ Invalid user_id correctly rejected with error code:', fkErr.code, fkErr.errno);
        }
        if (!rejected) throw new Error('FAIL: Foreign key failed to reject invalid user_id!');

        // Test inserting valid user_id
        console.log('6. Testing valid user insertion...');
        const [users] = await dryConn.query('SELECT id FROM users LIMIT 1');
        const validUserId = users[0].id;
        const [insResult] = await dryConn.query(`
            INSERT INTO contents (title, slug, status, user_id, content)
            VALUES ('FK Test Valid', 'fk-test-valid-user', 'draft', ?, 'Test content')
        `, [validUserId]);
        console.log('✅ Valid user content inserted with ID:', insResult.insertId);

        // Test inserting NULL user_id
        console.log('7. Testing NULL user insertion...');
        const [insNullResult] = await dryConn.query(`
            INSERT INTO contents (title, slug, status, user_id, content)
            VALUES ('FK Test Null', 'fk-test-null-user', 'draft', NULL, 'Test content')
        `);
        console.log('✅ NULL user content inserted with ID:', insNullResult.insertId);

        // Test ON DELETE SET NULL
        console.log('8. Testing ON DELETE SET NULL behavior...');
        const [tempUser] = await dryConn.query(`
            INSERT INTO users (first_name, last_name, email, password_hash)
            VALUES ('Temp', 'User', 'temp_fk_test@example.com', 'dummyhash')
        `);
        const tempUserId = tempUser.insertId;
        const [tempContent] = await dryConn.query(`
            INSERT INTO contents (title, slug, status, user_id, content)
            VALUES ('Temp Content', 'temp-fk-content', 'published', ?, 'Content')
        `, [tempUserId]);
        const tempContentId = tempContent.insertId;

        // Delete user
        await dryConn.query('DELETE FROM users WHERE id = ?', [tempUserId]);
        const [checkContent] = await dryConn.query('SELECT id, user_id FROM contents WHERE id = ?', [tempContentId]);
        console.log('✅ Content after user deletion:', checkContent[0]);
        if (checkContent[0].user_id !== null) {
            throw new Error('FAIL: user_id was not set to NULL upon parent user deletion!');
        }
        console.log('✅ ON DELETE SET NULL confirmed working perfectly! Content was NOT deleted and user_id is now NULL.');

        await dryConn.end();
        console.log('9. Dry-run complete. Dropping dryrun_phase5...');
        await rootConn.query('DROP DATABASE IF EXISTS dryrun_phase5');
        console.log('✅ Dry-run database cleaned up.');

    } finally {
        await rootConn.end();
    }
})();
