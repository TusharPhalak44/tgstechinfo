import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Tag, Button, Progress, Statistic } from 'antd';
import {
  FileTextOutlined,
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  UploadOutlined,
  LayoutOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  CloudOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const DashboardHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPublished: 0,
    totalViews: 0,
    totalDrafts: 0,
    totalScheduled: 0,
    totalUsers: 0,
    monthlyViews: 0,
    avgReadTime: 0,
    engagementRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [contentByStatus, setContentByStatus] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, activityRes, statusRes] = await Promise.allSettled([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/recent-activity'),
        axios.get('/api/admin/content-by-status'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (activityRes.status === 'fulfilled') setRecentActivity(activityRes.value.data || []);
      if (statusRes.status === 'fulfilled') setContentByStatus(statusRes.value.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickStats = [
    {
      title: 'Website Status',
      value: 'Online',
      icon: <CheckCircleOutlined style={{ color: '#10B981', fontSize: 20 }} />,
      color: '#10B981',
    },
    {
      title: 'Traffic Today',
      value: stats.monthlyViews || 0,
      icon: <EyeOutlined style={{ color: '#0AAEEF', fontSize: 20 }} />,
      color: '#0AAEEF',
    },
    {
      title: 'Published Today',
      value: stats.totalPublished || 0,
      icon: <FileTextOutlined style={{ color: '#8B5CF6', fontSize: 20 }} />,
      color: '#8B5CF6',
    },
    {
      title: 'Pending Reviews',
      value: contentByStatus.find(s => s.status === 'pending')?.count || 0,
      icon: <ClockCircleOutlined style={{ color: '#F59E0B', fontSize: 20 }} />,
      color: '#F59E0B',
    },
    {
      title: 'Scheduled Posts',
      value: stats.totalScheduled || 0,
      icon: <CalendarOutlined style={{ color: '#EC4899', fontSize: 20 }} />,
      color: '#EC4899',
    },
    {
      title: 'Storage Used',
      value: '2.4 GB',
      icon: <CloudOutlined style={{ color: '#6366F1', fontSize: 20 }} />,
      color: '#6366F1',
    },
    {
      title: 'API Requests',
      value: '12.5K',
      icon: <ApiOutlined style={{ color: '#14B8A6', fontSize: 20 }} />,
      color: '#14B8A6',
    },
    {
      title: 'Active Users',
      value: stats.totalUsers || 0,
      icon: <TeamOutlined style={{ color: '#F97316', fontSize: 20 }} />,
      color: '#F97316',
    },
  ];

  const quickActions = [
    {
      title: 'Create Page',
      icon: <FileTextOutlined />,
      color: '#0AAEEF',
      route: '/dashboard/create-post',
    },
    {
      title: 'Create Blog',
      icon: <EditOutlined />,
      color: '#8B5CF6',
      route: '/dashboard/blogs',
    },
    {
      title: 'Upload Media',
      icon: <UploadOutlined />,
      color: '#10B981',
      route: '/dashboard/media-library',
    },
    {
      title: 'New Landing Page',
      icon: <LayoutOutlined />,
      color: '#EC4899',
      route: '/dashboard/landing-pages',
    },
    {
      title: 'Invite User',
      icon: <TeamOutlined />,
      color: '#F59E0B',
      route: '/dashboard/users',
    },
  ];

  const statusColors = {
    published: '#10B981',
    draft: '#6B7280',
    scheduled: '#F59E0B',
    pending: '#0AAEEF',
    rejected: '#EF4444',
  };

  return (
    <div>
      {/* Greeting Section */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ fontSize: 30, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
          {getGreeting()}, {stats.userName || 'Admin'}
        </Title>
        <Text style={{ fontSize: 15, color: '#6B7280' }}>
          Here's what's happening with your content today
        </Text>
      </div>

      {/* Quick Stats Grid */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {quickStats.map((stat, index) => (
          <Col xs={12} sm={12} md={12} lg={6} xl={6} key={index}>
            <Card
              loading={loading}
              style={{
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
              }}
              bodyStyle={{ padding: '20px' }}
              hoverable
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${stat.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {stat.icon}
                </div>
                <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
                  {stat.title}
                </Text>
              </div>
              <Text style={{ fontSize: 24, fontWeight: 600, color: '#111827' }}>
                {stat.value}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quick Actions */}
      <div style={{ marginBottom: 32 }}>
        <Title level={4} style={{ fontSize: 22, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
          Quick Actions
        </Title>
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={12} sm={8} md={6} lg={4} xl={4} key={index}>
              <Card
                hoverable
                onClick={() => navigate(action.route)}
                style={{
                  borderRadius: 12,
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
                bodyStyle={{ padding: '24px 16px' }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${action.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: action.color,
                  fontSize: 24,
                }}>
                  {action.icon}
                </div>
                <Text style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>
                  {action.title}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Content Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>
                Content by Status
              </span>
            }
            loading={loading}
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            {contentByStatus.map((item) => (
              <div key={item.status} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <Text strong style={{ fontSize: 14, color: '#111827', textTransform: 'capitalize' }}>
                    {item.status}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>{item.count}</Text>
                </div>
                <Progress
                  percent={stats.totalPublished ? Math.round((item.count / stats.totalPublished) * 100) : 0}
                  strokeColor={statusColors[item.status] || '#6B7280'}
                  showInfo={false}
                  style={{ marginBottom: 4 }}
                />
              </div>
            ))}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>
                Performance
              </span>
            }
            loading={loading}
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title={<Text style={{ fontSize: 13, color: '#6B7280' }}>Total Views</Text>}
                  value={stats.totalViews || 0}
                  valueStyle={{ fontSize: 24, fontWeight: 600, color: '#111827' }}
                  prefix={<EyeOutlined style={{ color: '#0AAEEF' }} />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<Text style={{ fontSize: 13, color: '#6B7280' }}>Users</Text>}
                  value={stats.totalUsers || 0}
                  valueStyle={{ fontSize: 24, fontWeight: 600, color: '#111827' }}
                  prefix={<TeamOutlined style={{ color: '#F97316' }} />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<Text style={{ fontSize: 13, color: '#6B7280' }}>Avg. Read Time</Text>}
                  value={stats.avgReadTime || 0}
                  suffix="min"
                  valueStyle={{ fontSize: 24, fontWeight: 600, color: '#111827' }}
                  prefix={<ClockCircleOutlined style={{ color: '#8B5CF6' }} />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<Text style={{ fontSize: 13, color: '#6B7280' }}>Engagement</Text>}
                  value={stats.engagementRate || 0}
                  suffix="%"
                  valueStyle={{ fontSize: 24, fontWeight: 600, color: '#111827' }}
                  prefix={<ThunderboltOutlined style={{ color: '#10B981' }} />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Card
        title={
          <span style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>
            Recent Activity
          </span>
        }
        loading={loading}
        style={{
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        {recentActivity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text style={{ color: '#6B7280' }}>No recent activity</Text>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px',
                  borderRadius: 8,
                  background: '#F8FAFC',
                  border: '1px solid #E5E7EB',
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${statusColors[activity.status] || '#6B7280'}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: statusColors[activity.status] || '#6B7280',
                }}>
                  <FileTextOutlined />
                </div>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 14, color: '#111827', display: 'block' }}>
                    {activity.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>
                    {activity.content_type} • {moment(activity.updated_at).fromNow()}
                  </Text>
                </div>
                <Tag
                  color={statusColors[activity.status]}
                  style={{
                    borderRadius: 6,
                    border: 'none',
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {activity.status}
                </Tag>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DashboardHome;
