const path = require('path');
const fs = require('fs');
const mysql = require(path.join(__dirname, '../backend/node_modules/mysql2/promise'));

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'publishing_platform'
    });

    const backupDir = path.join(__dirname, '../backend/database/backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 1. Check constraints on comments, content_revisions, view_count_backup
    const [fks] = await conn.query(`
      SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'publishing_platform' 
        AND (TABLE_NAME IN ('comments', 'content_revisions', 'view_count_backup') 
             OR REFERENCED_TABLE_NAME IN ('comments', 'content_revisions', 'view_count_backup'))
    `);
    console.log('Foreign key check on target tables:', fks);

    // 2. Export DDL + Data for view_count_backup
    const [[ddlBackup]] = await conn.query("SHOW CREATE TABLE view_count_backup");
    const [rowsBackup] = await conn.query("SELECT * FROM view_count_backup");
    
    let backupSql = `-- Backup of view_count_backup (${rowsBackup.length} rows)\n`;
    backupSql += `${ddlBackup['Create Table']};\n\n`;
    if (rowsBackup.length > 0) {
      backupSql += `INSERT INTO view_count_backup (${Object.keys(rowsBackup[0]).join(', ')}) VALUES\n`;
      const valStrings = rowsBackup.map(r => `(${Object.values(r).map(v => v === null ? 'NULL' : typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v).join(', ')})`);
      backupSql += valStrings.join(',\n') + ';\n';
    }
    fs.writeFileSync(path.join(backupDir, 'view_count_backup.sql'), backupSql);
    console.log(`Saved ${rowsBackup.length} rows to backend/database/backups/view_count_backup.sql`);

    // 3. Export DDL for comments and content_revisions
    let archivedSql = `-- Archived DDL for empty tables: comments, content_revisions\n`;
    try {
      const [[ddlComments]] = await conn.query("SHOW CREATE TABLE comments");
      archivedSql += `${ddlComments['Create Table']};\n\n`;
    } catch(e) {
      console.log('comments DDL error:', e.message);
    }
    try {
      const [[ddlRevisions]] = await conn.query("SHOW CREATE TABLE content_revisions");
      archivedSql += `${ddlRevisions['Create Table']};\n\n`;
    } catch(e) {
      console.log('content_revisions DDL error:', e.message);
    }
    fs.writeFileSync(path.join(backupDir, 'archived_empty_tables.sql'), archivedSql);
    console.log('Saved DDL to backend/database/backups/archived_empty_tables.sql');

    // 4. Drop the verified tables safely
    console.log('Dropping comments and content_revisions...');
    await conn.query("DROP TABLE IF EXISTS comments, content_revisions");
    console.log('Dropped comments and content_revisions.');

    console.log('Dropping view_count_backup...');
    await conn.query("DROP TABLE view_count_backup");
    console.log('Dropped view_count_backup.');

    // 5. Verify remaining tables count
    const [tables] = await conn.query("SHOW TABLES");
    console.log(`MySQL catalog now contains ${tables.length} tables (down from 77).`);

    await conn.end();
  } catch(error) {
    console.error('Error during backup and drop:', error);
  }
})();
