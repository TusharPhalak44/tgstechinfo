import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Button, Avatar, Upload, 
  Typography, Space, Divider, Row, Col, 
  message, Tabs, Tag, Alert, ConfigProvider, Tooltip
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
  ClockCircleOutlined,
  ReloadOutlined,
  CrownOutlined,
  EyeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  FireOutlined,
  SettingOutlined
} from '@ant-design/icons';
import axios from 'axios';
import SessionManagement from '../admin/SessionManagement';
import LoginHistory from './LoginHistory';
import { useTheme } from '../../context/ThemeContext';

const { Text } = Typography;

/* ─────────────────────────────────────────────
   STYLING SYSTEM & ANIMATIONS (Dashboard Parity)
───────────────────────────────────────────── */
const profileStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

  .prof-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    animation: profFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  @keyframes profFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .prof-stagger-1 { animation: profSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .prof-stagger-2 { animation: profSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.10s both; }
  .prof-stagger-3 { animation: profSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }

  @keyframes profSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .prof-beacon-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #10B981;
    position: relative;
    display: inline-block;
  }
  .prof-beacon-dot::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 2px solid #10B981;
    animation: profPulse 2s ease-out infinite;
  }
  @keyframes profPulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .prof-kpi-card {
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
  .prof-kpi-card:hover {
    transform: translateY(-3px);
  }

  .prof-hero-cover {
    border-radius: 20px;
    position: relative;
    overflow: hidden;
    padding: 32px 36px;
    box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.2);
    margin-bottom: 24px;
    backdrop-filter: blur(16px);
  }

  .prof-avatar-ring {
    position: relative;
    border-radius: 50%;
    padding: 4px;
    background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%);
    box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
    transition: transform 0.3s ease;
  }
  .prof-avatar-ring:hover {
    transform: scale(1.03);
  }
