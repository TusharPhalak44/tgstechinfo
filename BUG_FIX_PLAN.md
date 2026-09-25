# BUG FIX & REGRESSION-PROOF IMPLEMENTATION PLAN

**Target Project:** TGS Tech Info / TGS Publishing Platform  
**Workspace:** `c:/xampp/htdocs/tgspublish`  
**Total Issues to Fix:** 25 Confirmed Issues  
**Guiding Principle:** Smallest safe change possible. No breaking changes to existing working functionality, schemas, or UI layouts.

---

## Phase 1 — Critical Security

### Issue ID: ISSUE-SEC-01
* **Issue:** User Registration — Privilege Escalation to Administrator
* **Affected Page:** `/register`
* **Affected Frontend Files:** `frontend/src/pages/Register.jsx`
* **Affected Backend Files:** 
  * `backend/src/routes/authRoutes.js`
  * `backend/src/controllers/authController.js`
  * `backend/src/models/User.js`
* **Affected API:** `POST /api/auth/register`
* **Affected Database Tables:** `users`, `user_roles`
* **Dependencies:** User login, session management, onboarding welcome email (`sendTemplatedEmail('registration', ...)`).
* **Potential Regression Risk:** Breaking legitimate user registration if default role assignment fails or if validation rejects standard payloads.
* **Planned Fix:** 
  * In `backend/src/controllers/authController.js`, ignore `req.body.role` on public registration. Hardcode role assignment to `'user'` (`User.create({ ..., role: 'user' })`).
  * In `backend/src/models/User.js`, ensure `User.create` assigns `'Contributor'` role in `user_roles` for public user creation.
* **Testing Plan:**
  * Test payload with `role: "admin"`. Verify created user has `role: 'user'` and cannot access admin dashboard.
  * Test normal user registration. Verify account creation, JWT issuance, and successful login.

---

### Issue ID: ISSUE-SEC-02
* **Issue:** Public Lead Submissions — Insecure Direct Object Reference (IDOR) Exposing PII
* **Affected Page:** `/p/:slug`, `/lp/:slug`, `/landing-page/:slug`
* **Affected Frontend Files:** None (Endpoint is not called by frontend; frontend only submits leads).
* **Affected Backend Files:** 
  * `backend/src/routes/publicRoutes.js`
  * `backend/src/controllers/adminController.js`
* **Affected API:** `GET /api/public/submission/:id`
* **Affected Database Tables:** `landing_page_submissions`
* **Dependencies:** Admin submissions viewer (`/dashboard/submissions` via `adminRoutes.js` which uses `adminController.getSubmissions`).
* **Potential Regression Risk:** None if unauthenticated public GET route is removed, as long as authenticated admin routes in `adminRoutes.js` remain intact.
* **Planned Fix:**
  * Remove `router.get('/submission/:id', strictLimiter, adminController.getSubmissionById);` from `backend/src/routes/publicRoutes.js`.
  * Ensure submission lookup is strictly accessible via authenticated admin endpoints in `backend/src/routes/adminRoutes.js`.
* **Testing Plan:**
  * Send unauthenticated `GET /api/public/submission/1`. Verify `404 Not Found`.
  * Submit lead form on landing page `/p/:slug`. Verify lead submission (`POST /api/public/landing-page`) continues to succeed.
  * Verify admin submissions viewer in dashboard continues to display submitted records.

---

## Phase 2 — High Security / Authorization

### Issue ID: ISSUE-SEC-03
* **Issue:** Admin API Authorization — Missing Administrative Verification on Content & Analytics Endpoints
* **Affected Page:** `/dashboard/*` (Admin Dashboard)
* **Affected Frontend Files:** Admin components (`AdminContent.jsx`, `ContentReview.jsx`, `DashboardHome.jsx`, `ExecutiveKPICards.jsx`, `Analytics.jsx`).
* **Affected Backend Files:** 
  * `backend/src/routes/adminRoutes.js`
* **Affected API:** 
  * `GET /api/admin/content/all`
  * `GET /api/admin/content/pending`
  * `GET /api/admin/content/:id`
  * `GET /api/admin/stats`
  * `GET /api/admin/recent-activity`
  * `GET /api/admin/content-by-status`
  * `GET /api/admin/dashboard/*`
