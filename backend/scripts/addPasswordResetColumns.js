const { pool } = require('../src/config/database');

async function addPasswordResetColumns() {
    try {
        console.log('Adding password reset columns to users table...\n');

        // Check if columns already exist
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users'
            AND COLUMN_NAME IN ('reset_token', 'reset_token_expires')
        `);

        const existingColumns = columns.map(col => col.COLUMN_NAME);

        if (existingColumns.includes('reset_token') && existingColumns.includes('reset_token_expires')) {
            console.log('✅ Password reset columns already exist in users table.');
            return;
        }

        // Add reset_token column if it doesn't exist
        if (!existingColumns.includes('reset_token')) {
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN reset_token VARCHAR(255) NULL
            `);
            console.log('✅ Added reset_token column to users table');
        }

        // Add reset_token_expires column if it doesn't exist
        if (!existingColumns.includes('reset_token_expires')) {
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN reset_token_expires DATETIME NULL
            `);
            console.log('✅ Added reset_token_expires column to users table');
        }

        console.log('\n✅ Password reset columns added successfully.');
        
        await pool.end();
    } catch (error) {
        console.error('Error adding password reset columns:', error);
        process.exit(1);
    }
}

addPasswordResetColumns();
