/**
 * TGS Tech Info - Newsletter & Notification Email Templates
 * Responsive, brand-aligned HTML templates for:
 * 1. General Welcome Email
 * 2. Topic/Technology/Industry Welcome Email
 * 3. Content-Specific Welcome Email
 * 4. Automated New Content Publication Alert Email
 */

const { escapeHtml } = require('../config/email');

const BRAND = {
    navy: '#0B1F4D',
    navyDark: '#071536',
    orange: '#F7941D',
    orangeHover: '#e08316',
    slateDark: '#1e293b',
    slateMedium: '#475569',
    slateLight: '#64748b',
    bgLight: '#f8fafc',
    cardBorder: '#e2e8f0',
    white: '#ffffff'
};

function getEmailHeader(frontendUrl, logoUrl, subheader = 'Executive Tech Intelligence') {
    return `
    <div style="background: linear-gradient(135deg, ${BRAND.navy} 0%, #1a2756 100%); padding: 32px 24px; text-align: center;">
        <a href="${frontendUrl}?utm_source=email&utm_medium=newsletter&utm_campaign=welcome_header_logo" target="_blank" style="text-decoration: none; display: inline-block;">
            <img src="${logoUrl}" alt="TGS Tech Info" width="180" style="max-width: 180px; height: auto; margin: 0 auto 12px auto; display: block; border-radius: 6px; border: none; outline: none;" border="0" />
        </a>
        <p style="margin: 0; color: #93c5fd; font-size: 13px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase;">
            ${escapeHtml(subheader)}
        </p>
    </div>`;
}

function getEmailFooter(frontendUrl, unsubscribeUrl, preferencesUrl, isContentAlert = false) {
    const year = new Date().getFullYear();
    return `
    <div style="background-color: #f1f5f9; padding: 24px 28px; text-align: center; border-top: 1px solid ${BRAND.cardBorder}; font-size: 12px; color: ${BRAND.slateLight}; line-height: 1.6;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: ${BRAND.slateDark};">
            TGS Tech Info — Enterprise Technology Journalism & B2B Publishing
        </p>
        <p style="margin: 0 0 12px 0;">
            You are receiving this email because you subscribed to our tech intelligence dispatches on 
            <a href="${frontendUrl}?utm_source=email&utm_medium=newsletter&utm_campaign=welcome_footer_link" style="color: #0284c7; text-decoration: none;">tgstechinfo.com</a>.
        </p>
        <div style="margin: 14px 0 16px 0; display: inline-flex; gap: 16px; flex-wrap: wrap; justify-content: center;">
            <a href="${preferencesUrl}" style="color: ${BRAND.orange}; font-weight: 600; text-decoration: underline; margin: 0 8px;">
                Manage Topics & Preferences
            </a>
            <span style="color: #cbd5e1;">|</span>
            <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline; margin: 0 8px;">
                Unsubscribe
            </a>
        </div>
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            © ${year} TGS Tech Info (Taraj Global Solutions Pvt. Ltd.). All rights reserved.
        </p>
    </div>`;
}

/**
 * TEMPLATE 1: General Welcome Email
 * Used for Homepage, Footer, and All 9 Content Listing Pages
 */
