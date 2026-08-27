import React from 'react';
import { formatMetric } from '../../../../config/geographicHierarchy';

export default function GlobeTooltip({
  data = null,
  position = { x: 0, y: 0 },
  darkMode = true
}) {
  if (!data) return null;

  const {
    name,
    flag = '🌐',
    region = 'GLOBAL',
    iso = '',
    type = 'country',
    uniqueVisitors = 0,
    trafficCount = 0,
    pageviews = 0,
    conversions = 0,
    state = ''
  } = data;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x + 14}px`,
        top: `${position.y - 14}px`,
        background: darkMode ? 'rgba(8, 17, 34, 0.94)' : 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        border: darkMode ? '1px solid rgba(10, 174, 239, 0.5)' : '1px solid rgba(10, 174, 239, 0.3)',
        borderRadius: 14,
        padding: '10px 14px',
        pointerEvents: 'none',
        zIndex: 25,
        boxShadow: darkMode
          ? '0 12px 32px rgba(0,0,0,0.7), 0 0 16px rgba(10,174,239,0.25)'
          : '0 12px 32px rgba(11,31,77,0.18)',
        transform: 'translateY(-100%)',
        minWidth: 180,
        userSelect: 'none',
        transition: 'opacity 0.15s ease'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '1rem' }}>{flag}</span>
          <strong style={{ fontSize: '0.875rem', color: darkMode ? '#FFFFFF' : '#0B1F4D', fontWeight: 800 }}>
            {name}
          </strong>
        </div>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 800,
            color: '#0AAEEF',
            background: 'rgba(10, 174, 239, 0.12)',
            padding: '2px 6px',
            borderRadius: 6
          }}
        >
          {state || region || iso}
        </span>
      </div>

      {/* Metrics Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', fontSize: '0.75rem', marginTop: 4 }}>
        <div>
          <span style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Visitors:</span>{' '}
          <strong style={{ color: '#0AAEEF', fontWeight: 700 }}>{formatMetric(uniqueVisitors || trafficCount)}</strong>
        </div>
        <div>
          <span style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Sessions:</span>{' '}
          <strong style={{ color: darkMode ? '#F1F5F9' : '#0B1F4D', fontWeight: 700 }}>{formatMetric(trafficCount)}</strong>
        </div>
        {pageviews > 0 && (
          <div>
            <span style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Pageviews:</span>{' '}
            <strong style={{ color: '#A855F7', fontWeight: 700 }}>{formatMetric(pageviews)}</strong>
          </div>
        )}
        {conversions > 0 && (
          <div>
            <span style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Conversions:</span>{' '}
            <strong style={{ color: '#F7941D', fontWeight: 700 }}>{formatMetric(conversions)}</strong>
          </div>
        )}
      </div>

      {/* Interactive Action Hint */}
      <div
        style={{
          marginTop: 8,
          paddingTop: 6,
          borderTop: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
          fontSize: '0.6875rem',
          color: '#38BDF8',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}
      >
        <span>⚡ {type === 'city' ? 'City analytics active' : 'Click country to explore cities'}</span>
      </div>
    </div>
  );
}
