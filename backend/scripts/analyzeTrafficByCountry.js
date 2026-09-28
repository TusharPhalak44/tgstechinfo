const { pool } = require('../src/config/database');

async function analyzeTrafficByCountry() {
    try {
        console.log('🔍 Analyzing Website Traffic by Country...\n');

        // Get overall traffic statistics
        const [totalStats] = await pool.query(`
            SELECT 
                COUNT(*) as total_sessions,
                COUNT(DISTINCT ip_address) as unique_visitors,
                MIN(session_start) as earliest_session,
                MAX(session_start) as latest_session
            FROM visitor_sessions
        `);

        console.log('📊 Overall Traffic Statistics:');
        console.log(`   Total Sessions: ${totalStats[0].total_sessions}`);
        console.log(`   Unique Visitors: ${totalStats[0].unique_visitors}`);
        console.log(`   Time Period: ${totalStats[0].earliest_session} to ${totalStats[0].latest_session}\n`);

        // Get traffic distribution by country
        const [countryData] = await pool.query(`
            SELECT 
                country,
                COUNT(*) as session_count,
                COUNT(DISTINCT ip_address) as unique_visitors,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM visitor_sessions), 2) as percentage,
                AVG(total_session_duration) as avg_session_duration,
                AVG(total_pages_visited) as avg_pages_per_session,
                MIN(session_start) as first_seen,
                MAX(session_start) as last_seen
            FROM visitor_sessions
            WHERE country IS NOT NULL AND country != ''
            GROUP BY country
            ORDER BY session_count DESC
        `);

        console.log('🌍 Traffic Distribution by Country:\n');
        console.log('┌─────────────────────────────┬──────────────┬──────────────┬─────────────┬──────────────┬──────────────┐');
        console.log('│ Country                      │ Sessions     │ Unique       │ Percentage  │ Avg Duration │ Avg Pages    │');
        console.log('│                              │              │ Visitors     │             │ (seconds)    │ Per Session  │');
        console.log('├─────────────────────────────┼──────────────┼──────────────┼─────────────┼──────────────┼──────────────┤');

        countryData.forEach((row, index) => {
            const country = row.country.padEnd(29);
            const sessions = row.session_count.toString().padStart(12);
            const visitors = row.unique_visitors.toString().padStart(12);
            const percentage = row.percentage.toString().padStart(11) + '%';
            const duration = Math.round(row.avg_session_duration || 0).toString().padStart(12);
            const pages = parseFloat(row.avg_pages_per_session || 0).toFixed(1).padStart(12);
            
            console.log(`│ ${country} │ ${sessions} │ ${visitors} │ ${percentage} │ ${duration} │ ${pages} │`);
        });

        console.log('└─────────────────────────────┴──────────────┴──────────────┴─────────────┴──────────────┴──────────────┘\n');

        // Get top 10 countries for quick reference
        console.log('🏆 Top 10 Countries by Traffic:\n');
        const top10 = countryData.slice(0, 10);
        top10.forEach((row, index) => {
            console.log(`${index + 1}. ${row.country}: ${row.session_count} sessions (${row.percentage}%)`);
        });

        console.log('\n📋 Summary for User Distribution Planning:\n');
        console.log('Based on current traffic, here are the recommended user distributions for 400-500 users:\n');

        const totalUsers = [400, 450, 500];
        totalUsers.forEach(targetUsers => {
            console.log(`For ${targetUsers} total users:`);
            console.log('─────────────────────────────────────────────────────────────────');
            
            top10.forEach((row, index) => {
                const allocatedUsers = Math.round((row.percentage / 100) * targetUsers);
                console.log(`  ${row.country.padEnd(20)}: ${allocatedUsers.toString().padStart(3)} users (${row.percentage}% of traffic)`);
            });
            console.log('');
        });

        // Get country breakdown with device types
        console.log('📱 Country + Device Type Breakdown:\n');
        const [deviceData] = await pool.query(`
            SELECT 
                country,
                device_type,
                COUNT(*) as session_count
            FROM visitor_sessions
            WHERE country IS NOT NULL AND country != ''
            GROUP BY country, device_type
            ORDER BY country, session_count DESC
        `);

        const deviceByCountry = {};
        deviceData.forEach(row => {
            if (!deviceByCountry[row.country]) {
                deviceByCountry[row.country] = {};
            }
            deviceByCountry[row.country][row.device_type] = row.session_count;
        });

        Object.keys(deviceByCountry).slice(0, 10).forEach(country => {
            console.log(`${country}:`);
            Object.entries(deviceByCountry[country]).forEach(([device, count]) => {
                console.log(`  - ${device}: ${count} sessions`);
            });
        });

        // Return the data for potential further processing
        return {
            totalStats: totalStats[0],
            countryData: countryData,
            deviceBreakdown: deviceByCountry
        };

    } catch (error) {
        console.error('❌ Error analyzing traffic:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the analysis
if (require.main === module) {
    analyzeTrafficByCountry()
        .then(() => {
            console.log('\n✅ Traffic analysis completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Traffic analysis failed:', error);
            process.exit(1);
        });
}

module.exports = analyzeTrafficByCountry;