function renderGeneralWelcomeEmail({ name, frontendUrl, unsubscribeUrl, preferencesUrl }) {
    const logoUrl = `${frontendUrl}/logo.jpg`;
    const safeName = escapeHtml(name || 'Tech Leader');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to TGS Tech Info</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${BRAND.slateDark};">
    <div style="max-width: 620px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid ${BRAND.cardBorder};">
        ${getEmailHeader(frontendUrl, logoUrl, 'Weekly Tech Intelligence Starts Here')}
        <div style="padding: 34px 30px;">
            <h1 style="color: ${BRAND.navy}; font-size: 22px; font-weight: 800; margin: 0 0 16px 0; line-height: 1.3;">
                Welcome to the TGS Tech Intelligence Community!
            </h1>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 18px 0; color: ${BRAND.slateDark};">
                Dear <strong>${safeName}</strong>,
            </p>
            <p style="font-size: 14.5px; line-height: 1.65; color: ${BRAND.slateMedium}; margin: 0 0 22px 0;">
                Thank you for subscribing to <strong>TGS Tech Info</strong>. You’ve joined over 100,000+ technology executives, software leaders, and IT decision-makers who rely on our editorial desk to cut through the digital noise.
            </p>

            <div style="background-color: #f8fafc; border-left: 4px solid ${BRAND.orange}; padding: 20px 22px; border-radius: 8px; margin: 24px 0;">
                <h3 style="margin: 0 0 12px 0; font-size: 14.5px; color: ${BRAND.navy}; text-transform: uppercase; letter-spacing: 0.8px;">
                    What You Will Receive in Your Inbox:
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; color: ${BRAND.slateDark};">
                    <tr>
                        <td style="padding: 6px 0; width: 28px; vertical-align: top;">📰</td>
                        <td style="padding: 6px 0;"><strong>Technology News & Developments</strong> — Real-time industry moves and enterprise updates.</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; vertical-align: top;">📊</td>
                        <td style="padding: 6px 0;"><strong>Whitepapers & Research Reports</strong> — Data-backed technical research and architectural guides.</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; vertical-align: top;">🎙️</td>
                        <td style="padding: 6px 0;"><strong>Executive Interviews</strong> — Conversations with C-Suite leaders, founders, and architects.</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; vertical-align: top;">💼</td>
                        <td style="padding: 6px 0;"><strong>Real-World Case Studies</strong> — Proven digital transformation frameworks and enterprise ROI breakdowns.</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; vertical-align: top;">🎥</td>
                        <td style="padding: 6px 0;"><strong>Webinars & Tech Events</strong> — Priority access to upcoming expert roundtable webinars.</td>
                    </tr>
                </table>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: ${BRAND.slateMedium}; margin: 24px 0 28px 0;">
                As a general subscriber, you’ll receive our <strong>Weekly Tech Intelligence</strong> digest every week, plus automated notifications whenever high-impact new research is published across any of our 50+ technology verticals.
            </p>

            <div style="text-align: center; margin: 30px 0 24px 0;">
                <a href="${frontendUrl}?utm_source=email&utm_medium=newsletter&utm_campaign=welcome_subscriber" target="_blank" style="display: inline-block; padding: 14px 34px; background: linear-gradient(135deg, ${BRAND.orange} 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14.5px; box-shadow: 0 4px 12px rgba(247, 148, 29, 0.35);">
                    Explore Our Latest Publications →
                </a>
            </div>

            <p style="font-size: 13px; color: ${BRAND.slateLight}; text-align: center; margin: 16px 0 0 0;">
                Want to focus on specific technologies like AI, Cloud, or Cybersecurity? 
                <a href="${preferencesUrl}" style="color: #0284c7; text-decoration: underline;">Customize your topic preferences</a>.
            </p>
        </div>
        ${getEmailFooter(frontendUrl, unsubscribeUrl, preferencesUrl)}
    </div>
</body>
</html>`;
    return html;
}

/**
 * TEMPLATE 2: Technology / Industry Welcome Email
 * Used for Technology-specific and Industry-specific pages
 */
function renderTopicWelcomeEmail({ name, topicType, topicName, frontendUrl, unsubscribeUrl, preferencesUrl }) {
    const logoUrl = `${frontendUrl}/logo.jpg`;
    const safeName = escapeHtml(name || 'Tech Leader');
    const safeTopic = escapeHtml(topicName || 'Enterprise Technology');
    const typeLabel = topicType === 'industry' ? 'Industry Vertical' : 'Technology Domain';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your ${safeTopic} Intelligence Updates</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${BRAND.slateDark};">
    <div style="max-width: 620px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid ${BRAND.cardBorder};">
        ${getEmailHeader(frontendUrl, logoUrl, `${safeTopic} Intelligence Desk`)}
        <div style="padding: 34px 30px;">
            <div style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; font-size: 11.5px; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; margin-bottom: 14px; letter-spacing: 0.6px;">
                🎯 Subscribed to: ${safeTopic} (${typeLabel})
            </div>

            <h1 style="color: ${BRAND.navy}; font-size: 21px; font-weight: 800; margin: 0 0 16px 0; line-height: 1.35;">
                Your Specialized ${safeTopic} Intelligence Updates Start Here
            </h1>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 18px 0; color: ${BRAND.slateDark};">
                Dear <strong>${safeName}</strong>,
            </p>
            <p style="font-size: 14.5px; line-height: 1.65; color: ${BRAND.slateMedium}; margin: 0 0 22px 0;">
                You are now subscribed to our specialized <strong>${safeTopic}</strong> intelligence channel. Whenever our editorial desk publishes research, architectural whitepapers, case studies, or news focused on ${safeTopic}, you will be among the first to receive it.
            </p>

            <div style="background-color: #f8fafc; border-left: 4px solid ${BRAND.orange}; padding: 20px 22px; border-radius: 8px; margin: 24px 0;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; color: ${BRAND.navy};">
                    What This Dedicated Subscription Includes:
                </h3>
                <ul style="margin: 0; padding-left: 18px; font-size: 13.5px; color: ${BRAND.slateDark}; line-height: 1.8;">
                    <li><strong>Instant New Content Alerts:</strong> Direct notification whenever fresh ${safeTopic} content is published.</li>
                    <li><strong>Curated Weekly Intelligence:</strong> High-impact digests featuring top-rated developments in this space.</li>
                    <li><strong>Zero Irrelevant Clutter:</strong> Content tailored specifically to your chosen topic interest.</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0 24px 0;">
                <a href="${frontendUrl}?utm_source=email&utm_medium=newsletter&utm_campaign=topic_welcome_${encodeURIComponent(safeTopic.toLowerCase().replace(/[^a-z0-9]+/g, '_'))}" target="_blank" style="display: inline-block; padding: 14px 34px; background: linear-gradient(135deg, ${BRAND.navy} 0%, #1e3a8a 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14.5px; box-shadow: 0 4px 12px rgba(11, 31, 77, 0.25);">
                    Explore ${safeTopic} Hub →
                </a>
            </div>

            <p style="font-size: 13px; color: ${BRAND.slateLight}; text-align: center; margin: 16px 0 0 0;">
                Want to add more topics (e.g., Cloud, AI, Security)? 
                <a href="${preferencesUrl}" style="color: #0284c7; text-decoration: underline;">Update your topic preferences</a>.
            </p>
        </div>
        ${getEmailFooter(frontendUrl, unsubscribeUrl, preferencesUrl)}
    </div>
</body>
</html>`;
    return html;
}

