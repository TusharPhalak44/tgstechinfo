import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Card } from 'antd';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

const ResetPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  const onFinish = async ({ password, confirmPassword }) => {
    if (password !== confirmPassword) {
      form.setFields([{ name: 'confirmPassword', errors: ['Passwords do not match'] }]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24,
      background: 'linear-gradient(135deg, #EAF2FF 0%, #f8f0ff 100%)'
    }}>
      <Card style={{
        width: '100%', maxWidth: 440, borderRadius: 20,
        boxShadow: '0 20px 60px rgba(74,124,255,0.15)',
        border: '1px solid rgba(255,255,255,0.5)'
      }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#d3f0df', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 32
            }}>
              <CheckCircleOutlined style={{ color: '#16a34a' }} />
            </div>
            <Title level={3} style={{ color: '#16a34a', marginBottom: 8 }}>Password Reset!</Title>
            <Text style={{ color: '#6c6c80', display: 'block', marginBottom: 24 }}>
              Your password has been updated. Redirecting to login...
            </Text>
            <Link to="/login">
              <Button type="primary" size="large" style={{
                borderRadius: 12, height: 48, padding: '0 32px',
                background: 'linear-gradient(135deg, #4a7cff 0%, #6c5ce7 100%)',
                border: 'none'
              }}>
                Go to Login
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'linear-gradient(135deg, #4a7cff 0%, #6c5ce7 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 24
              }}>
                <LockOutlined style={{ color: '#fff' }} />
              </div>
              <Title level={2} style={{ marginBottom: 4, fontSize: 24 }}>Set New Password</Title>
              <Text style={{ color: '#6c6c80', fontSize: 14 }}>
                Choose a strong password for your account
              </Text>
            </div>

            {error && (
              <div style={{
                background: '#fff2f0', border: '1px solid #ffccc7',
                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                color: '#cf1322', fontSize: 13
              }}>
                {error}
              </div>
            )}

            {!token ? (
              <div style={{ textAlign: 'center', paddingBottom: 8 }}>
                <Link to="/forgot-password">
                  <Button type="primary" size="large" style={{
                    borderRadius: 12, height: 48,
                    background: 'linear-gradient(135deg, #4a7cff 0%, #6c5ce7 100%)',
                    border: 'none'
                  }}>
                    Request New Reset Link
                  </Button>
                </Link>
              </div>
            ) : (
              <Form form={form} onFinish={onFinish} layout="vertical" size="large">
                <Form.Item
                  name="password"
                  label="New Password"
                  rules={[
                    { required: true, message: 'Please enter a new password' },
                    { min: 12, message: 'Password must be at least 12 characters' },
                    {
                      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
                      message: 'Must include uppercase, lowercase, number & special character'
                    }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                    placeholder="New password (min 12 characters)"
                    style={{ borderRadius: 10, height: 44 }}
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Confirm Password"
                  rules={[
                    { required: true, message: 'Please confirm your password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) return Promise.resolve();
                        return Promise.reject(new Error('Passwords do not match'));
                      }
                    })
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                    placeholder="Confirm new password"
                    style={{ borderRadius: 10, height: 44 }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 12 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                    size="large"
                    style={{
                      height: 48, borderRadius: 12, fontSize: 16, fontWeight: 600,
                      background: 'linear-gradient(135deg, #4a7cff 0%, #6c5ce7 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(74,124,255,0.3)'
                    }}
                  >
                    Reset Password
                  </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                  <Link to="/login" style={{ fontSize: 13, color: '#6c6c80' }}>
                    Back to Login
                  </Link>
                </div>
              </Form>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
