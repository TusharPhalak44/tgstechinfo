const axios = require('axios');

async function testTrackingEndpoints() {
    console.log('Testing Tracking API Endpoints...\n');

    try {
        // Test 1: Start Session (without consent for testing)
        console.log('1. Testing Session Start (without consent)...');
        const sessionResponse = await axios.post('http://localhost:5000/api/tracking/session/start', {
            landing_page: 'http://localhost:5173/article/test-article',
            referrer: 'http://localhost:5173',
            device_type: 'desktop',
            browser: 'Chrome',
            operating_system: 'Windows',
            screen_resolution: '1920x1080',
            language: 'en-US',
            timezone: 'Asia/Kolkata',
            country: 'India'
        });
        console.log('✅ Session Start Success:', sessionResponse.data.session.session_uuid);
        const sessionUuid = sessionResponse.data.session.session_uuid;

        // Create consent for testing
        console.log('\nCreating test consent...');
        const consentResponse = await axios.post('http://localhost:5000/api/cookie-consent', {
            consent_type: 'accept_all',
            session_id: 'test-session-id'
        });
        console.log('✅ Consent created:', consentResponse.data.consent?.uuid);
        const consentUuid = consentResponse.data.consent?.uuid;

        // Test 2: Track Page View
        console.log('\n2. Testing Page View Tracking...');
        const pageViewResponse = await axios.post('http://localhost:5000/api/tracking/page-view', {
            session_uuid: sessionUuid,
            consent_uuid: consentUuid,
            page_url: 'http://localhost:5173/article/test-article',
            page_title: 'Test Article Title',
            page_type: 'article',
            content_type: 'article',
            content_id: 184
        });
        console.log('✅ Page View Tracking Success:', pageViewResponse.data.pageView.id);

        // Test 3: Track Engagement
        console.log('\n3. Testing Engagement Tracking...');
        const engagementResponse = await axios.post('http://localhost:5000/api/tracking/engagement', {
            session_uuid: sessionUuid,
            consent_uuid: consentUuid,
            content_id: 184,
            engagement_type: 'read',
            reading_time_seconds: 45,
            scroll_depth: 50,
            max_scroll_depth: 75,
            reading_completed: false
        });
        console.log('✅ Engagement Tracking Success:', engagementResponse.data.engagement.id);

        console.log('\n✅ All Tracking API Tests Passed!');

    } catch (error) {
        console.error('❌ Tracking API Test Failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

testTrackingEndpoints();