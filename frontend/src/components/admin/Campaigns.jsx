import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Tag, Space, Statistic, Progress, Modal, Form, Input, Select, DatePicker } from 'antd';
import {
  RocketOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  BarChartOutlined,
  UserOutlined,
  EyeOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([
    {
      id: 1,
      name: 'Summer Launch 2024',
      status: 'active',
      type: 'Email',
      target: 'Newsletter Subscribers',
      sent: 2450,
      opened: 1890,
      clicked: 890,
      converted: 120,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    },
    {
      id: 2,
      name: 'Product Announcement',
      status: 'scheduled',
      type: 'Email',
      target: 'All Users',
      sent: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      startDate: '2024-02-01',
      endDate: '2024-02-15',
    },
    {
      id: 3,
      name: 'Holiday Special',
      status: 'completed',
      type: 'Social Media',
      target: 'Social Followers',
      sent: 5200,
      opened: 4100,
      clicked: 2100,
      converted: 340,
      startDate: '2023-12-01',
      endDate: '2023-12-25',
    },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'scheduled': return 'blue';
      case 'completed': return 'default';
      case 'paused': return 'orange';
      default: return 'default';
    }
  };

  const handleCreateCampaign = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = (values) => {
    const newCampaign = {
      id: campaigns.length + 1,
      ...values,
      status: 'scheduled',
      sent: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
    };
    setCampaigns([...campaigns, newCampaign]);
    setIsModalVisible(false);
    form.resetFields();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <Title level={2} style={{ fontSize: 30, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            <RocketOutlined /> Campaigns
          </Title>
          <Text style={{ fontSize: 15, color: '#6B7280' }}>
            Manage your marketing campaigns and track performance
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateCampaign}>
          Create Campaign
        </Button>
      </div>

      {/* Campaign Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={<Text style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Active Campaigns</Text>}
              value={campaigns.filter(c => c.status === 'active').length}
              prefix={<RocketOutlined style={{ color: '#0AAEEF' }} />}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: '#111827' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={<Text style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Total Sent</Text>}
              value={campaigns.reduce((acc, c) => acc + c.sent, 0)}
              prefix={<UserOutlined style={{ color: '#8B5CF6' }} />}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: '#111827' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={<Text style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Total Opens</Text>}
              value={campaigns.reduce((acc, c) => acc + c.opened, 0)}
              prefix={<EyeOutlined style={{ color: '#10B981' }} />}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: '#111827' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={<Text style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Conversions</Text>}
              value={campaigns.reduce((acc, c) => acc + c.converted, 0)}
              prefix={<BarChartOutlined style={{ color: '#F59E0B' }} />}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: '#111827' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Campaign List */}
      <Row gutter={[16, 16]}>
        {campaigns.map(campaign => (
          <Col xs={24} lg={8} key={campaign.id}>
            <Card
              style={{
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <Title level={5} style={{ marginBottom: 4, color: '#111827' }}>
                    {campaign.name}
                  </Title>
                  <Tag color={getStatusColor(campaign.status)}>{campaign.status.toUpperCase()}</Tag>
                </div>
                <Space>
                  <Button type="text" icon={<EditOutlined />} size="small" />
                  <Button type="text" icon={<DeleteOutlined />} size="small" danger />
                </Space>
              </div>

              <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Type:</Text>
                  <Text strong>{campaign.type}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Target:</Text>
                  <Text strong>{campaign.target}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Duration:</Text>
                  <Text strong>{campaign.startDate} - {campaign.endDate}</Text>
                </div>
              </Space>

              <Divider style={{ margin: '12px 0' }} />

              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Sent</Text>
                    <Text strong style={{ fontSize: 12 }}>{campaign.sent.toLocaleString()}</Text>
                  </div>
                  <Progress percent={campaign.sent > 0 ? 100 : 0} showInfo={false} size="small" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Opened</Text>
                    <Text strong style={{ fontSize: 12 }}>{campaign.opened.toLocaleString()}</Text>
                  </div>
                  <Progress percent={campaign.sent > 0 ? Math.round((campaign.opened / campaign.sent) * 100) : 0} showInfo={false} size="small" strokeColor="#10B981" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Clicked</Text>
                    <Text strong style={{ fontSize: 12 }}>{campaign.clicked.toLocaleString()}</Text>
                  </div>
                  <Progress percent={campaign.opened > 0 ? Math.round((campaign.clicked / campaign.opened) * 100) : 0} showInfo={false} size="small" strokeColor="#0AAEEF" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Converted</Text>
                    <Text strong style={{ fontSize: 12 }}>{campaign.converted.toLocaleString()}</Text>
                  </div>
                  <Progress percent={campaign.clicked > 0 ? Math.round((campaign.converted / campaign.clicked) * 100) : 0} showInfo={false} size="small" strokeColor="#F59E0B" />
                </div>
              </Space>

              <Button
                type="primary"
                block
                icon={campaign.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                style={{ marginTop: 16, borderRadius: 8 }}
              >
                {campaign.status === 'active' ? 'Pause Campaign' : 'Start Campaign'}
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title="Create New Campaign"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Campaign Name"
            rules={[{ required: true, message: 'Please enter campaign name' }]}
          >
            <Input placeholder="Enter campaign name" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Campaign Type"
            rules={[{ required: true, message: 'Please select campaign type' }]}
          >
            <Select placeholder="Select campaign type">
              <Option value="Email">Email</Option>
              <Option value="Social Media">Social Media</Option>
              <Option value="SMS">SMS</Option>
              <Option value="Push Notification">Push Notification</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="target"
            label="Target Audience"
            rules={[{ required: true, message: 'Please select target audience' }]}
          >
            <Select placeholder="Select target audience">
              <Option value="All Users">All Users</Option>
              <Option value="Newsletter Subscribers">Newsletter Subscribers</Option>
              <Option value="Social Followers">Social Followers</Option>
              <Option value="Premium Users">Premium Users</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Campaign Duration"
            rules={[{ required: true, message: 'Please select date range' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Campaign
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Campaigns;
