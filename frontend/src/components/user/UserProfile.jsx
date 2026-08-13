import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Button, Avatar, Upload, 
  Typography, Space, Divider, Row, Col, 
  message, Modal, Tabs, Tag, Alert, Switch,
  Descriptions, Statistic, Grid, ConfigProvider
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined,
  LockOutlined,
  SafetyOutlined,
  CameraOutlined,
  EditOutlined,
  KeyOutlined,
  SecurityScanOutlined,
  ClockCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import SessionManagement from '../admin/SessionManagement';
import LoginHistory from './LoginHistory';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text, Paragraph } = Typography;
// const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

const UserProfile = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg;
  const { darkMode } = useTheme();

  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordStrengthText, setPasswordStrengthText] = useState('');
  const [stats, setStats] = useState({ contentCreated: 0, totalViews: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    fetchUserStats();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/auth/profile');
      setUser(response.data.user);
      form.setFieldsValue(response.data.user);
      setAvatarUrl(response.data.user.avatar || '');
    } catch (error) {
      console.error('Fetch profile error:', error);
      message.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    setStatsLoading(true);
    try {
      const response = await axios.get('/api/user/stats');
      console.log('Stats response:', response.data); // Debug log
      setStats({
        contentCreated: response.data.contentCreated || 0,
        totalViews: response.data.totalViews || 0
      });
    } catch (error) {
      console.error('Fetch user stats error:', error);
      // Don't set to 0 if there's an error, keep existing values
      // Only show error if it's not a network issue
      if (error.response) {
        message.error('Failed to load stats: ' + (error.response.data?.message || 'Server error'));
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const handleProfileUpdate = async (values) => {
    setLoading(true);
    try {
      await axios.put('/api/auth/profile', values);
      message.success('Profile updated successfully');
      setEditMode(false);
      fetchUserProfile();
    } catch (error) {
      console.error('Update profile error:', error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    setLoading(true);
    try {
      await axios.post('/api/auth/change-password', values);
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error) {
      console.error('Change password error:', error);
      message.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    let feedback = [];

    if (password.length >= 12) {
      strength += 25;
    } else {
      feedback.push('At least 12 characters');
    }

    if (/[a-z]/.test(password)) {
      strength += 15;
    } else {
      feedback.push('Lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      strength += 15;
    } else {
      feedback.push('Uppercase letter');
    }

    if (/[0-9]/.test(password)) {
      strength += 15;
    } else {
      feedback.push('Number');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      strength += 30;
    } else {
      feedback.push('Special character');
    }

    setPasswordStrength(strength);
    setPasswordStrengthText(feedback.join(', '));
  };

  const getStrengthColor = (strength) => {
    if (strength >= 80) return '#52c41a';
    if (strength >= 60) return '#faad14';
    if (strength >= 40) return '#fa8c16';
    return '#ff4d4f';
  };

  const getStrengthLabel = (strength) => {
    if (strength >= 80) return 'Strong';
    if (strength >= 60) return 'Good';
    if (strength >= 40) return 'Fair';
    return 'Weak';
  };

  const handleAvatarUpload = async (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      setLoading(false);
      setAvatarUrl(info.file.response.url);
      message.success('Avatar uploaded successfully');
    }
    if (info.file.status === 'error') {
      setLoading(false);
      message.error('Avatar upload failed');
    }
  };

  const uploadProps = {
    name: 'avatar',
    action: '/api/user/avatar',
    headers: {
      authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    showUploadList: false,
    withCredentials: true, // Include cookies in the request
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
        return false;
      }
      return true;
    },
    onChange: handleAvatarUpload,
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: darkMode ? '#1e293b' : '#fff',
          colorText: darkMode ? '#cbd5e1' : '#374151',
          colorBorder: darkMode ? '#334155' : '#e5e7eb',
          colorBgElevated: darkMode ? '#1e293b' : '#fff',
          colorTextPlaceholder: darkMode ? '#64748b' : '#bfbfbf',
        },
      }}
    >
      <div style={{ padding: isMobile ? '16px' : '24px' }}>
        <Title level={isMobile ? 4 : 3} style={{ marginBottom: isMobile ? 16 : 24, fontSize: isMobile ? 20 : 24, color: darkMode ? '#f1f5f9' : '#111827' }}>
          <UserOutlined /> User Profile
        </Title>

        <Row gutter={[isMobile ? 16 : 24, isMobile ? 16 : 24]}>
          <Col xs={24} sm={24} md={8} lg={8}>
            <Card
              style={{
                borderRadius: 12,
                border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
                boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Upload {...uploadProps} showUploadList={false}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar 
                      size={isMobile ? 80 : 120} 
                      src={avatarUrl} 
                      icon={<UserOutlined />}
                      style={{ cursor: 'pointer' }}
                    />
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        background: '#1890ff',
                        borderRadius: '50%',
                        width: isMobile ? 24 : 32,
                        height: isMobile ? 24 : 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <CameraOutlined style={{ color: '#fff', fontSize: isMobile ? 12 : 14 }} />
                    </div>
                  </div>
                </Upload>
                
                <Title level={isMobile ? 5 : 4} style={{ marginTop: isMobile ? 12 : 16, fontSize: isMobile ? 16 : 18, color: darkMode ? '#f1f5f9' : '#111827' }}>
                  {user?.first_name} {user?.last_name}
                </Title>
                <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14, color: darkMode ? '#94a3b8' : '#6B7280' }}>{user?.email}</Text>
                
                <Divider />
                
                <Descriptions column={1} size={isMobile ? 'small' : 'middle'}>
                  <Descriptions.Item label="Role">
                    <Tag color="blue" style={{ fontSize: isMobile ? 11 : 14 }}>{user?.role || 'User'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={user?.is_active ? 'green' : 'red'} style={{ fontSize: isMobile ? 11 : 14 }}>
                      {user?.is_active ? 'Active' : 'Inactive'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Member Since">
                    <Text style={{ fontSize: isMobile ? 11 : 14, color: darkMode ? '#cbd5e1' : '#111827' }}>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </Card>

            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Quick Stats</span>
                  <Button
                    type="text"
                    size="small"
                    icon={<ReloadOutlined spin={statsLoading} />}
                    onClick={fetchUserStats}
                    disabled={statsLoading}
                    style={{ color: darkMode ? '#94a3b8' : '#6B7280' }}
                  />
                </div>
              }
              style={{ 
                marginTop: 16,
                borderRadius: 12,
                border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
                boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
              }}
              loading={statsLoading}
            >
              <Row gutter={isMobile ? 12 : 16}>
                <Col span={12}>
                  <Statistic title="Content Created" value={stats.contentCreated} valueStyle={{ fontSize: isMobile ? 20 : 24, color: darkMode ? '#f1f5f9' : '#111827' }} />
                </Col>
                <Col span={12}>
                  <Statistic title="Total Views" value={stats.totalViews} valueStyle={{ fontSize: isMobile ? 20 : 24, color: darkMode ? '#f1f5f9' : '#111827' }} />
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} sm={24} md={16} lg={16}>
            <Card
              style={{
                borderRadius: 12,
                border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
                boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'profile',
                  label: <span><UserOutlined /> Profile</span>,
                  children: (
                    <>
                  <div style={{ marginBottom: isMobile ? 12 : 16 }}>
                    <Button 
                      type="primary" 
                      icon={<EditOutlined />}
                      onClick={() => setEditMode(!editMode)}
                      style={{ width: isMobile ? '100%' : 'auto' }}
                    >
                      {editMode ? 'Cancel' : 'Edit Profile'}
                    </Button>
                  </div>

                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleProfileUpdate}
                    disabled={!editMode}
                  >
                    <Row gutter={isMobile ? 12 : 16}>
                      <Col xs={24} sm={24} md={12}>
                        <Form.Item
                          name="first_name"
                          label="First Name"
                          rules={[{ required: true, message: 'First name is required' }]}
                        >
                          <Input prefix={<UserOutlined />} style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#111827', borderColor: darkMode ? '#334155' : '#e5e7eb' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={24} md={12}>
                        <Form.Item
                          name="last_name"
                          label="Last Name"
                          rules={[{ required: true, message: 'Last name is required' }]}
                        >
                          <Input prefix={<UserOutlined />} style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#111827', borderColor: darkMode ? '#334155' : '#e5e7eb' }} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="email"
                      label="Email Address"
                      rules={[
                        { required: true, message: 'Email is required' },
                        { type: 'email', message: 'Invalid email format' }
                      ]}
                    >
                      <Input prefix={<MailOutlined />} disabled style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#111827', borderColor: darkMode ? '#334155' : '#e5e7eb' }} />
                    </Form.Item>

                    <Form.Item
                      name="phone"
                      label="Phone Number"
                    >
                      <Input prefix={<PhoneOutlined />} placeholder="+1 (555) 000-0000" style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#111827', borderColor: darkMode ? '#334155' : '#e5e7eb' }} />
                    </Form.Item>

                    {editMode && (
                      <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} style={{ width: isMobile ? '100%' : 'auto' }}>
                          Save Changes
                        </Button>
                      </Form.Item>
                    )}
                  </Form>
               </>
                  ),
                },
                {
                  key: 'security',
                  label: <span><LockOutlined /> Security</span>,
                  children: (
                    <>
                  <Alert
                    title="Password Requirements"
                    description="Your password must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters."
                    type="info"
                    showIcon
                    style={{ marginBottom: isMobile ? 16 : 24 }}
                  />

                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handlePasswordChange}
                  >
                    <Form.Item
                      name="current_password"
                      label="Current Password"
                      rules={[{ required: true, message: 'Current password is required' }]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="Enter current password" style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#111827', borderColor: darkMode ? '#334155' : '#e5e7eb' }} />
                    </Form.Item>

                    <Form.Item
                      name="new_password"
                      label="New Password"
                      rules={[{ required: true, message: 'New password is required' }]}
                    >
                      <Input.Password 
                        prefix={<KeyOutlined />} 
                        placeholder="Enter new password"
                        onChange={(e) => calculatePasswordStrength(e.target.value)}
                        style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#111827', borderColor: darkMode ? '#334155' : '#e5e7eb' }}
                      />
                    </Form.Item>

                    {passwordStrength > 0 && (
                      <div style={{ marginBottom: isMobile ? 12 : 16 }}>
                        <Space orientation="vertical" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: isMobile ? 12 : 14, color: darkMode ? '#cbd5e1' : '#111827' }}>Password Strength:</Text>
                            <Text strong style={{ color: getStrengthColor(passwordStrength), fontSize: isMobile ? 12 : 14 }}>
                              {getStrengthLabel(passwordStrength)}
                            </Text>
                          </div>
                          <div style={{ height: 8, background: darkMode ? '#334155' : '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${passwordStrength}%`, 
                                background: getStrengthColor(passwordStrength),
                                transition: 'width 0.3s ease'
                              }} 
                            />
                          </div>
                          {passwordStrength < 100 && (
                            <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12, color: darkMode ? '#94a3b8' : '#6B7280' }}>
                              Missing: {passwordStrengthText}
                            </Text>
                          )}
                        </Space>
                      </div>
                    )}

                    <Form.Item
                      name="confirm_password"
                      label="Confirm New Password"
                      dependencies={['new_password']}
                      rules={[
                        { required: true, message: 'Please confirm your password' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('new_password') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Passwords do not match'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#111827', borderColor: darkMode ? '#334155' : '#e5e7eb' }} />
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading} style={{ width: isMobile ? '100%' : 'auto' }}>
                        Change Password
                      </Button>
                    </Form.Item>
                  </Form>
                </>
                  ),
                },
                {
                  key: 'sessions',
                  label: <span><SafetyOutlined /> Sessions</span>,
                  children: (
                    <>
                  <Alert
                    title="Active Sessions"
                    description="Manage your active sessions across devices. Revoking a session will log you out from that device."
                    type="info"
                    showIcon
                    style={{ marginBottom: isMobile ? 16 : 24 }}
                  />
                  <SessionManagement />
              </>
                  ),
                },
                {
                  key: 'activity',
                  label: <span><ClockCircleOutlined /> Activity</span>,
                  children: (
                    <>
                  <Alert
                    title="Recent Activity"
                    description="View your recent login and account activity."
                    type="info"
                    showIcon
                    style={{ marginBottom: isMobile ? 16 : 24 }}
                  />
                  <LoginHistory />
                </>
                  ),
                },
              ]}
            />
          </Card>
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  );
};

export default UserProfile;
