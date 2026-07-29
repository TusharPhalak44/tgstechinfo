const path = require('path');
const fs = require('fs');
const { pool } = require('../src/config/database');

const uploadDir = path.join(__dirname, '../uploads');
console.log('Migrating existing media files from:', uploadDir);

async function migrateMediaFiles() {
    try {
        // Check if upload directory exists
        if (!fs.existsSync(uploadDir)) {
            console.log('Upload directory does not exist');
            return;
        }

        // Read all files from uploads directory
        const files = fs.readdirSync(uploadDir);
        console.log('Found files:', files.length);

        // Filter out hidden files and directories
        const validFiles = files.filter(filename => {
            const filePath = path.join(uploadDir, filename);
            const stats = fs.statSync(filePath);
            return stats.isFile() && !filename.startsWith('.');
        });

        console.log('Valid files to migrate:', validFiles.length);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const filename of validFiles) {
            try {
                const filePath = path.join(uploadDir, filename);
                const stats = fs.statSync(filePath);
                const ext = path.extname(filename).toLowerCase();

                // Determine file type and folder
                let fileType = 'other';
                let folder = 'Documents';

                if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                    fileType = 'image';
                    folder = 'Images';
                } else if (['.mp4', '.mov', '.avi'].includes(ext)) {
                    fileType = 'video';
                    folder = 'Videos';
                } else if (ext === '.pdf') {
                    fileType = 'document';
                    folder = 'Documents';
                }

                // Check if file already exists in database
                const [existing] = await pool.query(
                    'SELECT id FROM media_files WHERE filename = ?',
                    [filename]
                );

                if (existing.length > 0) {
                    console.log(`Skipping ${filename} - already in database`);
                    skippedCount++;
                    continue;
                }

                // Insert into database
                const query = `
                    INSERT INTO media_files (filename, original_name, file_path, file_type, file_size, mime_type, folder, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;

                await pool.query(query, [
                    filename,
                    filename, // Use filename as original name for existing files
                    `/uploads/${filename}`,
                    fileType,
                    stats.size,
                    null, // MIME type unknown for existing files
                    folder,
                    stats.mtime // Use file modification time as creation time
                ]);

                console.log(`Migrated: ${filename}`);
                migratedCount++;
            } catch (error) {
                console.error(`Error migrating ${filename}:`, error.message);
            }
        }

        console.log(`\nMigration complete:`);
        console.log(`Migrated: ${migratedCount} files`);
        console.log(`Skipped: ${skippedCount} files (already in database)`);

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateMediaFiles();
