const { pool } = require('../src/config/database');

async function check() {
    const [triggers] = await pool.query('SHOW TRIGGERS');
    const [views] = await pool.query("SHOW FULL TABLES WHERE Table_type = 'VIEW'");
    const [procedures] = await pool.query('SHOW PROCEDURE STATUS WHERE Db = DATABASE()');
    console.log('TRIGGERS:', triggers.length);
    console.log('VIEWS:', views.length);
    console.log('PROCEDURES:', procedures.length);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
