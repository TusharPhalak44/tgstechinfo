const fs = require('fs');
const path = require('path');


const TARAJ_ROOT = 'c:/Users/Nakshtra/OneDrive/Desktop/TaRajGlobal/tarajglobal';

// 1. Map.jsx
const mapContent = `import React, { useState, useRef, useEffect, useMemo, createContext, useContext } from 'react';
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
import { useTheme } from '@context/ThemeContext';
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

// Continent Labels for Global View
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
const BASE_COUNTRY_MARKERS = [
  // North America
  { id: 'us', name: 'United States', shortName: 'USA', flag: '🇺🇸', coordinates: [-98, 39], contacts: '23.5M+', accounts: '1.35M+', region: 'NA', subRegion: 'NORTH AMERICA • USA', labelOffset: [0, -14], textAnchor: 'middle' },
  { id: 'ca', name: 'Canada', shortName: 'Canada', flag: '🇨🇦', coordinates: [-106, 56], contacts: '3.0M+', accounts: '150K+', region: 'NA', subRegion: 'NORTH AMERICA • CANADA', labelOffset: [0, -14], textAnchor: 'middle' },
  { id: 'mx', name: 'Mexico', shortName: 'Mexico', flag: '🇲🇽', coordinates: [-102, 23], contacts: '2.48M+', accounts: '140K+', region: 'LATAM', subRegion: 'NORTH AMERICA • MEXICO', labelOffset: [0, 14], textAnchor: 'middle' },

  // South America / LATAM
  { id: 'br', name: 'Brazil', shortName: 'Brazil', flag: '🇧🇷', coordinates: [-51, -14], contacts: '3.14M+', accounts: '180K+', region: 'LATAM', subRegion: 'LATIN AMERICA • BRAZIL', labelOffset: [18, 0], textAnchor: 'start' },
  { id: 'co', name: 'Colombia', shortName: 'Colombia', flag: '🇨🇴', coordinates: [-74, 4], contacts: '920K+', accounts: '55K+', region: 'LATAM', subRegion: 'LATIN AMERICA • ANDEAN', labelOffset: [-14, -12], textAnchor: 'end' },
  { id: 'pe', name: 'Peru', shortName: 'Peru', flag: '🇵🇪', coordinates: [-75, -9], contacts: '580K+', accounts: '35K+', region: 'LATAM', subRegion: 'LATIN AMERICA • ANDEAN', labelOffset: [-14, 0], textAnchor: 'end' },
  { id: 'cl', name: 'Chile', shortName: 'Chile', flag: '🇨🇱', coordinates: [-71, -35], contacts: '470K+', accounts: '28K+', region: 'LATAM', subRegion: 'LATIN AMERICA • SOUTHERN CONE', labelOffset: [-14, 10], textAnchor: 'end' },
  { id: 'ar', name: 'Argentina', shortName: 'Argentina', flag: '🇦🇷', coordinates: [-63, -38], contacts: '410K+', accounts: '25K+', region: 'LATAM', subRegion: 'LATIN AMERICA • SOUTHERN CONE', labelOffset: [14, 10], textAnchor: 'start' },

  // Europe & Middle East / EMEA
  { id: 'gb', name: 'United Kingdom', shortName: 'UK', flag: '🇬🇧', coordinates: [-3, 55], contacts: '5.74M+', accounts: '320K+', region: 'EMEA', subRegion: 'EUROPE • UK', labelOffset: [-18, -12], textAnchor: 'end' },
  { id: 'nl', name: 'Netherlands', shortName: 'NL', flag: '🇳🇱', coordinates: [5, 52.3], contacts: '1.80M+', accounts: '110K+', region: 'EMEA', subRegion: 'EUROPE • BENELUX', labelOffset: [14, -14], textAnchor: 'start' },
  { id: 'de', name: 'Germany', shortName: 'Germany', flag: '🇩🇪', coordinates: [10.4, 51.1], contacts: '4.89M+', accounts: '280K+', region: 'EMEA', subRegion: 'EUROPE • DACH', labelOffset: [16, -2], textAnchor: 'start' },
  { id: 'se', name: 'Sweden', shortName: 'Sweden', flag: '🇸🇪', coordinates: [18, 60], contacts: '920K+', accounts: '55K+', region: 'EMEA', subRegion: 'EUROPE • NORDICS', labelOffset: [14, -14], textAnchor: 'start' },
  { id: 'fr', name: 'France', shortName: 'France', flag: '🇫🇷', coordinates: [2.2, 46.5], contacts: '3.51M+', accounts: '190K+', region: 'EMEA', subRegion: 'EUROPE • WESTERN EUROPE', labelOffset: [-18, 0], textAnchor: 'end' },
  { id: 'es', name: 'Spain', shortName: 'Spain', flag: '🇪🇸', coordinates: [-3.7, 40.4], contacts: '1.40M+', accounts: '85K+', region: 'EMEA', subRegion: 'EUROPE • IBERIA', labelOffset: [-16, 12], textAnchor: 'end' },
  { id: 'it', name: 'Italy', shortName: 'Italy', flag: '🇮🇹', coordinates: [12.5, 41.9], contacts: '1.50M+', accounts: '95K+', region: 'EMEA', subRegion: 'EUROPE • SOUTHERN EUROPE', labelOffset: [16, 10], textAnchor: 'start' },
  { id: 'cy', name: 'Cyprus', shortName: 'Cyprus', flag: '🇨🇾', coordinates: [33.4, 35.1], contacts: '5.20M', accounts: '65K+', region: 'EMEA', subRegion: 'EUROPE • SOUTHERN EUROPE', labelOffset: [16, -8], textAnchor: 'start' },
  { id: 'sa', name: 'Saudi Arabia', shortName: 'Saudi', flag: '🇸🇦', coordinates: [45, 24], contacts: '680K+', accounts: '45K+', region: 'EMEA', subRegion: 'MIDDLE EAST • GCC', labelOffset: [-16, 12], textAnchor: 'end' },
  { id: 'ae', name: 'UAE', shortName: 'UAE', flag: '🇦🇪', coordinates: [54, 24], contacts: '850K+', accounts: '60K+', region: 'EMEA', subRegion: 'MIDDLE EAST • GCC', labelOffset: [16, 0], textAnchor: 'start' },
  { id: 'za', name: 'South Africa', shortName: 'South Africa', flag: '🇿🇦', coordinates: [24, -29], contacts: '550K+', accounts: '35K+', region: 'EMEA', subRegion: 'AFRICA • SOUTHERN AFRICA', labelOffset: [0, 14], textAnchor: 'middle' },

  // Asia-Pacific / APAC
  { id: 'in', name: 'India', shortName: 'India', flag: '🇮🇳', coordinates: [78.9, 20.6], contacts: '9.80M+', accounts: '560K+', region: 'APAC', subRegion: 'ASIA • SOUTH ASIA', labelOffset: [0, -14], textAnchor: 'middle' },
  { id: 'sg', name: 'Singapore', shortName: 'Singapore', flag: '🇸🇬', coordinates: [103.8, 1.3], contacts: '1.45M+', accounts: '95K+', region: 'APAC', subRegion: 'ASIA • ASEAN', labelOffset: [16, -8], textAnchor: 'start' },
  { id: 'my', name: 'Malaysia', shortName: 'Malaysia', flag: '🇲🇾', coordinates: [101.9, 4.2], contacts: '620K+', accounts: '40K+', region: 'APAC', subRegion: 'ASIA • ASEAN', labelOffset: [-16, -6], textAnchor: 'end' },
  { id: 'id', name: 'Indonesia', shortName: 'Indonesia', flag: '🇮🇩', coordinates: [113.9, -0.8], contacts: '850K+', accounts: '50K+', region: 'APAC', subRegion: 'ASIA • ASEAN', labelOffset: [0, 14], textAnchor: 'middle' },
  { id: 'ph', name: 'Philippines', shortName: 'Philippines', flag: '🇵🇭', coordinates: [121.7, 12.8], contacts: '510K+', accounts: '30K+', region: 'APAC', subRegion: 'ASIA • ASEAN', labelOffset: [16, 0], textAnchor: 'start' },
  { id: 'kr', name: 'South Korea', shortName: 'S. Korea', flag: '🇰🇷', coordinates: [127.7, 36], contacts: '1.10M+', accounts: '75K+', region: 'APAC', subRegion: 'ASIA • EAST ASIA', labelOffset: [-18, -10], textAnchor: 'end' },
  { id: 'jp', name: 'Japan', shortName: 'Japan', flag: '🇯🇵', coordinates: [138.2, 36.2], contacts: '2.20M+', accounts: '190K+', region: 'APAC', subRegion: 'ASIA • EAST ASIA', labelOffset: [18, 0], textAnchor: 'start' },
  { id: 'au', name: 'Australia', shortName: 'Australia', flag: '🇦🇺', coordinates: [133.7, -25.2], contacts: '2.90M+', accounts: '190K+', region: 'APAC', subRegion: 'OCEANIA • AUSTRALASIA', labelOffset: [0, -14], textAnchor: 'middle' },
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
  onSelectCountry,
  countryBreakdown = []
}) {
  const themeContext = useTheme();
  const darkMode = themeContext?.darkMode ?? (themeContext?.theme === 'dark' || true);

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

  // Merge live database breakdown dynamically with coordinates & flags
  const dynamicCountryMarkers = useMemo(() => {
    if (!countryBreakdown || countryBreakdown.length === 0) {
      return BASE_COUNTRY_MARKERS;
    }

    const breakdownMap = new Map();
    countryBreakdown.forEach((c) => {
      if (c.iso_code) breakdownMap.set(c.iso_code.toLowerCase(), c);
      if (c.country_name) breakdownMap.set(c.country_name.toLowerCase(), c);
      if (c.name) breakdownMap.set(c.name.toLowerCase(), c);
    });

    return BASE_COUNTRY_MARKERS.map((marker) => {
      const match = breakdownMap.get(marker.id.toLowerCase()) || 
                    (marker.name && breakdownMap.get(marker.name.toLowerCase()));
      if (!match) return marker;

      const contactsNum = parseInt(match.contact_count || 0, 10);
      const accountsNum = parseInt(match.company_count || 0, 10);

      const formattedContacts = contactsNum >= 1000000
        ? \`\${(contactsNum / 1000000).toFixed(1).replace(/\\.0$/, '')}M+\`
        : contactsNum >= 1000
        ? \`\${Math.round(contactsNum / 1000)}K+\`
        : \`\${contactsNum}\`;

      const formattedAccounts = accountsNum >= 1000000
        ? \`\${(accountsNum / 1000000).toFixed(2).replace(/\\.00$/, '')}M+\`
        : accountsNum >= 1000
        ? \`\${Math.round(accountsNum / 1000)}K+\`
        : \`\${accountsNum}\`;

      return {
        ...marker,
        contacts: formattedContacts,
        accounts: formattedAccounts,
        rawContacts: contactsNum,
        rawAccounts: accountsNum,
        percentage: match.percentage
      };
    });
  }, [countryBreakdown]);

  // Filter country markers based on active region and zoom level
  const visibleCountryMarkers = dynamicCountryMarkers.filter((c) => {
    if (activeRegion === 'GLOBAL') {
      return isZoomedIn;
    }
    if (activeRegion === 'NORTH_AMERICA' || activeRegion === 'NA') return c.region === 'NA';
    if (activeRegion === 'LATAM' || activeRegion === 'SOUTH_AMERICA') return c.region === 'LATAM';
    if (activeRegion === 'EMEA' || activeRegion === 'EUROPE') return c.region === 'EMEA';
    if (activeRegion === 'APAC' || activeRegion === 'ASIA') return c.region === 'APAC';
    return true;
  });

  // Palette tailored to Taraj Global brand
  const landFill = darkMode ? '#101B2E' : '#E0F2FE';
  const landStroke = darkMode ? '#1E3252' : '#BAE6FD';
  const landHover = darkMode ? '#1E40AF' : '#BAE6FD';
  const continentTextColor = darkMode ? '#00A6FF' : '#0284C7';
  const pulseColor = '#00A6FF';
  const pulseAccent = '#FF6D00';

  const mapBg = darkMode
    ? 'radial-gradient(circle at 50% 50%, #08101E 0%, #050505 100%)'
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
        className={\`relative overflow-hidden rounded-3xl border transition-all duration-300 select-none \${
          darkMode
            ? 'border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.7)]'
            : 'border-sky-200/80 shadow-[0_16px_48px_rgba(0,166,255,0.08)]'
        } \${className}\`}
        style={{ background: mapBg, minHeight: '520px', height: '100%', width: '100%' }}
      >
        {/* Top Header Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#0B1322]/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10 shadow-sm pointer-events-none">
          <Globe className="w-4 h-4 text-[#00A6FF]" />
          <span className="text-xs font-extrabold tracking-wide uppercase text-slate-200">
            Global B2B Market Intelligence Map
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
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white backdrop-blur-md border border-[#00A6FF]/40 shadow-lg text-xs pointer-events-none"
            >
              <span>{hoveredCountry.flag}</span>
              <span className="font-bold">{hoveredCountry.name}:</span>
              <span className="text-[#FF6D00] font-extrabold font-mono">{hoveredCountry.contacts}</span>
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
                stroke="rgba(0, 166, 255, 0.45)"
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
                    fontFamily="Inter, sans-serif"
                    opacity={0.85}
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
                    fill="rgba(0, 166, 255, 0.25)"
                    stroke={pulseColor}
                    strokeWidth={1.5}
                  />
                  {/* Core Dot */}
                  <circle r={3.5} fill={pulseColor} />

                  {/* Badge Number Pill */}
                  <g transform="translate(0, -11)">
                    <circle
                      r={6.5}
                      fill="#070E1A"
                      stroke="#FFFFFF"
                      strokeWidth={1}
                    />
                    <text
                      textAnchor="middle"
                      y={2.5}
                      fill="#FFFFFF"
                      fontSize={6.5}
                      fontWeight={800}
                      fontFamily="monospace"
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

                const badgeText = \`\${c.shortName || c.name} (\${c.contacts})\`;
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
                            ? '#1E293B'
                            : isHovered
                            ? '#0F172A'
                            : 'rgba(7, 14, 26, 0.94)'
                        }
                        stroke={isSelected ? pulseAccent : isHovered ? '#00A6FF' : '#1E3A5F'}
                        strokeWidth={isSelected || isHovered ? 1 : 0.6}
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                      />
                      <text
                        x={textX}
                        y={offY + 1.2}
                        textAnchor={anchor}
                        fill="#F1F5F9"
                        fontSize={3.8}
                        fontWeight={700}
                        fontFamily="Inter, sans-serif"
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
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 rounded-2xl p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6)] border border-white/10 min-w-[270px] max-w-[330px] text-center bg-[#0C1424]/95 text-slate-100 backdrop-blur-xl"
            >
              <button
                onClick={() => setSelectedCountry(null)}
                className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-3xl mb-1">{selectedCountry.flag}</div>

              <h4 className="text-xl font-extrabold tracking-tight mb-1 text-white">
                {selectedCountry.name}
              </h4>

              <div className="text-[11px] font-bold uppercase tracking-widest text-[#00A6FF] mb-3">
                {selectedCountry.subRegion}
              </div>

              <div className="text-4xl font-extrabold bg-gradient-to-r from-[#00A6FF] to-[#FF6D00] bg-clip-text text-transparent font-mono tracking-tight my-2">
                {selectedCountry.contacts}
              </div>

              <div className="text-xs text-slate-300 font-medium">
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
`;

