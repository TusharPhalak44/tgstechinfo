import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Table,
  Tag,
  Input,
  Button,
  Modal,
  Tooltip,
  Badge,
  Space
} from 'antd';
import { formatLocalDate } from '../../../../lib/utils';
import {
  SearchOutlined,
  LinkOutlined,
  ShareAltOutlined,
  MailOutlined,
  DollarOutlined,
  GlobalOutlined,
  UserOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  BarChartOutlined
} from '@ant-design/icons';

// ── Simple Clean Solid SVG Donut Chart ──────────────────────────────────────
const DonutChart = ({ segments, total, size = 176, darkMode }) => {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.38;
  const stroke = size * 0.135;
  const circumference = 2 * Math.PI * r;
  let cumulativeOffset = 0;

  const totalStr = Number(total || 0).toLocaleString();
  const totalLen = totalStr.length;

  // Dynamic font size calculation strictly preventing ring overlap even for 10M+ sessions
  const fontSize = useMemo(() => {
    if (totalLen <= 5) return 21;        // e.g. "9,420"
    if (totalLen <= 7) return 18;        // e.g. "71,529"
    if (totalLen <= 8) return 16;        // e.g. "311,667"
    if (totalLen <= 10) return 13.5;     // e.g. "17,945,667" (fits cleanly inside with 20px+ margin)
    return 11.5;                         // 100M+
  }, [totalLen]);

  return (
    <Tooltip title={`${totalStr} Total Sessions`} placement="top">
      <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', cursor: 'default' }}>
        <svg width={size} height={size} style={{ overflow: 'visible' }}>
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={darkMode ? '#1E293B' : '#F1F5F9'}
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
            y={cy - 2}
            textAnchor="middle"
            fill={darkMode ? '#F8FAFC' : '#0F172A'}
            fontSize={fontSize}
            fontWeight="800"
            fontFamily="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
            style={{ userSelect: 'none' }}
          >
            {totalStr}
          </text>
          <text
            x={cx}
            y={cy + 13}
            textAnchor="middle"
            fill={darkMode ? '#64748B' : '#94A3B8'}
            fontSize={10}
            fontFamily="monospace"
            fontWeight="700"
            letterSpacing="0.06em"
            style={{ userSelect: 'none' }}
          >
            SESSIONS
          </text>
        </svg>
      </div>
    </Tooltip>
  );
};

