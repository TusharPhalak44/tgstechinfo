import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Tabs, Table, Spin, Empty, Space, Tag, Tooltip, Input } from 'antd';
import {
  EyeOutlined,
  UserOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  LineChartOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  FileTextOutlined,
  RocketOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  ReadOutlined,
  CompassOutlined,
  DesktopOutlined,
  MobileOutlined,
  TabletOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text } = Typography;

/* ─────────────────────────────────────────────
   INJECTED CSS — Content Analytics Enterprise Styling
───────────────────────────────────────────── */
const analyticsStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  .u-analytics-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    letter-spacing: -0.01em;
    animation: uAnFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  @keyframes uAnFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .an-stagger-1 { animation: anSlideUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .an-stagger-2 { animation: anSlideUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.10s both; }
  .an-stagger-3 { animation: anSlideUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }

  @keyframes anSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Header */
  .u-analytics-header {
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
  .u-analytics-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.4), transparent);
  }

  /* KPI Card */
  .u-analytics-kpi {
    border-radius: 14px;
    padding: 16px 20px;
    border: 1px solid;
    position: relative;
    overflow: hidden;
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(12px);
  }
  .u-analytics-kpi::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2.5px;
    background: var(--card-accent, #2563EB);
    opacity: 0.9;
  }
  .u-analytics-kpi:hover {
    transform: translateY(-3px);
  }

  .u-analytics-table-wrap {
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid;
  }

  .live-pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10B981;
    display: inline-block;
    position: relative;
  }
  .live-pulse-dot::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 2px solid #10B981;
    animation: livePulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
  }
  @keyframes livePulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }
