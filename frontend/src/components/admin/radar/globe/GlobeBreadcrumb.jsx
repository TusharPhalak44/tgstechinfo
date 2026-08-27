import React from 'react';
import { GlobalOutlined, RightOutlined } from '@ant-design/icons';
import { BUSINESS_REGIONS, COUNTRY_REGISTRY } from '../../../../config/geographicHierarchy';

export default function GlobeBreadcrumb({
  selectedRegion = null,
  selectedCountry = null,
  selectedCity = null,
  onSelectLevel = () => {},
  darkMode = true
}) {
  const regionInfo = selectedRegion ? BUSINESS_REGIONS[selectedRegion] : null;
  const countryInfo = selectedCountry ? (COUNTRY_REGISTRY[selectedCountry] || { name: selectedCountry, flag: '🌐' }) : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: darkMode ? 'rgba(8, 17, 34, 0.85)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        border: darkMode ? '1px solid rgba(30, 58, 102, 0.6)' : '1px solid rgba(226, 232, 240, 0.9)',
        borderRadius: 12,
        padding: '6px 14px',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: darkMode ? '#F1F5F9' : '#0B1F4D',
        boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.5)' : '0 4px 16px rgba(11,31,77,0.08)',
        zIndex: 15,
        userSelect: 'none'
      }}
    >
      {/* World Root */}
      <button
        onClick={() => onSelectLevel('world')}
        style={{
          background: !selectedRegion && !selectedCountry ? 'rgba(10, 174, 239, 0.2)' : 'transparent',
          color: !selectedRegion && !selectedCountry ? '#0AAEEF' : (darkMode ? '#94A3B8' : '#64748B'),
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 8px',
          borderRadius: 6,
          fontWeight: 700,
          transition: 'all 0.2s ease'
        }}
      >
        <GlobalOutlined />
        <span>WORLD</span>
      </button>

      {/* Region Level */}
      {selectedRegion && (
        <>
          <RightOutlined style={{ fontSize: 9, color: darkMode ? '#475569' : '#94A3B8' }} />
          <button
            onClick={() => onSelectLevel('region', selectedRegion)}
            style={{
              background: !selectedCountry ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
              color: !selectedCountry ? '#A855F7' : (darkMode ? '#94A3B8' : '#64748B'),
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              borderRadius: 6,
              fontWeight: 700,
              transition: 'all 0.2s ease'
            }}
          >
            <span>{regionInfo?.name || selectedRegion}</span>
          </button>
        </>
      )}

      {/* Country Level */}
      {selectedCountry && (
        <>
          <RightOutlined style={{ fontSize: 9, color: darkMode ? '#475569' : '#94A3B8' }} />
          <button
            onClick={() => onSelectLevel('country', selectedCountry)}
            style={{
              background: !selectedCity ? 'rgba(247, 148, 29, 0.2)' : 'transparent',
              color: !selectedCity ? '#F7941D' : (darkMode ? '#94A3B8' : '#64748B'),
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              borderRadius: 6,
              fontWeight: 700,
              transition: 'all 0.2s ease'
            }}
          >
            <span>{countryInfo?.flag}</span>
            <span>{countryInfo?.name}</span>
          </button>
        </>
      )}

      {/* City Level */}
      {selectedCity && (
        <>
          <RightOutlined style={{ fontSize: 9, color: darkMode ? '#475569' : '#94A3B8' }} />
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10B981',
              padding: '3px 8px',
              borderRadius: 6,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>📍 {selectedCity}</span>
          </div>
        </>
      )}
    </div>
  );
}
