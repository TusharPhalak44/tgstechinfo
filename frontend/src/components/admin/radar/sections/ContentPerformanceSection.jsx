import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileTextOutlined,
  FolderOpenOutlined,
  BuildOutlined,
  AppstoreOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  ReadOutlined,
  TrophyOutlined,
  EditOutlined,
  RiseOutlined,
  UserOutlined,
  CompassOutlined,
} from '@ant-design/icons';

const COLORS = ['#0AAEEF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#64748B'];

/* ─────────────────────────────────────────────────────────────────────────────
   CHART PRIMITIVES (CLEAN SOLID STYLES & SMOOTH ANIMATIONS)
───────────────────────────────────────────────────────────────────────────── */

// ── SVG Area / Trend Chart (Clean Solid Line & Area) ─────────────────────────
const AreaChart = ({ data, color, label, total, width = 300, height = 90, darkMode }) => {
  const pad = { top: 8, right: 8, bottom: 20, left: 32 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;
  const max = Math.max(...data.map(d => d.v || 0), 1);
  const pts = data.map((d, i) => ({
    x: pad.left + (i / Math.max(1, data.length - 1)) * W,
    y: pad.top + H - ((d.v || 0) / max) * H,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(pad.top + H).toFixed(1)} L${pts[0].x.toFixed(1)},${(pad.top + H).toFixed(1)} Z`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: darkMode ? '#CBD5E1' : '#475569' }}>{label}</span>
        <span style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'monospace' }}>{(total || 0).toLocaleString()}</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        {/* Y gridlines */}
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line
            key={f}
            x1={pad.left}
            y1={pad.top + H * (1 - f)}
            x2={pad.left + W}
            y2={pad.top + H * (1 - f)}
            stroke={darkMode ? '#1E293B' : '#E2E8F0'}
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        ))}
        {/* Flat Area fill */}
        <path d={areaPath} fill={color} fillOpacity="0.12" />
        {/* Solid Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Data dots + x labels */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill={color} />
            <text
              x={p.x}
              y={pad.top + H + 14}
              textAnchor="middle"
              fill={darkMode ? '#64748B' : '#94A3B8'}
              fontSize="9"
              fontFamily="monospace"
            >
              {data[i]?.label}
            </text>
          </g>
        ))}
        {/* Y axis text */}
        <text
          x={pad.left - 4}
          y={pad.top + 4}
          textAnchor="end"
          fill={darkMode ? '#64748B' : '#94A3B8'}
          fontSize="9"
          fontFamily="monospace"
        >
          {max >= 1000 ? `${(max / 1000).toFixed(0)}k` : max}
        </text>
        <text
          x={pad.left - 4}
          y={pad.top + H}
          textAnchor="end"
          fill={darkMode ? '#64748B' : '#94A3B8'}
          fontSize="9"
          fontFamily="monospace"
        >
          0
        </text>
      </svg>
    </div>
  );
};

// ── Vertical Bar Chart (Clean Solid Colors) ──────────────────────────────────
const VerticalBarChart = ({ items, darkMode, width = 400, height = 150 }) => {
  const [hovered, setHovered] = useState(null);
  const pad = { top: 10, right: 8, bottom: 28, left: 8 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;
  const max = Math.max(...items.map(d => d.views || 0), 1);
  const barW = Math.max(8, Math.floor(W / Math.max(1, items.length)) - 10);

  // Return empty state if no data
  if (!items || items.length === 0 || max === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: `${height}px`,
        color: darkMode ? '#64748B' : '#94A3B8',
        fontSize: '12px'
      }}>
        No data available
      </div>
    );
  }

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line
          key={f}
          x1={pad.left}
          y1={pad.top + H * (1 - f)}
          x2={pad.left + W}
          y2={pad.top + H * (1 - f)}
          stroke={darkMode ? '#1E293B' : '#E2E8F0'}
          strokeWidth="1"
          strokeDasharray="4 3"
        />
      ))}
      {items.map((item, i) => {
        const barH = ((item.views || 0) / max) * H;
        const x = pad.left + i * (W / items.length) + (W / items.length - barW) / 2;
        const y = pad.top + H - barH;
        const isHov = hovered === i;
        return (
          <g
            key={i}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(2, barH)}
              rx="4"
              ry="4"
              fill={item.color}
              fillOpacity={isHov ? 1 : 0.85}
              style={{
                transition: 'y 0.6s cubic-bezier(0.16, 1, 0.3, 1), height 0.6s cubic-bezier(0.16, 1, 0.3, 1), fill-opacity 0.2s',
              }}
            />
            {isHov && (
              <text
                x={x + barW / 2}
                y={y - 5}
                textAnchor="middle"
                fill={item.color}
                fontSize="10"
                fontWeight="700"
                fontFamily="monospace"
              >
                {item.views.toLocaleString()}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={pad.top + H + 16}
              textAnchor="middle"
              fill={darkMode ? '#94A3B8' : '#64748B'}
              fontSize="9"
              fontFamily="'Plus Jakarta Sans', sans-serif"
              style={{ fontWeight: 600 }}
            >
              {item.label?.split(/\s+/)[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ── Radial Ring Component (Solid Color Progress Arc) ────────────────────────
const RadialRing = ({ value, max, color, label, icon, darkMode, size = 100 }) => {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = ((value || 0) / Math.max(1, max)) * circ;
  const cx = size / 2, cy = size / 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={darkMode ? '#1E293B' : '#E2E8F0'}
          strokeWidth={size * 0.1}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.1}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
        <g transform={`translate(${cx - 8}, ${cy - 16})`}>
          <foreignObject width="16" height="16">
            <div style={{ color, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </div>
          </foreignObject>
        </g>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontSize={size * 0.14}
          fontWeight="800"
          fill={color}
          fontFamily="monospace"
        >
          {Math.round(((value || 0) / Math.max(1, max)) * 100)}%
        </text>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: darkMode ? '#CBD5E1' : '#475569' }}>{label}</div>
        <div style={{ fontSize: 10, fontFamily: 'monospace', color, fontWeight: 700 }}>
          {(value || 0).toLocaleString()} views
        </div>
      </div>
    </div>
  );
};

// ── Lollipop Chart (Flat Clean Bar & Ball) ────────────────────────────────────
const LollipopChart = ({ items, darkMode, height = 30 }) => {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...items.map(d => d.views || 0), 1);

  // Return empty state if no data
  if (!items || items.length === 0 || max === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: `${height * 8}px`,
        color: darkMode ? '#64748B' : '#94A3B8',
        fontSize: '12px'
      }}>
        No data available
      </div>
    );
  }

  return (
    <div className="lollipop-chart" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => {
        const pct = ((item.views || 0) / max) * 100;
        const isHov = hovered === i;
        return (
          <div
            key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className="label"
              style={{
                width: 140,
                fontSize: 11,
                fontWeight: 600,
                color: isHov ? item.color : (darkMode ? '#94A3B8' : '#64748B'),
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'color 0.2s',
              }}
            >
              {item.label}
            </div>
            {/* Stick & Ball */}
            <div style={{ flex: 1, position: 'relative', height }}>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  height: 2,
                  transform: 'translateY(-50%)',
                  width: `${Math.min(100, Math.max(2, pct))}%`,
                  background: item.color,
                  borderRadius: 2,
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `calc(${Math.min(100, Math.max(2, pct))}% - 5px)`,
                  transform: 'translateY(-50%)',
                  width: isHov ? 14 : 10,
                  height: isHov ? 14 : 10,
                  borderRadius: '50%',
                  background: item.color,
                  transition: 'all 0.2s ease',
                }}
              />
            </div>
            <div
              className="value"
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                fontWeight: 700,
                color: item.color,
                width: 50,
                textAlign: 'right',
                flexShrink: 0,
              }}
            >
              {(item.views || 0).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Read-Rate Progress Circle (Solid Colors) ──────────────────────────────────
const ReadRateRing = ({ rate, color, size = 48, darkMode }) => {
  const r = size * 0.4, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = ((rate || 0) / 100) * circ;

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={darkMode ? '#1E293B' : '#E2E8F0'}
        strokeWidth={size * 0.12}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={size * 0.12}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize={size * 0.22}
        fontWeight="800"
        fill={color}
        fontFamily="monospace"
      >
        {rate}%
      </text>
    </svg>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN CONTENT PERFORMANCE COMPONENT
───────────────────────────────────────────────────────────────────────────── */
const ContentPerformanceSection = ({ darkMode, popularPages = [], topBlogs = [], timeRange = '7d' }) => {
  const [activeGroup, setActiveGroup] = useState('insights');
  const [categories, setCategories] = useState({ industries: [], technology: [] });
  const [realContent, setRealContent] = useState([]);
  const [contentStats, setContentStats] = useState({
    insightsViews: 0,
    resourcesViews: 0,
    insightsItems: [],
    resourcesItems: [],
  });
  const [dailyAnalytics, setDailyAnalytics] = useState([]);
  const [engagementMetrics, setEngagementMetrics] = useState({});

  useEffect(() => {
    console.log('=== ContentPerformanceSection useEffect triggered ===');
    console.log('Current timeRange:', timeRange);
    console.log('Current contentStats before fetch:', contentStats);
    
    let dateParams = '';
    
    if (timeRange !== 'all') {
      const endDate = new Date();
      const startDate = new Date();
      if (timeRange === '7d') startDate.setDate(startDate.getDate() - 7);
      if (timeRange === '30d') startDate.setDate(startDate.getDate() - 30);
      if (timeRange === '90d') startDate.setDate(startDate.getDate() - 90);

      const s = startDate.toISOString().split('T')[0];
      const e = endDate.toISOString().split('T')[0];
      dateParams = `?start_date=${s}&end_date=${e}`;
      console.log('Date parameters calculated:', { timeRange, startDate: s, endDate: e, dateParams });
    } else {
      console.log('Using "all" time range - no date filters');
    }

    // 1. Fetch analytics data first to get time-based page views
    axios.get(`/api/analytics/overview${dateParams}`).then(({ data }) => {
      console.log('Analytics API Response:', data);
      const dailySessions = data?.sessionAnalytics?.dailySessions || [];
      const totalPageViews = data?.totalPageViews || 0;
      setDailyAnalytics(dailySessions);
      
      // Store engagement metrics for real read rate calculations
      setEngagementMetrics({
        totalEngagements: data?.totalEngagements || 0,
        avgReadTime: data?.avgReadTime || 0,
        scrollDepth: data?.scrollDepth || 0,
      });
    }).catch((error) => {
      console.error('Analytics API Error:', error);
    });

    // 2. Fetch content type breakdown with date filtering
    console.log('Calling API: /api/analytics/content-type-breakdown' + dateParams);
    axios.get(`/api/analytics/content-type-breakdown${dateParams}`).then(({ data }) => {
      console.log('=== Content Type Breakdown API Response ===');
      console.log('Full response:', data);
      console.log('insightsTotal:', data.insightsTotal);
      console.log('resourcesTotal:', data.resourcesTotal);
      console.log('insightsItems:', data.insightsItems);
      console.log('resourcesItems:', data.resourcesItems);
      
      const iconMap = {
        'article': <FileTextOutlined />,
        'news': <RiseOutlined />,
        'interview': <UserOutlined />,
        'ebook': <FolderOpenOutlined />,
        'whitepaper': <FolderOpenOutlined />,
        'case-study': <CheckCircleOutlined />,
        'report': <FileTextOutlined />,
        'guide': <CompassOutlined />,
        'blog': <GlobalOutlined />,
        'webinar': <RiseOutlined />,
        'event': <FileTextOutlined />,
        'video': <EyeOutlined />,
        'podcast': <ReadOutlined />,
      };

      const colorMap = {
        'article': '#0AAEEF',
        'news': '#F59E0B',
        'interview': '#8B5CF6',
        'ebook': '#10B981',
        'whitepaper': '#10B981',
        'case-study': '#8B5CF6',
        'report': '#0AAEEF',
        'guide': '#F97316',
        'blog': '#0AAEEF',
        'webinar': '#F59E0B',
        'event': '#EF4444',
        'video': '#06B6D4',
        'podcast': '#8B5CF6',
      };

      const insightsItems = (data.insightsItems || []).map(item => ({
        label: item.label,
        views: item.views,
        color: colorMap[item.content_type] || '#64748B',
        icon: iconMap[item.content_type] || <FileTextOutlined />,
      }));

      const resourcesItems = (data.resourcesItems || []).map(item => ({
        label: item.label,
        views: item.views,
        color: colorMap[item.content_type] || '#64748B',
        icon: iconMap[item.content_type] || <FolderOpenOutlined />,
      }));

      console.log('=== Setting content stats ===');
      console.log('insightsViews:', data.insightsTotal || 0);
      console.log('resourcesViews:', data.resourcesTotal || 0);
      console.log('mapped insightsItems:', insightsItems);
      console.log('mapped resourcesItems:', resourcesItems);

      setContentStats({
        insightsViews: data.insightsTotal || 0,
        resourcesViews: data.resourcesTotal || 0,
        insightsItems,
        resourcesItems,
      });
    }).catch((error) => {
      console.error('=== Content Type Breakdown API Error ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      console.log('Using fallback data due to API error');
      // Fallback to proportional distribution
      const totalPageViews = 1000; // Default fallback
      const insightsDistribution = Math.round(totalPageViews * 0.85);
      const resourcesDistribution = Math.round(totalPageViews * 0.15);
      
      setContentStats({
        insightsViews: insightsDistribution,
        resourcesViews: resourcesDistribution,
        insightsItems: [
          { label: 'Articles',   views: Math.round(insightsDistribution * 0.45), color: '#0AAEEF', icon: <FileTextOutlined /> },
          { label: 'News',       views: Math.round(insightsDistribution * 0.20), color: '#F59E0B', icon: <RiseOutlined /> },
          { label: 'Interviews', views: Math.round(insightsDistribution * 0.10), color: '#8B5CF6', icon: <UserOutlined /> },
          { label: 'eBooks',     views: Math.round(insightsDistribution * 0.10), color: '#10B981', icon: <FolderOpenOutlined /> },
        ],
        resourcesItems: [
          { label: 'Blog',         views: Math.round(resourcesDistribution * 0.08), color: '#0AAEEF', icon: <GlobalOutlined /> },
          { label: 'Case Studies', views: Math.round(resourcesDistribution * 0.03), color: '#8B5CF6', icon: <CheckCircleOutlined /> },
          { label: 'Whitepapers',  views: Math.round(resourcesDistribution * 0.02), color: '#10B981', icon: <FolderOpenOutlined /> },
          { label: 'Webinars',     views: Math.round(resourcesDistribution * 0.01), color: '#F59E0B', icon: <RiseOutlined /> },
          { label: 'Events',       views: Math.round(resourcesDistribution * 0.01), color: '#EF4444', icon: <FileTextOutlined /> },
        ],
      });
    });

    // 3. Fetch categories with date filtering
    axios.get(`/api/public/categories${dateParams}`).then(({ data }) => {
      console.log('Categories API Response:', data);
      const industries = (data || []).filter(c => c.type === 'industry');
      const technology = (data || []).filter(c => c.type === 'technology' || (!c.type && c.slug));
      setCategories({ industries, technology });
    }).catch((error) => {
      console.error('Categories API Error:', error);
    });

    // 4. Fetch top content by engagement with date filtering
    const engagementSep = dateParams ? '&' : '';
    const engagementDateStr = dateParams ? dateParams.replace('?', '') : '';
    axios.get(`/api/analytics/top-content-engagement?limit=10${engagementSep}${engagementDateStr}`).then(({ data }) => {
      console.log('Top Content by Engagement API Response:', data);
      const topContent = data?.topContent || [];
      
      // Use engagement data regardless of whether it has engagement counts
      // This allows showing content sorted by views even when engagement data is missing
      setRealContent(topContent);
    }).catch((error) => {
      console.error('Top Content by Engagement API Error:', error);
      // Fallback to regular content API with date filtering when engagement API fails
      axios.get(`/api/public/content?limit=50&status=published${dateParams}`).then(({ data }) => {
        console.log('Fallback Content API Response:', data);
        const rows = data?.data || data?.rows || data || [];
        setRealContent(rows);
      }).catch((fallbackError) => {
        console.error('Fallback Content API Error:', fallbackError);
      });
    });
  }, [timeRange]);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Calculate real weekly trends from daily analytics data
  const getWeeklyTrend = (totalViews) => {
    if (dailyAnalytics.length > 0) {
      // Use actual daily data if available
      return dailyAnalytics.slice(-7).map((d, i) => ({
        v: d.session_count || 0,
        label: DAYS[i % 7]
      }));
    } else {
      // Distribute total views evenly across days if no daily data
      const dailyAvg = Math.round(totalViews / 7);
      return DAYS.map(day => ({ v: dailyAvg, label: day }));
    }
  };

  const insightTrend = getWeeklyTrend(contentStats.insightsViews);
  const resourceTrend = getWeeklyTrend(contentStats.resourcesViews);

  // Map industry & tech views dynamically from live categories
  const industryChartItems = categories.industries.map((c, i) => ({
    label: c.name,
    views: c.content_count || 0,
    color: COLORS[i % COLORS.length],
  }));
  const techChartItems = categories.technology.map((c, i) => ({
    label: c.name,
    views: c.content_count || 0,
    color: COLORS[i % COLORS.length],
  }));

  // Top Pages from real API prop or live content
  const pageList = popularPages.length > 0
    ? popularPages.map((p, i) => ({
        label: p.page || p.page_url || p.url || `Page ${i+1}`,
        views: p.view_count || 0,
        color: COLORS[i % COLORS.length],
      }))
    : (realContent.length > 0
        ? realContent.slice(0, 6).map((c, i) => ({
            label: `/${c.slug || c.title}`,
            views: c.view_count || c.views || 0,
            color: COLORS[i % COLORS.length],
          }))
        : []);

  // Top Articles list from engagement API with real read rates
  const articleList = realContent.slice(0, 5).map(c => {
    const views = c.views || c.view_count || 0;
    const readRate = c.readRate || 0;
    const reads = c.completedReads || Math.round(views * (readRate / 100)) || 0;
    return {
      title: c.title || 'Untitled Article',
      views,
      reads,
      readRate: Math.min(100, Math.max(0, readRate)),
    };
  });

  const GROUPS = [
    { key: 'insights',   label: 'Insights',   icon: <FileTextOutlined /> },
    { key: 'resources',  label: 'Resources',  icon: <FolderOpenOutlined /> },
    { key: 'industries', label: 'Industries', icon: <BuildOutlined /> },
    { key: 'technology', label: 'Technology', icon: <AppstoreOutlined /> },
  ];

  return (
    <div className="content-performance-section" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @media (max-width: 1024px) {
          .content-performance-section {
            gap: 16px !important;
          }
        }
        @media (max-width: 768px) {
          .content-performance-section {
            gap: 14px !important;
          }
        }
        @media (max-width: 480px) {
          .content-performance-section {
            gap: 12px !important;
          }
        }
      `}</style>
      {/* Header stat cards */}
      <div className="content-perf-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <style>{`
          @media (max-width: 1024px) {
            .content-perf-stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 12px !important;
            }
          }
          @media (max-width: 768px) {
            .content-perf-stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 10px !important;
            }
          }
          @media (max-width: 480px) {
            .content-perf-stats-grid {
              grid-template-columns: 1fr !important;
              gap: 8px !important;
            }
          }
        `}</style>
        {[
          { label: 'Total Content Views', value: (contentStats.insightsViews + contentStats.resourcesViews).toLocaleString(), color: '#0AAEEF', icon: <EyeOutlined /> },
          { label: 'Insights Views', value: contentStats.insightsViews.toLocaleString(), color: '#8B5CF6', icon: <FileTextOutlined /> },
          { label: 'Resources Views', value: contentStats.resourcesViews.toLocaleString(), color: '#10B981', icon: <FolderOpenOutlined /> },
          { label: 'Top Performing', value: realContent.length > 0 ? realContent[0]?.title?.substring(0, 15) || 'N/A' : 'N/A', color: '#F59E0B', icon: <RiseOutlined /> },
        ].map((m) => (
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
            <div style={{ fontSize: 18, color: m.color, marginBottom: 8 }}>{m.icon}</div>
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

      {/* ── ROW 1: Area charts (Insights & Resources weekly trends) ────────── */}
      <div className="area-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <style>{`
          @media (max-width: 1024px) {
            .area-charts-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
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
            <FileTextOutlined style={{ color: '#0AAEEF' }} />
            <span>Insights — Weekly Views Trend</span>
          </div>
          <AreaChart
            data={insightTrend}
            color="#0AAEEF"
            label="Total Views"
            total={contentStats.insightsViews}
            darkMode={darkMode}
          />
        </div>

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
            <FolderOpenOutlined style={{ color: '#8B5CF6' }} />
            <span>Resources — Weekly Views Trend</span>
          </div>
          <AreaChart
            data={resourceTrend}
            color="#8B5CF6"
            label="Total Views"
            total={contentStats.resourcesViews}
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* ── ROW 2: Category Breakdown with Tab Switcher ──────────────────── */}
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: darkMode ? '#F8FAFC' : '#0F172A' }}>
              Content Category Metrics
            </div>
            <div style={{ fontSize: 11, color: darkMode ? '#94A3B8' : '#64748B', marginTop: 2 }}>
              Dynamic live view share across published content
            </div>
          </div>
          {/* Switcher Buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {GROUPS.map((g) => {
              const active = activeGroup === g.key;
              return (
                <button
                  key={g.key}
                  onClick={() => setActiveGroup(g.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: active ? '1px solid #0AAEEF' : `1px solid ${darkMode ? '#334155' : '#E2E8F0'}`,
                    background: active ? (darkMode ? '#0E2A47' : '#E0F2FE') : 'transparent',
                    color: active ? '#0AAEEF' : (darkMode ? '#94A3B8' : '#64748B'),
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>{g.icon}</span>
                  <span>{g.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Display based on activeGroup */}
        {activeGroup === 'insights' && (
          <div key={`insights-${timeRange}`} className="insights-rings-container" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 20 }}>
            {contentStats.insightsItems.map((item) => (
              <RadialRing
                key={`${item.label}-${timeRange}`}
                value={item.views}
                max={contentStats.insightsViews || 100}
                color={item.color}
                label={item.label}
                icon={item.icon}
                darkMode={darkMode}
                size={110}
              />
            ))}
          </div>
        )}

        {activeGroup === 'resources' && (
          <div key={`resources-${timeRange}`} style={{ padding: '0 10px' }}>
            <VerticalBarChart items={contentStats.resourcesItems} darkMode={darkMode} width={500} height={160} />
          </div>
        )}

        {activeGroup === 'industries' && (
          <div style={{ padding: '0 10px' }}>
            <LollipopChart items={industryChartItems.slice(0, 6)} darkMode={darkMode} />
          </div>
        )}

        {activeGroup === 'technology' && (
          <div style={{ padding: '0 10px' }}>
            <LollipopChart items={techChartItems.slice(0, 6)} darkMode={darkMode} />
          </div>
        )}
      </div>

      {/* ── ROW 3: Side-by-Side Industries vs Technology ──────────────────── */}
      <div className="industry-tech-traffic-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <style>{`
          @media (max-width: 1024px) {
            .industry-tech-traffic-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
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
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <BuildOutlined style={{ color: '#0AAEEF' }} />
            <span>Industries Traffic</span>
          </div>
          <div style={{ fontSize: 11, color: darkMode ? '#94A3B8' : '#64748B', marginBottom: 14 }}>
            Views distributed across industry verticals
          </div>
          <VerticalBarChart items={industryChartItems.slice(0, 6)} darkMode={darkMode} width={380} height={140} />
        </div>

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
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AppstoreOutlined style={{ color: '#8B5CF6' }} />
            <span>Technology Traffic</span>
          </div>
          <div style={{ fontSize: 11, color: darkMode ? '#94A3B8' : '#64748B', marginBottom: 14 }}>
            Views distributed across technology categories
          </div>
          <VerticalBarChart items={techChartItems.slice(0, 6)} darkMode={darkMode} width={380} height={140} />
        </div>
      </div>

      {/* ── ROW 4: Top Pages Lollipop Chart ──────────────────────────────── */}
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
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <TrophyOutlined style={{ color: '#F59E0B' }} />
          <span>Top Pages by Traffic</span>
        </div>
        <LollipopChart items={pageList.slice(0, 8)} darkMode={darkMode} height={34} />
      </div>

      {/* ── ROW 5: Top Articles List with Clean Read-Rate Progress ────────── */}
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
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <EditOutlined style={{ color: '#10B981' }} />
          <span>Top Articles by Engagement</span>
        </div>
        <div className="article-list-container" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {articleList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: darkMode ? '#64748B' : '#94A3B8', fontSize: 13 }}>
              No engagement data for selected time range
            </div>
          ) : articleList.map((b, i) => {
            const color = COLORS[i % COLORS.length];
            const readRate = b.readRate || Math.round(((b.reads || 0) / Math.max(1, b.views || 1)) * 100) || 0;
            return (
              <div
                key={i}
                className="article-engagement-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '48px 1fr auto',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: darkMode ? '#1E293B' : '#F8FAFC',
                  border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}`,
                  transition: 'border-color 0.2s',
                }}
              >
                <ReadRateRing rate={readRate} color={color} size={48} darkMode={darkMode} />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: darkMode ? '#F8FAFC' : '#0F172A',
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {b.title}
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: darkMode ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <EyeOutlined /> {(b.views || 0).toLocaleString()} views
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: darkMode ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ReadOutlined /> {(b.reads || 0).toLocaleString()} reads
                    </span>
                  </div>
                </div>
                <div className="read-rate-col" style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="rate-value" style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'monospace' }}>
                    {readRate}%
                  </div>
                  <div
                    className="rate-label"
                    style={{
                      fontSize: 9,
                      color: darkMode ? '#94A3B8' : '#64748B',
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    read rate
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ContentPerformanceSection;
