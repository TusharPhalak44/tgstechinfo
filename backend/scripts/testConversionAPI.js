const axios = require('axios');

async function testConversionAPI() {
    try {
        console.log('Testing Conversion API endpoints...\n');

        // Test CTA Analytics endpoint
        console.log('1. Testing CTA Analytics endpoint...');
        try {
            const ctaResponse = await axios.get('http://localhost:5000/api/analytics/cta', {
                headers: {
                    'Authorization': 'Bearer test-token', // You may need to adjust this
                    'Content-Type': 'application/json'
                }
            });
            console.log('CTA Analytics Response:', JSON.stringify(ctaResponse.data, null, 2));
        } catch (error) {
            console.log('CTA Analytics Error:', error.response?.data || error.message);
        }

        // Test Journey Analytics endpoint  
        console.log('\n2. Testing Journey Analytics endpoint...');
        try {
            const journeyResponse = await axios.get('http://localhost:5000/api/analytics/journey', {
                headers: {
                    'Authorization': 'Bearer test-token', // You may need to adjust this
                    'Content-Type': 'application/json'
                }
            });
            console.log('Journey Analytics Response:', JSON.stringify(journeyResponse.data, null, 2));
        } catch (error) {
            console.log('Journey Analytics Error:', error.response?.data || error.message);
        }

        // Test with date parameters
        console.log('\n3. Testing with date parameters (7 days)...');
        try {
            const ctaDateResponse = await axios.get('http://localhost:5000/api/analytics/cta?start_date=2026-09-17&end_date=2026-09-24', {
                headers: {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json'
                }
            });
            console.log('CTA Analytics with dates Response:', JSON.stringify(ctaDateResponse.data, null, 2));
        } catch (error) {
            console.log('CTA Analytics with dates Error:', error.response?.data || error.message);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testConversionAPI();