import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup
} from 'react-simple-maps';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Minus,
  Compass,
  Locate,
  Maximize,
  Minimize,
  X,
  Globe,
  Sparkles
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import worldGeoJson from './world-110m.json';
import { REGIONAL_DATA } from './worldVectorData';

const MapContext = createContext({
  zoom: 1,
  activeRegion: 'GLOBAL',
  setActiveRegion: () => {},
  handleZoomIn: () => {},
  handleZoomOut: () => {},
  handleLocate: () => {},
  containerRef: null
});

export const useMap = () => useContext(MapContext);
export { REGIONAL_DATA };

// Continent Labels for Global View (Matching demandifymedia.com)
const CONTINENT_LABELS = [
  { name: 'NORTH AMERICA', coordinates: [-100, 48] },
  { name: 'SOUTH AMERICA', coordinates: [-58, -20] },
  { name: 'EUROPE',        coordinates: [15, 54] },
  { name: 'AFRICA',        coordinates: [20, 5] },
  { name: 'ASIA',          coordinates: [90, 42] },
  { name: 'OCEANIA',       coordinates: [135, -28] }
];

// Clustered Hub Beacons (Global View)
const MAP_CLUSTERS = [
  { id: 'hub-us-e', name: 'North America (East)', countBadge: '7+', coordinates: [-78, 38], region: 'NA' },
  { id: 'hub-us-w', name: 'North America (West)', countBadge: '5+', coordinates: [-118, 36], region: 'NA' },
  { id: 'hub-latam-n', name: 'Central America', countBadge: '3+', coordinates: [-99, 19], region: 'LATAM' },
  { id: 'hub-latam-s', name: 'South America', countBadge: '5+', coordinates: [-47, -15], region: 'LATAM' },
  { id: 'hub-latam-c', name: 'Andean Region', countBadge: '3+', coordinates: [-74, 4], region: 'LATAM' },
  { id: 'hub-latam-p', name: 'Southern Cone', countBadge: '2+', coordinates: [-64, -34], region: 'LATAM' },
  { id: 'hub-uk', name: 'Western Europe', countBadge: '5+', coordinates: [-2, 54], region: 'EMEA' },
  { id: 'hub-de', name: 'Central Europe', countBadge: '7+', coordinates: [10, 51], region: 'EMEA' },
  { id: 'hub-fr', name: 'Western Europe', countBadge: '4+', coordinates: [2, 47], region: 'EMEA' },
  { id: 'hub-med', name: 'Southern Europe & Cyprus', countBadge: '5+', coordinates: [28, 38], region: 'EMEA' },
  { id: 'hub-mena', name: 'Middle East', countBadge: '7+', coordinates: [48, 26], region: 'EMEA' },
  { id: 'hub-za', name: 'Southern Africa', countBadge: '2+', coordinates: [25, -29], region: 'EMEA' },
  { id: 'hub-in', name: 'South Asia (India)', countBadge: '8+', coordinates: [78, 22], region: 'APAC' },
  { id: 'hub-sea', name: 'Southeast Asia', countBadge: '6+', coordinates: [105, 12], region: 'APAC' },
  { id: 'hub-ea', name: 'East Asia (Japan & Korea)', countBadge: '5+', coordinates: [135, 36], region: 'APAC' },
  { id: 'hub-oc', name: 'Oceania & NZ', countBadge: '4+', coordinates: [134, -25], region: 'APAC' },
];

