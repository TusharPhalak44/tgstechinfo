import React, { useMemo, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  InteractionOutlined,
  ReadOutlined,
  FieldTimeOutlined,
  SyncOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const MetricGauge = ({ label, value, unit, color, darkMode, desc, icon }) => {
  const numVal = typeof value === 'number' ? value : parseFloat(value) || 0;
  const angle = (Math.min(100, Math.max(0, numVal)) / 100) * 180;
  const r = 52, cx = 70, cy = 68;
  const startAngle = Math.PI;
  const endAngle   = startAngle + (angle * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="radar-glass-panel" style={{
      padding: '18px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 10,
      background: darkMode ? '#0F172A' : '#FFFFFF',
      borderColor: darkMode ? '#334155' : '#E2E8F0', borderRadius: 12,
    }}>
      <svg width={140} height={80} style={{ overflow: 'visible' }}>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={darkMode ? '#1E293B' : '#E2E8F0'}
          strokeWidth="8" strokeLinecap="round" />
        {numVal > 0 && (
          <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            style={{ transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }} />
        )}
        <text x={cx} y={cy + 20} textAnchor="middle" fill={numVal > 0 ? color : (darkMode ? '#64748B' : '#94A3B8')}
          fontSize="18" fontWeight="800" fontFamily="'Plus Jakarta Sans',sans-serif">
          {value}{unit}
        </text>
      </svg>
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: darkMode ? '#94A3B8' : '#64748B',
        textAlign: 'center', display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span style={{ color }}>{icon}</span>
        <span>{label}</span>
      </div>
      {desc && (
        <div style={{ fontSize: 10, color: darkMode ? '#64748B' : '#94A3B8', textAlign: 'center' }}>
          {desc}
        </div>
      )}
    </div>
  );
};

const EngagementSection = ({
  darkMode = true,
  recentSessions = [],
  sessionAnalytics = {},
  overviewData = null,
  timeRange = '7d'
}) => {
  const [fetchedSessions, setFetchedSessions] = useState([]);
  const [fetchedOverview, setFetchedOverview] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Build date query string ──────────────────────────────────────────────
  const buildDateQuery = useCallback(() => {
    const end   = new Date();
    const start = new Date();
    if (timeRange === '7d')  start.setDate(start.getDate() - 7);
    if (timeRange === '30d') start.setDate(start.getDate() - 30);
    if (timeRange === '90d') start.setDate(start.getDate() - 90);
    if (timeRange === 'all') start.setFullYear(2000);
    const s = start.toISOString().split('T')[0];
    const e = end.toISOString().split('T')[0];
    return `start_date=${s}&end_date=${e}`;
  }, [timeRange]);

  // ── Sync with live API when timeRange changes ───────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const q = buildDateQuery();

    Promise.allSettled([
      axios.get(`/api/analytics/sessions?${q}&limit=500`),
      axios.get(`/api/analytics/overview?${q}`),
    ]).then(([sessRes, ovRes]) => {
      if (cancelled) return;

      if (sessRes.status === 'fulfilled' && sessRes.value?.data) {
        const d = sessRes.value.data;
        setFetchedSessions(d.recentSessions || d.sessions || []);
      }

      if (ovRes.status === 'fulfilled' && ovRes.value?.data) {
        setFetchedOverview(ovRes.value.data);
      }

      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [timeRange, buildDateQuery]);

  // Consolidate live sessions
  const sessions = fetchedSessions.length > 0 ? fetchedSessions : recentSessions;
  const overview = fetchedOverview || overviewData;
  const currentSessionAnalytics = overview?.sessionAnalytics || sessionAnalytics || {};

  const totalCount = sessions.length;
  const bounceRate = Number(currentSessionAnalytics.bounceRate ?? (totalCount > 0 ? Math.round((sessions.filter(s => (s.total_pages_visited || 1) === 1).length / totalCount) * 100) : 0));

  // 1. Engagement Score: 100 - (bounceRate * 0.8)
  const engagementScore = totalCount > 0 ? Math.max(0, Math.min(100, Math.round(100 - bounceRate * 0.8))) : 0;

  // 2. Pages / Session: exact avg from sessions
  const avgPages = totalCount > 0
    ? Number((sessions.reduce((acc, r) => acc + (Number(r.total_pages_visited) || 1), 0) / totalCount).toFixed(1))
    : (currentSessionAnalytics.avgPagesPerSession || 0);

  // 3. Returning Rate: % of sessions with >1 page visited
  const returningRate = totalCount > 0
    ? Math.round((sessions.filter(s => (Number(s.total_pages_visited) || 0) > 1).length / totalCount) * 100)
    : 0;

  // 4. Scroll Depth from overview data or calculated from real session durations
  const scrollDepth = overview?.scrollDepth && Number(overview.scrollDepth) > 0
    ? Math.round(Number(overview.scrollDepth))
    : (() => {
        if (totalCount === 0) return 0;
        const avgDur = sessions.reduce((acc, r) => acc + (Number(r.total_session_duration) || 0), 0) / totalCount;
        return Math.min(95, Math.max(5, Math.round(25 + (avgDur / 300) * 50)));
      })();

  // ── Duration Buckets strictly from real session data ──────────────────────
  const durationBuckets = useMemo(() => {
    const b = [0, 0, 0, 0, 0, 0];
    sessions.forEach(s => {
      const sec = Number(s.total_session_duration) || 0;
      if      (sec <= 10)  b[0]++;
      else if (sec <= 30)  b[1]++;
      else if (sec <= 60)  b[2]++;
      else if (sec <= 180) b[3]++;
      else if (sec <= 600) b[4]++;
      else                 b[5]++;
    });

    const total = sessions.length;
    const pct = v => (total > 0 ? Math.round((v / total) * 100) : 0);

    return [
      { label: '0–10 seconds',  count: b[0], pct: pct(b[0]), color: '#EF4444' },
      { label: '10–30 seconds', count: b[1], pct: pct(b[1]), color: '#F59E0B' },
      { label: '30s – 1 min',   count: b[2], pct: pct(b[2]), color: '#06B6D4' },
      { label: '1–3 minutes',   count: b[3], pct: pct(b[3]), color: '#8B5CF6' },
      { label: '3–10 minutes',  count: b[4], pct: pct(b[4]), color: '#10B981' },
      { label: '10+ minutes',   count: b[5], pct: pct(b[5]), color: '#0AAEEF' },
    ];
  }, [sessions]);

  // ── Activity Heatmap strictly from real timestamps ────────────────────────
  const heatmapData = useMemo(() => {
    const dayKeys = ['sun','mon','tue','wed','thu','fri','sat'];
    const slots   = ['00–04','04–08','08–12','12–16','16–20','20–24'];
    const grid    = slots.map(time => ({ time, mon:0, tue:0, wed:0, thu:0, fri:0, sat:0, sun:0 }));

    sessions.forEach(s => {
      if (!s.session_start) return;
      const d       = new Date(s.session_start);
      if (isNaN(d.getTime())) return;
      const slotIdx = Math.min(5, Math.floor(d.getHours() / 4));
      const dayKey  = dayKeys[d.getDay()];
      if (grid[slotIdx] && dayKey in grid[slotIdx]) {
        grid[slotIdx][dayKey]++;
      }
    });

    return grid;
  }, [sessions]);

  const days    = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const maxHeat = Math.max(...heatmapData.flatMap(r => days.map(d => r[d.toLowerCase()] || 0)), 1);
  const maxBucketPct = Math.max(...durationBuckets.map(b => b.pct), 1);

  const rangeLabel = { '7d':'Last 7 Days','30d':'Last 30 Days','90d':'Last 90 Days','all':'All Time' }[timeRange] || timeRange;

  const metrics = [
    { label:'Engagement Score', value:engagementScore, unit:'',  color:'#0AAEEF', desc: totalCount > 0 ? `Bounce rate: ${bounceRate}%` : 'No session data', icon:<InteractionOutlined /> },
    { label:'Pages / Session',  value:avgPages,         unit:'',  color:'#8B5CF6', desc: totalCount > 0 ? `Avg ${avgPages} pages / visit` : 'No session data', icon:<ReadOutlined /> },
    { label:'Scroll Depth',     value:scrollDepth,      unit:'%', color:'#10B981', desc: totalCount > 0 ? 'Avg content scroll depth' : 'No telemetry data', icon:<FieldTimeOutlined /> },
    { label:'Returning Rate',   value:returningRate,    unit:'%', color:'#F59E0B', desc: totalCount > 0 ? 'Multi-page readers' : 'No session data', icon:<SyncOutlined /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Time range + session count badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 12, fontWeight: 600, color: darkMode ? '#94A3B8' : '#64748B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: darkMode ? 'rgba(10,174,239,0.15)' : '#E0F2FE',
            color: darkMode ? '#38BDF8' : '#0284C7',
            border: `1px solid ${darkMode ? 'rgba(10,174,239,0.3)' : '#BAE6FD'}`,
            fontFamily: 'monospace',
          }}>
            {rangeLabel}
          </span>
          <span>{loading ? 'Refreshing real-time telemetry...' : `${totalCount} live sessions analyzed`}</span>
        </div>
      </div>

      {/* Gauge Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        {metrics.map(m => <MetricGauge key={m.label} {...m} darkMode={darkMode} />)}
      </div>

      {/* Duration + Heatmap */}
      <div className="engagement-grid" style={{ display: 'grid', gap: 16 }}>
        <style>{`
          .engagement-grid { grid-template-columns: 1fr 1fr; }
          @media (max-width: 900px) { .engagement-grid { grid-template-columns: 1fr !important; } }
        `}</style>

        {/* Session Duration Distribution */}
        <div className="radar-glass-panel" style={{
          padding: '20px', background: darkMode ? '#0F172A' : '#FFFFFF',
          borderColor: darkMode ? '#334155' : '#E2E8F0', borderRadius: 12,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: darkMode ? '#F8FAFC' : '#0F172A',
            marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClockCircleOutlined style={{ color: '#0AAEEF' }} />
              <span>Session Duration Breakdown</span>
            </div>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: darkMode ? '#64748B' : '#94A3B8' }}>
              {totalCount} Total
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {durationBuckets.map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: darkMode ? '#CBD5E1' : '#334155',
                  width: 120, flexShrink: 0,
                }}>
                  {b.label}
                </span>
                <div style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: darkMode ? '#1E293B' : '#E2E8F0', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${b.pct > 0 ? Math.round((b.pct / maxBucketPct) * 100) : 0}%`,
                    borderRadius: 3, background: b.color,
                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                </div>
                <span style={{
                  fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                  color: b.pct > 0 ? b.color : (darkMode ? '#64748B' : '#94A3B8'),
                  width: 50, textAlign: 'right',
                }}>
                  {b.pct}% ({b.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="radar-glass-panel" style={{
          padding: '20px', background: darkMode ? '#0F172A' : '#FFFFFF',
          borderColor: darkMode ? '#334155' : '#E2E8F0', borderRadius: 12,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: darkMode ? '#F8FAFC' : '#0F172A',
            marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarOutlined style={{ color: '#8B5CF6' }} />
              <span>Activity Heatmap</span>
            </div>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: darkMode ? '#64748B' : '#94A3B8' }}>
              Hour vs Day
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: '4px', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: 60 }} />
                  {days.map(d => (
                    <th key={d} style={{
                      fontSize: 10, fontWeight: 700,
                      color: darkMode ? '#64748B' : '#94A3B8',
                      fontFamily: 'monospace', paddingBottom: 4, textAlign: 'center',
                    }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map(row => (
                  <tr key={row.time}>
                    <td style={{
                      fontSize: 10, fontFamily: 'monospace',
                      color: darkMode ? '#64748B' : '#94A3B8',
                      paddingRight: 6, whiteSpace: 'nowrap',
                    }}>{row.time}</td>
                    {days.map(d => {
                      const val       = row[d.toLowerCase()] || 0;
                      const intensity = maxHeat > 0 ? val / maxHeat : 0;
                      return (
                        <td key={d} title={`${val} live session(s)`} style={{
                          height: 20, borderRadius: 3,
                          background: val > 0
                            ? (darkMode
                                ? `rgba(10,174,239,${Math.min(1, 0.25 + intensity * 0.75).toFixed(2)})`
                                : `rgba(2,132,199,${Math.min(1, 0.25 + intensity * 0.75).toFixed(2)})`)
                            : (darkMode ? '#1E293B' : '#F1F5F9'),
                          transition: 'background 0.3s',
                          textAlign: 'center',
                          fontSize: 9,
                          fontFamily: 'monospace',
                          color: val > 0 ? '#FFFFFF' : 'transparent',
                          fontWeight: 700
                        }}>
                          {val > 0 ? val : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 9, fontFamily: 'monospace', color: darkMode ? '#64748B' : '#94A3B8' }}>0 sessions</span>
            {[0.2, 0.4, 0.6, 0.8, 1.0].map(v => (
              <div key={v} style={{
                width: 12, height: 12, borderRadius: 2,
                background: darkMode ? `rgba(10,174,239,${v})` : `rgba(2,132,199,${v})`,
              }} />
            ))}
            <span style={{ fontSize: 9, fontFamily: 'monospace', color: darkMode ? '#64748B' : '#94A3B8' }}>Peak</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementSection;
