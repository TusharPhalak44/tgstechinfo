/**
 * Country coordinates dictionary & 3D spherical projection helper
 * Zero PII: Maps country codes/names to approximate centroid latitude & longitude.
 */

export const COUNTRY_COORDINATES = {
  // Asia
  'India': { lat: 20.5937, lon: 78.9629, code: 'IN', region: 'Asia', city: 'Mumbai' },
  'IN': { lat: 20.5937, lon: 78.9629, code: 'IN', region: 'Asia', city: 'New Delhi' },
  'Singapore': { lat: 1.3521, lon: 103.8198, code: 'SG', region: 'Asia', city: 'Singapore' },
  'SG': { lat: 1.3521, lon: 103.8198, code: 'SG', region: 'Asia', city: 'Singapore' },
  'United Arab Emirates': { lat: 23.4241, lon: 53.8478, code: 'AE', region: 'Middle East', city: 'Dubai' },
  'UAE': { lat: 23.4241, lon: 53.8478, code: 'AE', region: 'Middle East', city: 'Dubai' },
  'AE': { lat: 23.4241, lon: 53.8478, code: 'AE', region: 'Middle East', city: 'Abu Dhabi' },
  'Japan': { lat: 36.2048, lon: 138.2529, code: 'JP', region: 'Asia', city: 'Tokyo' },
  'JP': { lat: 36.2048, lon: 138.2529, code: 'JP', region: 'Asia', city: 'Tokyo' },
  'China': { lat: 35.8617, lon: 104.1954, code: 'CN', region: 'Asia', city: 'Shanghai' },
  'CN': { lat: 35.8617, lon: 104.1954, code: 'CN', region: 'Asia', city: 'Beijing' },
  'Saudi Arabia': { lat: 23.8859, lon: 45.0792, code: 'SA', region: 'Middle East', city: 'Riyadh' },
  'SA': { lat: 23.8859, lon: 45.0792, code: 'SA', region: 'Middle East', city: 'Riyadh' },
  'Indonesia': { lat: -0.7893, lon: 113.9213, code: 'ID', region: 'Asia', city: 'Jakarta' },
  'ID': { lat: -0.7893, lon: 113.9213, code: 'ID', region: 'Asia', city: 'Jakarta' },
  'South Korea': { lat: 35.9078, lon: 127.7669, code: 'KR', region: 'Asia', city: 'Seoul' },
  'KR': { lat: 35.9078, lon: 127.7669, code: 'KR', region: 'Asia', city: 'Seoul' },
  'Malaysia': { lat: 4.2105, lon: 101.9758, code: 'MY', region: 'Asia', city: 'Kuala Lumpur' },
  'MY': { lat: 4.2105, lon: 101.9758, code: 'MY', region: 'Asia', city: 'Kuala Lumpur' },
  'Thailand': { lat: 15.8700, lon: 100.9925, code: 'TH', region: 'Asia', city: 'Bangkok' },
  'TH': { lat: 15.8700, lon: 100.9925, code: 'TH', region: 'Asia', city: 'Bangkok' },
  'Vietnam': { lat: 14.0583, lon: 108.2772, code: 'VN', region: 'Asia', city: 'Ho Chi Minh City' },
  'VN': { lat: 14.0583, lon: 108.2772, code: 'VN', region: 'Asia', city: 'Hanoi' },
  'Philippines': { lat: 12.8797, lon: 121.7740, code: 'PH', region: 'Asia', city: 'Manila' },
  'PH': { lat: 12.8797, lon: 121.7740, code: 'PH', region: 'Asia', city: 'Manila' },

  // North America
  'United States': { lat: 37.0902, lon: -95.7129, code: 'US', region: 'North America', city: 'New York' },
  'USA': { lat: 37.0902, lon: -95.7129, code: 'US', region: 'North America', city: 'San Francisco' },
  'US': { lat: 37.0902, lon: -95.7129, code: 'US', region: 'North America', city: 'Chicago' },
  'Canada': { lat: 56.1304, lon: -106.3468, code: 'CA', region: 'North America', city: 'Toronto' },
  'CA': { lat: 56.1304, lon: -106.3468, code: 'CA', region: 'North America', city: 'Vancouver' },
  'Mexico': { lat: 23.6345, lon: -102.5528, code: 'MX', region: 'North America', city: 'Mexico City' },
  'MX': { lat: 23.6345, lon: -102.5528, code: 'MX', region: 'North America', city: 'Mexico City' },

  // Europe
  'United Kingdom': { lat: 55.3781, lon: -3.4360, code: 'GB', region: 'Europe', city: 'London' },
  'UK': { lat: 55.3781, lon: -3.4360, code: 'GB', region: 'Europe', city: 'London' },
  'GB': { lat: 55.3781, lon: -3.4360, code: 'GB', region: 'Europe', city: 'London' },
  'Germany': { lat: 51.1657, lon: 10.4515, code: 'DE', region: 'Europe', city: 'Frankfurt' },
  'DE': { lat: 51.1657, lon: 10.4515, code: 'DE', region: 'Europe', city: 'Berlin' },
  'France': { lat: 46.2276, lon: 2.2137, code: 'FR', region: 'Europe', city: 'Paris' },
  'FR': { lat: 46.2276, lon: 2.2137, code: 'FR', region: 'Europe', city: 'Paris' },
  'Netherlands': { lat: 52.1326, lon: 5.2913, code: 'NL', region: 'Europe', city: 'Amsterdam' },
  'NL': { lat: 52.1326, lon: 5.2913, code: 'NL', region: 'Europe', city: 'Amsterdam' },
  'Ireland': { lat: 53.1424, lon: -7.6921, code: 'IE', region: 'Europe', city: 'Dublin' },
  'IE': { lat: 53.1424, lon: -7.6921, code: 'IE', region: 'Europe', city: 'Dublin' },
  'Switzerland': { lat: 46.8182, lon: 8.2275, code: 'CH', region: 'Europe', city: 'Zurich' },
  'CH': { lat: 46.8182, lon: 8.2275, code: 'CH', region: 'Europe', city: 'Geneva' },
  'Sweden': { lat: 60.1282, lon: 18.6435, code: 'SE', region: 'Europe', city: 'Stockholm' },
  'SE': { lat: 60.1282, lon: 18.6435, code: 'SE', region: 'Europe', city: 'Stockholm' },
  'Spain': { lat: 40.4637, lon: -3.7492, code: 'ES', region: 'Europe', city: 'Madrid' },
  'ES': { lat: 40.4637, lon: -3.7492, code: 'ES', region: 'Europe', city: 'Barcelona' },
  'Italy': { lat: 41.8719, lon: 12.5674, code: 'IT', region: 'Europe', city: 'Milan' },
  'IT': { lat: 41.8719, lon: 12.5674, code: 'IT', region: 'Europe', city: 'Rome' },
  'Poland': { lat: 51.9194, lon: 19.1451, code: 'PL', region: 'Europe', city: 'Warsaw' },
  'PL': { lat: 51.9194, lon: 19.1451, code: 'PL', region: 'Europe', city: 'Warsaw' },

  // Oceania
  'Australia': { lat: -25.2744, lon: 133.7751, code: 'AU', region: 'Oceania', city: 'Sydney' },
  'AU': { lat: -25.2744, lon: 133.7751, code: 'AU', region: 'Oceania', city: 'Melbourne' },
  'New Zealand': { lat: -40.9006, lon: 174.8860, code: 'NZ', region: 'Oceania', city: 'Auckland' },
  'NZ': { lat: -40.9006, lon: 174.8860, code: 'NZ', region: 'Oceania', city: 'Wellington' },

  // South America
  'Brazil': { lat: -14.2350, lon: -51.9253, code: 'BR', region: 'South America', city: 'São Paulo' },
  'BR': { lat: -14.2350, lon: -51.9253, code: 'BR', region: 'South America', city: 'Rio de Janeiro' },
  'Argentina': { lat: -38.4161, lon: -63.6167, code: 'AR', region: 'South America', city: 'Buenos Aires' },
  'AR': { lat: -38.4161, lon: -63.6167, code: 'AR', region: 'South America', city: 'Buenos Aires' },

  // Africa
  'South Africa': { lat: -30.5595, lon: 22.9375, code: 'ZA', region: 'Africa', city: 'Cape Town' },
  'ZA': { lat: -30.5595, lon: 22.9375, code: 'ZA', region: 'Africa', city: 'Johannesburg' },
  'Nigeria': { lat: 9.0820, lon: 8.6753, code: 'NG', region: 'Africa', city: 'Lagos' },
  'NG': { lat: 9.0820, lon: 8.6753, code: 'NG', region: 'Africa', city: 'Lagos' },
  'Kenya': { lat: -0.0236, lon: 37.9062, code: 'KE', region: 'Africa', city: 'Nairobi' },
  'KE': { lat: -0.0236, lon: 37.9062, code: 'KE', region: 'Africa', city: 'Nairobi' },
};

