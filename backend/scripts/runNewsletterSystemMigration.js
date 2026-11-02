const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function runMigration() {
    console.log('🚀 Starting Newsletter Topic & Notification System Migration...');
    try {
        // 1. Check existing columns in newsletter_subscribers
        const [existingCols] = await pool.query('SHOW COLUMNS FROM newsletter_subscribers');
        const colNames = existingCols.map(c => c.Field);

        const newCols = [
            { name: 'preferences_instant_alerts', def: 'TINYINT(1) NOT NULL DEFAULT 1' },
            { name: 'preferences_weekly_digest', def: 'TINYINT(1) NOT NULL DEFAULT 1' },
            { name: 'preferences_general_alerts', def: 'TINYINT(1) NOT NULL DEFAULT 1' },
            { name: 'preferences_technology_alerts', def: 'TINYINT(1) NOT NULL DEFAULT 1' },
            { name: 'preferences_industry_alerts', def: 'TINYINT(1) NOT NULL DEFAULT 1' },
            { name: 'last_active_source', def: "VARCHAR(100) NULL DEFAULT 'general'" }
        ];

        for (const col of newCols) {
            if (!colNames.includes(col.name)) {
                await pool.query(`ALTER TABLE newsletter_subscribers ADD COLUMN \`${col.name}\` ${col.def}`);
                console.log(`✅ Added column \`${col.name}\` to newsletter_subscribers`);
            } else {
                console.log(`ℹ️ Column \`${col.name}\` already exists on newsletter_subscribers`);
            }
        }

        // 2. Read migration SQL and clean each statement
        const migrationPath = path.join(__dirname, '../database/newsletter_topic_notification_system.sql');
        const rawSql = fs.readFileSync(migrationPath, 'utf8');

        // Split by semicolon, strip comment-only lines
        const rawStatements = rawSql.split(';');

        for (const raw of rawStatements) {
            // Strip line comments
            const cleaned = raw
                .split('\n')
                .map(line => line.trim())
                .filter(line => !line.startsWith('--') && !line.startsWith('/*'))
                .join(' ')
                .trim();

            if (!cleaned || cleaned.toUpperCase().startsWith('ALTER TABLE `NEWSLETTER_SUBSCRIBERS`')) {
                continue;
            }

            try {
                await pool.query(cleaned);
                const snippet = cleaned.replace(/\s+/g, ' ').substring(0, 60);
                console.log(`✅ Executed: ${snippet}...`);
            } catch (err) {
                if (err.message.includes('already exists') || err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`ℹ️ Already exists (skipped)`);
                } else {
                    console.warn(`⚠️ Warning executing statement: ${err.message}`);
                }
            }
        }

        // 3. Ensure existing subscribers are safely initialized with 'general' / 'all' interest
        const [subscribersWithoutInterests] = await pool.query(`
            SELECT id, is_active FROM newsletter_subscribers 
            WHERE id NOT IN (SELECT DISTINCT subscriber_id FROM newsletter_subscription_interests)
        `);

        if (subscribersWithoutInterests.length > 0) {
            for (const sub of subscribersWithoutInterests) {
                await pool.query(`
                    INSERT IGNORE INTO newsletter_subscription_interests 
                    (subscriber_id, interest_type, interest_value, is_active)
                    VALUES (?, 'general', 'all', ?)
                `, [sub.id, sub.is_active]);
            }
            console.log(`✅ Initialized general interest for ${subscribersWithoutInterests.length} existing subscribers`);
        } else {
            console.log(`ℹ️ All existing subscribers already have registered interests`);
        }

        console.log('🎉 Newsletter Topic & Notification System Migration Completed Successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
