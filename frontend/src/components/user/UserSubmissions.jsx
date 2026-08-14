import React, { useState, useEffect } from 'react';
import { Select, Input, Button, message, Tooltip, ConfigProvider, theme, Grid, Row, Col, Card, Avatar, Tag, Typography, Empty, Spin } from 'antd';
import { SearchOutlined, ReloadOutlined, FileTextOutlined, UserOutlined, CalendarOutlined, CopyOutlined, MailOutlined, DownOutlined } from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';

const getDisplayName = (extra_fields) => {
  if (!extra_fields) return '—';
  try {
    const data = typeof extra_fields === 'string' ? JSON.parse(extra_fields) : extra_fields;
    const nameKey = Object.keys(data).find(k => /name|first/i.test(k));
    return nameKey ? String(data[nameKey]) : Object.values(data)[0] || '—';
  } catch { return '—'; }
};

const getEmail = (extra_fields) => {
  if (!extra_fields) return null;
  try {
    const data = typeof extra_fields === 'string' ? JSON.parse(extra_fields) : extra_fields;
    const emailKey = Object.keys(data).find(k => /email/i.test(k));
    return emailKey ? data[emailKey] : null;
  } catch { return null; }
};
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Text } = Typography;

const ITEMS_PER_PAGE = 24;
const INITIAL_SHOW = 16;
const LOAD_MORE_COUNT = 4;