/**
 * Normalizes country strings and finds coordinate centroid
 */
export function getCountryGeo(countryNameOrCode) {
  if (!countryNameOrCode) {
    return { lat: 20.5937, lon: 78.9629, code: 'GLOBAL', country: 'Global Visitor', city: 'Central Hub', region: 'Global' };
  }
  const clean = countryNameOrCode.trim();
  if (COUNTRY_COORDINATES[clean]) {
    return { ...COUNTRY_COORDINATES[clean], country: clean };
  }
  const upper = clean.toUpperCase();
  if (COUNTRY_COORDINATES[upper]) {
    return { ...COUNTRY_COORDINATES[upper], country: upper };
  }
  // Search case-insensitive
  const foundKey = Object.keys(COUNTRY_COORDINATES).find(
    k => k.toLowerCase() === clean.toLowerCase()
  );
  if (foundKey) {
    return { ...COUNTRY_COORDINATES[foundKey], country: foundKey };
  }
  // Default fallback
  return { lat: 28.6139, lon: 77.2090, code: 'INTL', country: clean, city: 'Global Location', region: 'Worldwide' };
}

/**
 * 3D Orthographic Spherical Projection
 * Converts latitude/longitude (degrees) & globe rotation (radians) to 2D screen coordinates (x, y)
 * Returns { x, y, z, visible, depthScale } where:
 *   - z > 0 is facing the viewer (front hemisphere)
 *   - visible: boolean (z > -0.1 for edge visibility)
 */
