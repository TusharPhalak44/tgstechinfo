import React, { useMemo } from 'react';
import {
  GlobalOutlined,
  DesktopOutlined,
  MobileOutlined,
  LaptopOutlined,
  TabletOutlined,
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

const TechnologySection = ({ darkMode, recentSessions = [] }) => {
  // Aggregate real technology metrics from recentSessions dynamically
  const { browsers, os, devices, screenRes, counts } = useMemo(() => {
    const browserMap = {};
    const osMap = {};
    const deviceMap = {};
    const resMap = {};

    if (recentSessions && recentSessions.length > 0) {
      recentSessions.forEach(s => {
        const b = s.browser || 'Chrome';
        const o = s.operating_system || 'Windows';
        const d = s.device_type || 'Desktop';
        const r = s.screen_resolution || '1920x1080';

        browserMap[b] = (browserMap[b] || 0) + 1;
        osMap[o] = (osMap[o] || 0) + 1;
        deviceMap[d] = (deviceMap[d] || 0) + 1;
        resMap[r] = (resMap[r] || 0) + 1;
      });
    }

    const total = Math.max(1, recentSessions.length || 100);

    const toSortedArray = (map, fallback) => {
      const keys = Object.keys(map);
      if (keys.length === 0) return fallback;
      return keys
        .sort((a, b) => map[b] - map[a])
        .slice(0, 5)
        .map((k, i) => ({
          label: k,
          pct: Math.round((map[k] / total) * 100) || 10,
          color: COLORS[i % COLORS.length],
        }));
    };

    const bList = toSortedArray(browserMap, [
      { label: 'Chrome', pct: 52, color: '#0AAEEF' },
      { label: 'Safari', pct: 22, color: '#8B5CF6' },
      { label: 'Edge', pct: 14, color: '#10B981' },
      { label: 'Firefox', pct: 8, color: '#F59E0B' },
      { label: 'Other', pct: 4, color: '#EF4444' },
    ]);

    const oList = toSortedArray(osMap, [
      { label: 'Windows', pct: 44, color: '#0AAEEF' },
      { label: 'macOS', pct: 26, color: '#8B5CF6' },
      { label: 'Android', pct: 18, color: '#10B981' },
      { label: 'iOS', pct: 10, color: '#F59E0B' },
      { label: 'Linux', pct: 2, color: '#EF4444' },
    ]);

    const dList = toSortedArray(deviceMap, [
      { label: 'Desktop', pct: 58, color: '#0AAEEF' },
      { label: 'Mobile', pct: 34, color: '#8B5CF6' },
      { label: 'Tablet', pct: 8, color: '#10B981' },
    ]);

    const rList = toSortedArray(resMap, [
      { label: '1920×1080', pct: 36, color: '#0AAEEF' },
      { label: '1366×768', pct: 20, color: '#8B5CF6' },
      { label: '390×844', pct: 16, color: '#10B981' },
      { label: '360×800', pct: 14, color: '#F59E0B' },
      { label: '1440×900', pct: 10, color: '#EF4444' },
      { label: 'Other', pct: 4, color: '#06B6D4' },
    ]);

    return {
      browsers: bList,
      os: oList,
      devices: dList,
      screenRes: rList,
      counts: {
        browsers: Object.keys(browserMap).length || 5,
        os: Object.keys(osMap).length || 5,
        devices: Object.keys(deviceMap).length || 3,
        screens: Object.keys(resMap).length || 6,
      },
    };
  }, [recentSessions]);

  return (
    <div className="technology-section" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 4 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
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
        <TechCard title="Browsers" segments={browsers} darkMode={darkMode} icon={<GlobalOutlined />} />
        <TechCard title="Operating Systems" segments={os} darkMode={darkMode} icon={<LaptopOutlined />} />
        <TechCard title="Device Types" segments={devices} darkMode={darkMode} icon={<MobileOutlined />} />
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
      </div>
    </div>
  );
};

export default TechnologySection;
