const { pool } = require('../src/config/database');

async function auditDB() {
    console.log('=== DATABASE AUDIT: TABLES, ROWS, FOREIGN KEYS, INDEXES ===');
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log(`TOTAL TABLES: ${tableNames.length}\n`);

    const tableDetails = [];

    for (const tableName of tableNames) {
        try {
            const [[countRes]] = await pool.query(`SELECT COUNT(*) as c FROM \`${tableName}\``);
            const [columns] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\``);
            const [indexes] = await pool.query(`SHOW INDEX FROM \`${tableName}\``);
            
            // Query information_schema for foreign keys
            const [fks] = await pool.query(`
                SELECT 
                    CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND REFERENCED_TABLE_NAME IS NOT NULL
            `, [tableName]);

            tableDetails.push({
                tableName,
                rows: countRes.c,
                columnCount: columns.length,
                columns: columns.map(c => ({
                    field: c.Field,
                    type: c.Type,
                    null: c.Null,
                    key: c.Key,
                    default: c.Default,
                    extra: c.Extra
                })),
                indexes: indexes.map(i => ({
                    keyName: i.Key_name,
                    column: i.Column_name,
                    nonUnique: i.Non_unique
                })),
                foreignKeys: fks
            });

            console.log(`Table: ${tableName} | Rows: ${countRes.c} | Cols: ${columns.length} | FKs: ${fks.length}`);
        } catch (err) {
            console.error(`Error inspecting table ${tableName}:`, err.message);
        }
    }

    console.log('\n=== FOREIGN KEY RELATIONSHIPS ===');
    for (const t of tableDetails) {
        for (const fk of t.foreignKeys) {
            console.log(`- ${t.tableName}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME} (${fk.CONSTRAINT_NAME})`);
        }
    }

    // Save full JSON for reporting
    const fs = require('fs');
    fs.writeFileSync('backend/scripts/db_inventory_output.json', JSON.stringify(tableDetails, null, 2));
    console.log('\nSaved full database inventory to backend/scripts/db_inventory_output.json');
}

auditDB().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
