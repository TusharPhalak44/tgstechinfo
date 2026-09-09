const pool = require('./src/config/database').pool;

pool.query('SELECT * FROM media_files WHERE file_type = ? ORDER BY id DESC LIMIT 5', ['video'])
  .then(([rows]) => {
    console.log('Video files in DB:');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
