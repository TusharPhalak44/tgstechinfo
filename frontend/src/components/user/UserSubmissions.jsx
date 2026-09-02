import React, { useState, useEffect } from 'react';
import { Select, Typography, Empty, Spin, message, Tooltip, Row, Col } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  CopyOutlined,
  MailOutlined,
  DownOutlined,
  SendOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useTheme } from '../../context/ThemeContext';

const { Option } = Select;
const { Title, Text } = Typography;

/* ─────────────────────────────────────────────
   INJECTED CSS — Submissions Enterprise Styling
───────────────────────────────────────────── */
const submissionStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  .subm-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    letter-spacing: -0.01em;
    animation: submFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  @keyframes submFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .s-stagger-1 { animation: sSlideUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .s-stagger-2 { animation: sSlideUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.10s both; }
  .s-stagger-3 { animation: sSlideUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }

  @keyframes sSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Header ── */
  .subm-header {
    border-radius: 16px;
    padding: 18px 24px;
    margin-bottom: 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(16px);
  }
  .subm-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.4), transparent);
  }

  /* ── KPI Cards ── */
  .subm-kpi-card {
    border-radius: 14px;
    padding: 16px 20px;
    border: 1px solid;
    position: relative;
    overflow: hidden;
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(12px);
  }
  .subm-kpi-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2.5px;
    background: var(--card-accent, #10B981);
    opacity: 0.9;
  }
  .subm-kpi-card:hover {
    transform: translateY(-3px);
  }

  /* ── Lead Card ── */
  .subm-card {
    border-radius: 14px;
    padding: 18px 20px;
    border: 1px solid;
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: space-between;
  }
  .subm-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.2);
  }
