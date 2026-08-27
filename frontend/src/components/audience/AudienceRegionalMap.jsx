import React, { useState, useEffect } from 'react';
import { Tag, Button, Tooltip, Row, Col } from 'antd';
import {
  GlobalOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

// Geographic Regional Definitions with SVG vector polygons and metadata
const REGIONAL_POLYGONS = [
  {
    id: 'NORTH_AMERICA',
    name: 'North America',
    contacts: '26.5M+',
    companies: '1.45M+',
    countriesCount: '2 Countries (USA, Canada)',
    color: '#0284C7',
    hoverColor: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.4)',
    center: { x: 230, y: 130 },
    viewBox: '70 30 420 250',
    // Realistic continent boundary paths
    paths: [
      // Alaska & Canada & US mainland
      "M 90 70 L 120 50 L 170 35 L 230 30 L 290 40 L 330 65 L 360 85 L 340 120 L 300 140 L 295 195 L 255 215 L 210 230 L 180 205 L 145 160 L 115 130 Z",
      // Greenland
      "M 330 30 L 390 20 L 410 50 L 380 75 L 340 70 Z",
      // Mexico
      "M 210 230 L 245 220 L 275 250 L 285 270 L 250 280 L 220 260 Z"
    ]
  },
  {
    id: 'LATAM',
    name: 'Latin America (LATAM)',
    contacts: '8.40M+',
    companies: '480K+',
    countriesCount: '10+ Countries (Brazil, Mexico, Colombia, Peru, Chile, Argentina, etc.)',
    color: '#D97706',
    hoverColor: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.4)',
    center: { x: 340, y: 350 },
    viewBox: '190 210 330 280',
    paths: [
      // Central America & Caribbean
      "M 250 270 L 285 260 L 320 270 L 295 290 L 260 285 Z",
      // South America Mainland (Brazil, Andes, Patagonia)
      "M 290 290 L 340 280 L 390 300 L 430 340 L 415 390 L 380 430 L 345 480 L 320 460 L 305 380 L 280 330 Z"
    ]
  },
  {
    id: 'EMEA',
    name: 'Europe, Middle East & Africa (EMEA)',
    contacts: '23.2M+',
    companies: '1.28M+',
    countriesCount: '35+ Countries (UK, Germany, France, UAE, Saudi Arabia, South Africa)',
    color: '#7C3AED',
    hoverColor: '#A855F7',
    glow: 'rgba(168, 85, 247, 0.4)',
    center: { x: 530, y: 220 },
    viewBox: '420 30 360 440',
    paths: [
      // Western & Eastern Europe
      "M 460 70 L 510 55 L 565 65 L 580 110 L 555 145 L 500 155 L 460 135 L 450 95 Z",
      // UK & Ireland
      "M 455 90 L 480 80 L 485 110 L 460 115 Z",
      // Middle East & Levant
      "M 580 150 L 640 160 L 665 210 L 620 230 L 585 190 Z",
      // Africa Continent
      "M 470 170 L 565 160 L 615 220 L 600 310 L 565 430 L 510 390 L 470 280 L 455 210 Z"
    ]
  },
  {
    id: 'APAC',
    name: 'Asia-Pacific (APAC)',
    contacts: '19.9M+',
    companies: '1.12M+',
    countriesCount: '15+ Countries (India, Australia, Singapore, Japan, Korea, Indonesia)',
    color: '#0284C7',
    hoverColor: '#0AAEEF',
    glow: 'rgba(10, 174, 239, 0.4)',
    center: { x: 770, y: 240 },
    viewBox: '580 40 410 420',
    paths: [
      // Asia Mainland & Russia & China
      "M 580 65 L 700 50 L 870 70 L 920 130 L 910 210 L 820 260 L 740 260 L 680 230 L 600 160 Z",
      // India Subcontinent
      "M 685 185 L 745 185 L 735 270 L 700 285 L 680 230 Z",
      // Japan Islands
      "M 885 150 L 910 145 L 905 190 L 880 185 Z",
      // Southeast Asia Archipelagos (Indonesia, Philippines, Malaysia)
      "M 770 270 L 840 260 L 850 310 L 780 320 Z",
      // Australia & New Zealand
      "M 810 340 L 910 330 L 925 410 L 850 435 L 800 395 Z",
      "M 930 415 L 950 410 L 955 445 L 935 450 Z"
    ]
  }
];

