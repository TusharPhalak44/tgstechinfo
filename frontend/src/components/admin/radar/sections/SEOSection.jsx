import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  SearchOutlined,
  LineChartOutlined,
  AimOutlined,
  BulbOutlined,
  RiseOutlined,
  FallOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
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

const SEOSection = ({ darkMode, searchData = {}, timeRange = '7d' }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [seoData, setSeoData] = useState({
    popularSearches: [],
    searchAnalytics: [],
    topPages: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Calculate date range based on timeRange
    let dateParams = '';
    
    if (timeRange !== 'all') {
      const endDate = new Date();
      const startDate = new Date();
      if (timeRange === '7d') startDate.setDate(startDate.getDate() - 7);
      if (timeRange === '30d') startDate.setDate(startDate.getDate() - 30);
      if (timeRange === '90d') startDate.setDate(startDate.getDate() - 90);

      const s = startDate.toISOString().split('T')[0];
      const e = endDate.toISOString().split('T')[0];
      dateParams = `?start_date=${s}&end_date=${e}&limit=100`;
    } else {
      dateParams = `?limit=100`;
    }

    console.log('SEOSection - Fetching search data with timeRange:', timeRange, 'dateParams:', dateParams);
    console.log('SEOSection - Full API URL:', `/api/analytics/search${dateParams}`);

    // Fetch search analytics data
    axios.get(`/api/analytics/search${dateParams}`)
      .then(res => {
        console.log('SEOSection - API response:', res.data);
        const popularSearches = res.data.popularSearches || [];
        const searchAnalytics = res.data.searchAnalytics || [];
        
        console.log('SEOSection - Popular searches fetched:', popularSearches.length);
        console.log('SEOSection - Search analytics fetched:', searchAnalytics.length);
        if (popularSearches.length > 0) {
          console.log('SEOSection - Sample search data:', popularSearches[0]);
        }

        // Transform search data to frontend format
        const queries = popularSearches.map((q, i) => ({
          query: q.search_keyword || q.query_text || q.query || 'Unknown',
          impressions: q.search_count || 0,
          clicks: q.click_count || 0,
          ctr: q.search_count > 0 ? ((q.click_count || 0) / q.search_count * 100).toFixed(1) + '%' : '0.0%',
          position: (i + 1).toFixed(1),
          search_type: q.search_type || 'keyword'
        }));

        // Calculate KPIs from real data
        const totalImpressions = queries.reduce((a, q) => a + q.impressions, 0);
        const totalClicks = queries.reduce((a, q) => a + q.clicks, 0);
        const avgCtr = queries.length > 0 ? (queries.reduce((a, q) => a + parseFloat(q.ctr), 0) / queries.length).toFixed(1) + '%' : '0.0%';
        const avgPosition = queries.length > 0 ? (queries.reduce((a, q) => a + parseFloat(q.position), 0) / queries.length).toFixed(1) : '0.0';

        // Get top pages from page view data
        const topPages = []; // Will need to fetch from page views API

        setSeoData({
          popularSearches: queries,
          searchAnalytics,
          topPages,
          kpis: {
            totalImpressions,
            totalClicks,
            avgCtr,
            avgPosition
          }
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('SEOSection - Error fetching search data:', err);
        setSeoData({
          popularSearches: [],
          searchAnalytics: [],
          topPages: [],
          kpis: {
            totalImpressions: 0,
            totalClicks: 0,
            avgCtr: '0.0%',
            avgPosition: '0.0'
          }
        });
        setLoading(false);
      });
  }, [timeRange]);

  // Filter queries based on active filter
  const filteredQueries = useMemo(() => {
    if (activeFilter === 'all') return seoData.popularSearches;
    if (activeFilter === 'branded') {
      return seoData.popularSearches.filter(q => 
        q.query.toLowerCase().includes('tgs') || 
        q.query.toLowerCase().includes('tech info')
      );
    }
    if (activeFilter === 'non-branded') {
      return seoData.popularSearches.filter(q => 
        !q.query.toLowerCase().includes('tgs') && 
        !q.query.toLowerCase().includes('tech info')
      );
    }
    return seoData.popularSearches;
  }, [seoData.popularSearches, activeFilter]);

  const maxImpressions = Math.max(...filteredQueries.map(q => q.impressions), 1);

  const seoKpis = [
    { label: 'Total Impressions', value: seoData.kpis?.totalImpressions?.toLocaleString() || '0', color: '#0AAEEF', icon: <LineChartOutlined />, delta: null, up: true },
    { label: 'Organic Clicks',    value: seoData.kpis?.totalClicks?.toLocaleString() || '0',      color: '#10B981', icon: <AimOutlined />,       delta: null, up: true },
    { label: 'Avg CTR',           value: seoData.kpis?.avgCtr || '0.0%', color: '#8B5CF6', icon: <BulbOutlined />, delta: null, up: true },
    { label: 'Avg Position',      value: seoData.kpis?.avgPosition || '0.0', color: '#F59E0B', icon: <RiseOutlined />, delta: null, up: true },
  ];

  const pages = seoData.topPages.length > 0 ? seoData.topPages : [];
  const maxClicks = Math.max(...pages.map(p => p.clicks || 0), 1);

  // Empty state component
  const EmptyState = ({ message }) => (
    <div style={{
      padding: '40px 20px',
      textAlign: 'center',
      color: darkMode ? '#64748B' : '#94A3B8',
      fontSize: 14,
    }}>
      <CheckCircleOutlined style={{ fontSize: 32, marginBottom: 12, color: darkMode ? '#334155' : '#CBD5E1' }} />
      <div>{message}</div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: darkMode ? '#64748B' : '#94A3B8' }}>
        Loading SEO data...
      </div>
    );
  }

  return (
    <div className="seo-section" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @media (max-width: 1024px) {
          .seo-section {
            gap: 16px !important;
          }
        }
        @media (max-width: 768px) {
          .seo-section {
            gap: 14px !important;
          }
        }
        @media (max-width: 480px) {
          .seo-section {
            gap: 12px !important;
          }
        }
      `}</style>
      {/* 4 KPI Cards */}
      <div className="seo-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
        <style>{`
          @media (max-width: 1024px) {
            .seo-kpi-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 12px !important;
            }
          }
          @media (max-width: 768px) {
            .seo-kpi-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 10px !important;
            }
          }
          @media (max-width: 480px) {
            .seo-kpi-grid {
              grid-template-columns: 1fr !important;
              gap: 8px !important;
            }
          }
        `}</style>
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
        <div className="seo-queries-table" style={{ overflowX: 'auto' }}>
          {filteredQueries.length > 0 ? (
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
                {filteredQueries.map((q, i) => {
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
          ) : (
            <EmptyState message="No search query data available for this time range" />
          )}
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
        <div className="organic-pages-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pages.length > 0 ? (
            pages.map((p, i) => {
              const color = COLORS[i % COLORS.length];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color, width: 20 }}>
                    {i + 1}
                  </span>
                  <span
                    className="page-url"
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
                    className="page-bar"
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
                  <span className="page-clicks" style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color, width: 44, textAlign: 'right' }}>
                    {p.clicks.toLocaleString()}
                  </span>
                  <span className="page-ctr" style={{ fontFamily: 'monospace', fontSize: 11, color: '#10B981', width: 38, textAlign: 'right' }}>
                    {p.ctr}
                  </span>
                </div>
              );
            })
          ) : (
            <EmptyState message="No organic page data available for this time range" />
          )}
        </div>
      </div>
    </div>
  );
};

export default SEOSection;
