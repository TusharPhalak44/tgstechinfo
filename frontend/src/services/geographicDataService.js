/**
 * Geographic Data Service
 * Provides real-world geographic data for the interactive 3D globe
 * Includes continents, countries, cities, and business regions
 */

// ─── 7 REAL GEOGRAPHIC CONTINENTS ───
export const CONTINENTS = {
  ASIA: {
    id: 'ASIA',
    name: 'Asia',
    label: 'ASIA',
    center: { lat: 34.0479, lon: 100.6197 },
    bounds: { north: 77.8, south: -10.0, east: 180.0, west: 26.0 },
    color: '#0AAEEF',
    countries: ['IN', 'CN', 'JP', 'KR', 'SG', 'ID', 'TH', 'MY', 'VN', 'PH', 'BD', 'PK', 'AF', 'UZ', 'KZ', 'TJ', 'TM', 'KG'],
    population: 4.7e9,
    area: 44.58e6,
  },
  EUROPE: {
    id: 'EUROPE',
    name: 'Europe',
    label: 'EUROPE',
    center: { lat: 54.5260, lon: 15.2551 },
    bounds: { north: 71.0, south: 34.0, east: 40.0, west: -10.0 },
    color: '#A855F7',
    countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'PL', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'CZ', 'RO', 'GR', 'HU', 'UA', 'RS', 'HR', 'BG', 'SK', 'LT', 'LV', 'EE'],
    population: 748e6,
    area: 10.18e6,
  },
  AFRICA: {
    id: 'AFRICA',
    name: 'Africa',
    label: 'AFRICA',
    center: { lat: -8.7832, lon: 34.5085 },
    bounds: { north: 37.3, south: -34.8, east: 55.0, west: -17.5 },
    color: '#F59E0B',
    countries: ['ZA', 'EG', 'NG', 'ET', 'KE', 'UG', 'TZ', 'GH', 'MA', 'DZ', 'SN', 'CM', 'CI', 'MW', 'ZM', 'ZW', 'BW', 'NA', 'RW', 'BJ', 'TG', 'LR', 'SL', 'MZ'],
    population: 1.4e9,
    area: 30.37e6,
  },
  NORTH_AMERICA: {
    id: 'NORTH_AMERICA',
    name: 'North America',
    label: 'N. AMERICA',
    center: { lat: 54.5260, lon: -105.2551 },
    bounds: { north: 83.0, south: 15.0, east: -52.0, west: -170.0 },
    color: '#0AAEEF',
    countries: ['US', 'CA', 'MX'],
    population: 580e6,
    area: 24.71e6,
  },
  SOUTH_AMERICA: {
    id: 'SOUTH_AMERICA',
    name: 'South America',
    label: 'S. AMERICA',
    center: { lat: -8.7832, lon: -55.4915 },
    bounds: { north: 12.0, south: -56.0, east: -27.0, west: -82.0 },
    color: '#06B6D4',
    countries: ['BR', 'CO', 'AR', 'PE', 'VE', 'CL', 'EC', 'BO', 'PY', 'UY', 'GY', 'SR'],
    population: 436e6,
    area: 17.84e6,
  },
  OCEANIA: {
    id: 'OCEANIA',
    name: 'Oceania',
    label: 'OCEANIA',
    center: { lat: -27.0, lon: 133.7751 },
    bounds: { north: 0.0, south: -47.0, east: 180.0, west: 113.0 },
    color: '#60A5FA',
    countries: ['AU', 'NZ', 'FJ', 'PG', 'SB', 'VU', 'WS', 'TO', 'KI', 'MH', 'FM', 'PW'],
    population: 45e6,
    area: 8.6e6,
  },
  ANTARCTICA: {
    id: 'ANTARCTICA',
    name: 'Antarctica',
    label: 'ANTARCTICA',
    center: { lat: -82.8628, lon: 0.0 },
    bounds: { north: -60.0, south: -90.0, east: 180.0, west: -180.0 },
    color: '#E0F2FE',
    countries: [],
    population: 0,
    area: 14.2e6,
  },
};