// 2. MapControls.jsx
const mapControlsContent = `import React, { useState } from 'react';
import { Plus, Minus, Compass, Maximize, Minimize } from 'lucide-react';
import { useMap } from './Map';

export function MapControls({
  position = 'bottom-right',
  showZoom = true,
  showCompass = true,
  showLocate = true,
  showFullscreen = true
}) {
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
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  }[position] || 'bottom-4 right-4';

  return (
    <div className={\`absolute \${posClasses} z-10 flex flex-col gap-1.5 bg-[#0B1322]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg\`}>
      {showZoom && (
        <>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Zoom In"
            type="button"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Zoom Out"
            type="button"
          >
            <Minus className="w-4 h-4" />
          </button>
        </>
      )}

      {(showCompass || showLocate) && (
        <button
          onClick={handleLocate}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border-t border-white/5"
          title="Reset View"
          type="button"
        >
          <Compass className="w-4 h-4" />
        </button>
      )}

      {showFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          type="button"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
`;

// 3. map/index.js
const mapIndexContent = `export { Map, useMap, REGIONAL_DATA } from './Map';
export { MapControls } from './MapControls';
`;

// 4. audience.api.js
const audienceApiContent = `import axios from 'axios';

// In development, connect to TGS Tech Info backend running on port 5000 (or Taraj server proxy on 5001)
// In production, connect directly to https://tgstechinfo.net (or Taraj server proxy)
const TGS_API_BASE = import.meta.env.VITE_TGS_API_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://tgstechinfo.net');

// Verified fallback baseline data ensuring zero layout shift or loading freeze
export const FALLBACK_AUDIENCE_STATS = {
  matching_contacts: 80198440,
  matching_companies: 4250000,
  matching_countries_count: 195,
  matching_industries_count: 85,
  region_breakdown: [
    { region_code: 'NA', contact_count: 26500000 },
    { region_code: 'LATAM', contact_count: 8400000 },
    { region_code: 'EMEA', contact_count: 23200000 },
    { region_code: 'APAC', contact_count: 19900000 }
  ],
  country_breakdown: [
    { iso_code: 'US', country_name: 'United States', contact_count: 23499993, company_count: 1350000 },
    { iso_code: 'IN', country_name: 'India', contact_count: 9799988, company_count: 560000 },
    { iso_code: 'GB', country_name: 'United Kingdom', contact_count: 5740392, company_count: 320000 },
    { iso_code: 'DE', country_name: 'Germany', contact_count: 4889889, company_count: 280000 },
    { iso_code: 'FR', country_name: 'France', contact_count: 3508059, company_count: 190000 },
    { iso_code: 'BR', country_name: 'Brazil', contact_count: 3136867, company_count: 180000 },
    { iso_code: 'CA', country_name: 'Canada', contact_count: 3000004, company_count: 150000 },
    { iso_code: 'AU', country_name: 'Australia', contact_count: 2900012, company_count: 190000 },
    { iso_code: 'MX', country_name: 'Mexico', contact_count: 2479099, company_count: 140000 },
    { iso_code: 'JP', country_name: 'Japan', contact_count: 2200011, company_count: 190000 },
    { iso_code: 'NL', country_name: 'Netherlands', contact_count: 1800000, company_count: 110000 },
    { iso_code: 'IT', country_name: 'Italy', contact_count: 1500000, company_count: 95000 },
    { iso_code: 'SG', country_name: 'Singapore', contact_count: 1450000, company_count: 95000 },
    { iso_code: 'ES', country_name: 'Spain', contact_count: 1400000, company_count: 85000 },
    { iso_code: 'KR', country_name: 'South Korea', contact_count: 1100000, company_count: 75000 },
    { iso_code: 'SE', country_name: 'Sweden', contact_count: 920000, company_count: 55000 },
    { iso_code: 'CO', country_name: 'Colombia', contact_count: 920000, company_count: 55000 },
    { iso_code: 'AE', country_name: 'UAE', contact_count: 850000, company_count: 60000 },
    { iso_code: 'ID', country_name: 'Indonesia', contact_count: 850000, company_count: 50000 },
    { iso_code: 'SA', country_name: 'Saudi Arabia', contact_count: 680000, company_count: 45000 },
    { iso_code: 'MY', country_name: 'Malaysia', contact_count: 620000, company_count: 40000 },
    { iso_code: 'PE', country_name: 'Peru', contact_count: 580000, company_count: 35000 },
    { iso_code: 'ZA', country_name: 'South Africa', contact_count: 550000, company_count: 35000 },
    { iso_code: 'PH', country_name: 'Philippines', contact_count: 510000, company_count: 30000 },
    { iso_code: 'CL', country_name: 'Chile', contact_count: 470000, company_count: 28000 },
    { iso_code: 'AR', country_name: 'Argentina', contact_count: 410000, company_count: 25000 },
    { iso_code: 'NZ', country_name: 'New Zealand', contact_count: 320000, company_count: 20000 }
  ]
};

export const audienceAPI = {
  /**
   * Fetch live audience statistics from TGS Tech Info backend
   * Dynamically synchronized so changes in TGS backend immediately update Taraj Global
   */
  async getLiveStats() {
    // 1. Direct cross-origin request to TGS Tech Info backend
    try {
      const res = await axios.get(\`\${TGS_API_BASE}/api/audience/stats\`, {
        timeout: 5000,
        headers: { Accept: 'application/json' }
      });
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
    } catch (errDirect) {
      console.warn('Direct TGS audience API fetch failed, trying local proxy:', errDirect.message);
    }

    // 2. Fallback to Taraj server-side proxy
    try {
      const resProxy = await axios.get('/api/audience/stats', { timeout: 5000 });
      if (resProxy.data?.success && resProxy.data?.data) {
        return resProxy.data.data;
      }
    } catch (errProxy) {
      console.warn('Proxy audience fetch failed, using baseline:', errProxy.message);
    }

    // 3. Fallback to verified baseline snapshot
    return FALLBACK_AUDIENCE_STATS;
  }
};
`;

