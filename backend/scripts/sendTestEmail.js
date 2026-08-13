const { sendTemplatedEmail } = require('../src/config/email');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function sendTestEmail() {
    console.log('📧 Email Template Testing Tool\n');
    console.log('='.repeat(60));
    
    console.log('\nAvailable Templates:');
    console.log('  1. registration - User registration welcome');
    console.log('  2. password_reset - Password reset request');
    console.log('  3. newsletter_subscription - Newsletter welcome');
    console.log('  4. content_submitted - Content submitted for review');
    console.log('  5. content_approved - Content approved');
    console.log('  6. content_rejected - Content rejected/changes needed');
    console.log('  7. content_published - Content published');
    console.log('  8. case_study_download - Case study access granted');
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    try {
        const choice = await question('Select template (1-8): ');
        const email = await question('Enter recipient email: ');
        
        const templates = {
            '1': 'registration',
            '2': 'password_reset',
            '3': 'newsletter_subscription',
            '4': 'content_submitted',
            '5': 'content_approved',
            '6': 'content_rejected',
            '7': 'content_published',
            '8': 'case_study_download'
        };
        
        const templateType = templates[choice];
        
        if (!templateType) {
            console.log('❌ Invalid choice');
            rl.close();
            process.exit(1);
        }
        
        console.log(`\n📤 Sending ${templateType} email to ${email}...`);
        
        // Prepare variables based on template type
        let variables = {
            first_name: 'Test',
            last_name: 'User',
            name: 'Test User',
            email: email
        };
        
        // Add template-specific variables
        switch (templateType) {
            case 'registration':
                variables.login_url = 'http://localhost:5173/login';
                break;
            case 'password_reset':
                variables.reset_url = 'http://localhost:5173/reset-password?token=test_token_123';
                break;
            case 'newsletter_subscription':
                variables.site_url = 'http://localhost:5173';
                variables.unsubscribe_url = 'http://localhost:5173/unsubscribe?token=test_token';
                break;
            case 'content_submitted':
            case 'content_approved':
            case 'content_rejected':
            case 'content_published':
                variables.content_title = 'Understanding Modern Web Development';
                variables.category = 'Technology';
                variables.submitted_date = new Date().toLocaleDateString();
                variables.approved_date = new Date().toLocaleDateString();
                variables.published_date = new Date().toLocaleDateString();
                variables.reviewed_date = new Date().toLocaleDateString();
                variables.feedback = 'Great article! Please add more examples in the introduction section.';
                variables.article_url = 'http://localhost:5173/content/test-article';
                variables.dashboard_url = 'http://localhost:5173/user/dashboard';
                break;
            case 'case_study_download':
                variables.title = 'Enterprise Cloud Migration Success Story';
                variables.download_url = 'http://localhost:5173/downloads/case-study.pdf';
                break;
        }
        
        const result = await sendTemplatedEmail(templateType, email, variables);
        
        if (result.skipped) {
            console.log(`\n⚠️  Email skipped: ${result.reason}`);
            if (result.reason === 'credentials_not_configured') {
                console.log('\n💡 Fix: Update EMAIL_USER and EMAIL_PASSWORD in .env file');
            } else if (result.reason === 'template_not_found') {
                console.log('\n💡 Fix: Run node scripts/createEmailTemplatesTable.js');
            }
        } else {
            console.log('\n✅ Email sent successfully!');
            console.log('\nMessage Details:');
            console.log(`   Message ID: ${result.messageId}`);
            console.log(`   Response: ${result.response}`);
            console.log('\n📬 Check your inbox (and spam folder) for the email.');
        }
        
    } catch (error) {
        console.log('\n❌ Error sending email:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Run: node scripts/testEmailConfig.js');
        console.log('2. Verify .env EMAIL_* settings');
        console.log('3. Check server logs for details');
        console.log('4. Review: backend/EMAIL_TEMPLATE_SETUP_AND_TESTING.md');
    } finally {
        rl.close();
        process.exit(0);
    }
}

sendTestEmail();
