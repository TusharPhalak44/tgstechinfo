# Email Templates - Quick Reference

## ✅ System Status
All email functionality is working correctly with enterprise-grade logo embedding.

## 📧 Active Email Templates

| Template Type | Trigger Event | Logo Embedded |
|---------------|---------------|---------------|
| `registration` | User registers account | ✅ Yes |
| `password_reset` | Forgot password request | ✅ Yes |
| `newsletter_subscription` | Newsletter signup | ✅ Yes |
| `content_submitted` | Content submitted for review | ✅ Yes |
| `content_approved` | Admin approves content | ✅ Yes |
| `content_rejected` | Admin rejects content | ✅ Yes |
| `content_published` | Content goes live | ✅ Yes |
| `case_study_download` | Case study access | ✅ Yes |

## 🚀 Quick Commands

### Test Email Configuration
```bash
cd backend
node scripts/testEmailConfig.js
```

### Send Test Email
```bash
cd backend
node scripts/sendTestEmail.js
```

### Update Templates with Logo
```bash
cd backend
node scripts/updateAllTemplatesWithLogo.js
```

### Add New Templates
```bash
cd backend
node scripts/addNewEmailTemplates.js
```

## 📝 Using Templates in Code

### Method 1: Template-Based (Recommended)
```javascript
const { sendTemplatedEmail } = require('../config/email');

await sendTemplatedEmail('password_reset', 'user@example.com', {
    first_name: 'John',
    reset_url: 'https://example.com/reset?token=abc123'
});
```

### Method 2: Direct HTML
```javascript
const { sendEmail } = require('../config/email');

await sendEmail(
    'user@example.com',
    'Subject Line',
    '<html>{{website_logo_html}}<p>Your message</p></html>'
);
```

## 🔧 Configuration (.env)

```env
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USER=info@tgstechinfo.com
EMAIL_PASSWORD='Tgs@2026#'
EMAIL_FROM=info@tgstechinfo.com
```

## 🖼️ Logo Embedding

**How it works:**
1. Logo is fetched from `site_settings` table
2. Base64 logos → converted to CID inline attachments
3. URL logos → used directly
4. Placeholder `{{website_logo_html}}` is replaced automatically

**Enterprise-grade features:**
- ✅ Inline CID embedding (not external link)
- ✅ Automatic base64 to attachment conversion
- ✅ Consistent across all email clients
- ✅ No broken images if external URLs fail

## 📊 Template Variables

### Available in All Templates
- `{{website_logo_html}}` - Company logo (auto-embedded)
- `{{year}}` - Current year

### User Variables
- `{{first_name}}`, `{{last_name}}`, `{{name}}`, `{{email}}`

### Content Variables
- `{{content_title}}`, `{{category}}`, `{{slug}}`
- `{{article_url}}`, `{{dashboard_url}}`

### Action Variables
- `{{reset_url}}`, `{{login_url}}`, `{{unsubscribe_url}}`
- `{{download_url}}`, `{{site_url}}`

### Date Variables
- `{{submitted_date}}`, `{{approved_date}}`, `{{published_date}}`

## 🎯 Features Summary

✅ **8 production-ready email templates**
✅ **Enterprise-grade logo embedding** (CID attachments)
✅ **Database-driven** template management
✅ **Admin panel** integration for editing
✅ **Automatic variable replacement**
✅ **SMTP authentication** configured (Hostinger)
✅ **Base64 & URL logo support**
✅ **Professional HTML styling**

## 📖 Full Documentation

For detailed setup, testing, and troubleshooting:
→ `backend/EMAIL_TEMPLATE_SETUP_AND_TESTING.md`

## 🆘 Quick Troubleshooting

**Emails not sending?**
```bash
node scripts/testEmailConfig.js
```

**Logo not appearing?**
```bash
node scripts/updateAllTemplatesWithLogo.js
```

**Template not found?**
```bash
node scripts/addNewEmailTemplates.js
```

## ✉️ Contact
For support: info@tgstechinfo.com
