const { pool } = require('../src/config/database');

async function checkLatestContentImage() {
    try {
        console.log('Checking latest content with banner image...');
        
        // Get latest content with banner image
        const query = `
            SELECT id, title, banner_image, user_id, created_at
            FROM contents
            WHERE banner_image IS NOT NULL 
            ORDER BY created_at DESC
            LIMIT 1
        `;
        
        const [contents] = await pool.query(query);
        
        if (contents.length === 0) {
            console.log('No content with banner image found');
            process.exit(0);
        }
        
        const latestContent = contents[0];
        console.log('\n=== Latest Content with Banner Image ===');
        console.log(`ID: ${latestContent.id}`);
        console.log(`Title: ${latestContent.title}`);
        console.log(`Banner Image: ${latestContent.banner_image}`);
        console.log(`Created At: ${latestContent.created_at}`);
        
        // Check if this image is in media_files table
        const mediaQuery = `
            SELECT * FROM media_files 
            WHERE filename = ?
        `;
        
        const [mediaFiles] = await pool.query(mediaQuery, [latestContent.banner_image]);
        
        console.log('\n=== Media Files Table Check ===');
        if (mediaFiles.length > 0) {
            console.log('✓ Image found in media_files table');
            console.log(`Media ID: ${mediaFiles[0].id}`);
            console.log(`File Type: ${mediaFiles[0].file_type}`);
            console.log(`Folder: ${mediaFiles[0].folder}`);
        } else {
            console.log('✗ Image NOT found in media_files table');
        }
        
        // Check all recent media files
        const recentMediaQuery = `
            SELECT * FROM media_files 
            ORDER BY created_at DESC
            LIMIT 5
        `;
        
        const [recentMedia] = await pool.query(recentMediaQuery);
        console.log('\n=== Recent Media Files (Last 5) ===');
        recentMedia.forEach(media => {
            console.log(`- ${media.filename} (${media.file_type}) - ${media.created_at}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkLatestContentImage();