// 5. AudienceMap section component
const audienceSectionContent = `import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
  Globe,
  Users,
  Building2,
  Award,
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Map, MapControls, REGIONAL_DATA } from '@components/ui/map';
import { audienceAPI, FALLBACK_AUDIENCE_STATS } from '@api/audience.api';

export default function AudienceMapSection() {
  const [selectedRegionId, setSelectedRegionId] = useState('GLOBAL');
  const [stats, setStats] = useState(FALLBACK_AUDIENCE_STATS);
  const [isLiveSynced, setIsLiveSynced] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const data = await audienceAPI.getLiveStats();
        if (isMounted && data) {
          setStats(data);
          setIsLiveSynced(true);
        }
      } catch (err) {
        console.error('Failed to load audience stats for map:', err);
      }
    }
    loadStats();
    return () => { isMounted = false; };
  }, []);

  const totalContacts = stats?.matching_contacts || 80198440;
  const totalCompanies = stats?.matching_companies || 4250000;
  const totalCountries = stats?.matching_countries_count || 195;

  const contactsInMillions = totalContacts / 1000000;
  const companiesInMillions = totalCompanies / 1000000;

  const formattedHeadlineContacts = contactsInMillions >= 1
    ? \`\${contactsInMillions.toFixed(1).replace(/\\.0$/, '')} Million+\`
    : \`\${(totalContacts / 1000).toFixed(0)}K+\`;

  const formattedGlobalPill = contactsInMillions >= 1
    ? \`\${contactsInMillions.toFixed(1).replace(/\\.0$/, '')}M+\`
    : \`\${(totalContacts / 1000).toFixed(0)}K+\`;

  const keyMetrics = [
    {
      icon: Users,
      num: Number(contactsInMillions.toFixed(1)),
      decimals: contactsInMillions % 1 === 0 ? 0 : 1,
      suffix: 'M+',
      label: 'Verified Business Professionals',
      color: 'text-[#00A6FF]',
      iconBg: 'bg-[#00A6FF]/10 border-[#00A6FF]/20 text-[#00A6FF]',
      glowRgba: 'rgba(0, 166, 255, 0.25)',
      borderHover: 'hover:border-[#00A6FF]'
    },
    {
      icon: Building2,
      num: Number(companiesInMillions.toFixed(2)),
      decimals: 2,
      suffix: 'M+',
      label: 'Enterprise Target Accounts',
      color: 'text-[#FF6D00]',
      iconBg: 'bg-[#FF6D00]/10 border-[#FF6D00]/20 text-[#FF6D00]',
      glowRgba: 'rgba(255, 109, 0, 0.25)',
      borderHover: 'hover:border-[#FF6D00]'
    },
    {
      icon: Globe,
      num: totalCountries,
      decimals: 0,
      suffix: '+',
      label: 'Countries & Territories',
      color: 'text-[#10B981]',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-[#10B981]',
      glowRgba: 'rgba(16, 185, 129, 0.25)',
      borderHover: 'hover:border-[#10B981]'
    },
    {
      icon: Award,
      num: 82,
      decimals: 0,
      suffix: '%',
      label: 'CXO & VP Decision Authority',
      color: 'text-[#38BDF8]',
      iconBg: 'bg-sky-500/10 border-sky-500/20 text-[#38BDF8]',
      glowRgba: 'rgba(56, 189, 248, 0.25)',
      borderHover: 'hover:border-[#38BDF8]'
    }
  ];

  // Map region codes to counts
  const regionMap = {};
  if (stats?.region_breakdown) {
    stats.region_breakdown.forEach(r => {
      const codeKey = r.region_code === 'NORTH_AMERICA' ? 'NA' : r.region_code;
      regionMap[codeKey] = r.contact_count;
    });
  }

  // Dynamic Regional Pills with live numbers
  const dynamicRegionalData = REGIONAL_DATA.map(reg => {
    let rawCount = regionMap[reg.code];

    if (!rawCount && stats?.country_breakdown) {
      rawCount = stats.country_breakdown
        .filter(c => {
          if (reg.code === 'NA') return ['US', 'CA'].includes(c.iso_code);
          if (reg.code === 'LATAM') return ['BR', 'MX', 'CO', 'PE', 'CL', 'AR', 'VE', 'EC', 'GT', 'CU', 'BO', 'DOM', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY'].includes(c.iso_code);
          if (reg.code === 'EMEA') return ['GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'AE', 'SA', 'ZA', 'SE', 'CH', 'BE', 'AT', 'PL', 'IE', 'NO', 'DK', 'FI', 'PT', 'GR', 'CZ', 'RO', 'HU', 'IL', 'EG', 'TR', 'CY', 'QA', 'KW', 'OM', 'BH'].includes(c.iso_code);
          if (reg.code === 'APAC') return ['IN', 'AU', 'JP', 'SG', 'KR', 'ID', 'MY', 'PH', 'NZ', 'CN', 'TH', 'VN', 'TW', 'HK', 'PK', 'BD', 'LK'].includes(c.iso_code);
          return false;
        })
        .reduce((sum, item) => sum + (item.contact_count || 0), 0);
    }

    if (rawCount && rawCount > 0) {
      const formattedContacts = rawCount >= 1000000
        ? \`\${(rawCount / 1000000).toFixed(1).replace(/\\.0$/, '')}M+\`
        : \`\${Math.round(rawCount / 1000)}K+\`;
      return { ...reg, contacts: formattedContacts };
    }
    return reg;
  });

  return (
    <section id="reach" className="relative bg-[#050505] py-20 lg:py-28 overflow-hidden" aria-labelledby="reach-heading">
      {/* Background Subtle Tech Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-[#00A6FF]/10 blur-[140px]" />

      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[12px] font-mono font-semibold uppercase tracking-[0.16em] text-primary mb-3">
              <Compass className="w-4 h-4" />
              <span>04 — GLOBAL AUDIENCE INTELLIGENCE</span>
              {isLiveSynced && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans normal-case tracking-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Synced
                </span>
              )}
            </div>

            <h2 id="reach-heading" className="text-3xl sm:text-5xl font-black tracking-[-0.03em] leading-[1.08] text-white">
              Connect with{' '}
              <span className="bg-gradient-to-r from-[#00A6FF] via-[#33B8FF] to-[#FF6D00] bg-clip-text text-transparent">
                {formattedHeadlineContacts}
              </span>{' '}
              Decision Makers
            </h2>

            <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
              Real-time global B2B audience distribution across 195+ countries. Click on any continent pill or zoom in to inspect verified decision-maker counts.
            </p>
          </div>

          {/* Quick Regional Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedRegionId('GLOBAL')}
              className={\`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer \${
                selectedRegionId === 'GLOBAL'
                  ? 'bg-gradient-to-r from-[#00A6FF] to-[#0085CC] text-white border-[#00A6FF] shadow-[0_0_16px_rgba(0,166,255,0.4)]'
                  : 'bg-[#121212] border-white/10 text-slate-300 hover:border-[#00A6FF]'
              }\`}
            >
              🌍 Global ({formattedGlobalPill})
            </button>

            {dynamicRegionalData.map((reg) => (
              <button
                key={reg.id}
                type="button"
                onClick={() => setSelectedRegionId(reg.id)}
                className={\`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer \${
                  selectedRegionId === reg.id
                    ? 'bg-gradient-to-r from-[#00A6FF] to-[#0085CC] text-white border-[#00A6FF] shadow-[0_0_16px_rgba(0,166,255,0.4)]'
                    : 'bg-[#121212] border-white/10 text-slate-300 hover:border-[#00A6FF]'
                }\`}
              >
                {reg.code} <span className="text-[#FF6D00] font-mono">({reg.contacts})</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Key Metrics Bar ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {keyMetrics.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={\`relative overflow-hidden p-5 sm:p-6 rounded-2xl border backdrop-blur-md transition-all duration-300 bg-[#0C1424]/80 border-white/10 shadow-lg \${stat.borderHover}\`}
            >
              <div className="flex items-center gap-3.5">
                <div className={\`w-12 h-12 rounded-xl flex items-center justify-center border \${stat.iconBg} shrink-0\`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight flex items-baseline text-white">
                    <CountUp
                      end={stat.num}
                      decimals={stat.decimals}
                      duration={2.2}
                      separator=","
                      enableScrollSpy
                      scrollSpyOnce
                    />
                    <span className="text-primary">{stat.suffix}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 font-semibold leading-tight mt-0.5">
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Embedded World Map ── */}
        <div className="h-[480px] sm:h-[560px] w-full rounded-3xl overflow-hidden border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.8)]">
          <Map
            center={[10, 15]}
            activeRegion={selectedRegionId}
            onSelectRegion={(rId) => setSelectedRegionId(rId)}
            countryBreakdown={stats?.country_breakdown || []}
            className="h-full w-full"
          >
            <MapControls
              position="bottom-right"
              showZoom
              showCompass
              showLocate
              showFullscreen
            />
          </Map>
        </div>

        {/* Footer Note */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>GDPR, CCPA & CASL Compliant Verified Commercial Intelligence</span>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-1.5 text-primary hover:text-white font-semibold transition-colors"
          >
            Request audience breakdown for your ICP <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
`;