// Individual Country Marker Dots with collision-free placement offsets
const COUNTRY_MARKERS = [
  // North America
  { id: 'us', name: 'United States', shortName: 'USA', flag: '🇺🇸', coordinates: [-98, 39], contacts: '23.5M+', accounts: '1.35M+', region: 'NA', subRegion: 'NORTH AMERICA • USA', labelOffset: [0, -14], textAnchor: 'middle' },
  { id: 'ca', name: 'Canada', shortName: 'Canada', flag: '🇨🇦', coordinates: [-106, 56], contacts: '3.0M+', accounts: '150K+', region: 'NA', subRegion: 'NORTH AMERICA • CANADA', labelOffset: [0, -14], textAnchor: 'middle' },
  { id: 'mx', name: 'Mexico', shortName: 'Mexico', flag: '🇲🇽', coordinates: [-102, 23], contacts: '2.45M+', accounts: '140K+', region: 'LATAM', subRegion: 'NORTH AMERICA • MEXICO', labelOffset: [0, 14], textAnchor: 'middle' },

  // South America / LATAM
  { id: 'br', name: 'Brazil', shortName: 'Brazil', flag: '🇧🇷', coordinates: [-51, -14], contacts: '3.1M+', accounts: '180K+', region: 'LATAM', subRegion: 'LATIN AMERICA • BRAZIL', labelOffset: [18, 0], textAnchor: 'start' },
  { id: 'co', name: 'Colombia', shortName: 'Colombia', flag: '🇨🇴', coordinates: [-74, 4], contacts: '920K+', accounts: '55K+', region: 'LATAM', subRegion: 'LATIN AMERICA • ANDEAN', labelOffset: [-14, -12], textAnchor: 'end' },
  { id: 'pe', name: 'Peru', shortName: 'Peru', flag: '🇵🇪', coordinates: [-75, -9], contacts: '580K+', accounts: '35K+', region: 'LATAM', subRegion: 'LATIN AMERICA • ANDEAN', labelOffset: [-14, 0], textAnchor: 'end' },
  { id: 'cl', name: 'Chile', shortName: 'Chile', flag: '🇨🇱', coordinates: [-71, -35], contacts: '470K+', accounts: '28K+', region: 'LATAM', subRegion: 'LATIN AMERICA • SOUTHERN CONE', labelOffset: [-14, 10], textAnchor: 'end' },
  { id: 'ar', name: 'Argentina', shortName: 'Argentina', flag: '🇦🇷', coordinates: [-63, -38], contacts: '410K+', accounts: '25K+', region: 'LATAM', subRegion: 'LATIN AMERICA • SOUTHERN CONE', labelOffset: [14, 10], textAnchor: 'start' },

  // Europe & Middle East / EMEA (Carefully arranged to prevent all overlap)
  { id: 'gb', name: 'United Kingdom', shortName: 'UK', flag: '🇬🇧', coordinates: [-3, 55], contacts: '5.4M+', accounts: '320K+', region: 'EMEA', subRegion: 'EUROPE • UK', labelOffset: [-18, -12], textAnchor: 'end' },
  { id: 'nl', name: 'Netherlands', shortName: 'NL', flag: '🇳🇱', coordinates: [5, 52.3], contacts: '1.8M+', accounts: '110K+', region: 'EMEA', subRegion: 'EUROPE • BENELUX', labelOffset: [14, -14], textAnchor: 'start' },
  { id: 'de', name: 'Germany', shortName: 'Germany', flag: '🇩🇪', coordinates: [10.4, 51.1], contacts: '4.6M+', accounts: '280K+', region: 'EMEA', subRegion: 'EUROPE • DACH', labelOffset: [16, -2], textAnchor: 'start' },
  { id: 'se', name: 'Sweden', shortName: 'Sweden', flag: '🇸🇪', coordinates: [18, 60], contacts: '920K+', accounts: '55K+', region: 'EMEA', subRegion: 'EUROPE • NORDICS', labelOffset: [14, -14], textAnchor: 'start' },
  { id: 'fr', name: 'France', shortName: 'France', flag: '🇫🇷', coordinates: [2.2, 46.5], contacts: '3.3M+', accounts: '190K+', region: 'EMEA', subRegion: 'EUROPE • WESTERN EUROPE', labelOffset: [-18, 0], textAnchor: 'end' },
  { id: 'es', name: 'Spain', shortName: 'Spain', flag: '🇪🇸', coordinates: [-3.7, 40.4], contacts: '1.4M+', accounts: '85K+', region: 'EMEA', subRegion: 'EUROPE • IBERIA', labelOffset: [-16, 12], textAnchor: 'end' },
  { id: 'it', name: 'Italy', shortName: 'Italy', flag: '🇮🇹', coordinates: [12.5, 41.9], contacts: '1.5M+', accounts: '95K+', region: 'EMEA', subRegion: 'EUROPE • SOUTHERN EUROPE', labelOffset: [16, 10], textAnchor: 'start' },
  { id: 'cy', name: 'Cyprus', shortName: 'Cyprus', flag: '🇨🇾', coordinates: [33.4, 35.1], contacts: '5.2M', accounts: '65K+', region: 'EMEA', subRegion: 'EUROPE • SOUTHERN EUROPE', labelOffset: [16, -8], textAnchor: 'start' },
  { id: 'sa', name: 'Saudi Arabia', shortName: 'Saudi', flag: '🇸🇦', coordinates: [45, 24], contacts: '680K+', accounts: '45K+', region: 'EMEA', subRegion: 'MIDDLE EAST • GCC', labelOffset: [-16, 12], textAnchor: 'end' },
  { id: 'ae', name: 'UAE', shortName: 'UAE', flag: '🇦🇪', coordinates: [54, 24], contacts: '850K+', accounts: '60K+', region: 'EMEA', subRegion: 'MIDDLE EAST • GCC', labelOffset: [16, 0], textAnchor: 'start' },
  { id: 'za', name: 'South Africa', shortName: 'South Africa', flag: '🇿🇦', coordinates: [24, -29], contacts: '550K+', accounts: '35K+', region: 'EMEA', subRegion: 'AFRICA • SOUTHERN AFRICA', labelOffset: [0, 14], textAnchor: 'middle' },

  // Asia-Pacific / APAC
  { id: 'in', name: 'India', shortName: 'India', flag: '🇮🇳', coordinates: [78.9, 20.6], contacts: '9.8M+', accounts: '560K+', region: 'APAC', subRegion: 'ASIA • SOUTH ASIA', labelOffset: [0, -14], textAnchor: 'middle' },
  { id: 'sg', name: 'Singapore', shortName: 'Singapore', flag: '🇸🇬', coordinates: [103.8, 1.3], contacts: '1.45M+', accounts: '95K+', region: 'APAC', subRegion: 'ASIA • ASEAN', labelOffset: [16, -8], textAnchor: 'start' },
  { id: 'my', name: 'Malaysia', shortName: 'Malaysia', flag: '🇲🇾', coordinates: [101.9, 4.2], contacts: '620K+', accounts: '40K+', region: 'APAC', subRegion: 'ASIA • ASEAN', labelOffset: [-16, -6], textAnchor: 'end' },
  { id: 'id', name: 'Indonesia', shortName: 'Indonesia', flag: '🇮🇩', coordinates: [113.9, -0.8], contacts: '850K+', accounts: '50K+', region: 'APAC', subRegion: 'ASIA • ASEAN', labelOffset: [0, 14], textAnchor: 'middle' },
  { id: 'ph', name: 'Philippines', shortName: 'Philippines', flag: '🇵🇭', coordinates: [121.7, 12.8], contacts: '510K+', accounts: '30K+', region: 'APAC', subRegion: 'ASIA • ASEAN', labelOffset: [16, 0], textAnchor: 'start' },
  { id: 'kr', name: 'South Korea', shortName: 'S. Korea', flag: '🇰🇷', coordinates: [127.7, 36], contacts: '1.1M+', accounts: '75K+', region: 'APAC', subRegion: 'ASIA • EAST ASIA', labelOffset: [-18, -10], textAnchor: 'end' },
  { id: 'jp', name: 'Japan', shortName: 'Japan', flag: '🇯🇵', coordinates: [138.2, 36.2], contacts: '2.2M+', accounts: '190K+', region: 'APAC', subRegion: 'ASIA • EAST ASIA', labelOffset: [18, 0], textAnchor: 'start' },
  { id: 'au', name: 'Australia', shortName: 'Australia', flag: '🇦🇺', coordinates: [133.7, -25.2], contacts: '2.9M+', accounts: '190K+', region: 'APAC', subRegion: 'OCEANIA • AUSTRALASIA', labelOffset: [0, -14], textAnchor: 'middle' },
  { id: 'nz', name: 'New Zealand', shortName: 'New Zealand', flag: '🇳🇿', coordinates: [174.8, -41], contacts: '320K+', accounts: '20K+', region: 'APAC', subRegion: 'OCEANIA • NEW ZEALAND', labelOffset: [16, 0], textAnchor: 'start' }
];

