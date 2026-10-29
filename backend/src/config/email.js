const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { pool } = require('./database');
const { formatDateForEmail } = require('../utils/dateHelper');

// Robust multi-path env loader so EMAIL_* vars are ALWAYS loaded regardless of where process was launched
const candidateEnvFiles = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env'),
    path.resolve(process.cwd(), 'backend/.env'),
    path.resolve(process.cwd(), '.env'),
    '/var/www/tgspublish/backend/.env',
    '/var/www/tgspublish/.env'
];

candidateEnvFiles.forEach(envPath => {
    try {
        if (fs.existsSync(envPath)) {
            dotenv.config({ path: envPath, override: false });
        }
    } catch (_) {}
});
dotenv.config();

// HTML Entity Escaper for email security
const escapeHtml = (unsafe) => {
    if (unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Email rate limiting tracker (in-memory, clean garbage collection)
const emailRateLimiter = new Map();

/**
 * Intelligently extract clean human name from an email address
 * Examples:
 * - manisha6698sb@gmail.com -> "Manisha"
 * - tushar.phalak44@gmail.com -> "Tushar Phalak"
 * - tejas.pawar@tgstechinfo.com -> "Tejas Pawar"
 * - john_doe@company.com -> "John Doe"
 * - info@domain.com -> "there"
 */
function extractNameFromEmail(email) {
    if (!email || typeof email !== 'string' || !email.includes('@')) return 'there';
    const localPart = email.split('@')[0].trim().toLowerCase();

    // Generic system email prefixes to ignore
    const generic = ['info', 'admin', 'contact', 'support', 'sales', 'office', 'help', 'billing', 'team', 'service', 'hello', 'mail', 'test', 'no-reply', 'noreply'];
    if (generic.includes(localPart)) return 'there';

    // Replace separators (dots, underscores, hyphens, plus) with space
    let cleaned = localPart.replace(/[._\-+]+/g, ' ');

    // Extract alphabetical blocks, stripping digits and trailing tags
    const words = cleaned.split(/\s+/).map(w => {
        let stripped = w.replace(/^[0-9]+|[0-9]+$/g, '');
        // If word had embedded numbers like manisha6698sb, extract leading alphabetical block
        const match = stripped.match(/^([a-zA-Z]{2,})[0-9]*/);
        if (match && match[1]) {
            stripped = match[1];
        }
        return stripped;
    }).filter(w => w.length >= 2 && !/^[0-9]+$/.test(w));

    if (words.length === 0) return 'there';

    // Capitalize each word (up to 2 words)
    const formatted = words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return formatted || 'there';
}

/**
 * Check if an email address has exceeded rate limit
 * @param {string} to - Recipient email
 * @param {number} maxPerHour - Max emails per hour (default: 100)
 * @returns {boolean} - True if rate limit exceeded
 */
const isRateLimited = (to, maxPerHour = 100) => {
    if (!to) return false;
    const normalizedTo = String(to).trim().toLowerCase();
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);

    if (!emailRateLimiter.has(normalizedTo)) {
        emailRateLimiter.set(normalizedTo, []);
    }

    const timestamps = emailRateLimiter.get(normalizedTo).filter(t => t > hourAgo);

    // Clean up old entries if map grows
    if (emailRateLimiter.size > 500) {
        for (const [key, val] of emailRateLimiter.entries()) {
            if (!val || val.length === 0 || val.every(t => t <= hourAgo)) {
                emailRateLimiter.delete(key);
            }
        }
    }

    if (timestamps.length >= maxPerHour) {
        console.warn(`[Rate Limit] Email to ${normalizedTo} exceeds limit (${maxPerHour}/hour)`);
        emailRateLimiter.set(normalizedTo, timestamps);
        return true;
    }

    timestamps.push(now);
    emailRateLimiter.set(normalizedTo, timestamps);
    return false;
};

/**
 * Get the appropriate email transporter (SendGrid, Gmail, or Hostinger/custom SMTP)
 * @returns {object} - Nodemailer transporter or SendGrid transport
 */
const getEmailTransporter = () => {
    // 1. Try Brevo (Sendinblue) first if configured
    const brevoKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY;
    if (brevoKey && !brevoKey.includes('placeholder')) {
        const brevoUser = (process.env.BREVO_USER || process.env.EMAIL_USER || 'info@tgstechinfo.com').trim();
        console.log('[Email] Using Brevo SMTP Relay (smtp-relay.brevo.com:587) for', brevoUser);
        return nodemailer.createTransport({
            host: 'smtp-relay.brevo.com',
            port: 587,
            secure: false,
            auth: {
                user: brevoUser,
                pass: brevoKey.trim()
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000
        });
    }

    // 2. Try SendGrid if API key is configured
    if (process.env.SENDGRID_API_KEY && !process.env.SENDGRID_API_KEY.includes('placeholder')) {
        console.log('[Email] Using SendGrid as email service');
        return nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
                user: 'apikey',
                pass: process.env.SENDGRID_API_KEY.trim()
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000
        });
    }

    const user = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
    const rawPass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '';
    // Strip surrounding quotes
    const pass = rawPass.replace(/^['"](.*)['"]$/g, '$1');

    let host = (process.env.EMAIL_HOST || process.env.SMTP_HOST || '').trim();
    let port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 465);

    // Auto-detect Gmail if user is @gmail.com or host contains gmail
    const isGmailUser = user && user.toLowerCase().endsWith('@gmail.com');
    const isGmailHost = host && host.toLowerCase().includes('gmail');

    if (isGmailUser || isGmailHost) {
        host = 'smtp.gmail.com';
        if (!process.env.EMAIL_PORT && !process.env.SMTP_PORT) {
            port = 465;
        }
        console.log(`[Email] Using Gmail SMTP (${host}:${port}) for ${user}`);
    } else if (host.includes('hostinger') || !host) {
        host = host || 'smtp.hostinger.com';
        console.log(`[Email] Using Hostinger SMTP (${host}:${port}) for ${user}`);
    } else {
        console.log(`[Email] Using Custom SMTP (${host}:${port}) for ${user}`);
    }

    const isSecure = port === 465;

    return nodemailer.createTransport({
        host,
        port,
        secure: isSecure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development'
    });
};

/**
 * Get the public URL for the website
 * Uses FRONTEND_URL from environment or constructs from API_URL
 * Handles multiple URLs by taking the first one for email purposes
 */
const getPublicUrl = () => {
    // Check for explicitly set public URL
    const raw = process.env.SITE_URL || process.env.FRONTEND_URL || process.env.API_URL || 'https://tgstechinfo.com';
    const firstUrl = raw.split(',')[0].trim();
    if (firstUrl.startsWith('http://localhost') || firstUrl.startsWith('http://127.0.0.1')) {
        if (process.env.NODE_ENV === 'production') {
            return 'https://tgstechinfo.com';
        }
    }
    const cleanUrl = firstUrl.replace(/\/$/, '');
    return cleanUrl || 'https://tgstechinfo.com';
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

// Constant for inline embedded logo across all emails
const LOGO_CID = 'tgs_company_logo';

/**
 * Get website logo as a Buffer and MIME type from database (or disk)
 * @returns {Promise<{buffer: Buffer, contentType: string}|null>}
 */
const getWebsiteLogoData = async () => {
    try {
        // 1. Check site_settings database for dynamic base64 logo
        const [rows] = await pool.query(
            'SELECT website_main_logo, website_navbar_logo, website_logo FROM site_settings LIMIT 1'
        );
        if (rows && rows[0]) {
            const rawLogo = rows[0].website_main_logo || rows[0].website_navbar_logo || rows[0].website_logo;
            if (rawLogo && typeof rawLogo === 'string' && rawLogo.startsWith('data:')) {
                const match = rawLogo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (match && match.length === 3) {
                    const buf = Buffer.from(match[2], 'base64');
                    // Ensure saved to disk too for static hosting compatibility
                    try {
                        const brandingDir = path.join(__dirname, '../../uploads/branding');
                        if (!fs.existsSync(brandingDir)) fs.mkdirSync(brandingDir, { recursive: true });
                        fs.writeFileSync(path.join(brandingDir, 'logo.png'), buf);
                    } catch (_) {}
                    return { buffer: buf, contentType: match[1] || 'image/png' };
                }
            }
        }
        // 2. Fallback check for default branding logo file on disk
        const diskPath = path.join(__dirname, '../../uploads/branding/logo.png');
        if (fs.existsSync(diskPath)) {
            const buf = fs.readFileSync(diskPath);
            return { buffer: buf, contentType: 'image/png' };
        }
    } catch (err) {
        console.warn('[getWebsiteLogoData] Error loading logo data:', err.message);
    }
    return null;
};

/**
 * Convert a logo path/data to a public HTTPS URL (avoiding heavy base64 data URIs in emails)
 * @param {string} logoValue - Logo path or base64 data from database
 * @returns {object|null} - Object with {type: 'url', value: string} or null
 */
const convertLogoToPublicUrl = (logoValue) => {
    if (!logoValue || typeof logoValue !== 'string') {
        return null;
    }

    const publicUrl = getPublicUrl();

    // If it's already a full HTTP/HTTPS URL, return it
    if (logoValue.startsWith('http://') || logoValue.startsWith('https://')) {
        return { type: 'url', value: logoValue };
    }

    // If it's a base64 data URI, persist it to disk as a static image
    if (logoValue.startsWith('data:')) {
        try {
            const matches = logoValue.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const brandingDir = path.join(__dirname, '../../uploads/branding');
                if (!fs.existsSync(brandingDir)) {
                    fs.mkdirSync(brandingDir, { recursive: true });
                }
                const logoFilePath = path.join(brandingDir, 'logo.png');
                fs.writeFileSync(logoFilePath, Buffer.from(matches[2], 'base64'));
                return { type: 'url', value: `${publicUrl}/uploads/branding/logo.png` };
            }
        } catch (e) {
            console.warn('[convertLogoToPublicUrl] Could not persist base64 logo:', e.message);
        }
        return { type: 'url', value: `${publicUrl}/uploads/branding/logo.png` };
    }

    // Relative path (e.g. /uploads/branding/logo.png)
    const relativePath = logoValue.startsWith('/') ? logoValue : '/' + logoValue;
    return { type: 'url', value: `${publicUrl}${relativePath}` };
};

/**
 * Get website logo from settings and convert to public URL
 * @returns {Promise<object|null>} - Object with {type: 'url', value: string} or null
 */
const getWebsiteLogoUrl = async () => {
    try {
        const publicUrl = getPublicUrl();
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
        const defaultLogoPath = path.join(__dirname, '../../uploads/branding/logo.png');
        if (fs.existsSync(defaultLogoPath)) {
            return { type: 'url', value: `${publicUrl}/uploads/branding/logo.png` };
        }
        return null;
    } catch (error) {
        console.error('Error fetching website logo for email:', error);
        return null;
    }
};

/**
 * Build logo HTML for email using verified static HTTPS asset
 * @param {string} [customUrl] - Optional website URL
 * @returns {string} - HTML string for logo
 */
const buildLogoHtml = (customUrl = null) => {
    const publicUrl = customUrl || getPublicUrl();
    const logoUrl = `${publicUrl}/logo.png`;
    const altText = 'TGS Tech Info';

    return `<div style="text-align:center;margin:0 auto 16px auto;">
    <a href="${escapeHtml(publicUrl)}" target="_blank" style="text-decoration:none;display:inline-block;">
        <img src="${logoUrl}" 
             alt="${altText}" 
             title="${altText}" 
             width="170" 
             style="max-width:170px;height:auto;display:block;margin:0 auto;border-radius:6px;border:none;outline:none;text-decoration:none;" 
             border="0" />
    </a>
</div>`;
};

const sendEmail = async (to, subject, html, options = {}) => {
    // Check rate limit (allow up to 100 per hour for testing/admin)
    if (isRateLimited(to, 100)) {
        console.warn(`[sendEmail] Rate limit exceeded for ${to}`);
        return {
            success: false,
            skipped: true,
            reason: 'rate_limit_exceeded',
            message: 'Too many emails sent to this address. Please try again later.'
        };
    }

    if (!to) {
        console.warn('Email skipped: no recipient address provided.');
        return { success: false, skipped: true, reason: 'no_recipient' };
    }

    const rawFrom = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'info@tgstechinfo.com';
    // Clean "Name" <email@domain.com> to extract email address for default replyTo if needed
    const fromAddress = rawFrom.includes('<') && rawFrom.includes('>')
        ? rawFrom.match(/<([^>]+)>/)?.[1] || rawFrom
        : rawFrom;
    const replyTo = process.env.EMAIL_REPLY_TO || fromAddress;
    const organization = process.env.EMAIL_ORGANIZATION || 'TGS Tech Info';

    const user = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
    const rawPass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '';
    const pass = rawPass.replace(/^['"](.*)['"]$/g, '$1');
    const host = (process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.hostinger.com').trim();
    const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 465);

    if (!user || !pass || user.includes('placeholder') || pass.includes('placeholder')) {
        const hasBrevo = process.env.BREVO_API_KEY && !process.env.BREVO_API_KEY.includes('placeholder');
        const hasSendgrid = process.env.SENDGRID_API_KEY && !process.env.SENDGRID_API_KEY.includes('placeholder');
        if (!hasBrevo && !hasSendgrid) {
            console.warn(`[sendEmail] Email skipped: no email credentials configured. user="${user}" host="${host}"`);
            return { success: false, skipped: true, reason: 'credentials_not_configured', from: fromAddress };
        }
    }

    console.log(`[sendEmail] Dispatching to "${to}" | Subject: "${subject}" | Host: ${host}:${port} | User: ${user}`);

    const transporter = getEmailTransporter();
    const publicUrl = getPublicUrl();
    const unsubscribeUrl = `${publicUrl}/unsubscribe?email=${encodeURIComponent(to || '')}`;

    // Auto-append compliant unsubscribe footer ONLY for marketing/newsletter (not transactional)
    let finalHtml = html;
    let finalAttachments = options.attachments ? [...options.attachments] : [];

    // Automatically ensure company logo is rendered using the verified static asset (https://tgstechinfo.com/logo.png)
    const shouldIncludeLogo = options.includeLogo !== false;
    if (shouldIncludeLogo && typeof finalHtml === 'string') {
        const logoUrl = `${publicUrl}/logo.png`;
        const logoHtml = buildLogoHtml(publicUrl);

        // Replace logo placeholders
        finalHtml = finalHtml
            .replace(/\{\{website_logo_html\}\}/gi, logoHtml)
            .replace(/\{\{website_logo_img\}\}/gi, `<img src="${logoUrl}" alt="TGS Tech Info" width="170" style="max-width:170px;height:auto;display:block;margin:0 auto;border-radius:6px;border:none;outline:none;" border="0" />`)
            .replace(/\{\{website_logo\}\}/gi, logoUrl)
            .replace(/\{\{logo\}\}/gi, logoUrl);

        // Normalize any old broken logo paths (like /uploads/branding/logo.png or cid:tgs_company_logo) to verified static URL
        finalHtml = finalHtml.replace(/cid:tgs_company_logo/gi, logoUrl);
        finalHtml = finalHtml.replace(/https?:\/\/[^\s"']+\/uploads\/branding\/logo\.png/gi, logoUrl);
        finalHtml = finalHtml.replace(/\/uploads\/branding\/logo\.png/gi, logoUrl);
        finalHtml = finalHtml.replace(/https?:\/\/[^\s"']+\/logo\.jpg/gi, logoUrl);

        // Check if finalHtml now uses the logo URL
        const usesLogoUrl = finalHtml.includes(logoUrl);

        // If template didn't have a logo tag, inject the logo at the top
        if (!usesLogoUrl) {
            if (finalHtml.includes('class="header"') || finalHtml.includes("class='header'")) {
                finalHtml = finalHtml.replace(/(<div[^>]*class=["']header["'][^>]*>)/i, `$1\n${logoHtml}`);
            } else if (finalHtml.includes('class="container"') || finalHtml.includes("class='container'")) {
                finalHtml = finalHtml.replace(/(<div[^>]*class=["']container["'][^>]*>)/i, `$1\n${logoHtml}`);
            } else if (finalHtml.includes('<body')) {
                finalHtml = finalHtml.replace(/(<body[^>]*>)/i, `$1\n${logoHtml}`);
            } else {
                finalHtml = `${logoHtml}${finalHtml}`;
            }
        }
    }

    if (!options.isTransactional && typeof finalHtml === 'string' && !/unsubscribe/i.test(finalHtml)) {
        const unsubscribeFooter = `
            <div style="margin-top: 35px; padding-top: 18px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; font-family: Arial, sans-serif;">
                <p style="margin: 0 0 6px 0;">You received this email because you subscribed to or requested content from <strong>${escapeHtml(organization)}</strong>.</p>
                <p style="margin: 0;">To stop receiving these communications, <a href="${unsubscribeUrl}" style="color: #0284c7; text-decoration: underline;">click here to unsubscribe</a>.</p>
            </div>
        `;
        if (finalHtml.includes('</body>')) {
            finalHtml = finalHtml.replace('</body>', `${unsubscribeFooter}</body>`);
        } else {
            finalHtml += unsubscribeFooter;
        }
    }

    // Generate plain text fallback by stripping HTML tags
    const textFallback = options.text || (typeof finalHtml === 'string'
        ? finalHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\n\s+\n/g, '\n\n')
            .trim()
        : '');

    // Setup headers (only attach List-Unsubscribe for bulk/newsletter, not for transactional contact form)
    const mailHeaders = {
        'X-Priority': '3'
    };
    if (!options.isTransactional) {
        mailHeaders['List-Unsubscribe'] = `<${unsubscribeUrl}>, <mailto:${replyTo}?subject=Unsubscribe>`;
        mailHeaders['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
    }

    const mailOptions = {
        from: `"${organization}" <${fromAddress}>`,
        to,
        subject,
        text: textFallback,
        html: finalHtml,
        replyTo: replyTo,
        headers: mailHeaders
    };

    // Add attachments (including inline logo)
    if (finalAttachments.length > 0) {
        mailOptions.attachments = finalAttachments;
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[sendEmail] Email successfully sent to ${to}. MessageId: ${info.messageId || info.id}`);
        return { ...info, success: true };
    } catch (sendErr) {
        console.error(`[sendEmail] Primary send error for ${to} via ${host}:${port}:`, sendErr.message);

        // Automatic fallback: if port 465 failed on Hostinger/custom SMTP, try port 587 with STARTTLS
        if (port === 465 && !host.includes('brevo') && !host.includes('sendgrid')) {
            try {
                console.log(`[sendEmail] Attempting retry via fallback port 587 (STARTTLS) for ${to}...`);
                const fallbackTransporter = nodemailer.createTransport({
                    host,
                    port: 587,
                    secure: false,
                    requireTLS: true,
                    auth: { user, pass },
                    tls: { rejectUnauthorized: false },
                    connectionTimeout: 10000,
                    greetingTimeout: 10000,
                    socketTimeout: 15000
                });
                const fallbackInfo = await fallbackTransporter.sendMail(mailOptions);
                console.log(`[sendEmail] Fallback email successfully sent to ${to}. MessageId: ${fallbackInfo.messageId || fallbackInfo.id}`);
                return { ...fallbackInfo, success: true };
            } catch (fallbackErr) {
                console.error(`[sendEmail] Fallback port 587 also failed for ${to}:`, fallbackErr.message);
            }
        }

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
            success: false,
            error: sendErr.message,
            responseCode: sendErr.responseCode || 500,
            skipped: true,
            reason: 'smtp_error'
        };
    }
};

// Template for subscription email
const subscriptionEmailTemplate = (name, contentTitle) => {
    const safeName = escapeHtml(name);
    const safeTitle = escapeHtml(contentTitle);
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
                    <h3>Hi ${safeName},</h3>
                    <p>Thank you for reaching out! We've received your details, and our team is reviewing them.</p>
                    <p>We'll be in touch shortly to explore result-driven growth strategies tailored to your business goals.</p>
                    <p>You now have access to: <strong>${safeTitle}</strong></p>
                    <p>For urgent placements and queries, please feel free to contact:</p>
                    <p><strong>Contact person:</strong> Mark Jason</p>
                    <p><strong>Email ID:</strong> tgs.admin001@gmail.com</p>
                    <br>
                    <p>Regards,</p>
                    <p><strong>TGS Tech Info Team</strong></p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} TGS Tech Info. All rights reserved.</p>
                    <p style="margin-top: 8px; font-size: 11px; color: #777;">
                        Don't want to receive these emails? <a href="${getPublicUrl()}/unsubscribe" style="color: #0284c7; text-decoration: underline;">Unsubscribe</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
};

const accessGrantEmailTemplate = (name, contentTitle, downloadUrl = null, isEbook = false) => {
    const safeName = escapeHtml(name || 'there');
    const safeTitle = escapeHtml(contentTitle || 'the requested content');
    const resourceType = isEbook ? 'eBook' : 'Resource';
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f1f5f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
                .header { background: linear-gradient(135deg, #0B1F4D 0%, #0AAEEF 100%); color: white; padding: 32px 24px; text-align: center; }
                .content { padding: 32px 28px; background: #ffffff; }
                .btn { display: inline-block; background: linear-gradient(135deg, #F7941D 0%, #EA580C 100%); color: #ffffff !important; padding: 14px 32px; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 8px; box-shadow: 0 4px 14px rgba(247, 148, 29, 0.4); margin: 20px 0; }
                .footer { padding: 20px; text-align: center; background: #f8fafc; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Your ${resourceType} is Ready</h1>
                    <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">TGS Tech Info Knowledge Hub</p>
                </div>
                <div class="content">
                    <h3 style="color: #0f172a; margin-top: 0;">Hi ${safeName},</h3>
                    <p>Thank you for your interest! Your copy of <strong>${safeTitle}</strong> is ready for download.</p>
                    
                    ${downloadUrl ? `
                    <div style="text-align: center; margin: 28px 0;">
                        <a href="${downloadUrl}" class="btn" target="_blank" download>
                            📥 Download ${resourceType} (PDF)
                        </a>
                        <p style="margin-top: 12px; font-size: 12px; color: #64748b;">
                            If the button doesn't open, copy and paste this direct link into your browser:<br/>
                            <a href="${downloadUrl}" style="color: #0AAEEF; word-break: break-all;">${downloadUrl}</a>
                        </p>
                    </div>
                    ` : `
                    <p style="padding: 14px 18px; background: #f0f9ff; border-left: 4px solid #0AAEEF; border-radius: 6px; font-size: 14px;">
                        Access to <strong>${safeTitle}</strong> has been unlocked.
                    </p>
                    `}

                    <p style="margin-top: 24px; font-size: 13px; color: #475569;">
                        We hope this publication provides valuable insights for your research. If you have any questions or feedback, feel free to reach out to our team.
                    </p>

                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
                        <p style="margin: 2px 0;"><strong>Editorial & Insights Team</strong></p>
                        <p style="margin: 2px 0;">TGS Tech Info</p>
                        <p style="margin: 2px 0;"><a href="${getPublicUrl()}" style="color: #0AAEEF; text-decoration: none;">tgstechinfo.com</a></p>
                    </div>
                </div>
                <div class="footer">
                    <p style="margin: 0;">© ${new Date().getFullYear()} TGS Tech Info. All rights reserved.</p>
                    <p style="margin-top: 8px; font-size: 11px; color: #94a3b8;">
                        Don't want to receive these emails? <a href="${getPublicUrl()}/unsubscribe" style="color: #0AAEEF; text-decoration: underline;">Unsubscribe</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
};

const chatbotQueryAdminTemplate = (email, query, submittedAt) => {
    const safeEmail = escapeHtml(email);
    const safeQuery = escapeHtml(query);
    const safeSubmittedAt = escapeHtml(submittedAt);
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
                        <p>${safeEmail}</p>
                       
                        <p class="label" style="margin-top: 15px;">User Query:</p>
                        <p style="font-style: italic;">"${safeQuery}"</p>
                       
                        <p class="label" style="margin-top: 15px;">Submitted At:</p>
                        <p>${safeSubmittedAt}</p>
                       
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
    const safeQuery = escapeHtml(query);
    const safeAdminResponse = escapeHtml(adminResponse);
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
                        <p style="font-style: italic;">"${safeQuery}"</p>
                    </div>
                   
                    <div class="response-box">
                        <p class="label">Our Response:</p>
                        <p>${safeAdminResponse}</p>
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
        const derivedName = variables.name || [variables.first_name, variables.last_name].filter(Boolean).join(' ') || variables.first_name || extractNameFromEmail(to);
        const derivedFirstName = variables.first_name || (variables.name ? variables.name.split(' ')[0] : '') || extractNameFromEmail(to).split(' ')[0];
        const derivedLastName = variables.last_name || (variables.name && variables.name.split(' ').length > 1 ? variables.name.split(' ').slice(1).join(' ') : '');
        const derivedTitle = variables.title || variables.content_title || 'Content';

        // Add default variables with complete aliases and fallback URLs
        const defaultVars = {
            year: new Date().getFullYear(),
            site_url: publicUrl,
            frontend_url: publicUrl,
            login_url: `${publicUrl}/login`,
            dashboard_url: `${publicUrl}/user-dashboard`,
            unsubscribe_url: `${publicUrl}/unsubscribe?email=${encodeURIComponent(to || '')}`,
            download_url: publicUrl,
            reset_url: `${publicUrl}/reset-password`,
            name: derivedName,
            first_name: derivedFirstName,
            last_name: derivedLastName,
            job_title: variables.job_title || '',
            company_name: variables.company_name || '',
            country: variables.country || '',
            title: derivedTitle,
            content_title: derivedTitle,
            category: 'General',
            submitted_date: formatDateForEmail(new Date()),
            approved_date: formatDateForEmail(new Date()),
            published_date: formatDateForEmail(new Date()),
            reviewed_date: formatDateForEmail(new Date()),
            feedback: '',
            email: to || '',
            support_email: 'tgs.admin001@gmail.com',
            admin_email: 'tgs.admin001@gmail.com',
            contact_email: 'tgs.admin001@gmail.com',
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

        // Ensure company logo is ALWAYS rendered in all email templates using verified static asset
        const logoHtml = buildLogoHtml(publicUrl);
        const logoUrl = `${publicUrl}/logo.png`;

        renderedHtml = renderedHtml
            .replace(/\{\{website_logo_html\}\}/gi, logoHtml)
            .replace(/\{\{website_logo_img\}\}/gi, `<img src="${logoUrl}" alt="TGS Tech Info" width="170" style="max-width:170px;height:auto;display:block;margin:0 auto;border-radius:6px;border:none;outline:none;" border="0" />`)
            .replace(/\{\{website_logo\}\}/gi, logoUrl)
            .replace(/\{\{logo\}\}/gi, logoUrl);

        // Also normalize any old /uploads/branding/logo.png or cid: paths
        renderedHtml = renderedHtml.replace(/cid:tgs_company_logo/gi, logoUrl);
        renderedHtml = renderedHtml.replace(/https?:\/\/[^\s"']+\/uploads\/branding\/logo\.png/gi, logoUrl);
        renderedHtml = renderedHtml.replace(/\/uploads\/branding\/logo\.png/gi, logoUrl);
        renderedHtml = renderedHtml.replace(/https?:\/\/[^\s"']+\/logo\.jpg/gi, logoUrl);

        const hasLogoPlaceholder = /\{\{(website_logo_html|website_logo_img|website_logo|logo)\}\}/i.test(template.html_body);
        if (!hasLogoPlaceholder && !renderedHtml.includes('/logo.png')) {
            if (renderedHtml.includes('class="header"') || renderedHtml.includes("class='header'")) {
                renderedHtml = renderedHtml.replace(/(<div[^>]*class=["']header["'][^>]*>)/i, `$1\n${logoHtml}`);
            } else if (renderedHtml.includes('class="container"') || renderedHtml.includes("class='container'")) {
                renderedHtml = renderedHtml.replace(/(<div[^>]*class=["']container["'][^>]*>)/i, `$1\n${logoHtml}`);
            } else {
                renderedHtml = `${logoHtml}${renderedHtml}`;
            }
            console.log('[sendTemplatedEmail] Logo prepended to header');
        }

        // Send email
        const isTransactional = ['registration', 'password_reset', 'content_submitted', 'content_approved', 'content_rejected'].includes(templateType);
        const result = await sendEmail(to, renderedSubject, renderedHtml, { isTransactional });
        return result;
    } catch (error) {
        console.error('Error sending templated email:', error);
        throw error;
    }
};

module.exports = {
    LOGO_CID,
    sendEmail,
    sendTemplatedEmail,
    extractNameFromEmail,
    getWebsiteLogoData,
    accessGrantEmailTemplate,
    subscriptionEmailTemplate,
    renderCaseStudyEmail,
    chatbotQueryAdminTemplate,
    chatbotQueryResponseTemplate,
    getWebsiteLogoUrl,
    buildLogoHtml,
    convertLogoToPublicUrl,
    getPublicUrl,
    getBackendUrl,
    escapeHtml
};