`;

const UserProfile = () => {
  const { darkMode } = useTheme();
  const D = darkMode;

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
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await axios.get('/api/user/stats');
      setStats({
        contentCreated: response.data.contentCreated || 0,
        totalViews: response.data.totalViews || 0
      });
    } catch (error) {
      console.error('Fetch user stats error:', error);
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
      setPasswordStrength(0);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    let feedback = [];

    if (password.length >= 12) strength += 25;
    else feedback.push('12+ characters');

    if (/[a-z]/.test(password)) strength += 15;
    else feedback.push('Lowercase');

    if (/[A-Z]/.test(password)) strength += 15;
    else feedback.push('Uppercase');

    if (/[0-9]/.test(password)) strength += 15;
    else feedback.push('Number');

    if (/[^a-zA-Z0-9]/.test(password)) strength += 30;
    else feedback.push('Symbol');

    setPasswordStrength(strength);
    setPasswordStrengthText(feedback.join(', '));
  };

  const getStrengthColor = (strength) => {
    if (strength >= 80) return '#10B981';
    if (strength >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const uploadProps = {
    name: 'avatar',
    action: '/api/user/avatar',
    headers: {
      authorization: `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`,
    },
    showUploadList: false,
    withCredentials: true,
    onChange: (info) => {
      if (info.file.status === 'done') {
        setAvatarUrl(info.file.response.url);
        message.success('Avatar uploaded successfully');
      }
    },
  };

  const StatCard = ({ title, value, icon, color = 'primary', accentColor, subtitle }) => {
    const colorMap = {
      primary: { bg: D ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.08)', text: '#8B5CF6', border: 'rgba(139, 92, 246, 0.3)' },
      success: { bg: D ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
      warning: { bg: D ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
      info: { bg: D ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' },
    };
    const c = colorMap[color] || colorMap.primary;

    return (
      <div
        className="prof-kpi-card"
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
      <style>{profileStyles}</style>

      <div className="prof-root" style={{ padding: '24px 28px', background: D ? '#0A1229' : '#F8FAFC', minHeight: '100vh' }}>
        
        {/* ── HIGH-IMPACT EXECUTIVE COVER HERO BANNER ── */}
        <div
          className="prof-hero-cover prof-stagger-1"
          style={{
            background: D
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)'
              : 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
            border: `1px solid ${D ? 'rgba(51, 65, 85, 0.8)' : 'rgba(99, 102, 241, 0.3)'}`,
            color: '#FFFFFF',
          }}
        >
          {/* Subtle background glow */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              
              {/* Glowing Avatar Overlay */}
              <div className="prof-avatar-ring">
                <Upload {...uploadProps}>
                  <div style={{ position: 'relative', cursor: 'pointer' }}>
                    <Avatar
                      size={110}
                      src={avatarUrl}
                      icon={<UserOutlined />}
                      style={{ background: '#1E293B', color: '#8B5CF6', border: '3px solid #0F172A' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        background: '#8B5CF6',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFF',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                        border: '2px solid #0F172A',
                      }}
                    >
                      <CameraOutlined style={{ fontSize: 14 }} />
                    </div>
                  </div>
                </Upload>
              </div>

              {/* User Identity Details */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span className="prof-beacon-dot" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#10B981' }}>
                    Verified Account Active
                  </span>
                  <Tag
                    color={user?.role === 'admin' ? 'purple' : 'blue'}
                    style={{ borderRadius: 6, fontWeight: 800, padding: '2px 10px', fontSize: '0.72rem', margin: 0, textTransform: 'uppercase' }}
                  >
                    {user?.role === 'admin' ? <CrownOutlined /> : <IdcardOutlined />} {user?.role || 'USER'}
                  </Tag>
                </div>

                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                  {user?.first_name || 'Executive'} {user?.last_name || 'User'}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>
                  <MailOutlined style={{ marginRight: 6, color: '#8B5CF6' }} /> {user?.email}
                </p>
              </div>
            </div>

            <Space size={12}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => { fetchUserProfile(); fetchUserStats(); }}
                style={{
                  borderRadius: 10,
                  height: 42,
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 700,
                }}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => { setEditMode(!editMode); setActiveTab('profile'); }}
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  height: 42,
                  padding: '0 22px',
                  boxShadow: '0 6px 18px rgba(139, 92, 246, 0.4)',
                }}
              >
                {editMode ? 'Cancel Edit' : 'Edit Profile'}
              </Button>
            </Space>
          </div>
        </div>

        {/* ── EXECUTIVE KPI GRID ── */}
        <div
          className="prof-stagger-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard title="Articles Published" value={stats.contentCreated} icon={<FileTextOutlined />} color="primary" accentColor="#8B5CF6" subtitle="Authored Content Assets" />
          <StatCard title="Total Article Readers" value={stats.totalViews} icon={<EyeOutlined />} color="info" accentColor="#3B82F6" subtitle="Cumulative Content Impressions" />
          <StatCard title="Security Status" value="100%" icon={<SafetyCertificateOutlined />} color="success" accentColor="#10B981" subtitle="Two-Factor Verified" />
          <StatCard title="Member Since" value={user?.created_at ? new Date(user.created_at).getFullYear() : '2026'} icon={<FireOutlined />} color="warning" accentColor="#F59E0B" subtitle="Active Account Tenure" />
        </div>

        {/* ── MAIN TABBED WORKSPACE CONTAINER ── */}
        <div
          className="prof-stagger-3"
          style={{
            background: D ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
            borderRadius: 20,
            border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
            padding: '24px 28px',
            boxShadow: D ? '0 12px 32px -4px rgba(0, 0, 0, 0.4)' : '0 12px 32px -4px rgba(11, 31, 77, 0.05)',
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'profile',
                label: <span style={{ fontWeight: 800, fontSize: '0.9rem' }}><UserOutlined /> Personal Identity</span>,
                children: (
                  <div style={{ maxWidth: 680, marginTop: 12 }}>
                    <Form form={form} layout="vertical" onFinish={handleProfileUpdate} disabled={!editMode}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="first_name" label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>First Name</span>} rules={[{ required: true }]}>
                            <Input prefix={<UserOutlined style={{ color: '#8B5CF6' }} />} style={{ borderRadius: 10, height: 42 }} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="last_name" label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Last Name</span>} rules={[{ required: true }]}>
                            <Input prefix={<UserOutlined style={{ color: '#8B5CF6' }} />} style={{ borderRadius: 10, height: 42 }} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item name="email" label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Email Address (Primary User Key)</span>}>
                        <Input prefix={<MailOutlined style={{ color: '#8B5CF6' }} />} disabled style={{ borderRadius: 10, height: 42 }} />
                      </Form.Item>

                      <Form.Item name="phone" label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Contact Phone Number</span>}>
                        <Input prefix={<PhoneOutlined style={{ color: '#8B5CF6' }} />} placeholder="+1 (555) 000-0000" style={{ borderRadius: 10, height: 42 }} />
                      </Form.Item>

                      {editMode && (
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={loading}
                          style={{
                            background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
                            border: 'none',
                            borderRadius: 10,
                            fontWeight: 800,
                            height: 42,
                            padding: '0 24px',
                            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
                          }}
                        >
                          Save Changes
                        </Button>
                      )}
                    </Form>
                  </div>
                ),
              },
              {
                key: 'security',
                label: <span style={{ fontWeight: 800, fontSize: '0.9rem' }}><LockOutlined /> Password & Security</span>,
                children: (
                  <div style={{ maxWidth: 680, marginTop: 12 }}>
                    <Alert
                      message="Security Guidelines"
                      description="To maintain optimal account protection, ensure your password is at least 12 characters and includes numbers, symbols, and uppercase letters."
                      type="info"
                      showIcon
                      style={{ marginBottom: 20, borderRadius: 12 }}
                    />

                    <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
                      <Form.Item name="current_password" label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Current Password</span>} rules={[{ required: true }]}>
                        <Input.Password prefix={<LockOutlined style={{ color: '#8B5CF6' }} />} style={{ borderRadius: 10, height: 42 }} />
                      </Form.Item>

                      <Form.Item name="new_password" label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>New Password</span>} rules={[{ required: true }]}>
                        <Input.Password
                          prefix={<KeyOutlined style={{ color: '#8B5CF6' }} />}
                          onChange={(e) => calculatePasswordStrength(e.target.value)}
                          style={{ borderRadius: 10, height: 42 }}
                        />
                      </Form.Item>

                      {passwordStrength > 0 && (
                        <div style={{ marginBottom: 18 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B' }}>Password Strength:</span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: getStrengthColor(passwordStrength) }}>
                              {passwordStrength}%
                            </span>
                          </div>
                          <div style={{ height: 6, background: D ? '#334155' : '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${passwordStrength}%`, background: getStrengthColor(passwordStrength), transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      )}

                      <Form.Item
                        name="confirm_password"
                        label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Confirm New Password</span>}
                        dependencies={['new_password']}
                        rules={[
                          { required: true },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                              return Promise.reject(new Error('Passwords do not match'));
                            },
                          }),
                        ]}
                      >
                        <Input.Password prefix={<LockOutlined style={{ color: '#8B5CF6' }} />} style={{ borderRadius: 10, height: 42 }} />
                      </Form.Item>

                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        style={{
                          background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
                          border: 'none',
                          borderRadius: 10,
                          fontWeight: 800,
                          height: 42,
                          padding: '0 24px',
                        }}
                      >
                        Update Account Password
                      </Button>
                    </Form>
                  </div>
                ),
              },
              {
                key: 'sessions',
                label: <span style={{ fontWeight: 800, fontSize: '0.9rem' }}><SafetyOutlined /> Active Session Terminals</span>,
                children: (
                  <div style={{ marginTop: 12 }}>
                    <SessionManagement />
                  </div>
                ),
              },
              {
                key: 'activity',
                label: <span style={{ fontWeight: 800, fontSize: '0.9rem' }}><ClockCircleOutlined /> Login Activity History</span>,
                children: (
                  <div style={{ marginTop: 12 }}>
                    <LoginHistory />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default UserProfile;
