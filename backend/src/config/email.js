const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const { pool } = require('./database');

dotenv.config();

const parseBase64ImageDataUri = (value) => {
    if (!value || typeof value !== 'string') return null;
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i.exec(value);
    if (!match) return null;
    return { mimeType: match[1], base64: match[2] };
};

const getWebsiteLogoFromSettings = async () => {
    try {
        const [settingsRows] = await pool.query(
            'SELECT website_main_logo, website_logo FROM site_settings LIMIT 1'
        );
        if (settingsRows && settingsRows[0]) {
            return settingsRows[0].website_main_logo || settingsRows[0].website_logo || '';
        }
        return '';
    } catch (error) {
        console.error('Error fetching website logo for email:', error);
        return '';
    }
};

const buildEmailLogoAssets = async () => {
    const logoOriginal = await getWebsiteLogoFromSettings();
    if (!logoOriginal) {
        return { logoOriginal: '', logoSrc: '', logoHtml: '', logoImgOnly: '', attachments: [] };
    }

    const parsed = parseBase64ImageDataUri(logoOriginal);
    if (parsed) {
        const cid = 'tgstechinfo-logo';
        const logoSrc = `cid:${cid}`;
        const logoHtml = `<div style="text-align: center; margin-bottom: 20px;"><img src="${logoSrc}" alt="Logo" style="max-height: 50px; width: auto; display: inline-block; object-fit: contain;" /></div>`;
        const logoImgOnly = `<img src="${logoSrc}" alt="Logo" style="max-height: 50px; width: auto; display: inline-block; object-fit: contain;" />`;
        const attachments = [
            {
                filename: 'logo',
                cid,
                content: Buffer.from(parsed.base64, 'base64'),
                contentType: parsed.mimeType
            }
        ];

        return { logoOriginal, logoSrc, logoHtml, logoImgOnly, attachments };
    }

    const logoSrc = logoOriginal;
    const logoHtml = `<div style="text-align: center; margin-bottom: 20px;"><img src="${logoSrc}" alt="Logo" style="max-height: 50px; width: auto; display: inline-block; object-fit: contain;" /></div>`;
    const logoImgOnly = `<img src="${logoSrc}" alt="Logo" style="max-height: 50px; width: auto; display: inline-block; object-fit: contain;" />`;
    return { logoOriginal, logoSrc, logoHtml, logoImgOnly, attachments: [] };
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

    const originalHtml = html || '';
    let finalHtml = originalHtml;
    const hadLogoPlaceholder = /\{\{(website_logo_html|website_logo_img|website_logo|logo)\}\}/i.test(originalHtml);

    const { logoOriginal, logoSrc, logoHtml, logoImgOnly, attachments: logoAttachments } = await buildEmailLogoAssets();

    if (logoSrc) {
        finalHtml = finalHtml
            .replace(/\{\{website_logo_html\}\}/g, logoHtml)
            .replace(/\{\{website_logo_img\}\}/g, logoImgOnly)
            .replace(/\{\{website_logo\}\}/g, logoSrc)
            .replace(/\{\{logo\}\}/g, logoSrc);

        if (logoOriginal && logoOriginal !== logoSrc) {
            finalHtml = finalHtml.split(logoOriginal).join(logoSrc);
        }

        const alreadyHasLogo = finalHtml.includes(logoSrc);
        if (!hadLogoPlaceholder && !alreadyHasLogo) {
            finalHtml = `${logoHtml}${finalHtml}`;
        }
    } else {
        finalHtml = finalHtml
            .replace(/\{\{website_logo_html\}\}/g, '')
            .replace(/\{\{website_logo_img\}\}/g, '')
            .replace(/\{\{website_logo\}\}/g, '')
            .replace(/\{\{logo\}\}/g, '');
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        debug: true,
        logger: true
    });

    const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html: finalHtml,
        ...(logoAttachments.length || options.attachments?.length
            ? { attachments: [...logoAttachments, ...(options.attachments || [])] }
            : {})
    });
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
                    {{website_logo_html}}
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
                    {{website_logo_html}}
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
                    {{website_logo_html}}
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
                    {{website_logo_html}}
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
    chatbotQueryResponseTemplate
};
