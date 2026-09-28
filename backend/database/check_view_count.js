const { pool } = require('../src/config/database');

async function checkViewCountColumn() {
    try {
        console.log('Checking view_count column in contents table...\n');
        
        // Check if view_count column exists
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contents'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('Contents table columns:');
        console.log('='.repeat(80));
        
        let hasViewCount = false;
        for (const col of columns) {
            console.log(`${col.COLUMN_NAME.padEnd(30)} | ${col.DATA_TYPE.padEnd(15)} | ${col.IS_NULLABLE}`);
            if (col.COLUMN_NAME === 'view_count') {
                hasViewCount = true;
            }
        }
        
        console.log('\n' + '='.repeat(80));
        
        if (hasViewCount) {
            console.log('✅ view_count column EXISTS in contents table');
            
            // Check actual data
            const [sampleData] = await pool.query(`
                SELECT id, title, view_count, status 
                FROM contents 
                LIMIT 5
            `);
            
            console.log('\nSample view_count data:');
            console.log('='.repeat(80));
            for (const row of sampleData) {
                console.log(`ID: ${row.id} | Title: ${row.title.substring(0, 40)} | Views: ${row.view_count} | Status: ${row.status}`);
            }
        } else {
            console.log('❌ view_count column DOES NOT EXIST in contents table');
        }
        
    } catch (error) {
        console.error('Error checking view_count:', error);
    } finally {
        await pool.end();
    }
}

checkViewCountColumn();
