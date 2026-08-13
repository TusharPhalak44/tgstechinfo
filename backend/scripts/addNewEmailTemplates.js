const { pool } = require('../src/config/database');

async function addNewEmailTemplates() {
    try {
        const templates = [
            {
                template_type: 'password_reset',
                template_name: 'Password Reset Request',
                subject: 'Password Reset Request - TGS Tech Info',
                html_body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0B1F4D 0%, #1a237e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f8f9fa; border: 1px solid #e0e0e0; }
        .footer { padding: 20px; text-align: center; background: #e0e0e0; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
        .warning-box { background: #fff3cd; padding: 15px; border-left: 4px solid #F7941D; margin: 20px 0; font-size: 13px; color: #856404; }
        .cta-button { display: inline-block; padding: 14px 28px; background: #F7941D; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .link-text { color: #666; font-size: 12px; word-break: break-all; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            {{website_logo_html}}
            <h2>Password Reset Request</h2>
        </div>
        <div class="content">
            <h3>Hi {{first_name}},</h3>
            <p>We received a request to reset your password. Click the button below to proceed:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{reset_url}}" class="cta-button">Reset My Password</a>
            </div>
            
            <div class="warning-box">
                <p><strong>⏰ Important:</strong> This link expires in 1 hour.</p>
                <p style="margin: 5px 0 0 0;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
            
            <p class="link-text">Or copy and paste this link into your browser:<br>
            <a href="{{reset_url}}" style="color: #0066cc;">{{reset_url}}</a></p>
            
            <p>Regards,<br><strong>TGS Tech Info Team</strong></p>
        </div>
        <div class="footer">
            <p>© {{year}} TGS Tech Info. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
            },
            {
                template_type: 'newsletter_subscription',
                template_name: 'Newsletter Subscription Confirmed',
                subject: 'Welcome to TGS Tech Info Newsletter!',
                html_body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #F7941D 0%, #E67E00 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f8f9fa; border: 1px solid #e0e0e0; }
        .footer { padding: 20px; text-align: center; background: #e0e0e0; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
        .benefits-box { background: #fff; padding: 20px; border: 1px solid #ddd; margin: 20px 0; border-radius: 8px; }
        .benefit-item { padding: 10px 0; border-bottom: 1px solid #eee; }
        .benefit-item:last-child { border-bottom: none; }
        .cta-button { display: inline-block; padding: 14px 28px; background: #F7941D; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            {{website_logo_html}}
            <h2>🎉 Welcome to Our Newsletter!</h2>
        </div>
        <div class="content">
            <h3>Hi {{name}},</h3>
            <p>Thank you for subscribing to the TGS Tech Info newsletter! We're excited to have you as part of our community.</p>
            
            <div class="benefits-box">
                <h4 style="margin-top: 0; color: #0B1F4D;">What You'll Receive:</h4>
                <div class="benefit-item">
                    <strong>📰 Latest Articles</strong> - Stay updated with our newest tech insights and case studies
                </div>
                <div class="benefit-item">
                    <strong>🎯 Industry Trends</strong> - Get ahead with cutting-edge technology updates
                </div>
                <div class="benefit-item">
                    <strong>💡 Expert Tips</strong> - Learn from industry professionals and thought leaders
                </div>
                <div class="benefit-item">
                    <strong>🎁 Exclusive Content</strong> - Access subscriber-only resources and downloads
                </div>
            </div>
            
            <p>You'll receive our newsletter regularly, bringing you valuable content directly to your inbox.</p>
            
            <div style="text-align: center;">
                <a href="{{site_url}}" class="cta-button">Visit Our Website</a>
            </div>
            
            <p style="font-size: 12px; color: #666; margin-top: 30px;">Don't want to receive these emails? You can <a href="{{unsubscribe_url}}" style="color: #0066cc;">unsubscribe</a> at any time.</p>
            
            <p>Regards,<br><strong>TGS Tech Info Team</strong></p>
        </div>
        <div class="footer">
            <p>© {{year}} TGS Tech Info. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
            },
            {
                template_type: 'case_study_download',
                template_name: 'Case Study Download Access',
                subject: 'Your Case Study Access - {{title}}',
                html_body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0B1F4D 0%, #1a237e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f8f9fa; border: 1px solid #e0e0e0; }
        .footer { padding: 20px; text-align: center; background: #e0e0e0; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
        .case-study-box { background: #fff; padding: 20px; border: 1px solid #ddd; margin: 20px 0; border-radius: 8px; }
        .cta-button { display: inline-block; padding: 14px 28px; background: #F7941D; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .contact-box { background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            {{website_logo_html}}
            <h2>Case Study Access Granted</h2>
        </div>
        <div class="content">
            <h3>Hi {{name}},</h3>
            <p>Thank you for your interest in our case study. We've received your details and our team is reviewing them.</p>
            
            <div class="case-study-box">
                <h4 style="margin-top: 0; color: #0B1F4D;">📄 {{title}}</h4>
                <p>Your requested case study is now ready for download.</p>
            </div>
            
            <p>We'll be in touch shortly to explore result-driven growth strategies tailored to your business goals.</p>
            
            <div class="contact-box">
                <p style="margin: 5px 0;"><strong>For urgent inquiries:</strong></p>
                <p style="margin: 5px 0;"><strong>Contact:</strong> Mark Jason</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> max.brown@tgstechinfo.com</p>
            </div>
            
            <div style="text-align: center;">
                <a href="{{download_url}}" class="cta-button">Download Case Study</a>
            </div>
            
            <p>Regards,<br><strong>TGS Tech Info Team</strong></p>
        </div>
        <div class="footer">
            <p>© {{year}} TGS Tech Info. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
            }
        ];

        // Insert or update templates
        for (const template of templates) {
            const [existing] = await pool.query(
                'SELECT id FROM email_templates WHERE template_type = ?',
                [template.template_type]
            );

            if (existing.length > 0) {
                await pool.query(
                    `UPDATE email_templates 
                     SET template_name = ?, subject = ?, html_body = ?, is_active = true, updated_at = CURRENT_TIMESTAMP
                     WHERE template_type = ?`,
                    [template.template_name, template.subject, template.html_body, template.template_type]
                );
                console.log(`✅ Updated template: ${template.template_type}`);
            } else {
                await pool.query(
                    `INSERT INTO email_templates (template_type, template_name, subject, html_body, is_active)
                     VALUES (?, ?, ?, ?, ?)`,
                    [template.template_type, template.template_name, template.subject, template.html_body, true]
                );
                console.log(`✅ Inserted template: ${template.template_type}`);
            }
        }

        console.log('✅ All new email templates added successfully');
    } catch (error) {
        console.error('❌ Error adding new email templates:', error);
        throw error;
    }
}

// Run the script
addNewEmailTemplates()
    .then(() => {
        console.log('Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
