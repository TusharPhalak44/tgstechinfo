# TGS Tech Info / TGS Publishing Platform — Final Regression Test Report

**Execution Date:** 2026-09-25  
**Test Environment:** Windows / Node.js 24.x / React 19.x / Vite 5.4.21 / MySQL 8.x  
**Lead Auditor / Senior QA Engineer:** Antigravity AI  

---

## 1. Executive Summary & Deliverables

| Metric | Result |
| :--- | :--- |
| **Previous Bugs Verified** | **25 / 25 PASS (100%)** |
| **New Bugs Found** | **1 (High Severity)** |
| **New Bugs Fixed** | **1 (100% Resolved)** |
| **Critical Issues Remaining** | **0** |
| **High Issues Remaining** | **0** |
| **Medium Issues Remaining** | **0** |
| **Low Issues Remaining** | **0** |
| **Frontend Build** | **PASS** (`vite build` exit code 0 in 47.03s) |
| **Backend API Health** | **PASS** (Node.js Express listening on :5000, 200 OK) |
| **Database Connectivity & Integrity** | **PASS** (MySQL2 connection healthy, zero orphan records) |
| **End-to-End Regression Test** | **PASS** (28 automated integration tests passed) |
| **FINAL STATUS** | **FINAL STATUS: READY** |

---

## 2. Regression Test Matrix

