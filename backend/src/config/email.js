const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

dotenv.config();

// Email rate limiting tracker (in-memory, for production use Redis)
const emailRateLimiter = new Map();

/**
 * Check if an email address has exceeded rate limit
 * @param {string} to - Recipient email
 * @param {number} maxPerHour - Max emails per hour (default: 5)
 * @returns {boolean} - True if rate limit exceeded
 */
const isRateLimited = (to, maxPerHour = 5) => {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    if (!emailRateLimiter.has(to)) {
        emailRateLimiter.set(to, []);
    }
    
    const timestamps = emailRateLimiter.get(to).filter(t => t > hourAgo);
    emailRateLimiter.set(to, timestamps);
    
    if (timestamps.length >= maxPerHour) {
        console.warn(`[Rate Limit] Email to ${to} exceeds limit (${maxPerHour}/hour)`);
        return true;
    }
    
    timestamps.push(now);
    emailRateLimiter.set(to, timestamps);
    return false;
};

/**
 * Get the appropriate email transporter (SendGrid or Hostinger)
 * @returns {object} - Nodemailer transporter or SendGrid transport
 */
const getEmailTransporter = () => {
    // Try SendGrid first if API key is configured
    if (process.env.SENDGRID_API_KEY && !process.env.SENDGRID_API_KEY.includes('placeholder')) {
        console.log('[Email] Using SendGrid as email service');
        return nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
                user: 'apikey',
                pass: process.env.SENDGRID_API_KEY
            }
        });
    }
    
    // Fall back to Hostinger
    console.log('[Email] Using Hostinger SMTP as email service');
    const user = process.env.EMAIL_USER;
    const rawPass = process.env.EMAIL_PASSWORD;
    const pass = rawPass ? rawPass.replace(/^['"](.*)['"]$/g, '$1') : rawPass;
    const host = process.env.EMAIL_HOST || 'smtp.hostinger.com';
    const port = Number(process.env.EMAIL_PORT || 465);
    
    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        debug: true,
        logger: true
    });
};

/**
 * Get the public URL for the website
 * Uses FRONTEND_URL from environment or constructs from API_URL
 * Handles multiple URLs by taking the first one for email purposes
 */
const getPublicUrl = () => {
    // Check for explicitly set public URL
    if (process.env.FRONTEND_URL) {
        // Handle multiple URLs (comma-separated) by taking the first one
        const firstUrl = process.env.FRONTEND_URL.split(',')[0].trim();
        return firstUrl.replace(/\/$/, ''); // Remove trailing slash
    }
    
    // Fallback to API_URL if set
    if (process.env.API_URL) {
        const firstUrl = process.env.API_URL.split(',')[0].trim();
        return firstUrl.replace(/\/$/, '');
    }
    
    // Default fallback (development)
    return 'http://localhost:5173';
};

/**
 * Get the backend URL for hosting static files (like logos)
 * This is specifically for file hosting, not frontend URLs
 */
const getBackendUrl = () => {
    // Check for BACKEND_URL first
    if (process.env.BACKEND_URL) {
        return process.env.BACKEND_URL.replace(/\/$/, '');
    }
    
    // Check for API_URL (often points to backend)
    if (process.env.API_URL) {
        const firstUrl = process.env.API_URL.split(',')[0].trim();
        return firstUrl.replace(/\/$/, '');
    }
    
    // Default to localhost backend
    return 'http://localhost:5000';
};

/**
 * Convert a logo path/data to a public HTTPS URL or inline base64 data
 * @param {string} logoValue - Logo path or base64 data from database
 * @returns {object|null} - Object with {type: 'url'|'base64', value: string} or null
 */
