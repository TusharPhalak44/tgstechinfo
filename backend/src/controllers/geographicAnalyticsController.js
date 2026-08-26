/**
 * Geographic Analytics Controller
 * Handles API endpoints for 3D globe geographic visualization
 */

const VisitorSession = require('../models/VisitorSession');
const { pool } = require('../config/database');

/**
 * Get geographic traffic data for globe visualization
 */
exports.getGeographicTraffic = async (req, res) => {
  try {
    const { limit = 100, start_date, end_date } = req.query;

    let query = `
      SELECT 
        country,
        city,
        COUNT(*) as traffic_count,
        COUNT(DISTINCT ip_address) as unique_visitors,
        AVG(total_session_duration) as avg_duration,
        COUNT(DISTINCT CASE WHEN total_pages_visited >= 3 THEN session_uuid END) as high_intent_count,
        COUNT(DISTINCT CASE WHEN landing_page LIKE '%contact%' THEN session_uuid END) as conversion_count
      FROM visitor_sessions
      WHERE 1=1
    `;

    const values = [];

    if (start_date) {
      query += ' AND session_start >= ?';
      values.push(start_date);
    }
    if (end_date) {
      query += ' AND session_start <= ?';
      values.push(end_date);
    }

    query += ` 
      GROUP BY country, city
      ORDER BY traffic_count DESC
      LIMIT ?
    `;
    values.push(parseInt(limit));

    const [rows] = await pool.query(query, values);

    res.json({
      success: true,
      data: rows.map(row => ({
        country: row.country || 'Unknown',
        city: row.city || 'Unknown',
        trafficCount: row.traffic_count || 0,
        uniqueVisitors: row.unique_visitors || 0,
        avgDuration: Math.round(row.avg_duration || 0),
        highIntentCount: row.high_intent_count || 0,
        conversionCount: row.conversion_count || 0,
      })),
      count: rows.length,
    });
  } catch (error) {
    console.error('Error fetching geographic traffic:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get visitor flow data (routes between cities)
 */
exports.getVisitorFlow = async (req, res) => {
  try {
    const { limit = 50, min_traffic = 10 } = req.query;

    // Get top origin-destination pairs
    const query = `
      SELECT 
        origin.country as origin_country,
        origin.city as origin_city,
        origin.latitude as origin_lat,
        origin.longitude as origin_lon,
        destination.country as destination_country,
        destination.city as destination_city,
        destination.latitude as destination_lat,
        destination.longitude as destination_lon,
        COUNT(*) as traffic_count,
        COUNT(DISTINCT CASE WHEN uj.conversion_point IS NOT NULL THEN uj.session_uuid END) as conversions,
        ROUND(100 * COUNT(DISTINCT CASE WHEN uj.conversion_point IS NOT NULL THEN uj.session_uuid END) / COUNT(*), 2) as conversion_rate
      FROM user_journey uj
      JOIN visitor_sessions origin ON uj.session_uuid = origin.session_uuid
      JOIN visitor_sessions destination ON uj.session_uuid = destination.session_uuid
      WHERE origin.city != destination.city OR origin.country != destination.country
      GROUP BY origin_country, origin_city, destination_country, destination_city
      HAVING COUNT(*) >= ?
      ORDER BY traffic_count DESC
      LIMIT ?
    `;

    const [rows] = await pool.query(query, [parseInt(min_traffic), parseInt(limit)]);

    // Fetch coordinates from geographic data (mock for now)
    const routes = await enrichVisitorFlowWithCoordinates(rows);

    res.json({
      success: true,
      routes: routes,
      count: routes.length,
    });
  } catch (error) {
    console.error('Error fetching visitor flow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get regional analytics
 */
exports.getRegionalAnalytics = async (req, res) => {
  try {
    const { region } = req.params;
    const { timeRange = '24h' } = req.query;

    // Map business regions to countries
    const regionMap = {
      AMER: ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO'],
      LATAM: ['BR', 'MX', 'AR', 'CL', 'CO', 'PE', 'VE'],
      EMEA: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'CH', 'IE', 'PL', 'ZA', 'EG', 'NG', 'SA', 'AE'],
      APAC: ['IN', 'CN', 'JP', 'KR', 'SG', 'ID', 'TH', 'MY', 'VN', 'PH', 'AU', 'NZ'],
    };

    const countries = regionMap[region] || [];
    if (countries.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid region' });
    }

    const countryPlaceholders = countries.map(() => '?').join(',');

    const query = `
      SELECT 
        country,
        COUNT(*) as traffic_count,
        COUNT(DISTINCT ip_address) as unique_visitors,
        AVG(total_session_duration) as avg_duration,
        COUNT(DISTINCT CASE WHEN total_pages_visited >= 3 THEN session_uuid END) as high_intent_count,
        COUNT(DISTINCT CASE WHEN landing_page LIKE '%contact%' THEN session_uuid END) as conversion_count
      FROM visitor_sessions
      WHERE country IN (${countryPlaceholders})
      AND session_start >= NOW() - INTERVAL 1 DAY
      GROUP BY country
      ORDER BY traffic_count DESC
    `;

    const [rows] = await pool.query(query, countries);

    const totals = rows.reduce((acc, row) => ({
      trafficCount: acc.trafficCount + (row.traffic_count || 0),
      uniqueVisitors: acc.uniqueVisitors + (row.unique_visitors || 0),
      avgDuration: acc.avgDuration + (row.avg_duration || 0),
      highIntentCount: acc.highIntentCount + (row.high_intent_count || 0),
      conversionCount: acc.conversionCount + (row.conversion_count || 0),
    }), { trafficCount: 0, uniqueVisitors: 0, avgDuration: 0, highIntentCount: 0, conversionCount: 0 });

    res.json({
      success: true,
      region,
      countries: rows.map(row => ({
        country: row.country,
        trafficCount: row.traffic_count || 0,
        uniqueVisitors: row.unique_visitors || 0,
        avgDuration: Math.round(row.avg_duration || 0),
        highIntentCount: row.high_intent_count || 0,
        conversionCount: row.conversion_count || 0,
      })),
      totals: {
        trafficCount: totals.trafficCount,
        uniqueVisitors: totals.uniqueVisitors,
        avgDuration: Math.round(totals.avgDuration / rows.length),
        highIntentCount: totals.highIntentCount,
        conversionCount: totals.conversionCount,
      },
    });
  } catch (error) {
    console.error('Error fetching regional analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get country-level analytics
 */
exports.getCountryAnalytics = async (req, res) => {
  try {
    const { country } = req.params;

    const query = `
      SELECT 
        city,
        COUNT(*) as traffic_count,
        COUNT(DISTINCT ip_address) as unique_visitors,
        AVG(total_session_duration) as avg_duration,
        COUNT(DISTINCT CASE WHEN total_pages_visited >= 3 THEN session_uuid END) as high_intent_count,
        COUNT(DISTINCT CASE WHEN landing_page LIKE '%contact%' THEN session_uuid END) as conversion_count
      FROM visitor_sessions
      WHERE UPPER(country) = UPPER(?)
      AND session_start >= NOW() - INTERVAL 7 DAY
      GROUP BY city
      ORDER BY traffic_count DESC
      LIMIT 20
    `;

    const [rows] = await pool.query(query, [country]);

    res.json({
      success: true,
      country,
      cities: rows.map(row => ({
        city: row.city,
        trafficCount: row.traffic_count || 0,
        uniqueVisitors: row.unique_visitors || 0,
        avgDuration: Math.round(row.avg_duration || 0),
        highIntentCount: row.high_intent_count || 0,
        conversionCount: row.conversion_count || 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching country analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get city-level analytics
 */
exports.getCityAnalytics = async (req, res) => {
  try {
    const { city, country } = req.params;

    const query = `
      SELECT 
        device_type,
        browser,
        COUNT(*) as traffic_count,
        COUNT(DISTINCT ip_address) as unique_visitors,
        AVG(total_session_duration) as avg_duration,
        COUNT(DISTINCT CASE WHEN total_pages_visited >= 3 THEN session_uuid END) as high_intent_count,
        COUNT(DISTINCT CASE WHEN landing_page LIKE '%contact%' THEN session_uuid END) as conversion_count
      FROM visitor_sessions
      WHERE UPPER(city) = UPPER(?) AND UPPER(country) = UPPER(?)
      AND session_start >= NOW() - INTERVAL 7 DAY
      GROUP BY device_type, browser
      ORDER BY traffic_count DESC
    `;

    const [rows] = await pool.query(query, [city, country]);

    res.json({
      success: true,
      city,
      country,
      breakdown: rows.map(row => ({
        deviceType: row.device_type,
        browser: row.browser,
        trafficCount: row.traffic_count || 0,
        uniqueVisitors: row.unique_visitors || 0,
        avgDuration: Math.round(row.avg_duration || 0),
        highIntentCount: row.high_intent_count || 0,
        conversionCount: row.conversion_count || 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching city analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get active sessions by location
 */
exports.getActiveSessions = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const query = `
      SELECT 
        session_uuid,
        country,
        city,
        device_type,
        browser,
        landing_page,
        total_pages_visited,
        total_session_duration,
        session_start,
        TIMESTAMPDIFF(SECOND, session_start, NOW()) as seconds_active
      FROM visitor_sessions
      WHERE session_start >= NOW() - INTERVAL 1 HOUR
      AND (last_activity >= NOW() - INTERVAL 5 MINUTE)
      ORDER BY session_start DESC
      LIMIT ?
    `;

    const [rows] = await pool.query(query, [parseInt(limit)]);

    res.json({
      success: true,
      activeSessions: rows.map(row => ({
        sessionId: row.session_uuid,
        country: row.country,
        city: row.city,
        deviceType: row.device_type,
        browser: row.browser,
        currentPage: row.landing_page,
        pagesVisited: row.total_pages_visited,
        sessionDuration: row.total_session_duration,
        secondsActive: row.seconds_active,
      })),
      count: rows.length,
    });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Enrich visitor flow data with geographic coordinates
 * (Mock implementation - would be replaced with actual geographic data)
 */
async function enrichVisitorFlowWithCoordinates(routes) {
  // Predefined coordinates for major cities
  const cityCoordinates = {
    'Mumbai': { lat: 19.0760, lon: 72.8777 },
    'Delhi': { lat: 28.7041, lon: 77.1025 },
    'London': { lat: 51.5074, lon: -0.1278 },
    'New York': { lat: 40.7128, lon: -74.0060 },
    'Shanghai': { lat: 31.2304, lon: 121.4737 },
    'Tokyo': { lat: 35.6762, lon: 139.6503 },
    'Dubai': { lat: 25.2048, lon: 55.2708 },
    'Paris': { lat: 48.8566, lon: 2.3522 },
    'Singapore': { lat: 1.3521, lon: 103.8198 },
    'San Francisco': { lat: 37.7749, lon: -122.4194 },
    'São Paulo': { lat: -23.5505, lon: -46.6333 },
    'Sydney': { lat: -33.8688, lon: 151.2093 },
    'Berlin': { lat: 52.5200, lon: 13.4050 },
    'Amsterdam': { lat: 52.3676, lon: 4.9041 },
    'Toronto': { lat: 43.6629, lon: -79.3957 },
  };

  return routes.map(route => {
    const originCoords = cityCoordinates[route.origin_city] || { lat: 0, lon: 0 };
    const destCoords = cityCoordinates[route.destination_city] || { lat: 0, lon: 0 };

    return {
      origin_city: route.origin_city,
      origin_country: route.origin_country,
      origin_lat: originCoords.lat,
      origin_lon: originCoords.lon,
      destination_city: route.destination_city,
      destination_country: route.destination_country,
      destination_lat: destCoords.lat,
      destination_lon: destCoords.lon,
      traffic_count: route.traffic_count,
      conversions: route.conversions || 0,
      conversion_rate: route.conversion_rate || 0,
    };
  });
}

// Module exports already handled by exports.functionName assignments above
// No need for module.exports object
