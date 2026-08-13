# Email Template System - Setup and Testing Guide

## Overview
The email template system has been fully implemented with enterprise-grade logo embedding. All emails now use database-stored templates with automatic logo inclusion as inline CID attachments.

## Features Implemented

### ✅ Email Templates Created
1. **Registration** - Welcome email when users register
2. **Content Submitted** - Notification when content is submitted for review
3. **Content Approved** - Notification when content is approved
4. **Content Rejected** - Notification when content needs changes
5. **Content Published** - Notification when content goes live
6. **Password Reset** - Secure password reset link with 1-hour expiry
7. **Newsletter Subscription** - Welcome email for newsletter subscribers
8. **Case Study Download** - Access notification for case study downloads

### ✅ Logo Embedding
- **Enterprise-Grade Implementation**: Logo is embedded as inline CID attachment (not external link)
- **Base64 Support**: Automatically converts base64 logos to CID attachments
- **URL Support**: External logo URLs are also supported
- **Automatic Injection**: Logo appears in all email headers automatically
- **Placeholder**: `{{website_logo_html}}` in all templates

---

## Email Configuration

### Current Configuration (from .env)
```env
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USER=info@tgstechinfo.com
EMAIL_PASSWORD='Tgs@2026#'
EMAIL_FROM=info@tgstechinfo.com
```

### Configuration Requirements

#### For Production (Hostinger)
```env
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465              # SSL port (recommended)
# OR
EMAIL_PORT=587              # TLS port (alternative)

EMAIL_USER=info@tgstechinfo.com
EMAIL_PASSWORD=your_actual_password
EMAIL_FROM=info@tgstechinfo.com
```

#### For Development (Gmail - Testing Only)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_app_specific_password  # Not your Gmail password!
EMAIL_FROM=your_gmail@gmail.com
```

**⚠️ Gmail App Password Setup:**
1. Enable 2-Factor Authentication in your Google Account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate an "App Password" for "Mail"
4. Use this 16-character password in EMAIL_PASSWORD

---

## Setup Instructions

### Step 1: Verify Database Tables
```bash
# From backend directory
cd backend
node scripts/createEmailTemplatesTable.js
```

**Expected Output:**
```
✅ Email templates table created successfully
✅ Default email templates inserted successfully
Migration completed successfully
```

### Step 2: Verify All Templates Have Logos
```bash
node scripts/updateAllTemplatesWithLogo.js
```

**Expected Output:**
```
✅ SUCCESS! All email templates now include logo placeholder
```

### Step 3: Verify Email Configuration
Check your `.env` file has valid email credentials:
```bash
# View current config (passwords will be hidden)
node -e "console.log({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
  from: process.env.EMAIL_FROM
})"
```

### Step 4: Upload Website Logo
1. Login to Admin Panel
2. Navigate to **Site Settings**
3. Upload your company logo (recommended: PNG with transparent background, max 200px height)
4. Save settings

---

## Testing Email Functionality

### Test 1: Password Reset Email
**Endpoint:** `POST /api/auth/forgot-password`

**Test with cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\"}"
```

**Expected:**
- ✅ Email sent with logo embedded
- ✅ Reset link includes token
- ✅ Link expires in 1 hour
- ✅ Professional styling

**Template Variables:**
- `{{first_name}}` - User's first name
- `{{reset_url}}` - Password reset URL
- `{{year}}` - Current year
- `{{website_logo_html}}` - Company logo (auto-embedded)

---

### Test 2: Newsletter Subscription
**Endpoint:** `POST /api/public/subscribe-newsletter`

**Test with cURL:**
```bash
curl -X POST http://localhost:5000/api/public/subscribe-newsletter \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"subscriber@example.com\"}"
```

**Expected:**
- ✅ Welcome email sent
- ✅ Logo embedded
- ✅ Unsubscribe link included
- ✅ Benefits listed

**Template Variables:**
- `{{name}}` - Subscriber name
- `{{site_url}}` - Website URL
- `{{unsubscribe_url}}` - Unsubscribe link
- `{{year}}` - Current year

---

### Test 3: User Registration
**Endpoint:** `POST /api/auth/register`

**Test with cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"first_name\":\"John\",
    \"last_name\":\"Doe\",
    \"email\":\"john.doe@example.com\",
    \"password\":\"SecurePass123!@#\"
  }"