const convertLogoToPublicUrl = (logoValue) => {
    if (!logoValue || typeof logoValue !== 'string') {
        return null;
    }

    // If it's a base64 data URI, validate and return it as base64 type
    if (logoValue.startsWith('data:')) {
        if (logoValue.startsWith('data:image/') && logoValue.includes('base64,')) {
            return { type: 'base64', value: logoValue };
        }
        console.warn('Invalid base64 logo format:', logoValue.substring(0, 50) + '...');
        return null;
    }

    // Check if relative path image exists on local disk -> convert to inline Base64 Data URI for emails (NOT as attachment)
    const relativePath = logoValue.startsWith('/') ? logoValue : '/' + logoValue;
    const localDiskPath = path.join(__dirname, '../../', relativePath);
    if (fs.existsSync(localDiskPath)) {
        try {
            const ext = path.extname(localDiskPath).replace('.', '').toLowerCase() || 'png';
            const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            const imageBuffer = fs.readFileSync(localDiskPath);
            const base64Data = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
            console.log('[convertLogoToPublicUrl] Embedded local logo file inline as Base64 Data URI:', relativePath);
            return { type: 'base64', value: base64Data };
        } catch (readErr) {
            console.warn('[convertLogoToPublicUrl] Could not read local logo file:', readErr.message);
        }
    }

    // If it's already a full HTTP/HTTPS URL, return it
    if (logoValue.startsWith('http://') || logoValue.startsWith('https://')) {
        return { type: 'url', value: logoValue };
    }

    // Fallback to backend public URL
    const backendUrl = getBackendUrl();
    const fullUrl = `${backendUrl}${relativePath}`;
    console.log('[convertLogoToPublicUrl] Fallback logo URL:', fullUrl);
    return { type: 'url', value: fullUrl };
};

/**
 * Get website logo from settings and convert to public URL or base64
 * @returns {Promise<object|null>} - Object with {type: 'url'|'base64', value: string} or null
 */
const getWebsiteLogoUrl = async () => {
    try {
        const [settingsRows] = await pool.query(
            'SELECT website_main_logo, website_logo, cms_logo1 FROM site_settings LIMIT 1'
        );
        if (settingsRows && settingsRows[0]) {
            const logoValue = settingsRows[0].website_main_logo || settingsRows[0].website_logo || settingsRows[0].cms_logo1 || '';
            if (logoValue) {
                const converted = convertLogoToPublicUrl(logoValue);
                if (converted) return converted;
            }
        }
        // Fallback check for default branding logo file on disk
        const defaultLogoPath = path.join(__dirname, '../../uploads/branding/logo.png');
        if (fs.existsSync(defaultLogoPath)) {
            return convertLogoToPublicUrl('/uploads/branding/logo.png');
        }
        return null;
    } catch (error) {
        console.error('Error fetching website logo for email:', error);
        return null;
    }
};

/**
 * Build logo HTML for email (centered with styling and fallback)
 * @param {object} logoData - Object with {type: 'url'|'base64', value: string}
 * @returns {string} - HTML string for logo
 */
const buildLogoHtml = (logoData) => {
    if (!logoData || !logoData.value) return '';
    
    const logoSrc = logoData.value;
    const altText = 'TGS Tech Info Logo';
    
    // For both base64 and URL, use consistent styling with fallbacks
    return `<div style="text-align:center;margin-bottom:20px;padding:10px;background-color:#ffffff;">
    <img src="${logoSrc}" 
         alt="${altText}" 
         title="${altText}"
         style="max-width:180px;height:auto;display:block;margin:0 auto;border:none;"
         width="180"
         border="0" />
</div>`;
};

