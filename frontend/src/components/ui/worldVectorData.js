/**
 * High-definition World Vector Geographic Map Paths & Hub Coordinates
 * Accurately projected (Miller / Equirectangular 1000 x 500)
 */

export const CONTINENT_LABELS = [
  { name: 'NORTH AMERICA', x: 230, y: 155, code: 'NA' },
  { name: 'SOUTH AMERICA', x: 340, y: 360, code: 'LATAM' },
  { name: 'EUROPE', x: 520, y: 110, code: 'EU' },
  { name: 'AFRICA', x: 525, y: 270, code: 'AF' },
  { name: 'ASIA', x: 740, y: 140, code: 'ASIA' },
  { name: 'OCEANIA', x: 865, y: 395, code: 'OC' }
];

export const REGIONAL_DATA = [
  {
    id: 'NORTH_AMERICA',
    name: 'North America',
    code: 'NA',
    contacts: '26.5M+',
    companies: '1.45M+',
    countriesCount: '2 Countries',
    color: '#7C3AED',
    countries: [
      { name: 'United States', code: 'US', contacts: '23.50M+', share: '88.7%' },
      { name: 'Canada', code: 'CA', contacts: '3.00M+', share: '11.3%' }
    ]
  },
  {
    id: 'LATAM',
    name: 'Latin America (LATAM)',
    code: 'LATAM',
    contacts: '8.40M+',
    companies: '480K+',
    countriesCount: '10+ Countries',
    color: '#cd9c0aff',
    countries: [
      { name: 'Brazil', code: 'BR', contacts: '3.10M+', share: '36.9%' },
      { name: 'Mexico', code: 'MX', contacts: '2.45M+', share: '29.2%' },
      { name: 'Colombia', code: 'CO', contacts: '920K+', share: '10.9%' },
      { name: 'Peru', code: 'PE', contacts: '580K+', share: '6.9%' },
      { name: 'Chile', code: 'CL', contacts: '470K+', share: '5.6%' },
      { name: 'Argentina', code: 'AR', contacts: '410K+', share: '4.9%' }
    ]
  },
  {
    id: 'EMEA',
    name: 'Europe & Middle East (EMEA)',
    code: 'EMEA',
    contacts: '23.2M+',
    companies: '1.28M+',
    countriesCount: '35+ Countries',
    color: '#7C3AED',
    countries: [
      { name: 'United Kingdom', code: 'GB', contacts: '5.40M+', share: '23.3%' },
      { name: 'Germany', code: 'DE', contacts: '4.60M+', share: '19.8%' },
      { name: 'France', code: 'FR', contacts: '3.30M+', share: '14.2%' },
      { name: 'Netherlands', code: 'NL', contacts: '1.80M+', share: '7.8%' },
      { name: 'Italy', code: 'IT', contacts: '1.50M+', share: '6.5%' },
      { name: 'Spain', code: 'ES', contacts: '1.40M+', share: '6.0%' },
      { name: 'UAE', code: 'AE', contacts: '850K+', share: '3.7%' },
      { name: 'Saudi Arabia', code: 'SA', contacts: '680K+', share: '2.9%' }
    ]
  },
  {
    id: 'APAC',
    name: 'Asia-Pacific (APAC)',
    code: 'APAC',
    contacts: '19.9M+',
    companies: '1.12M+',
    countriesCount: '15+ Countries',
    color: '#7C3AED',
    countries: [
      { name: 'India', code: 'IN', contacts: '9.80M+', share: '49.2%' },
      { name: 'Australia', code: 'AU', contacts: '2.90M+', share: '14.6%' },
      { name: 'Japan', code: 'JP', contacts: '2.20M+', share: '11.1%' },
      { name: 'Singapore', code: 'SG', contacts: '1.45M+', share: '7.3%' },
      { name: 'South Korea', code: 'KR', contacts: '1.10M+', share: '5.5%' },
      { name: 'Indonesia', code: 'ID', contacts: '850K+', share: '4.3%' }
    ]
  }
];

