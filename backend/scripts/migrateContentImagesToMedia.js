const { pool } = require('../src/config/database');
const Media = require('../src/models/Media');
const fs = require('fs');
const path = require('path');

async function migrateContentImagesToMedia() {
    try {
        console.log('Starting migration of content banner images to media_files table...');
        
        // Get content created on July 29th and 30th, 2026
        const query = `
            SELECT id, title, banner_image, pdf_file, user_id, created_at
            FROM contents
            WHERE banner_image IS NOT NULL 
            ORDER BY created_at DESC
        `;
        
        const [contents] = await pool.query(query);
        console.log(`Found ${contents.length} content items with banner images from July 29-30, 2026`);
        
        const uploadDir = path.join(__dirname, '../uploads');
        let addedCount = 0;
        let skippedCount = 0;
        
        for (const content of contents) {
            const filePath = path.join(uploadDir, content.banner_image);
            
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                console.log(`Skipping ${content.banner_image} - file not found`);
                skippedCount++;
                continue;
            }
            
            // Check if already in media_files
            const [existing] = await pool.query(
                'SELECT id FROM media_files WHERE filename = ?',
                [content.banner_image]
            );
            
            if (existing.length > 0) {
                console.log(`Skipping ${content.banner_image} - already in media_files`);
                skippedCount++;
                continue;
            }
            
            // Get file info
            const stats = fs.statSync(filePath);
            const ext = content.banner_image.split('.').pop().toLowerCase();
            const fileType = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? 'image' : 'other';
            
            // Add to media_files
            await Media.create({
                filename: content.banner_image,
                original_name: content.banner_image,
                file_path: `/uploads/${content.banner_image}`,
                file_type: fileType,
                file_size: stats.size,
                mime_type: `image/${ext}`,
                folder: 'Images',
                uploaded_by: content.user_id
            });
            
            console.log(`✓ Added: ${content.banner_image} (Content: ${content.title})`);
            addedCount++;
        }
        
        console.log('\n=== Migration Complete ===');
        console.log(`Total content items processed: ${contents.length}`);
        console.log(`Images added to media_files: ${addedCount}`);
        console.log(`Images skipped (already exist or file missing): ${skippedCount}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrateContentImagesToMedia();