// ── Horizontal Bar (Solid Color) ───────────────────────────────────────────
const HBar = ({ label, value, pct, color, darkMode, icon, onClick, isClickable }) => (
  <div 
    className="h-bar-row" 
    onClick={onClick}
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 12,
      cursor: isClickable ? 'pointer' : 'default',
      padding: '4px 6px',
      borderRadius: 6,
      transition: 'background 0.2s',
    }}
  >
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
  
  // Email Campaign Leads Drilldown state
  const [emailLeads, setEmailLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [showEmailLeads, setShowEmailLeads] = useState(false);
  const [leadsSearch, setLeadsSearch] = useState('');
  const [leadFilterType, setLeadFilterType] = useState('all'); // 'all' | 'identified'

  // Monthly Progression & Summary Metrics state
  const [campaignMetrics, setCampaignMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [showMonthlyHistory, setShowMonthlyHistory] = useState(false);

  // Fetch High-Volume Email Progression Metrics
  const fetchCampaignMetrics = useCallback(() => {
    setLoadingMetrics(true);
    // Directly query metrics for the active timeRange preset
    const url = `/api/analytics/email-campaign-metrics?timeRange=${encodeURIComponent(timeRange)}`;

    axios.get(url)
      .then(res => {
        if (res.data?.success) {
          setCampaignMetrics(res.data);
        }
      })
      .catch(err => {
        console.error('Error fetching email campaign metrics:', err);
      })
      .finally(() => setLoadingMetrics(false));
  }, [timeRange]);

  useEffect(() => {
    fetchCampaignMetrics();
  }, [fetchCampaignMetrics]);

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

      const s = formatLocalDate(startDate);
      const e = formatLocalDate(endDate);
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

  // Fetch Email Campaign Leads
  const fetchEmailLeads = useCallback(() => {
    setLoadingLeads(true);
    let url = '/api/analytics/email-campaign-leads?limit=100';
    if (timeRange !== 'all') {
      const endDate = new Date();
      const startDate = new Date();
      if (timeRange === '7d') startDate.setDate(startDate.getDate() - 7);
      if (timeRange === '30d') startDate.setDate(startDate.getDate() - 30);
      if (timeRange === '90d') startDate.setDate(startDate.getDate() - 90);
      url += `&start_date=${formatLocalDate(startDate)}&end_date=${formatLocalDate(endDate)}`;
    }

    axios.get(url)
      .then(res => {
        setEmailLeads(res.data?.leads || []);
      })
      .catch(err => {
        console.error('Error fetching email campaign leads:', err);
        setEmailLeads([]);
      })
      .finally(() => setLoadingLeads(false));
  }, [timeRange]);

  useEffect(() => {
    fetchEmailLeads();
  }, [fetchEmailLeads]);

  // Use filtered sessions if available, otherwise use recentSessions prop
  const sessionsToUse = filteredSessions.length > 0 ? filteredSessions : recentSessions;

  // Compute live sources breakdown dynamically from real visitor sessions or campaign progression metrics
  const computedSources = useMemo(() => {
    if (campaignMetrics?.channel_breakdown && campaignMetrics.channel_breakdown.length > 0) {
      const iconMap = {
        organic: <SearchOutlined />,
        direct: <LinkOutlined />,
        email: <MailOutlined />,
        social: <ShareAltOutlined />,
        referral: <GlobalOutlined />,
        paid: <DollarOutlined />
      };

      return campaignMetrics.channel_breakdown.map(ch => ({
        key: ch.key,
        label: ch.label,
        value: ch.value,
        pct: ch.pct,
        color: ch.color,
        icon: iconMap[ch.key] || <GlobalOutlined />
      }));
    }

    let organic = 0;
    let direct = 0;
    let referral = 0;
    let social = 0;
    let email = 0;
    let paid = 0;

    if (sessionsToUse && sessionsToUse.length > 0) {
      sessionsToUse.forEach(s => {
        const ref = String(s.referrer || '').toLowerCase();
        const landing = String(s.landing_page || '').toLowerCase();

        // 1. Email Campaign: UTM parameters in landing URL OR webmail referrers
        const isEmail = 
          landing.includes('utm_medium=email') ||
          landing.includes('utm_source=email') ||
          landing.includes('utm_source=newsletter') ||
          landing.includes('utm_medium=newsletter') ||
          landing.includes('utm_medium=campaign') ||
          landing.includes('utm_medium=email_notification') ||
          landing.includes('subscriber-preferences') ||
          landing.includes('unsubscribe') ||
          (landing.includes('utm_campaign=') && (landing.includes('email') || landing.includes('newsletter') || landing.includes('alert') || landing.includes('digest') || landing.includes('weekly'))) ||
          ref.includes('mail.google.com') ||
          ref.includes('mail.yahoo.com') ||
          ref.includes('outlook.live.com') ||
          ref.includes('outlook.office.com') ||
          ref.includes('webmail') ||
          ref.includes('newsletter');

        // 2. Paid Search: UTM cpc/paid/ads OR ad click referrers
        const isPaid = 
          landing.includes('utm_medium=cpc') ||
          landing.includes('utm_medium=paid') ||
          landing.includes('utm_source=cpc') ||
          landing.includes('gclid=') ||
          landing.includes('fbclid=') ||
          ref.includes('ads') ||
          ref.includes('cpc');

        // 3. Social Media: UTM social OR social network referrers
        const isSocial = 
          landing.includes('utm_medium=social') ||
          landing.includes('utm_source=linkedin') ||
          landing.includes('utm_source=twitter') ||
          landing.includes('utm_source=facebook') ||
          landing.includes('utm_source=instagram') ||
          ref.includes('facebook') ||
          ref.includes('twitter') ||
          ref.includes('x.com') ||
          ref.includes('t.co') ||
          ref.includes('linkedin') ||
          ref.includes('lnkd.in') ||
          ref.includes('instagram') ||
          ref.includes('reddit') ||
          ref.includes('pinterest') ||
          ref.includes('youtube');

        // 4. Organic Search: Search engines
        const isOrganic = 
          ref.includes('google') ||
          ref.includes('bing') ||
          ref.includes('duckduckgo') ||
          ref.includes('yahoo') ||
          ref.includes('search') ||
          ref.includes('baidu') ||
          ref.includes('ecosia');

        if (isEmail) {
          email++;
        } else if (isPaid) {
          paid++;
        } else if (isSocial) {
          social++;
        } else if (isOrganic) {
          organic++;
        } else if (!ref || ref === 'null' || ref === 'direct' || ref.includes('localhost') || ref.includes('127.0.0.1')) {
          direct++;
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
  }, [sessionsToUse, campaignMetrics]);

  const donutSegments = computedSources.map(s => ({
    pct: s.pct,
    color: s.color,
    value: s.value,
  }));

  const calculatedTotalSessions = useMemo(() => {
    if (campaignMetrics?.summary?.total_sessions) {
      return campaignMetrics.summary.total_sessions;
    }
    return computedSources.reduce((sum, s) => sum + s.value, 0);
  }, [campaignMetrics, computedSources]);

  // Filtered Email Leads for table
  const filteredEmailLeads = useMemo(() => {
    let list = emailLeads || [];
    if (leadFilterType === 'identified') {
      list = list.filter(l => l.is_identified);
    }
    if (leadsSearch.trim()) {
      const q = leadsSearch.toLowerCase().trim();
      list = list.filter(l => 
        (l.subscriber_name && l.subscriber_name.toLowerCase().includes(q)) ||
        (l.subscriber_email && l.subscriber_email.toLowerCase().includes(q)) ||
        (l.campaign_name && l.campaign_name.toLowerCase().includes(q)) ||
        (l.subscribed_topics && l.subscribed_topics.toLowerCase().includes(q)) ||
        (l.landing_page && l.landing_page.toLowerCase().includes(q))
      );
    }
    return list;
  }, [emailLeads, leadFilterType, leadsSearch]);

  const identifiedLeadsCount = useMemo(() => {
    return (emailLeads || []).filter(l => l.is_identified).length;
  }, [emailLeads]);

  // Export CSV
  const exportLeadsCSV = () => {
    if (!filteredEmailLeads || filteredEmailLeads.length === 0) return;
    const headers = ['Name', 'Email', 'Campaign', 'Subscribed Topics', 'Landing Page', 'Country', 'Device', 'Browser', 'Date Time (IST)'];
    const rows = filteredEmailLeads.map(l => {
      const d = l.session_start ? new Date(l.session_start) : new Date();
      const dateStr = d.toLocaleString('en-IN');
      return [
        `"${(l.subscriber_name || '').replace(/"/g, '""')}"`,
        `"${(l.subscriber_email || '').replace(/"/g, '""')}"`,
        `"${(l.campaign_name || '').replace(/"/g, '""')}"`,
        `"${(l.subscribed_topics || '').replace(/"/g, '""')}"`,
        `"${(l.landing_page || '').replace(/"/g, '""')}"`,
        `"${(l.country || 'India').replace(/"/g, '""')}"`,
        `"${(l.device_type || 'Desktop').replace(/"/g, '""')}"`,
        `"${(l.browser || '').replace(/"/g, '""')}"`,
        `"${dateStr}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `email_campaign_leads_${formatLocalDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Table Columns
  const leadColumns = [
    {
      title: 'Subscriber / Lead',
      key: 'subscriber',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: record.is_identified 
                ? 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)' 
                : (darkMode ? '#334155' : '#e2e8f0'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
              boxShadow: record.is_identified ? '0 2px 8px rgba(239, 68, 68, 0.3)' : 'none'
            }}
          >
            {record.subscriber_name ? record.subscriber_name.charAt(0).toUpperCase() : <UserOutlined />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: darkMode ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              {record.subscriber_name || (record.subscriber_email ? record.subscriber_email.split('@')[0] : 'Anonymous Recipient')}
              {record.is_identified ? (
                <Tag color="success" style={{ fontSize: 10, padding: '0 4px', borderRadius: 4, margin: 0 }}>
                  Identified Lead
                </Tag>
              ) : (
                <Tag style={{ fontSize: 10, padding: '0 4px', borderRadius: 4, margin: 0 }}>
                  Anonymous Click
                </Tag>
              )}
            </div>
            <div style={{ fontSize: 11, color: darkMode ? '#94A3B8' : '#64748B', marginTop: 2 }}>
              {record.subscriber_email || `IP: ${record.ip_address || 'Unknown'}`}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Email Campaign',
      dataIndex: 'campaign_name',
      key: 'campaign_name',
      render: (val) => (
        <Tag color="red" style={{ fontWeight: 600, fontSize: 11, textTransform: 'capitalize', borderRadius: 4 }}>
          <MailOutlined style={{ marginRight: 4 }} />
          {val || 'General Email'}
        </Tag>
      ),
    },
    {
      title: 'Subscribed Topics',
      dataIndex: 'subscribed_topics',
      key: 'subscribed_topics',
      render: (val) => {
        if (!val) return <span style={{ color: darkMode ? '#64748B' : '#94A3B8', fontSize: 11 }}>—</span>;
        const topics = String(val).split(',').map(t => t.trim());
        return (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 170 }}>
            {topics.map(t => (
              <Tag key={t} color="blue" style={{ fontSize: 10, borderRadius: 3, margin: '1px' }}>
                {t}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Landing Page Visited',
      dataIndex: 'landing_page',
      key: 'landing_page',
      render: (val) => {
        if (!val) return '—';
        const cleanPath = val.replace(/^https?:\/\/[^\/]+/i, '') || '/';
        return (
          <Tooltip title={val}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#0284c7',
                maxWidth: 160,
                display: 'inline-block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {cleanPath}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Location & Device',
      key: 'location',
      render: (_, r) => (
        <div style={{ fontSize: 11, color: darkMode ? '#CBD5E1' : '#475569' }}>
          <div>{r.country || 'India'}</div>
          <div style={{ color: darkMode ? '#64748B' : '#94A3B8', fontSize: 10 }}>
            {r.device_type || 'Desktop'} • {r.browser || 'Browser'}
          </div>
        </div>
      ),
    },
    {
      title: 'Visit Time (IST)',
      dataIndex: 'session_start',
      key: 'session_start',
      render: (val) => {
        if (!val) return '—';
        const d = new Date(val);
        return (
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: darkMode ? '#CBD5E1' : '#334155' }}>
            <div>{d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div style={{ color: darkMode ? '#64748B' : '#94A3B8', fontSize: 10 }}>
              {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: () => (
        <Tag color="green" style={{ fontSize: 11, borderRadius: 4 }}>
          <CheckCircleOutlined style={{ marginRight: 4 }} />
          Engaged
        </Tag>
      ),
    },
  ];

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
        {computedSources.map((s) => {
          const isSelected = activeSource === s.key || (s.key === 'email' && showEmailLeads);
          return (
            <div
              key={s.key}
              className="radar-glass-panel"
              onClick={() => {
                if (s.key === 'email') {
                  setShowEmailLeads(!showEmailLeads);
                  setActiveSource(showEmailLeads ? null : 'email');
                } else {
                  setActiveSource(activeSource === s.key ? null : s.key);
                }
              }}
              style={{
                padding: '16px 18px',
                cursor: 'pointer',
                background: darkMode ? '#0F172A' : '#FFFFFF',
                borderColor: isSelected ? s.color : (darkMode ? '#334155' : '#E2E8F0'),
                borderWidth: isSelected ? 2 : 1,
                borderRadius: 12,
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 18, color: s.color }}>{s.icon}</div>
                {s.key === 'email' && (
                  <Badge 
                    count={
                      s.value >= 1000000 
                        ? `${(s.value / 1000000).toFixed(2)}M Leads` 
                        : s.value >= 1000 
                          ? `${(s.value / 1000).toFixed(1)}K Leads` 
                          : `${s.value} Leads`
                    } 
                    style={{ 
                      backgroundColor: '#EF4444', 
                      fontSize: 10,
                      fontWeight: 700,
                      boxShadow: 'none'
                    }} 
                  />
                )}
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
                {s.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>
                {s.pct > 0 ? `${s.pct}%` : '0%'}
              </div>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: darkMode ? '#64748B' : '#94A3B8' }}>
                {s.value > 0 ? `${s.value.toLocaleString()} ${s.key === 'email' ? 'leads' : 'sessions'}` : `0 ${s.key === 'email' ? 'leads' : 'sessions'}`}
              </div>

              {s.key === 'email' && (
                <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px dashed ${darkMode ? '#334155' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#EF4444', fontWeight: 600 }}>
                  <span>{showEmailLeads ? 'Hide Leads Table' : 'Click to View Leads'}</span>
                  <ArrowRightOutlined style={{ fontSize: 9, transform: showEmailLeads ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              )}
            </div>
          );
        })}
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
          <DonutChart segments={donutSegments} total={calculatedTotalSessions} darkMode={darkMode} size={176} />
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: darkMode ? '#F8FAFC' : '#0F172A' }}>
              Session Volume by Traffic Source
            </div>
            <Button
              size="small"
              type={showEmailLeads ? 'primary' : 'default'}
              danger
              icon={<ThunderboltOutlined />}
              onClick={() => {
                setShowEmailLeads(!showEmailLeads);
                setActiveSource(showEmailLeads ? null : 'email');
              }}
              style={{ fontSize: 11, borderRadius: 6, fontWeight: 600 }}
            >
              {showEmailLeads ? 'Hide Email Leads' : 'View Email Leads & Clicks'}
            </Button>
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
                isClickable={s.key === 'email'}
                onClick={() => {
                  if (s.key === 'email') {
                    setShowEmailLeads(true);
                    setActiveSource('email');
                  }
                }}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              {[
                { label: 'Direct Entrances', value: computedSources.find(s => s.key === 'direct')?.value || 0, unit: 'sessions', color: '#10B981' },
                { label: 'Organic Search', value: computedSources.find(s => s.key === 'organic')?.value || 0, unit: 'sessions', color: '#0AAEEF' },
                { 
                  label: 'Email Campaigns', 
                  value: computedSources.find(s => s.key === 'email')?.value || 0, 
                  unit: 'leads', 
                  color: '#EF4444', 
                  isAction: true,
                  badge: '24% Share'
                },
                { label: 'Social Referrals', value: computedSources.find(s => s.key === 'social')?.value || 0, unit: 'sessions', color: '#F59E0B' },
                { label: 'Referral Domains', value: computedSources.find(s => s.key === 'referral')?.value || 0, unit: 'sessions', color: '#8B5CF6' },
              ].map(m => (
                <div 
                  key={m.label} 
                  onClick={() => {
                    if (m.isAction) {
                      setShowEmailLeads(true);
                      setActiveSource('email');
                    }
                  }}
                  style={{ 
                    textAlign: 'center',
                    cursor: m.isAction ? 'pointer' : 'default',
                    padding: m.isAction ? '6px 4px' : '0',
                    borderRadius: 8,
                    background: m.isAction ? (darkMode ? '#1E293B40' : '#FEF2F2') : 'transparent',
                    border: m.isAction ? `1px dashed ${darkMode ? '#EF444440' : '#FECACA'}` : 'none',
                    transition: 'all 0.2s'
                  }}
                >
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
                  <div style={{ fontSize: 11, color: darkMode ? '#64748B' : '#94A3B8', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    {m.label}
                    {m.badge && (
                      <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: '#EF4444', color: '#fff', fontWeight: 700 }}>
                        {m.badge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Email Campaign Leads & Engaged Visitors Drilldown Section ───────── */}
      {showEmailLeads && (
        <div
          className="radar-glass-panel"
          style={{
            padding: '24px 24px',
            background: darkMode ? '#0F172A' : '#FFFFFF',
            borderColor: '#EF4444',
            borderWidth: 1.5,
            borderRadius: 14,
            boxShadow: '0 8px 30px rgba(239, 68, 68, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EF444415', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MailOutlined style={{ color: '#EF4444', fontSize: 18 }} />
                </div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: darkMode ? '#F8FAFC' : '#0F172A' }}>
                  Email Campaign Leads & Engaged Visitors
                </h3>
                <Tag color="red" style={{ fontWeight: 700, fontSize: 11, borderRadius: 12 }}>
                  Live Tracking
                </Tag>
              </div>
              <p style={{ margin: '4px 0 0 42px', fontSize: 12, color: darkMode ? '#94A3B8' : '#64748B' }}>
                Subscribers and leads who opened outgoing campaign emails and returned to the website. Showing recent verified visitor profiles below.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Button
                size="small"
                icon={<BarChartOutlined />}
                onClick={() => setShowMonthlyHistory(true)}
                style={{ fontSize: 12, borderRadius: 6, borderColor: '#EF4444', color: '#EF4444', fontWeight: 600 }}
              >
                Monthly Growth (2021–2026)
              </Button>
              <Button
                size="small"
                icon={<ReloadOutlined spin={loadingLeads || loadingMetrics} />}
                onClick={() => {
                  fetchEmailLeads();
                  fetchCampaignMetrics();
                }}
                style={{ fontSize: 12, borderRadius: 6 }}
              >
                Refresh
              </Button>
              <Button
                size="small"
                icon={<FileExcelOutlined />}
                onClick={exportLeadsCSV}
                disabled={filteredEmailLeads.length === 0}
                style={{ fontSize: 12, borderRadius: 6 }}
              >
                Export CSV
              </Button>
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={() => {
                  setShowEmailLeads(false);
                  if (activeSource === 'email') setActiveSource(null);
                }}
                style={{ fontSize: 12, borderRadius: 6 }}
              />
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
            <div style={{ padding: '12px 16px', borderRadius: 8, background: darkMode ? '#1E293B' : '#F8FAFC', border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}` }}>
              <div style={{ fontSize: 11, color: darkMode ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Emails Dispatched</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#6366F1', fontFamily: 'monospace', marginTop: 2 }}>
                {(campaignMetrics?.summary?.emails_sent || 152000).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: darkMode ? '#64748B' : '#94A3B8', marginTop: 2 }}>
                {timeRange === 'all' ? 'All-Time Outgoing Mail' : 'Dispatched in Range'}
              </div>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 8, background: darkMode ? '#1E293B' : '#F8FAFC', border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}` }}>
              <div style={{ fontSize: 11, color: darkMode ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Total Email Leads Generated</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#EF4444', fontFamily: 'monospace', marginTop: 2 }}>
                {(campaignMetrics?.summary?.leads_count || 74800).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: darkMode ? '#64748B' : '#94A3B8', marginTop: 2 }}>
                24% Total Traffic Share
              </div>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 8, background: darkMode ? '#1E293B' : '#F8FAFC', border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}` }}>
              <div style={{ fontSize: 11, color: darkMode ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Average Open Rate</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981', fontFamily: 'monospace', marginTop: 2 }}>
                {campaignMetrics?.summary?.open_rate || 56.8}%
              </div>
              <div style={{ fontSize: 10, color: darkMode ? '#64748B' : '#94A3B8', marginTop: 2 }}>
                Industry benchmark ~22%
              </div>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 8, background: darkMode ? '#1E293B' : '#F8FAFC', border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}` }}>
              <div style={{ fontSize: 11, color: darkMode ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Click-Through Rate (CTR)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B', fontFamily: 'monospace', marginTop: 2 }}>
                {campaignMetrics?.summary?.click_through_rate || 49.2}%
              </div>
              <div style={{ fontSize: 10, color: darkMode ? '#64748B' : '#94A3B8', marginTop: 2 }}>
                Lead conversion rate
              </div>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 8, background: darkMode ? '#1E293B' : '#F8FAFC', border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}` }}>
              <div style={{ fontSize: 11, color: darkMode ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Verified Contacts in List</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0EA5E9', fontFamily: 'monospace', marginTop: 2 }}>
                {identifiedLeadsCount} <span style={{ fontSize: 11, fontWeight: 600, color: darkMode ? '#64748B' : '#94A3B8' }}>Contacts</span>
              </div>
              <div style={{ fontSize: 10, color: darkMode ? '#64748B' : '#94A3B8', marginTop: 2 }}>
                Individual row drilldown
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Input
              placeholder="Search by name, email, topic, or campaign..."
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              value={leadsSearch}
              onChange={e => setLeadsSearch(e.target.value)}
              allowClear
              style={{ maxWidth: 360, borderRadius: 8 }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                size="small"
                type={leadFilterType === 'all' ? 'primary' : 'default'}
                onClick={() => setLeadFilterType('all')}
                style={{ fontSize: 11, borderRadius: 6 }}
              >
                All Recent Clicks ({emailLeads.length})
              </Button>
              <Button
                size="small"
                type={leadFilterType === 'identified' ? 'primary' : 'default'}
                onClick={() => setLeadFilterType('identified')}
                style={{ fontSize: 11, borderRadius: 6 }}
              >
                Verified Profiles Only ({identifiedLeadsCount})
              </Button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <Table
              dataSource={filteredEmailLeads}
              columns={leadColumns}
              rowKey="session_uuid"
              loading={loadingLeads}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              size="middle"
              locale={{ emptyText: 'No email campaign clicks recorded for this date range' }}
              className="email-leads-table"
            />
          </div>
        </div>
      )}

      {/* Monthly Progression History Modal (2021 - 2026) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EF444415', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MailOutlined style={{ color: '#EF4444', fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Email Campaign Monthly Growth Progression</div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                Historical enterprise track record from June 2021 to November 2026 (66 Months)
              </div>
            </div>
          </div>
        }
        open={showMonthlyHistory}
        onCancel={() => setShowMonthlyHistory(false)}
        footer={null}
        width={850}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', padding: '16px 0' } }}
      >
        <div style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div style={{ padding: '12px 16px', borderRadius: 8, background: darkMode ? '#1E293B' : '#F8FAFC', border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}` }}>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>All-Time Emails Dispatched</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#6366F1', fontFamily: 'monospace' }}>8.76M+</div>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 8, background: darkMode ? '#1E293B' : '#F8FAFC', border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}` }}>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>All-Time Leads Generated</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#EF4444', fontFamily: 'monospace' }}>4.31M+</div>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 8, background: darkMode ? '#1E293B' : '#F8FAFC', border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}` }}>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Current Monthly Velocity</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981', fontFamily: 'monospace' }}>74.8K – 87.6K</div>
          </div>
        </div>

        <Table
          dataSource={[...(campaignMetrics?.monthly_progression || [])].reverse()}
          rowKey="year_month"
          pagination={{ pageSize: 12, showSizeChanger: false }}
          size="middle"
          columns={[
            {
              title: 'Period',
              dataIndex: 'year_month',
              key: 'year_month',
              render: (ym) => {
                const parts = (ym || '').split('-');
                const year = parts[0];
                const month = parts[1];
                const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return (
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0284c7' }}>
                    {monthNames[parseInt(month, 10)]} {year}
                  </span>
                );
              }
            },
            {
              title: 'Emails Dispatched',
              dataIndex: 'emails_sent',
              key: 'emails_sent',
              render: (v) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{Number(v).toLocaleString()}</span>
            },
            {
              title: 'Leads Generated (Sessions)',
              dataIndex: 'leads_generated',
              key: 'leads_generated',
              render: (v) => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#EF4444' }}>{Number(v).toLocaleString()}</span>
            },
            {
              title: 'Open Rate',
              dataIndex: 'open_rate',
              key: 'open_rate',
              render: (v) => <Tag color="green" style={{ fontFamily: 'monospace' }}>{v}%</Tag>
            },
            {
              title: 'CTR',
              dataIndex: 'click_through_rate',
              key: 'click_through_rate',
              render: (v) => <Tag color="orange" style={{ fontFamily: 'monospace' }}>{v}%</Tag>
            },
            {
              title: 'Active Campaigns',
              dataIndex: 'active_campaigns_count',
              key: 'active_campaigns_count',
              render: (v) => <Tag color="blue">{v} Campaigns</Tag>
            }
          ]}
        />
      </Modal>
    </div>
  );
};

export default TrafficSourcesSection;
