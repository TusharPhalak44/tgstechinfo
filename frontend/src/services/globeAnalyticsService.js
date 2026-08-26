/**
 * Globe Analytics Service
 * Integrates with backend API to fetch live geographic traffic data
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * Fetch live geographic traffic data
 */
export const fetchGeographicTraffic = async (filters = {}) => {
  try {
    const params = {
      limit: filters.limit || 100,
      startDate: filters.startDate,
      endDate: filters.endDate,
      ...filters,
    };

    const response = await axios.get(`${API_BASE_URL}/analytics/geographic-traffic`, {
      params: Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined)),
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching geographic traffic:', error);
    return null;
  }
};

/**
 * Fetch traffic data for a specific location
 */
export const fetchLocationTraffic = async (locationData) => {
  try {
    const endpoint = getLocationEndpoint(locationData);
    if (!endpoint) return null;

    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      params: {
        ...locationData,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching location traffic:', error);
    return null;
  }
};

/**
 * Fetch regional analytics
 */
export const fetchRegionalAnalytics = async (regionId, timeRange = '24h') => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/analytics/regional/${regionId}`,
      { params: { timeRange } }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching regional analytics:', error);
    return null;
  }
};

/**
 * Fetch country-level analytics
 */
export const fetchCountryAnalytics = async (countryCode, timeRange = '24h') => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/analytics/country/${countryCode}`,
      { params: { timeRange } }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching country analytics:', error);
    return null;
  }
};

/**
 * Fetch city-level analytics
 */
export const fetchCityAnalytics = async (cityName, countryCode, timeRange = '24h') => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/analytics/city/${cityName}/${countryCode}`,
      { params: { timeRange } }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching city analytics:', error);
    return null;
  }
};

/**
 * Fetch visitor flow data (for traffic arcs)
 */
export const fetchVisitorFlow = async (filters = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/analytics/visitor-flow`, {
      params: {
        limit: filters.limit || 50,
        minTraffic: filters.minTraffic || 10,
        ...filters,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching visitor flow:', error);
    return null;
  }
};

/**
 * Fetch active sessions by location
 */
