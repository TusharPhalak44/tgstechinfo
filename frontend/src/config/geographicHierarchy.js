/**
 * Geographic Hierarchy & Regional Taxonomies for 3D Analytics Globe
 * Hierarchy: WORLD -> REGION (AMER, EMEA, APAC) -> COUNTRY -> CITY
 */

export const BUSINESS_REGIONS = {
  AMER: {
    id: 'AMER',
    name: 'Americas',
    code: 'AMER',
    label: 'Americas (AMER)',
    center: { lat: 28.5, lon: -85.0 },
    color: '#0AAEEF',
    glowColor: 'rgba(10, 174, 239, 0.45)',
    countries: ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE'],
    description: 'North America, Latin America & Caribbean markets'
  },
  EMEA: {
    id: 'EMEA',
    name: 'Europe, Middle East & Africa',
    code: 'EMEA',
    label: 'Europe, Middle East & Africa (EMEA)',
    center: { lat: 38.0, lon: 20.0 },
    color: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'CH', 'IE', 'PL', 'ZA', 'EG', 'NG', 'SA', 'AE', 'IL', 'TR'],
    description: 'European Single Market, Gulf States & African tech hubs'
  },
  APAC: {
    id: 'APAC',
    name: 'Asia-Pacific',
    code: 'APAC',
    label: 'Asia-Pacific (APAC)',
    center: { lat: 20.0, lon: 105.0 },
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    countries: ['IN', 'CN', 'JP', 'KR', 'SG', 'ID', 'TH', 'MY', 'VN', 'PH', 'AU', 'NZ'],
    description: 'East Asia, South Asia, ASEAN & ANZ enterprise corridors'
  }
};

