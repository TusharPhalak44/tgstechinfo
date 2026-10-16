const { pool } = require('../src/config/database');

async function testUpdate() {
    try {
        await pool.query('CREATE TEMPORARY TABLE temp_c (id INT, user_id INT)');
        // Insert 12 sample contents
        for (let i = 1; i <= 12; i++) {
            await pool.query('INSERT INTO temp_c VALUES (?, 2)', [i]);
        }

        // Run the 5 per user query
        await pool.query(`
            UPDATE temp_c c
            JOIN (
                SELECT id, ROW_NUMBER() OVER (ORDER BY id ASC) AS rn 
                FROM temp_c
            ) ranked_c ON c.id = ranked_c.id
            JOIN (
                SELECT id, ROW_NUMBER() OVER (ORDER BY id ASC) AS user_rn 
                FROM users 
                WHERE role = 'user' AND email != '' AND id >= 7
            ) ranked_u ON FLOOR((ranked_c.rn - 1) / 5) + 1 = ranked_u.user_rn
            SET c.user_id = ranked_u.id
        `);

        const [results] = await pool.query('SELECT user_id, COUNT(*) as count FROM temp_c GROUP BY user_id');
        console.log('Result counts per user:');
        console.table(results);
    } catch(e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

testUpdate();
