import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Statistic, Progress, Alert, 
  Typography, Tag, Space, List, Timeline, Button,
  Divider, Tooltip, Badge
} from 'antd';
import { 
  SafetyOutlined,
  LockOutlined, 
  EyeOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  MobileOutlined,
  DesktopOutlined,
  TabletOutlined,
  KeyOutlined,
  UserOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

const SecurityDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [securityScore, setSecurityScore] = useState(0);
  const [securityChecks, setSecurityChecks] = useState([]);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, historyRes] = await Promise.all([
        axios.get('/api/auth/sessions'),
        axios.get('/api/auth/login-history?limit=10')
      ]);
      
      setSessions(sessionsRes.data.sessions);
      setLoginHistory(historyRes.data.history);
      
      // Calculate security score
      calculateSecurityScore(sessionsRes.data.sessions, historyRes.data.history);
    } catch (error) {
      console.error('Fetch security data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSecurityScore = (sessions, history) => {
    let score = 100;
    const checks = [];

    // Check for active sessions
    const activeSessions = sessions.filter(s => s.is_active).length;
    if (activeSessions > 3) {
      score -= 10;
      checks.push({ status: 'warning', message: 'Multiple active sessions detected' });
    } else {
      checks.push({ status: 'success', message: 'Session count is healthy' });
    }

    // Check for recent failed logins
    const recentFailed = history.filter(h => 
      h.login_status === 'failed' && 
      new Date(h.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    if (recentFailed > 5) {
      score -= 15;
      checks.push({ status: 'danger', message: 'High number of failed login attempts' });
    } else if (recentFailed > 0) {
      score -= 5;
      checks.push({ status: 'warning', message: 'Some failed login attempts detected' });
    } else {
      checks.push({ status: 'success', message: 'No recent failed logins' });
    }

    // Check session age
    const oldSessions = sessions.filter(s => 
      new Date(s.last_activity) < new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;
    if (oldSessions > 0) {
      score -= 10;
      checks.push({ status: 'warning', message: 'Some sessions are inactive for over 24 hours' });
    } else {
      checks.push({ status: 'success', message: 'All sessions are recent' });
    }

    // Check for MFA (placeholder - will be implemented in MFA phase)
    checks.push({ status: 'info', message: 'MFA not enabled (coming soon)' });

    setSecurityScore(Math.max(0, score));
    setSecurityChecks(checks);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getScoreStatus = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile':
        return <MobileOutlined style={{ fontSize: 16 }} />;
      case 'tablet':
        return <TabletOutlined style={{ fontSize: 16 }} />;
      default:
        return <DesktopOutlined style={{ fontSize: 16 }} />;
    }
  };

  const getLoginStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      case 'blocked':
        return <LockOutlined style={{ color: '#faad14' }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <SafetyOutlined /> Security Dashboard
      </Title>

      {/* Security Score */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={securityScore}
                strokeColor={getScoreColor(securityScore)}
                size={120}
                format={(percent) => (
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: getScoreColor(securityScore) }}>
                      {percent}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {getScoreStatus(securityScore)}
                    </div>
                  </div>
                )}
              />
            </div>
          </Col>
          <Col span={16}>
            <Title level={4}>Security Status</Title>
            <List
              dataSource={securityChecks}
              renderItem={(check) => (
                <List.Item>
                  <Space>
                    {check.status === 'success' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    {check.status === 'warning' && <WarningOutlined style={{ color: '#faad14' }} />}
                    {check.status === 'danger' && <WarningOutlined style={{ color: '#ff4d4f' }} />}
                    {check.status === 'info' && <ClockCircleOutlined style={{ color: '#1890ff' }} />}
                    <Text>{check.message}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {/* Active Sessions */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <DesktopOutlined />
                Active Sessions
              </Space>
            }
            extra={<Badge count={sessions.filter(s => s.is_active).length} />}
          >
            {sessions.length === 0 ? (
              <Text type="secondary">No active sessions</Text>
            ) : (
              <List
                dataSource={sessions.slice(0, 5)}
                renderItem={(session) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={getDeviceIcon(session.device_type)}
                      title={
                        <Space>
                          <Text>{session.device_name}</Text>
                          {session.is_current && <Tag color="green">Current</Tag>}
                        </Space>
                      }
                      description={
                        <Space size="small">
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {session.browser}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            • {formatTimeAgo(session.last_activity)}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )
              }
              />
            )}
          </Card>
        </Col>

        {/* Recent Login Activity */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <ClockCircleOutlined />
                Recent Activity
              </Space>
            }
          >
            {loginHistory.length === 0 ? (
              <Text type="secondary">No recent activity</Text>
            ) : (
              <Timeline
                items={loginHistory.slice(0, 5).map((log) => ({
                  dot: getLoginStatusIcon(log.login_status),
                  children: (
                    <div>
                      <div>
                        <Text strong>{log.login_status}</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          {formatTimeAgo(log.created_at)}
                        </Text>
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {log.device_name} • {log.ip_address}
                      </div>
                      {log.failure_reason && (
                        <div style={{ fontSize: 12, color: '#ff4d4f' }}>
                          {log.failure_reason}
                        </div>
                      )}
                    </div>
                  )
                }))}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Security Recommendations */}
      <Card 
        title={
          <Space>
            <SafetyOutlined />
            Security Recommendations
          </Space>
        }
      >
        <List
          dataSource={[
            {
              icon: <KeyOutlined />,
              title: 'Enable Multi-Factor Authentication',
              description: 'Add an extra layer of security to your account',
              action: 'Coming Soon'
            },
            {
              icon: <MobileOutlined />,
              title: 'Review Active Sessions',
              description: 'Revoke any sessions you don\'t recognize',
              action: 'Manage Sessions'
            },
            {
              icon: <LockOutlined />,
              title: 'Use Strong Password',
              description: 'Ensure your password meets security requirements',
              action: 'Change Password'
            }
          ]}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button type="link" size="small">
                  {item.action}
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={item.icon}
                title={item.title}
                description={item.description}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default SecurityDashboard;
