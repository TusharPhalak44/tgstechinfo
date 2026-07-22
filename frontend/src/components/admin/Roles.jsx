import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Table, Tag, Space, Modal, Form, Input, Select, Popconfirm, message, Checkbox } from 'antd';
import {
  SecurityScanOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const Roles = () => {
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: 'Administrator',
      description: 'Full access to all features',
      permissions: ['all'],
      userCount: 2,
      status: 'active',
    },
    {
      id: 2,
      name: 'Editor',
      description: 'Can create and edit content',
      permissions: ['content.create', 'content.edit', 'content.delete'],
      userCount: 5,
      status: 'active',
    },
    {
      id: 3,
      name: 'Author',
      description: 'Can create and edit own content',
      permissions: ['content.create', 'content.edit.own'],
      userCount: 12,
      status: 'active',
    },
    {
      id: 4,
      name: 'Viewer',
      description: 'Read-only access',
      permissions: ['content.read'],
      userCount: 45,
      status: 'active',
    },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();

  const availablePermissions = [
    { label: 'Content: Create', value: 'content.create' },
    { label: 'Content: Edit', value: 'content.edit' },
    { label: 'Content: Edit Own', value: 'content.edit.own' },
    { label: 'Content: Delete', value: 'content.delete' },
    { label: 'Content: Read', value: 'content.read' },
    { label: 'Users: Manage', value: 'users.manage' },
    { label: 'Users: Read', value: 'users.read' },
    { label: 'Settings: Manage', value: 'settings.manage' },
    { label: 'Media: Upload', value: 'media.upload' },
    { label: 'Media: Delete', value: 'media.delete' },
  ];

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
      permissions: role.permissions.includes('all') ? ['all'] : role.permissions,
      status: role.status,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    setRoles(roles.filter(role => role.id !== id));
    message.success('Role deleted successfully');
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingRole) {
        setRoles(roles.map(role => 
          role.id === editingRole.id ? { ...role, ...values } : role
        ));
        message.success('Role updated successfully');
      } else {
        setRoles([...roles, { ...values, id: roles.length + 1, userCount: 0 }]);
        message.success('Role created successfully');
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
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => (
        <Space size="small" wrap>
          {permissions.includes('all') ? (
            <Tag color="purple">All Permissions</Tag>
          ) : (
            permissions.slice(0, 3).map((perm, index) => (
              <Tag key={index} color="blue">{perm}</Tag>
            ))
          )}
          {permissions.length > 3 && !permissions.includes('all') && (
            <Tag>+{permissions.length - 3} more</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count) => <Text>{count} users</Text>,
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
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure you want to delete this role?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" icon={<DeleteOutlined />} danger />
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
            <SecurityScanOutlined /> Roles
          </Title>
          <Text style={{ fontSize: 15, color: '#6B7280' }}>
            Manage user roles and permissions
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Create Role
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
            <Title level={3} style={{ color: '#0AAEEF', marginBottom: 8 }}>
              {roles.length}
            </Title>
            <Text type="secondary">Total Roles</Text>
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
            <Title level={3} style={{ color: '#10B981', marginBottom: 8 }}>
              {roles.reduce((acc, role) => acc + role.userCount, 0)}
            </Title>
            <Text type="secondary">Total Users</Text>
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
            <Title level={3} style={{ color: '#8B5CF6', marginBottom: 8 }}>
              {roles.filter(role => role.status === 'active').length}
            </Title>
            <Text type="secondary">Active Roles</Text>
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
            <Title level={3} style={{ color: '#F59E0B', marginBottom: 8 }}>
              {availablePermissions.length}
            </Title>
            <Text type="secondary">Permissions</Text>
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
          dataSource={roles}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} roles`,
          }}
        />
      </Card>

      <Modal
        title={editingRole ? 'Edit Role' : 'Create Role'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: 'Please enter role name' }]}
          >
            <Input placeholder="Enter role name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={3} placeholder="Enter role description" />
          </Form.Item>

          <Form.Item
            name="permissions"
            label="Permissions"
            rules={[{ required: true, message: 'Please select permissions' }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[8, 8]}>
                {availablePermissions.map(perm => (
                  <Col span={12} key={perm.value}>
                    <Checkbox value={perm.value}>{perm.label}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
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

export default Roles;
