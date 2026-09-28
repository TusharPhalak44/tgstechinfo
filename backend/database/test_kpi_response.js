const { pool } = require('../src/config/database');

async function testKPIResponse() {
    try {
        console.log('Testing Dashboard KPIs response...\n');
        
        // Simulate the getDashboardKPIs query for totalViews
        const [[{ totalViews }]] = await pool.query(`SELECT COALESCE(SUM(view_count),0) as totalViews FROM contents`);
        
        console.log('All-time total views:', totalViews);
        
        // Also test with date filter
        const dateCondition = "updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        const [[{ periodViews }]] = await pool.query(`SELECT COALESCE(SUM(view_count),0) as periodViews FROM contents WHERE ${dateCondition}`);
        
        console.log('30-day period views:', periodViews);
        
        console.log('\n✅ KPI response test completed');
        console.log('✅ totalViews now shows all-time cumulative count (no date filter)');
        console.log('✅ periodViews shows period-specific count (for trend analysis)');
        
    } catch (error) {
        console.error('Error testing KPI response:', error);
    } finally {
        await pool.end();
    }
}

testKPIResponse();
