import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Tooltip, Tag } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  CompassOutlined,
  GlobalOutlined,
  ReloadOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';

// Region bounding boxes and camera presets for smooth animated zooming
const REGION_BOUNDS = {
  GLOBAL:        { viewBox: '0 0 1000 500', zoom: 1, label: 'Global Overview' },
  NORTH_AMERICA: { viewBox: '100 40 380 230', zoom: 2.4, label: 'North America' },
  LATAM:         { viewBox: '200 230 350 260', zoom: 2.2, label: 'Latin America' },
  EMEA:          { viewBox: '430 40 380 280', zoom: 2.2, label: 'Europe, Middle East & Africa' },
  DACH:          { viewBox: '470 80 160 140', zoom: 4.5, label: 'DACH (Germany, Austria, Switzerland)' },
  NORDICS:       { viewBox: '480 30 180 150', zoom: 4.0, label: 'Nordics' },
  APAC:          { viewBox: '600 80 380 320', zoom: 2.0, label: 'Asia-Pacific' },
  MENA:          { viewBox: '500 130 220 180', zoom: 3.2, label: 'Middle East & North Africa' }
};

// Regional summary totals for overlay cards
const REGION_SUMMARIES = [
  { code: 'NORTH_AMERICA', name: 'North America', count: '26.5M+', cx: 260, cy: 150, color: '#38BDF8', badgeColor: '#0284C7' },
  { code: 'LATAM',         name: 'LATAM',         count: '8.40M+', cx: 360, cy: 360, color: '#F59E0B', badgeColor: '#D97706' },
  { code: 'EMEA',          name: 'EMEA',          count: '23.2M+', cx: 540, cy: 150, color: '#A855F7', badgeColor: '#9333EA' },
  { code: 'APAC',          name: 'APAC',          count: '19.9M+', cx: 780, cy: 220, color: '#0AAEEF', badgeColor: '#0284C7' },
  { code: 'DACH',          name: 'DACH',          count: '6.30M+', cx: 520, cy: 115, color: '#10B981', badgeColor: '#059669' },
  { code: 'NORDICS',       name: 'Nordics',       count: '2.02M+', cx: 535, cy: 70,  color: '#EC4899', badgeColor: '#DB2777' },
];

// Major country coordinates mapped to SVG canvas (1000 x 500 Equirectangular projection)
const SVG_COUNTRY_NODES = [
  // LATAM (PPT Reference)
  { iso: 'BR', name: 'Brazil',        x: 370, y: 350, region: 'LATAM' },
  { iso: 'MX', name: 'Mexico',        x: 230, y: 220, region: 'LATAM' },
  { iso: 'CO', name: 'Colombia',      x: 300, y: 280, region: 'LATAM' },
  { iso: 'PE', name: 'Peru',          x: 290, y: 330, region: 'LATAM' },
  { iso: 'CL', name: 'Chile',         x: 320, y: 410, region: 'LATAM' },
  { iso: 'AR', name: 'Argentina',     x: 345, y: 420, region: 'LATAM' },
  { iso: 'CR', name: 'Costa Rica',    x: 270, y: 260, region: 'LATAM' },
  { iso: 'VE', name: 'Venezuela',     x: 320, y: 265, region: 'LATAM' },
  { iso: 'EC', name: 'Ecuador',       x: 280, y: 300, region: 'LATAM' },
  { iso: 'BO', name: 'Bolivia',       x: 330, y: 355, region: 'LATAM' },

  // North America
  { iso: 'US', name: 'United States', x: 240, y: 155, region: 'NORTH_AMERICA' },
  { iso: 'CA', name: 'Canada',        x: 250, y: 95,  region: 'NORTH_AMERICA' },

  // APAC
  { iso: 'IN', name: 'India',         x: 720, y: 220, region: 'APAC' },
  { iso: 'AU', name: 'Australia',     x: 870, y: 390, region: 'APAC' },
  { iso: 'SG', name: 'Singapore',     x: 790, y: 275, region: 'APAC' },
  { iso: 'JP', name: 'Japan',         x: 885, y: 175, region: 'APAC' },
  { iso: 'KR', name: 'South Korea',   x: 855, y: 175, region: 'APAC' },
  { iso: 'ID', name: 'Indonesia',     x: 815, y: 305, region: 'APAC' },
  { iso: 'MY', name: 'Malaysia',      x: 780, y: 265, region: 'APAC' },
  { iso: 'PH', name: 'Philippines',   x: 835, y: 245, region: 'APAC' },
  { iso: 'NZ', name: 'New Zealand',   x: 940, y: 430, region: 'APAC' },
  { iso: 'VN', name: 'Vietnam',       x: 795, y: 240, region: 'APAC' },

  // EMEA / DACH / Nordics
  { iso: 'GB', name: 'United Kingdom',x: 485, y: 110, region: 'EMEA' },
  { iso: 'DE', name: 'Germany',       x: 520, y: 115, region: 'EMEA' },
  { iso: 'FR', name: 'France',        x: 495, y: 135, region: 'EMEA' },
  { iso: 'NL', name: 'Netherlands',   x: 505, y: 112, region: 'EMEA' },
  { iso: 'IT', name: 'Italy',         x: 525, y: 150, region: 'EMEA' },
  { iso: 'ES', name: 'Spain',         x: 475, y: 160, region: 'EMEA' },
  { iso: 'AT', name: 'Austria',       x: 535, y: 130, region: 'EMEA' },
  { iso: 'CH', name: 'Switzerland',   x: 512, y: 132, region: 'EMEA' },
  { iso: 'SE', name: 'Sweden',        x: 540, y: 70,  region: 'EMEA' },
  { iso: 'NO', name: 'Norway',        x: 515, y: 65,  region: 'EMEA' },
  { iso: 'DK', name: 'Denmark',       x: 520, y: 92,  region: 'EMEA' },
  { iso: 'FI', name: 'Finland',       x: 565, y: 60,  region: 'EMEA' },
  { iso: 'AE', name: 'UAE',           x: 645, y: 215, region: 'EMEA' },
  { iso: 'SA', name: 'Saudi Arabia',  x: 620, y: 215, region: 'EMEA' },
  { iso: 'ZA', name: 'South Africa',  x: 560, y: 400, region: 'EMEA' },
];

