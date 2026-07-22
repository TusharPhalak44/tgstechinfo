import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Select, DatePicker, Statistic, Progress } from 'antd';
import {
  LineChartOutlined,
  BarChartOutlined,
  RiseOutlined,
  UserOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState({
    visitors: [],
    pageViews: [],
    topPages: [],
    topBlogs: [],
    topLandingPages: [],
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/analytics/overview?range=${timeRange}`);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Mock data for demo
      setAnalyticsData({
        visitors: generateMockData('visitors'),
        pageViews: generateMockData('pageViews'),
        topPages: generateMockTopPages(),
        topBlogs: generateMockTopBlogs(),
        topLandingPages: generateMockTopLandingPages(),
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (type) => {
    const data = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 1000) + 500,
      });
    }
    return data;
  };

  const generateMockTopPages = () => [
    { title: 'Home', views: 15420, bounce: 32 },
    { title: 'About Us', views: 8920, bounce: 45 },
    { title: 'Services', views: 7650, bounce: 38 },
    { title: 'Contact', views: 5430, bounce: 52 },
    { title: 'Blog', views: 4890, bounce: 28 },
  ];

  const generateMockTopBlogs = () => [
    { title: 'Getting Started with React', views: 3420, reads: 89 },
    { title: 'Advanced CSS Techniques', views: 2890, reads: 76 },
    { title: 'Node.js Best Practices', views: 2450, reads: 82 },
    { title: 'TypeScript Guide', views: 1980, reads: 91 },
    { title: 'Web Performance Tips', views: 1650, reads: 68 },
  ];

  const generateMockTopLandingPages = () => [
    { title: 'Product Launch', views: 8920, conversions: 12 },
    { title: 'Free Trial', views: 6540, conversions: 18 },
    { title: 'Webinar Signup', views: 4320, conversions: 8 },
    { title: 'E-book Download', views: 3210, conversions: 15 },
    { title: 'Newsletter', views: 2890, conversions: 22 },
  ];

  const visitorsConfig = {
    data: analyticsData.visitors.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      visitors: d.value,
    })),
  };

  const pageViewsConfig = {
    data: analyticsData.pageViews.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: d.value,
    })),
  };

  const conversionConfig = {
    data: analyticsData.topLandingPages.map(d => ({
      page: d.title,
      conversions: d.conversions,
    })),
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <Title level={2} style={{ fontSize: 30, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            Analytics
          </Title>
          <Text style={{ fontSize: 15, color: '#6B7280' }}>
            Track your website performance and user engagement
          </Text>
        </div>
        <Select
          value={timeRange}
          onChange={setTimeRange}
          style={{ width: 120 }}
          size="large"
        >
          <Option value="7d">Last 7 days</Option>
          <Option value="30d">Last 30 days</Option>
          <Option value="90d">Last 90 days</Option>
        </Select>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card
            loading={loading}
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={<Text style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Total Visitors</Text>}
              value={45678}
              prefix={<UserOutlined style={{ color: '#0AAEEF' }} />}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: '#111827' }}
              suffix={<Text style={{ fontSize: 12, color: '#10B981' }}>+12%</Text>}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card
            loading={loading}
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={<Text style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Page Views</Text>}
              value={123456}
              prefix={<EyeOutlined style={{ color: '#8B5CF6' }} />}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: '#111827' }}
              suffix={<Text style={{ fontSize: 12, color: '#10B981' }}>+8%</Text>}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card
            loading={loading}
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={<Text style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Avg. Session</Text>}
              value={4.5}
              suffix="min"
              prefix={<ClockCircleOutlined style={{ color: '#F59E0B' }} />}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: '#111827' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card
            loading={loading}
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={<Text style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Bounce Rate</Text>}
              value={32}
              suffix="%"
              prefix={<RiseOutlined style={{ color: '#EC4899' }} />}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: '#111827' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>
                Visitors Over Time
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
            {visitorsConfig.data.map((item, index) => (
              <div key={index} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>{item.date}</Text>
                  <Text strong style={{ fontSize: 13, color: '#111827' }}>{item.visitors.toLocaleString()}</Text>
                </div>
                <Progress 
                  percent={Math.round((item.visitors / Math.max(...visitorsConfig.data.map(d => d.visitors))) * 100)} 
                  strokeColor="#0AAEEF" 
                  showInfo={false}
                />
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>
                Conversions by Page
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
            {conversionConfig.data.map((item, index) => (
              <div key={index} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>{item.page}</Text>
                  <Text strong style={{ fontSize: 13, color: '#111827' }}>{item.conversions}%</Text>
                </div>
                <Progress 
                  percent={item.conversions} 
                  strokeColor={['#10B981', '#0AAEEF', '#8B5CF6', '#F59E0B', '#EC4899'][index % 5]} 
                  showInfo={false}
                />
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24}>
          <Card
            title={
              <span style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>
                Page Views
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
            {pageViewsConfig.data.map((item, index) => (
              <div key={index} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>{item.date}</Text>
                  <Text strong style={{ fontSize: 13, color: '#111827' }}>{item.views.toLocaleString()}</Text>
                </div>
                <Progress 
                  percent={Math.round((item.views / Math.max(...pageViewsConfig.data.map(d => d.views))) * 100)} 
                  strokeColor="#8B5CF6" 
                  showInfo={false}
                />
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* Top Content */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>
                Top Pages
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
            {analyticsData.topPages.map((page, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: index < analyticsData.topPages.length - 1 ? '1px solid #E5E7EB' : 'none',
                }}
              >
                <div>
                  <Text strong style={{ fontSize: 14, color: '#111827', display: 'block' }}>
                    {page.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    {page.views.toLocaleString()} views
                  </Text>
                </div>
                <Text style={{ fontSize: 13, color: page.bounce < 40 ? '#10B981' : '#F59E0B' }}>
                  {page.bounce}% bounce
                </Text>
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>
                Top Blogs
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
            {analyticsData.topBlogs.map((blog, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: index < analyticsData.topBlogs.length - 1 ? '1px solid #E5E7EB' : 'none',
                }}
              >
                <div>
                  <Text strong style={{ fontSize: 14, color: '#111827', display: 'block' }}>
                    {blog.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    {blog.views.toLocaleString()} views
                  </Text>
                </div>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: blog.reads > 80 ? '#10B98115' : '#F59E0B15',
                  color: blog.reads > 80 ? '#10B981' : '#F59E0B',
                  fontSize: 12,
                  fontWeight: 500,
                }}>
                  {blog.reads}% read
                </div>
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>
                Top Landing Pages
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
            {analyticsData.topLandingPages.map((page, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: index < analyticsData.topLandingPages.length - 1 ? '1px solid #E5E7EB' : 'none',
                }}
              >
                <div>
                  <Text strong style={{ fontSize: 14, color: '#111827', display: 'block' }}>
                    {page.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    {page.views.toLocaleString()} views
                  </Text>
                </div>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: '#0AAEEF15',
                  color: '#0AAEEF',
                  fontSize: 12,
                  fontWeight: 500,
                }}>
                  {page.conversions}% conv
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;
