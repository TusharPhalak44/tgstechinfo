import React from 'react';
import { 
  UserOutlined, 
  EyeOutlined, 
  ThunderboltOutlined, 
  FieldTimeOutlined, 
  RiseOutlined, 
  EnvironmentOutlined 
} from '@ant-design/icons';
import { formatMetric, BUSINESS_REGIONS, COUNTRY_REGISTRY } from '../../../../config/geographicHierarchy';

export default function GeographicAnalyticsSummary({
  level = 'world', // 'world' | 'region' | 'country' | 'city'
  selectedRegion = null,
  selectedCountry = null,
  selectedCity = null,
  data = {},
  darkMode = true,
  onSelectCity = () => {}
}) {
  const regionInfo = selectedRegion ? BUSINESS_REGIONS[selectedRegion] : null;
  const countryInfo = selectedCountry ? (COUNTRY_REGISTRY[selectedCountry] || { name: selectedCountry, flag: '🌐' }) : null;

  // Extract totals based on active level
  const visitors = data.uniqueVisitors || data.totalVisitors || data.trafficCount || 0;
  const sessions = data.totalSessions || data.trafficCount || 0;
  const pageviews = data.totalPageviews || data.pageviews || sessions * 2.5;
  const conversions = data.totalConversions || data.conversions || data.conversionCount || 0;
  const avgDuration = data.avgDuration || 180;
  const bounceRate = data.bounceRate || 28;

  const durationStr = `${Math.floor(avgDuration / 60)}m ${String(Math.round(avgDuration % 60)).padStart(2, '0')}s`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: darkMode ? 'rgba(8, 17, 34, 0.75)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        border: darkMode ? '1px solid rgba(30, 58, 102, 0.5)' : '1px solid rgba(226, 232, 240, 0.8)',
        borderRadius: 14,
        padding: '14px 16px',
        color: darkMode ? '#F1F5F9' : '#0B1F4D'
      }}
    >
      {/* Level Header Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: level === 'country' ? 'rgba(247, 148, 29, 0.15)' : (level === 'region' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(10, 174, 239, 0.15)'),
              color: level === 'country' ? '#F7941D' : (level === 'region' ? '#A855F7' : '#0AAEEF'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14
            }}
          >
            {level === 'city' ? <EnvironmentOutlined /> : <ThunderboltOutlined />}
          </div>
          <div>
            <div style={{ fontSize: '0.6875rem', color: darkMode ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
              {level === 'world' && 'Global Database Overview'}
              {level === 'region' && `${regionInfo?.name || selectedRegion} Regional Intelligence`}
              {level === 'country' && `${countryInfo?.name || selectedCountry} Performance`}
              {level === 'city' && `${selectedCity} City Metrics`}
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 800 }}>
              {level === 'world' && 'Worldwide Live Traffic'}
              {level === 'region' && regionInfo?.label}
              {level === 'country' && `${countryInfo?.flag || '🌐'} ${countryInfo?.name || selectedCountry}`}
              {level === 'city' && `📍 ${selectedCity}, ${countryInfo?.name || ''}`}
            </div>
          </div>
        </div>

        {/* Live Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: '0.6875rem',
            fontWeight: 800,
            color: '#10B981',
            background: 'rgba(16, 185, 129, 0.12)',
            padding: '3px 8px',
            borderRadius: 12
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
          <span>LIVE DB</span>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {/* Visitors */}
        <div
          style={{
            background: darkMode ? 'rgba(15, 30, 58, 0.6)' : 'rgba(241, 245, 249, 0.8)',
            border: darkMode ? '1px solid rgba(30, 58, 102, 0.4)' : '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: 10,
            padding: '8px 12px'
          }}
        >
          <div style={{ fontSize: '0.6875rem', color: darkMode ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
            <UserOutlined style={{ color: '#0AAEEF' }} />
            <span>Visitors</span>
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0AAEEF', marginTop: 2 }}>
            {formatMetric(visitors)}
          </div>
        </div>

        {/* Sessions */}
        <div
          style={{
            background: darkMode ? 'rgba(15, 30, 58, 0.6)' : 'rgba(241, 245, 249, 0.8)',
            border: darkMode ? '1px solid rgba(30, 58, 102, 0.4)' : '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: 10,
            padding: '8px 12px'
          }}
        >
          <div style={{ fontSize: '0.6875rem', color: darkMode ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
            <RiseOutlined style={{ color: '#38BDF8' }} />
            <span>Sessions</span>
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: darkMode ? '#F1F5F9' : '#0B1F4D', marginTop: 2 }}>
            {formatMetric(sessions)}
          </div>
        </div>

        {/* Page Views */}
        <div
          style={{
            background: darkMode ? 'rgba(15, 30, 58, 0.6)' : 'rgba(241, 245, 249, 0.8)',
            border: darkMode ? '1px solid rgba(30, 58, 102, 0.4)' : '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: 10,
            padding: '8px 12px'
          }}
        >
          <div style={{ fontSize: '0.6875rem', color: darkMode ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
            <EyeOutlined style={{ color: '#A855F7' }} />
            <span>Pageviews</span>
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#A855F7', marginTop: 2 }}>
            {formatMetric(pageviews)}
          </div>
        </div>

        {/* Conversions */}
        <div
          style={{
            background: darkMode ? 'rgba(15, 30, 58, 0.6)' : 'rgba(241, 245, 249, 0.8)',
            border: darkMode ? '1px solid rgba(30, 58, 102, 0.4)' : '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: 10,
            padding: '8px 12px'
          }}
        >
          <div style={{ fontSize: '0.6875rem', color: darkMode ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ThunderboltOutlined style={{ color: '#F7941D' }} />
            <span>Conversions</span>
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#F7941D', marginTop: 2 }}>
            {formatMetric(conversions)}
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar: Duration & Bounce Rate & Top Cities/Countries */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: darkMode ? '#94A3B8' : '#64748B' }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <span>Avg Session: <strong style={{ color: darkMode ? '#FFFFFF' : '#0B1F4D' }}>{durationStr}</strong></span>
          <span>Bounce Rate: <strong style={{ color: darkMode ? '#FFFFFF' : '#0B1F4D' }}>{bounceRate}%</strong></span>
        </div>

        {/* Country City Quick Selector Chips */}
        {countryInfo?.cities?.length > 0 && level === 'country' && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: '0.6875rem' }}>Cities:</span>
            {countryInfo.cities.slice(0, 3).map(city => (
              <button
                key={city.name}
                onClick={() => onSelectCity(city.name)}
                style={{
                  background: selectedCity === city.name ? '#0AAEEF' : (darkMode ? 'rgba(30, 58, 102, 0.5)' : 'rgba(226, 232, 240, 0.9)'),
                  color: selectedCity === city.name ? '#FFFFFF' : (darkMode ? '#CBD5E1' : '#475569'),
                  border: 'none',
                  borderRadius: 6,
                  padding: '2px 6px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {city.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