const sendEmail = async (to, subject, html, options = {}) => {
    // Check rate limit
    if (isRateLimited(to, 5)) {
        console.warn(`[sendEmail] Rate limit exceeded for ${to}`);
        return { 
            skipped: true, 
            reason: 'rate_limit_exceeded',
            message: 'Too many emails sent to this address. Please try again later.'
        };
    }

    if (!to) {
        console.warn('Email skipped: no recipient address provided.');
        return { skipped: true, reason: 'no_recipient' };
    }

    const fromAddress = process.env.EMAIL_FROM || 'noreply@tgstechinfo.com';
    const replyTo = process.env.EMAIL_REPLY_TO || fromAddress;
    const organization = process.env.EMAIL_ORGANIZATION || 'TGS Tech Info';

    // Validate email configuration
    const user = process.env.EMAIL_USER;
    const rawPass = process.env.EMAIL_PASSWORD;
    const pass = rawPass ? rawPass.replace(/^['"](.*)['"]$/g, '$1') : rawPass;
    
    if (!user || !pass || user.includes('placeholder') || pass.includes('placeholder')) {
        if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY.includes('placeholder')) {
            console.warn('Email skipped: no email service configured. Configure EMAIL_USER/EMAIL_PASSWORD or SENDGRID_API_KEY.');
            return { skipped: true, reason: 'credentials_not_configured', from: fromAddress };
        }
    }

    const transporter = getEmailTransporter();
    const messageId = `<${Date.now()}@${fromAddress.split('@')[1]}>`;

    const mailOptions = {
        from: `"${organization}" <${fromAddress}>`,
        to,
        subject,
        html,
        replyTo: replyTo,
        messageId: messageId,
        headers: {
            'X-Priority': '3',
            'X-Mailer': 'TGS Tech Info Mailer',
            'X-Organization': organization,
            'List-Unsubscribe': `<mailto:${replyTo}?subject=Unsubscribe>`,
            'Precedence': 'bulk'
        }
    };

    // Add custom attachments if provided
    if (options.attachments && options.attachments.length > 0) {
        mailOptions.attachments = options.attachments;
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[sendEmail] Email successfully sent to ${to}. MessageId: ${info.messageId || info.id}`);
        return info;
    } catch (sendErr) {
        console.error(`[sendEmail] Email Send Error for recipient ${to}:`, sendErr.message);
        
        // Check for Hostinger suspension
        if (sendErr.message && sendErr.message.includes('suspended')) {
            console.error(`[sendEmail] CRITICAL: Email account appears suspended on Hostinger`);
            console.error(`[sendEmail] ACTION REQUIRED: Log into Hostinger hPanel and reactivate the email account.`);
        }
        
        // Check for SMTP outbound blocking
        if (sendErr.responseCode === 554 || (sendErr.message && sendErr.message.includes('554'))) {
            console.warn(`[sendEmail] CRITICAL: Outbound sending is disabled on SMTP host`);
        }
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`\n============================ EMAIL PREVIEW (${to}) ============================`);
            console.log(`Subject: ${subject}`);
            console.log(`To: ${to}`);
            console.log(`From: ${fromAddress}`);
            console.log(`=================================================================================\n`);
        }
        
        return {
            error: sendErr.message,
            responseCode: sendErr.responseCode || 500,
            skipped: true,
            reason: 'smtp_error'
        };
    }
};

// Template for subscription email
const subscriptionEmailTemplate = (name, contentTitle) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a237e; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f5f5f5; }
                .footer { padding: 20px; text-align: center; background: #e0e0e0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Subscription Confirmed</h2>
                </div>
                <div class="content">
                    <h3>Hi ${name},</h3>
                    <p>Thank you for reaching out! We've received your details, and our team is reviewing them.</p>
                    <p>We'll be in touch shortly to explore result-driven growth strategies tailored to your business goals.</p>
                    <p>You now have access to: <strong>${contentTitle}</strong></p>
                    <p>For urgent placements and queries, please feel free to contact:</p>
                    <p><strong>Contact person:</strong> Mark Jason</p>
                    <p><strong>Email ID:</strong> </p>
                    <br>
                    <p>Regards,</p>
                    <p><strong>TGS Tech Info Team</strong></p>
                </div>
                <div class="footer"><p>© 2024 TGS Tech Info. All rights reserved.</p></div>
            </div>
        </body>
        </html>
    `;
};

// Template for access grant email
const accessGrantEmailTemplate = (name, contentTitle) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a237e; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f5f5f5; }
                .footer { padding: 20px; text-align: center; background: #e0e0e0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Content Access Granted</h2>
                </div>
                <div class="content">
                    <h3>Hi ${name},</h3>
                    <p>Thank you for reaching out! We've received your details, and our team is reviewing them.</p>
                    <p>We'll be in touch shortly to explore result-driven growth strategies tailored to your business goals.</p>
                    <p>You now have access to: <strong>${contentTitle}</strong></p>
                    <p>For urgent placements and queries, please feel free to contact:</p>
                    <p><strong>Contact person:</strong> Mark Jason</p>
                    <p><strong>Email ID:</strong> max.brown@tgstechinfo.com</p>
                    <br>
                    <p>Regards,</p>
                    <p><strong>TGS Tech Info Team</strong></p>
                </div>
                <div class="footer">
                    <p>© 2024 TGS Tech Info. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

const chatbotQueryAdminTemplate = (email, query, submittedAt) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #F7941D 0%, #E67E00 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f5f5f5; }
                .query-box { background: white; padding: 20px; border-left: 4px solid #F7941D; margin: 20px 0; }
                .footer { padding: 20px; text-align: center; background: #e0e0e0; }
                .label { font-weight: bold; color: #666; }
                .status { display: inline-block; padding: 5px 10px; background: #fff3cd; color: #856404; border-radius: 4px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>New Chatbot Query Received</h2>
                </div>
                <div class="content">
                    <p>A new chatbot query has been submitted.</p>
                   
                    <div class="query-box">
                        <p class="label">User Email:</p>
                        <p>${email}</p>
                       
                        <p class="label" style="margin-top: 15px;">User Query:</p>
                        <p style="font-style: italic;">"${query}"</p>
                       
                        <p class="label" style="margin-top: 15px;">Submitted At:</p>
                        <p>${submittedAt}</p>
                       
                        <p class="label" style="margin-top: 15px;">Status:</p>
                        <p><span class="status">Pending</span></p>
                    </div>
                   
                    <p>Please log in to the Admin Panel to review and respond.</p>
                   
                    <p>Regards,</p>
                    <p><strong>TGS Tech Info Team</strong></p>
                </div>
                <div class="footer">
                    <p>© 2024 TGS Tech Info. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};
 
// Template for admin response to user
const chatbotQueryResponseTemplate = (query, adminResponse) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #F7941D 0%, #E67E00 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f5f5f5; }
                .query-box { background: white; padding: 20px; border-left: 4px solid #F7941D; margin: 20px 0; }
                .response-box { background: #e8f5e9; padding: 20px; border-left: 4px solid #4caf50; margin: 20px 0; }
                .footer { padding: 20px; text-align: center; background: #e0e0e0; }
                .label { font-weight: bold; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🤖 Response to Your Chatbot Query</h2>
                </div>
                <div class="content">
                    <p>Thank you for your question through our website chatbot. Our team has reviewed your query and provided a response below.</p>
                   
                    <div class="query-box">
                        <p class="label">Your Question:</p>
                        <p style="font-style: italic;">"${query}"</p>
                    </div>
                   
                    <div class="response-box">
                        <p class="label">Our Response:</p>
                        <p>${adminResponse}</p>
                    </div>
                   
                    <p>If you have any further questions, please don't hesitate to reach out through our chatbot or contact form.</p>
                   
                    <p>Regards,</p>
                    <p><strong>TGS Tech Info Team</strong></p>
                </div>
                <div class="footer">
                    <p>© 2024 TGS Tech Info. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

/**
 * Render a custom HTML email template stored on the content record.
 * Supports simple {{name}}, {{title}}, {{email}}, {{contact}} placeholders.
 * Falls back to the standard access-grant template when no custom template exists.
 */
const renderCaseStudyEmail = (customTemplate, vars = {}) => {
    if (!customTemplate || !customTemplate.trim()) {
        return accessGrantEmailTemplate(vars.name || 'there', vars.title || 'the case study');
    }
    return customTemplate
        .replace(/\{\{name\}\}/gi, vars.name || 'there')
        .replace(/\{\{title\}\}/gi, vars.title || '')
        .replace(/\{\{email\}\}/gi, vars.email || '')
        .replace(/\{\{contact\}\}/gi, vars.contact || '')
        .replace(/\{\{slug\}\}/gi, vars.slug || '');
};

/**
 * Send templated email using database template
 * @param {string} templateType - Type of template (registration, content_submitted, etc.)
 * @param {string} to - Recipient email
 * @param {object} variables - Variables to replace in template
 */
const sendTemplatedEmail = async (templateType, to, variables = {}) => {
    try {
        const EmailTemplate = require('../models/EmailTemplate');
        const template = await EmailTemplate.findByType(templateType);

        if (!template) {
            console.warn(`No active template found for type: ${templateType}`);
            return { skipped: true, reason: 'template_not_found' };
        }

        const publicUrl = getPublicUrl();
        const derivedName = variables.name || [variables.first_name, variables.last_name].filter(Boolean).join(' ') || variables.first_name || (to ? to.split('@')[0] : 'there');
        const derivedFirstName = variables.first_name || (variables.name ? variables.name.split(' ')[0] : '') || (to ? to.split('@')[0] : 'there');
        const derivedLastName = variables.last_name || (variables.name && variables.name.split(' ').length > 1 ? variables.name.split(' ').slice(1).join(' ') : '');
        const derivedTitle = variables.title || variables.content_title || 'Content';

        // Add default variables with complete aliases and fallback URLs
        const defaultVars = {
            year: new Date().getFullYear(),
            site_url: publicUrl,
            frontend_url: publicUrl,
            login_url: `${publicUrl}/login`,
            dashboard_url: `${publicUrl}/user/dashboard`,
            unsubscribe_url: `${publicUrl}/unsubscribe`,
            download_url: publicUrl,
            reset_url: `${publicUrl}/reset-password`,
            name: derivedName,
            first_name: derivedFirstName,
            last_name: derivedLastName,
            title: derivedTitle,
            content_title: derivedTitle,
            category: 'General',
            submitted_date: new Date().toLocaleDateString(),
            approved_date: new Date().toLocaleDateString(),
            published_date: new Date().toLocaleDateString(),
            reviewed_date: new Date().toLocaleDateString(),
            feedback: '',
            email: to || '',
            ...variables
        };

        // Render template with variables
        let renderedSubject = template.subject;
        let renderedHtml = template.html_body;

        Object.keys(defaultVars).forEach(key => {
            const val = defaultVars[key] !== undefined && defaultVars[key] !== null ? String(defaultVars[key]) : '';
            // Escape special regex characters in key if any
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
            renderedSubject = renderedSubject.replace(regex, val);
            renderedHtml = renderedHtml.replace(regex, val);
        });

        // Handle company logo if include_logo is enabled
        if (template.include_logo) {
            console.log('[sendTemplatedEmail] Logo is enabled for template:', template.template_type);
            const logoData = await getWebsiteLogoUrl();
            console.log('[sendTemplatedEmail] Logo data fetched:', logoData ? 'Found' : 'Not found');
            
            if (logoData && logoData.value) {
                const logoHtml = buildLogoHtml(logoData);
                const logoValue = logoData.value;
                console.log('[sendTemplatedEmail] Logo type:', logoData.type, 'Logo value length:', logoValue.length);
                
                // Replace logo placeholders with improved HTML
                renderedHtml = renderedHtml
                    .replace(/\{\{website_logo_html\}\}/gi, logoHtml)
                    .replace(/\{\{website_logo_img\}\}/gi, `<img src="${logoValue}" alt="TGS Tech Info Logo" style="max-width:180px;height:auto;display:block;margin:0 auto;border:none;" width="180" border="0" />`)
                    .replace(/\{\{website_logo\}\}/gi, logoValue)
                    .replace(/\{\{logo\}\}/gi, logoValue);
                
                console.log('[sendTemplatedEmail] Logo placeholders replaced successfully');
                
                // If no placeholder exists, prepend logo to content
                const hasLogoPlaceholder = /\{\{(website_logo_html|website_logo_img|website_logo|logo)\}\}/i.test(template.html_body);
                if (!hasLogoPlaceholder) {
                    renderedHtml = `${logoHtml}${renderedHtml}`;
                    console.log('[sendTemplatedEmail] Logo prepended (no placeholder found)');
                }
            } else {
                console.warn('[sendTemplatedEmail] Company logo is enabled but no valid logo found in database');
                // Remove any logo placeholders to avoid broken images
                renderedHtml = renderedHtml
                    .replace(/\{\{website_logo_html\}\}/gi, '')
                    .replace(/\{\{website_logo_img\}\}/gi, '')
                    .replace(/\{\{website_logo\}\}/gi, '')
                    .replace(/\{\{logo\}\}/gi, '');
            }
        } else {
            console.log('[sendTemplatedEmail] Logo is disabled for template:', template.template_type);
            // Remove any logo placeholders if logo is not enabled
            renderedHtml = renderedHtml
                .replace(/\{\{website_logo_html\}\}/gi, '')
                .replace(/\{\{website_logo_img\}\}/gi, '')
                .replace(/\{\{website_logo\}\}/gi, '')
                .replace(/\{\{logo\}\}/gi, '');
        }

        // Send email
        const result = await sendEmail(to, renderedSubject, renderedHtml);
        return result;
    } catch (error) {
        console.error('Error sending templated email:', error);
        throw error;
    }
};

module.exports = {
    sendEmail,
    sendTemplatedEmail,
    accessGrantEmailTemplate,
    subscriptionEmailTemplate,
    renderCaseStudyEmail,
    chatbotQueryAdminTemplate,
    chatbotQueryResponseTemplate,
    getWebsiteLogoUrl,
    buildLogoHtml,
    convertLogoToPublicUrl,
    getPublicUrl,
    getBackendUrl
};
