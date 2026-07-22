import React, { useState, useEffect } from 'react';
import { 
  Card, List, Tag, Space, Typography, Timeline, 
  Alert, Button, Spin, Empty, Pagination
} from 'antd';
import { 
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  LockOutlined,
  MobileOutlined,
  DesktopOutlined,
  TabletOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Text, Title } = Typography;

const LoginHistory = () => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchLoginHistory(currentPage);
  }, [currentPage]);

  const fetchLoginHistory = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/auth/login-history', {
        params: { limit: pageSize, offset: (page - 1) * pageSize }
      });
      setHistory(response.data.history || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Fetch login history error:', error);
    } finally {
      setLoading(false);
    }
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      case 'blocked':
        return <LockOutlined style={{ color: '#faad14' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const getStatusTag = (status) => {
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

  const formatTimeAgo = (dateString) => {
    return moment(dateString).fromNow();
  };

  const formatDateTime = (dateString) => {
    return moment(dateString).format('MMM D, YYYY HH:mm:ss');
  };

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin />
        </div>
      ) : history.length === 0 ? (
        <Empty description="No login history found" />
      ) : (
        <>
          <List
            dataSource={history}
            renderItem={(log) => (
              <List.Item
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <List.Item.Meta
                  avatar={getStatusIcon(log.login_status)}
                  title={
                    <Space>
                      <Text strong>{log.login_status.charAt(0).toUpperCase() + log.login_status.slice(1)}</Text>
                      {getStatusTag(log.login_status)}
                    </Space>
                  }
                  description={
                    <div>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space size="middle">
                          <Space size="small">
                            {getDeviceIcon(log.device_type)}
                            <Text type="secondary">{log.device_name}</Text>
                          </Space>
                          <Text type="secondary">•</Text>
                          <Text type="secondary">{log.browser}</Text>
                          <Text type="secondary">•</Text>
                          <Text type="secondary">{log.os}</Text>
                        </Space>
                        <Space size="middle">
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            IP: {log.ip_address}
                          </Text>
                          <Text type="secondary">•</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {formatDateTime(log.created_at)}
                          </Text>
                          <Text type="secondary">•</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {formatTimeAgo(log.created_at)}
                          </Text>
                        </Space>
                        {log.failure_reason && (
                          <Text type="danger" style={{ fontSize: 12 }}>
                            Reason: {log.failure_reason}
                          </Text>
                        )}
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
          {total > pageSize && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Pagination
                current={currentPage}
                total={total}
                pageSize={pageSize}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                showTotal={(total) => `Total ${total} records`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LoginHistory;