* **Affected Database Tables:** `contents`, `visitor_sessions`, `page_views`, `analytics`
* **Dependencies:** Admin dashboard metrics and editorial queues.
* **Potential Regression Risk:** Accidental blockage of regular user endpoints or failure if admin token check fails.
* **Planned Fix:**
  * In `backend/src/routes/adminRoutes.js`, import `{ requireAdmin }` from `../middleware/auth`.
  * Apply `requireAdmin` or permission checks (`hasPermission('content.read')` / `hasPermission('analytics.read')`) to `/content/all`, `/content/pending`, `/content/:id`, `/stats`, and `/dashboard/*`.
* **Testing Plan:**
  * Attempt request with standard user JWT. Verify `403 Forbidden`.
  * Request with valid admin credentials. Verify `200 OK` and correct data response.
  * Verify regular user dashboard APIs (`/api/user/*`) remain unaffected.

---

### Issue ID: ISSUE-SEC-04
* **Issue:** Chatbot API Authorization — Unauthenticated Access to Administrative Query Management
* **Affected Page:** Chatbot Assistant (Public) / Chatbot Inquiries (Admin)
* **Affected Frontend Files:** `frontend/src/components/common/chatbot/ChatWidget.jsx`
* **Affected Backend Files:** 
  * `backend/src/routes/chatbotRoutes.js`
* **Affected API:** 
  * `GET /api/chatbot/queries`
  * `GET /api/chatbot/queries/stats`
  * `PUT /api/chatbot/queries/:id`
* **Affected Database Tables:** `chatbot_queries`
* **Dependencies:** Public chat widget (must remain unauthenticated for public visitors to search and submit feedback).
* **Potential Regression Risk:** Blocking public search or feedback in `ChatWidget.jsx` if auth is applied globally.
* **Planned Fix:**
  * Keep public endpoints unauthenticated: `/search`, `/click`, `/trending`, `/categories`, `/recent`, `/session`, `/message`, `/feedback`, `/autocomplete`, `/related/:contentId`, `/suggestions`, `/detect-intent`, `/submit-query`.
  * Apply `authenticate, requireAdmin` specifically to `/queries`, `/queries/stats`, and `PUT /queries/:id`.
* **Testing Plan:**
  * Unauthenticated call to `GET /api/chatbot/queries`. Verify `401 Unauthorized`.
  * Unauthenticated call to `POST /api/chatbot/search`. Verify `200 OK` and search results returned.
  * Authenticated admin call to `GET /api/chatbot/queries`. Verify `200 OK`.

---

### Issue ID: ISSUE-SEC-05
* **Issue:** Lead Form Webhook / SSRF Protection & Client Webhook Injection
* **Affected Page:** `/p/:slug`, `/landing-page/:slug`, `/lp/:slug`
* **Affected Frontend Files:** `frontend/src/pages/StandaloneLandingPage.jsx`, `frontend/src/components/public/ArticleDetail.jsx`
* **Affected Backend Files:** 
  * `backend/src/controllers/publicController.js`
* **Affected API:** `POST /api/public/landing-page`
* **Affected Database Tables:** `contents`, `landing_page_submissions`, `webhook_failures`
* **Dependencies:** CRM integrations, client webhooks (Zapier, HubSpot, custom HTTP receivers).
* **Potential Regression Risk:** Breaking legitimate client webhook delivery if validation is too aggressive or blocks external domains.
* **Planned Fix:**
  * In `submitLandingPage` in `backend/src/controllers/publicController.js`, remove Fallback 2 that accepted arbitrary `webhook_url` or `apiUrl` from the anonymous public HTTP request body (`req.body.webhook_url` / `extraData.webhook_url`). Webhooks must only be read from trusted database configuration (`content.webhook_url` or authenticated builder JSON).
  * In `forwardToWebhook`, parse URL and validate protocol (`http:` or `https:`). Reject private and link-local IP addresses (`127.0.0.1`, `localhost`, `169.254.169.254`, `10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`, `::1`).
