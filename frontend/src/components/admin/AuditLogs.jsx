import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Select, DatePicker, Tag, Space, Input, Button, Grid, ConfigProvider } from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { useBreakpoint } = Grid;

const AuditLogs = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg;
  const { darkMode } = useTheme();

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([
    {
      id: 1,
      action: 'User Login',
      user: 'admin@example.com',
      ip: '192.168.1.1',
      timestamp: '2024-01-15 10:30:00',
      status: 'success',
      details: 'Successful login',
    },
    {
      id: 2,
      action: 'Content Created',
      user: 'admin@example.com',
      ip: '192.168.1.1',
      timestamp: '2024-01-15 11:45:00',
      status: 'success',
      details: 'Created blog post "Getting Started"',
    },
    {
      id: 3,
      action: 'Content Updated',
      user: 'editor@example.com',
      ip: '192.168.1.2',
      timestamp: '2024-01-15 14:20:00',
      status: 'success',
      details: 'Updated page "About Us"',
    },
    {
      id: 4,
      action: 'Failed Login Attempt',
      user: 'unknown@example.com',
      ip: '192.168.1.3',
      timestamp: '2024-01-15 15:30:00',
      status: 'failed',
      details: 'Invalid credentials',
    },
    {
      id: 5,
      action: 'User Deleted',
      user: 'admin@example.com',
      ip: '192.168.1.1',
      timestamp: '2024-01-15 16:45:00',
      status: 'success',
      details: 'Deleted user "test@example.com"',
    },
  ]);

  const columns = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: isMobile ? 100 : 150,
      render: (text) => <Text strong style={{ fontSize: isMobile ? 12 : 14, color: darkMode ? '#cbd5e1' : '#111827' }}>{text}</Text>,
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      width: isMobile ? 120 : 180,
      ellipsis: true,
      render: (text) => <Text style={{ fontSize: isMobile ? 11 : 14, color: darkMode ? '#cbd5e1' : '#111827' }}>{text}</Text>,
    },
    {
      title: 'IP Address',
      dataIndex: 'ip',
      key: 'ip',
      width: isMobile ? 100 : 130,
      responsive: ['md'],
      render: (ip) => <Text code style={{ fontSize: isMobile ? 11 : 14, color: darkMode ? '#cbd5e1' : '#111827' }}>{ip}</Text>,
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: isMobile ? 120 : 150,
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      render: (text) => <Text style={{ fontSize: isMobile ? 11 : 14, color: darkMode ? '#cbd5e1' : '#111827' }}>{text}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 70 : 90,
      render: (status) => (
        <Tag color={status === 'success' ? 'green' : 'red'} style={{ fontSize: isMobile ? 11 : 14 }}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      width: isMobile ? 100 : 150,
      ellipsis: true,
      render: (text) => <Text style={{ fontSize: isMobile ? 11 : 14, color: darkMode ? '#cbd5e1' : '#111827' }}>{text}</Text>,
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: darkMode ? '#1e293b' : '#fff',
          colorText: darkMode ? '#cbd5e1' : '#374151',
          colorBorder: darkMode ? '#334155' : '#e5e7eb',
          colorBgElevated: darkMode ? '#1e293b' : '#fff',
          colorTextPlaceholder: darkMode ? '#64748b' : '#bfbfbf',
        },
      }}
    >
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="w-full sm:w-auto">
            <Title level={isMobile ? 3 : 2} style={{ fontSize: isMobile ? 24 : 30, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827', marginBottom: 8 }}>
              <HistoryOutlined /> Audit Logs
            </Title>
            <Text style={{ fontSize: isMobile ? 13 : 15, color: darkMode ? '#94a3b8' : '#6B7280' }}>
              Track all system activities and user actions
            </Text>
          </div>
          <Button icon={<DownloadOutlined />} style={{ width: isMobile ? '100%' : 'auto' }}>Export Logs</Button>
        </div>

        <Card
          style={{
            borderRadius: 12,
            border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
            boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
          }}
          bodyStyle={{ padding: isMobile ? '16px' : '24px' }}
        >
          <Space style={{ marginBottom: isMobile ? 12 : 16, width: '100%' }} direction={isMobile ? 'vertical' : 'horizontal'} size={isMobile ? 8 : 16}>
            <Space style={{ width: isMobile ? '100%' : 'auto', flexWrap: 'wrap' }} size={isMobile ? 8 : 16}>
              <Input
                placeholder="Search logs..."
                prefix={<SearchOutlined />}
                style={{ width: isMobile ? '100%' : 250, background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#111827', borderColor: darkMode ? '#334155' : '#e5e7eb' }}
              />
              <Select placeholder="Filter by action" style={{ width: isMobile ? '100%' : 150, background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#111827', borderColor: darkMode ? '#334155' : '#e5e7eb' }} allowClear>
                <Option value="login">Login</Option>
                <Option value="create">Create</Option>
                <Option value="update">Update</Option>
                <Option value="delete">Delete</Option>
              </Select>
              <Select placeholder="Filter by status" style={{ width: isMobile ? '100%' : 120, background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#111827', borderColor: darkMode ? '#334155' : '#e5e7eb' }} allowClear>
                <Option value="success">Success</Option>
                <Option value="failed">Failed</Option>
              </Select>
              <RangePicker style={{ width: isMobile ? '100%' : 250 }} />
            </Space>
            <Button icon={<FilterOutlined />} style={{ width: isMobile ? '100%' : 'auto' }}>Apply Filters</Button>
          </Space>

          <Table
            columns={columns}
            dataSource={logs}
            loading={loading}
            rowKey="id"
            scroll={{ x: isMobile ? 800 : 1000 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: !isMobile,
              showQuickJumper: !isMobile,
              showTotal: !isMobile ? (total) => `Total ${total} logs` : false,
              simple: isMobile,
              size: isMobile ? 'small' : 'default',
            }}
            size={isMobile ? 'small' : 'middle'}
            style={{ fontSize: isMobile ? 12 : 14 }}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default AuditLogs;
