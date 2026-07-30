const { pool } = require('../src/config/database');

async function createEmailTemplatesTable() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS email_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                template_type VARCHAR(100) NOT NULL,
                template_name VARCHAR(255) NOT NULL,
                subject VARCHAR(500) NOT NULL,
                html_body TEXT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_template_type (template_type),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await pool.query(createTableQuery);
        console.log('✅ Email templates table created successfully');

        // Insert default templates
        await insertDefaultTemplates();
        console.log('✅ Default email templates inserted successfully');

    } catch (error) {
        console.error('❌ Error creating email templates table:', error);
        throw error;
    }
}

async function insertDefaultTemplates() {
    const templates = [
        {
            template_type: 'registration',
            template_name: 'User Registration Welcome',
            subject: 'Welcome to TGS Tech Info - Your Account is Ready!',
            html_body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0B1F4D 0%, #1a237e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f8f9fa; border: 1px solid #e0e0e0; }
        .footer { padding: 20px; text-align: center; background: #e0e0e0; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
        .cta-button { display: inline-block; padding: 14px 28px; background: #F7941D; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .cta-button:hover { background: #e68600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to TGS Tech Info!</h1>
        </div>
        <div class="content">
            <h3>Hi {{first_name}},</h3>
            <p>Your account has been successfully created and is ready to use.</p>
            <p>You can now:</p>
            <ul>
                <li>Create and submit articles for review</li>
                <li>Track your content status</li>
                <li>Manage your profile</li>
            </ul>
            <div style="text-align: center;">
                <a href="{{login_url}}" class="cta-button">Login to Your Account</a>
            </div>
            <p>If you have any questions, feel free to reach out to our support team.</p>
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
            template_type: 'content_submitted',
            template_name: 'Content Submitted for Review',
            subject: 'Your Article "{{content_title}}" Has Been Submitted for Review',
            html_body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0B1F4D 0%, #1a237e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f8f9fa; border: 1px solid #e0e0e0; }
        .footer { padding: 20px; text-align: center; background: #e0e0e0; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
        .status-box { background: #fff3cd; padding: 15px; border-left: 4px solid #F7941D; margin: 20px 0; }
        .cta-button { display: inline-block; padding: 14px 28px; background: #F7941D; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Article Submitted for Review</h2>
        </div>
        <div class="content">
            <h3>Hi {{first_name}},</h3>
            <p>Your article has been successfully submitted for review.</p>
            
            <div class="status-box">
                <p><strong>Article Title:</strong> {{content_title}}</p>
                <p><strong>Category:</strong> {{category}}</p>
                <p><strong>Submitted On:</strong> {{submitted_date}}</p>
                <p><strong>Status:</strong> <span style="color: #F7941D; font-weight: bold;">Pending Review</span></p>
            </div>
            
            <p>Our editorial team will review your article and get back to you within 2-3 business days.</p>
            
            <div style="text-align: center;">
                <a href="{{dashboard_url}}" class="cta-button">View Your Dashboard</a>
            </div>
            
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
            template_type: 'content_approved',
            template_name: 'Content Approved',
            subject: 'Great News! Your Article "{{content_title}}" Has Been Approved',
            html_body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f8f9fa; border: 1px solid #e0e0e0; }
        .footer { padding: 20px; text-align: center; background: #e0e0e0; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
        .status-box { background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; }
        .cta-button { display: inline-block; padding: 14px 28px; background: #4caf50; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🎉 Article Approved!</h2>
        </div>
        <div class="content">
            <h3>Hi {{first_name}},</h3>
            <p>Great news! Your article has been approved by our editorial team.</p>
            
            <div class="status-box">
                <p><strong>Article Title:</strong> {{content_title}}</p>
                <p><strong>Category:</strong> {{category}}</p>
                <p><strong>Approved On:</strong> {{approved_date}}</p>
                <p><strong>Status:</strong> <span style="color: #4caf50; font-weight: bold;">Approved</span></p>
            </div>
            
            <p>Your article is now scheduled for publication. You will receive another notification once it's live.</p>
            
            <div style="text-align: center;">
                <a href="{{dashboard_url}}" class="cta-button">View Your Dashboard</a>
            </div>
            
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
            template_type: 'content_rejected',
            template_name: 'Content Rejected',
            subject: 'Update on Your Article "{{content_title}}" - Changes Requested',
            html_body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f44336 0%, #c62828 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f8f9fa; border: 1px solid #e0e0e0; }
        .footer { padding: 20px; text-align: center; background: #e0e0e0; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
        .status-box { background: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }
        .feedback-box { background: #fff; padding: 15px; border: 1px solid #ddd; margin: 20px 0; border-radius: 4px; }
        .cta-button { display: inline-block; padding: 14px 28px; background: #f44336; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Changes Requested</h2>
        </div>
        <div class="content">
            <h3>Hi {{first_name}},</h3>
            <p>Our editorial team has reviewed your article and requested some changes.</p>
            
            <div class="status-box">
                <p><strong>Article Title:</strong> {{content_title}}</p>
                <p><strong>Category:</strong> {{category}}</p>
                <p><strong>Reviewed On:</strong> {{reviewed_date}}</p>
                <p><strong>Status:</strong> <span style="color: #f44336; font-weight: bold;">Changes Requested</span></p>
            </div>
            
            <div class="feedback-box">
                <p><strong>Feedback:</strong></p>
                <p>{{feedback}}</p>
            </div>
            
            <p>Please make the requested changes and resubmit your article for review.</p>
            
            <div style="text-align: center;">
                <a href="{{dashboard_url}}" class="cta-button">View & Edit Your Article</a>
            </div>
            
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
            template_type: 'content_published',
            template_name: 'Content Published',
            subject: '🎉 Your Article "{{content_title}}" is Now Live!',
            html_body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0B1F4D 0%, #1a237e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f8f9fa; border: 1px solid #e0e0e0; }
        .footer { padding: 20px; text-align: center; background: #e0e0e0; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
        .status-box { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0; }
        .cta-button { display: inline-block; padding: 14px 28px; background: #F7941D; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🎉 Your Article is Now Live!</h2>
        </div>
        <div class="content">
            <h3>Hi {{first_name}},</h3>
            <p>Exciting news! Your article has been published and is now live on TGS Tech Info.</p>
            
            <div class="status-box">
                <p><strong>Article Title:</strong> {{content_title}}</p>
                <p><strong>Category:</strong> {{category}}</p>
                <p><strong>Published On:</strong> {{published_date}}</p>
                <p><strong>Status:</strong> <span style="color: #2196f3; font-weight: bold;">Published</span></p>
            </div>
            
            <p>Thank you for your valuable contribution to our community. Your article is now available for our readers.</p>
            
            <div style="text-align: center;">
                <a href="{{article_url}}" class="cta-button">Read Your Article</a>
            </div>
            
            <p>Share your article with your network and help us spread knowledge!</p>
            
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

    for (const template of templates) {
        await pool.query(
            `INSERT INTO email_templates (template_type, template_name, subject, html_body, is_active)
             VALUES (?, ?, ?, ?, ?)`,
            [template.template_type, template.template_name, template.subject, template.html_body, true]
        );
    }
}

// Run the migration
createEmailTemplatesTable()
    .then(() => {
        console.log('Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
