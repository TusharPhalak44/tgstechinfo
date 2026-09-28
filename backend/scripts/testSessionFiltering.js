const axios = require('axios');

async function testSessionFiltering() {
    try {
        console.log('Testing Session Analytics with Time Filtering...\n');

        // Test 1: All time (no filters)
        console.log('1. Testing ALL TIME (no filters)...');
        try {
            const allTimeResponse = await axios.get('http://localhost:5000/api/analytics/sessions?limit=100', {
                headers: {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json'
                }
            });
            console.log('All Time Sessions:', allTimeResponse.data.recentSessions?.length || 0);
            if (allTimeResponse.data.recentSessions?.length > 0) {
                console.log('Sample session:', allTimeResponse.data.recentSessions[0]);
            }
        } catch (error) {
            console.log('All Time Error:', error.response?.data || error.message);
        }

        // Test 2: Last 7 days
        console.log('\n2. Testing LAST 7 DAYS...');
        const startDate7 = '2026-09-17';
        const endDate7 = '2026-09-24';
        try {
            const last7DaysResponse = await axios.get(`http://localhost:5000/api/analytics/sessions?start_date=${startDate7}&end_date=${endDate7}&limit=100`, {
                headers: {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json'
                }
            });
            console.log('Last 7 Days Sessions:', last7DaysResponse.data.recentSessions?.length || 0);
            if (last7DaysResponse.data.recentSessions?.length > 0) {
                console.log('Sample session:', last7DaysResponse.data.recentSessions[0]);
            }
        } catch (error) {
            console.log('Last 7 Days Error:', error.response?.data || error.message);
        }

        // Test 3: Last 30 days
        console.log('\n3. Testing LAST 30 DAYS...');
        const startDate30 = '2026-08-25';
        const endDate30 = '2026-09-24';
        try {
            const last30DaysResponse = await axios.get(`http://localhost:5000/api/analytics/sessions?start_date=${startDate30}&end_date=${endDate30}&limit=100`, {
                headers: {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json'
                }
            });
            console.log('Last 30 Days Sessions:', last30DaysResponse.data.recentSessions?.length || 0);
            if (last30DaysResponse.data.recentSessions?.length > 0) {
                console.log('Sample session:', last30DaysResponse.data.recentSessions[0]);
            }
        } catch (error) {
            console.log('Last 30 Days Error:', error.response?.data || error.message);
        }

        // Test 4: Last 90 days
        console.log('\n4. Testing LAST 90 DAYS...');
        const startDate90 = '2026-06-26';
        const endDate90 = '2026-09-24';
        try {
            const last90DaysResponse = await axios.get(`http://localhost:5000/api/analytics/sessions?start_date=${startDate90}&end_date=${endDate90}&limit=100`, {
                headers: {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json'
                }
            });
            console.log('Last 90 Days Sessions:', last90DaysResponse.data.recentSessions?.length || 0);
            if (last90DaysResponse.data.recentSessions?.length > 0) {
                console.log('Sample session:', last90DaysResponse.data.recentSessions[0]);
            }
        } catch (error) {
            console.log('Last 90 Days Error:', error.response?.data || error.message);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testSessionFiltering();