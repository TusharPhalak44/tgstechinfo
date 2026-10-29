-- 1. Ensure newsletter_subscribers table has name & unsubscribe_reason columns
ALTER TABLE `newsletter_subscribers` ADD COLUMN IF NOT EXISTS `name` VARCHAR(255) NULL AFTER `email`;
ALTER TABLE `newsletter_subscribers` ADD COLUMN IF NOT EXISTS `unsubscribe_reason` TEXT NULL AFTER `unsubscribed_at`;

-- 2. Ensure all email_templates have include_logo enabled
UPDATE `email_templates` SET `include_logo` = 1;

-- 3. Update newsletter_subscription template with robust inline styles and logo placeholder
UPDATE `email_templates` 
SET `html_body` = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to TGS Tech Info Newsletter</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0B1F4D 0%, #1a237e 100%); padding: 28px 24px; text-align: center;">
            <a href="{{site_url}}" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://tgstechinfo.com/logo.jpg" alt="TGS Tech Info" width="170" style="max-width: 170px; height: auto; margin: 0 auto 12px auto; display: block; border-radius: 6px; border: none; outline: none;" border="0" />
            </a>
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">Welcome to Our Newsletter</h1>
        </div>
        <div style="padding: 32px 28px;">
            <p style="font-size: 16px; line-height: 1.6; margin-top: 0; color: #1e293b;">Hi <strong>{{name}}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Thank you for subscribing to the TGS Tech Info newsletter! We are excited to have you as part of our community.
            </p>
            <div style="background-color: #f1f5f9; border-left: 4px solid #F7941D; padding: 16px 20px; border-radius: 6px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; font-weight: 700;">What You will Receive:</p>
                <div style="padding: 6px 0; font-size: 14px; color: #1e293b;">📰 <strong>Latest Articles</strong> - Stay updated with our newest tech insights and case studies</div>
                <div style="padding: 6px 0; font-size: 14px; color: #1e293b;">🎯 <strong>Industry Trends</strong> - Get ahead with cutting-edge technology updates</div>
                <div style="padding: 6px 0; font-size: 14px; color: #1e293b;">💡 <strong>Expert Tips</strong> - Learn from industry professionals and thought leaders</div>
                <div style="padding: 6px 0; font-size: 14px; color: #1e293b;">🎁 <strong>Exclusive Content</strong> - Access subscriber-only resources and downloads</div>
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                You will receive our newsletter regularly, bringing you valuable content directly to your inbox.
            </p>
            <div style="text-align: center; margin: 28px 0;">
                <a href="{{site_url}}" style="display: inline-block; padding: 12px 28px; background-color: #F7941D; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px;">Visit Our Website</a>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                You are receiving this email because you subscribed on tgstechinfo.com.<br />
                To unsubscribe at any time, <a href="{{unsubscribe_url}}" style="color: #0284c7; text-decoration: underline;">click here</a>.
            </p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            © {{year}} TGS Tech Info. All rights reserved.
        </div>
    </div>
</body>
</html>',
`include_logo` = 1
WHERE `template_type` = 'newsletter_subscription';

