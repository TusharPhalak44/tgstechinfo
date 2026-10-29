const { pool } = require('../src/config/database');

async function cleanTemplates() {
    console.log('🔄 Cleaning email templates in database...\n');

    const updates = [
        {
            type: 'newsletter_subscription',
            name: 'Newsletter Subscription Confirmed',
            subject: 'Welcome to TGS Tech Info Newsletter!',
            html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to TGS Tech Info Newsletter</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0B1F4D 0%, #1a237e 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
        .content { padding: 32px 28px; }
        .benefits-box { background: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #F7941D; margin: 24px 0; }
        .benefit-item { padding: 8px 0; font-size: 14px; }
        .cta-button { display: inline-block; padding: 12px 28px; background: #F7941D; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            {{website_logo_html}}
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Welcome to Our Newsletter</h1>
        </div>
        <div class="content">
            <h3 style="margin-top: 0; color: #0f172a;">Hi {{name}},</h3>
            <p>Thank you for subscribing to the TGS Tech Info newsletter! We are excited to have you as part of our reader community.</p>
            
            <div class="benefits-box">
                <h4 style="margin: 0 0 12px 0; color: #0B1F4D; font-size: 15px;">What you can look forward to:</h4>
                <div class="benefit-item"><strong>• Latest Articles</strong> &mdash; Stay informed with cutting-edge tech insights, analysis, and research.</div>
                <div class="benefit-item"><strong>• Industry Trends</strong> &mdash; Deep dives into enterprise tech, software, AI, and cybersecurity.</div>
                <div class="benefit-item"><strong>• Expert Guides</strong> &mdash; In-depth comparison guides and vendor selection criteria.</div>
                <div class="benefit-item"><strong>• Exclusive Content</strong> &mdash; Free access to subscriber-only whitepapers and downloads.</div>
            </div>
            
            <p>We send valuable, high-signal analysis directly to your inbox so you never miss an important tech development.</p>
            
            <div style="text-align: center;">
                <a href="{{site_url}}" class="cta-button">Visit Our Website</a>
            </div>
            
            <p style="font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                You are receiving this email because you subscribed on tgstechinfo.com.<br />
                To unsubscribe at any time, <a href="{{unsubscribe_url}}" style="color: #0284c7; text-decoration: underline;">click here</a>.
            </p>
            
            <p style="margin-bottom: 0;">Warm regards,<br /><strong>TGS Tech Info Editorial Team</strong></p>
        </div>
        <div class="footer">
            <p style="margin: 0;">&copy; {{year}} TGS Tech Info. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
        },
        {
            type: 'content_published',
            name: 'Content Published',
            subject: 'Your Article "{{content_title}}" is Now Live!',
            html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Article is Live</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0B1F4D 0%, #1a237e 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
        .content { padding: 32px 28px; }
        .status-box { background: #f0fdf4; padding: 18px; border-left: 4px solid #16a34a; border-radius: 6px; margin: 20px 0; }
        .cta-button { display: inline-block; padding: 12px 28px; background: #F7941D; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            {{website_logo_html}}
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Your Article is Live</h1>
        </div>
        <div class="content">
            <h3 style="margin-top: 0; color: #0f172a;">Hi {{first_name}},</h3>
            <p>Exciting news! Your article has been approved and published on TGS Tech Info.</p>
            
            <div class="status-box">
                <p style="margin: 0 0 6px 0;"><strong>Article Title:</strong> {{content_title}}</p>
                <p style="margin: 0 0 6px 0;"><strong>Category:</strong> {{category}}</p>
                <p style="margin: 0 0 6px 0;"><strong>Published On:</strong> {{published_date}}</p>
                <p style="margin: 0;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">Published</span></p>
            </div>
            
            <p>Thank you for contributing valuable insights to our community. Readers can now discover and engage with your work.</p>
            
            <div style="text-align: center;">
                <a href="{{article_url}}" class="cta-button">Read Your Article</a>
            </div>
            
            <p style="margin-bottom: 0;">Warm regards,<br /><strong>TGS Tech Info Editorial Team</strong></p>
        </div>
        <div class="footer">
            <p style="margin: 0;">&copy; {{year}} TGS Tech Info. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
        },
        {
            type: 'content_approved',
            name: 'Content Approved',
            subject: 'Your Article "{{content_title}}" Has Been Approved',
            html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Article Approved</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
        .content { padding: 32px 28px; }
        .status-box { background: #f0fdf4; padding: 18px; border-left: 4px solid #16a34a; border-radius: 6px; margin: 20px 0; }
        .cta-button { display: inline-block; padding: 12px 28px; background: #16a34a; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            {{website_logo_html}}
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Article Approved</h1>
        </div>
        <div class="content">
            <h3 style="margin-top: 0; color: #0f172a;">Hi {{first_name}},</h3>
            <p>Great news! Your article has been reviewed and approved by our editorial team.</p>
            
            <div class="status-box">
                <p style="margin: 0 0 6px 0;"><strong>Article Title:</strong> {{content_title}}</p>
                <p style="margin: 0 0 6px 0;"><strong>Category:</strong> {{category}}</p>
                <p style="margin: 0 0 6px 0;"><strong>Approved On:</strong> {{approved_date}}</p>
                <p style="margin: 0;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">Approved</span></p>
            </div>
            
            <p>Your article is now queued for publication. You will receive another notification once it goes live.</p>
            
            <div style="text-align: center;">
                <a href="{{dashboard_url}}" class="cta-button">View Your Dashboard</a>
            </div>
            
            <p style="margin-bottom: 0;">Warm regards,<br /><strong>TGS Tech Info Editorial Team</strong></p>
        </div>
        <div class="footer">
            <p style="margin: 0;">&copy; {{year}} TGS Tech Info. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
        },
        {
            type: 'case_study_download',
            name: 'Case Study Download Access',
            subject: 'Your Case Study Access - {{title}}',
            html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Case Study Access Granted</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0B1F4D 0%, #1a237e 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
        .content { padding: 32px 28px; }
        .case-study-box { background: #f1f5f9; padding: 18px; border-left: 4px solid #F7941D; border-radius: 6px; margin: 20px 0; }
        .cta-button { display: inline-block; padding: 12px 28px; background: #F7941D; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 20px 0; }
        .contact-box { background: #f0fdf4; padding: 14px 18px; border-radius: 6px; font-size: 13px; color: #15803d; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            {{website_logo_html}}
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Case Study Access Granted</h1>
        </div>
        <div class="content">
            <h3 style="margin-top: 0; color: #0f172a;">Hi {{name}},</h3>
            <p>Thank you for your interest in our case study publication.</p>
            
            <div class="case-study-box">
                <h4 style="margin: 0 0 6px 0; color: #0B1F4D;">{{title}}</h4>
                <p style="margin: 0; font-size: 14px; color: #475569;">Your requested research is unlocked and available for download.</p>
            </div>
            
            <div style="text-align: center;">
                <a href="{{download_url}}" class="cta-button">Download Case Study</a>
            </div>
            
            <div class="contact-box">
                <p style="margin: 2px 0;"><strong>Questions or Inquiries?</strong></p>
                <p style="margin: 2px 0;">Contact our insights team: <a href="mailto:info@tgstechinfo.com" style="color: #15803d; text-decoration: underline;">info@tgstechinfo.com</a></p>
            </div>
            
            <p style="margin-bottom: 0;">Warm regards,<br /><strong>TGS Tech Info Research Team</strong></p>
        </div>
        <div class="footer">
            <p style="margin: 0;">&copy; {{year}} TGS Tech Info. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
        },
        {
            type: 'password_reset',
            name: 'Password Reset Request',
            subject: 'Password Reset Request - TGS Tech Info',
            html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0B1F4D 0%, #1a237e 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
        .content { padding: 32px 28px; }
        .warning-box { background: #fffbeb; padding: 14px 18px; border-left: 4px solid #f59e0b; border-radius: 6px; font-size: 13px; color: #92400e; margin: 20px 0; }
        .cta-button { display: inline-block; padding: 12px 28px; background: #F7941D; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            {{website_logo_html}}
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Password Reset Request</h1>
        </div>
        <div class="content">
            <h3 style="margin-top: 0; color: #0f172a;">Hi {{first_name}},</h3>
            <p>We received a request to reset your password for your TGS Tech Info account.</p>
            
            <div style="text-align: center;">
                <a href="{{reset_url}}" class="cta-button">Reset Your Password</a>
            </div>
            
            <div class="warning-box">
                <p style="margin: 0 0 6px 0;"><strong>Security Notice:</strong></p>
                <p style="margin: 0;">This reset link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
            </div>
            
            <p style="margin-bottom: 0;">Warm regards,<br /><strong>TGS Tech Info Security Team</strong></p>
        </div>
        <div class="footer">
            <p style="margin: 0;">&copy; {{year}} TGS Tech Info. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
        }
    ];

    for (const item of updates) {
        await pool.query(
            'UPDATE email_templates SET subject = ?, html_body = ?, updated_at = NOW() WHERE template_type = ?',
            [item.subject, item.html, item.type]
        );
        console.log(`✅ Cleaned template: ${item.type}`);
    }

    console.log('\n🎉 All templates cleaned successfully!');
    process.exit(0);
}

cleanTemplates().catch(err => {
    console.error('❌ Error cleaning templates:', err);
    process.exit(1);
});