// Top individual country breakdowns by region
const REGION_COUNTRIES = {
  NORTH_AMERICA: [
    { name: 'United States', code: 'US', contacts: '23,500,000+', share: '88.7%' },
    { name: 'Canada', code: 'CA', contacts: '3,000,000+', share: '11.3%' }
  ],
  LATAM: [
    { name: 'Brazil', code: 'BR', contacts: '3,100,000+', share: '36.9%' },
    { name: 'Mexico', code: 'MX', contacts: '2,450,000+', share: '29.2%' },
    { name: 'Colombia', code: 'CO', contacts: '920,000+', share: '10.9%' },
    { name: 'Peru', code: 'PE', contacts: '580,000+', share: '6.9%' },
    { name: 'Chile', code: 'CL', contacts: '470,000+', share: '5.6%' },
    { name: 'Argentina', code: 'AR', contacts: '410,000+', share: '4.9%' },
    { name: 'Costa Rica', code: 'CR', contacts: '190,000+', share: '2.3%' },
    { name: 'Ecuador', code: 'EC', contacts: '130,000+', share: '1.5%' },
    { name: 'Venezuela', code: 'VE', contacts: '95,000+', share: '1.1%' },
    { name: 'Bolivia', code: 'BO', contacts: '55,000+', share: '0.7%' }
  ],
  EMEA: [
    { name: 'United Kingdom', code: 'GB', contacts: '5,400,000+', share: '23.3%' },
    { name: 'Germany', code: 'DE', contacts: '4,600,000+', share: '19.8%' },
    { name: 'France', code: 'FR', contacts: '3,300,000+', share: '14.2%' },
    { name: 'Netherlands', code: 'NL', contacts: '1,800,000+', share: '7.8%' },
    { name: 'Italy', code: 'IT', contacts: '1,500,000+', share: '6.5%' },
    { name: 'Spain', code: 'ES', contacts: '1,400,000+', share: '6.0%' },
    { name: 'Switzerland', code: 'CH', contacts: '980,000+', share: '4.2%' },
    { name: 'Sweden', code: 'SE', contacts: '920,000+', share: '4.0%' },
    { name: 'UAE', code: 'AE', contacts: '850,000+', share: '3.7%' },
    { name: 'Saudi Arabia', code: 'SA', contacts: '680,000+', share: '2.9%' },
    { name: 'South Africa', code: 'ZA', contacts: '550,000+', share: '2.4%' }
  ],
  APAC: [
    { name: 'India', code: 'IN', contacts: '9,800,000+', share: '49.2%' },
    { name: 'Australia', code: 'AU', contacts: '2,900,000+', share: '14.6%' },
    { name: 'Japan', code: 'JP', contacts: '2,200,000+', share: '11.1%' },
    { name: 'Singapore', code: 'SG', contacts: '1,450,000+', share: '7.3%' },
    { name: 'South Korea', code: 'KR', contacts: '1,100,000+', share: '5.5%' },
    { name: 'Indonesia', code: 'ID', contacts: '850,000+', share: '4.3%' },
    { name: 'Malaysia', code: 'MY', contacts: '620,000+', share: '3.1%' },
    { name: 'Philippines', code: 'PH', contacts: '510,000+', share: '2.6%' },
    { name: 'New Zealand', code: 'NZ', contacts: '320,000+', share: '1.6%' }
  ]
};

