const { pool } = require('../src/config/database');

async function run() {
    try {
        console.log('Altering contents.status enum...');
        await pool.query(`
            ALTER TABLE contents 
            MODIFY COLUMN status ENUM('draft','pending','review','changes_requested','approved','published','rejected','scheduled','archived') 
            DEFAULT 'draft'
        `);
        console.log('✅ contents.status enum updated successfully');
        
        const [cols] = await pool.query("DESCRIBE contents");
        const statusCol = cols.find(c => c.Field === 'status');
        console.log('New status column definition:', statusCol);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating status enum:', err);
        process.exit(1);
    }
}

run();
