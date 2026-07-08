import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Space, Typography, message, Popconfirm } from 'antd';
import { DeleteOutlined, MailOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title } = Typography;

const NewsletterManagement = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/newsletter');
      setSubscribers(response.data);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      message.error('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (email) => {
    try {
      await axios.delete(`/api/admin/newsletter/${email}`);
      message.success('Subscriber removed');
      fetchSubscribers();
    } catch (error) {
      console.error('Error removing subscriber:', error);
      message.error('Failed to remove subscriber');
    }
  };

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => <a href={`mailto:${text}`}>{text}</a>
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Subscribed On',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => moment(date).format('MMM D, YYYY HH:mm')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<MailOutlined />} 
            onClick={() => window.location.href = `mailto:${record.email}`}
          >
            Email
          </Button>
          <Popconfirm
            title="Remove Subscriber"
            description="Are you sure you want to remove this subscriber?"
            onConfirm={() => handleDelete(record.email)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>
              Remove
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Title level={3}>Newsletter Subscribers</Title>
          <Button type="primary" icon={<MailOutlined />}>
            Send Newsletter
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={subscribers}
          loading={loading}
          rowKey="email"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} subscribers`
          }}
        />
      </Card>
    </div>
  );
};

export default NewsletterManagement;