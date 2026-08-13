require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function addAvatarColumn() {
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

        // Read and execute the SQL file
        const sqlPath = path.join(__dirname, '../database/add_avatar_column.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            console.log('Executing:', statement.substring(0, 50) + '...');
            await connection.query(statement);
        }

        console.log('✅ Successfully added avatar column to users table');
        
        // Verify the column was added
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM users WHERE Field = 'avatar'
        `);
        
        if (columns.length > 0) {
            console.log('✅ Verified: avatar column exists');
            console.log('Column details:', columns[0]);
        }

    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️  Avatar column already exists');
        } else {
            console.error('❌ Error adding avatar column:', error.message);
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
addAvatarColumn()
    .then(() => {
        console.log('Migration completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
