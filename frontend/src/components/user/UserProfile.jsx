import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Button, Avatar, Upload, 
  Typography, Space, Divider, Row, Col, 
  message, Modal, Tabs, Tag, Alert, Switch,
  Descriptions, Statistic
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
  ClockCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import SessionManagement from '../admin/SessionManagement';
import LoginHistory from './LoginHistory';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const UserProfile = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordStrengthText, setPasswordStrengthText] = useState('');

  useEffect(() => {
    fetchUserProfile();
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
    <div style={{ padding: '24px' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <UserOutlined /> User Profile
      </Title>

      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Upload {...uploadProps} showUploadList={false}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar 
                    size={120} 
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
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <CameraOutlined style={{ color: '#fff' }} />
                  </div>
                </div>
              </Upload>
              
              <Title level={4} style={{ marginTop: 16 }}>
                {user?.first_name} {user?.last_name}
              </Title>
              <Text type="secondary">{user?.email}</Text>
              
              <Divider />
              
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Role">
                  <Tag color="blue">{user?.role || 'User'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={user?.is_active ? 'green' : 'red'}>
                    {user?.is_active ? 'Active' : 'Inactive'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Member Since">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </div>
          </Card>

          <Card title="Quick Stats" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="Content Created" value={0} />
              </Col>
              <Col span={12}>
                <Statistic title="Total Views" value={0} />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={16}>
          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab={<span><UserOutlined /> Profile</span>} key="profile">
                <div style={{ marginBottom: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<EditOutlined />}
                    onClick={() => setEditMode(!editMode)}
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
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="first_name"
                        label="First Name"
                        rules={[{ required: true, message: 'First name is required' }]}
                      >
                        <Input prefix={<UserOutlined />} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="last_name"
                        label="Last Name"
                        rules={[{ required: true, message: 'Last name is required' }]}
                      >
                        <Input prefix={<UserOutlined />} />
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
                    <Input prefix={<MailOutlined />} disabled />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label="Phone Number"
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="+1 (555) 000-0000" />
                  </Form.Item>

                  {editMode && (
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading}>
                        Save Changes
                      </Button>
                    </Form.Item>
                  )}
                </Form>
              </TabPane>

              <TabPane tab={<span><LockOutlined /> Security</span>} key="security">
                <Alert
                  message="Password Requirements"
                  description="Your password must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters."
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
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
                    <Input.Password prefix={<LockOutlined />} placeholder="Enter current password" />
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
                    />
                  </Form.Item>

                  {passwordStrength > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text>Password Strength:</Text>
                          <Text strong style={{ color: getStrengthColor(passwordStrength) }}>
                            {getStrengthLabel(passwordStrength)}
                          </Text>
                        </div>
                        <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
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
                          <Text type="secondary" style={{ fontSize: 12 }}>
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
                    <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Change Password
                    </Button>
                  </Form.Item>
                </Form>

                <Divider />

                <div>
                  <Title level={5}>Two-Factor Authentication</Title>
                  <Space>
                    <Switch disabled />
                    <Text type="secondary">Coming Soon</Text>
                  </Space>
                </div>
              </TabPane>

              <TabPane tab={<span><SafetyOutlined /> Sessions</span>} key="sessions">
                <Alert
                  message="Active Sessions"
                  description="Manage your active sessions across devices. Revoking a session will log you out from that device."
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
                <SessionManagement />
              </TabPane>

              <TabPane tab={<span><ClockCircleOutlined /> Activity</span>} key="activity">
                <Alert
                  message="Recent Activity"
                  description="View your recent login and account activity."
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
                <LoginHistory />
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserProfile;
