import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Button, Typography, Tabs, Table, Spin, Empty, Space, Tag, Progress } from 'antd';
import {
  EyeOutlined, UserOutlined, GlobalOutlined, ClockCircleOutlined,
  BarChartOutlined, DownloadOutlined, LineChartOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text } = Typography;

const ContentAnalytics = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentDetail, setContentDetail] = useState(null);
  const [engagementData, setEngagementData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [detailTab, setDetailTab] = useState('locations');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/user/analytics/dashboard');
      setDashboardData(res.data);
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
        axios.get(`/api/user/analytics/content/${content.id}`),
        axios.get(`/api/user/analytics/content/${content.id}/engagement`)
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

  const renderOverview = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card style={{ borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB', background: darkMode ? '#1e293b' : '#FFFFFF' }}>
            <Statistic
              title={<Text style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#6B7280', fontWeight: 500 }}>Total Published</Text>}
              value={dashboardData?.user_summary?.total_published || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card style={{ borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB', background: darkMode ? '#1e293b' : '#FFFFFF' }}>
            <Statistic
              title={<Text style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#6B7280', fontWeight: 500 }}>Total Views</Text>}
              value={dashboardData?.user_summary?.total_views_all_content || 0}
              prefix={<EyeOutlined style={{ color: '#4a7cff' }} />}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card style={{ borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB', background: darkMode ? '#1e293b' : '#FFFFFF' }}>
            <Statistic
              title={<Text style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#6B7280', fontWeight: 500 }}>Unique Visitors</Text>}
              value={dashboardData?.user_summary?.total_unique_visitors || 0}
              prefix={<UserOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card style={{ borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB', background: darkMode ? '#1e293b' : '#FFFFFF' }}>
            <Statistic
              title={<Text style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#6B7280', fontWeight: 500 }}>Pending Review</Text>}
              value={dashboardData?.user_summary?.pending_review || 0}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827' }}
            />
          </Card>
        </Col>
      </Row>

      <Title level={4} style={{ marginBottom: 16, color: darkMode ? '#f1f5f9' : '#111827' }}>
        Top Performing Content
      </Title>
      <Table
        dataSource={dashboardData?.top_content || []}
        rowKey="id"
        pagination={false}
        style={{ background: darkMode ? '#1e293b' : '#FFFFFF', borderRadius: 12 }}
        columns={[
          {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text) => <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>{text}</Text>
          },
          {
            title: 'Views',
            dataIndex: 'views',
            key: 'views',
            render: (views) => (
              <Space>
                <EyeOutlined style={{ color: '#4a7cff' }} />
                <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>{views || 0}</Text>
              </Space>
            )
          },
          {
            title: 'Engagements',
            dataIndex: 'engagements',
            key: 'engagements',
            render: (engagements) => (
              <Space>
                <BarChartOutlined style={{ color: '#52c41a' }} />
                <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>{engagements || 0}</Text>
              </Space>
            )
          },
          {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
              <Button type="primary" size="small" onClick={() => handleContentSelect(record)}>
                View Details
              </Button>
            )
          }
        ]}
      />

      <Title level={4} style={{ marginTop: 24, marginBottom: 16, color: darkMode ? '#f1f5f9' : '#111827' }}>
        Recent Content
      </Title>
      <Table
        dataSource={dashboardData?.recent_content || []}
        rowKey="id"
        pagination={false}
        style={{ background: darkMode ? '#1e293b' : '#FFFFFF', borderRadius: 12 }}
        columns={[
          {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text) => <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>{text}</Text>
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
              const colorMap = {
                published: 'green',
                draft: 'default',
                pending: 'orange',
                approved: 'blue',
                rejected: 'red'
              };
              return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
            }
          },
          {
            title: 'Views',
            dataIndex: 'views',
            key: 'views',
            render: (views) => (
              <Space>
                <EyeOutlined style={{ color: '#4a7cff' }} />
                <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>{views || 0}</Text>
              </Space>
            )
          },
          {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
              <Button type="primary" size="small" onClick={() => handleContentSelect(record)}>
                View Details
              </Button>
            )
          }
        ]}
      />
    </div>
  );

  const renderContentDetail = () => {
    if (!selectedContent) return <Empty description="Select content to view details" />;
    if (detailLoading) return <div style={{ padding: '48px', textAlign: 'center' }}><Spin size="large" /></div>;
    if (!contentDetail) return <div style={{ padding: '48px', textAlign: 'center' }}><Spin size="large" /></div>;

    return (
      <div>
        <Button onClick={() => { setSelectedContent(null); setContentDetail(null); setEngagementData(null); }} style={{ marginBottom: 16 }}>
          ← Back to Overview
        </Button>

        <Card style={{ marginBottom: 16, borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB', background: darkMode ? '#1e293b' : '#FFFFFF' }}>
          <Title level={4} style={{ color: darkMode ? '#f1f5f9' : '#111827' }}>{selectedContent.title}</Title>
          <Text style={{ color: darkMode ? '#94a3b8' : '#6B7280' }}>Detailed analytics for this content</Text>
        </Card>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Card style={{ borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB', background: darkMode ? '#1e293b' : '#FFFFFF' }}>
              <Statistic
                title={<Text style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#6B7280', fontWeight: 500 }}>Total Views</Text>}
                value={contentDetail?.stats?.total_views || 0}
                prefix={<EyeOutlined style={{ color: '#4a7cff' }} />}
                valueStyle={{ fontSize: 24, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Card style={{ borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB', background: darkMode ? '#1e293b' : '#FFFFFF' }}>
              <Statistic
                title={<Text style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#6B7280', fontWeight: 500 }}>Unique Visitors</Text>}
                value={contentDetail?.stats?.unique_visitors || 0}
                prefix={<UserOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ fontSize: 24, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Card style={{ borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB', background: darkMode ? '#1e293b' : '#FFFFFF' }}>
              <Statistic
                title={<Text style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#6B7280', fontWeight: 500 }}>Avg Read Time</Text>}
                value={contentDetail?.stats?.avg_reading_time || 0}
                suffix="sec"
                prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ fontSize: 24, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Card style={{ borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB', background: darkMode ? '#1e293b' : '#FFFFFF' }}>
              <Statistic
                title={<Text style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#6B7280', fontWeight: 500 }}>Completed Reads</Text>}
                value={contentDetail?.stats?.completed_reads || 0}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ fontSize: 24, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Card style={{ borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB', background: darkMode ? '#1e293b' : '#FFFFFF' }}>
              <Statistic
                title={<Text style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#6B7280', fontWeight: 500 }}>Total Engagements</Text>}
                value={contentDetail?.stats?.total_engagements || 0}
                prefix={<BarChartOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ fontSize: 24, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Card style={{ borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB', background: darkMode ? '#1e293b' : '#FFFFFF' }}>
              <Statistic
                title={<Text style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#6B7280', fontWeight: 500 }}>Avg Scroll Depth</Text>}
                value={contentDetail?.stats?.avg_scroll_depth || 0}
                suffix="%"
                prefix={<LineChartOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ fontSize: 24, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Card style={{ borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB', background: darkMode ? '#1e293b' : '#FFFFFF' }}>
              <Statistic
                title={<Text style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#6B7280', fontWeight: 500 }}>Downloads</Text>}
                value={contentDetail?.stats?.total_downloads || 0}
                prefix={<DownloadOutlined style={{ color: '#13c2c2' }} />}
                valueStyle={{ fontSize: 24, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827' }}
              />
            </Card>
          </Col>
        </Row>

        <Tabs
          activeKey={detailTab}
          onChange={setDetailTab}
          items={[
            {
              key: 'locations',
              label: (
                <span>
                  <GlobalOutlined />
                  Location Analytics
                </span>
              ),
              children: renderLocationAnalytics()
            },
            {
              key: 'engagement',
              label: (
                <span>
                  <BarChartOutlined />
                  Engagement Details
                </span>
              ),
              children: renderEngagementAnalytics()
            },
            {
              key: 'daily',
              label: (
                <span>
                  <LineChartOutlined />
                  Daily Views
                </span>
              ),
              children: renderDailyViews()
            },
            {
              key: 'visitors',
              label: (
                <span>
                  <UserOutlined />
                  Recent Visitors
                </span>
              ),
              children: renderRecentVisitors()
            }
          ]}
        />
      </div>
    );
  };

  const renderLocationAnalytics = () => {
    const locationData = contentDetail?.locations;
    if (!locationData || locationData.length === 0) {
      return (
        <Empty 
          description="No location data available yet. Visitors will appear here once they start viewing your content."
          style={{ padding: '48px 24px' }}
        />
      );
    }

    return (
      <Table
        dataSource={locationData}
        rowKey={(record, index) => `${record.country}-${record.device_type}-${index}`}
        pagination={false}
        style={{ background: darkMode ? '#1e293b' : '#FFFFFF', borderRadius: 12 }}
        columns={[
          {
            title: 'Country',
            dataIndex: 'country',
            key: 'country',
            render: (country) => (
              <Space>
                <GlobalOutlined style={{ color: '#4a7cff' }} />
                <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>{country || 'Unknown'}</Text>
              </Space>
            )
          },
          {
            title: 'Device',
            dataIndex: 'device_type',
            key: 'device_type',
            render: (device) => <Tag color="blue">{device || 'Unknown'}</Tag>
          },
          {
            title: 'Browser',
            dataIndex: 'browser',
            key: 'browser',
            render: (browser) => <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>{browser || 'Unknown'}</Text>
          },
          {
            title: 'OS',
            dataIndex: 'operating_system',
            key: 'operating_system',
            render: (os) => <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>{os || 'Unknown'}</Text>
          },
          {
            title: 'Visitors',
            dataIndex: 'visitor_count',
            key: 'visitor_count',
            render: (count) => (
              <Space>
                <UserOutlined style={{ color: '#52c41a' }} />
                <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a', fontWeight: 600 }}>{count}</Text>
              </Space>
            )
          },
          {
            title: 'Page Views',
            dataIndex: 'page_views',
            key: 'page_views',
            render: (views) => (
              <Space>
                <EyeOutlined style={{ color: '#4a7cff' }} />
                <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>{views}</Text>
              </Space>
            )
          },
          {
            title: 'Last Viewed',
            dataIndex: 'last_viewed',
            key: 'last_viewed',
            render: (date) => (
              <Text style={{ color: darkMode ? '#94a3b8' : '#6B7280' }}>
                {moment(date).format('MMM D, YYYY HH:mm')}
              </Text>
            )
          }
        ]}
      />
    );
  };

  const renderEngagementAnalytics = () => {
    if (!engagementData || engagementData.length === 0) {
      return (
        <Empty 
          description="No engagement data available yet. Engagement metrics will appear here once visitors interact with your content."
          style={{ padding: '48px 24px' }}
        />
      );
    }

    return (
      <Table
        dataSource={engagementData}
        rowKey="engagement_type"
        pagination={false}
        style={{ background: darkMode ? '#1e293b' : '#FFFFFF', borderRadius: 12 }}
        columns={[
          {
            title: 'Engagement Type',
            dataIndex: 'engagement_type',
            key: 'engagement_type',
            render: (type) => (
              <Tag color="purple" style={{ textTransform: 'capitalize' }}>{type}</Tag>
            )
          },
          {
            title: 'Count',
            dataIndex: 'count',
            key: 'count',
            render: (count) => (
              <Space>
                <BarChartOutlined style={{ color: '#722ed1' }} />
                <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a', fontWeight: 600 }}>{count}</Text>
              </Space>
            )
          },
          {
            title: 'Avg Read Time',
            dataIndex: 'avg_reading_time',
            key: 'avg_reading_time',
            render: (time) => {
              const displayTime = time ? Math.round(time) : 0;
              return (
                <Space>
                  <ClockCircleOutlined style={{ color: '#52c41a' }} />
                  <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>{displayTime}s</Text>
                </Space>
              );
            }
          },
          {
            title: 'Avg Scroll Depth',
            dataIndex: 'avg_scroll_depth',
            key: 'avg_scroll_depth',
            render: (depth) => {
              const displayDepth = depth ? Math.round(depth) : 0;
              return (
                <div style={{ width: 100 }}>
                  <Progress percent={displayDepth} size="small" />
                </div>
              );
            }
          },
          {
            title: 'Completed',
            dataIndex: 'completed_count',
            key: 'completed_count',
            render: (count) => {
              const displayCount = count || 0;
              return (
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>{displayCount}</Text>
                </Space>
              );
            }
          }
        ]}
      />
    );
  };

  const renderDailyViews = () => {
    if (!contentDetail?.daily_views || contentDetail.daily_views.length === 0) {
      return (
        <Empty 
          description="No daily views data available yet. Daily view statistics will appear here once visitors start viewing your content."
          style={{ padding: '48px 24px' }}
        />
      );
    }

    return (
      <Table
        dataSource={contentDetail.daily_views}
        rowKey="date"
        pagination={false}
        style={{ background: darkMode ? '#1e293b' : '#FFFFFF', borderRadius: 12 }}
        columns={[
          {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date) => (
              <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>
                {moment(date).format('MMM D, YYYY')}
              </Text>
            )
          },
          {
            title: 'Daily Views',
            dataIndex: 'daily_views',
            key: 'daily_views',
            render: (views) => (
              <Space>
                <EyeOutlined style={{ color: '#4a7cff' }} />
                <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a', fontWeight: 600 }}>{views}</Text>
              </Space>
            )
          },
          {
            title: 'Total Page Views',
            dataIndex: 'total_page_views',
            key: 'total_page_views',
            render: (views) => (
              <Space>
                <LineChartOutlined style={{ color: '#fa8c16' }} />
                <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>{views}</Text>
              </Space>
            )
          }
        ]}
      />
    );
  };

  const renderRecentVisitors = () => {
    if (!contentDetail?.recent_visitors || contentDetail.recent_visitors.length === 0) {
      return (
        <Empty 
          description="No recent visitor data available yet. Visitor information will appear here once people start viewing your content."
          style={{ padding: '48px 24px' }}
        />
      );
    }

    return (
      <Table
        dataSource={contentDetail.recent_visitors}
        rowKey="session_uuid"
        pagination={{ pageSize: 10 }}
        style={{ background: darkMode ? '#1e293b' : '#FFFFFF', borderRadius: 12 }}
        columns={[
          {
            title: 'Country',
            dataIndex: 'country',
            key: 'country',
            render: (country) => (
              <Space>
                <GlobalOutlined style={{ color: '#4a7cff' }} />
                <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>{country || 'Unknown'}</Text>
              </Space>
            )
          },
          {
            title: 'Device',
            dataIndex: 'device_type',
            key: 'device_type',
            render: (device) => <Tag color="blue">{device || 'Unknown'}</Tag>
          },
          {
            title: 'Browser',
            dataIndex: 'browser',
            key: 'browser',
            render: (browser) => <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>{browser || 'Unknown'}</Text>
          },
          {
            title: 'IP Address',
            dataIndex: 'ip_address',
            key: 'ip_address',
            render: (ip) => <Text style={{ color: darkMode ? '#94a3b8' : '#6B7280', fontFamily: 'monospace' }}>{ip || 'Unknown'}</Text>
          },
          {
            title: 'View Time',
            dataIndex: 'view_time',
            key: 'view_time',
            render: (time) => (
              <Text style={{ color: darkMode ? '#94a3b8' : '#6B7280' }}>
                {moment(time).format('MMM D, YYYY HH:mm')}
              </Text>
            )
          },
          {
            title: 'Page Title',
            dataIndex: 'page_title',
            key: 'page_title',
            render: (title) => <Text style={{ color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>{title || 'Unknown'}</Text>
          }
        ]}
      />
    );
  };

  if (loading && !dashboardData) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3} style={{ marginBottom: 24, color: darkMode ? '#f1f5f9' : '#111827' }}>
        Content Analytics
      </Title>

      {selectedContent ? renderContentDetail() : renderOverview()}
    </div>
  );
};

export default ContentAnalytics;