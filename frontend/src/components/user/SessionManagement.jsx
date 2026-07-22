import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Modal, message, Typography, Tooltip, Space, Empty } from 'antd';
import { 
  DesktopOutlined, 
  MobileOutlined, 
  TabletOutlined, 
  LogoutOutlined, 
  DeleteOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  ShieldCheckOutlined,
  WarningOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Text, Title } = Typography;

const SessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions');

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    } else {
      fetchLoginHistory();
    }
  }, [activeTab]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/auth/sessions');
      setSessions(response.data.sessions);
    } catch (error) {
      console.error('Fetch sessions error:', error);
      message.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/auth/login-history?limit=20');
      setLoginHistory(response.data.history);
    } catch (error) {
      console.error('Fetch login history error:', error);
      message.error('Failed to load login history');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    Modal.confirm({
      title: 'Revoke Session',
      content: 'Are you sure you want to revoke this session? The user will be logged out.',
      okText: 'Revoke',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await axios.delete(`/api/auth/sessions/${sessionId}`);
          message.success('Session revoked successfully');
          fetchSessions();
        } catch (error) {
          console.error('Revoke session error:', error);
          message.error('Failed to revoke session');
        }
      }
    });
  };

  const handleRevokeAllSessions = async () => {
    Modal.confirm({
      title: 'Revoke All Other Sessions',
      content: 'Are you sure you want to revoke all other sessions? You will be logged out from all other devices.',
      okText: 'Revoke All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await axios.delete('/api/auth/sessions');
          message.success('All other sessions revoked successfully');
          fetchSessions();
        } catch (error) {
          console.error('Revoke all sessions error:', error);
          message.error('Failed to revoke sessions');
        }
      }
    });
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile':
        return <MobileOutlined style={{ fontSize: 20 }} />;
      case 'tablet':
        return <TabletOutlined style={{ fontSize: 20 }} />;
      default:
        return <DesktopOutlined style={{ fontSize: 20 }} />;
    }
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

  const getStatusTag = (session) => {
    if (!session.is_active) {
      return <Tag color="default">Inactive</Tag>;
    }
    if (session.is_current) {
      return <Tag color="green" icon={<ShieldCheckOutlined />}>Current</Tag>;
    }
    return <Tag color="blue">Active</Tag>;
  };

  const getLoginStatusTag = (status) => {
    switch (status) {
      case 'success':
        return <Tag color="green">Success</Tag>;
      case 'failed':
        return <Tag color="red">Failed</Tag>;
      case 'blocked':
        return <Tag color="orange">Blocked</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>Session Management</Title>
        <Space>
          <Button
            type={activeTab === 'sessions' ? 'primary' : 'default'}
            onClick={() => setActiveTab('sessions')}
          >
            Active Sessions
          </Button>
          <Button
            type={activeTab === 'history' ? 'primary' : 'default'}
            onClick={() => setActiveTab('history')}
          >
            Login History
          </Button>
        </Space>
      </div>

      {activeTab === 'sessions' && (
        <>
          {sessions.length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <Button
                danger
                icon={<LogoutOutlined />}
                onClick={handleRevokeAllSessions}
              >
                Revoke All Other Sessions
              </Button>
            </div>
          )}

          <Card loading={loading}>
            {sessions.length === 0 ? (
              <Empty description="No active sessions" />
            ) : (
              <List
                dataSource={sessions}
                renderItem={(session) => (
                  <List.Item
                    actions={[
                      !session.is_current && session.is_active && (
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRevokeSession(session.id)}
                        >
                          Revoke
                        </Button>
                      )
                    ]}
                    style={{
                      padding: '16px',
                      background: session.is_current ? '#f0f9ff' : '#fff',
                      borderRadius: 8,
                      marginBottom: 12,
                      border: session.is_current ? '2px solid #4a7cff' : '1px solid #e8e8e8'
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          background: '#f0f5ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#4a7cff'
                        }}>
                          {getDeviceIcon(session.device_type)}
                        </div>
                      }
                      title={
                        <Space>
                          <Text strong>{session.device_name}</Text>
                          {getStatusTag(session)}
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 4 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {session.browser} on {session.os}
                            </Text>
                          </div>
                          <Space size="small">
                            <Tooltip title="IP Address">
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <GlobalOutlined /> {session.ip_address}
                              </Text>
                            </Tooltip>
                            <Tooltip title="Last Activity">
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <ClockCircleOutlined /> {formatTimeAgo(session.last_activity)}
                              </Text>
                            </Tooltip>
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </>
      )}

      {activeTab === 'history' && (
        <Card loading={loading}>
          {loginHistory.length === 0 ? (
            <Empty description="No login history" />
          ) : (
            <List
              dataSource={loginHistory}
              renderItem={(log) => (
                <List.Item
                  style={{
                    padding: '12px 16px',
                    background: '#fff',
                    borderRadius: 8,
                    marginBottom: 8,
                    border: '1px solid #e8e8e8'
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: log.login_status === 'success' ? '#f0f9ff' : '#fff1f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: log.login_status === 'success' ? '#52c41a' : '#ff4d4f'
                      }}>
                        {log.login_status === 'success' ? <ShieldCheckOutlined /> : <WarningOutlined />}
                      </div>
                    }
                    title={
                      <Space>
                        <Text>{log.device_name || 'Unknown Device'}</Text>
                        {getLoginStatusTag(log.login_status)}
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {log.browser} on {log.os}
                          </Text>
                        </div>
                        <Space size="small">
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <GlobalOutlined /> {log.ip_address}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <ClockCircleOutlined /> {formatTimeAgo(log.created_at)}
                          </Text>
                        </Space>
                        {log.failure_reason && (
                          <div style={{ marginTop: 4 }}>
                            <Text type="danger" style={{ fontSize: 12 }}>
                              {log.failure_reason}
                            </Text>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default SessionManagement;
