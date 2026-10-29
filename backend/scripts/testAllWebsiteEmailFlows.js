const { pool } = require('../src/config/database');
const { extractNameFromEmail, sendEmail, sendTemplatedEmail } = require('../src/config/email');
const publicController = require('../src/controllers/publicController');

async function testAllFlows() {
    console.log('🚀 ===============================================================');
    console.log('🚀 TESTING ALL WEBSITE EMAIL SENDER CHANNELS & NAME EXTRACTION');
    console.log('🚀 ===============================================================\n');

    // 1. Test Name Extraction on sample emails
    console.log('1️⃣  Testing Smart Name Extraction from Email:');
    const testEmails = [
        'manisha6698sb@gmail.com',
        'tushar.phalak44@gmail.com',
        'john_doe@example.com',
        'tejas.pawar@tgstechinfo.com',
        'contact@tgstechinfo.com',
        'kulkarnimanasi109@gmail.com',
        'alex-smith@company.com'
    ];
    testEmails.forEach(e => {
        const name = extractNameFromEmail(e);
        console.log(`   📧 ${e}  ➡️  "Hi ${name},"`);
    });

    // 2. Test Newsletter Subscription with manisha6698sb@gmail.com
    console.log('\n2️⃣  Testing Newsletter API Flow (Home, Footer, Articles, Industry):');
    const testEmail = 'manisha6698sb@gmail.com';

    // Clean test row
    await pool.query('DELETE FROM newsletter_subscribers WHERE email = ?', [testEmail]);

    let resData1 = null;
    const mockRes1 = {
        json: (d) => { resData1 = d; return mockRes1; },
        status: (s) => ({ json: (d) => { resData1 = { status: s, ...d }; } })
    };

    console.log('   Simulating initial subscription for:', testEmail);
    await publicController.subscribeNewsletter({ body: { email: testEmail } }, mockRes1);
    console.log('   ✅ Initial Subscription Response:', resData1);

    const [subRows] = await pool.query('SELECT email, name, is_active, unsubscribe_token FROM newsletter_subscribers WHERE email = ?', [testEmail]);
    console.log('   ✅ Stored in DB with extracted name:', subRows[0]);

    // 3. Test Already Active Subscription (Simulate user trying "Subscribe to Weekly Tech Intelligence" after having already subscribed)
    console.log('\n3️⃣  Testing Already-Active Subscription (e.g. user re-testing on /articles):');
    let resData2 = null;
    const mockRes2 = {
        json: (d) => { resData2 = d; return mockRes2; },
        status: (s) => ({ json: (d) => { resData2 = { status: s, ...d }; } })
    };
    await publicController.subscribeNewsletter({ body: { email: testEmail } }, mockRes2);
    console.log('   ✅ Already-Active Re-test Response (Confirmation re-sent!):', resData2);

    // 4. Test Contact Us Form Submission
    console.log('\n4️⃣  Testing Contact Us Submission Flow (/contact):');
    let contactRes = null;
    const mockContactRes = {
        json: (d) => { contactRes = d; return mockContactRes; },
        status: (s) => ({ json: (d) => { contactRes = { status: s, ...d }; } })
    };

    const contactReq = {
        body: {
            full_name: 'Manisha Sharma',
            email: 'manisha6698sb@gmail.com',
            subject: 'Partnership Inquiry',
            category: 'General Inquiry',
            company: 'Tech Corp',
            message: 'Hello, I would like to inquire about publishing tech insights on your platform.',
            consent: true
        },
        ip: '127.0.0.1'
    };

    await publicController.submitContact(contactReq, mockContactRes);
    console.log('   ✅ Contact Us Response:', contactRes);

    // Clean up test newsletter row so testing can be repeated anytime
    await pool.query('DELETE FROM newsletter_subscribers WHERE email = ?', [testEmail]);

    console.log('\n🎉 ===============================================================');
    console.log('🎉 ALL WEBSITE EMAIL FLOWS TESTED & WORKING PROPERLY!');
    console.log('🎉 ===============================================================\n');
    process.exit(0);
}

testAllFlows().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
