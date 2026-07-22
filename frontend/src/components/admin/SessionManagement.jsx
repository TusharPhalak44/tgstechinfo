import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, message, Tag, Popconfirm, Tooltip } from 'antd';
import { 
  LaptopOutlined, 
  MobileOutlined, 
  DesktopOutlined, 
  TabletOutlined,
  DeleteOutlined, 
  LogoutOutlined,
  SafetyOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;

const SessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/auth/sessions');
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      message.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await axios.delete(`/api/auth/sessions/${sessionId}`);
      message.success('Session revoked successfully');
      fetchSessions();
    } catch (error) {
      console.error('Error revoking session:', error);
      message.error('Failed to revoke session');
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      await axios.post('/api/auth/sessions/revoke-others');
      message.success('All other sessions revoked successfully');
      fetchSessions();
    } catch (error) {
      console.error('Error revoking sessions:', error);
      message.error('Failed to revoke sessions');
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <MobileOutlined style={{ fontSize: 20 }} />;
      case 'tablet':
        return <TabletOutlined style={{ fontSize: 20 }} />;
      case 'desktop':
      default:
        return <DesktopOutlined style={{ fontSize: 20 }} />;
    }
  };

  const isCurrentSession = (session) => {
    // This would need to be determined by the backend
    // For now, we'll assume the most recent session is current
    return session.is_current || false;
  };

  const columns = [
    {
      title: 'Device',
      key: 'device',
      render: (_, record) => (
        <Space>
          {getDeviceIcon(record.device_type)}
          <div>
            <Text strong>{record.device_name || 'Unknown Device'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.browser} on {record.os}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Location',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip) => <Text code>{ip}</Text>
    },
    {
      title: 'Last Activity',
      dataIndex: 'last_activity',
      key: 'last_activity',
      render: (date) => moment(date).fromNow()
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space>
          {isCurrentSession(record) ? (
            <Tag color="blue" icon={<SafetyOutlined />}>Current Session</Tag>
          ) : (
            <Tag color={record.is_active ? 'green' : 'red'}>
              {record.is_active ? 'Active' : 'Inactive'}
            </Tag>
          )}
          {moment(record.expires_at).isBefore(moment()) && (
            <Tag color="orange">Expired</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {!isCurrentSession(record) && (
            <Popconfirm
              title="Revoke Session"
              description="Are you sure you want to revoke this session?"
              onConfirm={() => handleRevokeSession(record.id)}
              okText="Revoke"
              cancelText="Cancel"
              okType="danger"
            >
              <Button 
                type="text" 
                danger 
                icon={<LogoutOutlined />}
                disabled={!record.is_active}
              >
                Revoke
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3}>Active Sessions</Title>
          <Popconfirm
            title="Revoke All Other Sessions"
            description="This will sign you out from all other devices except your current one. Continue?"
            onConfirm={handleRevokeAllOtherSessions}
            okText="Revoke All"
            cancelText="Cancel"
            okType="danger"
          >
            <Button danger icon={<LogoutOutlined />}>
              Revoke All Other Sessions
            </Button>
          </Popconfirm>
        </div>

        <Table
          columns={columns}
          dataSource={sessions}
          loading={loading}
          rowKey="id"
          pagination={false}
        />

        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            <SafetyOutlined /> Sessions are automatically revoked after 7 days of inactivity.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default SessionManagement;
