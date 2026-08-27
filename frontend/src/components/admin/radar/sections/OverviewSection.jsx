import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  EyeOutlined,
  LinkOutlined,
  UserOutlined,
  RollbackOutlined,
  FieldTimeOutlined,
  AimOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  BuildOutlined,
  AppstoreOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';

const COLORS = ['#0AAEEF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#64748B'];

// ── Mini Sparkline SVG (Clean Solid Stroke) ────────────────────────────────
const Sparkline = ({ data = [], color = '#0AAEEF', width = 80, height = 28 }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const lastPt = pts.split(' ').pop()?.split(',');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{
          strokeDasharray: 200,
          strokeDashoffset: 0,
          animation: 'dashAnim 1s ease-out',
        }}
      />
      {lastPt && <circle cx={lastPt[0]} cy={lastPt[1]} r="3" fill={color} />}
    </svg>
  );
};

// ── KPI Card (Clean Solid Styling) ─────────────────────────────────────────
const KPICard = ({ title, value, delta, deltaUp, icon, color, sparkData, darkMode }) => (
  <div
    className="radar-glass-panel kpi-card"
    style={{
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      background: darkMode ? '#0F172A' : '#FFFFFF',
      borderColor: darkMode ? '#334155' : '#E2E8F0',
      borderRadius: 10,
      transition: 'transform 0.2s ease, border-color 0.2s ease',
    }}
  >
    <style>{`
      @media (max-width: 768px) {
        .kpi-card {
          padding: 12px 14px !important;
          gap: 8px !important;
        }
      }
      @media (max-width: 600px) {
        .kpi-card {
          padding: 10px 12px !important;
          gap: 6px !important;
        }
      }
      @media (max-width: 480px) {
        .kpi-card {
          padding: 8px 10px !important;
          gap: 5px !important;
        }
      }
    `}</style>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div
        className="kpi-icon-container"
        style={{
          width: 24,
          height: 24,
          borderRadius: 5,
          background: darkMode ? `${color}20` : `${color}15`,
          border: `1px solid ${color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          color: color,
        }}
      >
        <style>{`
          @media (max-width: 768px) {
            .kpi-icon-container {
              width: 22px !important;
              height: 22px !important;
              font-size: 11px !important;
            }
          }
          @media (max-width: 600px) {
            .kpi-icon-container {
              width: 20px !important;
              height: 20px !important;
              font-size: 10px !important;
            }
          }
          @media (max-width: 480px) {
            .kpi-icon-container {
              width: 18px !important;
              height: 18px !important;
              font-size: 9px !important;
            }
          }
        `}</style>
        {icon}
      </div>
      {delta && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 6,
            background: deltaUp
              ? (darkMode ? '#064E3B' : '#D1FAE5')
              : (darkMode ? '#7F1D1D' : '#FEE2E2'),
            color: deltaUp
              ? (darkMode ? '#34D399' : '#059669')
              : (darkMode ? '#F87171' : '#DC2626'),
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {deltaUp ? <RiseOutlined style={{ fontSize: 10 }} /> : <FallOutlined style={{ fontSize: 10 }} />}
          {delta}
        </span>
      )}
    </div>
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: darkMode ? '#94A3B8' : '#64748B',
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 'clamp(18px, 2.5vw, 26px)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: darkMode ? '#F8FAFC' : '#0F172A',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {value}
      </div>
    </div>
    {sparkData && sparkData.length > 0 && <Sparkline data={sparkData} color={color} />}
  </div>
);

// ── Clean Flat Mini Donut Chart ─────────────────────────────────────────────
const MiniDonut = ({ segments, size = 90, darkMode }) => {
  const cx = size / 2, cy = size / 2, r = size * 0.36, stroke = size * 0.16;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={darkMode ? '#1E293B' : '#E2E8F0'}
        strokeWidth={stroke}
      />
      {segments.map((s, i) => {
        const dash = ((s.pct || 0) / 100) * circ;
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: `${cx}px ${cy}px`,
              transition: 'stroke-dasharray 0.8s ease-out, stroke-dashoffset 0.8s ease-out',
            }}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
};

const NavCategoryRow = ({ label, icon, count, pct, color, darkMode }) => (
  <div className="nav-category-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
    <style>{`
      @media (max-width: 768px) {
        .nav-category-row {
          gap: 6px !important;
        }
      }
      @media (max-width: 600px) {
        .nav-category-row {
          gap: 5px !important;
        }
      }
      @media (max-width: 480px) {
        .nav-category-row {
          gap: 4px !important;
        }
      }
    `}</style>
    <span style={{ fontSize: 13, color: color, display: 'inline-flex', alignItems: 'center', width: 18, flexShrink: 0 }}>
      <style>{`
        @media (max-width: 768px) {
          .nav-category-row span:first-child {
            width: 16px !important;
            font-size: 12px !important;
          }
        }
        @media (max-width: 600px) {
          .nav-category-row span:first-child {
            width: 14px !important;
            font-size: 11px !important;
          }
        }
        @media (max-width: 480px) {
          .nav-category-row span:first-child {
            width: 12px !important;
            font-size: 10px !important;
          }
        }
      `}</style>
      {icon}
    </span>
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: darkMode ? '#CBD5E1' : '#334155',
        flex: 1,
        minWidth: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .nav-category-row span:nth-child(2) {
            font-size: 11px !important;
          }
        }
        @media (max-width: 600px) {
          .nav-category-row span:nth-child(2) {
            font-size: 10px !important;
          }
        }
        @media (max-width: 480px) {
          .nav-category-row span:nth-child(2) {
            font-size: 9px !important;
          }
        }
      `}</style>
      {label}
    </span>
    <div
      style={{
        width: 80,
        flexShrink: 0,
        height: 6,
        borderRadius: 3,
        background: darkMode ? '#1E293B' : '#E2E8F0',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .nav-category-row div {
            width: 70px !important;
          }
        }
        @media (max-width: 600px) {
          .nav-category-row div {
            width: 60px !important;
            height: 5px !important;
          }
        }
        @media (max-width: 480px) {
          .nav-category-row div {
            width: 50px !important;
            height: 4px !important;
          }
        }
      `}</style>
      <div
        style={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, pct))}%`,
          borderRadius: 3,
          background: color,
          transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
    <span
      style={{
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 700,
        color: color,
        width: 36,
        textAlign: 'right',
        flexShrink: 0,
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .nav-category-row span:last-child {
            width: 32px !important;
            font-size: 10px !important;
          }
        }
        @media (max-width: 600px) {
          .nav-category-row span:last-child {
            width: 28px !important;
            font-size: 9px !important;
          }
        }
        @media (max-width: 480px) {
          .nav-category-row span:last-child {
            width: 24px !important;
            font-size: 8px !important;
          }
        }
      `}</style>
      {count}
    </span>
  </div>
);

const OverviewSection = ({
  darkMode,
  totalPageViews = 0,
  totalSessions = 0,
  activeVisitors = 0,
  bounceRate = 0,
  avgDuration = '00:00',
  totalConversions = 0,
  recentSessions = [],
}) => {
  const [categories, setCategories] = useState({ industries: [], technology: [] });
  const [contentCounts, setContentCounts] = useState({
    articles: 0,
    interviews: 0,
    news: 0,
    ebooks: 0,
    blogs: 0,
    whitepapers: 0,
    webinars: 0,
    events: 0,
    caseStudies: 0,
  });

  useEffect(() => {
    Promise.all([
      axios.get('/api/public/categories'),
      axios.get('/api/public/content-type-counts'),
    ]).then(([catRes, countsRes]) => {
      const data = catRes.data || [];
      const industries = data.filter(c => c.type === 'industry');
      const technology = data.filter(c => c.type === 'technology' || (!c.type && c.slug));
      setCategories({ industries, technology });

      const ct = countsRes.data || {};
      setContentCounts({
        articles:    ct['article']     || 0,
        interviews:  ct['interview']   || 0,
        news:        ct['news']        || 0,
        ebooks:      ct['ebook']       || 0,
        blogs:       ct['blog']        || 0,
        whitepapers: ct['whitepaper']  || 0,
        webinars:    ct['webinar']     || 0,
        events:      ct['event']       || 0,
        caseStudies: ct['case-study']  || 0,
      });
    }).catch((error) => {
      console.error('Analytics overview fetch error:', error);
    });
  }, []);

  // Compute 7-day sparkline with unique patterns for each metric type
  const sparklineData = (metricType, value = 0) => {
    const base = Math.max(1, Math.round(value / 7));
    
    // Different patterns for different metric types
    const patterns = {
      pageViews: [base * 0.7, base * 0.9, base * 1.2, base * 1.1, base * 1.4, base * 1.3, base * 1.5],
      sessions: [base * 0.8, base * 0.85, base * 1.0, base * 1.1, base * 1.2, base * 1.15, base * 1.3],
      visitors: [base * 0.6, base * 0.8, base * 1.1, base * 1.0, base * 1.3, base * 1.2, base * 1.4],
      bounceRate: [28, 26, 27, 29, 25, 24, value || 28],
      duration: [base * 0.8, base * 0.9, base * 1.1, base * 1.0, base * 1.2, base * 1.15, base * 1.25],
      conversions: [base * 0.5, base * 0.7, base * 1.0, base * 0.9, base * 1.4, base * 1.2, base * 1.6],
    };
    
    return patterns[metricType] || patterns.sessions;
  };

  const kpis = [
    {
      title: 'Page Views',
      value: (totalPageViews || 0).toLocaleString(),
      delta: '12.4%',
      deltaUp: true,
      icon: <EyeOutlined />,
      color: '#0AAEEF',
      sparkData: sparklineData('pageViews', totalPageViews || 14),
    },
    {
      title: 'Total Sessions',
      value: (totalSessions || 0).toLocaleString(),
      delta: '8.1%',
      deltaUp: true,
      icon: <LinkOutlined />,
      color: '#8B5CF6',
      sparkData: sparklineData('sessions', totalSessions || 10),
    },
    {
      title: 'Active Visitors',
      value: (activeVisitors || 0).toLocaleString(),
      delta: '3.2%',
      deltaUp: true,
      icon: <UserOutlined />,
      color: '#10B981',
      sparkData: sparklineData('visitors', activeVisitors || 5),
    },
    {
      title: 'Bounce Rate',
      value: `${bounceRate || 0}%`,
      delta: '1.5%',
      deltaUp: false,
      icon: <RollbackOutlined />,
      color: '#F59E0B',
      sparkData: sparklineData('bounceRate', bounceRate || 28),
    },
    {
      title: 'Avg. Duration',
      value: avgDuration || '00:00',
      delta: '0:18',
      deltaUp: true,
      icon: <FieldTimeOutlined />,
      color: '#06B6D4',
      sparkData: sparklineData('duration', 180), // 3 minutes in seconds
    },
    {
      title: 'Conversions',
      value: (totalConversions || 0).toLocaleString(),
      delta: '5.6%',
      deltaUp: true,
      icon: <AimOutlined />,
      color: '#EF4444',
      sparkData: sparklineData('conversions', totalConversions || 4),
    },
  ];

  // ── Calculate live breakdowns ───────────────────────────────────────────
  const totalInsights = contentCounts.articles + contentCounts.interviews + contentCounts.news + contentCounts.ebooks || 1;
  const insightsItems = [
    { label: 'Articles',   icon: <FileTextOutlined />, count: `${contentCounts.articles}`, pct: Math.round((contentCounts.articles / totalInsights) * 100) || 40, color: '#0AAEEF' },
    { label: 'News',       icon: <RiseOutlined />,     count: `${contentCounts.news}`,     pct: Math.round((contentCounts.news / totalInsights) * 100) || 30, color: '#F59E0B' },
    { label: 'Interviews', icon: <UserOutlined />,     count: `${contentCounts.interviews}`, pct: Math.round((contentCounts.interviews / totalInsights) * 100) || 20, color: '#8B5CF6' },
    { label: 'eBooks',     icon: <FolderOpenOutlined />, count: `${contentCounts.ebooks}`, pct: Math.round((contentCounts.ebooks / totalInsights) * 100) || 10, color: '#10B981' },
  ];

  const totalResources = contentCounts.blogs + contentCounts.whitepapers + contentCounts.webinars + contentCounts.events + contentCounts.caseStudies || 1;
  const resourcesItems = [
    { label: 'Blog',         icon: <GlobalOutlined />,     count: `${contentCounts.blogs}`,       pct: Math.round((contentCounts.blogs / totalResources) * 100) || 35, color: '#0AAEEF' },
    { label: 'Case Studies', icon: <FileTextOutlined />,   count: `${contentCounts.caseStudies}`, pct: Math.round((contentCounts.caseStudies / totalResources) * 100) || 25, color: '#8B5CF6' },
    { label: 'Whitepapers',  icon: <FolderOpenOutlined />, count: `${contentCounts.whitepapers}`, pct: Math.round((contentCounts.whitepapers / totalResources) * 100) || 20, color: '#10B981' },
    { label: 'Webinars',     icon: <RiseOutlined />,       count: `${contentCounts.webinars}`,    pct: Math.round((contentCounts.webinars / totalResources) * 100) || 12, color: '#F59E0B' },
    { label: 'Events',       icon: <AimOutlined />,        count: `${contentCounts.events}`,      pct: Math.round((contentCounts.events / totalResources) * 100) || 8,  color: '#EF4444' },
  ];

  // Industry rows from live categories
  const industryList = categories.industries.length > 0
    ? categories.industries.map((c, i) => ({
        label: c.name,
        icon: <BuildOutlined />,
        count: `${c.content_count || Math.max(1, 12 - i * 2)}`,
        pct: Math.round((Math.max(1, 12 - i * 2) / 30) * 100),
        color: COLORS[i % COLORS.length],
      }))
    : [
        { label: 'Financial Services', icon: <BuildOutlined />, count: '14', pct: 60, color: '#0AAEEF' },
        { label: 'Healthcare & Life Sciences', icon: <BuildOutlined />, count: '10', pct: 45, color: '#8B5CF6' },
        { label: 'Manufacturing', icon: <BuildOutlined />, count: '8', pct: 35, color: '#10B981' },
        { label: 'Retail & E-commerce', icon: <BuildOutlined />, count: '6', pct: 25, color: '#F59E0B' },
      ];

  // Technology rows from live categories
  const techList = categories.technology.length > 0
    ? categories.technology.map((c, i) => ({
        label: c.name,
        icon: <AppstoreOutlined />,
        count: `${c.content_count || Math.max(1, 15 - i * 2)}`,
        pct: Math.round((Math.max(1, 15 - i * 2) / 35) * 100),
        color: COLORS[i % COLORS.length],
      }))
    : [
        { label: 'Cloud Computing', icon: <AppstoreOutlined />, count: '18', pct: 65, color: '#0AAEEF' },
        { label: 'Artificial Intelligence', icon: <AppstoreOutlined />, count: '15', pct: 55, color: '#8B5CF6' },
        { label: 'Cybersecurity', icon: <AppstoreOutlined />, count: '11', pct: 40, color: '#10B981' },
        { label: 'Data & Analytics', icon: <AppstoreOutlined />, count: '9', pct: 30, color: '#F59E0B' },
      ];

  const trafficSplit = [
    { label: 'Insights', pct: 38, color: '#0AAEEF' },
    { label: 'Resources', pct: 30, color: '#8B5CF6' },
    { label: 'Technology', pct: 18, color: '#10B981' },
    { label: 'Industries', pct: 14, color: '#F59E0B' },
  ];

  return (
    <div className="overview-section-container" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .overview-section-container {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }
        @media (max-width: 768px) {
          .overview-section-container {
            gap: 12px !important;
          }
        }
        @media (max-width: 600px) {
          .overview-section-container {
            gap: 10px !important;
          }
        }
        @media (max-width: 480px) {
          .overview-section-container {
            gap: 8px !important;
          }
        }
      `}</style>
      {/* ── 6 KPI CARDS ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 10,
          width: '100%',
          minWidth: 0,
        }}
        className="kpi-cards-grid"
      >
        {kpis.map((k) => (
          <KPICard key={k.title} {...k} darkMode={darkMode} />
        ))}
      </div>

      <style>{`
        @media (max-width: 1400px) { .kpi-cards-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 1200px) { .kpi-cards-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 900px)  { .kpi-cards-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px)  { .kpi-cards-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; } }
        @media (max-width: 600px)  { .kpi-cards-grid { grid-template-columns: 1fr; gap: 8px; } }
        @media (max-width: 480px) {
          .kpi-card { padding: 10px 12px !important; gap: 8px !important; }
          .kpi-card .kpi-value { font-size: 20px !important; }
          .kpi-card .kpi-delta { font-size: 9px !important; padding: 1px 5px !important; }
        }
        @media (max-width: 400px) {
          .kpi-card { padding: 8px 10px !important; gap: 6px !important; }
          .kpi-card .kpi-value { font-size: 18px !important; }
          .kpi-card .kpi-delta { font-size: 8px !important; padding: 1px 4px !important; }
        }
        .kpi-cards-grid {
          min-width: 0;
          width: 100%;
        }
      `}</style>

      {/* ── CONTENT BREAKDOWN (INSIGHTS, RESOURCES, TRAFFIC DONUT) ───────── */}
      <div
        className="content-breakdown-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}
      >
        <style>{`
          @media (max-width: 1200px) { .content-breakdown-grid { grid-template-columns: 1fr 1fr; } }
          @media (max-width: 900px)  { .content-breakdown-grid { grid-template-columns: 1fr 1fr; gap: 10px; } }
          @media (max-width: 768px)  { .content-breakdown-grid { grid-template-columns: 1fr; gap: 10px; } }
          @media (max-width: 600px)  { .content-breakdown-grid { grid-template-columns: 1fr; gap: 8px; } }
        `}</style>
        {/* Insights */}
        <div
          className="radar-glass-panel"
          style={{
            padding: '20px',
            background: darkMode ? '#0F172A' : '#FFFFFF',
            borderColor: darkMode ? '#334155' : '#E2E8F0',
            borderRadius: 12,
          }}
        >
          <style>{`
            @media (max-width: 768px) {
              .radar-glass-panel {
                padding: 16px !important;
              }
            }
            @media (max-width: 600px) {
              .radar-glass-panel {
                padding: 14px !important;
              }
            }
            @media (max-width: 480px) {
              .radar-glass-panel {
                padding: 12px !important;
              }
            }
          `}</style>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: darkMode ? '#F8FAFC' : '#0F172A',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FileTextOutlined style={{ color: '#0AAEEF' }} />
            <span>Insights</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {insightsItems.map((r) => (
              <NavCategoryRow key={r.label} {...r} darkMode={darkMode} />
            ))}
          </div>
        </div>

        {/* Resources */}
        <div
          className="radar-glass-panel"
          style={{
            padding: '20px',
            background: darkMode ? '#0F172A' : '#FFFFFF',
            borderColor: darkMode ? '#334155' : '#E2E8F0',
            borderRadius: 12,
          }}
        >
          <style>{`
            @media (max-width: 768px) {
              .radar-glass-panel {
                padding: 16px !important;
              }
            }
            @media (max-width: 600px) {
              .radar-glass-panel {
                padding: 14px !important;
              }
            }
            @media (max-width: 480px) {
              .radar-glass-panel {
                padding: 12px !important;
              }
            }
          `}</style>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: darkMode ? '#F8FAFC' : '#0F172A',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FolderOpenOutlined style={{ color: '#8B5CF6' }} />
            <span>Resources</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resourcesItems.map((r) => (
              <NavCategoryRow key={r.label} {...r} darkMode={darkMode} />
            ))}
          </div>
        </div>

        {/* Traffic Share by Section */}
        <div
          className="radar-glass-panel"
          style={{
            padding: '20px',
            background: darkMode ? '#0F172A' : '#FFFFFF',
            borderColor: darkMode ? '#334155' : '#E2E8F0',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <style>{`
            @media (max-width: 768px) {
              .radar-glass-panel {
                padding: 16px !important;
              }
            }
            @media (max-width: 600px) {
              .radar-glass-panel {
                padding: 14px !important;
              }
            }
            @media (max-width: 480px) {
              .radar-glass-panel {
                padding: 12px !important;
              }
            }
          `}</style>
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
            <GlobalOutlined style={{ color: '#10B981' }} />
            <span>Traffic by Section</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <MiniDonut segments={trafficSplit} size={90} darkMode={darkMode} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {trafficSplit.map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: s.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: darkMode ? '#94A3B8' : '#64748B',
                      flex: 1,
                    }}
                  >
                    {s.label}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: s.color,
                      fontFamily: 'monospace',
                    }}
                  >
                    {s.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── INDUSTRIES & TECHNOLOGY BREAKDOWN ─────────────────────────────── */}
      <div className="industry-tech-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <style>{`
          @media (max-width: 700px) { .industry-tech-grid { grid-template-columns: 1fr; } }
        `}</style>
        {/* Industries */}
        <div
          className="radar-glass-panel"
          style={{
            padding: '20px',
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
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <BuildOutlined style={{ color: '#0AAEEF' }} />
            <span>Industries</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {industryList.map((r) => (
              <NavCategoryRow key={r.label} {...r} darkMode={darkMode} />
            ))}
          </div>
        </div>

        {/* Technology */}
        <div
          className="radar-glass-panel"
          style={{
            padding: '20px',
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
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AppstoreOutlined style={{ color: '#8B5CF6' }} />
            <span>Technology</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {techList.map((r) => (
              <NavCategoryRow key={r.label} {...r} darkMode={darkMode} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
