# Email Configuration Setup

This application uses Nodemailer for sending emails. To enable email functionality, configure the following environment variables in your `.env` file:

## Required Environment Variables

```env
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password-or-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_FROM=max.brown@tgstechinfo.com
```

## Email Service Providers

### Gmail
1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password:
   - Go to Google Account > Security > 2-Step Verification > App passwords
   - Create a new app password for "Mail"
   - Use this 16-character password as `EMAIL_PASSWORD`
3. Set `EMAIL_HOST=smtp.gmail.com` and `EMAIL_PORT=587`

### Hostinger
1. Log in to your Hostinger hPanel
2. Go to Emails > your email account > SMTP Configuration
3. Use the following settings:
   - `EMAIL_HOST=smtp.hostinger.com`
   - `EMAIL_PORT=465` (for SSL) or `EMAIL_PORT=587` (for TLS)
   - `EMAIL_USER=your-email@yourdomain.com` (your full Hostinger email address)
   - `EMAIL_PASSWORD=your-email-password` (your Hostinger email password)
   - `EMAIL_FROM=your-email@yourdomain.com` (same as EMAIL_USER)

### Other SMTP Providers
- **Outlook/Hotmail**: `EMAIL_HOST=smtp-mail.outlook.com`, `EMAIL_PORT=587`
- **SendGrid**: `EMAIL_HOST=smtp.sendgrid.net`, `EMAIL_PORT=587`
- **Amazon SES**: Use your SMTP endpoint and credentials

## Email Functionality

### 1. Newsletter Subscription
- **Endpoint**: `POST /api/public/newsletter`
- **Trigger**: When a user subscribes to the newsletter
- **Template**: Built-in confirmation email with TGS Tech Info branding

### 2. Contact Form
- **Endpoint**: `POST /api/public/contact`
- **Trigger**: When a user submits the contact form
- **Emails sent**:
  - Confirmation email to the user
  - Notification email to admin (info@tgstechinfo.com)

### 3. Case Study Downloads
- **Endpoint**: `POST /api/public/case-study-gate`
- **Trigger**: When a user fills the case study gate form
- **Template**: Uses custom `email_subject` and `email_template` from CMS if available, otherwise uses default template
- **Placeholders supported**: `{{name}}`, `{{title}}`, `{{email}}`, `{{contact}}`, `{{slug}}`

## Custom Email Templates for Case Studies

To use a custom email template for a case study:

1. Go to the CMS and edit the case study content
2. Select "Case Study" as the content type
3. In the `email_subject` field, add your custom email subject line with placeholders
4. In the `email_template` field, add your custom HTML email body
5. Use placeholders to personalize the email:
   - `{{name}}` - User's name from the form
   - `{{title}}` - Case study title
   - `{{email}}` - User's email
   - `{{contact}}` - User's contact number
   - `{{slug}}` - Case study slug

Example custom template:
```html
Subject: Your Case Study: {{title}} is ready, {{name}}!

Email Body:
<!DOCTYPE html>
<html>
<body>
  <h1>Hi {{name}},</h1>
  <p>Thanks for your interest in {{title}}.</p>
  <p>Your case study is ready for download.</p>
  <p>We'll send it to: {{email}}</p>
  <p>Contact us at {{contact}} if you have questions.</p>
</body>
</html>
```

## Testing

To test email functionality:
1. Ensure all environment variables are set
2. Subscribe to the newsletter via the frontend
3. Submit a contact form
4. Download a case study
5. Check the recipient's inbox for the emails

## Troubleshooting

If emails are not being sent:
1. Check the backend logs for error messages
2. Verify environment variables are correctly set
3. Ensure your email provider allows SMTP access
4. For Gmail, make sure you're using an App Password (not your regular password)
5. Check if the email credentials are correct
