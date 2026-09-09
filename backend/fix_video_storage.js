const pool = require('./src/config/database').pool;
const fs = require('fs');
const path = require('path');

async function fixVideoStorage() {
  try {
    console.log('Fixing video storage for webinar...');

    const videoFilename = 'video_file-1788892391415-361206632.mp4';
    
    // Check if video exists in database
    const [existing] = await pool.query(
      'SELECT id, file_data FROM media_files WHERE filename = ?',
      [videoFilename]
    );

    if (existing.length > 0 && existing[0].file_data) {
      console.log('Video already has file_data in database:', videoFilename);
      process.exit(0);
    }

    // Try to find the video file in uploads directory
    const filePath = path.join(__dirname, 'uploads', videoFilename);
    
    if (fs.existsSync(filePath)) {
      console.log('Found video file in uploads directory:', filePath);
      const fileData = fs.readFileSync(filePath);
      const stats = fs.statSync(filePath);
      
      console.log('Video file size:', stats.size, 'bytes');
      
      // Update the database with file data
      await pool.query(
        'UPDATE media_files SET file_data = ?, file_size = ? WHERE filename = ?',
        [fileData, stats.size, videoFilename]
      );
      
      console.log('✓ Video file data stored in database successfully');
      
      // Optionally clean up the file from filesystem
      try {
        fs.unlinkSync(filePath);
        console.log('✓ Cleaned up video file from filesystem');
      } catch (cleanupError) {
        console.warn('Could not clean up video file from filesystem:', cleanupError.message);
      }
      
    } else {
      console.log('Video file not found in uploads directory:', filePath);
      console.log('You will need to re-upload the video through the admin panel');
    }
    
    console.log('Video storage fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing video storage:', error);
    process.exit(1);
  }
}

fixVideoStorage();