export function project3D(latDeg, lonDeg, radius, rotationRad, centerX, centerY) {
  const phi = (latDeg * Math.PI) / 180; // Latitude: -PI/2 to PI/2
  const theta = (lonDeg * Math.PI) / 180 + rotationRad; // Longitude + rotation

  // 3D Cartesian coordinates on unit sphere
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);

  const x3d = radius * cosPhi * sinTheta;
  const y3d = -radius * sinPhi;
  const z3d = radius * cosPhi * cosTheta;

  // Screen coordinates
  const screenX = centerX + x3d;
  const screenY = centerY + y3d;

  return {
    x: screenX,
    y: screenY,
    z: z3d,
    visible: z3d > -radius * 0.15, // Smooth horizon fade
    isFront: z3d > 0,
    depthRatio: (z3d + radius) / (2 * radius), // 0 (back) to 1 (front)
  };
}

/**
 * Digital Earth Continent Point Cloud
 * A curated set of latitude/longitude points forming the continents of Earth for wireframe rendering.
 */
export const CONTINENT_POINTS = [
  // North America
  [50, -100], [55, -115], [60, -135], [58, -95], [45, -75], [40, -80], [35, -90], [30, -95],
  [45, -110], [40, -120], [35, -118], [25, -100], [20, -100], [48, -68], [32, -82], [65, -150],
  [52, -80], [42, -95], [38, -105], [28, -82], [18, -96], [62, -110], [54, -125],
  
  // South America
  [5, -70], [0, -60], [-5, -50], [-10, -40], [-15, -45], [-20, -45], [-25, -50], [-30, -55],
  [-35, -60], [-40, -65], [-45, -70], [-50, -70], [-10, -75], [-5, -80], [-18, -68], [-28, -65],
  
  // Europe
  [55, -3], [52, 0], [48, 2], [44, 4], [40, -4], [38, -8], [42, 12], [46, 14], [52, 13],
  [50, 20], [56, 24], [60, 10], [64, 15], [60, 25], [65, 25], [45, 25], [40, 22], [54, 38],
  
  // Africa
  [32, -5], [30, 10], [30, 30], [25, 35], [15, 40], [10, 42], [5, 45], [0, 42], [-5, 40],
  [-15, 38], [-25, 32], [-34, 20], [-30, 18], [-20, 14], [-10, 12], [5, 0], [15, -15], [25, -12],
  [12, 15], [0, 20], [-10, 25], [-20, 24], [20, 10], [10, 30],
  
  // Asia
  [65, 70], [60, 80], [55, 75], [50, 60], [40, 50], [30, 50], [25, 55], [15, 48],
  [28, 77], [22, 80], [15, 78], [10, 77], [22, 88], [26, 92], [15, 100], [10, 105],
  [35, 105], [40, 115], [30, 120], [22, 115], [45, 125], [50, 130], [35, 138], [38, 140],
  [55, 90], [60, 110], [65, 130], [60, 150], [45, 80], [35, 70], [28, 84], [13, 80],
  [1, 104], [3, 102], [14, 108], [20, 106],
  
  // Oceania / Australia
  [-15, 130], [-20, 120], [-25, 115], [-32, 116], [-35, 138], [-38, 145], [-32, 152],
  [-25, 152], [-18, 145], [-12, 135], [-25, 134], [-22, 140], [-28, 125], [-42, 172], [-38, 176]
];

