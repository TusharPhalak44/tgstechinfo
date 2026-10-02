const fs = require('fs');
const path = require('path');
const { getLandingPagesRoot, isValidSlug, getFileLandingPageUrl, getMimeType } = require('../utils/landingPageHelper');
const { pool } = require('../config/database');

// Blacklist of forbidden filenames or paths within landing pages
const FORBIDDEN_FILENAMES = new Set([
    '.env',
    '.env.local',
    '.env.production',
    'package.json',
    'package-lock.json',
    '.git',
    '.gitignore',
    'dockerfile',
    'docker-compose.yml',
    'server.js',
    'node_modules'
]);

/**
 * Clean 404 response that hides internal paths and stack traces
 */
function sendNotFound(res, slug) {
    res.status(404).set('Content-Type', 'text/html; charset=UTF-8').send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Landing Page Not Found</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .box { text-align: center; padding: 48px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); max-width: 480px; }
        h1 { font-size: 56px; margin: 0 0 8px 0; color: #0284c7; }
        p { color: #64748b; font-size: 16px; margin: 0 0 24px 0; }
        a { display: inline-block; background: #0284c7; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
        a:hover { background: #0369a1; }
    </style>
</head>
<body>
    <div class="box">
        <h1>404</h1>
        <h2>Landing Page Not Found</h2>
        <p>The requested landing page could not be found or is unavailable.</p>
        <a href="/">Return Home</a>
    </div>
</body>
</html>`);
}

const { v4: uuidv4 } = require('uuid');
const VisitorSession = require('../models/VisitorSession');
const CookieConsent = require('../models/CookieConsent');
const PageView = require('../models/PageView');

/**
 * Ensures a valid session_uuid and consent_uuid exist to satisfy foreign key
 * and NOT NULL constraints in the page_views table.
 */
async function getOrCreateSessionAndConsent(req, slug) {
    let sessionUuid = req.headers['x-session-uuid'] || req.cookies?.['session_uuid'] || null;
    let consentUuid = req.headers['x-consent-uuid'] || req.cookies?.['consent_uuid'] || null;

    try {
        if (!consentUuid) {
            consentUuid = uuidv4();
            await CookieConsent.create({
                consent_uuid: consentUuid,
                consent_type: 'implicit',
                ip_address: req.ip || '127.0.0.1',
                user_agent: req.headers['user-agent'] || 'LandingPage Visitor',
                analytics_cookies: true,
                functional_cookies: true
            }).catch(() => {});
        } else {
            const consent = await CookieConsent.findByUuid(consentUuid).catch(() => null);
            if (!consent) {
                await CookieConsent.create({
                    consent_uuid: consentUuid,
                    consent_type: 'implicit',
                    ip_address: req.ip || '127.0.0.1',
                    user_agent: req.headers['user-agent'] || 'LandingPage Visitor',
                    analytics_cookies: true,
                    functional_cookies: true
                }).catch(() => {});
            }
        }

        if (sessionUuid) {
            const session = await VisitorSession.findByUuid(sessionUuid).catch(() => null);
            if (!session) {
                await pool.query(
                    `INSERT INTO visitor_sessions (
                        session_uuid, consent_uuid, country, browser, operating_system,
                        device_type, ip_address, landing_page
                    ) VALUES (?, ?, 'India', 'Unknown', 'Unknown', 'desktop', ?, ?)`,
                    [sessionUuid, consentUuid, req.ip || '127.0.0.1', `/lp/${slug}`]
                ).catch(() => {});
            }
        } else {
            sessionUuid = uuidv4();
            await pool.query(
                `INSERT INTO visitor_sessions (
                    session_uuid, consent_uuid, country, browser, operating_system,
                    device_type, ip_address, landing_page
                ) VALUES (?, ?, 'India', 'Unknown', 'Unknown', 'desktop', ?, ?)`,
                [sessionUuid, consentUuid, req.ip || '127.0.0.1', `/lp/${slug}`]
            ).catch(() => {});
        }
    } catch (err) {
        sessionUuid = sessionUuid || uuidv4();
        consentUuid = consentUuid || uuidv4();
    }

    return { sessionUuid, consentUuid };
}

/**
 * Asynchronously record a page view in the existing analytics system.
 */
async function recordPageViewAsync(req, slug, title) {
    try {
        const pageUrl = `/lp/${slug}`;
        const pageTitle = title || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const { sessionUuid, consentUuid } = await getOrCreateSessionAndConsent(req, slug);

        await PageView.create({
            session_uuid: sessionUuid,
            consent_uuid: consentUuid,
            page_url: pageUrl,
            page_title: pageTitle,
            page_type: 'landing',
            content_type: 'whitepaper'
        });
    } catch (err) {
        // Non-critical logging, never fail response
    }
}

/**
 * Serves a file-based landing page (index.html) or any of its sub-assets (css, js, images, pdfs).
 */
exports.serveLandingPageOrAsset = async (req, res) => {
    try {
        const slug = (req.params.slug || '').trim();

        // 1. Validate slug syntax
        if (!isValidSlug(slug)) {
            return sendNotFound(res, slug);
        }

        const landingPagesRoot = getLandingPagesRoot();

        // Ensure landingPagesRoot directory exists
        if (!fs.existsSync(landingPagesRoot)) {
            fs.mkdirSync(landingPagesRoot, { recursive: true });
        }

        // 2. Resolve landing page folder
        const pageDir = path.resolve(landingPagesRoot, slug);

        // Security: pageDir must be strictly inside landingPagesRoot
        if (!pageDir.startsWith(landingPagesRoot + path.sep)) {
            return res.status(403).send('Forbidden');
        }

        // Check if landing page folder exists
        if (!fs.existsSync(pageDir)) {
            return sendNotFound(res, slug);
        }

        const pageStat = fs.statSync(pageDir);
        if (!pageStat.isDirectory()) {
            return sendNotFound(res, slug);
        }

        // 3. Extract subpath if any (e.g. css/style.css, assets/banner.jpg)
        const rawSubpath = req.params.subpath;
        let relativeSubpath = '';

        if (Array.isArray(rawSubpath)) {
            relativeSubpath = rawSubpath.join('/');
        } else if (typeof rawSubpath === 'string') {
            relativeSubpath = rawSubpath;
        }

        relativeSubpath = relativeSubpath.replace(/^\/+|\/+$/g, '');

        // 4. Case A: Root landing page requested (index.html)
        if (!relativeSubpath || relativeSubpath === 'index.html') {
            const indexPath = path.join(pageDir, 'index.html');

            if (!fs.existsSync(indexPath) || !fs.statSync(indexPath).isFile()) {
                // Section 4: If the folder exists but index.html does not exist -> 404
                return sendNotFound(res, slug);
            }

            // Check optional landing.json metadata
            let pageTitle = '';
            const metadataPath = path.join(pageDir, 'landing.json');
            if (fs.existsSync(metadataPath) && fs.statSync(metadataPath).isFile()) {
                try {
                    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                    if (metadata && metadata.published === false) {
                        return sendNotFound(res, slug);
                    }
                    if (metadata && metadata.title) {
                        pageTitle = metadata.title;
                    }
                } catch (e) {
                    // Ignore metadata parsing error
                }
            }

            // Asynchronously record page view
            await recordPageViewAsync(req, slug, pageTitle);

            // Auto-provision or find the dedicated content record for this landing page
            const { getOrCreateContentForLandingPage } = require('../utils/landingPageHelper');
            let contentRecord = null;
            try {
                contentRecord = await getOrCreateContentForLandingPage(slug);
            } catch (e) {
                console.warn('[serveLandingPage] Auto-provision note:', e.message);
            }

            let htmlContent = fs.readFileSync(indexPath, 'utf8');

            // Inject <base href="/lp/{slug}/"> if no base tag exists,
            // so relative URLs (css/style.css, assets/banner.jpg) resolve seamlessly
            // whether visited at /lp/slug or /lp/slug/
            if (!/<base\b/i.test(htmlContent)) {
                const baseTag = `\n    <base href="/lp/${slug}/">`;
                if (/<head[^>]*>/i.test(htmlContent)) {
                    htmlContent = htmlContent.replace(/(<head[^>]*>)/i, `$1${baseTag}`);
                } else {
                    htmlContent = `<head>${baseTag}</head>\n` + htmlContent;
                }
            }

            // Automatically ensure action="/api/public/landing-page", landing_slug, and content_id in all <form> tags
            if (contentRecord) {
                // If form has no action or points to another endpoint, route to /api/public/landing-page
                htmlContent = htmlContent.replace(/<form\b([^>]*)>/gi, (formMatch, formAttrs) => {
                    let updatedAttrs = formAttrs;
                    if (!/action=/i.test(updatedAttrs)) {
                        updatedAttrs += ' action="/api/public/landing-page"';
                    }
                    if (!/method=/i.test(updatedAttrs)) {
                        updatedAttrs += ' method="POST"';
                    }
                    return `<form${updatedAttrs}>\n    <input type="hidden" name="content_id" value="${contentRecord.id}">\n    <input type="hidden" name="landing_slug" value="${slug}">`;
                });

                // Also update any existing landing_slug or content_id values so typos do not break tracking
                htmlContent = htmlContent.replace(/(<input[^>]+name=["']landing_slug["'][^>]*value=["'])([^"']*)(["'][^>]*>)/gi, `$1${slug}$3`);
                htmlContent = htmlContent.replace(/(<input[^>]+value=["'])([^"']*)(["'][^>]*name=["']landing_slug["'][^>]*>)/gi, `$1${slug}$3`);
                htmlContent = htmlContent.replace(/(<input[^>]+name=["']content_id["'][^>]*value=["'])([^"']*)(["'][^>]*>)/gi, `$1${contentRecord.id}$3`);
                htmlContent = htmlContent.replace(/(<input[^>]+value=["'])([^"']*)(["'][^>]*name=["']content_id["'][^>]*>)/gi, `$1${contentRecord.id}$3`);
            }

            // Universal client-side form handler: auto-submit to /api/public/landing-page and redirect seamlessly
            const clientScript = `
<script id="tgs-lp-auto-script">
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    var forms = document.querySelectorAll('form');
    forms.forEach(function(form) {
      if (form.getAttribute('data-tgs-handled')) return;
      form.setAttribute('data-tgs-handled', 'true');

      form.addEventListener('submit', async function(e) {
        // If another custom script has already prevented default, let it handle
        if (e.defaultPrevented) return;
        e.preventDefault();

        var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        var originalText = submitBtn ? (submitBtn.innerText || submitBtn.value) : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          if (submitBtn.innerText) submitBtn.innerText = 'Submitting & Redirecting...';
          else if (submitBtn.value) submitBtn.value = 'Submitting & Redirecting...';
        }

        var formData = new FormData(form);
        var payload = {};
        formData.forEach(function(val, key) {
          payload[key] = val;
        });

        var optinEl = form.querySelector('input[name="optin"]');
        if (optinEl) {
          payload.optin = optinEl.checked ? 1 : 0;
        }

        var fallbackRedirect = payload.page_url || payload.redirect_url || payload.thank_you_url || '';

        try {
          var response = await fetch('/api/public/landing-page', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          var resData = await response.json().catch(function() { return {}; });
          var target = resData.redirect_url || resData.page_url || fallbackRedirect;

          if (target && target !== window.location.href) {
            window.location.href = target;
          } else {
            alert('Thank you! Your request has been submitted successfully.');
            if (submitBtn) {
              submitBtn.disabled = false;
              if (submitBtn.innerText) submitBtn.innerText = originalText;
            }
          }
        } catch (err) {
          console.warn('[TGS Landing] Submission fallback to native POST:', err);
          form.submit();
        }
      });
    });
  });
})();
</script>`;

            if (htmlContent.includes('</body>')) {
                htmlContent = htmlContent.replace('</body>', `${clientScript}\n</body>`);
            } else {
                htmlContent += clientScript;
            }

            // Set headers
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');

            // Relax CSP specifically for standalone landing pages so custom inline scripts/styles work
            res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data: blob: https:; font-src * data: https:; connect-src *; frame-src *; media-src * data: blob:;");
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('X-Content-Type-Options', 'nosniff');

            return res.send(htmlContent);
        }

        // 5. Case B: Static asset requested (must reside inside assets/)
        let decodedSubpath;
        try {
            decodedSubpath = decodeURIComponent(relativeSubpath);
        } catch (e) {
            return res.status(400).send('Bad Request');
        }

        // Reject null bytes, traversal segments, or blacklisted files
        if (decodedSubpath.includes('\0') || decodedSubpath.includes('..')) {
            return res.status(403).send('Forbidden');
        }

        const baseFileName = path.basename(decodedSubpath).toLowerCase();
        if (baseFileName.startsWith('.') || FORBIDDEN_FILENAMES.has(baseFileName) || baseFileName.endsWith('.env')) {
            return res.status(403).send('Forbidden');
        }

        // Simplified standard: all landing page assets must be inside the assets/ directory
        const normalizedSubpath = decodedSubpath.replace(/\\/g, '/');
        if (!normalizedSubpath.startsWith('assets/')) {
            return res.status(404).send('Asset Not Found');
        }

        const assetsDir = path.resolve(pageDir, 'assets');
        const targetFilePath = path.resolve(pageDir, normalizedSubpath);

        // Crucial security check: targetFilePath must be strictly inside assetsDir
        if (!targetFilePath.startsWith(assetsDir + path.sep)) {
            return res.status(403).send('Forbidden');
        }

        // Check if asset file exists
        if (!fs.existsSync(targetFilePath)) {
            return res.status(404).send('Asset Not Found');
        }

        const stat = fs.statSync(targetFilePath);
        if (!stat.isFile()) {
            // Never expose directory listings!
            return res.status(404).send('Not Found');
        }

        const mimeType = getMimeType(targetFilePath);
        res.setHeader('Content-Type', mimeType);

        // PDFs should display inline by default
        if (targetFilePath.toLowerCase().endsWith('.pdf')) {
            const originalName = path.basename(targetFilePath);
            res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
        }

        // Reasonable caching for static assets
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        return res.sendFile(targetFilePath);

    } catch (err) {
        console.error('Error serving landing page:', err.message);
        return res.status(500).send('Internal Server Error');
    }
};

/**
 * Protected Admin Discovery Endpoint
 * GET /api/admin/landing-pages (or /api/admin/file-landing-pages)
 * Lists all valid file-based landing pages found in the landing-pages directory.
 */
exports.getAdminLandingPagesList = async (req, res) => {
    try {
        const landingPagesRoot = getLandingPagesRoot();

        if (!fs.existsSync(landingPagesRoot)) {
            fs.mkdirSync(landingPagesRoot, { recursive: true });
            return res.json({ success: true, count: 0, landingPages: [] });
        }

        const entries = fs.readdirSync(landingPagesRoot, { withFileTypes: true });
        const list = [];

        for (const entry of entries) {
            if (entry.isDirectory() && isValidSlug(entry.name)) {
                const slug = entry.name;
                const pageDir = path.join(landingPagesRoot, slug);
                const hasIndex = fs.existsSync(path.join(pageDir, 'index.html')) && fs.statSync(path.join(pageDir, 'index.html')).isFile();
                
                let metadata = {
                    title: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                    description: '',
                    type: 'whitepaper',
                    published: true
                };

                const metaPath = path.join(pageDir, 'landing.json');
                if (fs.existsSync(metaPath)) {
                    try {
                        const parsed = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                        metadata = { ...metadata, ...parsed };
                    } catch (e) { /* ignore */ }
                }

                const dirStat = fs.statSync(pageDir);

                list.push({
                    slug,
                    url: getFileLandingPageUrl(slug),
                    hasIndex,
                    title: metadata.title,
                    description: metadata.description,
                    type: metadata.type,
                    published: metadata.published,
                    createdAt: dirStat.birthtime || dirStat.mtime,
                    updatedAt: dirStat.mtime
                });
            }
        }

        return res.json({
            success: true,
            count: list.length,
            landingPages: list
        });
    } catch (err) {
        console.error('Admin landing pages error:', err);
        return res.status(500).json({ success: false, message: 'Failed to retrieve landing pages' });
    }
};

/**
 * Direct form submit handler for landing pages (/lp/:slug and /lp/:slug/*)
 * Enables standard HTML forms (e.g. action="submit.php", action="", etc.)
 * to submit directly to the server, store leads in the DB, trigger webhooks,
 * and redirect to thank you pages.
 */
exports.handleLandingPageFormSubmit = (req, res, next) => {
    const { submitLandingPage } = require('./publicController');
    if (req.params.slug && !req.body.landing_slug) {
        req.body.landing_slug = req.params.slug;
    }
    return submitLandingPage(req, res, next);
};
