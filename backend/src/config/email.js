const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const { pool } = require('./database');

dotenv.config();

/**
 * Get the public URL for the website
 * Uses FRONTEND_URL from environment or constructs from API_URL
 */
const getPublicUrl = () => {
    // Check for explicitly set public URL
    if (process.env.FRONTEND_URL) {
        return process.env.FRONTEND_URL.replace(/\/$/, ''); // Remove trailing slash
    }
    
    // Fallback to API_URL if set
    if (process.env.API_URL) {
        return process.env.API_URL.replace(/\/$/, '');
    }
    
    // Default fallback (development)
    return 'http://localhost:5173';
};

/**
 * Convert a logo path/data to a public HTTPS URL
 * @param {string} logoValue - Logo path or base64 data from database
 * @returns {string|null} - Public HTTPS URL or null
 */
const convertLogoToPublicUrl = (logoValue) => {
    if (!logoValue || typeof logoValue !== 'string') {
        return null;
    }

    // If it's already a full HTTP/HTTPS URL, return it
    if (logoValue.startsWith('http://') || logoValue.startsWith('https://')) {
        return logoValue;
    }

    // If it's a base64 data URI, we can't convert it to a public URL
    // Return null - the caller should handle this case
    if (logoValue.startsWith('data:')) {
        console.warn('Logo is base64 data URI - cannot convert to public URL. Logo will not be displayed in email.');
        return null;
    }

    // If it's a relative path like /uploads/branding/logo.png
    if (logoValue.startsWith('/uploads/')) {
        const publicUrl = getPublicUrl();
        return `${publicUrl}${logoValue}`;
    }

    // If it's just a filename or relative path
    if (logoValue.startsWith('uploads/')) {
        const publicUrl = getPublicUrl();
        return `${publicUrl}/${logoValue}`;
    }

    // Unknown format
    console.warn('Unknown logo format:', logoValue);
    return null;
};

/**
 * Get website logo from settings and convert to public URL
 * @returns {Promise<string|null>} - Public URL of the logo or null
 */
const getWebsiteLogoUrl = async () => {
    try {
        const [settingsRows] = await pool.query(
            'SELECT website_main_logo, website_logo FROM site_settings LIMIT 1'
        );
        if (settingsRows && settingsRows[0]) {
            const logoValue = settingsRows[0].website_main_logo || settingsRows[0].website_logo || '';
            if (logoValue) {
                return convertLogoToPublicUrl(logoValue);
            }
        }
        return null;
    } catch (error) {
        console.error('Error fetching website logo for email:', error);
        return null;
    }
};

/**
 * Build logo HTML for email (centered with styling)
 * @param {string} logoUrl - Public URL of the logo
 * @returns {string} - HTML string for logo
 */
const buildLogoHtml = (logoUrl) => {
    if (!logoUrl) return '';
    
    return `<div style="text-align:center;margin-bottom:20px;">
    <img src="${logoUrl}" alt="Company Logo" style="max-width:180px;height:auto;display:block;margin:0 auto;" />
</div>`;
};

const sendEmail = async (to, subject, html, options = {}) => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = Number(process.env.EMAIL_PORT || 587);
    const fromAddress = process.env.EMAIL_FROM || 'noreply@tgstechinfo.com';

    console.log('Email config:', { host, port, user, fromAddress });

    if (!to) {
        console.warn('Email skipped: no recipient address provided.');
        return { skipped: true, reason: 'no_recipient' };
    }

    if (!user || !pass || user.includes('placeholder') || pass.includes('placeholder')) {
        console.warn('Email skipped: credentials not configured. Expected EMAIL_USER and EMAIL_PASSWORD in the environment.');
        return { skipped: true, reason: 'credentials_not_configured', from: fromAddress };
    }

    const transporter = nodemailer.createTransporter({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        debug: true,
        logger: true
    });

    const mailOptions = {
        from: fromAddress,
        to,
        subject,
        html
    };

    // Add custom attachments if provided (but NOT the logo)
    if (options.attachments && options.attachments.length > 0) {
        mailOptions.attachments = options.attachments;
    }

    const info = await transporter.sendMail(mailOptions);
    return info;
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

        // Add default variables
        const defaultVars = {
            year: new Date().getFullYear(),
            ...variables
        };

        // Render template with variables
        let renderedSubject = template.subject;
        let renderedHtml = template.html_body;

        Object.keys(defaultVars).forEach(key => {
            const placeholder = `{{${key}}}`;
            const value = defaultVars[key] || '';
            renderedSubject = renderedSubject.replace(new RegExp(placeholder, 'g'), value);
            renderedHtml = renderedHtml.replace(new RegExp(placeholder, 'g'), value);
        });

        // Handle company logo if include_logo is enabled
        if (template.include_logo) {
            const logoUrl = await getWebsiteLogoUrl();
            if (logoUrl) {
                const logoHtml = buildLogoHtml(logoUrl);
                
                // Replace logo placeholders
                renderedHtml = renderedHtml
                    .replace(/\{\{website_logo_html\}\}/g, logoHtml)
                    .replace(/\{\{website_logo_img\}\}/g, `<img src="${logoUrl}" alt="Company Logo" style="max-width:180px;height:auto;display:block;margin:0 auto;" />`)
                    .replace(/\{\{website_logo\}\}/g, logoUrl)
                    .replace(/\{\{logo\}\}/g, logoUrl);
                
                // If no placeholder exists, prepend logo to content
                const hasLogoPlaceholder = /\{\{(website_logo_html|website_logo_img|website_logo|logo)\}\}/i.test(template.html_body);
                if (!hasLogoPlaceholder) {
                    renderedHtml = `${logoHtml}${renderedHtml}`;
                }
            } else {
                console.warn('Company logo is enabled but no valid logo URL found');
                // Remove any logo placeholders
                renderedHtml = renderedHtml
                    .replace(/\{\{website_logo_html\}\}/g, '')
                    .replace(/\{\{website_logo_img\}\}/g, '')
                    .replace(/\{\{website_logo\}\}/g, '')
                    .replace(/\{\{logo\}\}/g, '');
            }
        } else {
            // Remove any logo placeholders if logo is not enabled
            renderedHtml = renderedHtml
                .replace(/\{\{website_logo_html\}\}/g, '')
                .replace(/\{\{website_logo_img\}\}/g, '')
                .replace(/\{\{website_logo\}\}/g, '')
                .replace(/\{\{logo\}\}/g, '');
        }

        // Send email (NO ATTACHMENTS for logo)
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
    convertLogoToPublicUrl
};
