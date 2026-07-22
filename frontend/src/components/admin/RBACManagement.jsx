import React, { useState, useEffect } from 'react';
import { 
  Card, Tabs, Table, Button, Modal, Form, Input, Select, 
  Transfer, message, Tag, Space, Typography, Tooltip, 
  Popconfirm, Row, Col, Statistic
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  UserOutlined, LockOutlined, SettingOutlined,
  SafetyOutlined, TeamOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const RBACManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [editPermission, setEditPermission] = useState(null);
  const [roleForm] = Form.useForm();
  const [permissionForm] = Form.useForm();
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/rbac/roles');
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Fetch roles error:', error);
      message.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/rbac/permissions');
      setPermissions(response.data.permissions);
    } catch (error) {
      console.error('Fetch permissions error:', error);
      message.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async (roleId) => {
    try {
      const response = await axios.get(`/api/rbac/roles/${roleId}`);
      setSelectedRole(response.data.role);
      setRolePermissions(response.data.permissions.map(p => p.id));
    } catch (error) {
      console.error('Fetch role permissions error:', error);
      message.error('Failed to load role permissions');
    }
  };

  const handleCreateRole = async (values) => {
    try {
      await axios.post('/api/rbac/roles', values);
      message.success('Role created successfully');
      setRoleModalVisible(false);
      roleForm.resetFields();
      fetchRoles();
    } catch (error) {
      console.error('Create role error:', error);
      message.error(error.response?.data?.message || 'Failed to create role');
    }
  };

  const handleUpdateRole = async (values) => {
    try {
      await axios.put(`/api/rbac/roles/${editRole.id}`, values);
      message.success('Role updated successfully');
      setRoleModalVisible(false);
      setEditRole(null);
      roleForm.resetFields();
      fetchRoles();
    } catch (error) {
      console.error('Update role error:', error);
      message.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      await axios.delete(`/api/rbac/roles/${roleId}`);
      message.success('Role deleted successfully');
      fetchRoles();
    } catch (error) {
      console.error('Delete role error:', error);
      message.error(error.response?.data?.message || 'Failed to delete role');
    }
  };

  const handleCreatePermission = async (values) => {
    try {
      await axios.post('/api/rbac/permissions', values);
      message.success('Permission created successfully');
      setPermissionModalVisible(false);
      permissionForm.resetFields();
      fetchPermissions();
    } catch (error) {
      console.error('Create permission error:', error);
      message.error(error.response?.data?.message || 'Failed to create permission');
    }
  };

  const handleUpdatePermission = async (values) => {
    try {
      await axios.put(`/api/rbac/permissions/${editPermission.id}`, values);
      message.success('Permission updated successfully');
      setPermissionModalVisible(false);
      setEditPermission(null);
      permissionForm.resetFields();
      fetchPermissions();
    } catch (error) {
      console.error('Update permission error:', error);
      message.error(error.response?.data?.message || 'Failed to update permission');
    }
  };

  const handleDeletePermission = async (permissionId) => {
    try {
      await axios.delete(`/api/rbac/permissions/${permissionId}`);
      message.success('Permission deleted successfully');
      fetchPermissions();
    } catch (error) {
      console.error('Delete permission error:', error);
      message.error(error.response?.data?.message || 'Failed to delete permission');
    }
  };

  const handleAssignPermissions = async (permissionIds) => {
    try {
      await axios.put(`/api/rbac/roles/${selectedRole.id}/permissions`, { permissionIds });
      message.success('Permissions assigned successfully');
      setRolePermissions(permissionIds);
    } catch (error) {
      console.error('Assign permissions error:', error);
      message.error('Failed to assign permissions');
    }
  };

  const openRoleModal = (role = null) => {
    if (role) {
      setEditRole(role);
      roleForm.setFieldsValue(role);
    } else {
      setEditRole(null);
      roleForm.resetFields();
    }
    setRoleModalVisible(true);
  };

  const openPermissionModal = (permission = null) => {
    if (permission) {
      setEditPermission(permission);
      permissionForm.setFieldsValue(permission);
    } else {
      setEditPermission(null);
      permissionForm.resetFields();
    }
    setPermissionModalVisible(true);
  };

  const roleColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <Text strong>{name}</Text>
          {record.is_system && <Tag color="blue">System</Tag>}
        </Space>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      sorter: (a, b) => a.level - b.level,
      render: (level) => <Tag color={level >= 80 ? 'red' : level >= 60 ? 'orange' : 'green'}>{level}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Role">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => openRoleModal(record)}
              disabled={record.is_system}
            />
          </Tooltip>
          <Tooltip title="Manage Permissions">
            <Button 
              type="text" 
              icon={<SettingOutlined />} 
              onClick={() => fetchRolePermissions(record.id)}
            />
          </Tooltip>
          {!record.is_system && (
            <Popconfirm
              title="Delete Role"
              description="Are you sure you want to delete this role?"
              onConfirm={() => handleDeleteRole(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okType="danger"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const permissionColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Text code>{name}</Text>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
      render: (resource) => <Tag color="blue">{resource}</Tag>
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action) => <Tag color="green">{action}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Permission">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => openPermissionModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Permission"
            description="Are you sure you want to delete this permission?"
            onConfirm={() => handleDeletePermission(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okType="danger"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const groupedRoles = roles.reduce((acc, role) => {
    if (!acc[role.level]) acc[role.level] = [];
    acc[role.level].push(role);
    return acc;
  }, {});

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {});

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <SafetyOutlined /> RBAC Management
      </Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Roles"
              value={roles.length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Permissions"
              value={permissions.length}
              prefix={<LockOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="System Roles"
              value={roles.filter(r => r.is_system).length}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="roles">
          <TabPane tab={<span><TeamOutlined /> Roles</span>} key="roles">
            <div style={{ marginBottom: 16 }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => openRoleModal()}
              >
                Create Role
              </Button>
            </div>
            <Table
              columns={roleColumns}
              dataSource={roles}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </TabPane>

          <TabPane tab={<span><LockOutlined /> Permissions</span>} key="permissions">
            <div style={{ marginBottom: 16 }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => openPermissionModal()}
              >
                Create Permission
              </Button>
            </div>
            <Table
              columns={permissionColumns}
              dataSource={permissions}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </TabPane>

          <TabPane tab={<span><SettingOutlined /> Role Permissions</span>} key="role-permissions">
            <div style={{ marginBottom: 16 }}>
              <Select
                style={{ width: 300 }}
                placeholder="Select a role to manage permissions"
                onChange={(value) => fetchRolePermissions(value)}
                options={roles.map(role => ({ label: role.name, value: role.id }))}
              />
            </div>
            
            {selectedRole && (
              <Card 
                title={`Manage Permissions: ${selectedRole.name}`}
                extra={
                  selectedRole.is_system && (
                    <Tag color="blue">System Role</Tag>
                  )
                }
              >
                <Transfer
                  dataSource={permissions}
                  targetKeys={rolePermissions}
                  onChange={handleAssignPermissions}
                  render={item => (
                    <div>
                      <Text code>{item.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.description}
                      </Text>
                    </div>
                  )}
                  titles={['Available Permissions', 'Assigned Permissions']}
                  listStyle={{
                    width: 450,
                    height: 400
                  }}
                />
              </Card>
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* Role Modal */}
      <Modal
        title={editRole ? 'Edit Role' : 'Create Role'}
        open={roleModalVisible}
        onCancel={() => {
          setRoleModalVisible(false);
          setEditRole(null);
          roleForm.resetFields();
        }}
        onOk={() => roleForm.submit()}
      >
        <Form
          form={roleForm}
          layout="vertical"
          onFinish={editRole ? handleUpdateRole : handleCreateRole}
        >
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: 'Role name is required' }]}
          >
            <Input placeholder="e.g., Content Manager" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Description is required' }]}
          >
            <Input.TextArea rows={3} placeholder="Describe this role's purpose" />
          </Form.Item>
          <Form.Item
            name="level"
            label="Role Level (0-100)"
            rules={[{ required: true, message: 'Level is required' }]}
            tooltip="Higher level means more privileges"
          >
            <Input type="number" min={0} max={100} placeholder="e.g., 50" />
          </Form.Item>
          <Form.Item
            name="is_system"
            label="System Role"
            valuePropName="checked"
            tooltip="System roles cannot be deleted"
          >
            <input type="checkbox" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Permission Modal */}
      <Modal
        title={editPermission ? 'Edit Permission' : 'Create Permission'}
        open={permissionModalVisible}
        onCancel={() => {
          setPermissionModalVisible(false);
          setEditPermission(null);
          permissionForm.resetFields();
        }}
        onOk={() => permissionForm.submit()}
      >
        <Form
          form={permissionForm}
          layout="vertical"
          onFinish={editPermission ? handleUpdatePermission : handleCreatePermission}
        >
          <Form.Item
            name="name"
            label="Permission Name"
            rules={[{ required: true, message: 'Permission name is required' }]}
          >
            <Input placeholder="e.g., content.create" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Description is required' }]}
          >
            <Input.TextArea rows={2} placeholder="Describe this permission" />
          </Form.Item>
          <Form.Item
            name="resource"
            label="Resource"
            rules={[{ required: true, message: 'Resource is required' }]}
          >
            <Select
              placeholder="Select resource"
              options={[
                { label: 'Content', value: 'content' },
                { label: 'User', value: 'user' },
                { label: 'Category', value: 'category' },
                { label: 'Media', value: 'media' },
                { label: 'Settings', value: 'settings' },
                { label: 'Analytics', value: 'analytics' },
                { label: 'Role', value: 'role' }
              ]}
            />
          </Form.Item>
          <Form.Item
            name="action"
            label="Action"
            rules={[{ required: true, message: 'Action is required' }]}
          >
            <Select
              placeholder="Select action"
              options={[
                { label: 'Create', value: 'create' },
                { label: 'Read', value: 'read' },
                { label: 'Update', value: 'update' },
                { label: 'Delete', value: 'delete' },
                { label: 'Publish', value: 'publish' },
                { label: 'Assign', value: 'assign' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RBACManagement;