`;

const getDisplayName = (extra_fields) => {
  if (!extra_fields) return 'Anonymous Contact';
  try {
    const data = typeof extra_fields === 'string' ? JSON.parse(extra_fields) : extra_fields;
    const nameKey = Object.keys(data).find(k => /name|first/i.test(k));
    return nameKey ? String(data[nameKey]) : Object.values(data)[0] || 'Anonymous Contact';
  } catch { return 'Anonymous Contact'; }
};

const getEmail = (extra_fields) => {
  if (!extra_fields) return null;
  try {
    const data = typeof extra_fields === 'string' ? JSON.parse(extra_fields) : extra_fields;
    const emailKey = Object.keys(data).find(k => /email/i.test(k));
    return emailKey ? data[emailKey] : null;
  } catch { return null; }
};

const getPhone = (extra_fields) => {
  if (!extra_fields) return null;
  try {
    const data = typeof extra_fields === 'string' ? JSON.parse(extra_fields) : extra_fields;
    const phoneKey = Object.keys(data).find(k => /phone|mobile|tel/i.test(k));
    return phoneKey ? data[phoneKey] : null;
  } catch { return null; }
};

const INITIAL_SHOW = 12;
const LOAD_MORE_COUNT = 6;

const UserSubmissions = () => {
  const { darkMode } = useTheme();
  const D = darkMode;

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [visibleCount, setVisibleCount] = useState(INITIAL_SHOW);
  const [contentFilter, setContentFilter] = useState(null);
  const [search, setSearch] = useState('');
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetchSubmissions();
  }, [contentFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = { limit: 100, offset: 0 };
      if (contentFilter) params.content_id = contentFilter;
      const res = await axios.get('/api/user/submissions', { params });
      const data = res.data?.data || [];
      setSubmissions(data);
      setTotal(res.data?.total || data.length);

      if (!contentFilter) {
        const unique = [...new Map(
          data.filter(s => s.content_id && s.content_title)
            .map(s => [s.content_id, { id: s.content_id, title: s.content_title }])
        ).values()];
        setArticles(unique);
      }
    } catch {
      message.error('Failed to load lead submissions');
    } finally {
      setLoading(false);
    }
  };

  const filtered = submissions.filter(s => {
    if (!search) return true;
    const name = getDisplayName(s.extra_fields).toLowerCase();
    const email = (getEmail(s.extra_fields) || '').toLowerCase();
    const contentTitle = (s.content_title || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q) || contentTitle.includes(q);
  });

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="subm-root">
      <style>{submissionStyles}</style>

      {/* ── HEADER BAR ── */}
      <div
        className="subm-header s-stagger-1"
        style={{
          background: D
            ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 31, 77, 0.5) 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: `1px solid ${D ? 'rgba(255, 255, 255, 0.08)' : 'rgba(11, 31, 77, 0.08)'}`,
          boxShadow: D ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(11, 31, 77, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0B1F4D 0%, #1D3D8F 100%)',
              border: '1px solid rgba(247, 148, 29, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F7941D',
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            <SendOutlined />
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '1.24rem',
              fontWeight: 800,
              color: D ? '#F8FAFC' : '#0B1F4D',
              letterSpacing: '-0.02em',
            }}>
              Lead Submissions & Form Inquiries
            </h1>
            <p style={{
              margin: '2px 0 0',
              fontSize: '0.78rem',
              color: D ? '#94A3B8' : '#64748B',
            }}>
              Track inbound leads, reader sign-ups, and form submissions from your published content.
            </p>
          </div>
        </div>

        <button
          onClick={fetchSubmissions}
          style={{
            background: D ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
            border: `1px solid ${D ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
            color: D ? '#94A3B8' : '#475569',
            padding: '7px 14px',
            borderRadius: 10,
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          <ReloadOutlined spin={loading} />
          <span>Refresh Leads</span>
        </button>
      </div>

      {/* ── KPI METRICS ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 22 }} className="s-stagger-2">
        <Col xs={12} sm={8}>
          <div
            className="subm-kpi-card"
            style={{
              '--card-accent': '#10B981',
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>
                Total Leads
              </span>
              <SendOutlined style={{ color: '#10B981', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', marginTop: 8 }}>
              {total}
            </div>
          </div>
        </Col>

        <Col xs={12} sm={8}>
          <div
            className="subm-kpi-card"
            style={{
              '--card-accent': '#2563EB',
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>
                Active Stories
              </span>
              <FileTextOutlined style={{ color: '#2563EB', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', marginTop: 8 }}>
              {articles.length}
            </div>
          </div>
        </Col>

        <Col xs={24} sm={8}>
          <div
            className="subm-kpi-card"
            style={{
              '--card-accent': '#F7941D',
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>
                Filtered Results
              </span>
              <TeamOutlined style={{ color: '#F7941D', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', marginTop: 8 }}>
              {filtered.length}
            </div>
          </div>
        </Col>
      </Row>

      {/* ── TOOLBAR: FILTER BY STORY & SEARCH ── */}
      <div
        className="s-stagger-2"
        style={{
          background: D ? '#0F172A' : '#FFFFFF',
          borderRadius: 12,
          padding: '12px 16px',
          border: `1px solid ${D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0'}`,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {/* Story Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', whiteSpace: 'nowrap' }}>
            Story Filter:
          </span>
          <Select
            allowClear
            placeholder="All Published Stories"
            value={contentFilter}
            onChange={(val) => setContentFilter(val)}
            style={{ width: '100%', maxWidth: 360 }}
          >
            {articles.map((a) => (
              <Option key={a.id} value={a.id}>
                {a.title}
              </Option>
            ))}
          </Select>
        </div>

        {/* Lead Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 8,
            padding: '5px 12px',
            background: D ? '#1E293B' : '#F1F5F9',
            border: `1px solid ${D ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
            width: 260,
          }}
        >
          <SearchOutlined style={{ color: D ? '#64748B' : '#94A3B8', fontSize: 13 }} />
          <input
            placeholder="Search lead name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.78rem',
              color: D ? '#F8FAFC' : '#0B1F4D',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* ── LEADS GRID ── */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: D ? '#94A3B8' : '#64748B', fontSize: '0.84rem' }}>
            Fetching form submissions...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            background: D ? '#0F172A' : '#FFFFFF',
            borderRadius: 16,
            border: `1px solid ${D ? 'rgba(255,255,255,0.07)' : '#E2E8F0'}`,
          }}
        >
          <Empty
            description={
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: D ? '#F8FAFC' : '#0B1F4D', marginBottom: 4 }}>
                  No Inquiries Received
                </div>
                <div style={{ fontSize: '0.8rem', color: D ? '#94A3B8' : '#64748B' }}>
                  When readers fill out form gates on your landing pages, their details will appear here.
                </div>
              </div>
            }
          />
        </div>
      ) : (
        <div className="s-stagger-3">
          <Row gutter={[18, 18]}>
            {visibleItems.map((sub) => {
              const name = getDisplayName(sub.extra_fields);
              const email = getEmail(sub.extra_fields);
              const phone = getPhone(sub.extra_fields);

              let extraFieldsData = {};
              try {
                extraFieldsData = typeof sub.extra_fields === 'string' ? JSON.parse(sub.extra_fields) : sub.extra_fields;
              } catch {}
              const extraEntries = Object.entries(extraFieldsData || {});

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={sub.id}>
                  <div
                    className="subm-card"
                    style={{
                      background: D ? '#0F172A' : '#FFFFFF',
                      borderColor: D ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                    }}
                  >
                    <div>
                      {/* Top: Avatar & Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #0B1F4D 0%, #1D3D8F 100%)',
                            border: '1px solid rgba(247, 148, 29, 0.35)',
                            color: '#F7941D',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {name[0]?.toUpperCase() || 'L'}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: D ? '#F8FAFC' : '#0B1F4D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: D ? '#64748B' : '#94A3B8' }}>
                            {moment(sub.created_at).fromNow()}
                          </div>
                        </div>
                      </div>

                      {/* Contact Chips */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                        {email && (
                          <div
                            onClick={() => {
                              navigator.clipboard.writeText(email);
                              message.success('Email copied to clipboard');
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: D ? 'rgba(37, 99, 235, 0.1)' : '#EFF6FF',
                              border: `1px solid ${D ? 'rgba(37, 99, 235, 0.25)' : '#DBEAFE'}`,
                              borderRadius: 6,
                              padding: '4px 8px',
                              fontSize: '0.74rem',
                              color: '#2563EB',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            title="Click to copy email"
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <MailOutlined style={{ fontSize: 11 }} />
                              {email}
                            </span>
                            <CopyOutlined style={{ fontSize: 10, opacity: 0.7 }} />
                          </div>
                        )}

                        {phone && (
                          <div
                            onClick={() => {
                              navigator.clipboard.writeText(phone);
                              message.success('Phone copied to clipboard');
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: D ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
                              border: `1px solid ${D ? 'rgba(16, 185, 129, 0.25)' : '#D1FAE5'}`,
                              borderRadius: 6,
                              padding: '4px 8px',
                              fontSize: '0.74rem',
                              color: '#10B981',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            title="Click to copy phone"
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <PhoneOutlined style={{ fontSize: 11 }} />
                              {phone}
                            </span>
                            <CopyOutlined style={{ fontSize: 10, opacity: 0.7 }} />
                          </div>
                        )}
                      </div>

                      {/* Linked Content Pill */}
                      {sub.content_title && (
                        <div
                          style={{
                            background: D ? '#1E293B' : '#F8FAFC',
                            border: `1px solid ${D ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
                            borderRadius: 8,
                            padding: '6px 10px',
                            marginBottom: 12,
                          }}
                        >
                          <div style={{ fontSize: '0.64rem', fontWeight: 800, color: D ? '#64748B' : '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>
                            Submitted for Story
                          </div>
                          <div style={{ fontSize: '0.76rem', fontWeight: 600, color: D ? '#E2E8F0' : '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FileTextOutlined style={{ color: '#F7941D', flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {sub.content_title}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Extra Data Tags */}
                      {extraEntries.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.64rem', fontWeight: 800, color: D ? '#64748B' : '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>
                            Form Fields
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {extraEntries.slice(0, 4).map(([k, v]) => (
                              <span
                                key={k}
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 500,
                                  background: D ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                                  color: D ? '#CBD5E1' : '#475569',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  border: `1px solid ${D ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
                                }}
                              >
                                {k}: {String(v).slice(0, 15)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px solid ${D ? 'rgba(255,255,255,0.06)' : '#F1F5F9'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.68rem', color: D ? '#64748B' : '#94A3B8' }}>
                        {moment(sub.created_at).format('MMM D, YYYY')}
                      </span>

                      <Tooltip title="Copy Submission JSON">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(sub, null, 2));
                            message.success('Submission JSON copied!');
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: D ? '#94A3B8' : '#64748B',
                            cursor: 'pointer',
                            padding: '3px 6px',
                            borderRadius: 4,
                            fontSize: '0.72rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <CopyOutlined />
                          <span>Data</span>
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>

          {/* Show More */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 28, marginBottom: 16 }}>
              <button
                onClick={() => setVisibleCount(prev => prev + LOAD_MORE_COUNT)}
                style={{
                  background: D ? '#0F172A' : '#FFFFFF',
                  border: `1px solid ${D ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
                  color: D ? '#F8FAFC' : '#0B1F4D',
                  padding: '9px 24px',
                  borderRadius: 24,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <DownOutlined />
                <span>Show More ({visibleItems.length} of {filtered.length})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSubmissions;
