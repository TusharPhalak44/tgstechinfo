const { pool } = require('../src/config/database');

const migrate = async () => {
    try {
        // Drop old table and recreate with only extra_fields (no hardcoded columns)
        await pool.query(`DROP TABLE IF EXISTS landing_page_submissions`);

        await pool.query(`
            CREATE TABLE landing_page_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                content_id INT NULL,
                extra_fields JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE SET NULL
            )
        `);

        console.log('✅ landing_page_submissions migrated successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err.message);
        process.exit(1);
    }
};

migrate();