/**
 * Continent label anchors for globe rendering
 * Each entry has: label (display text), lat, lon (centroid), and region (EMEA/APAC/etc.)
 */
export const CONTINENT_LABELS = [
  { label: 'N. AMERICA',   shortLabel: 'N.AM',  lat: 47,   lon: -100, region: 'Americas',     color: '#0AAEEF' },
  { label: 'S. AMERICA',   shortLabel: 'S.AM',  lat: -15,  lon: -58,  region: 'Americas',     color: '#06B6D4' },
  { label: 'EUROPE',       shortLabel: 'EUR',   lat: 52,   lon: 12,   region: 'EMEA',         color: '#A855F7' },
  { label: 'AFRICA',       shortLabel: 'AFR',   lat: 3,    lon: 22,   region: 'EMEA',         color: '#F59E0B' },
  { label: 'MIDDLE EAST',  shortLabel: 'MEA',   lat: 26,   lon: 46,   region: 'EMEA',         color: '#F7941D' },
  { label: 'S. ASIA',      shortLabel: 'SAI',   lat: 22,   lon: 78,   region: 'APAC',         color: '#10B981' },
  { label: 'E. ASIA',      shortLabel: 'EAS',   lat: 38,   lon: 118,  region: 'APAC',         color: '#22D3EE' },
  { label: 'S.E. ASIA',    shortLabel: 'SEA',   lat: 8,    lon: 108,  region: 'APAC',         color: '#34D399' },
  { label: 'OCEANIA',      shortLabel: 'OCE',   lat: -28,  lon: 134,  region: 'APAC',         color: '#60A5FA' },
];

/**
 * Maps country regions to EMEA/APAC/Americas groupings for filter UI
 */
export const REGION_MAP = {
  'Europe':        'EMEA',
  'Africa':        'EMEA',
  'Middle East':   'EMEA',
  'Asia':          'APAC',
  'Oceania':       'APAC',
  'North America': 'Americas',
  'South America': 'Americas',
  'Worldwide':     'Global',
  'Global':        'Global',
};

/**
 * Derive unique country list from COUNTRY_COORDINATES for filter UI
 */
export const COUNTRY_LIST = [
  ...new Set(
    Object.values(COUNTRY_COORDINATES)
      .map(c => ({ name: Object.keys(COUNTRY_COORDINATES).find(k => COUNTRY_COORDINATES[k] === c) || '', ...c }))
      .filter(c => c.name.length > 2) // only full names, not 2-letter codes
      .map(c => c.name)
  )
].sort();

