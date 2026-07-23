import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Table, Tag, Space, Modal, Form, Input, Select, Popconfirm, message, Statistic, Grid } from 'antd';
import {
  FormOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const Forms = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg;

  const [forms, setForms] = useState([
    {
      id: 1,
      name: 'Contact Form',
      type: 'Contact',
      fields: 5,
      submissions: 234,
      status: 'active',
      lastSubmission: '2024-01-15',
    },
    {
      id: 2,
      name: 'Newsletter Signup',
      type: 'Newsletter',
      fields: 2,
      submissions: 1520,
      status: 'active',
      lastSubmission: '2024-01-15',
    },
    {
      id: 3,
      name: 'Feedback Form',
      type: 'Feedback',
      fields: 4,
      submissions: 89,
      status: 'active',
      lastSubmission: '2024-01-14',
    },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingForm(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (formItem) => {
    setEditingForm(formItem);
    form.setFieldsValue(formItem);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    setForms(forms.filter(f => f.id !== id));
    message.success('Form deleted successfully');
  };

  const handleDuplicate = (formItem) => {
    const newForm = {
      ...formItem,
      id: forms.length + 1,
      name: `${formItem.name} (Copy)`,
      submissions: 0,
    };
    setForms([...forms, newForm]);
    message.success('Form duplicated successfully');
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingForm) {
        setForms(forms.map(f => f.id === editingForm.id ? { ...f, ...values } : f));
        message.success('Form updated successfully');
      } else {
        setForms([...forms, { ...values, id: forms.length + 1, submissions: 0, lastSubmission: null }]);
        message.success('Form created successfully');
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
      title: 'Form Name',
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
      title: 'Fields',
      dataIndex: 'fields',
      key: 'fields',
      width: isMobile ? 60 : 80,
      responsive: ['md'],
      render: (count) => <Text style={{ fontSize: isMobile ? 12 : 14 }}>{count} fields</Text>,
    },
    {
      title: 'Submissions',
      dataIndex: 'submissions',
      key: 'submissions',
      width: isMobile ? 90 : 110,
      render: (count) => <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>{count.toLocaleString()}</Text>,
    },
    {
      title: 'Last Submission',
      dataIndex: 'lastSubmission',
      key: 'lastSubmission',
      width: isMobile ? 90 : 120,
      responsive: ['lg'],
      render: (date) => <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>{date || 'N/A'}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 70 : 90,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'} style={{ fontSize: isMobile ? 11 : 14 }}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: isMobile ? 120 : 150,
      render: (_, record) => (
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '2px' : '8px',
          alignItems: 'center',
          justifyContent: 'flex-start',
          flexWrap: 'nowrap'
        }}>
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            title="View Submissions"
            style={{ 
              padding: isMobile ? '0 4px' : '0 8px',
              flex: isMobile ? '1' : 'none',
              minWidth: isMobile ? '24px' : 'auto',
              fontSize: isMobile ? '12px' : '14px'
            }}
          />
          <Button 
            type="text" 
            icon={<CopyOutlined />} 
            onClick={() => handleDuplicate(record)} 
            title="Duplicate"
            style={{ 
              padding: isMobile ? '0 4px' : '0 8px',
              flex: isMobile ? '1' : 'none',
              minWidth: isMobile ? '24px' : 'auto',
              fontSize: isMobile ? '12px' : '14px'
            }}
          />
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)} 
            title="Edit"
            style={{ 
              padding: isMobile ? '0 4px' : '0 8px',
              flex: isMobile ? '1' : 'none',
              minWidth: isMobile ? '24px' : 'auto',
              fontSize: isMobile ? '12px' : '14px'
            }}
          />
          <Popconfirm
            title="Are you sure you want to delete this form?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              danger 
              title="Delete"
              style={{ 
                padding: isMobile ? '0 4px' : '0 8px',
                flex: isMobile ? '1' : 'none',
                minWidth: isMobile ? '24px' : 'auto',
                fontSize: isMobile ? '12px' : '14px'
              }}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <Title level={isMobile ? 3 : 2} style={{ fontSize: isMobile ? 24 : 30, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            <FormOutlined /> Forms
          </Title>
          <Text style={{ fontSize: isMobile ? 13 : 15, color: '#6B7280' }}>
            Create and manage website forms
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Create Form
        </Button>
      </div>

      {/* Stats Cards - Fixed gap issue */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              height: '100%',
              margin: isMobile ? '0 4px' : '0',
            }}
            bodyStyle={{ padding: isMobile ? '16px 8px' : '20px' }}
          >
            <Statistic
              title={<Text style={{ fontSize: isMobile ? 11 : 13, color: '#6B7280', fontWeight: 500 }}>Total Forms</Text>}
              value={forms.length}
              valueStyle={{ fontSize: isMobile ? 20 : 24, fontWeight: 600, color: '#111827' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              height: '100%',
              margin: isMobile ? '0 4px' : '0',
            }}
            bodyStyle={{ padding: isMobile ? '16px 8px' : '20px' }}
          >
            <Statistic
              title={<Text style={{ fontSize: isMobile ? 11 : 13, color: '#6B7280', fontWeight: 500 }}>Total Submissions</Text>}
              value={forms.reduce((acc, f) => acc + f.submissions, 0)}
              valueStyle={{ fontSize: isMobile ? 20 : 24, fontWeight: 600, color: '#111827' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              height: '100%',
              margin: isMobile ? '0 4px' : '0',
            }}
            bodyStyle={{ padding: isMobile ? '16px 8px' : '20px' }}
          >
            <Statistic
              title={<Text style={{ fontSize: isMobile ? 11 : 13, color: '#6B7280', fontWeight: 500 }}>Active Forms</Text>}
              value={forms.filter(f => f.status === 'active').length}
              valueStyle={{ fontSize: isMobile ? 20 : 24, fontWeight: 600, color: '#111827' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              height: '100%',
              margin: isMobile ? '0 4px' : '0',
            }}
            bodyStyle={{ padding: isMobile ? '16px 8px' : '20px' }}
          >
            <Statistic
              title={<Text style={{ fontSize: isMobile ? 11 : 13, color: '#6B7280', fontWeight: 500 }}>Avg Fields</Text>}
              value={Math.round(forms.reduce((acc, f) => acc + f.fields, 0) / forms.length) || 0}
              valueStyle={{ fontSize: isMobile ? 20 : 24, fontWeight: 600, color: '#111827' }}
            />
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
          dataSource={forms}
          rowKey="id"
          scroll={{ x: isMobile ? 800 : 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: !isMobile,
            showQuickJumper: !isMobile,
            showTotal: !isMobile ? (total) => `Total ${total} forms` : false,
            simple: isMobile,
            size: isMobile ? 'small' : 'default',
          }}
          size={isMobile ? 'small' : 'middle'}
          style={{ fontSize: isMobile ? 12 : 14 }}
        />
      </Card>

      <Modal
        title={editingForm ? 'Edit Form' : 'Create Form'}
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
            label="Form Name"
            rules={[{ required: true, message: 'Please enter form name' }]}
          >
            <Input placeholder="Enter form name" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Form Type"
            rules={[{ required: true, message: 'Please select form type' }]}
          >
            <Select placeholder="Select form type">
              <Option value="Contact">Contact</Option>
              <Option value="Newsletter">Newsletter</Option>
              <Option value="Feedback">Feedback</Option>
              <Option value="Survey">Survey</Option>
              <Option value="Registration">Registration</Option>
              <Option value="Custom">Custom</Option>
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

export default Forms;