`;

const ContentAnalytics = () => {
  const { darkMode } = useTheme();
  const D = darkMode;

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentDetail, setContentDetail] = useState(null);
  const [engagementData, setEngagementData] = useState(null);
  const [detailTab, setDetailTab] = useState('locations');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh real-time analytics every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/user/analytics/dashboard');
      setDashboardData(res.data);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentSelect = async (content) => {
    setSelectedContent(content);
    setContentDetail(null);
    setEngagementData(null);
    setDetailTab('locations');
    setDetailLoading(true);
    try {
      const [detailRes, engagementRes] = await Promise.all([
        axios.get(`/api/user/analytics/content/${content.id || content.content_id}`),
        axios.get(`/api/user/analytics/content/${content.id || content.content_id}/engagement`)
      ]);
      setContentDetail(detailRes.data);
      setEngagementData(engagementRes.data.engagement_data || []);
    } catch (error) {
      console.error('Error fetching content detail:', error);
      setContentDetail({});
      setEngagementData([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredAllContent = (dashboardData?.all_content || []).filter(item => {
    if (!searchQuery) return true;
    return item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderOverview = () => (
    <div>
      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }} className="an-stagger-2">
        <Col xs={12} sm={12} md={6}>
          <div
            className="u-analytics-kpi"
            style={{
              '--card-accent': '#10B981',
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>
                Published Stories
              </span>
              <CheckCircleOutlined style={{ color: '#10B981', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', marginTop: 8 }}>
              {dashboardData?.user_summary?.total_published || 0}
            </div>
          </div>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <div
            className="u-analytics-kpi"
            style={{
              '--card-accent': '#2563EB',
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>
                Total Views
              </span>
              <EyeOutlined style={{ color: '#2563EB', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', marginTop: 8 }}>
              {dashboardData?.user_summary?.total_views_all_content || 0}
            </div>
          </div>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <div
            className="u-analytics-kpi"
            style={{
              '--card-accent': '#F7941D',
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>
                Unique Visitors
              </span>
              <UserOutlined style={{ color: '#F7941D', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', marginTop: 8 }}>
              {dashboardData?.user_summary?.total_unique_visitors || 0}
            </div>
          </div>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <div
            className="u-analytics-kpi"
            style={{
              '--card-accent': '#8B5CF6',
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>
                In Review / Drafts
              </span>
              <ClockCircleOutlined style={{ color: '#8B5CF6', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', marginTop: 8 }}>
              {(dashboardData?.user_summary?.pending_review || 0) + (dashboardData?.user_summary?.total_drafts || 0)}
            </div>
          </div>
        </Col>
      </Row>

      {/* All Publications Table */}
      <div className="an-stagger-3" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', margin: 0 }}>
            Publications Real-Time Telemetry
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              placeholder="Search stories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                borderRadius: 8,
                width: 220,
                background: D ? '#0F172A' : '#FFFFFF',
                borderColor: D ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                color: D ? '#F8FAFC' : '#0B1F4D',
              }}
            />
          </div>
        </div>

        <div
          className="u-analytics-table-wrap"
          style={{
            background: D ? '#0F172A' : '#FFFFFF',
            borderColor: D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
          }}
        >
          <Table
            dataSource={filteredAllContent.length > 0 ? filteredAllContent : (dashboardData?.top_content || [])}
            rowKey={(r) => r.id || r.content_id}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            locale={{
              emptyText: <Empty description="No publications found. Create content to track analytics!" />
            }}
            columns={[
              {
                title: 'Story Title',
                dataIndex: 'title',
                key: 'title',
                render: (text, record) => (
                  <div>
                    <div style={{ fontWeight: 700, color: D ? '#F8FAFC' : '#0B1F4D', fontSize: '0.84rem' }}>
                      {text}
                    </div>
                    {record.published_date && (
                      <div style={{ fontSize: '0.7rem', color: D ? '#64748B' : '#94A3B8', marginTop: 2 }}>
                        Published {moment(record.published_date).format('MMM D, YYYY')}
                      </div>
                    )}
                  </div>
                )
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => {
                  const color = status === 'published' || status === 'approved' ? 'green' : status === 'pending' ? 'gold' : 'default';
                  return <Tag color={color} style={{ textTransform: 'capitalize', fontWeight: 700 }}>{status}</Tag>;
                }
              },
              {
                title: 'Views',
                dataIndex: 'total_views',
                key: 'total_views',
                render: (val, record) => {
                  const views = val !== undefined ? val : (record.views || 0);
                  return (
                    <span style={{ fontWeight: 700, color: '#2563EB', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <EyeOutlined />
                      {views}
                    </span>
                  );
                }
              },
              {
                title: 'Visitors',
                dataIndex: 'unique_visitors',
                key: 'unique_visitors',
                render: (val) => (
                  <span style={{ fontWeight: 700, color: '#F7941D', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <UserOutlined />
                    {val || 0}
                  </span>
                )
              },
              {
                title: 'Engagements',
                dataIndex: 'total_engagements',
                key: 'total_engagements',
                render: (val, record) => {
                  const engagements = val !== undefined ? val : (record.engagements || 0);
                  return (
                    <span style={{ fontWeight: 700, color: '#10B981', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BarChartOutlined />
                      {engagements}
                    </span>
                  );
                }
              },
              {
                title: 'Action',
                key: 'action',
                render: (_, record) => (
                  <button
                    onClick={() => handleContentSelect(record)}
                    style={{
                      background: 'linear-gradient(135deg, #0B1F4D 0%, #1D3D8F 100%)',
                      border: '1px solid rgba(247, 148, 29, 0.35)',
                      color: '#F7941D',
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      padding: '5px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>Inspect</span>
                    <ThunderboltOutlined style={{ fontSize: 11 }} />
                  </button>
                )
              }
            ]}
          />
        </div>
      </div>
    </div>
  );

  const renderContentDetail = () => {
    if (!selectedContent) return <Empty description="Select content to view details" />;
    if (detailLoading || !contentDetail) {
      return (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: D ? '#94A3B8' : '#64748B', fontSize: '0.84rem' }}>
            Loading story performance analytics...
          </div>
        </div>
      );
    }

    const detailTabs = [
      {
        key: 'locations',
        label: (
          <span><GlobalOutlined style={{ marginRight: 6 }} />Geographic Distribution</span>
        ),
        children: (
          <div
            className="u-analytics-table-wrap"
            style={{
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
            }}
          >
            <Table
              dataSource={contentDetail?.locations || []}
              rowKey={(r, i) => `${r.country}-${i}`}
              pagination={false}
              locale={{
                emptyText: <Empty description="No location traffic captured yet for this story." />
              }}
              columns={[
                {
                  title: 'Country / Region',
                  dataIndex: 'country',
                  key: 'country',
                  render: (country) => (
                    <span style={{ fontWeight: 600, color: D ? '#F8FAFC' : '#0B1F4D', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <GlobalOutlined style={{ color: '#2563EB' }} />
                      {country || 'Global / Unknown'}
                    </span>
                  )
                },
                {
                  title: 'Device Type',
                  dataIndex: 'device_type',
                  key: 'device_type',
                  render: (device) => {
                    const dev = (device || 'desktop').toLowerCase();
                    const icon = dev === 'mobile' ? <MobileOutlined /> : dev === 'tablet' ? <TabletOutlined /> : <DesktopOutlined />;
                    return (
                      <Tag color="blue" icon={icon} style={{ textTransform: 'capitalize' }}>
                        {device || 'Desktop'}
                      </Tag>
                    );
                  }
                },
                {
                  title: 'Browser',
                  dataIndex: 'browser',
                  key: 'browser',
                  render: (b) => <span style={{ color: D ? '#CBD5E1' : '#475569' }}>{b || 'Chrome / Edge'}</span>
                },
                {
                  title: 'Unique Visitors',
                  dataIndex: 'visitor_count',
                  key: 'visitor_count',
                  render: (count) => <span style={{ fontWeight: 700, color: '#10B981' }}>{count || 0}</span>
                },
                {
                  title: 'Page Views',
                  dataIndex: 'page_views',
                  key: 'page_views',
                  render: (views) => <span style={{ fontWeight: 700, color: '#2563EB' }}>{views || 0}</span>
                },
                {
                  title: 'Last Active',
                  dataIndex: 'last_viewed',
                  key: 'last_viewed',
                  render: (time) => (
                    <span style={{ fontSize: '0.75rem', color: D ? '#94A3B8' : '#64748B' }}>
                      {time ? moment(time).fromNow() : 'Recent'}
                    </span>
                  )
                }
              ]}
            />
          </div>
        )
      },
      {
        key: 'engagement',
        label: (
          <span><BarChartOutlined style={{ marginRight: 6 }} />Reader Engagement Details</span>
        ),
        children: (
          <div
            className="u-analytics-table-wrap"
            style={{
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
            }}
          >
            <Table
              dataSource={engagementData || []}
              rowKey={(r, i) => `${r.engagement_type}-${i}`}
              pagination={false}
              locale={{
                emptyText: <Empty description="Engagement telemetry will populate as readers interact." />
              }}
              columns={[
                {
                  title: 'Interaction Type',
                  dataIndex: 'engagement_type',
                  key: 'engagement_type',
                  render: (type) => <Tag color="cyan" style={{ textTransform: 'capitalize', fontWeight: 700 }}>{type || 'Read'}</Tag>
                },
                {
                  title: 'Interactions Count',
                  dataIndex: 'count',
                  key: 'count',
                  render: (c) => <span style={{ fontWeight: 700, color: D ? '#F8FAFC' : '#0B1F4D' }}>{c}</span>
                },
                {
                  title: 'Avg Reading Time',
                  dataIndex: 'avg_reading_time',
                  key: 'avg_reading_time',
                  render: (time) => <span>{Math.round(time || 0)} seconds</span>
                },
                {
                  title: 'Avg Scroll Depth',
                  dataIndex: 'avg_scroll_depth',
                  key: 'avg_scroll_depth',
                  render: (depth) => <span>{Math.round(depth || 0)}%</span>
                },
                {
                  title: 'Full Completed Reads',
                  dataIndex: 'completed_count',
                  key: 'completed_count',
                  render: (comp) => <span style={{ fontWeight: 700, color: '#10B981' }}>{comp || 0}</span>
                }
              ]}
            />
          </div>
        )
      },
      {
        key: 'visitors',
        label: (
          <span><CompassOutlined style={{ marginRight: 6 }} />Recent Reader Log</span>
        ),
        children: (
          <div
            className="u-analytics-table-wrap"
            style={{
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
            }}
          >
            <Table
              dataSource={contentDetail?.recent_visitors || []}
              rowKey={(r, i) => `${r.session_uuid}-${i}`}
              pagination={{ pageSize: 8 }}
              locale={{
                emptyText: <Empty description="No recent visitor logs recorded yet." />
              }}
              columns={[
                {
                  title: 'Reader Session',
                  dataIndex: 'session_uuid',
                  key: 'session_uuid',
                  render: (uuid) => <code style={{ fontSize: '0.72rem' }}>{uuid ? uuid.slice(0, 12) + '...' : 'Anonymous'}</code>
                },
                {
                  title: 'Country',
                  dataIndex: 'country',
                  key: 'country',
                  render: (c) => <Tag color="geekblue">{c || 'Global'}</Tag>
                },
                {
                  title: 'Device',
                  dataIndex: 'device_type',
                  key: 'device_type',
                  render: (d) => <Tag color="purple">{d || 'Desktop'}</Tag>
                },
                {
                  title: 'Browser',
                  dataIndex: 'browser',
                  key: 'browser',
                  render: (b) => <span>{b || 'Web Browser'}</span>
                },
                {
                  title: 'Timestamp',
                  dataIndex: 'view_time',
                  key: 'view_time',
                  render: (t) => <span>{t ? moment(t).format('MMM D, YYYY h:mm A') : 'Recent'}</span>
                }
              ]}
            />
          </div>
        )
      }
    ];

    return (
      <div>
        <button
          onClick={() => { setSelectedContent(null); setContentDetail(null); setEngagementData(null); }}
          style={{
            background: D ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
            border: `1px solid ${D ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
            color: D ? '#94A3B8' : '#475569',
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          <ArrowLeftOutlined />
          <span>Back to Overview</span>
        </button>

        <div
          style={{
            background: D ? '#0F172A' : '#FFFFFF',
            borderRadius: 14,
            padding: '16px 20px',
            border: `1px solid ${D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0'}`,
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', margin: 0 }}>
            {selectedContent.title}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: D ? '#94A3B8' : '#64748B' }}>
            Real-time telemetry, reader dwell time, and regional distribution for this story.
          </p>
        </div>

        {/* Stats Grid */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <div
              className="u-analytics-kpi"
              style={{
                '--card-accent': '#2563EB',
                background: D ? '#0F172A' : '#FFFFFF',
                borderColor: D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>
                Total Views
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', marginTop: 6 }}>
                {contentDetail?.stats?.total_views || selectedContent.views || selectedContent.total_views || 0}
              </div>
            </div>
          </Col>

          <Col xs={12} sm={6}>
            <div
              className="u-analytics-kpi"
              style={{
                '--card-accent': '#10B981',
                background: D ? '#0F172A' : '#FFFFFF',
                borderColor: D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>
                Unique Visitors
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', marginTop: 6 }}>
                {contentDetail?.stats?.unique_visitors || selectedContent.unique_visitors || 0}
              </div>
            </div>
          </Col>

          <Col xs={12} sm={6}>
            <div
              className="u-analytics-kpi"
              style={{
                '--card-accent': '#F7941D',
                background: D ? '#0F172A' : '#FFFFFF',
                borderColor: D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>
                Avg Read Time
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', marginTop: 6 }}>
                {contentDetail?.stats?.avg_reading_time || selectedContent.avg_reading_time || 0} <span style={{ fontSize: '0.85rem' }}>sec</span>
              </div>
            </div>
          </Col>

          <Col xs={12} sm={6}>
            <div
              className="u-analytics-kpi"
              style={{
                '--card-accent': '#8B5CF6',
                background: D ? '#0F172A' : '#FFFFFF',
                borderColor: D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0',
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>
                Completed Reads
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', marginTop: 6 }}>
                {contentDetail?.stats?.completed_reads || selectedContent.completed_reads || 0}
              </div>
            </div>
          </Col>
        </Row>

        <Tabs
          activeKey={detailTab}
          onChange={setDetailTab}
          items={detailTabs}
        />
      </div>
    );
  };

  return (
    <div className="u-analytics-root">
      <style>{analyticsStyles}</style>

      {/* ── COMMAND HEADER ── */}
      <div
        className="u-analytics-header an-stagger-1"
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
            <LineChartOutlined />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{
                margin: 0,
                fontSize: '1.24rem',
                fontWeight: 800,
                color: D ? '#F8FAFC' : '#0B1F4D',
                letterSpacing: '-0.02em',
              }}>
                Content Intelligence & Analytics
              </h1>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '2px 8px',
                borderRadius: 16,
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '0.65rem',
                fontWeight: 800,
                color: '#10B981',
              }}>
                <span className="live-pulse-dot" />
                <span>REAL-TIME STREAM</span>
              </div>
            </div>
            <p style={{
              margin: '2px 0 0',
              fontSize: '0.78rem',
              color: D ? '#94A3B8' : '#64748B',
            }}>
              Live readership telemetry, scroll depth, and reader location distribution.
              {lastSyncTime && (
                <span style={{ marginLeft: 6, opacity: 0.8 }}>
                  • Last synced {moment(lastSyncTime).format('h:mm:ss A')}
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={fetchDashboardData}
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
            transition: 'all 0.2s',
          }}
        >
          <ReloadOutlined spin={loading} />
          <span>Sync Now</span>
        </button>
      </div>

      {loading && !dashboardData && !selectedContent ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: D ? '#94A3B8' : '#64748B', fontSize: '0.84rem' }}>
            Gathering real-time traffic metrics...
          </div>
        </div>
      ) : selectedContent ? (
        renderContentDetail()
      ) : (
        renderOverview()
      )}
    </div>
  );
};

export default ContentAnalytics;