import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Table, Tag, Space, Modal, Form, Input, Select, Popconfirm, message, Statistic } from 'antd';
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

const Forms = () => {
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
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Fields',
      dataIndex: 'fields',
      key: 'fields',
      render: (count) => <Text>{count} fields</Text>,
    },
    {
      title: 'Submissions',
      dataIndex: 'submissions',
      key: 'submissions',
      render: (count) => <Text strong>{count.toLocaleString()}</Text>,
    },
    {
      title: 'Last Submission',
      dataIndex: 'lastSubmission',
      key: 'lastSubmission',
      render: (date) => <Text type="secondary">{date || 'N/A'}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} title="View Submissions" />
          <Button type="text" icon={<CopyOutlined />} onClick={() => handleDuplicate(record)} title="Duplicate" />
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} title="Edit" />
          <Popconfirm
            title="Are you sure you want to delete this form?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" icon={<DeleteOutlined />} danger title="Delete" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <Title level={2} style={{ fontSize: 30, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            <FormOutlined /> Forms
          </Title>
          <Text style={{ fontSize: 15, color: '#6B7280' }}>
            Create and manage website forms
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Create Form
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={<Text style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Total Forms</Text>}
              value={forms.length}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: '#111827' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={<Text style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Total Submissions</Text>}
              value={forms.reduce((acc, f) => acc + f.submissions, 0)}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: '#111827' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={<Text style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Active Forms</Text>}
              value={forms.filter(f => f.status === 'active').length}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: '#111827' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={<Text style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Avg Fields</Text>}
              value={Math.round(forms.reduce((acc, f) => acc + f.fields, 0) / forms.length) || 0}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: '#111827' }}
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
        bodyStyle={{ padding: '24px' }}
      >
        <Table
          columns={columns}
          dataSource={forms}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} forms`,
          }}
        />
      </Card>

      <Modal
        title={editingForm ? 'Edit Form' : 'Create Form'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={500}
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