// Network Flight Arcs
const FLIGHT_ARCS = [
  { from: [-78, 38], to: [-2, 54] },
  { from: [-2, 54], to: [10, 51] },
  { from: [10, 51], to: [28, 38] },
  { from: [28, 38], to: [48, 26] },
  { from: [48, 26], to: [78, 22] },
  { from: [78, 22], to: [103.8, 1.3] },
  { from: [103.8, 1.3], to: [134, -25] },
  { from: [-78, 38], to: [-51, -14] },
  { from: [-118, 36], to: [138, 36] },
];

// Regional Camera Presets
const REGION_PRESETS = {
  GLOBAL: { coordinates: [10, 15], zoom: 1 },
  NORTH_AMERICA: { coordinates: [-95, 42], zoom: 2.3 },
  NA: { coordinates: [-95, 42], zoom: 2.3 },
  LATAM: { coordinates: [-62, -18], zoom: 2.2 },
  SOUTH_AMERICA: { coordinates: [-62, -18], zoom: 2.2 },
  EMEA: { coordinates: [20, 48], zoom: 2.4 },
  EUROPE: { coordinates: [20, 48], zoom: 2.4 },
  APAC: { coordinates: [105, 18], zoom: 2.0 },
  ASIA: { coordinates: [105, 18], zoom: 2.0 }
};