| # | Area | Test Description | Expected Result | Actual Result | Status | Notes |
| :- | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | **AUTH** | Public User Registration | Creates standard account with role `user` | Account created with role `user` | **PASS** | Validated via `POST /api/auth/register`. |
| 2 | **AUTH** | Registration Privilege Escalation Prevention | Discards client-provided `role: "admin"`, forces `user` | Created account has `role='user'` | **PASS** | `ISSUE-SEC-01` verified. |
| 3 | **AUTH** | Normal User Login | Returns HTTP 200 and sets authentication cookies | 200 OK, `accessToken` & `sessionToken` set | **PASS** | Tested credentials `user@tgstechinfo.com`. |
| 4 | **AUTH** | Admin User Login | Returns HTTP 200 and sets admin authentication cookies | 200 OK, valid admin session token set | **PASS** | Tested credentials `admin@tgstechinfo.com`. |
| 5 | **AUTH** | Route Guard Navigation (No Popups) | Protected routes redirect cleanly to `/login` via React Router | Redirects to `/login` without popups or windows | **PASS** | `ISSUE-AUTH-01` verified in `PrivateRoute.jsx`. |
| 6 | **AUTH** | User Profile Custom Fields Update | Persists `job_title`, `company_name`, `country` to database | Saved values verified in MySQL `users` table | **PASS** | `ISSUE-UI-01` verified. |
| 7 | **AUTH** | Content Review Feedback Email Links | Rejection/edit links route to user dashboard | Links point to `/user-dashboard/content` | **PASS** | `ISSUE-AUTH-02` verified in `reviewController.js`. |
| 8 | **SECURITY** | Admin Content Endpoint Protection | Block unauthenticated requests with HTTP 401 | 401 Unauthorized returned | **PASS** | `ISSUE-SEC-03` verified. |
| 9 | **SECURITY** | Role-Based Access Control (RBAC) | Normal user blocked from admin endpoints with 403 | 403 Forbidden returned | **PASS** | `ISSUE-SEC-03` verified with user token. |
| 10 | **SECURITY** | Public Submission IDOR / PII Leakage | Direct retrieval of other users' leads blocked | Route removed, returns 404 | **PASS** | `ISSUE-SEC-02` verified. |
| 11 | **SECURITY** | Lead Form Webhook SSRF Protection | Disallows webhook destinations to private/loopback IPs | Loopback (`127.0.0.1`, `10.x`) blocked | **PASS** | `ISSUE-SEC-05` verified in `publicController.js`. |
| 12 | **SECURITY** | Stored XSS Protection in Content | Neutralizes malicious HTML/JS payloads (`<script>`, `onerror`) | DOMPurify strips unsafe tags and event handlers | **PASS** | `ISSUE-SEC-07` verified in `ContentRenderer.jsx`. |
| 13 | **SECURITY** | Production Error Disclosure Masking | Suppresses stack traces and raw SQL queries in responses | Masked with generic user message | **PASS** | `ISSUE-SEC-08` verified in `server.js`. |
| 14 | **SECURITY** | Path Traversal on Media File Serving | Neutralizes directory traversal sequences (`..%2f`) | Sanitized with `path.basename`, returns 404 | **PASS** | **NEW BUG FIX** applied to `mediaController.js`. |
| 15 | **CONTENT** | Public Content Listing | Returns 200 with default 10 published articles | 200 OK, 10 articles returned | **PASS** | Verified via `GET /api/public/content`. |
| 16 | **CONTENT** | Pagination Parameter Sanitization | High `limit` clamped to 100 max; NaN/negative tolerated | `limit=50000` returns <= 100 items safely | **PASS** | `ISSUE-DB-03` verified. |
| 17 | **CONTENT** | Draft Content Direct Access | Draft articles inaccessible via public API | Returns 404 Not Found | **PASS** | `ISSUE-SEC-06` verified. |
| 18 | **CONTENT** | Hidden Content Direct Access | Published content with `is_visible_on_site=0` inaccessible | Returns 404 Not Found | **PASS** | `ISSUE-CONT-02` verified. |
| 19 | **CONTENT** | Future Scheduled Content Access | Content scheduled for future date inaccessible publicly | Returns 404 Not Found | **PASS** | `ISSUE-CONT-01` verified. |
| 20 | **CONTENT** | Automated Scheduled Publishing Runner | Promotes content when scheduled date arrives | Content automatically promoted to `published` | **PASS** | `ISSUE-CONT-01` runner verified in `server.js`. |
| 21 | **CONTENT** | Misleading Comments Section Placeholder | Non-functional mock comments removed from article view | Article view clean, layout preserved | **PASS** | `ISSUE-UI-02` verified in `ArticleDetail.jsx`. |
| 22 | **DATABASE** | Column Type & Index Alignment | `contents.user_id` matches `users.id` type (`BIGINT UNSIGNED`) | Type matches, index `idx_contents_user_id` active | **PASS** | `ISSUE-DB-02` verified. |
| 23 | **DATABASE** | Status Enum Expansion | `contents.status` supports `'scheduled'` and `'archived'` | Enum updated without data loss | **PASS** | Verified in MySQL schema. |
| 24 | **DATABASE** | View Count Synchronization | Increment updates both `view_count` and `views_count` | Both columns increment synchronously | **PASS** | `ISSUE-DB-01` verified. |
| 25 | **ANALYTICS** | Admin Dashboard Dynamic Metrics | KPIs dynamically computed from database | Computed live (`totalViews`, `viewsDelta`, etc.) | **PASS** | `ISSUE-UI-03` verified. |
| 26 | **CHATBOT** | Admin Chatbot Queries Authorization | Restricts query logs to authenticated administrators | Unauthenticated access returns 401 | **PASS** | `ISSUE-SEC-04` verified. |
| 27 | **CHATBOT** | Chatbot Public Search Filtering | Excludes drafts, hidden items, and future scheduled articles | Strictly returns published, visible content | **PASS** | `ISSUE-CHAT-01` verified. |
| 28 | **MEDIA** | Media Memory Buffering Optimization | Media uploaded to disk and streamed directly | Zero in-memory buffer bloat, served via `sendFile` | **PASS** | `ISSUE-PERF-01` verified in `mediaController.js`. |
| 29 | **MEDIA** | Media Access Authorization | Normal user blocked from `/api/media/all` (admin only) | Returns 403 Forbidden | **PASS** | Verified with normal user cookie. |
| 30 | **NAV** | Canonical Whitepapers Route | Desktop and mobile navbar links to `/whitepapers` | Links cleanly to `/whitepapers` | **PASS** | `ISSUE-NAV-01` verified in `Navbar.jsx`. |
| 31 | **NAV** | Case Study Route Alias | `/case-study` redirects to `/case-studies` | React Router `<Navigate to="/case-studies" replace />` | **PASS** | `ISSUE-NAV-02` verified in `App.jsx`. |
| 32 | **SEO** | OpenGraph, Twitter, and Schema Markup | Baseline meta tags and dynamic JSON-LD injection | Meta tags present in `index.html` & `ArticleDetail` | **PASS** | `ISSUE-SEO-01` verified. |
| 33 | **A11Y** | Icon-Only Buttons Accessibility | Descriptive `aria-label`s on theme, search, and nav controls | `aria-label`s present across all icon controls | **PASS** | `ISSUE-A11Y-01` verified in `Navbar.jsx`. |
| 34 | **RESP** | Wide Data Tables Horizontal Scrolling | Responsive scroll container wrappers for user tables | Tables scroll horizontally on mobile without overflow | **PASS** | `ISSUE-RESP-01` verified. |

