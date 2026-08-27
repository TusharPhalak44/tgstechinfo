const { pool } = require('./src/config/database');

(async () => {
  try {
    const oldUrl = 'https://d4d0-182-156-137-106.ngrok-free.app';
    const newUrl = 'https://8a57-182-156-137-106.ngrok-free.app';
    
    console.log('Updating ngrok URL in database...');
    console.log('Old URL:', oldUrl);
    console.log('New URL:', newUrl);
    
    // Update webhook_url
    const [webhookResult] = await pool.query(
      'UPDATE contents SET webhook_url = REPLACE(webhook_url, ?, ?) WHERE webhook_url LIKE ?',
      [oldUrl, newUrl, `${oldUrl}%`]
    );
    console.log('Updated webhook_url for', webhookResult.affectedRows, 'rows');
    
    // Update HTML content
    const [contentResult] = await pool.query(
      'UPDATE contents SET content = REPLACE(content, ?, ?) WHERE content LIKE ?',
      [oldUrl, newUrl, `%${oldUrl}%`]
    );
    console.log('Updated content for', contentResult.affectedRows, 'rows');
    
    // Verify the update
    const [rows] = await pool.query('SELECT id, title, webhook_url FROM contents WHERE webhook_url LIKE ?', [`${newUrl}%`]);
    console.log('\nUpdated records:');
    console.log(JSON.stringify(rows, null, 2));
    
    await pool.end();
    console.log('\n✅ Update completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