export function Map({
  center = [10, 15],
  zoom = 1,
  activeRegion: propActiveRegion = 'GLOBAL',
  children,
  className = '',
  onSelectRegion,
  onSelectCountry
}) {
  const { darkMode } = useTheme();
  const [position, setPosition] = useState(REGION_PRESETS.GLOBAL);
  const [activeRegion, setActiveRegion] = useState(propActiveRegion || 'GLOBAL');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const containerRef = useRef(null);

  // Synchronize region prop
  useEffect(() => {
    if (propActiveRegion) {
      setActiveRegion(propActiveRegion);
      const target = REGION_PRESETS[propActiveRegion] || REGION_PRESETS.GLOBAL;
      setPosition(target);
      if (propActiveRegion === 'GLOBAL') {
        setSelectedCountry(null);
      }
    }
  }, [propActiveRegion]);

  const handleZoomIn = () => {
    setPosition((pos) => ({
      ...pos,
      zoom: Math.min(pos.zoom * 1.4, 4)
    }));
  };

  const handleZoomOut = () => {
    setPosition((pos) => {
      const nextZoom = Math.max(pos.zoom / 1.4, 1);
      if (nextZoom <= 1.1) {
        setActiveRegion('GLOBAL');
        setSelectedCountry(null);
        onSelectRegion?.('GLOBAL');
        return REGION_PRESETS.GLOBAL;
      }
      return { ...pos, zoom: nextZoom };
    });
  };

  const handleLocate = () => {
    setActiveRegion('GLOBAL');
    setPosition(REGION_PRESETS.GLOBAL);
    setSelectedCountry(null);
    onSelectRegion?.('GLOBAL');
  };

  const handleMoveEnd = (pos) => {
    setPosition(pos);
  };

  const isZoomedIn = position.zoom >= 1.5 || activeRegion !== 'GLOBAL';

  // Filter country markers based on active region and zoom level
  const visibleCountryMarkers = COUNTRY_MARKERS.filter((c) => {
    if (activeRegion === 'GLOBAL') {
      return isZoomedIn;
    }
    if (activeRegion === 'NORTH_AMERICA' || activeRegion === 'NA') return c.region === 'NA';
    if (activeRegion === 'LATAM' || activeRegion === 'SOUTH_AMERICA') return c.region === 'LATAM';
    if (activeRegion === 'EMEA' || activeRegion === 'EUROPE') return c.region === 'EMEA';
    if (activeRegion === 'APAC' || activeRegion === 'ASIA') return c.region === 'APAC';
    return true;
  });

  // Palette matching Demandify Media & TGS brand
  const landFill = darkMode ? '#10223D' : '#E0F2FE';
  const landStroke = darkMode ? '#1E3A5F' : '#BAE6FD';
  const landHover = darkMode ? '#1E40AF' : '#BAE6FD';
  const continentTextColor = darkMode ? '#38BDF8' : '#0284C7';
  const pulseColor = '#0AAEEF';
  const pulseAccent = '#F7941D';

  const mapBg = darkMode
    ? 'radial-gradient(circle at 50% 50%, #0B172C 0%, #070D1A 100%)'
    : 'radial-gradient(circle at 50% 50%, #F0F9FF 0%, #E0F2FE 100%)';

  return (
    <MapContext.Provider
      value={{
        zoom: position.zoom,
        activeRegion,
        setActiveRegion,
        handleZoomIn,
        handleZoomOut,
        handleLocate,
        containerRef
      }}
    >
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-3xl border transition-all duration-300 select-none ${
          darkMode
            ? 'border-slate-800 shadow-[0_24px_64px_rgba(0,0,0,0.6)]'
            : 'border-sky-200/80 shadow-[0_16px_48px_rgba(10,174,239,0.08)]'
        } ${className}`}
        style={{ background: mapBg, minHeight: '520px', height: '100%', width: '100%' }}
      >
        {/* Top Header Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-sky-200/60 dark:border-slate-800 shadow-sm pointer-events-none">
          <Globe className="w-4 h-4 text-[#0AAEEF]" />
          <span className="text-xs font-extrabold tracking-wide uppercase text-slate-800 dark:text-slate-200">
            Interactive Global B2B Grid
          </span>
        </div>

        {/* Hovered Country Quick Info Pill */}
        <AnimatePresence>
          {hoveredCountry && !selectedCountry && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white backdrop-blur-md border border-[#0AAEEF]/40 shadow-lg text-xs pointer-events-none"
            >
              <span>{hoveredCountry.flag}</span>
              <span className="font-bold">{hoveredCountry.name}:</span>
              <span className="text-[#F7941D] font-extrabold font-mono">{hoveredCountry.contacts}</span>
              <span className="text-slate-400 text-[11px]">({hoveredCountry.accounts} Accounts)</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Composable World Map (React Simple Maps) ── */}
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 120,
            center: [0, 25]
          }}
          className="w-full h-full min-h-[520px] cursor-grab active:cursor-grabbing"
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={handleMoveEnd}
            minZoom={1}
            maxZoom={5}
          >
            {/* ── 1. Real World Geography Paths ── */}
            <Geographies geography={worldGeoJson}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={landFill}
                    stroke={landStroke}
                    strokeWidth={0.6}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: landHover, outline: 'none', transition: 'all 250ms' },
                      pressed: { fill: landHover, outline: 'none' }
                    }}
                  />
                ))
              }
            </Geographies>

            {/* ── 2. Dotted Curved Network Connections ── */}
            {FLIGHT_ARCS.map((arc, i) => (
              <Line
                key={i}
                from={arc.from}
                to={arc.to}
                stroke={darkMode ? 'rgba(10, 174, 239, 0.4)' : 'rgba(2, 132, 199, 0.5)'}
                strokeWidth={1.2}
                strokeDasharray="3 4"
                className="opacity-75"
              />
            ))}

            {/* ── 3. Continent Typography Names (Global View) ── */}
            {!isZoomedIn &&
              CONTINENT_LABELS.map((label) => (
                <Marker key={label.name} coordinates={label.coordinates}>
                  <text
                    textAnchor="middle"
                    fill={continentTextColor}
                    fontSize={10}
                    fontWeight={800}
                    letterSpacing="0.18em"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    opacity={darkMode ? 0.8 : 0.9}
                    className="select-none pointer-events-none"
                  >
                    {label.name}
                  </text>
                </Marker>
              ))}

            {/* ── 4. Global View: Pulsing Hub Beacons with 3+, 5+, 7+, 8+ Badges ── */}
            {!isZoomedIn &&
              MAP_CLUSTERS.map((hub) => (
                <Marker
                  key={hub.id}
                  coordinates={hub.coordinates}
                  onClick={() => {
                    if (hub.region) {
                      setActiveRegion(hub.region);
                      setPosition(REGION_PRESETS[hub.region] || REGION_PRESETS.GLOBAL);
                      onSelectRegion?.(hub.region);
                    }
                  }}
                  className="cursor-pointer group"
                >
                  {/* Radar Wave */}
                  <circle
                    r={16}
                    fill={pulseColor}
                    opacity={0.35}
                    className="animate-ping"
                  />
                  {/* Outer Ring */}
                  <circle
                    r={9}
                    fill="rgba(10, 174, 239, 0.25)"
                    stroke={pulseColor}
                    strokeWidth={1.5}
                  />
                  {/* Core Dot */}
                  <circle r={3.5} fill={pulseColor} />

                  {/* Badge Number Pill */}
                  <g transform="translate(0, -11)">
                    <circle
                      r={6.5}
                      fill={darkMode ? '#070E1A' : '#0AAEEF'}
                      stroke="#FFFFFF"
                      strokeWidth={1}
                    />
                    <text
                      textAnchor="middle"
                      y={2.5}
                      fill="#FFFFFF"
                      fontSize={6.5}
                      fontWeight={800}
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {hub.countBadge}
                    </text>
                  </g>
                </Marker>
              ))}

            {/* ── 5. Zoomed-In View: Collision-Free Country Markers with Smart Offsets ── */}
            {isZoomedIn &&
              visibleCountryMarkers.map((c) => {
                const isSelected = selectedCountry?.id === c.id;
                const isHovered = hoveredCountry?.id === c.id;
                const [offX, offY] = c.labelOffset || [0, -14];
                const anchor = c.textAnchor || 'middle';
                const hasOffset = Math.abs(offX) > 6 || Math.abs(offY) > 6;

                // Dynamic width calculation based on text content
                const badgeText = `${c.shortName || c.name} (${c.contacts})`;
                const pillWidth = Math.max(34, badgeText.length * 3.4 + 6);
                const pillHeight = 8.5;

                let rectX = offX - pillWidth / 2;
                let textX = offX;
                if (anchor === 'start') {
                  rectX = offX + 2;
                  textX = offX + 5;
                } else if (anchor === 'end') {
                  rectX = offX - pillWidth - 2;
                  textX = offX - 5;
                }

                return (
                  <Marker
                    key={c.id}
                    coordinates={c.coordinates}
                    onMouseEnter={() => setHoveredCountry(c)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    onClick={() => {
                      setSelectedCountry(c);
                      onSelectCountry?.(c.name);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Animated Radar Wave */}
                    <circle
                      r={isSelected || isHovered ? 16 : 10}
                      fill={isSelected ? pulseAccent : pulseColor}
                      opacity={0.4}
                      className="animate-ping"
                    />
                    {/* Outer Ring & Core Point */}
                    <circle
                      r={isSelected || isHovered ? 6.5 : 4.5}
                      fill={isSelected ? pulseAccent : pulseColor}
                      stroke="#FFFFFF"
                      strokeWidth={1.2}
                      className="transition-transform duration-200"
                    />
                    <circle r={1.5} fill="#FFFFFF" />

                    {/* Dotted Leader Line to offset label */}
                    {hasOffset && (
                      <line
                        x1={0}
                        y1={0}
                        x2={anchor === 'start' ? offX + 2 : anchor === 'end' ? offX - 2 : offX}
                        y2={offY}
                        stroke={isSelected ? pulseAccent : pulseColor}
                        strokeWidth={0.6}
                        strokeDasharray="1.5 1.5"
                        opacity={0.65}
                      />
                    )}

                    {/* Compact Collision-Free Badge Chip */}
                    <g className="select-none transition-all duration-200">
                      <rect
                        x={rectX}
                        y={offY - pillHeight / 2}
                        width={pillWidth}
                        height={pillHeight}
                        rx={2.5}
                        fill={
                          isSelected
                            ? darkMode
                              ? '#1E293B'
                              : '#FEF3C7'
                            : isHovered
                            ? darkMode
                              ? '#0F172A'
                              : '#FFFFFF'
                            : darkMode
                            ? 'rgba(7, 14, 26, 0.92)'
                            : 'rgba(255, 255, 255, 0.96)'
                        }
                        stroke={isSelected ? pulseAccent : isHovered ? '#0AAEEF' : darkMode ? '#1E3A5F' : '#BAE6FD'}
                        strokeWidth={isSelected || isHovered ? 1 : 0.6}
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                      />
                      <text
                        x={textX}
                        y={offY + 1.2}
                        textAnchor={anchor}
                        fill={darkMode ? '#F1F5F9' : '#0F172A'}
                        fontSize={3.8}
                        fontWeight={700}
                        fontFamily="Plus Jakarta Sans, sans-serif"
                      >
                        {c.shortName || c.name}{' '}
                        <tspan fill={pulseAccent} fontWeight={800}>
                          ({c.contacts})
                        </tspan>
                      </text>
                    </g>
                  </Marker>
                );
              })}
          </ZoomableGroup>
        </ComposableMap>

        {/* ── Interactive Selected Country Popup Card ── */}
        <AnimatePresence>
          {selectedCountry && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 rounded-2xl p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)] border min-w-[270px] max-w-[330px] text-center ${
                darkMode
                  ? 'bg-slate-900/95 border-slate-700 text-slate-100'
                  : 'bg-white border-sky-200 text-slate-900'
              }`}
            >
              <button
                onClick={() => setSelectedCountry(null)}
                className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-2xl mb-1">{selectedCountry.flag}</div>

              <h4 className="text-xl font-extrabold tracking-tight mb-1">
                {selectedCountry.name}
              </h4>

              <div className="text-[11px] font-bold uppercase tracking-widest text-[#0AAEEF] mb-3">
                {selectedCountry.subRegion}
              </div>

              <div className="text-4xl font-extrabold bg-gradient-to-r from-[#0AAEEF] to-[#F7941D] bg-clip-text text-transparent font-mono tracking-tight my-2">
                {selectedCountry.contacts}
              </div>

              <div className="text-xs text-slate-400 font-medium">
                {selectedCountry.accounts} Target Accounts
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {children}
      </div>
    </MapContext.Provider>
  );
}

