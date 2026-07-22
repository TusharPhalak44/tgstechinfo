import React, { useState } from 'react';
import { Card, Row, Col, Typography, Form, Input, Button, Space, Tag, Alert, Table, Progress } from 'antd';
import {
  LineChartOutlined,
  SaveOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const SEO = () => {
  const [form] = Form.useForm();
  const [seoScore, setSeoScore] = useState(75);

  const seoIssues = [
    { type: 'warning', message: 'Meta description is too short (recommended: 150-160 characters)' },
    { type: 'success', message: 'Title tag has optimal length (50-60 characters)' },
    { type: 'warning', message: 'Missing alt text on 3 images' },
    { type: 'success', message: 'H1 tag is present and unique' },
    { type: 'warning', message: 'Internal links could be improved' },
  ];

  const pages = [
    { id: 1, page: 'Home', title: 'TgsTechInfo - Technology Solutions', status: 'Good', score: 85 },
    { id: 2, page: 'About Us', title: 'About TgsTechInfo - Our Story', status: 'Good', score: 78 },
    { id: 3, page: 'Services', title: 'Our Services - TgsTechInfo', status: 'Warning', score: 65 },
    { id: 4, page: 'Contact', title: 'Contact Us - TgsTechInfo', status: 'Good', score: 82 },
    { id: 5, page: 'Blog', title: 'Blog - Technology Insights', status: 'Warning', score: 58 },
  ];

  const columns = [
    {
      title: 'Page',
      dataIndex: 'page',
      key: 'page',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Title Tag',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Good' ? 'green' : 'orange'} icon={status === 'Good' ? <CheckCircleOutlined /> : <WarningOutlined />}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'SEO Score',
      dataIndex: 'score',
      key: 'score',
      render: (score) => (
        <div style={{ width: 100 }}>
          <Progress percent={score} size="small" strokeColor={score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'} />
        </div>
      ),
    },
  ];

  const handleSave = () => {
    form.validateFields().then((values) => {
      console.log('SEO settings saved:', values);
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ fontSize: 30, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
          <LineChartOutlined /> SEO Settings
        </Title>
        <Text style={{ fontSize: 15, color: '#6B7280' }}>
          Manage search engine optimization settings for your website
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Title level={4} style={{ marginBottom: 16, color: '#111827' }}>
              Overall SEO Score
            </Title>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 64, fontWeight: 600, color: seoScore >= 70 ? '#10B981' : seoScore >= 50 ? '#F59E0B' : '#EF4444' }}>
                {seoScore}
              </div>
              <Text type="secondary">out of 100</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Title level={4} style={{ marginBottom: 16, color: '#111827' }}>
              SEO Issues
            </Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {seoIssues.map((issue, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  {issue.type === 'success' ? (
                    <CheckCircleOutlined style={{ color: '#10B981', marginTop: 4 }} />
                  ) : (
                    <WarningOutlined style={{ color: '#F59E0B', marginTop: 4 }} />
                  )}
                  <Text style={{ fontSize: 13 }}>{issue.message}</Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Title level={4} style={{ marginBottom: 16, color: '#111827' }}>
              Quick Actions
            </Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" icon={<SaveOutlined />} block>
                Generate Sitemap
              </Button>
              <Button icon={<CopyOutlined />} block>
                Copy Meta Tags
              </Button>
              <Button block>
                Analyze Keywords
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title="Global SEO Settings"
        style={{
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: 24,
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="siteTitle"
                label="Site Title"
                initialValue="TgsTechInfo - Technology Solutions"
                rules={[{ required: true, message: 'Please enter site title' }]}
              >
                <Input placeholder="Enter site title" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="siteSeparator"
                label="Title Separator"
                initialValue=" - "
              >
                <Input placeholder="Title separator" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="metaDescription"
            label="Meta Description"
            initialValue="TgsTechInfo provides cutting-edge technology solutions for businesses. Discover our innovative services and products."
            rules={[{ required: true, message: 'Please enter meta description' }]}
          >
            <TextArea rows={3} placeholder="Enter meta description (150-160 characters)" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="metaKeywords"
                label="Meta Keywords"
                initialValue="technology, solutions, software, development"
              >
                <Input placeholder="Enter meta keywords (comma-separated)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ogImage"
                label="Open Graph Image"
              >
                <Input placeholder="Enter OG image URL" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                Save Settings
              </Button>
              <Button>Preview</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="Page SEO Analysis"
        style={{
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Table
          columns={columns}
          dataSource={pages}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default SEO;
