/**
 * Migration Script: Add Missing Content Columns
 * 
 * This script adds all columns to the contents table that are required
 * by the Content.js model but might be missing from the database.
 * 
 * Run with: node scripts/addMissingContentColumns.js
 */

require('dotenv').config();
const { pool } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function addMissingContentColumns() {
    let connection;
    try {
        console.log('🔄 Starting migration: Add Missing Content Columns');
        console.log('─'.repeat(60));

        connection = await pool.getConnection();

        // Read the SQL migration file
        const sqlFile = path.join(__dirname, '../database/add_missing_content_columns.sql');
        const sqlScript = fs.readFileSync(sqlFile, 'utf8');

        // Execute the ALTER TABLE statement directly
        console.log('📝 Executing ALTER TABLE commands...\n');
        
        // Extract just the ALTER TABLE portion
        const alterTableMatch = sqlScript.match(/ALTER TABLE contents[\s\S]*?(?=-- Verify columns|$)/i);
        
        if (alterTableMatch) {
            const alterStatement = alterTableMatch[0].trim();
            await connection.query(alterStatement);
            console.log('✅ ALTER TABLE executed successfully\n');
        }
        
        // Now run verification query
        const verifyQuery = `
            SELECT 
                COLUMN_NAME,
                COLUMN_TYPE,
                IS_NULLABLE,
                COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'contents'
              AND COLUMN_NAME IN (
                'webhook_url', 'webhook_field_mapping', 'builder_layout', 'builder_content_elements',
                'builder_page_data', 'seo_meta_title', 'seo_meta_description', 'seo_meta_keywords',
                'scheduled_publish_date', 'reading_time', 'is_visible_on_site',
                'email_subject', 'email_template', 'case_study_headline', 'case_study_summary'
              )
            ORDER BY ORDINAL_POSITION
        `;
        
        const statements = [{ query: verifyQuery, isSelect: true }];

        console.log(`📄 Executing migration...\n`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.isSelect) {
                // For SELECT statements, show the results
                console.log(`\n✓ Executing verification query...`);
                const [rows] = await connection.query(statement.query);
                console.log(`\n📊 Current contents table columns (subset):`);
                console.table(rows);
            }
        }

        console.log('\n' + '─'.repeat(60));
        console.log('✅ Migration completed successfully!');
        console.log('─'.repeat(60));

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        if (error.sql) {
            console.error('Failed SQL:', error.sql);
        }
        process.exit(1);
    } finally {
        if (connection) connection.release();
        await pool.end();
    }
}

// Run the migration
addMissingContentColumns();