* **Testing Plan:**
  * Submit lead form with `webhook_url: "http://127.0.0.1:5000/internal"`. Verify request is rejected/ignored and database is NOT updated with the malicious webhook.
  * Submit lead form for content with valid external webhook configured in DB. Verify payload is forwarded properly.

---

### Issue ID: ISSUE-SEC-06
* **Issue:** Public Content Exposure — Draft, Pending, and Rejected Content Accessible via Slug
* **Affected Page:** `/article/:slug`, `/content/:slug`
* **Affected Frontend Files:** `frontend/src/components/public/ArticleDetail.jsx`
* **Affected Backend Files:** 
  * `backend/src/controllers/publicController.js`
  * `backend/src/models/Content.js`
* **Affected API:** `GET /api/public/content/:slug`, `GET /api/public/content/slug/:slug`
* **Affected Database Tables:** `contents`
* **Dependencies:** Public reader, social sharing, content preview.
* **Potential Regression Risk:** Legitimate published articles returning 404 if status check is too restrictive or misconfigured.
* **Planned Fix:**
  * In `getContentBySlug` in `backend/src/controllers/publicController.js`, check `content.status !== 'published'`. If true, return `404 Not Found`.
  * Ensure `is_visible_on_site` check returns 404 if `content.is_visible_on_site === 0 || content.is_visible_on_site === false`.
  * Also verify `content.scheduled_publish_date`: if scheduled in future (`new Date(content.scheduled_publish_date) > new Date()`), return 404.
* **Testing Plan:**
  * Request published article by slug: Verify `200 OK`.
  * Request draft/pending/rejected article by slug: Verify `404 Not Found`.
  * Request future scheduled article: Verify `404 Not Found`.

---

### Issue ID: ISSUE-SEC-07
* **Issue:** Stored XSS Protection in Rich Content Rendering
* **Affected Page:** `/article/:slug`, `/content/:slug`
* **Affected Frontend Files:** 
  * `frontend/src/components/common/ContentRenderer.jsx`
  * `frontend/src/components/public/ArticleDetail.jsx`
* **Affected Backend Files:** None
* **Affected API:** None
* **Affected Database Tables:** `contents`
* **Dependencies:** Article reading experience, visual builder content, typography styling (`prose-content`).
* **Potential Regression Risk:** Stripping valid styling, headings, images, tables, or formatting if sanitization config is too strict.
* **Planned Fix:**
  * In `ContentRenderer.jsx`, import `DOMPurify` from `'dompurify'` (already present in `frontend/package.json`).
  * Sanitize HTML with `DOMPurify.sanitize(html, { ADD_ATTR: ['target'], ADD_TAGS: ['iframe'] })` before passing to `dangerouslySetInnerHTML`.
* **Testing Plan:**
  * Test payload with `<img src=x onerror=alert(1)>` and `<script>alert('xss')</script>`. Verify malicious attributes/scripts are stripped.
  * Verify legitimate article elements (headings, paragraphs, bold, italic, tables, images, blockquotes, code blocks) render with full styling.

---

### Issue ID: ISSUE-SEC-08
* **Issue:** Information Disclosure via Stack Traces and Raw SQL in Server Error Responses
* **Affected Page:** System-wide API error handling
* **Affected Frontend Files:** None
* **Affected Backend Files:** 
  * `backend/server.js`
* **Affected API:** All `/api/*` endpoints
* **Affected Database Tables:** None
* **Dependencies:** Global express error handler.
* **Potential Regression Risk:** Losing stack traces in local development if environment check is broken.
* **Planned Fix:**
  * In `backend/server.js`, refine error handler so that when `process.env.NODE_ENV === 'production'`, database error details (SQL statements, column names) and stack traces are suppressed from client JSON, returning a clean message, while continuing to log full `err.stack` to server console.
* **Testing Plan:**
  * Trigger a simulated error in production mode. Verify response contains generic message without stack trace.
  * Verify server terminal logs display full error details for debugging.

---

## Phase 3 — Auth / Routing

### Issue ID: ISSUE-AUTH-01
* **Issue:** Auth Redirection in Route Guards Triggering Browser Popup Blockers
* **Affected Page:** `/dashboard/*`, `/user-dashboard/*`
* **Affected Frontend Files:** 
  * `frontend/src/components/common/PrivateRoute.jsx`
  * `frontend/src/components/common/AdminRoute.jsx`
