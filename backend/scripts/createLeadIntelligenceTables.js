const { pool } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function createLeadIntelligenceTables() {
    try {
        console.log('==========================================');
        console.log('LEAD INTELLIGENCE TABLES CREATION');
        console.log('==========================================\n');

        // Read the schema file
        const schemaPath = path.join(__dirname, '../database/lead_intelligence_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon and execute each statement
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            try {
                await pool.query(statement);
                console.log('✅ Executed:', statement.substring(0, 50) + '...');
            } catch (error) {
                if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
                    console.error('❌ Error executing statement:', error.message);
                    throw error;
                } else {
                    console.log('⚠️  Table already exists (skipping):', statement.substring(0, 50) + '...');
                }
            }
        }

        console.log('\n==========================================');
        console.log('✅ LEAD INTELLIGENCE TABLES CREATED');
        console.log('==========================================');

        // Seed default regions
        console.log('\n🌱 Seeding default regions...');
        const regions = [
            { name: 'North America', code: 'NA', sort_order: 1 },
            { name: 'Europe, Middle East & Africa', code: 'EMEA', sort_order: 2 },
            { name: 'Asia Pacific', code: 'APAC', sort_order: 3 },
            { name: 'Latin America', code: 'LATAM', sort_order: 4 }
        ];

        for (const region of regions) {
            try {
                await pool.query(
                    'INSERT IGNORE INTO lead_intelligence_regions (name, code, sort_order) VALUES (?, ?, ?)',
                    [region.name, region.code, region.sort_order]
                );
                console.log(`✅ Region added: ${region.name} (${region.code})`);
            } catch (error) {
                console.log(`⚠️  Region may already exist: ${region.name}`);
            }
        }

        console.log('\n==========================================');
        console.log('✅ SETUP COMPLETED SUCCESSFULLY');
        console.log('==========================================');

    } catch (error) {
        console.error('❌ Error creating Lead Intelligence tables:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

createLeadIntelligenceTables();
