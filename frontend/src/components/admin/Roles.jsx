import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Table, Tag, Space, Modal, Form, Input, Select, Popconfirm, message, Checkbox, Grid } from 'antd';
import {
  SecurityScanOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const Roles = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg;

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
      width: isMobile ? 100 : 150,
      render: (text) => <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>{text}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: isMobile ? 120 : 200,
      ellipsis: true,
      render: (text) => <Text style={{ fontSize: isMobile ? 11 : 14 }}>{text}</Text>,
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      width: isMobile ? 100 : 150,
      responsive: ['md'],
      render: (permissions) => (
        <Space size={isMobile ? 2 : 'small'} wrap>
          {permissions.includes('all') ? (
            <Tag color="purple" style={{ fontSize: isMobile ? 11 : 14 }}>All Permissions</Tag>
          ) : (
            permissions.slice(0, 3).map((perm, index) => (
              <Tag key={index} color="blue" style={{ fontSize: isMobile ? 11 : 14 }}>{perm}</Tag>
            ))
          )}
          {permissions.length > 3 && !permissions.includes('all') && (
            <Tag style={{ fontSize: isMobile ? 11 : 14 }}>+{permissions.length - 3} more</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      key: 'userCount',
      width: isMobile ? 70 : 90,
      render: (count) => <Text style={{ fontSize: isMobile ? 11 : 14 }}>{count} users</Text>,
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
      width: isMobile ? 80 : 120,
      render: (_, record) => (
        <Space size={isMobile ? 2 : 8}>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ padding: isMobile ? '0 4px' : '0 8px' }} />
          <Popconfirm
            title="Are you sure you want to delete this role?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" icon={<DeleteOutlined />} danger style={{ padding: isMobile ? '0 4px' : '0 8px' }} />
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
            <SecurityScanOutlined /> Roles
          </Title>
          <Text style={{ fontSize: isMobile ? 13 : 15, color: '#6B7280' }}>
            Manage user roles and permissions
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ width: isMobile ? '100%' : 'auto' }}>
          Create Role
        </Button>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6} style={{ padding: isMobile ? '0 6px' : '0' }}>
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
            <Title level={isMobile ? 4 : 3} style={{ color: '#0AAEEF', marginBottom: 8, fontSize: isMobile ? 20 : 24 }}>
              {roles.length}
            </Title>
            <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>Total Roles</Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} style={{ padding: isMobile ? '0 6px' : '0' }}>
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
            <Title level={isMobile ? 4 : 3} style={{ color: '#10B981', marginBottom: 8, fontSize: isMobile ? 20 : 24 }}>
              {roles.reduce((acc, role) => acc + role.userCount, 0)}
            </Title>
            <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>Total Users</Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} style={{ padding: isMobile ? '0 6px' : '0' }}>
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
            <Title level={isMobile ? 4 : 3} style={{ color: '#8B5CF6', marginBottom: 8, fontSize: isMobile ? 20 : 24 }}>
              {roles.filter(role => role.status === 'active').length}
            </Title>
            <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>Active Roles</Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} style={{ padding: isMobile ? '0 6px' : '0' }}>
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
            <Title level={isMobile ? 4 : 3} style={{ color: '#F59E0B', marginBottom: 8, fontSize: isMobile ? 20 : 24 }}>
              {availablePermissions.length}
            </Title>
            <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>Permissions</Text>
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
          dataSource={roles}
          rowKey="id"
          scroll={{ x: isMobile ? 800 : 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: !isMobile,
            showQuickJumper: !isMobile,
            showTotal: !isMobile ? (total) => `Total ${total} roles` : false,
            simple: isMobile,
            size: isMobile ? 'small' : 'default',
          }}
          size={isMobile ? 'small' : 'middle'}
          style={{ fontSize: isMobile ? 12 : 14 }}
        />
      </Card>

      <Modal
        title={editingRole ? 'Edit Role' : 'Create Role'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={isMobile ? '100%' : 600}
        style={{ top: isMobile ? 0 : 20 }}
        bodyStyle={{ padding: isMobile ? 16 : 24 }}
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
              <Row gutter={[isMobile ? 6 : 8, isMobile ? 6 : 8]}>
                {availablePermissions.map(perm => (
                  <Col xs={24} sm={12} key={perm.value}>
                    <Checkbox value={perm.value} style={{ fontSize: isMobile ? 12 : 14 }}>{perm.label}</Checkbox>
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