// Clustered Hub Beacons (Global View)
export const MAP_HUBS = [
  { id: 'hub-us-e', name: 'North America (East)', countBadge: '7+', x: 270, y: 145, region: 'NA' },
  { id: 'hub-us-w', name: 'North America (West)', countBadge: '5+', x: 195, y: 150, region: 'NA' },
  { id: 'hub-latam-n', name: 'Central America', countBadge: '3+', x: 225, y: 220, region: 'LATAM' },
  { id: 'hub-latam-s', name: 'South America', countBadge: '5+', x: 375, y: 360, region: 'LATAM' },
  { id: 'hub-latam-c', name: 'Andean Region', countBadge: '3+', x: 295, y: 280, region: 'LATAM' },
  { id: 'hub-latam-p', name: 'Southern Cone', countBadge: '2+', x: 330, y: 430, region: 'LATAM' },
  { id: 'hub-uk', name: 'Western Europe', countBadge: '5+', x: 475, y: 105, region: 'EMEA' },
  { id: 'hub-de', name: 'Central Europe', countBadge: '7+', x: 515, y: 110, region: 'EMEA' },
  { id: 'hub-fr', name: 'Western Europe', countBadge: '4+', x: 490, y: 130, region: 'EMEA' },
  { id: 'hub-med', name: 'Southern Europe & Cyprus', countBadge: '5+', x: 545, y: 155, region: 'EMEA' },
  { id: 'hub-mena', name: 'Middle East', countBadge: '7+', x: 625, y: 205, region: 'EMEA' },
  { id: 'hub-za', name: 'Southern Africa', countBadge: '2+', x: 545, y: 400, region: 'EMEA' },
  { id: 'hub-in', name: 'South Asia (India)', countBadge: '8+', x: 705, y: 220, region: 'APAC' },
  { id: 'hub-sea', name: 'Southeast Asia', countBadge: '6+', x: 775, y: 285, region: 'APAC' },
  { id: 'hub-ea', name: 'East Asia (Japan & Korea)', countBadge: '5+', x: 865, y: 160, region: 'APAC' },
  { id: 'hub-oc', name: 'Oceania & NZ', countBadge: '4+', x: 855, y: 395, region: 'APAC' },
];

