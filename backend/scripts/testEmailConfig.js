const nodemailer = require('nodemailer');
const { pool } = require('../src/config/database');
const dotenv = require('dotenv');

dotenv.config();

async function testEmailConfiguration() {
    console.log('🔍 Email Configuration Test\n');
    console.log('='.repeat(60));
    
    // Step 1: Check environment variables
    console.log('\n1️⃣  Checking Environment Variables...');
    const config = {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        from: process.env.EMAIL_FROM
    };
    
    console.log('   EMAIL_HOST:', config.host || '❌ NOT SET');
    console.log('   EMAIL_PORT:', config.port || '❌ NOT SET');
    console.log('   EMAIL_USER:', config.user || '❌ NOT SET');
    console.log('   EMAIL_FROM:', config.from || '❌ NOT SET');
    console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ SET' : '❌ NOT SET');
    
    if (!config.host || !config.port || !config.user || !process.env.EMAIL_PASSWORD) {
        console.log('\n❌ Email configuration incomplete. Please check your .env file.');
        process.exit(1);
    }
    
    // Step 2: Check database templates
    console.log('\n2️⃣  Checking Email Templates in Database...');
    try {
        const [templates] = await pool.query(
            'SELECT template_type, template_name, is_active, (html_body LIKE "%website_logo%") as has_logo FROM email_templates'
        );
        
        if (templates.length === 0) {
            console.log('   ⚠️  No templates found. Run: node scripts/createEmailTemplatesTable.js');
        } else {
            console.log(`   ✅ Found ${templates.length} templates:\n`);
            templates.forEach(t => {
                const status = t.is_active ? '✅' : '❌';
                const logo = t.has_logo ? '🖼️' : '⚠️';
                console.log(`      ${status} ${logo} ${t.template_type.padEnd(25)} - ${t.template_name}`);
            });
        }
    } catch (error) {
        console.log('   ❌ Error checking templates:', error.message);
    }
    
    // Step 3: Check website logo
    console.log('\n3️⃣  Checking Website Logo...');
    try {
        const [settings] = await pool.query(
            'SELECT website_main_logo, website_logo FROM site_settings LIMIT 1'
        );
        
        if (settings && settings[0]) {
            const logo = settings[0].website_main_logo || settings[0].website_logo;
            if (logo) {
                console.log('   ✅ Logo found in site_settings');
                if (logo.startsWith('data:image')) {
                    console.log('   📦 Type: Base64 (will be embedded as CID attachment)');
                } else {
                    console.log('   🔗 Type: URL');
                }
            } else {
                console.log('   ⚠️  No logo found. Upload via Admin Panel > Site Settings');
            }
        } else {
            console.log('   ⚠️  No site_settings record found');
        }
    } catch (error) {
        console.log('   ❌ Error checking logo:', error.message);
    }
    
    // Step 4: Test SMTP connection
    console.log('\n4️⃣  Testing SMTP Connection...');
    try {
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: parseInt(config.port),
            secure: parseInt(config.port) === 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: { rejectUnauthorized: false }
        });
        
        await transporter.verify();
        console.log('   ✅ SMTP connection successful!');
    } catch (error) {
        console.log('   ❌ SMTP connection failed:', error.message);
        console.log('\n   Troubleshooting:');
        console.log('   - Verify EMAIL_USER and EMAIL_PASSWORD are correct');
        console.log('   - Check if port is correct (465 for SSL, 587 for TLS)');
        console.log('   - Ensure firewall allows the connection');
        console.log('   - For Gmail: use App Password, not regular password');
    }
    
    // Step 5: Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Summary:');
    console.log('   Configuration: ' + (config.host && config.port ? '✅' : '❌'));
    console.log('   Templates Ready: Check output above');
    console.log('   Logo Available: Check output above');
    console.log('   SMTP Working: Check output above');
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Fix any issues shown above');
    console.log('   2. Upload logo via Admin Panel > Site Settings');
    console.log('   3. Test with: node scripts/sendTestEmail.js');
    console.log('   4. Review full guide: backend/EMAIL_TEMPLATE_SETUP_AND_TESTING.md');
    
    console.log('\n' + '='.repeat(60));
    process.exit(0);
}

testEmailConfiguration().catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});