/**
 * TEMPLATE 3: Content-Specific Welcome Email
 * Used when visitor subscribes from an Individual Content Detail Page
 */
function renderContentSpecificWelcomeEmail({ name, contentTitle, contentType, categoryName, frontendUrl, unsubscribeUrl, preferencesUrl }) {
    const logoUrl = `${frontendUrl}/logo.jpg`;
    const safeName = escapeHtml(name || 'Tech Leader');
    const safeTitle = escapeHtml(contentTitle || 'Technology Deep-Dive');
    const safeType = escapeHtml(contentType || 'Article');
    const safeCategory = escapeHtml(categoryName || 'Enterprise Technology');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thanks for Subscribing — ${safeCategory} Insights</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${BRAND.slateDark};">
    <div style="max-width: 620px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid ${BRAND.cardBorder};">
        ${getEmailHeader(frontendUrl, logoUrl, `${safeCategory} Insights`)}
        <div style="padding: 34px 30px;">
            <div style="display: inline-block; background-color: #fef3c7; color: #b45309; font-size: 11.5px; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; margin-bottom: 14px; letter-spacing: 0.6px;">
                📖 Subscribed via: ${safeType}
            </div>

            <h1 style="color: ${BRAND.navy}; font-size: 21px; font-weight: 800; margin: 0 0 16px 0; line-height: 1.35;">
                Thanks for Subscribing! More ${safeCategory} Insights Coming Your Way
            </h1>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; color: ${BRAND.slateDark};">
                Dear <strong>${safeName}</strong>,
            </p>
            <p style="font-size: 14.5px; line-height: 1.65; color: ${BRAND.slateMedium}; margin: 0 0 20px 0;">
                Thank you for reading our publication:
            </p>

            <div style="background-color: #f1f5f9; border-left: 4px solid ${BRAND.orange}; padding: 16px 20px; border-radius: 8px; margin: 0 0 24px 0;">
                <p style="margin: 0; font-size: 15px; font-weight: 700; color: ${BRAND.navy}; line-height: 1.4;">
                    "${safeTitle}"
                </p>
                <p style="margin: 6px 0 0 0; font-size: 12.5px; color: ${BRAND.slateLight};">
                    Topic: <strong>${safeCategory}</strong> • Format: <strong>${safeType}</strong>
                </p>
            </div>

            <p style="font-size: 14px; line-height: 1.65; color: ${BRAND.slateMedium}; margin: 0 0 24px 0;">
                We have registered your topic interest in <strong>${safeCategory}</strong>. You will now receive:
            </p>
            <ul style="margin: 0 0 28px 0; padding-left: 20px; font-size: 13.5px; color: ${BRAND.slateDark}; line-height: 1.8;">
                <li>Automated alerts when fresh <strong>${safeCategory}</strong> research or case studies are published.</li>
                <li>Curated weekly tech briefings summarizing key architectural decisions and market shifts.</li>
            </ul>

            <div style="text-align: center; margin: 28px 0;">
                <a href="${frontendUrl}?utm_source=email&utm_medium=newsletter&utm_campaign=content_subscriber_${encodeURIComponent(safeCategory.toLowerCase().replace(/[^a-z0-9]+/g, '_'))}" target="_blank" style="display: inline-block; padding: 13px 32px; background: linear-gradient(135deg, ${BRAND.orange} 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(247, 148, 29, 0.3);">
                    Explore More ${safeCategory} Research →
                </a>
            </div>

            <p style="font-size: 13px; color: ${BRAND.slateLight}; text-align: center; margin: 16px 0 0 0;">
                You can manage which topics you receive alerts for at any time: 
                <a href="${preferencesUrl}" style="color: #0284c7; text-decoration: underline;">Manage Preferences</a>.
            </p>
        </div>
        ${getEmailFooter(frontendUrl, unsubscribeUrl, preferencesUrl)}
    </div>
</body>
</html>`;
    return html;
}

/**
 * TEMPLATE 4: Automated New Content Publishing Notification
 * Sent to matching subscribers when an authorized author publishes content
 */
function renderContentNotificationEmail({
    subscriberName,
    content,
    matchedReason,
    frontendUrl,
    unsubscribeUrl,
    preferencesUrl
}) {
    const logoUrl = `${frontendUrl}/logo.jpg`;
    const safeSubName = escapeHtml(subscriberName || 'Tech Leader');
    const safeTitle = escapeHtml(content.title);
    const safeDescription = escapeHtml(content.short_description || 'A new technical publication has just been released on TGS Tech Info. Read the complete breakdown.');
    const safeType = escapeHtml(content.content_type_name || 'Publication');
    const safeCategory = escapeHtml(content.category_name || 'Enterprise Technology');
    const safeReason = escapeHtml(matchedReason || 'your subscribed technology intelligence');

    // Build canonical public URL matching frontend routes: /<type>/<category>/<slug>
    const rawType = (content.content_type_slug || content.content_type_name || 'article').toLowerCase().trim();
    const typeMap = {
        article: 'article',
        articles: 'article',
        blog: 'blog',
        blogs: 'blog',
        news: 'news',
        interview: 'interview',
        interviews: 'interview',
        webinar: 'webinar',
        webinars: 'webinar',
        ebook: 'ebook',
        ebooks: 'ebook',
        whitepaper: 'whitepaper',
        whitepapers: 'whitepaper',
        report: 'report',
        reports: 'report',
        'case-study': 'case-study',
        'case-studies': 'case-study'
    };
    const typeSlug = typeMap[rawType] || 'article';
    const slug = encodeURIComponent(content.slug || '');
    const catSlug = encodeURIComponent(content.category_slug || 'general');

    let contentUrl = `${frontendUrl}/${typeSlug}/${catSlug}/${slug}`;
    if (typeSlug === 'event' || typeSlug === 'events' || content.content_type_id === 5) {
        contentUrl = `${frontendUrl}/events/${slug}`;
    }
    const cleanCampaignSlug = (content.slug || 'content_alert').toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 45);
    contentUrl += `?utm_source=email&utm_medium=newsletter_alert&utm_campaign=${cleanCampaignSlug}`;

    // Banner image with clean, neutral fallback styling (never solid dark navy background)
    let bannerHtml = '';
    if (content.banner_image) {
        const isExternal = content.banner_image.startsWith('http://') || content.banner_image.startsWith('https://');
        const imgSrc = isExternal ? content.banner_image : 'cid:content_banner_img';
        bannerHtml = `
        <div style="margin: 0 0 22px 0; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; background-color: #f8fafc; text-align: center;">
            <a href="${contentUrl}" target="_blank" style="display: block; text-decoration: none;">
                <img src="${imgSrc}" alt="${safeTitle}" style="width: 100%; height: auto; max-height: 280px; object-fit: cover; display: block; border: 0; margin: 0 auto;" />
            </a>
        </div>`;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle} — TGS Tech Info</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${BRAND.slateDark};">
    <div style="max-width: 620px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid ${BRAND.cardBorder};">
        ${getEmailHeader(frontendUrl, logoUrl, 'New Content Alert')}
        <div style="padding: 32px 28px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
                <span style="background-color: ${BRAND.orange}; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 12px; border-radius: 4px; letter-spacing: 0.8px;">
                    ${safeType}
                </span>
                <span style="font-size: 12px; color: ${BRAND.slateLight};">
                    Topic: <strong>${safeCategory}</strong>
                </span>
            </div>

            <h1 style="color: ${BRAND.navy}; font-size: 22px; font-weight: 800; margin: 0 0 16px 0; line-height: 1.35;">
                <a href="${contentUrl}" target="_blank" style="color: ${BRAND.navy}; text-decoration: none;">
                    ${safeTitle}
                </a>
            </h1>

            ${bannerHtml}

            <p style="font-size: 14.5px; line-height: 1.65; color: ${BRAND.slateMedium}; margin: 0 0 24px 0;">
                ${safeDescription}
            </p>

            <div style="background-color: #f8fafc; border-radius: 8px; padding: 14px 18px; margin-bottom: 26px; border: 1px dashed #cbd5e1; font-size: 12.5px; color: ${BRAND.slateLight};">
                💡 <em>You received this instant notification because of <strong>${safeReason}</strong>.</em>
            </div>

            <div style="text-align: center; margin: 28px 0;">
                <a href="${contentUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, ${BRAND.orange} 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(247, 148, 29, 0.38);">
                    Read Full ${safeType} →
                </a>
            </div>
        </div>
        ${getEmailFooter(frontendUrl, unsubscribeUrl, preferencesUrl, true)}
    </div>
</body>
</html>`;
    return html;
}

module.exports = {
    renderGeneralWelcomeEmail,
    renderTopicWelcomeEmail,
    renderContentSpecificWelcomeEmail,
    renderContentNotificationEmail
};