const UserSubmissions = () => {
  const { darkMode } = useTheme();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(INITIAL_SHOW);
  const [contentFilter, setContentFilter] = useState(null);
  const [search, setSearch] = useState('');
  const [articles, setArticles] = useState([]);
  const pageSize = 20;

  useEffect(() => { fetchSubmissions(); }, [page, contentFilter]);

  useEffect(() => {
    setVisibleCount(INITIAL_SHOW);
  }, [currentPage]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = { limit: pageSize, offset: (page - 1) * pageSize };
      if (contentFilter) params.content_id = contentFilter;
      const res = await axios.get('/api/user/submissions', { params });
      const data = res.data?.data || [];
      setSubmissions(data);
      setTotal(res.data?.total || 0);
      if (!contentFilter) {
        const unique = [...new Map(
          data.filter(s => s.content_id && s.content_title)
            .map(s => [s.content_id, { id: s.content_id, title: s.content_title }])
        ).values()];
        setArticles(prev => {
          const merged = new Map([...prev, ...unique].map(c => [c.id, c]));
          return [...merged.values()];
        });
      }
    } catch {
      message.error('Failed to load submissions');
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

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageItems = filtered.slice(startIndex, endIndex);
  const visibleItems = pageItems.slice(0, visibleCount);
  const hasMoreInPage = visibleCount < pageItems.length;

  const handleShowMore = () => {
    setVisibleCount(prev => Math.min(prev + LOAD_MORE_COUNT, pageItems.length));
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const SubmissionCard = ({ submission }) => {
    const name = getDisplayName(submission.extra_fields);
    const email = getEmail(submission.extra_fields);
    let extraFieldsData = {};
    try { extraFieldsData = typeof submission.extra_fields === 'string' ? JSON.parse(submission.extra_fields) : submission.extra_fields; } catch {}
    const extraFieldsEntries = Object.entries(extraFieldsData || {});

    return (
      <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
        <Card
          hoverable
          style={{
            borderRadius: 12,
            height: '100%',
            border: darkMode ? '1px solid #334155' : '1px solid #f0f0f0',
            boxShadow: darkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.04)',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: darkMode ? '#1e293b' : '#fff'
          }}
          bodyStyle={{
            padding: isMobile ? '12px' : '16px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header with avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Avatar
              size={isMobile ? 36 : 40}
              icon={<UserOutlined />}
              style={{ background: '#4a7cff', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: isMobile ? 12 : 13, color: darkMode ? '#f1f5f9' : '#111827', marginBottom: 2 }}>
                {name}
              </div>
              {email && (
                <div style={{ fontSize: isMobile ? 10 : 11, color: '#4a7cff', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MailOutlined style={{ fontSize: 10 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Article */}
          {submission.content_title && (
            <div style={{ marginBottom: 12, padding: '8px 10px', background: darkMode ? 'rgba(74, 124, 255, 0.1)' : '#f0f5ff', borderRadius: 6, border: darkMode ? '1px solid #334155' : '1px solid #d6e4ff' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <FileTextOutlined style={{ color: '#4a7cff', fontSize: isMobile ? 11 : 12, marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: isMobile ? 11 : 12, color: darkMode ? '#e2e8f0' : '#1a1a2e', lineHeight: 1.4 }}>
                  {submission.content_title}
                </span>
              </div>
            </div>
          )}

          {/* Extra Fields */}
          {extraFieldsEntries.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: isMobile ? 10 : 11, color: darkMode ? '#94a3b8' : '#8c8c8c', marginBottom: 6, fontWeight: 500 }}>
                FORM DATA
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {extraFieldsEntries.slice(0, 4).map(([k, v]) => (
                  <Tag key={k} color="blue" style={{ fontSize: isMobile ? 10 : 11, margin: 0, borderRadius: 4 }}>
                    {k}: {String(v).length > 10 ? String(v).substring(0, 10) + '...' : String(v)}
                  </Tag>
                ))}
                {extraFieldsEntries.length > 4 && (
                  <Tag style={{ fontSize: isMobile ? 10 : 11, margin: 0, borderRadius: 4 }}>
                    +{extraFieldsEntries.length - 4}
                  </Tag>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalendarOutlined style={{ fontSize: isMobile ? 10 : 11, color: darkMode ? '#64748b' : '#8c8c8c' }} />
              <span style={{ fontSize: isMobile ? 10 : 11, color: darkMode ? '#64748b' : '#8c8c8c' }}>
                {moment(submission.created_at).format('MMM D, YYYY')}
              </span>
            </div>
            <Tooltip title="Copy API URL">
              <Button
                size="small"
                type="text"
                icon={<CopyOutlined />}
                onClick={() => {
                  const apiUrl = `${window.location.origin}/api/public/submission/${submission.id}`;
                  navigator.clipboard.writeText(apiUrl);
                  message.success('API URL copied!');
                }}
                style={{ padding: '0 4px', height: 24 }}
              />
            </Tooltip>
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorBgContainer: darkMode ? '#1e293b' : '#ffffff',
          colorBorder: darkMode ? '#334155' : '#E5E7EB',
          colorText: darkMode ? '#e2e8f0' : '#1a1a1a',
          colorTextSecondary: darkMode ? '#94a3b8' : '#6B7280',
        },
      }}
    >
      <div className="submissions-scroll" style={{ padding: isMobile ? '12px' : '24px', background: darkMode ? '#0f172a' : '#F8FAFC', height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: isMobile ? '16px' : '24px', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#111827', margin: 0 }}>My Submissions</h1>
          <p style={{ fontSize: isMobile ? 13 : 15, color: darkMode ? '#94a3b8' : '#6B7280', margin: '4px 0 0' }}>
            Visitors who submitted the landing page form for your articles
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchSubmissions} size="small" style={{ borderRadius: 6, fontSize: 13, height: 32, padding: '4px 12px', minWidth: 'auto' }}>Refresh</Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: isMobile ? 12 : 16, marginBottom: isMobile ? '16px' : '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Submissions', value: total, color: '#4a7cff', icon: <FileTextOutlined /> },
          { label: 'Articles Tracked', value: articles.length, color: '#e17055', icon: <FileTextOutlined /> },
        ].map(s => (
          <div key={s.label} style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: isMobile ? '12px 16px' : '16px 24px', border: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', minWidth: isMobile ? 120 : 140, maxWidth: isMobile ? '100%' : 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {React.cloneElement(s.icon, { style: { fontSize: isMobile ? 14 : 16, color: s.color } })}
              <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
            <div style={{ fontSize: isMobile ? 11 : 12, color: darkMode ? '#94a3b8' : '#8c8c8c' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: isMobile ? '12px 16px' : '16px 20px', border: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', marginBottom: isMobile ? 12 : 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          placeholder="Search by name, email or article title..."
          prefix={<SearchOutlined style={{ color: darkMode ? '#64748b' : '#bfbfbf' }} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          style={{ width: isMobile ? '100%' : 300, borderRadius: 6 }}
        />
        <Select
          placeholder="Filter by article"
          style={{ width: isMobile ? '100%' : 280 }}
          allowClear
          value={contentFilter}
          onChange={v => { setContentFilter(v); setPage(1); }}
          showSearch
          optionFilterProp="children"
        >
          {articles.map(c => <Option key={c.id} value={c.id}>{c.title}</Option>)}
        </Select>
        <div style={{ marginLeft: 'auto', fontSize: isMobile ? 11 : 13, color: darkMode ? '#94a3b8' : '#8c8c8c' }}>
          Showing <strong style={{ color: darkMode ? '#f1f5f9' : '#1a1a2e' }}>{filtered.length}</strong> of <strong style={{ color: darkMode ? '#f1f5f9' : '#1a1a2e' }}>{total}</strong>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div style={{ padding: isMobile ? '40px 0' : '48px 0', textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      ) : filtered.length === 0 ? (
        <Empty
          description="No submissions found"
          style={{ padding: isMobile ? '40px 0' : '48px 0' }}
        />
      ) : (
        <>
          <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
            {visibleItems.map(submission => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </Row>

          {/* Show More / Pagination */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: isMobile ? 20 : 32,
            padding: isMobile ? '12px 0' : '16px 0',
            gap: isMobile ? 12 : 16
          }}>
            {hasMoreInPage && (
              <Button
                type="primary"
                icon={<DownOutlined />}
                onClick={handleShowMore}
                style={{
                  borderRadius: 24,
                  padding: isMobile ? '6px 16px' : '8px 32px',
                  height: 'auto',
                  minWidth: isMobile ? '140px' : '200px',
                  fontSize: isMobile ? 13 : 14,
                  background: '#4a7cff',
                  borderColor: '#4a7cff'
                }}
              >
                Show More ({visibleCount}/{pageItems.length})
              </Button>
            )}

            {totalPages > 1 && !hasMoreInPage && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 8 : 16,
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <Button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  size={isMobile ? 'small' : 'middle'}
                  style={{ borderRadius: 8 }}
                >
                  Previous
                </Button>

                <div style={{ display: 'flex', gap: isMobile ? 4 : 6 }}>
                  {Array.from({ length: Math.min(totalPages, isMobile ? 3 : 5) }, (_, i) => {
                    let pageNum;
                    const maxVisible = isMobile ? 3 : 5;
                    if (totalPages <= maxVisible) {
                      pageNum = i + 1;
                    } else if (currentPage <= 2) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                      pageNum = totalPages - maxVisible + 1 + i;
                    } else {
                      pageNum = currentPage - 1 + i;
                    }

                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <Button
                          key={pageNum}
                          type={currentPage === pageNum ? 'primary' : 'default'}
                          onClick={() => handlePageChange(pageNum)}
                          size={isMobile ? 'small' : 'middle'}
                          style={{
                            borderRadius: 8,
                            background: currentPage === pageNum ? '#4a7cff' : undefined,
                            borderColor: currentPage === pageNum ? '#4a7cff' : undefined
                          }}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                    return null;
                  })}
                </div>

                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  size={isMobile ? 'small' : 'middle'}
                  style={{ borderRadius: 8 }}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      )}
      <style>{`
        .submissions-scroll {
          scrollbar-width: thin;
          scrollbar-color: #636363 ${darkMode ? '#1e293b' : '#f0f0f0'};
        }
        .submissions-scroll::-webkit-scrollbar {
          width: 6px !important;
          display: block !important;
        }
        .submissions-scroll::-webkit-scrollbar-track {
          background: ${darkMode ? '#1e293b' : '#f0f0f0'};
          border-radius: 4px;
        }
        .submissions-scroll::-webkit-scrollbar-thumb {
          background: #636363;
          border-radius: 4px;
        }
        .submissions-scroll::-webkit-scrollbar-thumb:hover {
          background: #4a4a4a;
        }
      `}</style>
      </div>
    </ConfigProvider>
  );
};

export default UserSubmissions;
