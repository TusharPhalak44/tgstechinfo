const { pool } = require('../src/config/database');
const Media = require('../src/models/Media');
const fs = require('fs');
const path = require('path');

async function addMissingImageToMedia() {
    try {
        console.log('Adding missing banner image to media_files table...');
        
        const filename = 'banner_image-1785417647617-394199049.png';
        const uploadDir = path.join(__dirname, '../uploads');
        const filePath = path.join(uploadDir, filename);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log('✗ File not found in uploads directory');
            process.exit(1);
        }
        
        console.log('✓ File exists in uploads directory');
        
        // Get file info
        const stats = fs.statSync(filePath);
        console.log(`File size: ${stats.size} bytes`);
        
        // Check if already in media_files
        const [existing] = await pool.query(
            'SELECT id FROM media_files WHERE filename = ?',
            [filename]
        );
        
        if (existing.length > 0) {
            console.log('✗ Image already exists in media_files table');
            process.exit(0);
        }
        
        // Add to media_files
        await Media.create({
            filename: filename,
            original_name: filename,
            file_path: `/uploads/${filename}`,
            file_type: 'image',
            file_size: stats.size,
            mime_type: 'image/png',
            folder: 'Images',
            uploaded_by: 1 // Assuming user_id 1, adjust if needed
        });
        
        console.log('✓ Image added to media_files table successfully');
        console.log(`Filename: ${filename}`);
        console.log(`File Type: image`);
        console.log(`Folder: Images`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addMissingImageToMedia();
