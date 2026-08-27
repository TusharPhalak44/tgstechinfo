import worldTopology from '../ui/world-110m.json';

// ISO 3166-1 Numeric Code -> ISO2, ISO3, Name, Region Map
const NUMERIC_TO_ISO = {
  '356': { iso2: 'IN', iso3: 'IND', name: 'India', region: 'APAC' },
  '840': { iso2: 'US', iso3: 'USA', name: 'United States', region: 'AMER' },
  '826': { iso2: 'GB', iso3: 'GBR', name: 'United Kingdom', region: 'EMEA' },
  '276': { iso2: 'DE', iso3: 'DEU', name: 'Germany', region: 'EMEA' },
  '250': { iso2: 'FR', iso3: 'FRA', name: 'France', region: 'EMEA' },
  '156': { iso2: 'CN', iso3: 'CHN', name: 'China', region: 'APAC' },
  '392': { iso2: 'JP', iso3: 'JPN', name: 'Japan', region: 'APAC' },
  '036': { iso2: 'AU', iso3: 'AUS', name: 'Australia', region: 'APAC' },
  '076': { iso2: 'BR', iso3: 'BRA', name: 'Brazil', region: 'AMER' },
  '124': { iso2: 'CA', iso3: 'CAN', name: 'Canada', region: 'AMER' },
  '484': { iso2: 'MX', iso3: 'MEX', name: 'Mexico', region: 'AMER' },
  '380': { iso2: 'IT', iso3: 'ITA', name: 'Italy', region: 'EMEA' },
  '724': { iso2: 'ES', iso3: 'ESP', name: 'Spain', region: 'EMEA' },
  '528': { iso2: 'NL', iso3: 'NLD', name: 'Netherlands', region: 'EMEA' },
  '756': { iso2: 'CH', iso3: 'CHE', name: 'Switzerland', region: 'EMEA' },
  '752': { iso2: 'SE', iso3: 'SWE', name: 'Sweden', region: 'EMEA' },
  '372': { iso2: 'IE', iso3: 'IRL', name: 'Ireland', region: 'EMEA' },
  '616': { iso2: 'PL', iso3: 'POL', name: 'Poland', region: 'EMEA' },
  '710': { iso2: 'ZA', iso3: 'ZAF', name: 'South Africa', region: 'EMEA' },
  '784': { iso2: 'AE', iso3: 'ARE', name: 'United Arab Emirates', region: 'EMEA' },
  '682': { iso2: 'SA', iso3: 'SAU', name: 'Saudi Arabia', region: 'EMEA' },
  '702': { iso2: 'SG', iso3: 'SGP', name: 'Singapore', region: 'APAC' },
  '360': { iso2: 'ID', iso3: 'IDN', name: 'Indonesia', region: 'APAC' },
  '410': { iso2: 'KR', iso3: 'KOR', name: 'South Korea', region: 'APAC' },
  '764': { iso2: 'TH', iso3: 'THA', name: 'Thailand', region: 'APAC' },
  '458': { iso2: 'MY', iso3: 'MYS', name: 'Malaysia', region: 'APAC' },
  '704': { iso2: 'VN', iso3: 'VNM', name: 'Vietnam', region: 'APAC' },
  '608': { iso2: 'PH', iso3: 'PHL', name: 'Philippines', region: 'APAC' },
  '554': { iso2: 'NZ', iso3: 'NZL', name: 'New Zealand', region: 'APAC' },
  '032': { iso2: 'AR', iso3: 'ARG', name: 'Argentina', region: 'AMER' },
  '152': { iso2: 'CL', iso3: 'CHL', name: 'Chile', region: 'AMER' },
  '170': { iso2: 'CO', iso3: 'COL', name: 'Colombia', region: 'AMER' },
  '604': { iso2: 'PE', iso3: 'PER', name: 'Peru', region: 'AMER' },
  '818': { iso2: 'EG', iso3: 'EGY', name: 'Egypt', region: 'EMEA' },
  '566': { iso2: 'NG', iso3: 'NGA', name: 'Nigeria', region: 'EMEA' },
  '404': { iso2: 'KE', iso3: 'KEN', name: 'Kenya', region: 'EMEA' },
  '792': { iso2: 'TR', iso3: 'TUR', name: 'Turkey', region: 'EMEA' },
  '376': { iso2: 'IL', iso3: 'ISR', name: 'Israel', region: 'EMEA' },
  '643': { iso2: 'RU', iso3: 'RUS', name: 'Russia', region: 'EMEA' }
};

