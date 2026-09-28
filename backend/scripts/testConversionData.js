const CtaClick = require('../src/models/CtaClick');
const UserJourney = require('../src/models/UserJourney');

async function testConversionData() {
    try {
        console.log('Testing Conversion Data Models...\n');

        // Test CTA Analytics without filters
        console.log('1. Testing CTA Analytics (all time)...');
        const ctaAnalytics = await CtaClick.getCtaAnalytics({});
        console.log('CTA Analytics Results:', JSON.stringify(ctaAnalytics, null, 2));

        // Test CTA Analytics with date filters
        console.log('\n2. Testing CTA Analytics (last 7 days)...');
        const startDate = '2026-09-17';
        const endDate = '2026-09-24';
        const ctaAnalyticsFiltered = await CtaClick.getCtaAnalytics({ start_date: startDate, end_date: endDate });
        console.log('CTA Analytics (filtered) Results:', JSON.stringify(ctaAnalyticsFiltered, null, 2));

        // Test Journey Analytics without filters
        console.log('\n3. Testing Journey Analytics (all time)...');
        const journeyFunnel = await UserJourney.getConversionFunnel({});
        console.log('Journey Funnel Results:', JSON.stringify(journeyFunnel, null, 2));

        // Test Journey Analytics with date filters
        console.log('\n4. Testing Journey Analytics (last 7 days)...');
        const journeyFunnelFiltered = await UserJourney.getConversionFunnel({ start_date: startDate, end_date: endDate });
        console.log('Journey Funnel (filtered) Results:', JSON.stringify(journeyFunnelFiltered, null, 2));

        console.log('\n✅ All tests completed successfully!');

    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    } finally {
        const { pool } = require('../src/config/database');
        await pool.end();
    }
}

testConversionData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));