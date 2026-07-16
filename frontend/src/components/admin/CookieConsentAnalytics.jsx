import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Select, Spin, Typography } from 'antd';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const COLORS = ['#0AAEEF', '#5BBD2B', '#F7941D', '#c92a2a'];

const CookieConsentAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [browserStats, setBrowserStats] = useState([]);
  const [percentages, setPercentages] = useState(null);
  const [daysRange, setDaysRange] = useState(30);
  const [monthsRange, setMonthsRange] = useState(12);

  useEffect(() => {
    fetchAnalyticsData();
  }, [daysRange, monthsRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [dailyRes, monthlyRes, browserRes, percentagesRes] = await Promise.all([
        api.get(`/api/cookie-consent/admin/stats/daily?days=${daysRange}`),
        api.get(`/api/cookie-consent/admin/stats/monthly?months=${monthsRange}`),
        api.get('/api/cookie-consent/admin/stats/browser'),
        api.get('/api/cookie-consent/admin/stats/percentages')
      ]);

      setDailyStats(dailyRes.data.data || []);
      setMonthlyStats(monthlyRes.data.data || []);
      setBrowserStats(browserRes.data.data || []);
      setPercentages(percentagesRes.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = percentages ? [
    { name: 'Accept All', value: parseFloat(percentages.accept_all) },
    { name: 'Reject All', value: parseFloat(percentages.reject_all) },
    { name: 'Custom', value: parseFloat(percentages.custom) }
  ] : [];

  const dailyColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Total',
      dataIndex: 'total_consent',
      key: 'total_consent'
    },
    {
      title: 'Accept All',
      dataIndex: 'accept_all',
      key: 'accept_all'
    },
    {
      title: 'Reject All',
      dataIndex: 'reject_all',
      key: 'reject_all'
    },
    {
      title: 'Custom',
      dataIndex: 'custom',
      key: 'custom'
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: 24 }}>Cookie Consent Analytics</Title>

      {/* Overview Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Consents"
              value={percentages?.total || 0}
              valueStyle={{ color: '#0AAEEF' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Accept All %"
              value={percentages?.accept_all || 0}
              suffix="%"
              valueStyle={{ color: '#5BBD2B' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Reject All %"
              value={percentages?.reject_all || 0}
              suffix="%"
              valueStyle={{ color: '#c92a2a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Custom %"
              value={percentages?.custom || 0}
              suffix="%"
              valueStyle={{ color: '#F7941D' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {/* Consent Distribution Pie Chart */}
        <Col span={12}>
          <Card title="Consent Distribution" style={{ height: 400 }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Text type="secondary">No data available</Text>
            )}
          </Card>
        </Col>

        {/* Browser Distribution Bar Chart */}
        <Col span={12}>
          <Card title="Browser Distribution" style={{ height: 400 }}>
            {browserStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={browserStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="browser" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#0AAEEF" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text type="secondary">No data available</Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Daily Trends */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card
            title="Daily Consent Trends"
            extra={
              <Select
                value={daysRange}
                onChange={setDaysRange}
                style={{ width: 120 }}
              >
                <Option value={7}>7 Days</Option>
                <Option value={30}>30 Days</Option>
                <Option value={90}>90 Days</Option>
              </Select>
            }
          >
            {dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total_consent" stroke="#0AAEEF" name="Total" />
                  <Line type="monotone" dataKey="accept_all" stroke="#5BBD2B" name="Accept All" />
                  <Line type="monotone" dataKey="reject_all" stroke="#c92a2a" name="Reject All" />
                  <Line type="monotone" dataKey="custom" stroke="#F7941D" name="Custom" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Text type="secondary">No data available</Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Daily Stats Table */}
      <Row gutter={16}>
        <Col span={24}>
          <Card title="Daily Statistics">
            <Table
              columns={dailyColumns}
              dataSource={dailyStats}
              rowKey="date"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CookieConsentAnalytics;
