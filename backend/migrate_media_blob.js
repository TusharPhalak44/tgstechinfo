const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');
const uploadDir = path.join(__dirname, 'uploads');

async function migrate() {
    const [rows] = await pool.query('SELECT id, filename FROM media_files WHERE file_data IS NULL');
    console.log('Files to migrate:', rows.length);
    let done = 0, skip = 0;
    for (const row of rows) {
        const fp = path.join(uploadDir, row.filename);
        if (fs.existsSync(fp)) {
            const data = fs.readFileSync(fp);
            await pool.query('UPDATE media_files SET file_data = ? WHERE id = ?', [data, row.id]);
            done++;
        } else {
            skip++;
        }
    }
    console.log('Migrated:', done, '| Skipped (file missing):', skip);
    process.exit(0);
}

migrate().catch(e => { console.error(e.message); process.exit(1); });