```

**Expected:**
- ✅ Welcome email sent
- ✅ Logo embedded
- ✅ Login link included

---

### Test 4: Content Approval/Rejection/Publishing
**Requires:** Authenticated admin user

**Test Scenario:**
1. User creates content → `content_submitted` email sent
2. Admin approves → `content_approved` email sent
3. Admin publishes → `content_published` email sent
4. OR Admin rejects → `content_rejected` email sent with feedback

**Template Variables:**
- `{{first_name}}`, `{{last_name}}` - User info
- `{{content_title}}` - Article title
- `{{category}}` - Content category
- `{{feedback}}` - Admin feedback (rejection only)
- `{{article_url}}` - Published article URL
- `{{dashboard_url}}` - User dashboard URL

---

### Test 5: Case Study Download
**Endpoint:** `POST /api/public/case-study/:slug`

**Test with cURL:**
```bash
curl -X POST http://localhost:5000/api/public/case-study/your-case-study-slug \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"customer@example.com\",
    \"name\":\"Jane Smith\",
    \"company\":\"Tech Corp\"
  }"
```

**Expected:**
- ✅ Access granted email
- ✅ Logo embedded
- ✅ Download link included
- ✅ Contact information displayed

---

## Testing with Email Preview Tool

### Create a Test Script
```javascript
// backend/scripts/testEmailSending.js
const { sendTemplatedEmail } = require('../src/config/email');

async function testEmail() {
    try {
        const result = await sendTemplatedEmail('password_reset', 'your-test-email@example.com', {
            first_name: 'Test',
            last_name: 'User',
            reset_url: 'http://localhost:5173/reset-password?token=test123'
        });
        
        console.log('✅ Email sent successfully:', result);
    } catch (error) {
        console.error('❌ Email failed:', error);
    }
    process.exit(0);
}

testEmail();
```

**Run the test:**
```bash
node scripts/testEmailSending.js
```

---

## Troubleshooting

### Issue: Emails Not Sending

**Check 1: Verify Credentials**
```bash
# Test SMTP connection
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'info@tgstechinfo.com',
    pass: 'your_password'
  }
});
transporter.verify().then(console.log).catch(console.error);
"
```

**Expected Output:**
```
true
```

**Check 2: Review Logs**
Look for email-related errors in console:
```
Email config: { host: 'smtp.hostinger.com', port: 465, user: 'info@tgstechinfo.com', fromAddress: 'info@tgstechinfo.com' }
```

**Check 3: Verify Template Exists**
```bash
node -e "
const { pool } = require('./src/config/database');
(async () => {
  const [rows] = await pool.query('SELECT template_type, is_active FROM email_templates');
  console.table(rows);
  process.exit(0);
})();
"
```

---

### Issue: Logo Not Appearing

**Check 1: Verify Logo Uploaded**
```bash
node -e "
const { pool } = require('./src/config/database');
(async () => {
  const [rows] = await pool.query('SELECT website_main_logo, website_logo FROM site_settings LIMIT 1');
  console.log('Logo exists:', !!(rows[0]?.website_main_logo || rows[0]?.website_logo));
  process.exit(0);
})();
"
```

**Check 2: Verify Template Has Placeholder**
```bash
node -e "
const { pool } = require('./src/config/database');
(async () => {
  const [rows] = await pool.query('SELECT template_type, (html_body LIKE \"%website_logo%\") as has_logo FROM email_templates');
  console.table(rows);
  process.exit(0);
})();
"
```

**Fix:** Run the logo update script:
```bash
node scripts/updateAllTemplatesWithLogo.js
```

---

### Issue: Template Not Found

**Error Message:**
```
No active template found for type: password_reset
```

**Fix:** Re-run the template creation script:
```bash
node scripts/addNewEmailTemplates.js
```

---

### Issue: SMTP Authentication Failed

**Possible Causes:**
1. **Wrong password** - Verify EMAIL_PASSWORD in .env
2. **Port mismatch** - Try 465 (SSL) or 587 (TLS)
3. **Firewall blocking** - Check if port is open
4. **Account locked** - Too many failed attempts

**Gmail Specific:**
- Must use App Password, not regular Gmail password
- 2FA must be enabled
- Less Secure App Access is deprecated (use App Passwords)

**Hostinger Specific:**
- Ensure email account exists in cPanel
- Check email quota isn't full
- Verify SPF/DKIM records are set up

---

## Managing Email Templates

### View All Templates (Admin Panel)
1. Login as admin
2. Navigate to **Email Templates**
3. View/Edit/Toggle active status

### Update Template via API
**Endpoint:** `PUT /api/email-templates/:id`
**Auth:** Admin only

```bash
curl -X PUT http://localhost:5000/api/email-templates/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=your_token" \
  -d "{
    \"subject\":\"Welcome to Our Platform!\",
    \"html_body\":\"<html>Updated template...</html>\"
  }"