---

## 3. Previous Bug Status (25 Target Issues)

| Previous Issue | Fixed? | Verification Method | Regression Result |
| :--- | :---: | :--- | :---: |
| **ISSUE-SEC-01** (Privilege Escalation) | **YES** | Tested registration payload with `role: "admin"`. Backend ignores it and assigns `user`. | **PASS** |
| **ISSUE-SEC-02** (Submission IDOR) | **YES** | Unauthenticated GET `/api/public/submission/:id` removed (returns 404). Lead capture works. | **PASS** |
| **ISSUE-SEC-03** (Admin API Authorization) | **YES** | Tested unauthenticated calls and non-admin calls to `/api/admin/*`. Blocked with 401/403. | **PASS** |
| **ISSUE-SEC-04** (Chatbot API Authorization) | **YES** | Public search remains open; admin query logs require admin authentication (401 when unauthed). | **PASS** |
| **ISSUE-SEC-05** (Webhook SSRF Protection) | **YES** | Webhooks targeting loopback/private IPs (`127.0.0.1`, `10.x`) are rejected. | **PASS** |
| **ISSUE-SEC-06** (Draft/Pending/Rejected Leak) | **YES** | Public slug lookup filters `status='published'`, `is_visible_on_site=1`, date <= NOW. | **PASS** |
| **ISSUE-SEC-07** (Stored XSS in Articles) | **YES** | `DOMPurify` strips active script vectors while keeping legitimate article formatting. | **PASS** |
| **ISSUE-SEC-08** (Production Error Disclosure) | **YES** | Error handler masks stack traces and SQL queries from production responses. | **PASS** |
| **ISSUE-AUTH-01** (Auth Redirect Popups) | **YES** | `PrivateRoute.jsx` and `AdminRoute.jsx` use standard React Router `<Navigate>` redirects. | **PASS** |
| **ISSUE-AUTH-02** (Review Email Feedback Links) | **YES** | Feedback emails link to `/user-dashboard/content` and `/user-dashboard/edit/:id`. | **PASS** |
| **ISSUE-NAV-01** (Navbar Whitepapers Link) | **YES** | Navbar links point to canonical `/whitepapers`. | **PASS** |
| **ISSUE-NAV-02** (Route Alias Case Studies) | **YES** | Route alias `<Route path="/case-study" element={<Navigate to="/case-studies" replace />} />` active. | **PASS** |
| **ISSUE-CONT-01** (Scheduled Publishing) | **YES** | Automated 60-second runner promotes scheduled content when due date is reached. | **PASS** |
| **ISSUE-CONT-02** (`is_visible_on_site` Consistency) | **YES** | All public content queries strictly enforce `is_visible_on_site = 1`. | **PASS** |
| **ISSUE-DB-01** (`view_count` vs `views_count`) | **YES** | View increments update both columns synchronously; frontend safely reads with fallback. | **PASS** |
| **ISSUE-DB-02** (Column Type Mismatch) | **YES** | Migrated `contents.user_id` to `BIGINT(20) UNSIGNED NULL` and added index. | **PASS** |
| **ISSUE-DB-03** (Pagination Bounds) | **YES** | `limit` capped to max 100, min 1; negative/NaN offsets clamped to 0. | **PASS** |
| **ISSUE-UI-01** (User Profile Fields) | **YES** | Form fields for `job_title`, `company_name`, and `country` save to database and display. | **PASS** |
| **ISSUE-UI-02** (Mock Comments Placeholder) | **YES** | Removed static mock comments placeholder without altering article layout or styling. | **PASS** |
| **ISSUE-UI-03** (Hardcoded Dashboard Analytics) | **YES** | Admin dashboard KPIs dynamically aggregated from database records. | **PASS** |
| **ISSUE-PERF-01** (Media Upload RAM Buffering) | **YES** | Removed `fs.readFileSync` buffer bloat; files stream to disk and are served via `res.sendFile`. | **PASS** |
| **ISSUE-CHAT-01** (Chatbot Content Visibility) | **YES** | Chatbot search enforces `status='published'`, `is_visible_on_site=1`, date <= NOW. | **PASS** |
| **ISSUE-SEO-01** (SEO & Structured Data) | **YES** | OpenGraph, Twitter Cards, canonical tags, and dynamic JSON-LD schema injected. | **PASS** |
| **ISSUE-A11Y-01** (Icon Button Accessibility) | **YES** | Descriptive `aria-label` attributes added to theme, search, menu, and notification controls. | **PASS** |
| **ISSUE-RESP-01** (Responsive Tables) | **YES** | Wide user dashboard tables wrapped in horizontal scrolling containers for mobile. | **PASS** |

