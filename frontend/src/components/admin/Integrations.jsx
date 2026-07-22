import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Switch, Tag, Space, Divider, Alert, List, Avatar } from 'antd';
import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
  PlusOutlined,
  LinkOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const Integrations = () => {
  const [integrations, setIntegrations] = useState([
    {
      id: 1,
      name: 'Google Analytics',
      description: 'Track website traffic and user behavior',
      icon: '📊',
      connected: false,
      category: 'Analytics',
    },
    {
      id: 2,
      name: 'Mailchimp',
      description: 'Email marketing and newsletter management',
      icon: '📧',
      connected: false,
      category: 'Marketing',
    },
    {
      id: 3,
      name: 'Stripe',
      description: 'Payment processing and subscriptions',
      icon: '💳',
      connected: false,
      category: 'Payments',
    },
    {
      id: 4,
      name: 'Slack',
      description: 'Team communication and notifications',
      icon: '💬',
      connected: false,
      category: 'Communication',
    },
    {
      id: 5,
      name: 'Google Search Console',
      description: 'SEO monitoring and search performance',
      icon: '🔍',
      connected: false,
      category: 'SEO',
    },
    {
      id: 6,
      name: 'Zapier',
      description: 'Automation and workflow integration',
      icon: '⚡',
      connected: false,
      category: 'Automation',
    },
  ]);

  const handleToggle = (id) => {
    setIntegrations(integrations.map(int => 
      int.id === id ? { ...int, connected: !int.connected } : int
    ));
  };

  const categories = [...new Set(integrations.map(int => int.category))];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ fontSize: 30, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
          <ApiOutlined /> Integrations
        </Title>
        <Text style={{ fontSize: 15, color: '#6B7280' }}>
          Connect third-party services to extend your CMS functionality
        </Text>
      </div>

      <Alert
        message="Integration Setup"
        description="Configure third-party services to enhance your website capabilities. Click on any integration to connect or disconnect it."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {categories.map(category => (
        <div key={category} style={{ marginBottom: 32 }}>
          <Title level={4} style={{ marginBottom: 16, color: '#111827' }}>
            {category}
          </Title>
          <Row gutter={[16, 16]}>
            {integrations
              .filter(int => int.category === category)
              .map(integration => (
                <Col xs={24} sm={12} lg={8} key={integration.id}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: 12,
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                    bodyStyle={{ padding: '20px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ fontSize: 32 }}>{integration.icon}</div>
                      <Switch
                        checked={integration.connected}
                        onChange={() => handleToggle(integration.id)}
                        checkedChildren={<CheckCircleOutlined />}
                        unCheckedChildren={<CloseCircleOutlined />}
                      />
                    </div>
                    <Title level={5} style={{ marginBottom: 8, color: '#111827' }}>
                      {integration.name}
                    </Title>
                    <Paragraph style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                      {integration.description}
                    </Paragraph>
                    <Button
                      type={integration.connected ? 'default' : 'primary'}
                      icon={integration.connected ? <SettingOutlined /> : <LinkOutlined />}
                      block
                      style={{
                        borderRadius: 8,
                        background: integration.connected ? 'transparent' : '#0AAEEF',
                        borderColor: integration.connected ? '#D1D5DB' : '#0AAEEF',
                      }}
                    >
                      {integration.connected ? 'Configure' : 'Connect'}
                    </Button>
                  </Card>
                </Col>
              ))}
          </Row>
        </div>
      ))}

      <Card
        style={{
          borderRadius: 12,
          border: '1px dashed #D1D5DB',
          background: '#F9FAFB',
          marginTop: 24,
        }}
        bodyStyle={{ padding: '32px', textAlign: 'center' }}
      >
        <PlusOutlined style={{ fontSize: 48, color: '#9CA3AF', marginBottom: 16 }} />
        <Title level={4} style={{ color: '#6B7280', marginBottom: 8 }}>
          Need a custom integration?
        </Title>
        <Text style={{ color: '#9CA3AF', marginBottom: 16, display: 'block' }}>
          Contact our team to build a custom integration for your specific needs
        </Text>
        <Button type="primary" icon={<LinkOutlined />}>
          Request Integration
        </Button>
      </Card>
    </div>
  );
};

export default Integrations;
