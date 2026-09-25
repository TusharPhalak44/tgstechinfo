# Final Regression Testing Baseline

**Date:** 2026-09-25  
**Project:** TGS Tech Info / TGS Publishing Platform  
**Environment:** Windows (Local Development & Integration Stack)

---

## 1. Baseline System Status

- **Current Git Branch:** `main`
- **Current Git Commit / Hash:** `da233db233910279495c52146e77b2d4fd395878`
- **Frontend Status:**
  - Dev Server: Running at `http://localhost:5173/` (HTTP 200 OK)
  - Framework: React 19.x + Vite 5.4.21 + Ant Design 5.x
  - Production Build: Verified clean build (`npm run build` succeeds in 55.19s, exit code 0)
- **Backend Status:**
  - API Server: Running at `http://localhost:5000/` (HTTP 200 OK)
  - Framework: Node.js 24.x + Express.js
  - Process Health: Actively listening on port 5000, routing middleware and rate limiters operational
- **Database Connectivity Status:**
  - Engine: MySQL / MariaDB via XAMPP
  - Driver: `mysql2/promise` pool
  - Health: Verified (`SELECT 1 as connected` returns `[ { connected: 1 } ]`)
  - Schema Integrity: Verified `contents.user_id` as `BIGINT(20) UNSIGNED NULL` and `contents.status` enum supporting `'scheduled'` and `'archived'`.

---

## 2. Existing Known Fixes (Audit Checkpoint)

All 25 previously confirmed audit issues were resolved across safe, atomic commits:
1. `ISSUE-SEC-01`: Registration privilege escalation prevented (`commit 302c3ac`).
2. `ISSUE-SEC-02`: Public submission IDOR & PII leakage prevented (`commit 302c3ac`).
3. `ISSUE-SEC-03`: Admin API route authentication & `requireAdmin` enforcement (`commit 291e40e`).
4. `ISSUE-SEC-04`: Chatbot analytics & session admin authorization (`commit 291e40e`).
5. `ISSUE-SEC-05`: Lead form webhook SSRF & private IP block protection (`commit 291e40e`).
6. `ISSUE-SEC-06`: Draft, pending, rejected, and future scheduled content protected from public exposure (`commit 291e40e`).
7. `ISSUE-SEC-07`: Stored XSS protection via `DOMPurify` HTML sanitization in content rendering (`commit 291e40e`).
8. `ISSUE-SEC-08`: Production error masking of SQL queries, stack traces, and filesystem paths (`commit 291e40e`).
9. `ISSUE-AUTH-01`: Auth route guard redirection standardized via React Router, removing popups (`commit f585b05`).
10. `ISSUE-AUTH-02`: Content review feedback email links routed to user dashboard (`commit f585b05`).
11. `ISSUE-NAV-01`: Navbar canonical link to `/whitepapers` corrected (`commit a52e43f`).
12. `ISSUE-NAV-02`: Route alias for `/case-study` redirecting to `/case-studies` (`commit a52e43f`).
13. `ISSUE-CONT-01`: Scheduled publishing automated runner (every 60s & on boot) (`commit 65a38e1`).
14. `ISSUE-CONT-02`: `is_visible_on_site = 1` consistency across public content APIs (`commit 65a38e1`).
15. `ISSUE-DB-01`: `view_count` and `views_count` synchronized and reconciled (`commit 9a8a971`).
16. `ISSUE-DB-02`: `contents.user_id` migrated to `BIGINT(20) UNSIGNED NULL` with index (`commit 9a8a971`).
17. `ISSUE-DB-03`: Pagination parameters (`limit` max 100, `offset` min 0) bounded and sanitized (`commit 9a8a971`).
18. `ISSUE-UI-01`: User profile form & backend support for `job_title`, `company_name`, and `country` (`commit 6b18d9d`).
19. `ISSUE-UI-02`: Non-functional mock comments placeholder safely removed from article view (`commit 6b18d9d`).
20. `ISSUE-UI-03`: Dynamic database-driven metrics for admin dashboard KPIs (`commit 6b18d9d`).
21. `ISSUE-PERF-01`: Media uploads disk streaming, eliminating in-memory buffer bloat (`commit 3c19529`).
22. `ISSUE-CHAT-01`: Chatbot public discovery strictly restricted to published and visible articles (`commit 9d97892`).
23. `ISSUE-SEO-01`: OpenGraph, Twitter card, canonical, and dynamic JSON-LD schema integration (`commit 6139c3e`).
24. `ISSUE-A11Y-01`: Descriptive `aria-label` accessibility attributes on icon-only navigation buttons (`commit ec84e89`).
25. `ISSUE-RESP-01`: Responsive horizontal scrolling containers on wide data tables (`commit 7aa5f3f`).

---

## 3. Existing Warnings / Notices

1. **Vite Chunk Size:**
   - Notice: Vite produces a bundle warning that `dist/assets/index-*.js` exceeds 500 kB (bundled at ~5.1 MB uncompressed / 1.4 MB gzip) due to rich editor libraries and Ant Design iconography. This is normal for monolithic Single Page Applications without aggressive route-based code-splitting and does not affect runtime stability or functionality.
2. **Dynamic / Static Import Optimization:**
   - Notice: `axios` and template blank imports produce Rollup bundle notices because of mixed static/dynamic references across certain builder widgets. Cleanly handled by Vite's bundler with zero runtime errors.