* **Affected Backend Files:** None
* **Affected API:** None
* **Affected Database Tables:** None
* **Dependencies:** User and admin route guards, login flow.
* **Potential Regression Risk:** Infinite redirect loops if authentication state check misfires.
* **Planned Fix:**
  * In `PrivateRoute.jsx` and `AdminRoute.jsx`, replace `window.open('/login', '_blank')` in `useEffect` with React Router declarative navigation `<Navigate to="/login" state={{ from: location }} replace />`.
* **Testing Plan:**
  * Open incognito window and navigate directly to `/user-dashboard`. Verify smooth in-app redirection to `/login` with zero popup blocker alerts.
  * Log in and verify redirection back to the requested page.

---

### Issue ID: ISSUE-AUTH-02
* **Issue:** Editorial Feedback Email Linking to Inaccessible Admin Dashboard Route
* **Affected Page:** Contributor workflow / Editorial review notifications
* **Affected Frontend Files:** None
* **Affected Backend Files:** 
  * `backend/src/controllers/adminController.js`
* **Affected API:** `PUT /api/admin/content/:id/review`
* **Affected Database Tables:** None
* **Dependencies:** Contributor content dashboard (`/user-dashboard/my-content`).
* **Potential Regression Risk:** Incorrect URL breaking user navigation.
* **Planned Fix:**
  * In `adminController.js` lines 78, 93, 109, 125, update `dashboard_url` from `${frontendUrl}/dashboard` to `${frontendUrl}/user-dashboard/my-content`.
* **Testing Plan:**
  * Review an article in admin as approved or rejected with comments. Inspect email parameters and verify link points to `/user-dashboard/my-content`.
  * As contributor, navigate to the link and verify view loads without "Access denied".

---

## Phase 4 — Navigation

### Issue ID: ISSUE-NAV-01
* **Issue:** Broken Whitepapers Link in Navbar Pointing to `/category/whitepaper`
* **Affected Page:** Global Navigation Header
* **Affected Frontend Files:** 
  * `frontend/src/components/common/Navbar.jsx`
* **Affected Backend Files:** None
* **Affected API:** `GET /api/public/content?category=whitepaper`
* **Affected Database Tables:** `content_types`, `categories`
* **Dependencies:** Whitepaper listing view (`/whitepapers`).
* **Potential Regression Risk:** None; `/whitepapers` is already a registered route in `App.jsx`.
* **Planned Fix:**
  * In `frontend/src/components/common/Navbar.jsx` line 43, change `to: '/category/whitepaper'` to `to: '/whitepapers'`.
* **Testing Plan:**
  * Click "Whitepapers" in Navbar menu. Verify navigation to `/whitepapers` and that whitepaper assets are rendered correctly.

---

### Issue ID: ISSUE-NAV-02
* **Issue:** Case Studies Navigation Route Inconsistency (`/case-study` vs `/case-studies`)
* **Affected Page:** Global Navigation / Case Studies
* **Affected Frontend Files:** 
  * `frontend/src/App.jsx`
  * `frontend/src/components/common/Navbar.jsx`
* **Affected Backend Files:** None
* **Affected API:** None
* **Affected Database Tables:** None
* **Dependencies:** Case study category listing and individual case study detail page (`/case-study/:slug`).
* **Potential Regression Risk:** Breaking existing links or bookmarks.
* **Planned Fix:**
  * In `frontend/src/App.jsx`, add route alias `<Route path="/case-study" element={<Navigate to="/case-studies" replace />} />` so both singular and plural paths resolve safely.
* **Testing Plan:**
  * Visit `/case-study`. Verify redirection to `/case-studies`.
  * Visit `/case-studies`. Verify case study listing displays correctly.

---

## Phase 5 — Content System

### Issue ID: ISSUE-CONT-01
* **Issue:** Scheduled Content Publishing Non-Functional Due to Missing Task Runner
* **Affected Page:** `/dashboard/content-review`, Public Content Feed
* **Affected Frontend Files:** None
* **Affected Backend Files:** 
  * `backend/server.js`
  * `backend/src/models/Content.js`
  * `backend/src/controllers/publicController.js`
