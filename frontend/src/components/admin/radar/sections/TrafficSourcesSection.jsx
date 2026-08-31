import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  SearchOutlined,
  LinkOutlined,
  ShareAltOutlined,
  MailOutlined,
  DollarOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

// ── Simple Clean Solid SVG Donut Chart ──────────────────────────────────────
const DonutChart = ({ segments, total, size = 160, darkMode }) => {
  const cx = size / 2, cy = size / 2, r = size * 0.36, stroke = size * 0.18;
  const circumference = 2 * Math.PI * r;
  let cumulativeOffset = 0;

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={darkMode ? '#1E293B' : '#E2E8F0'}
        strokeWidth={stroke}
      />
      {segments.map((seg, i) => {
        const dashLen = ((seg.pct || 0) / 100) * circumference;
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${dashLen} ${circumference - dashLen}`}
            strokeDashoffset={-cumulativeOffset}
            strokeLinecap="butt"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: `${cx}px ${cy}px`,
              transition: 'stroke-dasharray 0.8s ease-out, stroke-dashoffset 0.8s ease-out',
            }}
          />
        );
        cumulativeOffset += dashLen;
        return el;
      })}
      {/* Center label */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fill={darkMode ? '#F8FAFC' : '#0F172A'}
        fontSize={size * 0.13}
        fontWeight="800"
        fontFamily="'Plus Jakarta Sans',sans-serif"
      >
        {total.toLocaleString()}
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fill={darkMode ? '#64748B' : '#94A3B8'}
        fontSize={size * 0.07}
        fontFamily="monospace"
        fontWeight="700"
      >
        SESSIONS
      </text>
    </svg>
  );
};

// ── Horizontal Bar (Solid Color) ───────────────────────────────────────────
const HBar = ({ label, value, pct, color, darkMode, icon }) => (
  <div className="h-bar-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <span style={{ fontSize: 14, color, width: 20, display: 'flex', alignItems: 'center' }}>
      {icon}
    </span>
    <span
      className="label"
      style={{
        width: 120,
        fontSize: 12,
        fontWeight: 600,
        color: darkMode ? '#CBD5E1' : '#334155',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {label}
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
          width: `${Math.min(100, Math.max(0, pct))}%`,
          borderRadius: 3,
          background: color,
          transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
    <span
      className="value"
      style={{
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 700,
        color,
        width: 50,
        textAlign: 'right',
      }}
    >
      {value > 0 ? value.toLocaleString() : '0'}
    </span>
    <span
      className="pct"
      style={{
        fontFamily: 'monospace',
        fontSize: 10,
        color: darkMode ? '#64748B' : '#94A3B8',
        width: 32,
        textAlign: 'right',
      }}
    >
      {pct > 0 ? `${pct}%` : '0%'}
    </span>
  </div>
);

const TrafficSourcesSection = ({ darkMode, totalSessions = 0, recentSessions = [], timeRange = '7d' }) => {
  const [activeSource, setActiveSource] = useState(null);
  const [filteredSessions, setFilteredSessions] = useState([]);

  // Fetch time-filtered session data
  useEffect(() => {
    let url = '/api/analytics/sessions';
    const params = new URLSearchParams();
    
    if (timeRange !== 'all') {
      const endDate = new Date();
      const startDate = new Date();
      if (timeRange === '7d') startDate.setDate(startDate.getDate() - 7);
      if (timeRange === '30d') startDate.setDate(startDate.getDate() - 30);
      if (timeRange === '90d') startDate.setDate(startDate.getDate() - 90);

      const s = startDate.toISOString().split('T')[0];
      const e = endDate.toISOString().split('T')[0];
      params.append('start_date', s);
      params.append('end_date', e);
    }
    
    params.append('limit', '1000');
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    axios.get(url)
      .then(res => {
        setFilteredSessions(res.data.recentSessions || []);
      })
      .catch(err => {
        console.error('Error fetching filtered sessions:', err);
        setFilteredSessions([]);
      });
  }, [timeRange]);

  // Use filtered sessions if available, otherwise use recentSessions prop
  const sessionsToUse = filteredSessions.length > 0 ? filteredSessions : recentSessions;

  // Compute live sources breakdown dynamically from real visitor sessions
  const computedSources = useMemo(() => {
    let organic = 0;
    let direct = 0;
    let referral = 0;
    let social = 0;
    let email = 0;
    let paid = 0;

    if (sessionsToUse && sessionsToUse.length > 0) {
      sessionsToUse.forEach(s => {
        const ref = String(s.referrer || '').toLowerCase();
        if (!ref || ref === 'null' || ref === 'direct' || ref.includes('localhost') || ref.includes('127.0.0.1')) {
          direct++;
        } else if (ref.includes('google') || ref.includes('bing') || ref.includes('duckduckgo') || ref.includes('yahoo') || ref.includes('search')) {
          organic++;
        } else if (ref.includes('facebook') || ref.includes('twitter') || ref.includes('x.com') || ref.includes('linkedin') || ref.includes('instagram') || ref.includes('reddit')) {
          social++;
        } else if (ref.includes('mail') || ref.includes('newsletter') || ref.includes('campaign')) {
          email++;
        } else if (ref.includes('ads') || ref.includes('cpc') || ref.includes('utm_source=cpc')) {
          paid++;
        } else {
          referral++;
        }
      });
    }

    const effectiveTotal = organic + direct + referral + social + email + paid;
    const sessionCount = Math.max(effectiveTotal, 1);

    // Calculate actual proportions from real data
    const orgPct = effectiveTotal > 0 ? Math.round((organic / sessionCount) * 100) : 0;
    const dirPct = effectiveTotal > 0 ? Math.round((direct / sessionCount) * 100) : 0;
    const refPct = effectiveTotal > 0 ? Math.round((referral / sessionCount) * 100) : 0;
    const socPct = effectiveTotal > 0 ? Math.round((social / sessionCount) * 100) : 0;
    const emlPct = effectiveTotal > 0 ? Math.round((email / sessionCount) * 100) : 0;
    const padPct = effectiveTotal > 0 ? Math.round((paid / sessionCount) * 100) : 0;

    return [
      { label: 'Organic Search', key: 'organic', pct: orgPct, value: organic, color: '#0AAEEF', icon: <SearchOutlined /> },
      { label: 'Direct Traffic', key: 'direct',  pct: dirPct, value: direct, color: '#10B981', icon: <LinkOutlined /> },
      { label: 'Referral',       key: 'referral',pct: refPct, value: referral, color: '#8B5CF6', icon: <GlobalOutlined /> },
      { label: 'Social Media',   key: 'social',  pct: socPct, value: social, color: '#F59E0B', icon: <ShareAltOutlined /> },
      { label: 'Email Campaign', key: 'email',   pct: emlPct, value: email, color: '#EF4444', icon: <MailOutlined /> },
      { label: 'Paid Search',    key: 'paid',    pct: padPct, value: paid, color: '#06B6D4', icon: <DollarOutlined /> },
    ];
  }, [sessionsToUse]);

  const donutSegments = computedSources.map(s => ({
    pct: s.pct,
    color: s.color,
    value: s.value,
  }));

  const calculatedTotalSessions = computedSources.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="traffic-sources-section" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @media (max-width: 1024px) {
          .traffic-sources-section {
            gap: 16px !important;
          }
        }
        @media (max-width: 768px) {
          .traffic-sources-section {
            gap: 14px !important;
          }
        }
        @media (max-width: 480px) {
          .traffic-sources-section {
            gap: 12px !important;
          }
        }
      `}</style>
      {/* Header stat cards */}
      <div className="traffic-sources-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <style>{`
          @media (max-width: 1024px) {
            .traffic-sources-stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 12px !important;
            }
          }
          @media (max-width: 768px) {
            .traffic-sources-stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 10px !important;
            }
          }
          @media (max-width: 480px) {
            .traffic-sources-stats-grid {
              grid-template-columns: 1fr !important;
              gap: 8px !important;
            }
          }
        `}</style>
        {computedSources.map((s) => (
          <div
            key={s.key}
            className="radar-glass-panel"
            onClick={() => setActiveSource(activeSource === s.key ? null : s.key)}
            style={{
              padding: '16px 18px',
              cursor: 'pointer',
              background: darkMode ? '#0F172A' : '#FFFFFF',
              borderColor: activeSource === s.key ? s.color : (darkMode ? '#334155' : '#E2E8F0'),
              borderRadius: 12,
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ fontSize: 18, color: s.color, marginBottom: 8 }}>{s.icon}</div>
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
              {s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>
              {s.pct > 0 ? `${s.pct}%` : '0%'}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: darkMode ? '#64748B' : '#94A3B8' }}>
              {s.value > 0 ? `${s.value.toLocaleString()} sessions` : '0 sessions'}
            </div>
          </div>
        ))}
      </div>

      {/* Main Breakdown Panel */}
      <div className="traffic-sources-breakdown-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        <style>{`
          @media (max-width: 1024px) {
            .traffic-sources-breakdown-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
        {/* Donut Chart */}
        <div
          className="radar-glass-panel"
          style={{
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            background: darkMode ? '#0F172A' : '#FFFFFF',
            borderColor: darkMode ? '#334155' : '#E2E8F0',
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: darkMode ? '#F8FAFC' : '#0F172A' }}>
            Sources Share
          </div>
          <DonutChart segments={donutSegments} total={calculatedTotalSessions} darkMode={darkMode} size={160} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            {computedSources.map(s => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: s.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: 600, color: darkMode ? '#94A3B8' : '#64748B', flex: 1 }}>
                  {s.label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>
                  {s.pct > 0 ? `${s.pct}%` : '0%'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Horizontal Bars */}
        <div
          className="radar-glass-panel"
          style={{
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: darkMode ? '#0F172A' : '#FFFFFF',
            borderColor: darkMode ? '#334155' : '#E2E8F0',
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: darkMode ? '#F8FAFC' : '#0F172A' }}>
            Session Volume by Traffic Source
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {computedSources.map(s => (
              <HBar
                key={s.key}
                label={s.label}
                value={s.value}
                pct={s.pct}
                color={s.color}
                icon={s.icon}
                darkMode={darkMode}
              />
            ))}
          </div>

          {/* Medium Summary */}
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: darkMode ? '#94A3B8' : '#64748B',
                marginBottom: 12,
              }}
            >
              Channel Overview
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Referral Domains', value: computedSources.find(s => s.key === 'referral')?.value || 0, unit: 'sessions', color: '#8B5CF6' },
                { label: 'Social Referrals', value: computedSources.find(s => s.key === 'social')?.value || 0, unit: 'sessions', color: '#F59E0B' },
                { label: 'Direct Entrances', value: computedSources.find(s => s.key === 'direct')?.value || 0, unit: 'sessions', color: '#10B981' },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: m.color, fontFamily: 'monospace' }}>
                    {m.value.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: darkMode ? '#94A3B8' : '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {m.unit}
                  </div>
                  <div style={{ fontSize: 11, color: darkMode ? '#64748B' : '#94A3B8', marginTop: 2 }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficSourcesSection;
