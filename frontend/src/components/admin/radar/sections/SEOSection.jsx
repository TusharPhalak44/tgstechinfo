import React, { useState } from 'react';
import {
  SearchOutlined,
  LineChartOutlined,
  AimOutlined,
  BulbOutlined,
  RiseOutlined,
  FallOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

const COLORS = ['#0AAEEF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#64748B'];

const TrendBadge = ({ val, up, darkMode }) => (
  <span
    style={{
      fontSize: 10,
      fontWeight: 700,
      padding: '2px 6px',
      borderRadius: 4,
      background: up ? (darkMode ? '#064E3B' : '#D1FAE5') : (darkMode ? '#7F1D1D' : '#FEE2E2'),
      color: up ? (darkMode ? '#34D399' : '#059669') : (darkMode ? '#F87171' : '#DC2626'),
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
    }}
  >
    {up ? <RiseOutlined style={{ fontSize: 9 }} /> : <FallOutlined style={{ fontSize: 9 }} />}
    {val}
  </span>
);

const SEOSection = ({ darkMode, searchData = {} }) => {
  const [activeFilter, setActiveFilter] = useState('all');

  const popularSearches = searchData.popularSearches || [];
  const queries = popularSearches.length > 0
    ? popularSearches.map((q, i) => ({
        query: q.query_text || q.query || q,
        impressions: q.search_count ? q.search_count * 12 : Math.max(10, 800 - i * 60),
        clicks: q.search_count || Math.max(1, 200 - i * 15),
        ctr: `${(Math.random() * 4 + 6).toFixed(1)}%`,
        position: (i + 1.2).toFixed(1),
      }))
    : [
        { query: 'cloud computing solutions', impressions: 12800, clicks: 1024, ctr: '8.0%', position: '2.4' },
        { query: 'enterprise data analytics', impressions: 9400, clicks: 658, ctr: '7.0%', position: '3.1' },
        { query: 'digital transformation consulting', impressions: 7200, clicks: 504, ctr: '7.0%', position: '4.2' },
        { query: 'tgs tech info', impressions: 6100, clicks: 488, ctr: '8.0%', position: '1.1' },
        { query: 'ai trends 2026', impressions: 5800, clicks: 406, ctr: '7.0%', position: '3.8' },
        { query: 'cybersecurity best practices', impressions: 4200, clicks: 294, ctr: '7.0%', position: '5.2' },
      ];

  const maxImpressions = Math.max(...queries.map(q => q.impressions), 1);

  const seoKpis = [
    { label: 'Total Impressions', value: queries.reduce((a, q) => a + q.impressions, 0).toLocaleString(), color: '#0AAEEF', icon: <LineChartOutlined />, delta: '+18.4%', up: true },
    { label: 'Organic Clicks',    value: queries.reduce((a, q) => a + q.clicks, 0).toLocaleString(),      color: '#10B981', icon: <AimOutlined />,       delta: '+12.1%', up: true },
    { label: 'Avg CTR',           value: `${(queries.reduce((a, q) => a + parseFloat(q.ctr), 0) / queries.length).toFixed(1)}%`, color: '#8B5CF6', icon: <BulbOutlined />, delta: '+0.4%', up: true },
    { label: 'Avg Position',      value: (queries.reduce((a, q) => a + parseFloat(q.position), 0) / queries.length).toFixed(1), color: '#F59E0B', icon: <RiseOutlined />, delta: '-0.6', up: true },
  ];

  const pages = [
    { url: '/services/cloud-solutions', clicks: 1842, impressions: 18200, ctr: '10.1%' },
    { url: '/blog/ai-trends-2026', clicks: 1230, impressions: 14800, ctr: '8.3%' },
    { url: '/case-studies/fintech', clicks: 890, impressions: 10200, ctr: '8.7%' },
    { url: '/about-us', clicks: 640, impressions: 8800, ctr: '7.3%' },
    { url: '/contact', clicks: 420, impressions: 6400, ctr: '6.6%' },
  ];
  const maxClicks = Math.max(...pages.map(p => p.clicks), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 4 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
        {seoKpis.map(m => (
          <div
            key={m.label}
            className="radar-glass-panel"
            style={{
              padding: '16px 18px',
              background: darkMode ? '#0F172A' : '#FFFFFF',
              borderColor: darkMode ? '#334155' : '#E2E8F0',
              borderRadius: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 18, color: m.color }}>{m.icon}</span>
              <TrendBadge val={m.delta} up={m.up} darkMode={darkMode} />
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: darkMode ? '#94A3B8' : '#64748B',
                marginBottom: 2,
              }}
            >
              {m.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: m.color, fontFamily: 'monospace' }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Search Queries Table */}
      <div
        className="radar-glass-panel"
        style={{
          padding: '20px 22px',
          background: darkMode ? '#0F172A' : '#FFFFFF',
          borderColor: darkMode ? '#334155' : '#E2E8F0',
          borderRadius: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: darkMode ? '#F8FAFC' : '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <SearchOutlined style={{ color: '#0AAEEF' }} />
            <span>Top Search Queries &amp; Keywords</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'branded', 'non-branded'].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: activeFilter === f ? '1px solid #0AAEEF' : `1px solid ${darkMode ? '#334155' : '#E2E8F0'}`,
                  background: activeFilter === f ? (darkMode ? '#0E2A47' : '#E0F2FE') : 'transparent',
                  color: activeFilter === f ? '#0AAEEF' : (darkMode ? '#94A3B8' : '#64748B'),
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: darkMode ? '#1E293B' : '#F8FAFC' }}>
                {['#', 'Query', 'Impressions', 'Clicks', 'CTR', 'Avg Position'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: darkMode ? '#94A3B8' : '#64748B',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queries.map((q, i) => {
                const color = COLORS[i % COLORS.length];
                const pct = Math.round((q.impressions / maxImpressions) * 100);
                return (
                  <tr
                    key={i}
                    style={{
                      borderBottom: `1px solid ${darkMode ? '#1E293B' : '#E2E8F0'}`,
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 600, color: darkMode ? '#F8FAFC' : '#0F172A' }}>
                      {q.query}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 55,
                            height: 5,
                            borderRadius: 3,
                            background: darkMode ? '#1E293B' : '#E2E8F0',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              borderRadius: 3,
                              background: color,
                              transition: 'width 0.8s ease',
                            }}
                          />
                        </div>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color }}>
                          {q.impressions.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#10B981' }}>
                      {q.clicks.toLocaleString()}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: darkMode ? 'rgba(10,174,239,0.15)' : '#E0F2FE',
                          color: '#0AAEEF',
                        }}
                      >
                        {q.ctr}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '11px 14px',
                        fontFamily: 'monospace',
                        fontSize: 12,
                        fontWeight: 700,
                        color: parseFloat(q.position) <= 3 ? '#10B981' : parseFloat(q.position) <= 6 ? '#F59E0B' : '#EF4444',
                      }}
                    >
                      #{q.position}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Pages (Organic) */}
      <div
        className="radar-glass-panel"
        style={{
          padding: '20px 22px',
          background: darkMode ? '#0F172A' : '#FFFFFF',
          borderColor: darkMode ? '#334155' : '#E2E8F0',
          borderRadius: 12,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: darkMode ? '#F8FAFC' : '#0F172A',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FileTextOutlined style={{ color: '#8B5CF6' }} />
          <span>Top Organic Destination Pages</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pages.map((p, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color, width: 20 }}>
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: darkMode ? '#CBD5E1' : '#334155',
                    flex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.url}
                </span>
                <div
                  style={{
                    width: 80,
                    height: 6,
                    borderRadius: 3,
                    background: darkMode ? '#1E293B' : '#E2E8F0',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round((p.clicks / maxClicks) * 100)}%`,
                      borderRadius: 3,
                      background: color,
                      transition: 'width 0.8s ease',
                    }}
                  />
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color, width: 44, textAlign: 'right' }}>
                  {p.clicks.toLocaleString()}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#10B981', width: 38, textAlign: 'right' }}>
                  {p.ctr}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SEOSection;