// Individual Country Dots (Active when Zoomed In or on hover)
export const COUNTRY_DOTS = [
  // Europe & Mediterranean (Matching Screenshot 2: Cyprus, Germany, etc.)
  { id: 'cy', name: 'Cyprus', regionName: 'EUROPE • SOUTHERN EUROPE', count: '5.2M', rawCount: 5200000, x: 560, y: 168, region: 'EMEA' },
  { id: 'gb', name: 'United Kingdom', regionName: 'EUROPE • NORTHERN EUROPE', count: '5.4M', rawCount: 5400000, x: 475, y: 105, region: 'EMEA' },
  { id: 'de', name: 'Germany', regionName: 'EUROPE • WESTERN EUROPE', count: '4.6M', rawCount: 4600000, x: 515, y: 110, region: 'EMEA' },
  { id: 'fr', name: 'France', regionName: 'EUROPE • WESTERN EUROPE', count: '3.3M', rawCount: 3300000, x: 490, y: 130, region: 'EMEA' },
  { id: 'nl', name: 'Netherlands', regionName: 'EUROPE • WESTERN EUROPE', count: '1.8M', rawCount: 1800000, x: 498, y: 112, region: 'EMEA' },
  { id: 'it', name: 'Italy', regionName: 'EUROPE • SOUTHERN EUROPE', count: '1.5M', rawCount: 1500000, x: 515, y: 155, region: 'EMEA' },
  { id: 'es', name: 'Spain', regionName: 'EUROPE • SOUTHERN EUROPE', count: '1.4M', rawCount: 1400000, x: 475, y: 160, region: 'EMEA' },
  { id: 'se', name: 'Sweden', regionName: 'EUROPE • NORDICS', count: '920K', rawCount: 920000, x: 525, y: 65, region: 'EMEA' },
  { id: 'ae', name: 'United Arab Emirates', regionName: 'MIDDLE EAST • GCC', count: '850K', rawCount: 850000, x: 625, y: 205, region: 'EMEA' },
  { id: 'sa', name: 'Saudi Arabia', regionName: 'MIDDLE EAST • GCC', count: '680K', rawCount: 680000, x: 605, y: 215, region: 'EMEA' },
  { id: 'za', name: 'South Africa', regionName: 'AFRICA • SOUTHERN AFRICA', count: '550K', rawCount: 550000, x: 545, y: 400, region: 'EMEA' },

  // North America
  { id: 'us', name: 'United States', regionName: 'NORTH AMERICA • USA', count: '23.5M', rawCount: 23500000, x: 240, y: 150, region: 'NA' },
  { id: 'ca', name: 'Canada', regionName: 'NORTH AMERICA • CANADA', count: '3.0M', rawCount: 3000000, x: 235, y: 95, region: 'NA' },
  { id: 'mx', name: 'Mexico', regionName: 'NORTH AMERICA • LATIN AMERICA', count: '2.45M', rawCount: 2450000, x: 225, y: 220, region: 'LATAM' },

  // South America / LATAM
  { id: 'br', name: 'Brazil', regionName: 'LATIN AMERICA • SOUTH AMERICA', count: '3.1M', rawCount: 3100000, x: 375, y: 360, region: 'LATAM' },
  { id: 'co', name: 'Colombia', regionName: 'LATIN AMERICA • ANDEAN', count: '920K', rawCount: 920000, x: 295, y: 280, region: 'LATAM' },
  { id: 'pe', name: 'Peru', regionName: 'LATIN AMERICA • ANDEAN', count: '580K', rawCount: 580000, x: 285, y: 330, region: 'LATAM' },
  { id: 'cl', name: 'Chile', regionName: 'LATIN AMERICA • SOUTHERN CONE', count: '470K', rawCount: 470000, x: 315, y: 420, region: 'LATAM' },
  { id: 'ar', name: 'Argentina', regionName: 'LATIN AMERICA • SOUTHERN CONE', count: '410K', rawCount: 410000, x: 340, y: 435, region: 'LATAM' },

  // Asia-Pacific & Oceania
  { id: 'in', name: 'India', regionName: 'ASIA • SOUTH ASIA', count: '9.8M', rawCount: 9800000, x: 705, y: 220, region: 'APAC' },
  { id: 'au', name: 'Australia', regionName: 'OCEANIA • AUSTRALASIA', count: '2.9M', rawCount: 2900000, x: 855, y: 395, region: 'APAC' },
  { id: 'jp', name: 'Japan', regionName: 'ASIA • EAST ASIA', count: '2.2M', rawCount: 2200000, x: 880, y: 160, region: 'APAC' },
  { id: 'sg', name: 'Singapore', regionName: 'ASIA • SOUTHEAST ASIA', count: '1.45M', rawCount: 1450000, x: 775, y: 285, region: 'APAC' },
  { id: 'kr', name: 'South Korea', regionName: 'ASIA • EAST ASIA', count: '1.1M', rawCount: 1100000, x: 855, y: 165, region: 'APAC' },
  { id: 'id', name: 'Indonesia', regionName: 'ASIA • SOUTHEAST ASIA', count: '850K', rawCount: 850000, x: 805, y: 315, region: 'APAC' },
  { id: 'my', name: 'Malaysia', regionName: 'ASIA • SOUTHEAST ASIA', count: '620K', rawCount: 620000, x: 770, y: 275, region: 'APAC' },
  { id: 'ph', name: 'Philippines', regionName: 'ASIA • SOUTHEAST ASIA', count: '510K', rawCount: 510000, x: 830, y: 245, region: 'APAC' },
  { id: 'nz', name: 'New Zealand', regionName: 'OCEANIA • AUSTRALASIA', count: '320K', rawCount: 320000, x: 935, y: 425, region: 'APAC' },
];

// Network Flight Curves
export const MAP_CONNECTION_ARCS = [
  { from: [270, 145], to: [475, 105], curve: -40 },
  { from: [475, 105], to: [515, 110], curve: -15 },
  { from: [515, 110], to: [545, 155], curve: -15 },
  { from: [545, 155], to: [625, 205], curve: -25 },
  { from: [625, 205], to: [705, 220], curve: -25 },
  { from: [705, 220], to: [775, 285], curve: -25 },
  { from: [775, 285], to: [855, 395], curve: -30 },
  { from: [270, 145], to: [375, 360], curve: 35 },
  { from: [475, 105], to: [705, 220], curve: -50 },
  { from: [195, 150], to: [880, 160], curve: -60 },
];

