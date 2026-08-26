import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Switch, Tag, Space, Divider, Alert, List, Avatar, Grid, ConfigProvider } from 'antd';
import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
  PlusOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const Integrations = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg;
  const { darkMode } = useTheme();

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
    <div className="p-4 md:p-6 lg:p-8" style={{ background: darkMode ? '#0F172A' : '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: isMobile ? 16 : 32 }}>
        <Title level={isMobile ? 3 : 2} style={{ fontSize: isMobile ? 24 : 30, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827', marginBottom: 8 }}>
          <ApiOutlined /> Integrations
        </Title>
        <Text style={{ fontSize: isMobile ? 13 : 15, color: darkMode ? '#94a3b8' : '#6B7280' }}>
          Connect third-party services to extend your CMS functionality
        </Text>
      </div>

      <div 
        style={{ 
          marginBottom: isMobile ? 16 : 24,
          padding: isMobile ? '12px 16px' : '16px 24px',
          borderRadius: 8,
          background: darkMode ? '#1e3a5f' : '#e6f7ff',
          border: `1px solid ${darkMode ? '#1e40af' : '#91d5ff'}`,
          color: darkMode ? '#93c5fd' : '#0958d9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <ApiOutlined style={{ fontSize: 20, color: darkMode ? '#93c5fd' : '#0958d9' }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4, color: darkMode ? '#93c5fd' : '#0958d9' }}>Integration Setup</div>
            <div style={{ fontSize: isMobile ? 12 : 14, color: darkMode ? '#93c5fd' : '#0958d9', opacity: 0.9 }}>
              Configure third-party services to enhance your website capabilities. Click on any integration to connect or disconnect it.
            </div>
          </div>
        </div>
      </div>

        {categories.map(category => (
          <div key={category} style={{ marginBottom: isMobile ? 16 : 32 }}>
            <Title level={isMobile ? 5 : 4} style={{ marginBottom: isMobile ? 12 : 16, color: darkMode ? '#f1f5f9' : '#111827', fontSize: isMobile ? 16 : 18 }}>
              {category}
            </Title>
            <Row gutter={[isMobile ? 16 : 24, isMobile ? 16 : 24]}>
              {integrations
                .filter(int => int.category === category)
                .map(integration => (
                  <Col xs={24} sm={12} lg={8} key={integration.id}>
                    <Card
                      hoverable
                      style={{
                        borderRadius: 12,
                        height: '100%',
                        background: darkMode ? '#1e293b' : '#fff',
                        border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
                      }}
                      bodyStyle={{ padding: isMobile ? '16px' : '20px', background: darkMode ? '#1e293b' : '#fff' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: isMobile ? 8 : 12 }}>
                        <div style={{ fontSize: isMobile ? 28 : 32 }}>{integration.icon}</div>
                        <Switch
                          checked={integration.connected}
                          onChange={() => handleToggle(integration.id)}
                          checkedChildren={<CheckCircleOutlined />}
                          unCheckedChildren={<CloseCircleOutlined />}
                          size={isMobile ? 'small' : 'default'}
                        />
                      </div>
                      <Title level={isMobile ? 5 : 4} style={{ marginBottom: isMobile ? 8 : 12, color: darkMode ? '#f1f5f9' : '#111827', fontSize: isMobile ? 16 : 18 }}>
                        {integration.name}
                      </Title>
                      <Paragraph style={{ fontSize: isMobile ? 12 : 13, color: darkMode ? '#94a3b8' : '#6B7280', marginBottom: isMobile ? 12 : 16 }}>
                        {integration.description}
                      </Paragraph>
                      <Button
                        type={integration.connected ? 'default' : 'primary'}
                        icon={integration.connected ? <SettingOutlined /> : <LinkOutlined />}
                        block
                        size={isMobile ? 'small' : 'middle'}
                        style={{ borderRadius: 8 }}
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
            marginTop: isMobile ? 16 : 24,
            background: darkMode ? '#1e293b' : '#F9FAFB',
            border: darkMode ? '1px dashed #334155' : '1px dashed #D1D5DB',
          }}
          bodyStyle={{ padding: isMobile ? '24px' : '32px', textAlign: 'center', background: darkMode ? '#1e293b' : '#F9FAFB' }}
        >
          <PlusOutlined style={{ fontSize: isMobile ? 40 : 48, color: darkMode ? '#64748b' : '#9CA3AF', marginBottom: isMobile ? 12 : 16 }} />
          <Title level={isMobile ? 5 : 4} style={{ color: darkMode ? '#94a3b8' : '#6B7280', marginBottom: isMobile ? 8 : 12, fontSize: isMobile ? 16 : 18 }}>
            Need a custom integration?
          </Title>
          <Text style={{ color: darkMode ? '#64748b' : '#9CA3AF', marginBottom: isMobile ?   12 : 16, display: 'block', fontSize: isMobile ? 12 : 14 }}>
            Contact our team to build a custom integration for your specific needs
          </Text>
          <Button type="primary" icon={<LinkOutlined />} style={{ width: isMobile ? '100%' : 'auto' }}>
            Request Integration
          </Button>
        </Card>
      </div>
    );
};

export default Integrations;
