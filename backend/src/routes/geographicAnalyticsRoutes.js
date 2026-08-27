/**
 * Geographic Analytics Routes
 * API endpoints for 3D globe visualization
 */

const express = require('express');
const router = express.Router();
const geographicAnalyticsController = require('../controllers/geographicAnalyticsController');
const { authenticate } = require('../middleware/auth');
const { hasPermission } = require('../middleware/permissions');

// All routes require authentication
router.use(authenticate);

/**
 * Global Summary Analytics
 * GET /api/analytics/global
 */
router.get('/global',
  geographicAnalyticsController.getGlobalAnalytics
);

/**
 * Geographic Traffic Data
 * GET /api/analytics/geographic-traffic
 * Query params: limit, start_date, end_date
 */
router.get('/geographic-traffic', 
  hasPermission('analytics.read'),
  geographicAnalyticsController.getGeographicTraffic
);

/**
 * Visitor Flow Data (Routes between cities)
 * GET /api/analytics/visitor-flow
 * Query params: limit, min_traffic
 */
router.get('/visitor-flow',
  hasPermission('analytics.read'),
  geographicAnalyticsController.getVisitorFlow
);

/**
 * Regional Analytics
 * GET /api/analytics/region/:region
 * Params: region (AMER, LATAM, EMEA, APAC)
 * Query params: timeRange
 */
router.get('/region/:region',
  hasPermission('analytics.read'),
  geographicAnalyticsController.getRegionalAnalytics
);

/**
 * Country Analytics
 * GET /api/analytics/country/:country
 * Params: country (country code or name)
 */
router.get('/country/:country',
  hasPermission('analytics.read'),
  geographicAnalyticsController.getCountryAnalytics
);

/**
 * City Analytics
 * GET /api/analytics/city/:city/:country
 * Params: city, country
 */
router.get('/city/:city/:country',
  hasPermission('analytics.read'),
  geographicAnalyticsController.getCityAnalytics
);

/**
 * Active Sessions
 * GET /api/analytics/active-sessions
 * Query params: limit
 */
router.get('/active-sessions',
  hasPermission('analytics.read'),
  geographicAnalyticsController.getActiveSessions
);

module.exports = router;