// ─── BUSINESS TRAFFIC REGIONS ───
export const BUSINESS_REGIONS = {
  AMER: {
    id: 'AMER',
    name: 'Americas',
    label: 'AMER',
    continents: ['NORTH_AMERICA', 'SOUTH_AMERICA'],
    color: '#0AAEEF',
    description: 'North America + South America',
    countries: [...CONTINENTS.NORTH_AMERICA.countries, ...CONTINENTS.SOUTH_AMERICA.countries],
  },
  LATAM: {
    id: 'LATAM',
    name: 'Latin America',
    label: 'LATAM',
    continents: ['SOUTH_AMERICA'],
    color: '#06B6D4',
    description: 'Latin America & Caribbean',
    countries: ['BR', 'CO', 'AR', 'PE', 'VE', 'CL', 'EC', 'BO', 'PY', 'UY', 'MX', 'CU', 'DO'],
  },
  EMEA: {
    id: 'EMEA',
    name: 'EMEA',
    label: 'EMEA',
    continents: ['EUROPE', 'AFRICA'],
    color: '#A855F7',
    description: 'Europe, Middle East, Africa',
    countries: [...CONTINENTS.EUROPE.countries, ...CONTINENTS.AFRICA.countries, 'SA', 'AE', 'IL', 'KW', 'QA', 'OM', 'BH', 'JO', 'LB', 'TR', 'IR', 'IQ'],
  },
  APAC: {
    id: 'APAC',
    name: 'APAC',
    label: 'APAC',
    continents: ['ASIA', 'OCEANIA'],
    color: '#22D3EE',
    description: 'Asia Pacific',
    countries: [...CONTINENTS.ASIA.countries, ...CONTINENTS.OCEANIA.countries],
  },
};