* **Affected API:** `GET /api/public/content`, `GET /api/public/content/:slug`
* **Affected Database Tables:** `contents`
* **Dependencies:** Editorial approval workflow, article scheduled publishing date.
* **Potential Regression Risk:** Premature publishing of future content or regression on manually published articles.
* **Planned Fix:**
  * In `backend/server.js`, initialize a safe background recurring interval (every 60 seconds) that runs:
    ```sql
    UPDATE contents 
    SET status = 'published', published_date = COALESCE(published_date, scheduled_publish_date, NOW())
    WHERE status = 'approved' 
      AND scheduled_publish_date IS NOT NULL 
      AND scheduled_publish_date <= NOW();
    ```
  * In public content queries in `backend/src/models/Content.js` and `publicController.js`, add `AND (c.published_date IS NULL OR c.published_date <= NOW())`.
* **Testing Plan:**
  * Create article with status `approved` and past `scheduled_publish_date`. Run job and verify status updates to `published`.
  * Create article with future `scheduled_publish_date`. Verify it is NOT returned by public API.

---

### Issue ID: ISSUE-CONT-02
* **Issue:** Inconsistent Enforcement of `is_visible_on_site` Flag Across Public Queries
* **Affected Page:** `/articles`, `/category/:slug`, related articles, search
* **Affected Frontend Files:** None
* **Affected Backend Files:** 
  * `backend/src/models/Content.js`
  * `backend/src/controllers/publicController.js`
* **Affected API:** `GET /api/public/content`, `GET /api/public/categories`
* **Affected Database Tables:** `contents`
* **Dependencies:** Unlisted/hidden content preview.
* **Potential Regression Risk:** Hiding published content if `is_visible_on_site` is NULL.
* **Planned Fix:**
  * In `Content.findAll`, when `filters.is_visible_on_site` is enabled, check `(c.is_visible_on_site = 1 OR c.is_visible_on_site IS NULL)` to support both explicit 1 and legacy NULL values while strictly filtering out `0` (hidden).
  * Ensure related articles and public category listings respect visibility constraints.
* **Testing Plan:**
  * Set `is_visible_on_site = 0` on an article. Verify it does not appear in public listings or category queries.
  * Set `is_visible_on_site = 1`. Verify it appears normally.

---

## Phase 6 — Database / Analytics

### Issue ID: ISSUE-DB-01
* **Issue:** View Count Desynchronization Between `view_count` and `views_count`
* **Affected Page:** `/user-dashboard`, `/user-dashboard/my-content`
* **Affected Frontend Files:** 
  * `frontend/src/components/user/Dashboard.jsx`
  * `frontend/src/components/user/MyContent.jsx`
* **Affected Backend Files:** 
  * `backend/src/controllers/adminController.js`
  * `backend/src/models/Content.js`
* **Affected API:** `GET /api/content/user`, `POST /api/public/content/:id/view`
* **Affected Database Tables:** `contents`
* **Dependencies:** View tracking, author performance dashboard, admin analytics.
* **Potential Regression Risk:** Showing 0 views if only one property is read.
* **Planned Fix:**
  * Canonical backend column is `view_count`. In `Content.incrementViewCount`, sync `UPDATE contents SET view_count = view_count + 1, views_count = view_count + 1 WHERE id = ?`.
  * In `Dashboard.jsx` (lines 312, 1123) and `MyContent.jsx` (line 654), read `(article.view_count ?? article.views_count ?? 0)`.
* **Testing Plan:**
  * Increment view count via public article read.
  * Load author dashboard. Verify view count increments correctly.

---

### Issue ID: ISSUE-DB-02
* **Issue:** Foreign Key Absence & Data Type Discrepancy Between `users.id` and `contents.user_id`
* **Affected Page:** `/dashboard/content-review`, Editorial Management
* **Affected Frontend Files:** None
* **Affected Backend Files:** 
  * `backend/src/controllers/adminController.js`
