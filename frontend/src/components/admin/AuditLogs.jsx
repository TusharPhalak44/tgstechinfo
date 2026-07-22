import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Select, DatePicker, Tag, Space, Input, Button } from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AuditLogs = () => {
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
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: 'IP Address',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip) => <Text code>{ip}</Text>,
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <Title level={2} style={{ fontSize: 30, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            <HistoryOutlined /> Audit Logs
          </Title>
          <Text style={{ fontSize: 15, color: '#6B7280' }}>
            Track all system activities and user actions
          </Text>
        </div>
        <Button icon={<DownloadOutlined />}>Export Logs</Button>
      </div>

      <Card
        style={{
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="Search logs..."
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
            />
            <Select placeholder="Filter by action" style={{ width: 150 }} allowClear>
              <Option value="login">Login</Option>
              <Option value="create">Create</Option>
              <Option value="update">Update</Option>
              <Option value="delete">Delete</Option>
            </Select>
            <Select placeholder="Filter by status" style={{ width: 120 }} allowClear>
              <Option value="success">Success</Option>
              <Option value="failed">Failed</Option>
            </Select>
            <RangePicker style={{ width: 250 }} />
          </Space>
          <Button icon={<FilterOutlined />}>Apply Filters</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={logs}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} logs`,
          }}
        />
      </Card>
    </div>
  );
};

export default AuditLogs;