// ─── COMPREHENSIVE COUNTRY DATASET ───
export const COUNTRIES = {
  // ASIA
  IN: {
    code: 'IN',
    name: 'India',
    continent: 'ASIA',
    businessRegion: 'APAC',
    center: { lat: 20.5937, lon: 78.9629 },
    cities: ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'],
    population: 1.417e9,
  },
  CN: {
    code: 'CN',
    name: 'China',
    continent: 'ASIA',
    businessRegion: 'APAC',
    center: { lat: 35.8617, lon: 104.1954 },
    cities: ['Shanghai', 'Beijing', 'Shenzhen', 'Guangzhou', 'Chengdu', 'Hangzhou'],
    population: 1.412e9,
  },
  JP: {
    code: 'JP',
    name: 'Japan',
    continent: 'ASIA',
    businessRegion: 'APAC',
    center: { lat: 36.2048, lon: 138.2529 },
    cities: ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo'],
    population: 123e6,
  },
  KR: {
    code: 'KR',
    name: 'South Korea',
    continent: 'ASIA',
    businessRegion: 'APAC',
    center: { lat: 35.9078, lon: 127.7669 },
    cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon'],
    population: 51.6e6,
  },
  SG: {
    code: 'SG',
    name: 'Singapore',
    continent: 'ASIA',
    businessRegion: 'APAC',
    center: { lat: 1.3521, lon: 103.8198 },
    cities: ['Singapore'],
    population: 5.9e6,
  },
  ID: {
    code: 'ID',
    name: 'Indonesia',
    continent: 'ASIA',
    businessRegion: 'APAC',
    center: { lat: -0.7893, lon: 113.9213 },
    cities: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'],
    population: 277e6,
  },
  TH: {
    code: 'TH',
    name: 'Thailand',
    continent: 'ASIA',
    businessRegion: 'APAC',
    center: { lat: 15.87, lon: 100.9925 },
    cities: ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya'],
    population: 69e6,
  },
  MY: {
    code: 'MY',
    name: 'Malaysia',
    continent: 'ASIA',
    businessRegion: 'APAC',
    center: { lat: 4.2105, lon: 101.9758 },
    cities: ['Kuala Lumpur', 'George Town', 'Johor Bahru'],
    population: 34e6,
  },
  VN: {
    code: 'VN',
    name: 'Vietnam',
    continent: 'ASIA',
    businessRegion: 'APAC',
    center: { lat: 14.0583, lon: 108.2772 },
    cities: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong'],
    population: 98e6,
  },
  PH: {
    code: 'PH',
    name: 'Philippines',
    continent: 'ASIA',
    businessRegion: 'APAC',
    center: { lat: 12.8797, lon: 121.774 },
    cities: ['Manila', 'Cebu', 'Davao', 'Quezon City'],
    population: 120e6,
  },

  // EUROPE
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    continent: 'EUROPE',
    businessRegion: 'EMEA',
    center: { lat: 55.3781, lon: -3.436 },
    cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow'],
    population: 68e6,
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    continent: 'EUROPE',
    businessRegion: 'EMEA',
    center: { lat: 51.1657, lon: 10.4515 },
    cities: ['Berlin', 'Munich', 'Cologne', 'Hamburg', 'Frankfurt'],
    population: 84e6,
  },
  FR: {
    code: 'FR',
    name: 'France',
    continent: 'EUROPE',
    businessRegion: 'EMEA',
    center: { lat: 46.2276, lon: 2.2137 },
    cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'],
    population: 68e6,
  },
  IT: {
    code: 'IT',
    name: 'Italy',
    continent: 'EUROPE',
    businessRegion: 'EMEA',
    center: { lat: 41.8719, lon: 12.5674 },
    cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Venice'],
    population: 58e6,
  },
  ES: {
    code: 'ES',
    name: 'Spain',
    continent: 'EUROPE',
    businessRegion: 'EMEA',
    center: { lat: 40.4637, lon: -3.7492 },
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville'],
    population: 47e6,
  },
  NL: {
    code: 'NL',
    name: 'Netherlands',
    continent: 'EUROPE',
    businessRegion: 'EMEA',
    center: { lat: 52.1326, lon: 5.2913 },
    cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'],
    population: 17e6,
  },
  SE: {
    code: 'SE',
    name: 'Sweden',
    continent: 'EUROPE',
    businessRegion: 'EMEA',
    center: { lat: 60.1282, lon: 18.6435 },
    cities: ['Stockholm', 'Gothenburg', 'Malmö'],
    population: 10.5e6,
  },
  CH: {
    code: 'CH',
    name: 'Switzerland',
    continent: 'EUROPE',
    businessRegion: 'EMEA',
    center: { lat: 46.8182, lon: 8.2275 },
    cities: ['Zurich', 'Geneva', 'Basel', 'Bern'],
    population: 8.7e6,
  },
  IE: {
    code: 'IE',
    name: 'Ireland',
    continent: 'EUROPE',
    businessRegion: 'EMEA',
    center: { lat: 53.1424, lon: -7.6921 },
    cities: ['Dublin', 'Cork', 'Limerick'],
    population: 5.1e6,
  },
  PL: {
    code: 'PL',
    name: 'Poland',
    continent: 'EUROPE',
    businessRegion: 'EMEA',
    center: { lat: 51.9194, lon: 19.1451 },
    cities: ['Warsaw', 'Krakow', 'Wroclaw', 'Gdansk'],
    population: 37.8e6,
  },

  // AFRICA
  ZA: {
    code: 'ZA',
    name: 'South Africa',
    continent: 'AFRICA',
    businessRegion: 'EMEA',
    center: { lat: -30.5595, lon: 22.9375 },
    cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'],
    population: 60e6,
  },
  EG: {
    code: 'EG',
    name: 'Egypt',
    continent: 'AFRICA',
    businessRegion: 'EMEA',
    center: { lat: 26.8206, lon: 30.8025 },
    cities: ['Cairo', 'Alexandria', 'Giza'],
    population: 104e6,
  },
  NG: {
    code: 'NG',
    name: 'Nigeria',
    continent: 'AFRICA',
    businessRegion: 'EMEA',
    center: { lat: 9.082, lon: 8.6753 },
    cities: ['Lagos', 'Kano', 'Ibadan', 'Abuja'],
    population: 223e6,
  },
  KE: {
    code: 'KE',
    name: 'Kenya',
    continent: 'AFRICA',
    businessRegion: 'EMEA',
    center: { lat: -0.0236, lon: 37.9062 },
    cities: ['Nairobi', 'Mombasa', 'Kisumu'],
    population: 54e6,
  },

  // NORTH AMERICA
  US: {
    code: 'US',
    name: 'United States',
    continent: 'NORTH_AMERICA',
    businessRegion: 'AMER',
    center: { lat: 37.0902, lon: -95.7129 },
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'San Francisco', 'Seattle', 'Boston', 'Miami', 'Denver'],
    population: 331e6,
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    continent: 'NORTH_AMERICA',
    businessRegion: 'AMER',
    center: { lat: 56.1304, lon: -106.3468 },
    cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Edmonton'],
    population: 39e6,
  },
  MX: {
    code: 'MX',
    name: 'Mexico',
    continent: 'NORTH_AMERICA',
    businessRegion: 'LATAM',
    center: { lat: 23.6345, lon: -102.5528 },
    cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Cancun'],
    population: 130e6,
  },

  // SOUTH AMERICA
  BR: {
    code: 'BR',
    name: 'Brazil',
    continent: 'SOUTH_AMERICA',
    businessRegion: 'LATAM',
    center: { lat: -14.235, lon: -51.9253 },
    cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'],
    population: 215e6,
  },
  AR: {
    code: 'AR',
    name: 'Argentina',
    continent: 'SOUTH_AMERICA',
    businessRegion: 'LATAM',
    center: { lat: -38.4161, lon: -63.6167 },
    cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza'],
    population: 46e6,
  },
  CL: {
    code: 'CL',
    name: 'Chile',
    continent: 'SOUTH_AMERICA',
    businessRegion: 'LATAM',
    center: { lat: -35.6751, lon: -71.543 },
    cities: ['Santiago', 'Valparaíso', 'Concepción'],
    population: 19.6e6,
  },
  CO: {
    code: 'CO',
    name: 'Colombia',
    continent: 'SOUTH_AMERICA',
    businessRegion: 'LATAM',
    center: { lat: 4.5709, lon: -74.2973 },
    cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'],
    population: 52e6,
  },

  // OCEANIA
  AU: {
    code: 'AU',
    name: 'Australia',
    continent: 'OCEANIA',
    businessRegion: 'APAC',
    center: { lat: -25.2744, lon: 133.7751 },
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
    population: 26e6,
  },
  NZ: {
    code: 'NZ',
    name: 'New Zealand',
    continent: 'OCEANIA',
    businessRegion: 'APAC',
    center: { lat: -40.9006, lon: 174.886 },
    cities: ['Auckland', 'Wellington', 'Christchurch'],
    population: 5.1e6,
  },

  // MIDDLE EAST
  SA: {
    code: 'SA',
    name: 'Saudi Arabia',
    continent: 'AFRICA',
    businessRegion: 'EMEA',
    center: { lat: 23.8859, lon: 45.0792 },
    cities: ['Riyadh', 'Jeddah', 'Dammam'],
    population: 34e6,
  },
  AE: {
    code: 'AE',
    name: 'United Arab Emirates',
    continent: 'AFRICA',
    businessRegion: 'EMEA',
    center: { lat: 23.4241, lon: 53.8478 },
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah'],
    population: 9.9e6,
  },
  IL: {
    code: 'IL',
    name: 'Israel',
    continent: 'AFRICA',
    businessRegion: 'EMEA',
    center: { lat: 31.0461, lon: 34.8516 },
    cities: ['Tel Aviv', 'Jerusalem', 'Haifa'],
    population: 9.5e6,
  },
};

