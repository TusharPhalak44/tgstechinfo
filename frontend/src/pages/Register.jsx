import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import {
  UserOutlined, LockOutlined, MailOutlined, PhoneOutlined,
  ThunderboltOutlined, ArrowRightOutlined,
  EyeInvisibleOutlined, EyeTwoTone, CheckCircleFilled
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PERKS = [
  { icon: '📰', text: 'Access 500+ exclusive articles' },
  { icon: '🎙️', text: 'Expert interviews & podcasts' },
  { icon: '📧', text: 'Weekly tech digest newsletter' },
  { icon: '🏆', text: 'Publish your own content' },
];

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await register({
        first_name: values.firstName, last_name: values.lastName,
        email: values.email, password: values.password, role: 'user'
      });
      if (result.success) {
        message.success('Welcome to TGS Tech Info!');
        navigate('/');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .auth-input .ant-input, .auth-input .ant-input-password {
          border-radius: 8px !important; height: 36px !important;
          border-color: #e2e8f0 !important; font-size: 13px !important;
        }
        .auth-input .ant-input:focus, .auth-input .ant-input-affix-wrapper:focus,
        .auth-input .ant-input-affix-wrapper-focused {
          border-color: #4a7cff !important; box-shadow: 0 0 0 2px rgba(74,124,255,.12) !important;
        }
        .auth-input .ant-input-affix-wrapper { border-radius: 8px !important; height: 36px !important; border-color: #e2e8f0 !important; font-size: 13px !important; }
        .auth-label .ant-form-item-label > label { font-weight: 600 !important; font-size: 12px !important; color: #374151 !important; }
        .auth-label .ant-form-item { margin-bottom: 10px !important; }
        @media (max-width: 768px) { .auth-left { display: none !important; } }
      `}</style>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 61px)', background: '#f1f5f9' }}>

        {/* ── LEFT PANEL ── */}
        <div className="auth-left" style={{
          flex: 1, flexShrink: 0,
          background: 'linear-gradient(145deg, #0a1628 0%, #0f2044 50%, #1a1060 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          padding: '40px 48px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(74,124,255,.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(108,92,231,.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: .03, backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '36px 36px', pointerEvents: 'none' }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, alignSelf: 'flex-start' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#4a7cff,#6c5ce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(74,124,255,.4)' }}>
              <ThunderboltOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#fff', lineHeight: 1.1 }}>
                TGS <span style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tech Info</span>
              </div>
              <div style={{ fontSize: 10, color: '#475569', letterSpacing: 1.5, textTransform: 'uppercase' }}>Tech Intelligence Hub</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00b894', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Join Free Today</div>
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, lineHeight: 1.2, margin: '0 0 12px', letterSpacing: -.5 }}>
              Join 50,000+ <span style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tech Professionals</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.7, margin: '0 auto 24px', maxWidth: 280 }}>
              Get exclusive content, expert insights, and the latest tech news — completely free.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginBottom: 24 }}>
            {PERKS.map(p => (
              <div key={p.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(0,184,148,.12)', border: '1px solid rgba(0,184,148,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                  {p.icon}
                </div>
                <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{p.text}</span>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', width: '100%' }}>
            {[['🔒', 'Secure'], ['✅', 'Free Forever'], ['🚫', 'No Spam']].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>

            {/* Header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#00b894,#00cec9)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: '0 6px 20px rgba(0,184,148,.3)' }}>
                <UserOutlined style={{ color: '#fff', fontSize: 20 }} />
              </div>
              <h2 style={{ fontWeight: 900, fontSize: 22, color: '#0f172a', margin: '0 0 4px', letterSpacing: -.5 }}>Create Account</h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Join the TGS Tech Info community today</p>
            </div>

            {/* Form */}
            <Form form={form} name="register" onFinish={onFinish} layout="vertical">

              <div style={{ display: 'flex', gap: 12 }}>
                <Form.Item name="firstName" label="First Name" className="auth-label" style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Required' }]}
                >
                <Input className="auth-input" prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="John" />
                </Form.Item>
                <Form.Item name="lastName" label="Last Name" className="auth-label" style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Required' }]}
                >
                <Input className="auth-input" prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="Doe" />
                </Form.Item>
              </div>

              <Form.Item name="email" label="Email Address" className="auth-label"
                rules={[{ required: true, message: 'Please enter your email' }, { type: 'email', message: 'Invalid email' }]}
              >
                <Input className="auth-input" prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="you@example.com" />
              </Form.Item>

              <Form.Item name="phone" label="Phone Number (Optional)" className="auth-label">
                <Input className="auth-input" prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />} placeholder="+1 234 567 8900" />
              </Form.Item>

              <Form.Item name="password" label="Password" className="auth-label"
                rules={[
                  { required: true, message: 'Please enter a password' },
                  { min: 6, message: 'At least 6 characters' },
                  { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Must include uppercase, lowercase & number' }
                ]}
              >
                <Input.Password className="auth-input" prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Create a strong password"
                  iconRender={v => v ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                />
              </Form.Item>

              <Form.Item name="confirmPassword" label="Confirm Password" className="auth-label"
                dependencies={['password']}
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
                <Input.Password className="auth-input" prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Confirm your password"
                  iconRender={v => v ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                />
              </Form.Item>

              <Form.Item name="agreement" valuePropName="checked" style={{ marginBottom: 20 }}
                rules={[{ validator: (_, v) => v ? Promise.resolve() : Promise.reject(new Error('Please agree to continue')) }]}
              >
                <Checkbox style={{ fontSize: 13, color: '#374151' }}>
                  I agree to the{' '}
                  <Link to="/terms-of-use" style={{ color: '#4a7cff', fontWeight: 600 }}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy-policy" style={{ color: '#4a7cff', fontWeight: 600 }}>Privacy Policy</Link>
                </Checkbox>
              </Form.Item>

              <Form.Item style={{ marginBottom: 16 }}>
                <button type="submit" disabled={loading} style={{
                  width: '100%', height: 40, borderRadius: 8, border: 'none',
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg,#00b894,#00cec9)',
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 3px 10px rgba(0,184,148,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'opacity .2s'
                }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '.9'; }}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {loading ? 'Creating account...' : <><span>Create Free Account</span><ArrowRightOutlined style={{ fontSize: 11 }} /></>}
                </button>
              </Form.Item>
            </Form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 16px' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>OR SIGN UP WITH</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            {/* Social */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              {[
                { label: 'Google', color: '#ea4335', bg: '#fff5f5', border: '#fecaca' },
                { label: 'Facebook', color: '#1877f2', bg: '#eff6ff', border: '#bfdbfe' },
                { label: 'LinkedIn', color: '#0077b5', bg: '#f0f9ff', border: '#bae6fd' },
              ].map(s => (
                <button key={s.label} style={{
                  flex: 1, height: 42, borderRadius: 10, border: `1.5px solid ${s.border}`,
                  background: s.bg, color: s.color, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'transform .15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 14, color: '#64748b' }}>Already have an account? </span>
              <Link to="/login" style={{ fontSize: 14, color: '#4a7cff', fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
