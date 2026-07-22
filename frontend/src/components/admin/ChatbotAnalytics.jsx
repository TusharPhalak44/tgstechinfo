import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, Select, Spin, Empty } from 'antd';
import { Search, Eye, Clock, TrendingUp, MessageSquare, ThumbsUp } from 'lucide-react';
import api from '../../services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ChatbotAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('dashboard');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, selectedMetric]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      let response;
      switch (selectedMetric) {
        case 'dashboard':
          response = await api.get('/api/admin/chatbot/analytics/dashboard', { params });
          setAnalytics(response.data.analytics);
          break;
        case 'topSearches':
          response = await api.get('/api/admin/chatbot/analytics/top-searches', { params });
          setAnalytics({ topSearches: response.data.topSearches });
          break;
        case 'topCategories':
          response = await api.get('/api/admin/chatbot/analytics/top-categories', { params });
          setAnalytics({ topCategories: response.data.topCategories });
          break;
        case 'mostClicked':
          response = await api.get('/api/admin/chatbot/analytics/most-clicked', { params });
          setAnalytics({ mostClicked: response.data.mostClicked });
          break;
        case 'noResultSearches':
          response = await api.get('/api/admin/chatbot/analytics/no-result-searches', { params });
          setAnalytics({ noResultSearches: response.data.noResultSearches });
          break;
        case 'sessions':
          response = await api.get('/api/admin/chatbot/analytics/sessions', { params });
          setAnalytics({ sessionStats: response.data.sessionStats });
          break;
        case 'daily':
          response = await api.get('/api/admin/chatbot/analytics/daily', { params });
          setAnalytics({ dailyAnalytics: response.data.dailyAnalytics });
          break;
        case 'monthly':
          response = await api.get('/api/admin/chatbot/analytics/monthly', { params });
          setAnalytics({ monthlyAnalytics: response.data.monthlyAnalytics });
          break;
        default:
          response = await api.get('/api/admin/chatbot/analytics/dashboard', { params });
          setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const topSearchesColumns = [
    { title: 'Query', dataIndex: 'query', key: 'query' },
    { title: 'Search Count', dataIndex: 'search_count', key: 'search_count', sorter: true },
    { title: 'Unique Sessions', dataIndex: 'unique_sessions', key: 'unique_sessions', sorter: true },
    { title: 'Avg Results', dataIndex: 'avg_results', key: 'avg_results', render: (v) => v?.toFixed(1) || 0 }
  ];

  const topCategoriesColumns = [
    { title: 'Category', dataIndex: 'category_name', key: 'category_name' },
    { title: 'Search Count', dataIndex: 'search_count', key: 'search_count', sorter: true }
  ];

  const mostClickedColumns = [
    { title: 'Title', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: 'Click Count', dataIndex: 'click_count', key: 'click_count', sorter: true },
    { title: 'Unique Clickers', dataIndex: 'unique_clickers', key: 'unique_clickers', sorter: true },
    { title: 'Category', dataIndex: 'category_name', key: 'category_name' }
  ];

  const noResultColumns = [
    { title: 'Query', dataIndex: 'query', key: 'query' },
    { title: 'No Result Count', dataIndex: 'no_result_count', key: 'no_result_count', sorter: true },
    { title: 'Unique Sessions', dataIndex: 'unique_sessions', key: 'unique_sessions', sorter: true }
  ];

  const dailyColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Total Searches', dataIndex: 'total_searches', key: 'total_searches', sorter: true },
    { title: 'Unique Sessions', dataIndex: 'unique_sessions', key: 'unique_sessions', sorter: true },
    { title: 'No Results', dataIndex: 'no_result_count', key: 'no_result_count', sorter: true }
  ];

  const monthlyColumns = [
    { title: 'Month', dataIndex: 'month', key: 'month' },
    { title: 'Total Searches', dataIndex: 'total_searches', key: 'total_searches', sorter: true },
    { title: 'Unique Sessions', dataIndex: 'unique_sessions', key: 'unique_sessions', sorter: true },
    { title: 'No Results', dataIndex: 'no_result_count', key: 'no_result_count', sorter: true }
  ];

  if (loading && !analytics) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Chatbot Analytics</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <RangePicker 
            onChange={setDateRange}
            style={{ borderRadius: 8 }}
          />
          <Select 
            value={selectedMetric}
            onChange={setSelectedMetric}
            style={{ width: 180, borderRadius: 8 }}
          >
            <Option value="dashboard">Dashboard</Option>
            <Option value="topSearches">Top Searches</Option>
            <Option value="topCategories">Top Categories</Option>
            <Option value="mostClicked">Most Clicked</Option>
            <Option value="noResultSearches">No Result Searches</Option>
            <Option value="sessions">Session Analytics</Option>
            <Option value="daily">Daily Analytics</Option>
            <Option value="monthly">Monthly Analytics</Option>
          </Select>
        </div>
      </div>

      {selectedMetric === 'dashboard' && analytics?.summary && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Sessions"
                  value={analytics.summary.sessionStats?.total_sessions || 0}
                  prefix={<MessageSquare size={20} />}
                  valueStyle={{ color: '#0AAEEF' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Unique Users"
                  value={analytics.summary.sessionStats?.unique_users || 0}
                  prefix={<Eye size={20} />}
                  valueStyle={{ color: '#5BBD2B' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Avg Session Time"
                  value={analytics.summary.avgSessionTime?.avg_session_minutes || 0}
                  suffix="min"
                  prefix={<Clock size={20} />}
                  valueStyle={{ color: '#F7941D' }}
                  precision={1}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="CTR"
                  value={analytics.summary.ctr?.ctr_percentage || 0}
                  suffix="%"
                  prefix={<TrendingUp size={20} />}
                  valueStyle={{ color: '#c92a2a' }}
                  precision={2}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Top Searches" extra={<Search size={16} />}>
                <Table
                  dataSource={analytics.summary.topSearches || []}
                  columns={topSearchesColumns}
                  rowKey="query"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Most Clicked Content" extra={<Eye size={16} />}>
                <Table
                  dataSource={analytics.summary.mostClicked || []}
                  columns={mostClickedColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </>
      )}

      {selectedMetric === 'topSearches' && (
        <Card title="Top Searches">
          <Table
            dataSource={analytics?.topSearches || []}
            columns={topSearchesColumns}
            rowKey="query"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      {selectedMetric === 'topCategories' && (
        <Card title="Top Categories">
          <Table
            dataSource={analytics?.topCategories || []}
            columns={topCategoriesColumns}
            rowKey="category_slug"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      {selectedMetric === 'mostClicked' && (
        <Card title="Most Clicked Content">
          <Table
            dataSource={analytics?.mostClicked || []}
            columns={mostClickedColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      {selectedMetric === 'noResultSearches' && (
        <Card title="No Result Searches">
          <Table
            dataSource={analytics?.noResultSearches || []}
            columns={noResultColumns}
            rowKey="query"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      {selectedMetric === 'sessions' && analytics?.sessionStats && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="Total Sessions"
                value={analytics.sessionStats.total_sessions}
                prefix={<MessageSquare size={20} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="Authenticated Sessions"
                value={analytics.sessionStats.authenticated_sessions}
                prefix={<ThumbsUp size={20} />}
                valueStyle={{ color: '#5BBD2B' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="Guest Sessions"
                value={analytics.sessionStats.guest_sessions}
                prefix={<MessageSquare size={20} />}
                valueStyle={{ color: '#0AAEEF' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="Avg Messages per Session"
                value={analytics.sessionStats.avg_messages || 0}
                precision={1}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="Unique Visitors"
                value={analytics.sessionStats.unique_visitors}
                prefix={<Eye size={20} />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {selectedMetric === 'daily' && (
        <Card title="Daily Analytics">
          <Table
            dataSource={analytics?.dailyAnalytics || []}
            columns={dailyColumns}
            rowKey="date"
            pagination={{ pageSize: 30 }}
          />
        </Card>
      )}

      {selectedMetric === 'monthly' && (
        <Card title="Monthly Analytics">
          <Table
            dataSource={analytics?.monthlyAnalytics || []}
            columns={monthlyColumns}
            rowKey="month"
            pagination={{ pageSize: 12 }}
          />
        </Card>
      )}

      {!analytics && !loading && (
        <Empty description="No analytics data available" />
      )}
    </div>
  );
};

export default ChatbotAnalytics;