* **Affected API:** `PUT /api/admin/content/:id/review`
* **Affected Database Tables:** `users`, `contents`
* **Dependencies:** Editorial review notifications and content deletion.
* **Potential Regression Risk:** Crash during email dispatch if author account was removed.
* **Planned Fix:**
  * In `adminController.js` line 62, add safe null check: `if (user && user.email) { ... }` before sending notification emails.
  * Run safe schema migration: `ALTER TABLE contents MODIFY COLUMN user_id BIGINT(20) UNSIGNED NULL;` to align type with `users.id` (`bigint(20) unsigned`) without data loss.
* **Testing Plan:**
  * Review content with valid user. Verify review succeeds and email sends.
  * Review content where `user_id` is null or deleted. Verify review succeeds gracefully without 500 error.

---

### Issue ID: ISSUE-DB-03
* **Issue:** Missing Upper Bound on Pagination Limit Parameter
* **Affected Page:** `/articles`, `/category/:slug`, Public Content Listing
* **Affected Frontend Files:** None
* **Affected Backend Files:** 
  * `backend/src/controllers/publicController.js`
* **Affected API:** `GET /api/public/content`
* **Affected Database Tables:** `contents`
* **Dependencies:** Public content directory.
* **Potential Regression Risk:** Breaking legitimate pagination if page size is restricted too low.
* **Planned Fix:**
  * In `publicController.js`, parse `limit`:
    `const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);`
    `const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);`
* **Testing Plan:**
  * Send `?limit=100000`. Verify response returns max 100 records.
  * Send `?limit=-5`. Verify response defaults to valid limit (10).
  * Send `?limit=abc`. Verify API remains stable.

---

## Phase 7 — UI / User Experience

### Issue ID: ISSUE-UI-01
* **Issue:** User Profile Field Discrepancies and Inconsistent Field Persistence
* **Affected Page:** `/user-dashboard/profile`
* **Affected Frontend Files:** 
  * `frontend/src/components/user/UserProfile.jsx`
* **Affected Backend Files:** 
  * `backend/src/controllers/authController.js`
  * `backend/src/models/User.js`
* **Affected API:** `PUT /api/auth/profile`, `GET /api/auth/profile`
* **Affected Database Tables:** `users`
* **Dependencies:** Profile display, user account settings.
* **Potential Regression Risk:** Dropping existing user attributes on update.
* **Planned Fix:**
  * In `UserProfile.jsx`, add inputs for `job_title`, `company_name`, and `country` (present in `users` table).
  * In `authController.updateProfile`, include `country` in the destructured body passed to `User.update`.
* **Testing Plan:**
  * Update profile with job title, company name, and country.
  * Save and refresh page. Verify all fields persist and display properly.

---

### Issue ID: ISSUE-UI-02
* **Issue:** Static Placeholder Comments Rendered Without Backend Implementation
* **Affected Page:** `/article/:slug`
* **Affected Frontend Files:** 
  * `frontend/src/components/public/ArticleDetail.jsx`
* **Affected Backend Files:** None
* **Affected API:** None
* **Affected Database Tables:** None
* **Dependencies:** Article details reader view.
* **Potential Regression Risk:** Distorting article bottom layout.
* **Planned Fix:**
  * In `ArticleDetail.jsx`, safely remove the misleading hardcoded dummy comment card (`mockComments` / `CustomComment`) to avoid misleading readers with fake comments until a full backend comments system is implemented.
* **Testing Plan:**
  * Open `/article/:slug`. Verify article content, tags, author, and related articles display cleanly without phantom comments.

---

### Issue ID: ISSUE-UI-03
* **Issue:** Inaccurate Subscriber Metric and Hardcoded Percentage Deltas in Admin Dashboard
* **Affected Page:** `/dashboard`
* **Affected Frontend Files:** `frontend/src/components/admin/DashboardHome.jsx`
* **Affected Backend Files:** 
  * `backend/src/controllers/adminController.js`
* **Affected API:** `GET /api/admin/dashboard/kpis`
* **Affected Database Tables:** `newsletter_subscribers`, `page_views`
* **Dependencies:** Executive KPI cards in admin dashboard.
* **Potential Regression Risk:** KPI card showing NaN if query fails.
* **Planned Fix:**
  * In `adminController.getDashboardKPIs`, return `totalSubs || 0` for `totalSubscribers`.
  * Calculate dynamic views delta by comparing current period page views with prior period page views rather than hardcoding `14.8`.
