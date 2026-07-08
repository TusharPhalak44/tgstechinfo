const { pool } = require('../src/config/database');

const migrate = async () => {
    try {
        // Add pdf_file to contents
        await pool.query(`
            ALTER TABLE contents 
            ADD COLUMN IF NOT EXISTS pdf_file VARCHAR(255) NULL AFTER banner_image
        `).catch(() => {});

        // Add custom_fields to contents
        await pool.query(`
            ALTER TABLE contents 
            ADD COLUMN IF NOT EXISTS custom_fields JSON NULL AFTER pdf_file
        `).catch(() => {});

        // Add webhook_url to contents
        await pool.query(`
            ALTER TABLE contents 
            ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(500) NULL AFTER custom_fields
        `).catch(() => {});

        // Create landing_page_submissions if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS landing_page_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                contact_number VARCHAR(20) NOT NULL,
                content_id INT NULL,
                extra_fields JSON NULL,
                has_access BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE SET NULL
            )
        `);

        console.log('✅ Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err.message);
        process.exit(1);
    }
};

migrate();
