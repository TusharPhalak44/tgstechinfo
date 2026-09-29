const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uploadDir = path.resolve(__dirname, '../uploads');

// Map extensions to mime types
const MIME_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.avif': 'image/avif',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

function getFileType(ext) {
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'].includes(ext)) return { type: 'image', folder: 'Images' };
    if (['.mp4', '.mov', '.avi'].includes(ext)) return { type: 'video', folder: 'Videos' };
    if (['.pdf', '.doc', '.docx'].includes(ext)) return { type: 'document', folder: 'Documents' };
    return { type: 'other', folder: 'Documents' };
}

async function runMigrationAndCleanup() {
    console.log('--- Step 1: Connecting to MySQL Databases ---');
    const pubConn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: 'publishing_platform'
    });

    let tgsConn = null;
    try {
        tgsConn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'tgstechinfo'
        });
    } catch (e) {
        console.log('tgstechinfo connection optional:', e.message);
    }

    if (!fs.existsSync(uploadDir)) {
        console.error('Upload directory not found:', uploadDir);
        process.exit(1);
    }

    const items = fs.readdirSync(uploadDir);
    const files = items.filter(f => {
        const fullPath = path.join(uploadDir, f);
        return fs.statSync(fullPath).isFile() && !f.startsWith('.');
    });

    console.log(`Found ${files.length} physical files in backend/uploads directory.`);

    // Check existing records in publishing_platform
    const [pubRows] = await pubConn.query('SELECT filename, (file_data IS NOT NULL AND LENGTH(file_data) > 0) as has_blob FROM media_files');
    const pubMap = new Map();
    pubRows.forEach(r => pubMap.set(r.filename, !!r.has_blob));

    console.log(`\n--- Step 2: Migrating missing files into MySQL Database (publishing_platform) ---`);
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const filename of files) {
        const filePath = path.join(uploadDir, filename);
        const stats = fs.statSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        const { type: fileType, folder } = getFileType(ext);
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

        const fileData = fs.readFileSync(filePath);

        if (!pubMap.has(filename)) {
            // Insert new record with BLOB
            await pubConn.query(
                `INSERT INTO media_files (filename, original_name, file_path, file_type, file_size, mime_type, folder, file_data, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [filename, filename, `/uploads/${filename}`, fileType, stats.size, mimeType, folder, fileData, stats.mtime]
            );
            insertedCount++;
        } else if (!pubMap.get(filename)) {
            // Update existing record with BLOB
            await pubConn.query(
                `UPDATE media_files SET file_data = ?, file_size = ?, mime_type = ? WHERE filename = ?`,
                [fileData, stats.size, mimeType, filename]
            );
            updatedCount++;
        } else {
            skippedCount++;
        }

        // Also sync into tgstechinfo if connected
        if (tgsConn) {
            try {
                const [tgsRows] = await tgsConn.query('SELECT id, (file_data IS NOT NULL AND LENGTH(file_data) > 0) as has_blob FROM media_files WHERE filename = ?', [filename]);
                if (tgsRows.length === 0) {
                    await tgsConn.query(
                        `INSERT INTO media_files (filename, original_name, file_path, file_type, file_size, mime_type, folder, file_data, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [filename, filename, `/uploads/${filename}`, fileType, stats.size, mimeType, folder, fileData, stats.mtime]
                    );
                } else if (!tgsRows[0].has_blob) {
                    await tgsConn.query(
                        `UPDATE media_files SET file_data = ?, file_size = ?, mime_type = ? WHERE filename = ?`,
                        [fileData, stats.size, mimeType, filename]
                    );
                }
            } catch (err) {
                // Ignore individual sync errors on secondary DB
            }
        }
    }

    console.log(`✅ Database migration completed:`);
    console.log(`   - Newly inserted into DB with BLOB: ${insertedCount}`);
    console.log(`   - Updated with BLOB: ${updatedCount}`);
    console.log(`   - Already had BLOB in DB: ${skippedCount}`);

    // Verify all files are in publishing_platform.media_files with file_data
    console.log(`\n--- Step 3: Verifying Database Integrity Before Cleanup ---`);
    const [verifyRows] = await pubConn.query('SELECT COUNT(*) as total, SUM(CASE WHEN file_data IS NOT NULL AND LENGTH(file_data) > 0 THEN 1 ELSE 0 END) as with_blob FROM media_files');
    console.log(`Total records in DB media_files: ${verifyRows[0].total}`);
    console.log(`Records with binary BLOB in DB: ${verifyRows[0].with_blob}`);

    // Ensure all 451 files from disk are confirmed in DB
    const [finalCheck] = await pubConn.query('SELECT filename FROM media_files WHERE file_data IS NOT NULL');
    const safeSet = new Set(finalCheck.map(r => r.filename));
    const unsafeFiles = files.filter(f => !safeSet.has(f));

    if (unsafeFiles.length > 0) {
        console.error('❌ SAFETY ABORT: Some files are NOT confirmed in DB:', unsafeFiles);
        process.exit(1);
    }
    console.log(`✅ 100% of all ${files.length} physical files are confirmed safe in MySQL database!`);

    console.log(`\n--- Step 4: Deleting Physical Files from backend/uploads Directory ---`);
    let deletedCount = 0;
    for (const filename of files) {
        const filePath = path.join(uploadDir, filename);
        try {
            fs.unlinkSync(filePath);
            deletedCount++;
        } catch (e) {
            console.error(`Failed to delete ${filename}:`, e.message);
        }
    }

    console.log(`✅ Successfully deleted ${deletedCount} files from backend/uploads directory.`);
    console.log(`ℹ️ Preserved backend/uploads directory and backend/uploads/branding/ subfolder.`);

    const remaining = fs.readdirSync(uploadDir);
    console.log(`Remaining items in backend/uploads:`, remaining);

    await pubConn.end();
    if (tgsConn) await tgsConn.end();
    console.log(`\n🎉 ALL DONE! All media is now safely served 100% directly from MySQL database.`);
}

runMigrationAndCleanup().catch(err => {
    console.error('Error during execution:', err);
    process.exit(1);
});
