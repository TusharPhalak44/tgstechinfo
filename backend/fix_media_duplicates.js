const { pool } = require('./src/config/database');

async function fix() {
    // Delete duplicates, keep the row with lowest id per filename
    await pool.query(`
        DELETE m1 FROM media_files m1
        INNER JOIN media_files m2
        WHERE m1.filename = m2.filename AND m1.id > m2.id
    `);
    console.log('Duplicates deleted.');

    // Add UNIQUE constraint (ignore if already exists)
    try {
        await pool.query('ALTER TABLE media_files ADD UNIQUE KEY uq_filename (filename)');
        console.log('UNIQUE constraint added on filename.');
    } catch (e) {
        if (e.code === 'ER_DUP_KEYNAME') console.log('UNIQUE constraint already exists.');
        else throw e;
    }

    await pool.end();
}

fix().catch(err => { console.error(err); process.exit(1); });
