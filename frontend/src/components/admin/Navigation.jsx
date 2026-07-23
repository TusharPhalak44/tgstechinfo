import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Table, Tag, Space, Modal, Form, Input, Select, Popconfirm, message, Grid } from 'antd';
import {
  GlobalOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const Navigation = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg;

  const [navigations, setNavigations] = useState([
    {
      id: 1,
      name: 'Main Navigation',
      type: 'Header',
      location: 'Top',
      itemCount: 5,
      status: 'active',
    },
    {
      id: 2,
      name: 'Footer Navigation',
      type: 'Footer',
      location: 'Bottom',
      itemCount: 8,
      status: 'active',
    },
    {
      id: 3,
      name: 'Sidebar Navigation',
      type: 'Sidebar',
      location: 'Left',
      itemCount: 4,
      status: 'active',
    },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNav, setEditingNav] = useState(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingNav(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (nav) => {
    setEditingNav(nav);
    form.setFieldsValue(nav);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    setNavigations(navigations.filter(nav => nav.id !== id));
    message.success('Navigation deleted successfully');
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingNav) {
        setNavigations(navigations.map(nav => 
          nav.id === editingNav.id ? { ...nav, ...values } : nav
        ));
        message.success('Navigation updated successfully');
      } else {
        setNavigations([...navigations, { ...values, id: navigations.length + 1, itemCount: 0 }]);
        message.success('Navigation created successfully. Add menu items to configure.');
      }
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: isMobile ? 120 : 150,
      render: (text) => <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>{text}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: isMobile ? 80 : 100,
      render: (type) => <Tag color="blue" style={{ fontSize: isMobile ? 11 : 14 }}>{type}</Tag>,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: isMobile ? 80 : 100,
      responsive: ['md'],
    },
    {
      title: 'Items',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: isMobile ? 70 : 80,
      render: (count) => <Text style={{ fontSize: isMobile ? 12 : 14 }}>{count} items</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 80 : 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'} style={{ fontSize: isMobile ? 11 : 14 }}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: isMobile ? 80 : 100,
      render: (_, record) => (
        <Space size={isMobile ? 4 : 8}>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            style={{ padding: isMobile ? '0 4px' : '0 8px' }}
          />
          <Popconfirm
            title="Are you sure you want to delete this navigation?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              danger 
              style={{ padding: isMobile ? '0 4px' : '0 8px' }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <Title level={isMobile ? 3 : 2} style={{ fontSize: isMobile ? 24 : 30, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            <GlobalOutlined /> Navigation
          </Title>
          <Text style={{ fontSize: isMobile ? 13 : 15, color: '#6B7280' }}>
            Manage website navigation structures and menus
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Create Navigation
        </Button>
      </div>

      {/* Stats Cards - Fixed gap issue with proper styling */}
      <Row 
        gutter={[16, 16]} 
        style={{ marginBottom: 24 }}
      >
        <Col xs={12} sm={12} md={6}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              textAlign: 'center',
              height: '100%',
              margin: isMobile ? '0 4px' : '0',
            }}
            bodyStyle={{ padding: isMobile ? '16px 8px' : '20px' }}
          >
            <Title level={isMobile ? 4 : 3} style={{ color: '#0AAEEF', marginBottom: 4, fontSize: isMobile ? 20 : 24 }}>
              {navigations.length}
            </Title>
            <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>Total Navigations</Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              textAlign: 'center',
              height: '100%',
              margin: isMobile ? '0 4px' : '0',
            }}
            bodyStyle={{ padding: isMobile ? '16px 8px' : '20px' }}
          >
            <Title level={isMobile ? 4 : 3} style={{ color: '#10B981', marginBottom: 4, fontSize: isMobile ? 20 : 24 }}>
              {navigations.filter(n => n.status === 'active').length}
            </Title>
            <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>Active</Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              textAlign: 'center',
              height: '100%',
              margin: isMobile ? '0 4px' : '0',
            }}
            bodyStyle={{ padding: isMobile ? '16px 8px' : '20px' }}
          >
            <Title level={isMobile ? 4 : 3} style={{ color: '#8B5CF6', marginBottom: 4, fontSize: isMobile ? 20 : 24 }}>
              {navigations.reduce((acc, n) => acc + n.itemCount, 0)}
            </Title>
            <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>Total Menu Items</Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              textAlign: 'center',
              height: '100%',
              margin: isMobile ? '0 4px' : '0',
            }}
            bodyStyle={{ padding: isMobile ? '16px 8px' : '20px' }}
          >
            <Title level={isMobile ? 4 : 3} style={{ color: '#F59E0B', marginBottom: 4, fontSize: isMobile ? 20 : 24 }}>
              {navigations.filter(n => n.type === 'Header').length}
            </Title>
            <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>Header Menus</Text>
          </Card>
        </Col>
      </Row>

      <Card
        style={{
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
        bodyStyle={{ padding: isMobile ? '16px' : '24px' }}
      >
        <Table
          columns={columns}
          dataSource={navigations}
          rowKey="id"
          scroll={{ x: isMobile ? 600 : 1000 }}
          pagination={false}
          size={isMobile ? 'small' : 'middle'}
          style={{ fontSize: isMobile ? 12 : 14 }}
        />
      </Card>

      <Modal
        title={editingNav ? 'Edit Navigation' : 'Create Navigation'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={isMobile ? '100%' : 500}
        style={{ top: isMobile ? 0 : 20 }}
        bodyStyle={{ padding: isMobile ? 16 : 24 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Navigation Name"
            rules={[{ required: true, message: 'Please enter navigation name' }]}
          >
            <Input placeholder="Enter navigation name" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Navigation Type"
            rules={[{ required: true, message: 'Please select navigation type' }]}
          >
            <Select placeholder="Select navigation type">
              <Option value="Header">Header</Option>
              <Option value="Footer">Footer</Option>
              <Option value="Sidebar">Sidebar</Option>
              <Option value="Breadcrumb">Breadcrumb</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="location"
            label="Location"
            rules={[{ required: true, message: 'Please select location' }]}
          >
            <Select placeholder="Select location">
              <Option value="Top">Top</Option>
              <Option value="Bottom">Bottom</Option>
              <Option value="Left">Left</Option>
              <Option value="Right">Right</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Navigation;