import React, { useState, useEffect } from 'react';
import { Table, Tag, Switch, Button, Space, Typography, message, Modal, Form, Input, Select, ConfigProvider, Popconfirm, Avatar, Tooltip } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined, PlusOutlined, TeamOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined, ReloadOutlined, CrownOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import PermissionWrapper from '../common/PermissionWrapper';
import { useTheme } from '../../context/ThemeContext';

const { Option } = Select;

/* ─────────────────────────────────────────────
   STYLING SYSTEM & ANIMATIONS (Dashboard Parity)
───────────────────────────────────────────── */
const userStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

  .usr-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    animation: usrFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes usrFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .usr-stagger-1 { animation: usrSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .usr-stagger-2 { animation: usrSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.10s both; }
  .usr-stagger-3 { animation: usrSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }

  @keyframes usrSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .usr-beacon-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #3B82F6;
    position: relative;
    display: inline-block;
  }
  .usr-beacon-dot::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 2px solid #3B82F6;
    animation: usrPulse 2s ease-out infinite;
  }
  @keyframes usrPulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .usr-kpi-card {
    border-radius: 16px;
    padding: 20px 22px;
    position: relative;
    overflow: hidden;
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .usr-kpi-card:hover {
    transform: translateY(-3px);
  }
`;

const UserManagement = () => {
  const { darkMode } = useTheme();
  const D = darkMode;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    total: 0,
    admin: 0,
    active: 0,
    inactive: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/users');
      const data = response.data || [];
      setUsers(data);
      
      const adminCount = data.filter(u => u.role === 'admin').length;
      const activeCount = data.filter(u => u.is_active).length;
      const inactiveCount = data.length - activeCount;
      
      setStats({
        total: data.length,
        admin: adminCount,
        active: activeCount,
        inactive: inactiveCount
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to load users');
    } finally {
      setLoading(false);
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
      message.error('Failed to update user status');
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      if (editingUser) {
        await axios.put(`/api/admin/users/${editingUser.id}`, values);
        message.success('User updated successfully');
      } else {
        await axios.post('/api/admin/users', values);
        message.success('User created successfully');
      }
      setModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.message;
      message.error(msg || (editingUser ? 'Failed to update user' : 'Failed to create user'));
    }
  };

  const handleDelete = async (userId) => {
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u => 
    `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StatCard = ({ title, value, icon, color = 'primary', accentColor, subtitle }) => {
    const colorMap = {
      primary: { bg: D ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' },
      warning: { bg: D ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
      success: { bg: D ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
      danger: { bg: D ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
    };
    const c = colorMap[color] || colorMap.primary;

    return (
      <div
        className="usr-kpi-card"
        style={{
          background: D
            ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.65) 100%)'
            : 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)'}`,
          boxShadow: D
            ? '0 10px 30px -5px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 10px 30px -5px rgba(11, 31, 77, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accentColor || c.text }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: D ? '#94A3B8' : '#64748B' }}>
            {title}
          </span>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bg, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: `1px solid ${c.border}` }}>
            {icon}
          </div>
        </div>

        <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: D ? '#F8FAFC' : '#0F172A', lineHeight: 1 }}>
          {value}
        </div>

        {subtitle && (
          <div style={{ marginTop: 8, fontSize: '0.75rem', fontWeight: 600, color: D ? '#64748B' : '#94A3B8' }}>
            {subtitle}
          </div>
        )}
      </div>
    );
  };

  const columns = [
    {
      title: 'User Profile',
      key: 'name',
      render: (_, record) => (
        <Space size={10}>
          <Avatar size={34} icon={<UserOutlined />} style={{ background: D ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.1)', color: '#3B82F6', fontWeight: 700 }} />
          <div>
            <span style={{ fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A', fontSize: '0.85rem', display: 'block' }}>
              {`${record.first_name || ''} ${record.last_name || ''}`}
            </span>
            <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>{record.email}</span>
          </div>
        </Space>
      ),
    },
    {
      title: 'System Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag
          color={role === 'admin' ? 'purple' : 'blue'}
          style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px', fontSize: '0.72rem', textTransform: 'uppercase' }}
        >
          {role === 'admin' ? <CrownOutlined /> : <UserOutlined />} {role}
        </Tag>
      ),
    },
    {
      title: 'Account Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={() => handleStatusToggle(record.id, isActive)}
          checkedChildren="ACTIVE"
          unCheckedChildren="OFF"
        />
      ),
    },
    {
      title: 'Joined Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => (
        <span style={{ fontSize: '0.78rem', color: D ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
          {date ? moment(date).format('MMM DD, YYYY') : '—'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      align: 'right',
      render: (_, record) => (
        <Space size={6}>
          <PermissionWrapper permissions="user.update">
            <Tooltip title="Edit User">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                style={{ borderRadius: 8, color: '#3B82F6', background: D ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.06)' }}
              />
            </Tooltip>
          </PermissionWrapper>
          <PermissionWrapper permissions="user.delete">
            <Popconfirm title="Delete this user?" onConfirm={() => handleDelete(record.id)} okText="Delete" okButtonProps={{ danger: true }}>
              <Tooltip title="Delete User">
                <Button type="text" danger icon={<DeleteOutlined />} style={{ borderRadius: 8, background: D ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.06)' }} />
              </Tooltip>
            </Popconfirm>
          </PermissionWrapper>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: D ? '#1E293B' : '#FFFFFF',
          colorText: D ? '#CBD5E1' : '#334155',
          colorBorder: D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)',
          colorBgElevated: D ? '#1E293B' : '#FFFFFF',
          fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
        },
      }}
    >
      <style>{userStyles}</style>

      <div className="usr-root" style={{ padding: '24px 28px', background: D ? '#0A1229' : '#F8FAFC', minHeight: '100vh' }}>
        {/* ── COMMAND HEADER BANNER ── */}
        <div
          className="usr-stagger-1"
          style={{
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 24,
            background: D
              ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.75) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)'}`,
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: D ? '0 12px 32px -4px rgba(0, 0, 0, 0.4)' : '0 12px 32px -4px rgba(11, 31, 77, 0.05)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent)' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="usr-beacon-dot" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#3B82F6' }}>
                Identity & Team Access Control
              </span>
              <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>•</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B' }}>
                {stats.total} Team Accounts
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
              <TeamOutlined style={{ color: '#3B82F6' }} /> User Directory & Accounts
            </h1>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddUser}
            style={{
              background: 'linear-gradient(135deg, #0B1F4D 0%, #2563EB 100%)',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              height: 42,
              padding: '0 20px',
              fontSize: '0.85rem',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
            }}
          >
            Add Team User
          </Button>
        </div>

        {/* ── EXECUTIVE KPI GRID ── */}
        <div
          className="usr-stagger-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard title="Total Team Accounts" value={stats.total} icon={<TeamOutlined />} color="primary" accentColor="#3B82F6" subtitle="Registered Users" />
          <StatCard title="Platform Admins" value={stats.admin} icon={<CrownOutlined />} color="warning" accentColor="#F59E0B" subtitle="Full Privileges" />
          <StatCard title="Active Accounts" value={stats.active} icon={<CheckCircleOutlined />} color="success" accentColor="#10B981" subtitle="Enabled Login Access" />
          <StatCard title="Suspended / Disabled" value={stats.inactive} icon={<CloseCircleOutlined />} color="danger" accentColor="#EF4444" subtitle="Revoked Access" />
        </div>

        {/* ── MAIN TABLE CONTAINER ── */}
        <div
          className="usr-stagger-3"
          style={{
            background: D ? 'rgba(15, 23, 42, 0.8)' : '#FFFFFF',
            borderRadius: 16,
            border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
            overflow: 'hidden',
            boxShadow: D ? '0 10px 30px -5px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(11, 31, 77, 0.05)',
          }}
        >
          {/* Action Bar */}
          <div
            style={{
              padding: '16px 22px',
              borderBottom: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A' }}>
                User Roster
              </h3>
              <span style={{ fontSize: '0.78rem', color: D ? '#64748B' : '#94A3B8' }}>
                Showing {filteredUsers.length} users
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: D ? '#1E293B' : '#F1F5F9',
                  border: `1px solid ${D ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.8)'}`,
                  borderRadius: 10,
                  padding: '6px 14px',
                  width: 240,
                }}
              >
                <SearchOutlined style={{ color: D ? '#64748B' : '#94A3B8', fontSize: 14 }} />
                <input
                  type="text"
                  placeholder="Search user name/email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.82rem',
                    color: D ? '#F8FAFC' : '#0F172A',
                    width: '100%',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <Tooltip title="Reload Users">
                <Button icon={<ReloadOutlined />} onClick={fetchUsers} style={{ borderRadius: 10, background: D ? '#1E293B' : '#F1F5F9' }} />
              </Tooltip>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </div>

        {/* ── CREATE / EDIT USER MODAL ── */}
        <Modal
          title={
            <div style={{ fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A' }}>
              {editingUser ? 'Edit User Credentials' : 'Provision New User Account'}
            </div>
          }
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={() => form.submit()}
          okText={editingUser ? 'Save Changes' : 'Create User'}
          okButtonProps={{
            style: {
              background: 'linear-gradient(135deg, #0B1F4D 0%, #2563EB 100%)',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
            },
          }}
          cancelButtonProps={{ style: { borderRadius: 8 } }}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
            <Form.Item name="first_name" label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>First Name</span>} rules={[{ required: true }]}>
              <Input placeholder="John" style={{ borderRadius: 8, height: 40 }} />
            </Form.Item>

            <Form.Item name="last_name" label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Last Name</span>} rules={[{ required: true }]}>
              <Input placeholder="Doe" style={{ borderRadius: 8, height: 40 }} />
            </Form.Item>

            <Form.Item name="email" label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Email Address</span>} rules={[{ required: true, type: 'email' }]}>
              <Input disabled={!!editingUser} placeholder="user@domain.com" style={{ borderRadius: 8, height: 40 }} />
            </Form.Item>

            {!editingUser && (
              <Form.Item name="password" label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Password</span>} rules={[{ required: true, min: 8 }]}>
                <Input.Password placeholder="At least 8 characters" style={{ borderRadius: 8, height: 40 }} />
              </Form.Item>
            )}

            <Form.Item name="role" label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>System Role</span>} initialValue="user">
              <Select style={{ height: 40, borderRadius: 8 }}>
                <Option value="user">User (Standard Access)</Option>
                <Option value="admin">Admin (Full Control)</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default UserManagement;