import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  ThunderboltOutlined,
  MobileOutlined,
  InboxOutlined,
  FileImageOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const statusColor = (val, good, warn) =>
  val <= good ? '#10B981' : val <= warn ? '#F59E0B' : '#EF4444';

const CWVGauge = ({ label, value, unit, good, warn, desc, darkMode }) => {
  const color = statusColor(value, good, warn);
  const status = value <= good ? 'GOOD' : value <= warn ? 'NEEDS WORK' : 'POOR';
  return (
    <div
      className="radar-glass-panel"
      style={{
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: darkMode ? '#0F172A' : '#FFFFFF',
        borderColor: darkMode ? '#334155' : '#E2E8F0',
        borderRadius: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: darkMode ? '#94A3B8' : '#64748B',
          }}
        >
          {label}
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: 4,
            background: darkMode ? `${color}20` : `${color}15`,
            color,
            fontFamily: 'monospace',
            letterSpacing: '0.04em',
          }}
        >
          {status}
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.1, fontFamily: 'monospace' }}>
        {value}
        <span style={{ fontSize: 13, fontWeight: 600, color: darkMode ? '#64748B' : '#94A3B8', marginLeft: 4 }}>
          {unit}
        </span>
      </div>
      <div style={{ fontSize: 11, color: darkMode ? '#64748B' : '#94A3B8' }}>{desc}</div>
      {/* Clean solid threshold bar */}
      <div
        style={{
          position: 'relative',
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
          background: darkMode ? '#1E293B' : '#E2E8F0',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${Math.min(100, Math.max(5, (value / warn) * 80))}%`,
            background: color,
            borderRadius: 3,
            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9,
          fontFamily: 'monospace',
          color: darkMode ? '#64748B' : '#94A3B8',
        }}
      >
        <span>Good ≤{good}{unit}</span>
        <span>Poor {'>'}{warn}{unit}</span>
      </div>
    </div>
  );
};

const PerformanceSection = ({ darkMode }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 800);
  }, []);

  // Dummy CWV metrics
  const cwvMetrics = [
    { label: 'Largest Contentful Paint', value: 2.1, unit: 's', good: 2.5, warn: 4.0, desc: 'Render time of largest visual block' },
    { label: 'First Input Delay', value: 45, unit: 'ms', good: 100, warn: 300, desc: 'Input latency on first interaction' },
    { label: 'Cumulative Layout Shift', value: 0.04, unit: '', good: 0.1, warn: 0.25, desc: 'Visual stability score during render' },
    { label: 'Time to First Byte', value: 620, unit: 'ms', good: 800, warn: 1800, desc: 'Initial server response latency' },
    { label: 'First Contentful Paint', value: 1.4, unit: 's', good: 1.8, warn: 3.0, desc: 'Initial DOM render latency' },
    { label: 'Interaction to Next Paint', value: 85, unit: 'ms', good: 200, warn: 500, desc: 'Overall interactive response time' },
  ];

  // Dummy page load data
  const pageLoadData = [
    { page: '/home', desktop: 1.2, mobile: 2.1 },
    { page: '/blog', desktop: 1.5, mobile: 2.4 },
    { page: '/products', desktop: 1.8, mobile: 2.8 },
    { page: '/contact', desktop: 1.1, mobile: 1.9 },
    { page: '/about', desktop: 1.3, mobile: 2.2 },
    { page: '/services', desktop: 1.6, mobile: 2.5 },
  ];

  const maxLoad = Math.max(...pageLoadData.flatMap(p => [p.desktop, p.mobile]));
  const perfScore = 92;
  const scoreColor = perfScore >= 90 ? '#10B981' : perfScore >= 50 ? '#F59E0B' : '#EF4444';

  // Dummy quick metrics
  const quickMetrics = [
    { label: 'Avg Load Time', value: '1.42s', color: '#10B981', icon: <ThunderboltOutlined /> },
    { label: 'Mobile Load', value: '2.10s', color: '#F59E0B', icon: <MobileOutlined /> },
    { label: 'Bundle Size', value: '384KB', color: '#8B5CF6', icon: <InboxOutlined /> },
    { label: 'Assets Optimized', value: '96%', color: '#0AAEEF', icon: <FileImageOutlined /> },
    { label: 'Cache Hit Rate', value: '84%', color: '#10B981', icon: <DatabaseOutlined /> },
    { label: 'Edge Latency', value: '18ms', color: '#0AAEEF', icon: <GlobalOutlined /> },
  ];

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
        Loading performance data...
      </div>
    );
  }

  return (
    <div className="performance-section" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @media (max-width: 1024px) {
          .performance-section {
            gap: 16px !important;
          }
        }
        @media (max-width: 768px) {
          .performance-section {
            gap: 14px !important;
          }
        }
        @media (max-width: 480px) {
          .performance-section {
            gap: 12px !important;
          }
        }
      `}</style>
      {/* Overall score + summary */}
      <div className="performance-overview-grid" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
        <style>{`
          @media (max-width: 1024px) {
            .performance-overview-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
        {/* Score Ring */}
        <div
          className="radar-glass-panel"
          style={{
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            background: darkMode ? '#0F172A' : '#FFFFFF',
            borderColor: darkMode ? '#334155' : '#E2E8F0',
            borderRadius: 12,
          }}
        >
            <svg width={130} height={130}>
            <circle
              cx="65"
              cy="65"
              r="52"
              fill="none"
              stroke={darkMode ? '#1E293B' : '#E2E8F0'}
              strokeWidth="10"
            />
            <circle
              cx="65"
              cy="65"
              r="52"
              fill="none"
              stroke={scoreColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(perfScore / 100) * 326.7} 326.7`}
              transform="rotate(-90 65 65)"
              style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
            <text
              x="65"
              y="60"
              textAnchor="middle"
              fill={scoreColor}
              fontSize="28"
              fontWeight="800"
              fontFamily="'Plus Jakarta Sans',sans-serif"
            >
              {perfScore}
            </text>
            <text
              x="65"
              y="80"
              textAnchor="middle"
              fill={darkMode ? '#64748B' : '#94A3B8'}
              fontSize="10"
              fontFamily="monospace"
            >
              /100
            </text>
          </svg>
          <div style={{ fontSize: 12, fontWeight: 700, color: darkMode ? '#94A3B8' : '#64748B', textAlign: 'center' }}>
            Performance Score
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 4,
              background: darkMode ? `${scoreColor}20` : `${scoreColor}15`,
              color: scoreColor,
              fontFamily: 'monospace',
            }}
          >
            {perfScore >= 90 ? 'OPTIMAL' : perfScore >= 50 ? 'MODERATE' : 'ATTENTION'}
          </span>
        </div>

        {/* Quick metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, alignContent: 'start' }}>
          {quickMetrics.length > 0 ? quickMetrics.map(m => (
            <div
              key={m.label}
              className="radar-glass-panel"
              style={{
                padding: '14px 16px',
                background: darkMode ? '#0F172A' : '#FFFFFF',
                borderColor: darkMode ? '#334155' : '#E2E8F0',
                borderRadius: 12,
              }}
            >
              <div style={{ fontSize: 16, color: m.color, marginBottom: 4 }}>{m.icon}</div>
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
              <div style={{ fontSize: 18, fontWeight: 800, color: m.color, fontFamily: 'monospace' }}>
                {m.value}
              </div>
            </div>
          )) : (
            <EmptyState message="No performance metrics available" />
          )}
        </div>
      </div>

      {/* Core Web Vitals */}
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
          <DashboardOutlined style={{ color: '#0AAEEF' }} />
          <span>Core Web Vitals Telemetry</span>
        </div>
        <div className="cwv-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <style>{`
            @media (max-width: 1024px) {
              .cwv-metrics-grid {
                grid-template-columns: repeat(2, 1fr) !important;
              }
            }
            @media (max-width: 768px) {
              .cwv-metrics-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
          {cwvMetrics.length > 0 ? cwvMetrics.map(m => (
            <CWVGauge key={m.label} {...m} darkMode={darkMode} />
          )) : (
            <EmptyState message="No Core Web Vitals data available" />
          )}
        </div>
      </div>

      {/* Page Load Time Breakdown */}
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
          <CheckCircleOutlined style={{ color: '#10B981' }} />
          <span>Page Load Times (Desktop vs Mobile)</span>
        </div>
        <div className="page-load-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pageLoadData.length > 0 ? pageLoadData.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                className="page-name"
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  fontWeight: 600,
                  color: darkMode ? '#CBD5E1' : '#334155',
                  width: 140,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {p.page}
              </span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="platform-label" style={{ fontSize: 10, fontFamily: 'monospace', color: '#0AAEEF', width: 44 }}>
                    DESKTOP
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 5,
                      borderRadius: 3,
                      background: darkMode ? '#1E293B' : '#E2E8F0',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(parseFloat(p.desktop) / maxLoad) * 100}%`,
                        borderRadius: 3,
                        background: '#0AAEEF',
                        transition: 'width 0.8s ease',
                      }}
                    />
                  </div>
                  <span className="load-time" style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: statusColor(parseFloat(p.desktop), 2, 3.5), width: 36, textAlign: 'right' }}>
                    {p.desktop}s
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="platform-label" style={{ fontSize: 10, fontFamily: 'monospace', color: '#8B5CF6', width: 44 }}>
                    MOBILE
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 5,
                      borderRadius: 3,
                      background: darkMode ? '#1E293B' : '#E2E8F0',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(parseFloat(p.mobile) / maxLoad) * 100}%`,
                        borderRadius: 3,
                        background: '#8B5CF6',
                        transition: 'width 0.8s ease',
                      }}
                    />
                  </div>
                  <span className="load-time" style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: statusColor(parseFloat(p.mobile), 2.5, 4), width: 36, textAlign: 'right' }}>
                    {p.mobile}s
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <EmptyState message="No page load data available for this time range" />
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceSection;