// Single-Tone World Coastline Geometry
export const DETAILED_WORLD_PATHS = [
  "M 90,65 C 105,52 135,42 165,38 C 195,35 240,32 275,38 C 300,42 330,55 350,75 C 365,90 355,108 340,118 C 325,128 300,135 295,155 C 290,175 305,190 285,208 C 265,225 235,220 215,225 C 195,215 180,195 155,165 C 130,135 110,120 95,95 Z",
  "M 335,28 C 355,18 385,15 405,25 C 420,40 415,62 395,72 C 375,80 345,75 335,55 Z",
  "M 215,225 C 235,218 260,240 275,260 C 285,275 270,285 250,282 C 235,270 215,250 215,225 Z",
  "M 290,245 A 4,3 0 1,0 298,245 A 4,3 0 1,0 290,245 M 310,255 A 5,3 0 1,0 320,255 A 5,3 0 1,0 310,255",
  "M 255,278 C 280,265 315,268 345,280 C 375,292 410,315 428,345 C 440,370 430,398 410,425 C 390,450 365,475 345,492 C 330,480 320,445 312,410 C 305,375 290,340 272,315 C 260,298 250,288 255,278 Z",
  "M 458,68 C 475,55 510,48 538,55 C 565,62 585,85 580,115 C 575,135 555,150 530,158 C 505,165 478,155 460,138 C 445,120 445,90 458,68 Z",
  "M 452,88 C 462,78 478,75 482,90 C 485,105 475,120 460,118 C 448,115 445,98 452,88 Z M 442,95 A 4,6 0 1,0 448,105 A 4,6 0 1,0 442,95",
  "M 495,35 C 515,25 545,22 562,35 C 572,50 568,75 550,85 C 535,92 512,85 500,65 Z",
  "M 480,140 C 495,138 520,140 528,155 C 532,170 522,185 510,188 C 498,185 488,168 480,140 Z",
  "M 465,168 C 495,158 545,155 585,185 C 615,215 625,260 610,310 C 598,355 575,410 545,438 C 525,418 505,370 485,325 C 465,275 450,225 455,190 C 458,175 460,170 465,168 Z",
  "M 622,345 C 630,335 638,340 635,365 C 630,385 620,390 618,375 Z",
  "M 585,158 C 610,152 645,165 658,195 C 665,220 645,245 620,248 C 595,245 580,215 585,158 Z",
  "M 585,65 C 640,48 720,40 810,48 C 880,55 935,85 940,135 C 942,170 920,210 880,235 C 840,258 790,265 745,262 C 700,258 660,230 630,195 C 605,165 590,120 585,65 Z",
  "M 680,185 C 705,180 738,182 748,205 C 755,230 740,265 722,282 C 705,295 688,270 678,240 C 672,215 675,190 680,185 Z",
  "M 728,295 A 3,4 0 1,0 734,295 A 3,4 0 1,0 728,295",
  "M 750,225 C 770,218 795,230 805,255 C 810,275 795,295 778,298 C 765,292 755,265 750,225 Z",
  "M 770,305 C 795,295 830,300 850,312 C 845,325 815,330 780,325 Z M 830,245 C 842,235 850,250 845,270 C 838,280 828,265 830,245 Z",
  "M 880,140 C 895,130 915,135 918,155 C 915,175 898,195 885,188 C 875,178 872,155 880,140 Z",
  "M 805,338 C 835,325 885,322 918,340 C 935,365 930,400 910,428 C 885,445 845,448 815,425 C 795,400 790,365 805,338 Z M 868,450 A 5,4 0 1,0 878,450 A 5,4 0 1,0 868,450",
  "M 932,410 C 942,400 952,412 948,430 C 940,442 930,435 932,410 Z M 925,438 C 932,430 940,440 935,455 C 928,460 920,452 925,438 Z"
];
