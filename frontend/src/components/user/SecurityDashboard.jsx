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
    <div style={{ padding: window.innerWidth < 768 ? 0 : 'clamp(16px, 2vw, 24px)' }}>
      <Title level={3} style={{ marginBottom: 'clamp(20px, 2.5vw, 24px)', fontSize: 'clamp(18px, 2.2vw, 24px)' }}>
        <SafetyOutlined /> Security Dashboard
      </Title>

      {/* Security Score */}
      <Card style={{ marginBottom: 'clamp(20px, 2.5vw, 24px)' }} className="security-score-card">
        <Row gutter={16} align="middle">
          <Col xs={24} sm={24} md={8} lg={8}>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(16px, 2vw, 0)' }}>
              <Progress
                type="circle"
                percent={securityScore}
                strokeColor={getScoreColor(securityScore)}
                size={window.innerWidth < 768 ? 100 : 120}
                format={(percent) => (
                  <div>
                    <div style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 'bold', color: getScoreColor(securityScore) }}>
                      {percent}
                    </div>
                    <div style={{ fontSize: 'clamp(11px, 0.85vw, 12px)', color: '#666' }}>
                      {getScoreStatus(securityScore)}
                    </div>
                  </div>
                )}
              />
            </div>
          </Col>
          <Col xs={24} sm={24} md={16} lg={16}>
            <Title level={4} style={{ fontSize: 'clamp(16px, 1.3vw, 18px)' }}>Security Status</Title>
            <List
              dataSource={securityChecks}
              renderItem={(check) => (
                <List.Item style={{ padding: 'clamp(8px, 1vw, 12px) 0' }}>
                  <Space size={window.innerWidth < 768 ? 'small' : 'middle'}>
                    {check.status === 'success' && <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 'clamp(14px, 1.2vw, 16px)' }} />}
                    {check.status === 'warning' && <WarningOutlined style={{ color: '#faad14', fontSize: 'clamp(14px, 1.2vw, 16px)' }} />}
                    {check.status === 'danger' && <WarningOutlined style={{ color: '#ff4d4f', fontSize: 'clamp(14px, 1.2vw, 16px)' }} />}
                    {check.status === 'info' && <ClockCircleOutlined style={{ color: '#1890ff', fontSize: 'clamp(14px, 1.2vw, 16px)' }} />}
                    <Text style={{ fontSize: 'clamp(12px, 0.9vw, 14px)' }}>{check.message}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 'clamp(20px, 2.5vw, 24px)' }}>
        {/* Active Sessions */}
        <Col xs={24} sm={24} md={12} lg={12}>
          <Card 
            title={
              <Space size={window.innerWidth < 768 ? 'small' : 'middle'}>
                <DesktopOutlined style={{ fontSize: 'clamp(14px, 1.2vw, 16px)' }} />
                <span style={{ fontSize: 'clamp(14px, 1.2vw, 16px)' }}>Active Sessions</span>
              </Space>
            }
            extra={<Badge count={sessions.filter(s => s.is_active).length} />}
            className="session-card"
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
        <Col xs={24} sm={24} md={12} lg={12}>
          <Card 
            title={
              <Space size={window.innerWidth < 768 ? 'small' : 'middle'}>
                <ClockCircleOutlined style={{ fontSize: 'clamp(14px, 1.2vw, 16px)' }} />
                <span style={{ fontSize: 'clamp(14px, 1.2vw, 16px)' }}>Recent Activity</span>
              </Space>
            }
            className="activity-card"
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
          <Space size={window.innerWidth < 768 ? 'small' : 'middle'}>
            <SafetyOutlined style={{ fontSize: 'clamp(14px, 1.2vw, 16px)' }} />
            <span style={{ fontSize: 'clamp(14px, 1.2vw, 16px)' }}>Security Recommendations</span>
          </Space>
        }
        className="recommendations-card"
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
                <Button type="link" size={window.innerWidth < 768 ? 'small' : 'middle'} style={{ fontSize: 'clamp(12px, 0.85vw, 14px)' }}>
                  {item.action}
                </Button>
              ]}
              style={{ padding: 'clamp(12px, 1.5vw, 16px) 0' }}
            >
              <List.Item.Meta
                avatar={item.icon}
                title={<span style={{ fontSize: 'clamp(13px, 1vw, 14px)' }}>{item.title}</span>}
                description={<span style={{ fontSize: 'clamp(12px, 0.85vw, 13px)' }}>{item.description}</span>}
              />
            </List.Item>
          )}
        />
      </Card>
      <style>{`
        @media (max-width: 768px) {
          .security-score-card {
            margin-bottom: 16px !important;
          }
          .security-score-card .ant-card-body {
            padding: 16px !important;
          }
          .session-card, .activity-card, .recommendations-card {
            margin-bottom: 16px !important;
          }
          .session-card .ant-card-body,
          .activity-card .ant-card-body,
          .recommendations-card .ant-card-body {
            padding: 16px !important;
          }
          .ant-list-item {
            padding: 12px 0 !important;
          }
          .ant-timeline-item-content {
            font-size: 12px !important;
          }
        }

        @media (max-width: 480px) {
          .security-score-card .ant-card-body {
            padding: 12px !important;
          }
          .session-card .ant-card-body,
          .activity-card .ant-card-body,
          .recommendations-card .ant-card-body {
            padding: 12px !important;
          }
          .ant-list-item {
            padding: 10px 0 !important;
          }
          .ant-timeline-item-content {
            font-size: 11px !important;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .security-score-card .ant-card-body {
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SecurityDashboard;
