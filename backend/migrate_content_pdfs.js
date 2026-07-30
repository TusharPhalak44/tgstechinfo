const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');
const uploadDir = path.join(__dirname, 'uploads');

async function migrate() {
    // Get all contents with pdf_file
    const [contents] = await pool.query(
        'SELECT id, title, pdf_file, user_id FROM contents WHERE pdf_file IS NOT NULL AND pdf_file != ""'
    );
    console.log('Contents with PDF:', contents.length);

    let added = 0, updated = 0, missing = 0;

    for (const content of contents) {
        const filename = content.pdf_file;
        const filePath = path.join(uploadDir, filename);
        const fileExists = fs.existsSync(filePath);

        // Check if already in media_files
        const [existing] = await pool.query(
            'SELECT id, file_data FROM media_files WHERE filename = ?',
            [filename]
        );

        const fileData = fileExists ? fs.readFileSync(filePath) : null;
        const fileSize = fileExists ? fs.statSync(filePath).size : 0;

        if (existing.length === 0) {
            // Insert new record
            await pool.query(
                `INSERT INTO media_files (filename, original_name, file_path, file_type, file_size, mime_type, folder, uploaded_by, file_data)
                 VALUES (?, ?, ?, 'document', ?, 'application/pdf', 'Documents', ?, ?)`,
                [filename, filename, `/uploads/${filename}`, fileSize, content.user_id || null, fileData]
            );
            added++;
            console.log(`Added: ${filename} (file ${fileExists ? 'found' : 'missing - DB only'})`);
        } else if (!existing[0].file_data && fileData) {
            // Update file_data if missing
            await pool.query('UPDATE media_files SET file_data = ? WHERE filename = ?', [fileData, filename]);
            updated++;
            console.log(`Updated file_data: ${filename}`);
        } else if (!fileExists && !existing[0].file_data) {
            missing++;
            console.log(`Skipped (no file, no data): ${filename}`);
        }
    }

    console.log(`\nDone — Added: ${added}, Updated: ${updated}, Missing: ${missing}`);
    process.exit(0);
}

migrate().catch(e => { console.error(e.message); process.exit(1); });
