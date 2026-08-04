const { pool } = require('../src/config/database');

async function fixMediaDuplicates() {
    try {
        // Step 1: Delete duplicate rows — keep only the lowest id for each filename
        const [deleteResult] = await pool.query(`
            DELETE m1 FROM media_files m1
            INNER JOIN media_files m2
            WHERE m1.filename = m2.filename AND m1.id > m2.id
        `);
        console.log(`✅ Deleted ${deleteResult.affectedRows} duplicate rows`);

        // Step 2: Add UNIQUE constraint on filename (if not already exists)
        try {
            await pool.query(`ALTER TABLE media_files ADD UNIQUE KEY uq_filename (filename)`);
            console.log('✅ UNIQUE constraint added on media_files.filename');
        } catch (e) {
            if (e.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️  UNIQUE constraint already exists');
            } else {
                throw e;
            }
        }

        console.log('✅ Done — media_files duplicates fixed');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

fixMediaDuplicates();
