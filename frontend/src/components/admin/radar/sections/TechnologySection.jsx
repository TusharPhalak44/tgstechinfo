import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import {
  GlobalOutlined,
  DesktopOutlined,
  MobileOutlined,
  LaptopOutlined,
  TabletOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const COLORS = ['#0AAEEF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#64748B'];

// ── Clean Flat SVG Pie / Donut Chart ─────────────────────────────────────────
const PieChart = ({ segments, size = 130, darkMode }) => {
  const cx = size / 2, cy = size / 2, r = size * 0.4;
  let cumAngle = -Math.PI / 2;

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {segments.map((seg, i) => {
        const angle = ((seg.pct || 0) / 100) * 2 * Math.PI;
        const x1 = cx + r * Math.cos(cumAngle);
        const y1 = cy + r * Math.sin(cumAngle);
        const x2 = cx + r * Math.cos(cumAngle + angle);
        const y2 = cy + r * Math.sin(cumAngle + angle);
        const large = angle > Math.PI ? 1 : 0;
        const path = `M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`;
        const el = (
          <path
            key={i}
            d={path}
            fill={seg.color}
            style={{ transition: 'opacity 0.2s' }}
          >
            <title>{seg.label}: {seg.pct}%</title>
          </path>
        );
        cumAngle += angle;
        return el;
      })}
      {/* Center cutout */}
      <circle cx={cx} cy={cy} r={r * 0.55} fill={darkMode ? '#0F172A' : '#FFFFFF'} />
    </svg>
  );
};