export const COUNTRY_REGISTRY = {
  // ── AMER ──
  US: {
    name: 'United States',
    iso2: 'US',
    iso3: 'USA',
    region: 'AMER',
    flag: '🇺🇸',
    center: { lat: 37.0902, lon: -95.7129 },
    cities: [
      { name: 'New York', state: 'NY', lat: 40.7128, lon: -74.0060 },
      { name: 'San Francisco', state: 'CA', lat: 37.7749, lon: -122.4194 },
      { name: 'Chicago', state: 'IL', lat: 41.8781, lon: -87.6298 },
      { name: 'Austin', state: 'TX', lat: 30.2672, lon: -97.7431 },
      { name: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321 }
    ]
  },
  CA: {
    name: 'Canada',
    iso2: 'CA',
    iso3: 'CAN',
    region: 'AMER',
    flag: '🇨🇦',
    center: { lat: 56.1304, lon: -106.3468 },
    cities: [
      { name: 'Toronto', state: 'ON', lat: 43.6532, lon: -79.3832 },
      { name: 'Vancouver', state: 'BC', lat: 49.2827, lon: -123.1207 },
      { name: 'Montreal', state: 'QC', lat: 45.5017, lon: -73.5673 }
    ]
  },
  MX: {
    name: 'Mexico',
    iso2: 'MX',
    iso3: 'MEX',
    region: 'AMER',
    flag: '🇲🇽',
    center: { lat: 23.6345, lon: -102.5528 },
    cities: [
      { name: 'Mexico City', state: 'CDMX', lat: 19.4326, lon: -99.1332 },
      { name: 'Guadalajara', state: 'JAL', lat: 20.6597, lon: -103.3496 },
      { name: 'Monterrey', state: 'NL', lat: 25.6866, lon: -100.3161 }
    ]
  },
  BR: {
    name: 'Brazil',
    iso2: 'BR',
    iso3: 'BRA',
    region: 'AMER',
    flag: '🇧🇷',
    center: { lat: -14.2350, lon: -51.9253 },
    cities: [
      { name: 'São Paulo', state: 'SP', lat: -23.5505, lon: -46.6333 },
      { name: 'Rio de Janeiro', state: 'RJ', lat: -22.9068, lon: -43.1729 }
    ]
  },

  // ── EMEA ──
  GB: {
    name: 'United Kingdom',
    iso2: 'GB',
    iso3: 'GBR',
    region: 'EMEA',
    flag: '🇬🇧',
    center: { lat: 55.3781, lon: -3.4360 },
    cities: [
      { name: 'London', state: 'ENG', lat: 51.5074, lon: -0.1278 },
      { name: 'Manchester', state: 'ENG', lat: 53.4808, lon: -2.2426 },
      { name: 'Edinburgh', state: 'SCT', lat: 55.9533, lon: -3.1883 }
    ]
  },
  DE: {
    name: 'Germany',
    iso2: 'DE',
    iso3: 'DEU',
    region: 'EMEA',
    flag: '🇩🇪',
    center: { lat: 51.1657, lon: 10.4515 },
    cities: [
      { name: 'Frankfurt', state: 'HE', lat: 50.1109, lon: 8.6821 },
      { name: 'Berlin', state: 'BE', lat: 52.5200, lon: 13.4050 },
      { name: 'Munich', state: 'BY', lat: 48.1351, lon: 11.5820 }
    ]
  },
  FR: {
    name: 'France',
    iso2: 'FR',
    iso3: 'FRA',
    region: 'EMEA',
    flag: '🇫🇷',
    center: { lat: 46.2276, lon: 2.2137 },
    cities: [
      { name: 'Paris', state: 'IDF', lat: 48.8566, lon: 2.3522 },
      { name: 'Lyon', state: 'ARA', lat: 45.7640, lon: 4.8357 }
    ]
  },
  NL: {
    name: 'Netherlands',
    iso2: 'NL',
    iso3: 'NLD',
    region: 'EMEA',
    flag: '🇳🇱',
    center: { lat: 52.1326, lon: 5.2913 },
    cities: [
      { name: 'Amsterdam', state: 'NH', lat: 52.3676, lon: 4.9041 },
      { name: 'Rotterdam', state: 'ZH', lat: 51.9244, lon: 4.4777 }
    ]
  },
  AE: {
    name: 'United Arab Emirates',
    iso2: 'AE',
    iso3: 'ARE',
    region: 'EMEA',
    flag: '🇦🇪',
    center: { lat: 23.4241, lon: 53.8478 },
    cities: [
      { name: 'Dubai', state: 'DXB', lat: 25.2048, lon: 55.2708 },
      { name: 'Abu Dhabi', state: 'AUH', lat: 24.4539, lon: 54.3773 }
    ]
  },
  ZA: {
    name: 'South Africa',
    iso2: 'ZA',
    iso3: 'ZAF',
    region: 'EMEA',
    flag: '🇿🇦',
    center: { lat: -30.5595, lon: 22.9375 },
    cities: [
      { name: 'Johannesburg', state: 'GP', lat: -26.2041, lon: 28.0473 },
      { name: 'Cape Town', state: 'WC', lat: -33.9249, lon: 18.4241 }
    ]
  },

  // ── APAC ──
  IN: {
    name: 'India',
    iso2: 'IN',
    iso3: 'IND',
    region: 'APAC',
    flag: '🇮🇳',
    center: { lat: 20.5937, lon: 78.9629 },
    cities: [
      { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
      { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
      { name: 'Delhi', state: 'Delhi NCR', lat: 28.7041, lon: 77.1025 },
      { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867 },
      { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
      { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 }
    ]
  },
  SG: {
    name: 'Singapore',
    iso2: 'SG',
    iso3: 'SGP',
    region: 'APAC',
    flag: '🇸🇬',
    center: { lat: 1.3521, lon: 103.8198 },
    cities: [
      { name: 'Singapore', state: 'Central', lat: 1.3521, lon: 103.8198 }
    ]
  },
  JP: {
    name: 'Japan',
    iso2: 'JP',
    iso3: 'JPN',
    region: 'APAC',
    flag: '🇯🇵',
    center: { lat: 36.2048, lon: 138.2529 },
    cities: [
      { name: 'Tokyo', state: 'Kanto', lat: 35.6762, lon: 139.6503 },
      { name: 'Osaka', state: 'Kansai', lat: 34.6937, lon: 135.5023 }
    ]
  },
  AU: {
    name: 'Australia',
    iso2: 'AU',
    iso3: 'AUS',
    region: 'APAC',
    flag: '🇦🇺',
    center: { lat: -25.2744, lon: 133.7751 },
    cities: [
      { name: 'Sydney', state: 'NSW', lat: -33.8688, lon: 151.2093 },
      { name: 'Melbourne', state: 'VIC', lat: -37.8136, lon: 144.9631 },
      { name: 'Brisbane', state: 'QLD', lat: -27.4698, lon: 153.0251 }
    ]
  }
};

/**
 * Normalizes country strings and finds matching entry in COUNTRY_REGISTRY
 */
export function getCountryInfo(identifier) {
  if (!identifier) return null;
  const clean = identifier.trim().toUpperCase();

  // Try direct ISO-2 match
  if (COUNTRY_REGISTRY[clean]) return COUNTRY_REGISTRY[clean];

  // Try ISO-3 or full name search
  for (const info of Object.values(COUNTRY_REGISTRY)) {
    if (
      info.iso3.toUpperCase() === clean ||
      info.name.toUpperCase() === clean ||
      clean.includes(info.name.toUpperCase())
    ) {
      return info;
    }
  }

  return {
    name: identifier,
    iso2: clean.slice(0, 2),
    iso3: clean.slice(0, 3),
    region: 'GLOBAL',
    flag: '🌐',
    center: { lat: 20.0, lon: 0.0 },
    cities: []
  };
}

/**
 * Format numbers with K/M/B suffixes
 */
export function formatMetric(num, prefix = '', suffix = '') {
  if (num === undefined || num === null) return `${prefix}0${suffix}`;
  const n = Number(num);
  if (isNaN(n)) return `${prefix}0${suffix}`;

  if (n >= 1_000_000_000) {
    return `${prefix}${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B${suffix}`;
  }
  if (n >= 1_000_000) {
    return `${prefix}${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M${suffix}`;
  }
  if (n >= 1_000) {
    return `${prefix}${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K${suffix}`;
  }
  return `${prefix}${n.toLocaleString()}${suffix}`;
}