// 6. Taraj server audience routes
const serverAudienceRoutes = `import express from 'express';
const router = express.Router();

let cachedData = null;
let cacheExpiry = 0;

// URL of TGS Tech Info backend
const TGS_BACKEND_URL = process.env.TGS_API_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://tgstechinfo.net' : 'http://localhost:5000');

router.get('/stats', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedData && now < cacheExpiry) {
      return res.json({ success: true, cached: true, data: cachedData });
    }

    const response = await fetch(\`\${TGS_BACKEND_URL}/api/audience/stats\`, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(\`TGS API HTTP \${response.status}\`);
    }

    const json = await response.json();
    if (json.success && json.data) {
      cachedData = json.data;
      cacheExpiry = now + 60 * 1000; // 60s cache
      return res.json({ success: true, data: json.data });
    }

    throw new Error('Invalid payload from TGS API');
  } catch (err) {
    console.error('[Taraj Audience Proxy Error]:', err.message);
    if (cachedData) {
      return res.json({ success: true, cached: true, stale: true, data: cachedData });
    }
    return res.status(502).json({ success: false, error: 'Failed to retrieve audience statistics' });
  }
});

export default router;
`;

// Execute writes
const mapDir = path.join(TARAJ_ROOT, 'client/src/components/ui/map');
const sectionDir = path.join(TARAJ_ROOT, 'client/src/components/sections/AudienceMap');
const apiDir = path.join(TARAJ_ROOT, 'client/src/api');
const serverRoutesDir = path.join(TARAJ_ROOT, 'server/routes');

fs.mkdirSync(mapDir, { recursive: true });
fs.mkdirSync(sectionDir, { recursive: true });
fs.mkdirSync(apiDir, { recursive: true });
fs.mkdirSync(serverRoutesDir, { recursive: true });

fs.writeFileSync(path.join(mapDir, 'Map.jsx'), mapContent, 'utf8');
fs.writeFileSync(path.join(mapDir, 'MapControls.jsx'), mapControlsContent, 'utf8');
fs.writeFileSync(path.join(mapDir, 'index.js'), mapIndexContent, 'utf8');
fs.writeFileSync(path.join(apiDir, 'audience.api.js'), audienceApiContent, 'utf8');
fs.writeFileSync(path.join(sectionDir, 'index.jsx'), audienceSectionContent, 'utf8');
fs.writeFileSync(path.join(serverRoutesDir, 'audience.routes.js'), serverAudienceRoutes, 'utf8');

console.log('All files created successfully!');
