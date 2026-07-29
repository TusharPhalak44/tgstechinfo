import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await axios.post('/api/auth/forgot-password', values);
      setSubmitted(true);
      message.success('Password reset link sent to your email');
    } catch {
      message.error('Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-6" style={{ background: darkMode ? '#0f172a' : 'linear-gradient(to bottom right, #eff6ff, #f0f9ff, #faf5ff)' }}>
      <Card className="w-full max-w-[420px] rounded-2xl shadow-[0_20px_60px_rgba(74,124,255,0.15)] border border-white/50 backdrop-blur-sm" style={{ background: darkMode ? '#1e293b' : 'rgba(255,255,255,0.95)' }}>
        <div className="text-center px-2">
          <Title level={2} className="!text-2xl !font-bold !mb-2" style={{ color: darkMode ? '#f1f5f9' : '#1a1a2e' }}>Reset Password</Title>
          <Text className="text-sm" style={{ color: darkMode ? '#94a3b8' : '#6c6c80' }}>Enter your email to receive a reset link</Text>
        </div>

        {!submitted ? (
          <Form onFinish={onFinish} layout="vertical" className="py-4">
            <Form.Item name="email" label="Email Address"
              rules={[{ required: true, message: 'Please enter your email' }, { type: 'email', message: 'Please enter a valid email' }]}
            >
              <Input prefix={<MailOutlined style={{ color: darkMode ? '#94a3b8' : '#9ca3af' }} />} placeholder="you@example.com"
                size="large" style={{ borderRadius: 10, height: 44, borderColor: darkMode ? '#475569' : '#e5e7eb', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#f1f5f9' : '#000' }}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading} size="large"
                style={{ background: 'linear-gradient(135deg, #4a7cff 0%, #6c5ce7 100%)', border: 'none', height: 48, borderRadius: 12, fontSize: 16, fontWeight: 600, boxShadow: '0 4px 12px rgba(74,124,255,0.3)' }}
              >
                Send Reset Link
              </Button>
            </Form.Item>

            <div className="text-center">
              <Link to="/login" className="text-primary-500 text-sm font-medium">
                <ArrowLeftOutlined /> Back to Sign In
              </Link>
            </div>
          </Form>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl" style={{ background: darkMode ? 'rgba(34, 197, 94, 0.2)' : '#d3f0df' }}>✅</div>
            <Title level={4} style={{ color: darkMode ? '#86efac' : '#166534' }}>Check Your Email</Title>
            <Text style={{ color: darkMode ? '#94a3b8' : '#6c6c80' }}>We've sent a password reset link to your email address.</Text>
            <div className="mt-6">
              <Button type="primary" onClick={() => setSubmitted(false)} size="large"
                style={{ borderRadius: 12, height: 44, borderColor: '#4a7cff', color: '#4a7cff', background: 'transparent' }}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