```

### Create New Template
**Endpoint:** `POST /api/email-templates`

```bash
curl -X POST http://localhost:5000/api/email-templates \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=your_admin_token" \
  -d "{
    \"template_type\":\"custom_notification\",
    \"template_name\":\"Custom Notification\",
    \"subject\":\"Important Update\",
    \"html_body\":\"<html>{{website_logo_html}}<p>Hello {{name}}</p></html>\",
    \"is_active\":true
  }"
```

---

## Available Template Variables

### Common Variables (All Templates)
- `{{website_logo_html}}` - Company logo (auto-embedded)
- `{{year}}` - Current year (auto-added)

### User-Related
- `{{first_name}}` - User's first name
- `{{last_name}}` - User's last name
- `{{email}}` - User's email address
- `{{name}}` - Full name or fallback

### Content-Related
- `{{content_title}}` - Title of content
- `{{category}}` - Content category
- `{{slug}}` - Content URL slug
- `{{article_url}}` - Full article URL
- `{{dashboard_url}}` - User dashboard URL

### Action-Related
- `{{reset_url}}` - Password reset link
- `{{login_url}}` - Login page link
- `{{unsubscribe_url}}` - Unsubscribe link
- `{{download_url}}` - File download link

### Dates
- `{{submitted_date}}` - Content submission date
- `{{approved_date}}` - Approval date
- `{{published_date}}` - Publication date
- `{{reviewed_date}}` - Review date

### Custom
- `{{feedback}}` - Admin feedback message
- `{{site_url}}` - Website URL
- `{{title}}` - Generic title field

---

## Email Sending Functions

### Function: `sendEmail(to, subject, html, options)`
Direct email sending with logo auto-embedding.

```javascript
const { sendEmail } = require('../config/email');

await sendEmail(
    'user@example.com',
    'Welcome!',
    '<html>{{website_logo_html}}<p>Hello!</p></html>',
    { attachments: [] } // optional
);
```

### Function: `sendTemplatedEmail(templateType, to, variables)`
**Recommended:** Uses database templates with variable replacement.

```javascript
const { sendTemplatedEmail } = require('../config/email');

await sendTemplatedEmail('registration', 'user@example.com', {
    first_name: 'John',
    last_name: 'Doe',
    login_url: 'https://yoursite.com/login'
});
```

---

## Production Checklist

### Before Going Live

- [ ] ✅ Email credentials configured in production .env
- [ ] ✅ All templates tested and working
- [ ] ✅ Company logo uploaded in Site Settings
- [ ] ✅ SPF records configured for domain
- [ ] ✅ DKIM configured for domain
- [ ] ✅ FROM address matches verified domain
- [ ] ✅ Test emails received successfully
- [ ] ✅ Unsubscribe links working
- [ ] ✅ Password reset flow tested
- [ ] ✅ Email logging/monitoring enabled

### Email Deliverability Best Practices

1. **Domain Authentication**
   - Set up SPF record
   - Configure DKIM signing
   - Add DMARC policy

2. **Content Quality**
   - Avoid spam trigger words
   - Keep good text-to-image ratio
   - Include plain text version
   - Add unsubscribe link

3. **Sender Reputation**
   - Use consistent FROM address
   - Start with low volume, increase gradually
   - Monitor bounce rates
   - Handle unsubscribes promptly

---

## Support & Maintenance

### Regular Tasks

1. **Weekly:** Review email logs for failures
2. **Monthly:** Check email template performance
3. **Quarterly:** Update templates for branding changes

### Monitoring

Check the `webhook_failures` table for email sending errors:
```sql
SELECT * FROM webhook_failures 
WHERE error_message LIKE '%email%' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Contact

For email template issues or questions:
- Email: info@tgstechinfo.com
- Documentation: /backend/EMAIL_SETUP.md

---

## Summary

✅ **8 email templates** created and active
✅ **Enterprise-grade logo embedding** via CID attachments
✅ **Automatic variable replacement** in all templates
✅ **Database-driven** template management
✅ **Admin panel** for template editing
✅ **Production-ready** with Hostinger SMTP

All email functionality is now working with proper logo embedding as inline attachments, meeting enterprise-grade standards.
