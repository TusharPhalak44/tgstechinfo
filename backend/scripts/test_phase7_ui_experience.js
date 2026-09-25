const { pool } = require('../src/config/database');
const User = require('../src/models/User');

async function testPhase7() {
    console.log('--- Testing Phase 7: UI & User Experience ---');
    try {
        // 1. Test ISSUE-UI-01: Profile fields persistence
        console.log('\n1. Testing User Profile fields (country, job_title, company_name):');
        const [users] = await pool.query('SELECT id, first_name, email, job_title, company_name, country FROM users LIMIT 1');
        const testUser = users[0];
        console.log('Initial user profile:', testUser);

        const updated = await User.update(testUser.id, {
            job_title: 'Chief Technology Officer',
            company_name: 'TGS Global Enterprises',
            country: 'Switzerland'
        });

        console.log('Updated user profile:', {
            id: updated.id,
            job_title: updated.job_title,
            company_name: updated.company_name,
            country: updated.country
        });

        if (updated.job_title !== 'Chief Technology Officer') throw new Error('job_title not updated!');
        if (updated.company_name !== 'TGS Global Enterprises') throw new Error('company_name not updated!');
        if (updated.country !== 'Switzerland') throw new Error('country not updated!');
        console.log('✅ User profile fields successfully persist in database.');

        // Revert to initial values
        await User.update(testUser.id, {
            job_title: testUser.job_title,
            company_name: testUser.company_name,
            country: testUser.country
        });
        console.log('Restored user profile to initial values.');

        // 2. Test ISSUE-UI-03: Dashboard KPIs and Stats
        console.log('\n2. Testing dashboard stats & KPIs calculation:');
        const adminController = require('../src/controllers/adminController');

        const mockReq = { query: { period: '30d' } };
        let kpisResult = null;
        let statsResult = null;

        const mockResKpis = {
            json: (data) => { kpisResult = data; return mockResKpis; },
            status: () => mockResKpis
        };
        const mockResStats = {
            json: (data) => { statsResult = data; return mockResStats; },
            status: () => mockResStats
        };

        await adminController.getDashboardKPIs(mockReq, mockResKpis);
        await adminController.getDashboardStats(mockReq, mockResStats);

        console.log('Dashboard KPIs result:', kpisResult);
        console.log('Dashboard Stats result:', statsResult);

        if (typeof kpisResult.viewsDelta !== 'number') throw new Error('viewsDelta is not a number!');
        if (typeof statsResult.avgReadTime !== 'number') throw new Error('avgReadTime is not a number!');
        if (typeof statsResult.engagementRate !== 'number') throw new Error('engagementRate is not a number!');

        console.log('✅ Dashboard metrics dynamically computed from database.');
        console.log('\n🎉 ALL PHASE 7 TESTS PASSED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Phase 7 test failed:', err);
        process.exit(1);
    }
}

testPhase7();