* **Testing Plan:**
  * Subscribe new email on `/newsletter`.
  * Check `/dashboard`. Verify `totalSubscribers` increments dynamically.

---

## Phase 8 — Performance

### Issue ID: ISSUE-PERF-01
* **Issue:** Server Memory Saturation Risk from Synchronous In-Memory Buffering of Uploads
* **Affected Page:** `/dashboard/media`
* **Affected Frontend Files:** None
* **Affected Backend Files:** 
  * `backend/src/controllers/mediaController.js`
  * `backend/src/routes/mediaRoutes.js`
  * `backend/server.js`
* **Affected API:** `POST /api/media/upload`, `GET /uploads/:filename`
* **Affected Database Tables:** `media_files`
* **Dependencies:** Media library, article banners, PDF downloads, video player.
* **Potential Regression Risk:** Breaking existing media links or thumbnail displays.
* **Planned Fix:**
  * In `mediaController.uploadFile`, do NOT read entire large files (> 15MB or video) into memory using synchronous `fs.readFileSync`. Keep the physical file on disk in `backend/uploads/` where Multer already wrote it.
  * Store metadata and file path (`/uploads/${filename}`) in `media_files`. Only store `file_data` for small images (< 5MB) as backup.
  * In `backend/server.js`, ensure static streaming via `res.sendFile(filePath)` takes precedence, avoiding RAM exhaustion.
* **Testing Plan:**
  * Upload a small image (1MB). Verify upload succeeds and displays in Media Library.
  * Upload a larger document/video. Verify upload succeeds with low memory usage and stream plays back cleanly.

---

## Phase 9 — Chatbot

### Issue ID: ISSUE-CHAT-01
* **Issue:** Chatbot Recommendation Engine Exposing Unpublished or Hidden Content
* **Affected Page:** Content Discovery Assistant (Floating Chatbot)
* **Affected Frontend Files:** None
* **Affected Backend Files:** 
  * `backend/src/services/chatbotSearchService.js`
* **Affected API:** `POST /api/chatbot/search`, `GET /api/chatbot/trending`, `GET /api/chatbot/recent`
* **Affected Database Tables:** `contents`
* **Dependencies:** Chatbot search, trending topics, recommendation cards.
* **Potential Regression Risk:** Hiding legitimate published content if query conditions conflict.
* **Planned Fix:**
  * In `backend/src/services/chatbotSearchService.js`, ensure all search, trending, and recent queries enforce `AND c.status = 'published' AND (c.is_visible_on_site = 1 OR c.is_visible_on_site IS NULL) AND (c.published_date IS NULL OR c.published_date <= NOW())`.
* **Testing Plan:**
  * Search via chatbot for keywords matching an unpublished draft article. Verify chatbot does not return it.
  * Search for keywords matching a published article. Verify chatbot returns card with proper title, image, and link.

---

## Phase 10 — SEO

### Issue ID: ISSUE-SEO-01
* **Issue:** Client-Side Meta Tags Ineffective for Crawlers & Missing Baseline Meta Tags
* **Affected Page:** Public Content Pages (`/article/:slug`, `/`, etc.)
* **Affected Frontend Files:** 
  * `frontend/index.html`
  * `frontend/src/components/public/ArticleDetail.jsx`
* **Affected Backend Files:** None
* **Affected API:** None
* **Affected Database Tables:** None
* **Dependencies:** Social media sharing (LinkedIn, Twitter, Facebook), search engine crawling.
* **Potential Regression Risk:** None; purely additive metadata attributes.
* **Planned Fix:**
  * In `frontend/index.html`, add comprehensive fallback meta tags: `<meta name="description">`, `<meta property="og:site_name">`, `<meta property="og:type">`, `<meta name="twitter:card">`.
  * In `ArticleDetail.jsx`, dynamically update OpenGraph (`og:title`, `og:description`, `og:image`, `og:url`), Twitter tags, canonical link, and JSON-LD Article structured schema.