// ─── CITY DATASET WITH COORDINATES ───
export const CITIES = {
  'Mumbai': { lat: 19.0760, lon: 72.8777, country: 'IN', region: 'APAC' },
  'Delhi': { lat: 28.7041, lon: 77.1025, country: 'IN', region: 'APAC' },
  'Bengaluru': { lat: 12.9716, lon: 77.5946, country: 'IN', region: 'APAC' },
  'Hyderabad': { lat: 17.3850, lon: 78.4867, country: 'IN', region: 'APAC' },
  'Pune': { lat: 18.5204, lon: 73.8567, country: 'IN', region: 'APAC' },
  'Shanghai': { lat: 31.2304, lon: 121.4737, country: 'CN', region: 'APAC' },
  'Beijing': { lat: 39.9042, lon: 116.4074, country: 'CN', region: 'APAC' },
  'Tokyo': { lat: 35.6762, lon: 139.6503, country: 'JP', region: 'APAC' },
  'Seoul': { lat: 37.5665, lon: 126.9780, country: 'KR', region: 'APAC' },
  'Singapore': { lat: 1.3521, lon: 103.8198, country: 'SG', region: 'APAC' },
  'New York': { lat: 40.7128, lon: -74.0060, country: 'US', region: 'AMER' },
  'Los Angeles': { lat: 34.0522, lon: -118.2437, country: 'US', region: 'AMER' },
  'Chicago': { lat: 41.8781, lon: -87.6298, country: 'US', region: 'AMER' },
  'San Francisco': { lat: 37.7749, lon: -122.4194, country: 'US', region: 'AMER' },
  'Toronto': { lat: 43.6629, lon: -79.3957, country: 'CA', region: 'AMER' },
  'Vancouver': { lat: 49.2827, lon: -123.1207, country: 'CA', region: 'AMER' },
  'Mexico City': { lat: 19.4326, lon: -99.1332, country: 'MX', region: 'LATAM' },
  'São Paulo': { lat: -23.5505, lon: -46.6333, country: 'BR', region: 'LATAM' },
  'Rio de Janeiro': { lat: -22.9068, lon: -43.1729, country: 'BR', region: 'LATAM' },
  'Buenos Aires': { lat: -34.6037, lon: -58.3816, country: 'AR', region: 'LATAM' },
  'London': { lat: 51.5074, lon: -0.1278, country: 'GB', region: 'EMEA' },
  'Paris': { lat: 48.8566, lon: 2.3522, country: 'FR', region: 'EMEA' },
  'Berlin': { lat: 52.5200, lon: 13.4050, country: 'DE', region: 'EMEA' },
  'Amsterdam': { lat: 52.3676, lon: 4.9041, country: 'NL', region: 'EMEA' },
  'Dublin': { lat: 53.3498, lon: -6.2603, country: 'IE', region: 'EMEA' },
  'Zurich': { lat: 47.3769, lon: 8.5472, country: 'CH', region: 'EMEA' },
  'Cairo': { lat: 30.0444, lon: 31.2357, country: 'EG', region: 'EMEA' },
  'Lagos': { lat: 6.5244, lon: 3.3792, country: 'NG', region: 'EMEA' },
  'Johannesburg': { lat: -26.2023, lon: 28.0436, country: 'ZA', region: 'EMEA' },
  'Dubai': { lat: 25.2048, lon: 55.2708, country: 'AE', region: 'EMEA' },
  'Sydney': { lat: -33.8688, lon: 151.2093, country: 'AU', region: 'APAC' },
  'Melbourne': { lat: -37.8136, lon: 144.9631, country: 'AU', region: 'APAC' },
  'Auckland': { lat: -37.0082, lon: 174.7850, country: 'NZ', region: 'APAC' },
};