// Region Definitions
export const REGION_COUNTRIES = {
  AMER: ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'UY', 'PY', 'BO', 'EC', 'VE', 'GT', 'CR', 'PA'],
  EMEA: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'CH', 'SE', 'NO', 'FI', 'DK', 'BE', 'AT', 'IE', 'PL', 'CZ', 'RO', 'GR', 'PT', 'HU', 'UA', 'TR', 'IL', 'SA', 'AE', 'QA', 'KW', 'ZA', 'EG', 'NG', 'KE', 'MA', 'DZ', 'GH', 'RU'],
  APAC: ['IN', 'CN', 'JP', 'KR', 'SG', 'ID', 'TH', 'MY', 'VN', 'PH', 'AU', 'NZ', 'TW', 'HK', 'BD', 'PK', 'LK']
};

/**
 * Decodes TopoJSON arcs
 */
function decodeArcs(topology) {
  const { transform, arcs } = topology;
  const scale = transform?.scale || [0.0036000360003600037, 0.0016925586033320105];
  const translate = transform?.translate || [-180, -85.60903777459771];

  return arcs.map(arc => {
    let x = 0;
    let y = 0;
    return arc.map(point => {
      x += point[0];
      y += point[1];
      const lon = x * scale[0] + translate[0];
      const lat = y * scale[1] + translate[1];
      return [lat, lon]; // [lat, lon]
    });
  });
}

/**
 * Subdivides a line segment into smaller steps so it curves smoothly along the sphere
 */
function subdividePoints(pts, maxDistance = 4) {
  const result = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    result.push(p1);

    const dLat = p2[0] - p1[0];
    const dLon = p2[1] - p1[1];
    const dist = Math.hypot(dLat, dLon);

    if (dist > maxDistance) {
      const steps = Math.ceil(dist / maxDistance);
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        result.push([p1[0] + dLat * t, p1[1] + dLon * t]);
      }
    }
  }
  if (pts.length > 0) {
    result.push(pts[pts.length - 1]);
  }
  return result;
}

// In-memory cache for processed country features
let cachedCountryFeatures = null;

/**
 * Loads and returns all decoded country features with GeoJSON polygons
 */
export function getDecodedCountries() {
  if (cachedCountryFeatures) {
    return cachedCountryFeatures;
  }

  const decodedArcs = decodeArcs(worldTopology);
  const geometries = worldTopology.objects?.countries?.geometries || [];
  const features = [];

  geometries.forEach(geom => {
    const numericId = String(geom.id || '');
    const rawName = geom.properties?.name || 'Unknown';
    const mapping = NUMERIC_TO_ISO[numericId] || {};

    const iso2 = mapping.iso2 || rawName.slice(0, 2).toUpperCase();
    const iso3 = mapping.iso3 || rawName.slice(0, 3).toUpperCase();
    const name = mapping.name || rawName;
    const region = mapping.region || (
      REGION_COUNTRIES.AMER.includes(iso2) ? 'AMER' :
      REGION_COUNTRIES.EMEA.includes(iso2) ? 'EMEA' :
      REGION_COUNTRIES.APAC.includes(iso2) ? 'APAC' : 'GLOBAL'
    );

    const polygons = geom.type === 'MultiPolygon' ? geom.arcs : [geom.arcs];
    const polygonRings = [];
    let sumLat = 0;
    let sumLon = 0;
    let pointCount = 0;

    polygons.forEach(polygon => {
      polygon.forEach(ring => {
        const ringPoints = [];
        ring.forEach(arcIndex => {
          const isReversed = arcIndex < 0;
          const actualIndex = isReversed ? ~arcIndex : arcIndex;
          const arc = decodedArcs[actualIndex];
          if (!arc) return;

          const pts = isReversed ? [...arc].reverse() : arc;
          pts.forEach(([lat, lon]) => {
            ringPoints.push([lat, lon]);
            sumLat += lat;
            sumLon += lon;
            pointCount++;
          });
        });

        if (ringPoints.length > 2) {
          const smoothRing = subdividePoints(ringPoints, 5);
          polygonRings.push(smoothRing);
        }
      });
    });

    const centroid = pointCount > 0
      ? { lat: sumLat / pointCount, lon: sumLon / pointCount }
      : { lat: 0, lon: 0 };

    features.push({
      id: numericId,
      iso2,
      iso3,
      name,
      region,
      centroid,
      rings: polygonRings
    });
  });

  cachedCountryFeatures = features;
  return features;
}
