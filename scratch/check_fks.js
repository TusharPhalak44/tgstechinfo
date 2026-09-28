const path = require('path');
const mysql = require(path.join(__dirname, '../backend/node_modules/mysql2/promise'));

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'publishing_platform'
    });
    
    // Check total contents
    const [[{ totalContents }]] = await conn.query("SELECT COUNT(*) as totalContents FROM contents");
    console.log('Total contents:', totalContents);

    // Check NULLs in user_id, category_id, content_type_id
    const [[nullCheck]] = await conn.query(`
      SELECT 
        SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as null_user,
        SUM(CASE WHEN category_id IS NULL THEN 1 ELSE 0 END) as null_category,
        SUM(CASE WHEN content_type_id IS NULL THEN 1 ELSE 0 END) as null_type
      FROM contents
    `);
    console.log('NULL counts:', nullCheck);

    // Check details of rows with NULLs
    const [nullRows] = await conn.query("SELECT id, title, user_id, category_id, content_type_id, status FROM contents WHERE user_id IS NULL OR category_id IS NULL OR content_type_id IS NULL");
    console.log('Rows with NULLs:', nullRows);

    // Check orphan user_ids
    const [orphanUsers] = await conn.query(`
      SELECT c.id, c.title, c.user_id 
      FROM contents c 
      LEFT JOIN users u ON c.user_id = u.id 
      WHERE c.user_id IS NOT NULL AND u.id IS NULL
    `);
    console.log('Orphan user_id count:', orphanUsers.length);

    // Check orphan category_ids
    const [orphanCats] = await conn.query(`
      SELECT c.id, c.title, c.category_id 
      FROM contents c 
      LEFT JOIN categories cat ON c.category_id = cat.id 
      WHERE c.category_id IS NOT NULL AND cat.id IS NULL
    `);
    console.log('Orphan category_id count:', orphanCats.length);

    // Check orphan content_type_ids
    const [orphanTypes] = await conn.query(`
      SELECT c.id, c.title, c.content_type_id 
      FROM contents c 
      LEFT JOIN content_types ct ON c.content_type_id = ct.id 
      WHERE c.content_type_id IS NOT NULL AND ct.id IS NULL
    `);
    console.log('Orphan content_type_id count:', orphanTypes.length);

    // Check existing foreign keys on contents
    const [existingFks] = await conn.query(`
      SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'publishing_platform' AND TABLE_NAME = 'contents' AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.log('Existing FKs on contents:', existingFks);

    await conn.end();
  } catch(e) {
    console.error('Error:', e);
  }
})();
