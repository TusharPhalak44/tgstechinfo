require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function addIncludeLogoColumn() {
    let connection;
    
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log('Connected to database');

        // Check if column already exists
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM email_templates WHERE Field = 'include_logo'
        `);
        
        if (columns.length > 0) {
            console.log('ℹ️  include_logo column already exists');
            return;
        }

        // Read and execute the SQL file
        const sqlPath = path.join(__dirname, '../database/add_include_logo_to_email_templates.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            console.log('Executing:', statement.substring(0, 60) + '...');
            await connection.query(statement);
        }

        console.log('✅ Successfully added include_logo column to email_templates table');
        
        // Verify the column was added
        const [verifyColumns] = await connection.query(`
            SHOW COLUMNS FROM email_templates WHERE Field = 'include_logo'
        `);
        
        if (verifyColumns.length > 0) {
            console.log('✅ Verified: include_logo column exists');
            console.log('Column details:', verifyColumns[0]);
        }

    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️  include_logo column already exists');
        } else {
            console.error('❌ Error adding include_logo column:', error.message);
            throw error;
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run the migration
addIncludeLogoColumn()
    .then(() => {
        console.log('Migration completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
