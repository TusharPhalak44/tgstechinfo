import React, { useState } from 'react';
import { 
  Card, Tabs, Button, Alert, Typography, 
  Space, Divider, Row, Col, Switch, 
  List, Tag, Modal, message, Badge
} from 'antd';
import { 
  SafetyOutlined, 
  LockOutlined, 
  ShieldCheckOutlined,
  KeyOutlined,
  MobileOutlined,
  MailOutlined,
  BellOutlined,
  EyeOutlined,
  SettingOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const SecuritySettings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    loginNotifications: true,
    passwordExpiry: false,
    sessionTimeout: true,
    ipWhitelist: false,
    twoFactorAuth: false
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    message.success(`${key} ${value ? 'enabled' : 'disabled'}`);
  };

  const handleRevokeAllSessions = () => {
    Modal.confirm({
      title: 'Revoke All Sessions',
      content: 'Are you sure you want to revoke all sessions? You will be logged out from all devices.',
      okText: 'Revoke All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Placeholder - will be implemented
          message.success('All sessions revoked successfully');
        } catch (error) {
          message.error('Failed to revoke sessions');
        }
      }
    });
  };

  const securityRecommendations = [
    {
      icon: <ShieldCheckOutlined />,
      title: 'Enable Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      action: 'Enable',
      priority: 'high'
    },
    {
      icon: <KeyOutlined />,
      title: 'Update Your Password',
      description: 'Change your password regularly for better security',
      action: 'Update',
      priority: 'medium'
    },
    {
      icon: <MobileOutlined />,
      title: 'Review Active Sessions',
      description: 'Check and revoke any unfamiliar sessions',
      action: 'Review',
      priority: 'medium'
    },
    {
      icon: <BellOutlined />,
      title: 'Enable Login Notifications',
      description: 'Get notified when someone logs into your account',
      action: 'Enable',
      priority: 'low'
    }
  ];

  const securityLogs = [
    {
      action: 'Password changed',
      date: '2 hours ago',
      status: 'success',
      ip: '192.168.1.1',
      device: 'Chrome on Windows'
    },
    {
      action: 'Login from new device',
      date: '1 day ago',
      status: 'success',
      ip: '192.168.1.2',
      device: 'Safari on iPhone'
    },
    {
      action: 'Failed login attempt',
      date: '2 days ago',
      status: 'warning',
      ip: '192.168.1.3',
      device: 'Firefox on Mac'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <SettingOutlined /> Security Settings
      </Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, color: '#52c41a', marginBottom: 8 }}>
                <ShieldCheckOutlined />
              </div>
              <Title level={4} style={{ margin: 0 }}>Security Score</Title>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#52c41a' }}>85%</Text>
              <Paragraph type="secondary">Good</Paragraph>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, color: '#1890ff', marginBottom: 8 }}>
                <MobileOutlined />
              </div>
              <Title level={4} style={{ margin: 0 }}>Active Sessions</Title>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff' }}>2</Text>
              <Paragraph type="secondary">Devices logged in</Paragraph>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, color: '#faad14', marginBottom: 8 }}>
                <WarningOutlined />
              </div>
              <Title level={4} style={{ margin: 0 }}>Security Alerts</Title>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#faad14' }}>1</Text>
              <Paragraph type="secondary">Needs attention</Paragraph>
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="overview">
          <TabPane tab={<span><SafetyOutlined /> Overview</span>} key="overview">
            <Alert
              message="Security Status"
              description="Your account security is good. Consider enabling two-factor authentication for enhanced protection."
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Title level={4}>Security Recommendations</Title>
            <List
              dataSource={securityRecommendations}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button 
                      type="primary" 
                      size="small"
                      onClick={() => message.info(`${item.action} clicked`)}
                    >
                      {item.action}
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={item.icon}
                    title={
                      <Space>
                        {item.title}
                        {item.priority === 'high' && <Tag color="red">High Priority</Tag>}
                        {item.priority === 'medium' && <Tag color="orange">Medium</Tag>}
                        {item.priority === 'low' && <Tag color="blue">Low</Tag>}
                      </Space>
                    }
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </TabPane>

          <TabPane tab={<span><LockOutlined /> Authentication</span>} key="authentication">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4}>Two-Factor Authentication</Title>
                <Paragraph type="secondary">
                  Add an extra layer of security to your account by requiring a verification code in addition to your password.
                </Paragraph>
                <Space>
                  <Switch 
                    checked={settings.twoFactorAuth}
                    onChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                  />
                  <Text>{settings.twoFactorAuth ? 'Enabled' : 'Disabled'}</Text>
                </Space>
                {!settings.twoFactorAuth && (
                  <Button type="primary" style={{ marginLeft: 16 }}>
                    Set Up 2FA
                  </Button>
                )}
              </div>

              <Divider />

              <div>
                <Title level={4}>Password Settings</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>Password Expiry</Text>
                      <Paragraph type="secondary" style={{ margin: 0 }}>
                        Require password change every 90 days
                      </Paragraph>
                    </div>
                    <Switch 
                      checked={settings.passwordExpiry}
                      onChange={(checked) => handleSettingChange('passwordExpiry', checked)}
                    />
                  </div>
                  <Button icon={<KeyOutlined />}>
                    Change Password
                  </Button>
                </Space>
              </div>

              <Divider />

              <div>
                <Title level={4}>Session Management</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>Session Timeout</Text>
                      <Paragraph type="secondary" style={{ margin: 0 }}>
                        Auto-logout after 30 minutes of inactivity
                      </Paragraph>
                    </div>
                    <Switch 
                      checked={settings.sessionTimeout}
                      onChange={(checked) => handleSettingChange('sessionTimeout', checked)}
                    />
                  </div>
                  <Button danger onClick={handleRevokeAllSessions}>
                    Revoke All Sessions
                  </Button>
                </Space>
              </div>
            </Space>
          </TabPane>

          <TabPane tab={<span><BellOutlined /> Notifications</span>} key="notifications">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4}>Login Notifications</Title>
                <Paragraph type="secondary">
                  Get notified when someone logs into your account from a new device or location.
                </Paragraph>
                <Space>
                  <Switch 
                    checked={settings.loginNotifications}
                    onChange={(checked) => handleSettingChange('loginNotifications', checked)}
                  />
                  <Text>{settings.loginNotifications ? 'Enabled' : 'Disabled'}</Text>
                </Space>
              </div>

              <Divider />

              <div>
                <Title level={4}>Security Alerts</Title>
                <Paragraph type="secondary">
                  Receive alerts for suspicious activity, failed login attempts, and security events.
                </Paragraph>
                <Space>
                  <Switch defaultChecked />
                  <Text>Enabled</Text>
                </Space>
              </div>

              <Divider />

              <div>
                <Title level={4}>Email Preferences</Title>
                <List
                  dataSource={[
                    'Password change notifications',
                    'New device login alerts',
                    'Security breach warnings',
                    'Account activity summary'
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text>{item}</Text>
                        <Switch defaultChecked />
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            </Space>
          </TabPane>

          <TabPane tab={<span><EyeOutlined /> Activity Log</span>} key="activity">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>Recent Security Activity</Title>
                <Button size="small">View Full Log</Button>
              </div>
              
              <List
                dataSource={securityLogs}
                renderItem={(log) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        log.status === 'success' ? 
                          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} /> :
                          <WarningOutlined style={{ color: '#faad14', fontSize: 20 }} />
                      }
                      title={log.action}
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">{log.date}</Text>
                          <Text type="secondary">{log.ip} • {log.device}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Space>
          </TabPane>

          <TabPane tab={<span><MobileOutlined /> Devices</span>} key="devices">
            <Alert
              message="Active Devices"
              description="Manage devices that have access to your account. Revoke access from any device you don't recognize."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <List
              dataSource={[
                {
                  device: 'Chrome on Windows',
                  location: 'San Francisco, US',
                  lastActive: 'Current session',
                  current: true
                },
                {
                  device: 'Safari on iPhone',
                  location: 'New York, US',
                  lastActive: '2 hours ago',
                  current: false
                }
              ]}
              renderItem={(device) => (
                <List.Item
                  actions={[
                    !device.current && (
                      <Button danger size="small">
                        Revoke
                      </Button>
                    )
                  ]}
                >
                  <List.Item.Meta
                    avatar={<MobileOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={
                      <Space>
                        {device.device}
                        {device.current && <Tag color="green">Current</Tag>}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">{device.location}</Text>
                        <Text type="secondary">{device.lastActive}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SecuritySettings;