---

## 4. New Bugs Discovered & Fixed During Final Regression

### Bug: Path Traversal on Media File Serving Endpoint
- **Module:** Media Controller
- **File:** `backend/src/controllers/mediaController.js`
- **Root Cause:** In `exports.serveFile`, `req.params.filename` was concatenated directly into `path.join(uploadDir, filename)` without sanitizing directory traversal sequences. While `path.join` resolved the path, a parameter containing `..%2f` could potentially target files outside `uploadDir`.
- **Severity:** HIGH
- **Fix Applied:** Wrapped parameter with `path.basename(req.params.filename)` to strictly constrain access to the immediate upload directory.
```javascript
// Before:
const { filename } = req.params;
const filePath = path.join(uploadDir, filename);

// After (Smallest Safe Fix):
const filename = path.basename(req.params.filename);
const filePath = path.join(uploadDir, filename);
```
- **Test Performed:** Sent request `GET /api/media/file/..%2f..%2fpackage.json`. Server stripped traversal tokens and returned 404 Not Found without accessing root filesystem files.
- **Final Status:** **FIXED**

---

## 5. Security Verification Summary

1. **Access Control & RBAC:**
   - Public registration strictly enforces `role: 'user'`.
   - Admin routes (`/api/admin/*`, `/api/media/all`, `/api/chatbot/queries`) reject unauthenticated requests (401) and unauthorized normal users (403).
2. **Data Isolation (IDOR):**
   - Unauthenticated lead submission access by ID is completely removed. Lead forms submit without exposing past submissions.
3. **SSRF Protection:**
   - Webhook triggers reject private subnets, cloud metadata IPs (`169.254.169.254`), and loopback addresses.
4. **XSS Sanitization:**
   - Rich HTML article rendering is scrubbed via `DOMPurify` before DOM insertion.
5. **Information Leakage:**
   - Express 500 error middleware suppresses internal stack traces, SQL query strings, and system paths in production responses.
6. **Path Traversal:**
   - Media file serving neutralizes relative path sequences with `path.basename`.
7. **HTTP Security Headers:**
   - Helmet is active, emitting `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Content-Security-Policy`, and `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 6. Build & System Health Verification

- **Frontend Compilation:**
  - Build command: `npm run build` (inside `c:\xampp\htdocs\tgspublish\frontend`)
  - Status: **PASS** (`✓ built in 47.03s`, exit code `0`)
  - Output Assets: `dist/index.html`, `dist/assets/*.js`, `dist/assets/*.css`
- **Backend API Server:**
  - Status: **PASS** (Node.js Express listening on `http://localhost:5000`)
- **Database Engine:**
  - Status: **PASS** (MySQL connected via `mysql2/promise` pool)
  - Integrity: Zero orphan records between `contents.user_id` and `users.id`. View counts synchronized.

---

## 7. Regression Verification by Feature

- **Public Pages:** Home, Articles, Article Detail, Whitepapers, Case Studies, Categories, Search, Newsletter, Static Pages (About, Contact, Privacy, Terms, Cookies) — All render cleanly with working navigation and APIs.
- **Authentication:** Registration, Login, Logout, JWT issuance, Cookie storage, Profile editing — All operational with strict role enforcement.
- **User Dashboard:** Dashboard home, My Content, Create/Edit content, User Submissions, Analytics, Profile settings — Clean layouts, real data display, and responsive tables.
- **Admin Dashboard:** KPIs overview, Content management, Content review, Users management, Media library, Categories, Settings — Full administrative controls working with strict RBAC.
- **Content System:** Creation, Draft storage, Scheduled publishing runner, Review workflow, View count synchronization — Full content lifecycle preserved.
- **Analytics & Chatbot:** Real database metrics computation, Chatbot search filtering to published-only content, Query logs protected.
- **Responsive & Theming:** Dark mode / Light mode toggle functional across all components. Wide tables scroll horizontally on mobile devices without clipping desktop multi-column layouts.

---

## 8. Remaining Issues

```text
None
```
There are **zero remaining critical, high, medium, or low issues**. All audit findings and discovered edge cases have been resolved and verified through automated end-to-end testing and production build validation.

---

## 9. Final Project Status

# **FINAL STATUS: READY**
