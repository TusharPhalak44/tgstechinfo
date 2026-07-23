import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Switch, Button, Space, Typography, message, Modal, Form, Input, Select, Grid } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import PermissionWrapper from '../common/PermissionWrapper';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const UserManagement = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg;

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [form] = Form.useForm();
  const [roleForm] = Form.useForm();

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get('/api/rbac/roles');
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      message.error('Failed to load roles');
    }
  };

  const fetchUserRoles = async (userId) => {
    try {
      const response = await axios.get(`/api/rbac/users/${userId}/roles`);
      setUserRoles(response.data.roles.map(r => r.id));
    } catch (error) {
      console.error('Error fetching user roles:', error);
      message.error('Failed to load user roles');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await axios.put(`/api/admin/users/${userId}/status`, {
        is_active: !currentStatus
      });
      message.success('User status updated');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      message.error('Failed to update user status');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      await axios.put(`/api/admin/users/${editingUser.id}`, values);
      message.success('User updated successfully');
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      message.error('Failed to update user');
    }
  };

  const handleManageRoles = (user) => {
    setSelectedUser(user);
    fetchUserRoles(user.id);
    roleForm.setFieldsValue({ roles: [] });
    setRoleModalVisible(true);
  };

  const handleAssignRoles = async (values) => {
    try {
      await axios.put(`/api/rbac/users/${selectedUser.id}/roles`, { roleIds: values.roles });
      message.success('User roles updated successfully');
      setRoleModalVisible(false);
      setSelectedUser(null);
      roleForm.resetFields();
      fetchUsers();
    } catch (error) {
      console.error('Error assigning roles:', error);
      message.error('Failed to assign roles');
    }
  };

  const columns = [
    {
      title: 'Name',
      key: 'name',
      width: isMobile ? 100 : 150,
      render: (_, record) => <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>{`${record.first_name} ${record.last_name}`}</Text>
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: isMobile ? 120 : 200,
      ellipsis: true,
      render: (email) => <Text style={{ fontSize: isMobile ? 11 : 14 }}>{email}</Text>
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: isMobile ? 70 : 90,
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'} style={{ fontSize: isMobile ? 11 : 14 }}>
          {role.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: isMobile ? 80 : 100,
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={() => handleStatusToggle(record.id, isActive)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          size={isMobile ? 'small' : 'default'}
        />
      )
    },
    {
      title: 'Joined',
      dataIndex: 'created_at',
      key: 'created_at',
      width: isMobile ? 90 : 120,
      responsive: ['lg'],
      render: (date) => <Text style={{ fontSize: isMobile ? 11 : 14 }}>{moment(date).format('MMM D, YYYY')}</Text>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: isMobile ? 100 : 150,
      render: (_, record) => (
        <Space size={isMobile ? 4 : 8}>
          <PermissionWrapper permissions="user.update">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              style={{ padding: isMobile ? '0 4px' : '0 8px' }}
              size={isMobile ? 'small' : 'middle'}
            >
              {!isMobile && 'Edit'}
            </Button>
          </PermissionWrapper>
          <PermissionWrapper permissions="user.manage_roles">
            <Button 
              icon={<TeamOutlined />}
              onClick={() => handleManageRoles(record)}
              style={{ padding: isMobile ? '0 4px' : '0 8px' }}
              size={isMobile ? 'small' : 'middle'}
            >
              {!isMobile && 'Roles'}
            </Button>
          </PermissionWrapper>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Title level={isMobile ? 4 : 3} style={{ fontSize: isMobile ? 20 : 24 }}>User Management</Title>
          <Button type="primary" icon={<PlusOutlined />} style={{ width: isMobile ? '100%' : 'auto' }}>
            Add User
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="id"
          scroll={{ x: isMobile ? 800 : 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: !isMobile,
            showQuickJumper: !isMobile,
            showTotal: !isMobile ? (total) => `Total ${total} users` : false,
            simple: isMobile,
            size: isMobile ? 'small' : 'default',
          }}
          size={isMobile ? 'small' : 'middle'}
          style={{ fontSize: isMobile ? 12 : 14 }}
        />
      </Card>

      <Modal
        title={editingUser ? 'Edit User' : 'Add User'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        footer={null}
        width={isMobile ? '100%' : 600}
        style={{ top: isMobile ? 0 : 20 }}
        bodyStyle={{ padding: isMobile ? 16 : 24 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="first_name"
            label="First Name"
            rules={[{ required: true, message: 'Please enter first name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="last_name"
            label="Last Name"
            rules={[{ required: true, message: 'Please enter last name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' }
            ]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="user">User</Option>
              <Option value="editor">Editor</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
              <Button type="primary" htmlType="submit" style={{ width: isMobile ? '100%' : 'auto' }}>
                Save
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingUser(null);
                form.resetFields();
              }} style={{ width: isMobile ? '100%' : 'auto' }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Role Assignment Modal */}
      <Modal
        title={`Manage Roles: ${selectedUser?.first_name} ${selectedUser?.last_name}`}
        open={roleModalVisible}
        onCancel={() => {
          setRoleModalVisible(false);
          setSelectedUser(null);
          roleForm.resetFields();
        }}
        onOk={() => roleForm.submit()}
        width={isMobile ? '100%' : 500}
        style={{ top: isMobile ? 0 : 20 }}
        bodyStyle={{ padding: isMobile ? 16 : 24 }}
      >
        <Form
          form={roleForm}
          layout="vertical"
          onFinish={handleAssignRoles}
        >
          <Form.Item
            name="roles"
            label="Assign Roles"
            rules={[{ required: true, message: 'Please select at least one role' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select roles"
              options={roles.map(role => ({
                label: `${role.name} (Level: ${role.level})`,
                value: role.id
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;