export default function AudienceMap({
  countryBreakdown = [],
  selectedRegion = 'GLOBAL',
  selectedCountry = null,
  onSelectRegion = () => {},
  onSelectCountry = () => {},
  darkMode = true
}) {
  const [currentRegion, setCurrentRegion] = useState(selectedRegion || 'GLOBAL');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Sync external region filter
  useEffect(() => {
    if (selectedRegion) {
      setCurrentRegion(selectedRegion);
    }
  }, [selectedRegion]);

  const activePreset = REGION_BOUNDS[currentRegion] || REGION_BOUNDS.GLOBAL;
  const isZoomed = currentRegion !== 'GLOBAL' || zoomLevel > 1.4;

  const handleRegionClick = (regionCode) => {
    setCurrentRegion(regionCode);
    onSelectRegion(regionCode);
  };

  const handleResetZoom = () => {
    setCurrentRegion('GLOBAL');
    setZoomLevel(1);
    onSelectRegion('GLOBAL');
    onSelectCountry(null);
  };

  // Merge SVG nodes with live database counts
  const enrichedCountryNodes = SVG_COUNTRY_NODES.map(node => {
    const dbMatch = countryBreakdown.find(c => c.iso_code === node.iso);
    return {
      ...node,
      contact_count: dbMatch?.contact_count || 0,
      percentage: dbMatch?.percentage || 0,
      companies_count: dbMatch?.company_count || 0
    };
  });

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 16, overflow: 'hidden', background: '#070D18', border: '1px solid rgba(30, 58, 102, 0.55)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
      
      {/* ── Top Regional Selector Navigation Bar ── */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(30, 58, 102, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, background: 'rgba(10, 20, 38, 0.85)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>
            Regions:
          </span>

          <button
            onClick={() => handleRegionClick('GLOBAL')}
            className={`aud-filter-pill ${currentRegion === 'GLOBAL' ? 'active' : ''}`}
            style={{ fontSize: '0.75rem', padding: '4px 12px' }}
          >
            🌍 Global View
          </button>

          {['NORTH_AMERICA', 'LATAM', 'EMEA', 'DACH', 'NORDICS', 'APAC'].map(code => {
            const sum = REGION_SUMMARIES.find(r => r.code === code);
            const isActive = currentRegion === code;
            return (
              <button
                key={code}
                onClick={() => handleRegionClick(code)}
                className={`aud-filter-pill ${isActive ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', padding: '4px 12px' }}
              >
                {sum?.name || code} <span style={{ color: isActive ? '#FFFFFF' : '#0AAEEF', fontWeight: 700, marginLeft: 3 }}>({sum?.count})</span>
              </button>
            );
          })}
        </div>

        {/* Zoom & Reset Controls */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {currentRegion !== 'GLOBAL' && (
            <Tag color="cyan" style={{ borderRadius: 12, fontWeight: 700, margin: 0, padding: '2px 8px' }}>
              Viewing: {activePreset.label}
            </Tag>
          )}

          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={handleResetZoom}
            style={{ background: 'rgba(15, 26, 48, 0.8)', borderColor: 'rgba(255, 255, 255, 0.15)', color: '#F8FAFC', borderRadius: 8, fontSize: '0.75rem' }}
          >
            Reset Map
          </Button>
        </div>
      </div>

      {/* ── Main Interactive SVG Map Viewport ── */}
      <div style={{ position: 'relative', width: '100%', height: '520px', overflow: 'hidden' }}>
        <svg
          viewBox={activePreset.viewBox}
          style={{
            width: '100%',
            height: '100%',
            transition: 'viewBox 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
            cursor: 'grab'
          }}
        >
          <defs>
            {/* Ambient Background Gradient */}
            <radialGradient id="mapOceanGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0B172C" />
              <stop offset="100%" stopColor="#050B15" />
            </radialGradient>

            {/* Glowing Region Gradients */}
            <radialGradient id="glowCyan" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0AAEEF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0AAEEF" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glowAmber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F7941D" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#F7941D" stopOpacity="0" />
            </radialGradient>

            {/* Pattern Grid */}
            <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(10, 174, 239, 0.05)" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Ocean & Background Grid */}
          <rect width="1000" height="500" fill="url(#mapOceanGrad)" />
          <rect width="1000" height="500" fill="url(#mapGrid)" />

          {/* ── Stylized World Continent Landmass Outlines ── */}
          <g fill="rgba(18, 36, 68, 0.75)" stroke="rgba(10, 174, 239, 0.3)" strokeWidth="0.8" strokeLinejoin="round">
            {/* North America */}
            <path d="M 120 70 L 160 50 L 250 45 L 300 70 L 330 110 L 290 180 L 240 210 L 200 230 L 170 190 L 140 130 Z" />
            <path d="M 280 50 L 360 40 L 390 80 L 320 85 Z" />

            {/* Latin America (LATAM) */}
            <path d="M 260 250 L 310 240 L 360 270 L 410 330 L 390 420 L 340 470 L 310 420 L 280 340 L 250 280 Z" />

            {/* Europe */}
            <path d="M 460 70 L 520 60 L 560 80 L 550 140 L 500 160 L 460 140 L 450 100 Z" />
            {/* UK & Ireland */}
            <path d="M 460 95 L 485 85 L 485 115 L 465 120 Z" />
            {/* Scandinavia */}
            <path d="M 500 40 L 550 35 L 560 80 L 520 85 Z" />

            {/* Africa */}
            <path d="M 470 180 L 550 170 L 600 230 L 590 320 L 550 420 L 500 380 L 460 270 L 450 210 Z" />

            {/* Asia */}
            <path d="M 570 70 L 700 60 L 880 90 L 920 160 L 890 240 L 790 280 L 710 270 L 680 230 L 600 170 Z" />

            {/* India Subcontinent */}
            <path d="M 680 190 L 740 190 L 730 270 L 700 280 L 680 230 Z" fill="rgba(24, 48, 88, 0.85)" stroke="rgba(10, 174, 239, 0.5)" />

            {/* Australia & Oceania */}
            <path d="M 800 340 L 900 330 L 920 410 L 840 430 L 790 390 Z" />
            <path d="M 925 415 L 945 410 L 950 440 L 930 445 Z" />
          </g>

          {/* ── Global View: Regional Count Cards (Shown when in Global overview) ── */}
          {!isZoomed && REGION_SUMMARIES.map(reg => (
            <g
              key={reg.code}
              transform={`translate(${reg.cx}, ${reg.cy})`}
              onClick={() => handleRegionClick(reg.code)}
              style={{ cursor: 'pointer' }}
            >
              {/* Pulsing Beacon Glow */}
              <circle r="36" fill={`url(#glowCyan)`} />
              <circle r="18" fill="rgba(8, 17, 34, 0.92)" stroke={reg.color} strokeWidth="1.5" />
              
              {/* Text Count Label */}
              <rect x="-48" y="-30" width="96" height="22" rx="11" fill="rgba(8, 17, 34, 0.95)" stroke={reg.color} strokeWidth="1" />
              <text x="0" y="-15" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800" fontFamily="Plus Jakarta Sans">
                {reg.name}: <tspan fill="#0AAEEF">{reg.count}</tspan>
              </text>

              {/* Pin Center Dot */}
              <circle r="4" fill={reg.color} />
            </g>
          ))}

          {/* ── Zoomed View: Granular Country-wise Count Pins ── */}
          {enrichedCountryNodes.map(country => {
            const isVisible = !isZoomed || country.region === currentRegion || currentRegion === 'GLOBAL';
            if (!isVisible) return null;

            const isSelected = selectedCountry === country.iso;
            const hasData = country.contact_count > 0;
            const pinColor = country.region === 'LATAM' ? '#F7941D' : '#0AAEEF';

            return (
              <g
                key={country.iso}
                transform={`translate(${country.x}, ${country.y})`}
                onClick={() => onSelectCountry(country.iso)}
                onMouseEnter={() => setHoveredNode(country)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Outer Glow Ring */}
                <circle
                  r={isZoomed ? 12 : 7}
                  fill={isSelected ? 'rgba(247, 148, 29, 0.4)' : 'rgba(10, 174, 239, 0.25)'}
                />

                {/* Country Node Circle */}
                <circle
                  r={isZoomed ? 6 : 4}
                  fill={isSelected ? '#F7941D' : pinColor}
                  stroke="#FFFFFF"
                  strokeWidth={isZoomed ? 1.5 : 1}
                />

                {/* Direct Country Count Pill (Visible on Zoom) */}
                {isZoomed && hasData && (
                  <g transform="translate(0, -14)">
                    <rect
                      x="-38"
                      y="-12"
                      width="76"
                      height="18"
                      rx="9"
                      fill="rgba(8, 17, 34, 0.94)"
                      stroke={isSelected ? '#F7941D' : 'rgba(10, 174, 239, 0.7)'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="1"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="7.5"
                      fontWeight="700"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {country.iso}: <tspan fill={isSelected ? '#FBBF24' : '#38BDF8'}>{(country.contact_count / 1000000).toFixed(2)}M</tspan>
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── Hover Tooltip Card ── */}
        {hoveredNode && (
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(8, 17, 34, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(10, 174, 239, 0.5)',
              borderRadius: '12px',
              padding: '12px 18px',
              minWidth: '220px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
              pointerEvents: 'none',
              animation: 'fadeIn .2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#FFFFFF' }}>
                {hoveredNode.name}
              </span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#0AAEEF', background: 'rgba(10,174,239,0.15)', padding: '1px 6px', borderRadius: 4 }}>
                {hoveredNode.iso}
              </span>
            </div>

            <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: 4 }}>
              Total Contacts: <strong style={{ color: '#F7941D', fontSize: '0.9375rem', fontFamily: 'JetBrains Mono, monospace' }}>{(hoveredNode.contact_count || 0).toLocaleString()}</strong>
            </div>

            {hoveredNode.companies_count > 0 && (
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                Target Accounts: {(hoveredNode.companies_count || 0).toLocaleString()} Companies
              </div>
            )}

            <div style={{ fontSize: '0.6875rem', color: '#38BDF8', marginTop: 6 }}>
              💡 Click node to drill down into country demographic charts
            </div>
          </div>
        )}

        {/* ── Bottom Map Legend & Instruction ── */}
        <div style={{ position: 'absolute', bottom: 14, left: 18, display: 'flex', gap: 14, alignItems: 'center', background: 'rgba(10, 20, 38, 0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(30, 58, 102, 0.4)', borderRadius: 20, padding: '4px 14px', fontSize: '0.6875rem', color: '#94A3B8' }}>
          <span>👆 Click any region or country to zoom & filter</span>
          <span>•</span>
          <span>📍 Real-Time B2B Demographic Densities</span>
        </div>
      </div>
    </div>
  );
}