const TechCard = ({ title, segments, darkMode, icon }) => (
  <div
    className="radar-glass-panel"
    style={{
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
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
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ color: '#0AAEEF' }}>{icon}</span>
      <span>{title}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <PieChart segments={segments} darkMode={darkMode} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 120 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: s.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: darkMode ? '#CBD5E1' : '#334155', flex: 1 }}>
              {s.label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>
              {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TechnologySection = ({ darkMode, recentSessions = [], timeRange = '7d' }) => {
  const [filteredSessions, setFilteredSessions] = useState([]);
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
      dateParams = `?start_date=${s}&end_date=${e}`;
    }

    console.log('TechnologySection - Fetching sessions with timeRange:', timeRange, 'dateParams:', dateParams);
    console.log('TechnologySection - Full API URL:', `/api/analytics/sessions${dateParams}`);

    // Fetch session data with date filtering
    axios.get(`/api/analytics/sessions${dateParams}`)
      .then(res => {
        console.log('TechnologySection - API response:', res.data);
        const sessions = Array.isArray(res.data.recentSessions) ? res.data.recentSessions : Array.isArray(res.data.sessions) ? res.data.sessions : Array.isArray(res.data) ? res.data : [];
        console.log('TechnologySection - Sessions fetched:', sessions.length);
        console.log('TechnologySection - Sample session data:', sessions.length > 0 ? sessions[0] : 'No sessions');
        if (sessions.length > 0) {
          console.log('TechnologySection - Session data structure:', JSON.stringify(sessions.slice(0, 2), null, 2));
        }
        setFilteredSessions(sessions);
        setLoading(false);
      })
      .catch(err => {
        console.error('TechnologySection - Error fetching sessions:', err);
        setFilteredSessions([]);
        setLoading(false);
      });
  }, [timeRange]);

  // Aggregate real technology metrics from filteredSessions dynamically
  const { browsers, os, devices, screenRes, counts } = useMemo(() => {
    const browserMap = {};
    const osMap = {};
    const deviceMap = {};
    const resMap = {};

    console.log('TechnologySection - Processing sessions:', filteredSessions.length);

    if (filteredSessions && filteredSessions.length > 0) {
      filteredSessions.forEach(s => {
        const b = s.browser || 'Unknown';
        const o = s.operating_system || 'Unknown';
        const d = s.device_type || 'Unknown';
        const r = s.screen_resolution || 'Unknown';

        browserMap[b] = (browserMap[b] || 0) + 1;
        osMap[o] = (osMap[o] || 0) + 1;
        deviceMap[d] = (deviceMap[d] || 0) + 1;
        resMap[r] = (resMap[r] || 0) + 1;
      });

      console.log('TechnologySection - Browser map:', browserMap);
      console.log('TechnologySection - OS map:', osMap);
      console.log('TechnologySection - Device map:', deviceMap);
      console.log('TechnologySection - Resolution map:', resMap);
    }

    const total = Math.max(1, filteredSessions.length);

    const toSortedArray = (map) => {
      const keys = Object.keys(map);
      if (keys.length === 0) return [];
      return keys
        .sort((a, b) => map[b] - map[a])
        .slice(0, 5)
        .map((k, i) => ({
          label: k,
          pct: Math.round((map[k] / total) * 100),
          color: COLORS[i % COLORS.length],
        }));
    };

    const bList = toSortedArray(browserMap);
    const oList = toSortedArray(osMap);
    const dList = toSortedArray(deviceMap);
    const rList = toSortedArray(resMap);

    const counts = {
      browsers: Object.keys(browserMap).length,
      os: Object.keys(osMap).length,
      devices: Object.keys(deviceMap).length,
      screens: Object.keys(resMap).length,
    };

    console.log('TechnologySection - Final data:', { browsers: bList, os: oList, devices: dList, screenRes: rList, counts });

    return {
      browsers: bList,
      os: oList,
      devices: dList,
      screenRes: rList,
      counts,
    };
  }, [filteredSessions]);

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
        Loading technology data...
      </div>
    );
  }

  const hasData = browsers.length > 0 || os.length > 0 || devices.length > 0 || screenRes.length > 0;

  return (
    <div className="technology-section" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @media (max-width: 1024px) {
          .technology-section {
            gap: 16px !important;
          }
        }
        @media (max-width: 768px) {
          .technology-section {
            gap: 14px !important;
          }
        }
        @media (max-width: 480px) {
          .technology-section {
            gap: 12px !important;
          }
        }
      `}</style>
      {/* 4 Summary Cards */}
      <div className="tech-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <style>{`
          @media (max-width: 1024px) {
            .tech-summary-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 12px !important;
            }
          }
          @media (max-width: 768px) {
            .tech-summary-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 10px !important;
            }
          }
          @media (max-width: 480px) {
            .tech-summary-grid {
              grid-template-columns: 1fr !important;
              gap: 8px !important;
            }
          }
        `}</style>
        {[
          { label: 'Browsers Detected', value: counts.browsers, color: '#0AAEEF', icon: <GlobalOutlined /> },
          { label: 'OS Platforms', value: counts.os, color: '#8B5CF6', icon: <LaptopOutlined /> },
          { label: 'Device Formats', value: counts.devices, color: '#10B981', icon: <MobileOutlined /> },
          { label: 'Screen Viewports', value: counts.screens, color: '#F59E0B', icon: <DesktopOutlined /> },
        ].map(m => (
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
            <div style={{ fontSize: 18, color: m.color, marginBottom: 6 }}>{m.icon}</div>
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
            <div style={{ fontSize: 24, fontWeight: 800, color: m.color, fontFamily: 'monospace' }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* 3 Donut Cards */}
      <div className="tech-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <style>{`
          @media (max-width: 1024px) {
            .tech-cards-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 768px) {
            .tech-cards-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
        {browsers.length > 0 ? (
          <TechCard title="Browsers" segments={browsers} darkMode={darkMode} icon={<GlobalOutlined />} />
        ) : (
          <EmptyState message="No browser data available" />
        )}
        {os.length > 0 ? (
          <TechCard title="Operating Systems" segments={os} darkMode={darkMode} icon={<LaptopOutlined />} />
        ) : (
          <EmptyState message="No OS data available" />
        )}
        {devices.length > 0 ? (
          <TechCard title="Device Types" segments={devices} darkMode={darkMode} icon={<MobileOutlined />} />
        ) : (
          <EmptyState message="No device data available" />
        )}
      </div>

      {/* Screen Resolutions Table */}
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
          <DesktopOutlined style={{ color: '#0AAEEF' }} />
          <span>Screen Resolutions</span>
        </div>
        {screenRes.length > 0 ? (
          <div className="screen-res-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {screenRes.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  className="res-label"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    fontWeight: 600,
                    color: darkMode ? '#CBD5E1' : '#334155',
                    width: 160,
                    flexShrink: 0,
                  }}
                >
                  {s.label}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    background: darkMode ? '#1E293B' : '#E2E8F0',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, s.pct * 2.5))}%`,
                      borderRadius: 3,
                      background: s.color || COLORS[i % COLORS.length],
                      transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
                <span
                  className="res-pct"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 11,
                    fontWeight: 700,
                    color: s.color || COLORS[i % COLORS.length],
                    width: 36,
                    textAlign: 'right',
                  }}
                >
                  {s.pct}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No screen resolution data available" />
        )}
      </div>
    </div>
  );
};

export default TechnologySection;