export const fetchActiveSessions = async (locationData = null) => {
  try {
    const params = locationData ? { ...locationData } : {};
    const response = await axios.get(`${API_BASE_URL}/analytics/active-sessions`, {
      params,
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    return null;
  }
};

/**
 * Fetch traffic statistics
 */
export const fetchTrafficStats = async (locationData = null, timeRange = '24h') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/analytics/traffic-stats`, {
      params: {
        ...locationData,
        timeRange,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching traffic stats:', error);
    return null;
  }
};

/**
 * Fetch conversion data
 */
export const fetchConversionData = async (locationData = null) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/analytics/conversions`, {
      params: locationData || {},
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching conversion data:', error);
    return null;
  }
};

/**
 * Determine the correct API endpoint based on location level
 */
const getLocationEndpoint = (locationData) => {
  if (!locationData || !locationData.level) return null;

  switch (locationData.level) {
    case 'BUSINESS_REGION':
      return `/analytics/region/${locationData.id}`;
    case 'CONTINENT':
      return `/analytics/continent/${locationData.id}`;
    case 'COUNTRY':
      return `/analytics/country/${locationData.id}`;
    case 'CITY':
      return `/analytics/city/${locationData.name}/${locationData.country}`;
    default:
      return null;
  }
};

/**
 * Transform geographic traffic data for 3D visualization
 */
export const transformTrafficForVisualization = (trafficData) => {
  if (!trafficData || !trafficData.routes) return [];

  return trafficData.routes.map(route => ({
    fromLat: route.origin_lat,
    fromLon: route.origin_lon,
    toLat: route.destination_lat,
    toLon: route.destination_lon,
    intensity: Math.min(1, route.traffic_count / 1000),
    color: getTrafficColor(route.conversion_rate || 0),
    traffic: route.traffic_count,
    conversions: route.conversions || 0,
    sourceCity: route.origin_city,
    destCity: route.destination_city,
  }));
};

/**
 * Get color based on traffic/conversion metrics
 */
const getTrafficColor = (conversionRate) => {
  if (conversionRate > 0.05) return 0xff4444; // Red - high conversion
  if (conversionRate > 0.03) return 0xffaa00; // Orange - good conversion
  if (conversionRate > 0.01) return 0xffff00; // Yellow - moderate conversion
  return 0x0AAEEF; // Blue - standard traffic
};

/**
 * Poll for live updates
 */
export const pollLiveTraffic = (
  interval = 10000, // 10 seconds
  locationData = null,
  onUpdate = null,
  onError = null
) => {
  let timeoutId;

  const poll = async () => {
    try {
      const data = await fetchVisitorFlow(locationData);
      if (onUpdate && data) {
        onUpdate(transformTrafficForVisualization(data));
      }
    } catch (error) {
      if (onError) onError(error);
    }
    timeoutId = setTimeout(poll, interval);
  };

  // Start polling
  poll();

  // Return cleanup function
  return () => clearTimeout(timeoutId);
};

/**
 * Get mock data for development/demo
 */
export const getMockTrafficData = () => {
  return {
    routes: [
      {
        origin_lat: 19.0760,
        origin_lon: 72.8777,
        destination_lat: 51.5074,
        destination_lon: -0.1278,
        origin_city: 'Mumbai',
        destination_city: 'London',
        traffic_count: 245,
        conversions: 12,
        conversion_rate: 0.049,
      },
      {
        origin_lat: 31.2304,
        origin_lon: 121.4737,
        destination_lat: 25.2048,
        destination_lon: 55.2708,
        origin_city: 'Shanghai',
        destination_city: 'Dubai',
        traffic_count: 189,
        conversions: 4,
        conversion_rate: 0.021,
      },
      {
        origin_lat: 40.7128,
        origin_lon: -74.0060,
        destination_lat: 51.5074,
        destination_lon: -0.1278,
        origin_city: 'New York',
        destination_city: 'London',
        traffic_count: 512,
        conversions: 28,
        conversion_rate: 0.055,
      },
      {
        origin_lat: 35.6762,
        origin_lon: 139.6503,
        destination_lat: 1.3521,
        destination_lon: 103.8198,
        origin_city: 'Tokyo',
        destination_city: 'Singapore',
        traffic_count: 156,
        conversions: 9,
        conversion_rate: 0.058,
      },
      {
        origin_lat: -23.5505,
        origin_lon: -46.6333,
        destination_lat: 37.7749,
        destination_lon: -122.4194,
        origin_city: 'São Paulo',
        destination_city: 'San Francisco',
        traffic_count: 98,
        conversions: 3,
        conversion_rate: 0.031,
      },
      {
        origin_lat: 48.8566,
        origin_lon: 2.3522,
        destination_lat: 40.7128,
        destination_lon: -74.0060,
        origin_city: 'Paris',
        destination_city: 'New York',
        traffic_count: 234,
        conversions: 11,
        conversion_rate: 0.047,
      },
      {
        origin_lat: 52.5200,
        origin_lon: 13.4050,
        destination_lat: 48.8566,
        destination_lon: 2.3522,
        origin_city: 'Berlin',
        destination_city: 'Paris',
        traffic_count: 167,
        conversions: 8,
        conversion_rate: 0.048,
      },
      {
        origin_lat: -33.8688,
        origin_lon: 151.2093,
        destination_lat: 1.3521,
        destination_lon: 103.8198,
        origin_city: 'Sydney',
        destination_city: 'Singapore',
        traffic_count: 142,
        conversions: 6,
        conversion_rate: 0.042,
      },
    ],
  };
};

/**
 * Get mock location statistics
 */
export const getMockLocationStats = (locationLevel = 'WORLD') => {
  const baseStats = {
    WORLD: {
      activeVisitors: 12482,
      totalSessions: 10931,
      avgSessionDuration: 387,
      conversionRate: 3.2,
      bounceRate: 28,
      newVisitors: 4521,
    },
    BUSINESS_REGION: {
      activeVisitors: 5000,
      totalSessions: 4372,
      avgSessionDuration: 412,
      conversionRate: 3.8,
      bounceRate: 25,
      newVisitors: 1800,
    },
    CONTINENT: {
      activeVisitors: 2500,
      totalSessions: 2186,
      avgSessionDuration: 398,
      conversionRate: 3.5,
      bounceRate: 27,
      newVisitors: 900,
    },
    COUNTRY: {
      activeVisitors: 850,
      totalSessions: 728,
      avgSessionDuration: 415,
      conversionRate: 4.1,
      bounceRate: 24,
      newVisitors: 310,
    },
    CITY: {
      activeVisitors: 180,
      totalSessions: 156,
      avgSessionDuration: 425,
      conversionRate: 4.5,
      bounceRate: 22,
      newVisitors: 68,
    },
  };

  return baseStats[locationLevel] || baseStats.WORLD;
};

export default {
  fetchGeographicTraffic,
  fetchLocationTraffic,
  fetchRegionalAnalytics,
  fetchCountryAnalytics,
  fetchCityAnalytics,
  fetchVisitorFlow,
  fetchActiveSessions,
  fetchTrafficStats,
  fetchConversionData,
  transformTrafficForVisualization,
  pollLiveTraffic,
  getMockTrafficData,
  getMockLocationStats,
};