export function MapControls({
  position = 'bottom-right',
  showZoom = true,
  showCompass = true,
  showLocate = true,
  showFullscreen = true
}) {
  const { darkMode } = useTheme();
  const { handleZoomIn, handleZoomOut, handleLocate, containerRef } = useMap();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!containerRef?.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const posClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }[position] || 'bottom-4 right-4';

  const btnClasses = `flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-200 cursor-pointer ${
    darkMode
      ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white shadow-md'
      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm'
  }`;

  return (
    <div className={`absolute z-10 flex flex-col gap-1.5 ${posClasses}`}>
      {showZoom && (
        <>
          <button onClick={handleZoomIn} className={btnClasses} title="Zoom In (Split into Countries)">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleZoomOut} className={btnClasses} title="Zoom Out (Global Regions)">
            <Minus className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      {showLocate && (
        <button onClick={handleLocate} className={btnClasses} title="Reset Global View">
          <Locate className="w-3.5 h-3.5 text-[#0AAEEF]" />
        </button>
      )}

      {showCompass && (
        <button onClick={handleLocate} className={btnClasses} title="Reset Orientation">
          <Compass className="w-3.5 h-3.5 text-[#F7941D]" />
        </button>
      )}

      {showFullscreen && (
        <button onClick={toggleFullscreen} className={btnClasses} title="Toggle Fullscreen">
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}
