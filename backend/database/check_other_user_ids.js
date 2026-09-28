const { pool } = require('../src/config/database');

async function checkOtherUserIds() {
    try {
        const [rows] = await pool.query(`
            SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME IN ('user_id', 'author_id')
        `);
        console.log('Tables with user_id/author_id:');
        rows.forEach(r => console.log(`${r.TABLE_NAME}.${r.COLUMN_NAME}: ${r.COLUMN_TYPE} (Nullable: ${r.IS_NULLABLE})`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkOtherUserIds();
