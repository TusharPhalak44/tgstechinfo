const { pool } = require('../src/config/database');

async function run() {
    console.log('Running migration: add schedule_type column to contents table...');
    try {
        await pool.query("ALTER TABLE contents ADD COLUMN schedule_type VARCHAR(50) DEFAULT 'date_only' AFTER scheduled_publish_date");
        console.log('✅ Successfully added column `schedule_type` to `contents` table.');
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME' || err.errno === 1060) {
            console.log('ℹ️ Column `schedule_type` already exists in `contents` table.');
            process.exit(0);
        } else {
            console.error('❌ Migration failed:', err.message);
            process.exit(1);
        }
    }
}

run();

