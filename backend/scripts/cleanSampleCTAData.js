const { pool } = require('../src/config/database');

async function cleanSampleCTAData() {
    try {
        console.log('Cleaning sample CTA data...\n');

        // Remove the sample CTA data I inserted
        const [result] = await pool.query(`
            DELETE FROM cta_clicks 
            WHERE id IN (
                SELECT id FROM (
                    SELECT id FROM cta_clicks 
                    WHERE clicked_at >= '2026-08-26' 
                    ORDER BY clicked_at DESC 
                    LIMIT 35
                ) as temp
            )
        `);

        console.log(`✅ Removed ${result.affectedRows} sample CTA records`);

        // Verify remaining data
        const [remainingData] = await pool.query(`
            SELECT 
                cta_type,
                COUNT(*) as click_count,
                MIN(clicked_at) as first_click,
                MAX(clicked_at) as last_click
            FROM cta_clicks
            GROUP BY cta_type
            ORDER BY click_count DESC
        `);

        console.log('\nRemaining CTA Data (Real):');
        console.table(remainingData);

        console.log('\n✅ Sample data cleaned successfully!');

    } catch (error) {
        console.error('Error cleaning sample data:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

cleanSampleCTAData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));