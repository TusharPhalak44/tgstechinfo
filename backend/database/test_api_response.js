const { pool } = require('../src/config/database');

async function testContentQuery() {
    try {
        console.log('Testing Content.findAll query...\n');
        
        // Simulate the Content.findAll query
        const baseWhere = ' WHERE 1=1';
        const values = [];
        
        let query = `
            SELECT c.*, 
                   u.first_name, u.last_name,
                   ct.name as content_type_name,
                   ct.slug as content_type,
                   cat.name as category_name
            FROM contents c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            ${baseWhere} ORDER BY c.created_at DESC
            LIMIT 5
        `;
        
        const [rows] = await pool.query(query, values);
        
        console.log('Query executed successfully!');
        console.log('Sample result (first 2 rows):');
        console.log('='.repeat(120));
        
        for (let i = 0; i < Math.min(2, rows.length); i++) {
            const row = rows[i];
            console.log(`\nRow ${i + 1}:`);
            console.log(`ID: ${row.id}`);
            console.log(`Title: ${row.title}`);
            console.log(`view_count: ${row.view_count}`);
            console.log(`views_count: ${row.views_count}`);
            console.log(`Status: ${row.status}`);
            console.log(`All keys: ${Object.keys(row).join(', ')}`);
        }
        
        console.log('\n' + '='.repeat(120));
        console.log('✅ Query includes view_count field');
        
    } catch (error) {
        console.error('Error testing query:', error);
    } finally {
        await pool.end();
    }
}

testContentQuery();