* **Testing Plan:**
  * Navigate to `/article/:slug`. Inspect DOM `<head>`. Verify `og:title`, `og:image`, `canonical`, and JSON-LD schema are populated with article data.

---

## Phase 11 — Accessibility

### Issue ID: ISSUE-A11Y-01
* **Issue:** Missing ARIA Labels on Icon-Only Controls
* **Affected Page:** Global Navigation / Public Pages
* **Affected Frontend Files:** 
  * `frontend/src/components/common/Navbar.jsx`
* **Affected Backend Files:** None
* **Affected API:** None
* **Affected Database Tables:** None
* **Dependencies:** Screen-reader users, keyboard navigation.
* **Potential Regression Risk:** None; accessibility attributes do not alter visual layout or behavior.
* **Planned Fix:**
  * In `Navbar.jsx`, add `aria-label` attributes to icon-only buttons (theme toggle, mobile drawer toggle, search trigger, notification bell, contact button).
* **Testing Plan:**
  * Run accessibility inspection on Navbar buttons. Verify all interactive controls have descriptive accessible names.

---

## Phase 12 — Responsive UI

### Issue ID: ISSUE-RESP-01
* **Issue:** Mobile Table Horizontal Layout Overflow
* **Affected Page:** `/user-dashboard/submissions`, `/dashboard/content`
* **Affected Frontend Files:** 
  * `frontend/src/components/user/UserSubmissions.jsx`
  * `frontend/src/components/user/MyContent.jsx`
* **Affected Backend Files:** None
* **Affected API:** None
* **Affected Database Tables:** None
* **Dependencies:** Dashboard data table views.
* **Potential Regression Risk:** Breaking desktop table layouts if responsive styles conflict.
* **Planned Fix:**
  * In `UserSubmissions.jsx`, add `scroll={{ x: 'max-content' }}` and wrap tables with `<div className="w-full overflow-x-auto">`.
  * In `MyContent.jsx`, ensure filter controls bar wraps smoothly on mobile screens (< 640px).
* **Testing Plan:**
  * Test views on mobile viewport (375px width). Verify table scrolls horizontally within container without breaking page layout.

---

## Execution Checkpoints & Testing Order

1. **Phase 1 (Critical Security):** Fix `ISSUE-SEC-01`, `ISSUE-SEC-02`. Test registration & submissions. Commit checkpoint.
2. **Phase 2 (High Security):** Fix `ISSUE-SEC-03` through `ISSUE-SEC-08`. Test authorization & error handling. Commit checkpoint.
3. **Phase 3 (Auth/Routing):** Fix `ISSUE-AUTH-01`, `ISSUE-AUTH-02`. Test redirects & feedback links. Commit checkpoint.
4. **Phase 4 (Navigation):** Fix `ISSUE-NAV-01`, `ISSUE-NAV-02`. Test navbar links. Commit checkpoint.
5. **Phase 5 (Content System):** Fix `ISSUE-CONT-01`, `ISSUE-CONT-02`. Test scheduled publisher. Commit checkpoint.
6. **Phase 6 (Database/Analytics):** Fix `ISSUE-DB-01`, `ISSUE-DB-02`, `ISSUE-DB-03`. Test schema & views. Commit checkpoint.
7. **Phase 7 (UI/UX):** Fix `ISSUE-UI-01`, `ISSUE-UI-02`, `ISSUE-UI-03`. Test profile & dashboard KPIs. Commit checkpoint.
8. **Phase 8 (Performance):** Fix `ISSUE-PERF-01`. Test media upload. Commit checkpoint.
9. **Phase 9 (Chatbot):** Fix `ISSUE-CHAT-01`. Test search visibility. Commit checkpoint.
10. **Phase 10 (SEO):** Fix `ISSUE-SEO-01`. Test meta tags. Commit checkpoint.
11. **Phase 11 (Accessibility):** Fix `ISSUE-A11Y-01`. Test ARIA labels. Commit checkpoint.
12. **Phase 12 (Responsive UI):** Fix `ISSUE-RESP-01`. Test mobile table scrolling. Commit checkpoint.
13. **Final Verification & Report:** Comprehensive end-to-end regression audit across all 48 routes, generate `BUG_FIX_FINAL_REPORT.md`.
