const pool = require('./src/config/database').pool;
const fs = require('fs');
const path = require('path');

async function migrateVideosToMedia() {
  try {
    console.log('Starting video migration...');

    // Get all contents with video_file
    const [contents] = await pool.query(
      'SELECT id, video_file, user_id, title FROM contents WHERE video_file IS NOT NULL AND video_file != ""'
    );

    console.log(`Found ${contents.length} contents with video files`);

    let added = 0;
    let skipped = 0;

    for (const content of contents) {
      const videoFilename = content.video_file;
      
      // Check if already in media_files
      const [existing] = await pool.query(
        'SELECT id FROM media_files WHERE filename = ?',
        [videoFilename]
      );

      if (existing.length > 0) {
        console.log(`Skipping ${videoFilename} - already in media_files`);
        skipped++;
        continue;
      }

      // Get file info from filesystem
      const filePath = path.join(__dirname, 'uploads', videoFilename);
      let fileSize = 0;
      let fileData = null;

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        fileSize = stats.size;
        
        // Read file data for videos (no size limit - store in database like images)
        try {
          fileData = fs.readFileSync(filePath);
        } catch (err) {
          console.warn(`Could not read file data for ${videoFilename}:`, err.message);
        }
      }

      // Determine mime type from extension
      const ext = path.extname(videoFilename).toLowerCase();
      let mimeType = 'video/mp4';
      if (ext === '.mov') mimeType = 'video/quicktime';
      if (ext === '.avi') mimeType = 'video/x-msvideo';

      // Insert into media_files
      await pool.query(
        `INSERT INTO media_files (filename, original_name, file_path, file_type, file_size, mime_type, folder, uploaded_by, file_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          videoFilename,
          videoFilename, // Use filename as original_name since we don't have the original
          `/uploads/${videoFilename}`,
          'video',
          fileSize,
          mimeType,
          'Videos',
          content.user_id || null,
          fileData
        ]
      );

      console.log(`✓ Added ${videoFilename} to media_files`);
      added++;
    }

    console.log(`\nMigration complete!`);
    console.log(`Added: ${added}`);
    console.log(`Skipped: ${skipped}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateVideosToMedia();
