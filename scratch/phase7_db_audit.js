const { pool } = require('../backend/src/config/database');

(async () => {
  try {
    const [fks] = await pool.execute(`
      SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contents' AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.log('=== Contents Foreign Keys ===');
    console.table(fks);

    const [rc] = await pool.execute(`
      SELECT CONSTRAINT_NAME, DELETE_RULE, UPDATE_RULE
      FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'contents'
    `);
    console.log('=== Contents Referential Constraints ===');
    console.table(rc);

    const [types] = await pool.execute(`
      SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND ((TABLE_NAME = 'contents' AND COLUMN_NAME IN ('user_id', 'category_id', 'content_type_id'))
          OR (TABLE_NAME = 'users' AND COLUMN_NAME = 'id')
          OR (TABLE_NAME = 'categories' AND COLUMN_NAME = 'id')
          OR (TABLE_NAME = 'content_types' AND COLUMN_NAME = 'id'))
    `);
    console.log('=== Column Types ===');
    console.table(types);

    const [roles] = await pool.execute(`
      SELECT role, COUNT(*) as count FROM users GROUP BY role
    `);
    console.log('=== Users.role Breakdown ===');
    console.table(roles);

    const [orphans] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN c.user_id IS NOT NULL AND u.id IS NULL THEN 1 ELSE 0 END) as orphan_users,
        SUM(CASE WHEN c.category_id IS NOT NULL AND cat.id IS NULL THEN 1 ELSE 0 END) as orphan_categories,
        SUM(CASE WHEN c.content_type_id IS NOT NULL AND ct.id IS NULL THEN 1 ELSE 0 END) as orphan_types,
        SUM(CASE WHEN c.user_id IS NULL THEN 1 ELSE 0 END) as null_users,
        SUM(CASE WHEN c.category_id IS NULL THEN 1 ELSE 0 END) as null_categories,
        SUM(CASE WHEN c.content_type_id IS NULL THEN 1 ELSE 0 END) as null_types,
        COUNT(*) as total_contents
      FROM contents c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN content_types ct ON c.content_type_id = ct.id
    `);
    console.log('=== Contents Integrity Check ===');
    console.table(orphans);

    const [viewSync] = await pool.execute(`
      SELECT 
        COUNT(*) as unsynced_rows,
        SUM(view_count) as total_view_count,
        SUM(views_count) as total_views_count
      FROM contents
      WHERE view_count != views_count
    `);
    console.log('=== View Count Sync ===');
    console.table(viewSync);

    const [triggers] = await pool.execute(`
      SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING
      FROM information_schema.TRIGGERS
      WHERE TRIGGER_SCHEMA = DATABASE()
    `);
    console.log('=== Triggers ===');
    console.table(triggers);

    const [tables] = await pool.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('users', 'contents', 'user_roles', 'form_submissions', 'landing_page_submissions')
    `);
    console.log('=== Key Tables ===');
    console.table(tables);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