export default function AudienceRegionalMap({
  selectedRegion = 'GLOBAL',
  onSelectRegion = () => {},
  darkMode = true
}) {
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [activeRegion, setActiveRegion] = useState(selectedRegion || 'GLOBAL');

  useEffect(() => {
    setActiveRegion(selectedRegion || 'GLOBAL');
  }, [selectedRegion]);

  const activeRegionObj = REGIONAL_POLYGONS.find(r => r.id === activeRegion);
  const currentViewBox = activeRegionObj ? activeRegionObj.viewBox : '0 0 1000 500';
  const isZoomed = activeRegion !== 'GLOBAL' && Boolean(activeRegionObj);

  const handleRegionClick = (regId) => {
    const next = activeRegion === regId ? 'GLOBAL' : regId;
    setActiveRegion(next);
    onSelectRegion(next);
  };

  const handleReset = () => {
    setActiveRegion('GLOBAL');
    onSelectRegion('GLOBAL');
  };

  // Theme Palette Tokens
  const oceanBg = darkMode ? '#070E1A' : '#F1F5F9';
  const gridStroke = darkMode ? 'rgba(10, 174, 239, 0.06)' : 'rgba(11, 31, 77, 0.05)';
  const landDefaultFill = darkMode ? '#10223D' : '#E2E8F0';
  const landDefaultStroke = darkMode ? 'rgba(30, 58, 102, 0.7)' : '#CBD5E1';
  const cardBg = darkMode ? 'rgba(13, 24, 44, 0.88)' : '#FFFFFF';
  const cardBorder = darkMode ? 'rgba(30, 58, 102, 0.6)' : '#E2E8F0';
  const textPrimary = darkMode ? '#F8FAFC' : '#0F172A';
  const textMuted = darkMode ? '#94A3B8' : '#64748B';

  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, overflow: 'hidden', boxShadow: darkMode ? '0 16px 48px rgba(0,0,0,0.5)' : '0 12px 36px rgba(11,31,77,0.08)' }}>
      
      {/* ── Top Regional Selector Bar ── */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: darkMode ? 'rgba(10, 20, 38, 0.75)' : '#F8FAFC' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>
            Geographic Regions:
          </span>

          <button
            onClick={() => handleRegionClick('GLOBAL')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 14px',
              borderRadius: 20,
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: activeRegion === 'GLOBAL' ? '1.5px solid #0AAEEF' : `1px solid ${cardBorder}`,
              background: activeRegion === 'GLOBAL' ? (darkMode ? 'rgba(10, 174, 239, 0.2)' : '#EAF2FF') : (darkMode ? 'rgba(15, 30, 56, 0.5)' : '#FFFFFF'),
              color: activeRegion === 'GLOBAL' ? (darkMode ? '#38BDF8' : '#0284C7') : textPrimary,
              transition: 'all .2s ease'
            }}
          >
            🌍 Global Universe (78M+)
          </button>

          {REGIONAL_POLYGONS.map(reg => {
            const isSelected = activeRegion === reg.id;
            return (
              <button
                key={reg.id}
                onClick={() => handleRegionClick(reg.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  borderRadius: 20,
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? `1.5px solid ${reg.color}` : `1px solid ${cardBorder}`,
                  background: isSelected ? (darkMode ? `${reg.color}25` : '#EAF2FF') : (darkMode ? 'rgba(15, 30, 56, 0.5)' : '#FFFFFF'),
                  color: isSelected ? (darkMode ? '#FFFFFF' : reg.color) : textPrimary,
                  transition: 'all .2s ease'
                }}
              >
                <span>{reg.name.split(' ')[0]}</span>
                <span style={{ color: reg.color, fontWeight: 800 }}>({reg.contacts})</span>
              </button>
            );
          })}
        </div>

        {isZoomed && (
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={handleReset}
            style={{ borderRadius: 8, fontWeight: 600, fontSize: '0.75rem' }}
          >
            Reset World View
          </Button>
        )}
      </div>

      {/* ── Interactive Vector Regional Map Canvas ── */}
      <div style={{ position: 'relative', width: '100%', height: '480px', overflow: 'hidden' }}>
        <svg
          viewBox={currentViewBox}
          style={{
            width: '100%',
            height: '100%',
            transition: 'viewBox 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
            cursor: 'pointer'
          }}
        >
          <defs>
            <pattern id="regionalGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke={gridStroke} strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Ocean Base */}
          <rect width="1000" height="500" fill={oceanBg} />
          <rect width="1000" height="500" fill="url(#regionalGrid)" />

          {/* Regional Vector Polygons */}
          {REGIONAL_POLYGONS.map(reg => {
            const isSelected = activeRegion === reg.id;
            const isHovered = hoveredRegion === reg.id;

            const fillColor = isSelected
              ? (darkMode ? `${reg.color}40` : `${reg.color}20`)
              : isHovered
              ? (darkMode ? `${reg.hoverColor}30` : `${reg.color}15`)
              : landDefaultFill;

            const strokeColor = isSelected || isHovered
              ? reg.hoverColor
              : landDefaultStroke;

            const strokeWidth = isSelected ? 2.2 : isHovered ? 1.8 : 1.0;

            return (
              <g
                key={reg.id}
                onClick={() => handleRegionClick(reg.id)}
                onMouseEnter={() => setHoveredRegion(reg.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                style={{ transition: 'all 0.3s ease' }}
              >
                {reg.paths.map((p, idx) => (
                  <path
                    key={idx}
                    d={p}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                    style={{ transition: 'all 0.3s ease' }}
                  />
                ))}

                {/* Region Floating Badge Label (Shown on Map) */}
                {(!isZoomed || isSelected) && (
                  <g transform={`translate(${reg.center.x}, ${reg.center.y})`}>
                    <circle
                      r={isSelected ? 32 : 24}
                      fill={reg.color}
                      opacity={isSelected ? 0.25 : 0.15}
                    />
                    <circle
                      r={isSelected ? 10 : 8}
                      fill={reg.color}
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                    />

                    {/* Badge Pill */}
                    <g transform="translate(0, -22)">
                      <rect
                        x="-54"
                        y="-12"
                        width="108"
                        height="24"
                        rx="12"
                        fill={darkMode ? '#0B172C' : '#FFFFFF'}
                        stroke={reg.color}
                        strokeWidth="1.5"
                        filter="drop-shadow(0 4px 8px rgba(0,0,0,0.25))"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill={textPrimary}
                        fontSize="9"
                        fontWeight="800"
                        fontFamily="Plus Jakarta Sans, sans-serif"
                      >
                        {reg.name.split(' ')[0]}: <tspan fill={reg.color} fontWeight="800">{reg.contacts}</tspan>
                      </text>
                    </g>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── Interactive Regional Info Card Overlay ── */}
        {hoveredRegion && !isZoomed && (
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: darkMode ? 'rgba(8, 17, 34, 0.95)' : '#FFFFFF',
              border: `1.5px solid ${REGIONAL_POLYGONS.find(r => r.id === hoveredRegion)?.color || '#0AAEEF'}`,
              borderRadius: 14,
              padding: '14px 18px',
              minWidth: 260,
              boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
              pointerEvents: 'none',
              animation: 'fadeIn .2s ease'
            }}
          >
            {(() => {
              const info = REGIONAL_POLYGONS.find(r => r.id === hoveredRegion);
              if (!info) return null;
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: textPrimary }}>
                      {info.name}
                    </span>
                    <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>
                      {info.id}
                    </Tag>
                  </div>

                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: info.color, margin: '6px 0 2px 0', fontFamily: 'JetBrains Mono, monospace' }}>
                    {info.contacts} <span style={{ fontSize: '0.75rem', color: textMuted, fontWeight: 600 }}>Contacts</span>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: textMuted, marginBottom: 8 }}>
                    Accounts: <strong>{info.companies}</strong> Companies
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#0AAEEF', fontWeight: 600 }}>
                    👆 Click to zoom in and explore country breakdowns
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Bottom Map Legend ── */}
        <div style={{ position: 'absolute', bottom: 12, left: 16, display: 'flex', gap: 12, alignItems: 'center', background: darkMode ? 'rgba(10, 20, 38, 0.8)' : 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', border: `1px solid ${cardBorder}`, borderRadius: 20, padding: '4px 12px', fontSize: '0.6875rem', color: textMuted }}>
          <span>🗺️ Vector Regional Geography</span>
          <span>•</span>
          <span>Click any continent to drill into country data</span>
        </div>
      </div>

      {/* ── Zoomed Regional Country Breakdown Table (Displayed when region is clicked) ── */}
      {isZoomed && activeRegionObj && REGION_COUNTRIES[activeRegion] && (
        <div style={{ padding: '20px 24px', borderTop: `1px solid ${cardBorder}`, background: darkMode ? 'rgba(10, 20, 38, 0.6)' : '#FAFCFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: textPrimary }}>
                {activeRegionObj.name} — Verified Country Coverage Breakdown
              </h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: textMuted }}>
                {activeRegionObj.countriesCount} • Total Database: <strong style={{ color: activeRegionObj.color }}>{activeRegionObj.contacts}</strong>
              </p>
            </div>

            <Button size="small" onClick={handleReset} style={{ borderRadius: 6 }}>
              Back to Global View
            </Button>
          </div>

          {/* Country Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {REGION_COUNTRIES[activeRegion].map(c => (
              <div
                key={c.code}
                style={{
                  background: darkMode ? 'rgba(15, 30, 56, 0.7)' : '#FFFFFF',
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all .2s ease'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: textPrimary }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: textMuted }}>
                    ISO: {c.code} • Share: {c.share}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: activeRegionObj.color, fontFamily: 'JetBrains Mono, monospace' }}>
                    {c.contacts}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