/**
 * Get continent by ID
 */
export const getContinent = (id) => CONTINENTS[id];

/**
 * Get all continents
 */
export const getAllContinents = () => Object.values(CONTINENTS);

/**
 * Get business region by ID
 */
export const getBusinessRegion = (id) => BUSINESS_REGIONS[id];

/**
 * Get all business regions
 */
export const getAllBusinessRegions = () => Object.values(BUSINESS_REGIONS);

/**
 * Get country by code
 */
export const getCountry = (code) => COUNTRIES[code];

/**
 * Get all countries
 */
export const getAllCountries = () => Object.values(COUNTRIES);

/**
 * Get countries by continent
 */
export const getCountriesByContinent = (continentId) => {
  const continent = CONTINENTS[continentId];
  if (!continent) return [];
  return continent.countries.map(code => COUNTRIES[code]).filter(Boolean);
};

/**
 * Get countries by business region
 */
export const getCountriesByBusinessRegion = (regionId) => {
  const region = BUSINESS_REGIONS[regionId];
  if (!region) return [];
  return region.countries.map(code => COUNTRIES[code]).filter(Boolean);
};

/**
 * Get city by name
 */
export const getCity = (name) => CITIES[name];

/**
 * Get cities by country
 */
export const getCitiesByCountry = (countryCode) => {
  return Object.entries(CITIES)
    .filter(([_, city]) => city.country === countryCode)
    .map(([name, coords]) => ({ name, ...coords }));
};

/**
 * Convert lat/lon to 3D coordinates on unit sphere
 */
export const latLonTo3D = (lat, lon, radius = 1) => {
  const phi = (lat * Math.PI) / 180;
  const theta = (lon * Math.PI) / 180;
  
  return {
    x: radius * Math.cos(phi) * Math.cos(theta),
    y: radius * Math.sin(phi),
    z: radius * Math.cos(phi) * Math.sin(theta),
  };
};

/**
 * Convert 3D coordinates back to lat/lon
 */
export const coordsTo3D = (x, y, z) => {
  const lon = Math.atan2(z, x);
  const hyp = Math.sqrt(x * x + z * z);
  const lat = Math.atan2(y, hyp);
  
  return {
    lat: (lat * 180) / Math.PI,
    lon: (lon * 180) / Math.PI,
  };
};

/**
 * Calculate great-circle distance between two points (in km)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * 
    Math.cos((lat2 * Math.PI) / 180) * 
    Math.sin(dLon / 2) * 
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default {
  CONTINENTS,
  BUSINESS_REGIONS,
  COUNTRIES,
  CITIES,
  getContinent,
  getAllContinents,
  getBusinessRegion,
  getAllBusinessRegions,
  getCountry,
  getAllCountries,
  getCountriesByContinent,
  getCountriesByBusinessRegion,
  getCity,
  getCitiesByCountry,
  latLonTo3D,
  coordsTo3D,
  calculateDistance,
};
