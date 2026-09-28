const { pool } = require('../backend/src/config/database');

async function run() {
  const result = {};

  // 1. DB Name & Version
  const [[dbInfo]] = await pool.query("SELECT DATABASE() as db_name, VERSION() as version");
  result.dbName = dbInfo.db_name;
  result.version = dbInfo.version;

  // 2. Table Status (Engine, Collation, Rows)
  const [tables] = await pool.query("SHOW TABLE STATUS WHERE Name IN ('contents', 'users', 'categories', 'content_types')");
  result.tables = tables.map(t => ({
    name: t.Name,
    engine: t.Engine,
    collation: t.Collation,
    rows: t.Rows
  }));

  // Exact row counts
  const [[cntContents]] = await pool.query("SELECT COUNT(*) as c FROM contents");
  const [[cntUsers]] = await pool.query("SELECT COUNT(*) as c FROM users");
  const [[cntCategories]] = await pool.query("SELECT COUNT(*) as c FROM categories");
  const [[cntContentTypes]] = await pool.query("SELECT COUNT(*) as c FROM content_types");
  result.counts = {
    contents: cntContents.c,
    users: cntUsers.c,
    categories: cntCategories.c,
    content_types: cntContentTypes.c
  };

  // 3. Relevant Column Definitions
  const [columns] = await pool.query(`
    SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA, COLLATION_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() 
      AND (
        (TABLE_NAME = 'contents' AND COLUMN_NAME IN ('id', 'user_id', 'category_id', 'content_type_id'))
        OR (TABLE_NAME = 'users' AND COLUMN_NAME = 'id')
        OR (TABLE_NAME = 'categories' AND COLUMN_NAME = 'id')
        OR (TABLE_NAME = 'content_types' AND COLUMN_NAME = 'id')
      )
  `);
  result.columns = columns;

  // 4. Indexes
  const [idxContents] = await pool.query("SHOW INDEX FROM contents");
  const [idxUsers] = await pool.query("SHOW INDEX FROM users");
  const [idxCategories] = await pool.query("SHOW INDEX FROM categories");
  const [idxContentTypes] = await pool.query("SHOW INDEX FROM content_types");
  result.indexes = {
    contents: idxContents.map(i => ({ name: i.Key_name, col: i.Column_name, unique: i.Non_unique === 0, type: i.Index_type })),
    users: idxUsers.map(i => ({ name: i.Key_name, col: i.Column_name, unique: i.Non_unique === 0 })),
    categories: idxCategories.map(i => ({ name: i.Key_name, col: i.Column_name, unique: i.Non_unique === 0 })),
    content_types: idxContentTypes.map(i => ({ name: i.Key_name, col: i.Column_name, unique: i.Non_unique === 0 }))
  };

  // 5. Existing Foreign Keys on contents
  const [fks] = await pool.query(`
    SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'contents'
      AND REFERENCED_TABLE_NAME IS NOT NULL
  `);
  result.existingFKs = fks;

  // 6. Existing Triggers on contents
  const [triggers] = await pool.query("SHOW TRIGGERS LIKE 'contents'");
  result.triggers = triggers.map(tr => ({
    trigger: tr.Trigger,
    event: tr.Event,
    timing: tr.Timing,
    statement: tr.Statement
  }));

  // 7. Orphan Checks
  // User
  const [[userTotal]] = await pool.query("SELECT COUNT(*) as total, SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as nulls, SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) as non_nulls FROM contents");
  const [userOrphans] = await pool.query(`
    SELECT c.id, c.title, c.user_id 
    FROM contents c 
    LEFT JOIN users u ON c.user_id = u.id 
    WHERE c.user_id IS NOT NULL AND u.id IS NULL
  `);

  // Category
  const [[catTotal]] = await pool.query("SELECT COUNT(*) as total, SUM(CASE WHEN category_id IS NULL THEN 1 ELSE 0 END) as nulls, SUM(CASE WHEN category_id IS NOT NULL THEN 1 ELSE 0 END) as non_nulls FROM contents");
  const [catOrphans] = await pool.query(`
    SELECT c.id, c.title, c.category_id 
    FROM contents c 
    LEFT JOIN categories cat ON c.category_id = cat.id 
    WHERE c.category_id IS NOT NULL AND cat.id IS NULL
  `);

  // Content Type
  const [[typeTotal]] = await pool.query("SELECT COUNT(*) as total, SUM(CASE WHEN content_type_id IS NULL THEN 1 ELSE 0 END) as nulls, SUM(CASE WHEN content_type_id IS NOT NULL THEN 1 ELSE 0 END) as non_nulls FROM contents");
  const [typeOrphans] = await pool.query(`
    SELECT c.id, c.title, c.content_type_id 
    FROM contents c 
    LEFT JOIN content_types ct ON c.content_type_id = ct.id 
    WHERE c.content_type_id IS NOT NULL AND ct.id IS NULL
  `);

  result.orphans = {
    users: { total: userTotal.total, nulls: userTotal.nulls, nonNulls: userTotal.non_nulls, orphans: userOrphans.length, orphanRows: userOrphans },
    categories: { total: catTotal.total, nulls: catTotal.nulls, nonNulls: catTotal.non_nulls, orphans: catOrphans.length, orphanRows: catOrphans },
    content_types: { total: typeTotal.total, nulls: typeTotal.nulls, nonNulls: typeTotal.non_nulls, orphans: typeOrphans.length, orphanRows: typeOrphans }
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

run().catch(err => {
  console.error("Error inspecting baseline:", err);
  process.exit(1);
});
