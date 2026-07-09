import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox } from 'antd';
import {
  UserOutlined, LockOutlined, MailOutlined,
  ArrowRightOutlined,
  EyeInvisibleOutlined, EyeTwoTone
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: '🤖', text: 'AI & Machine Learning insights' },
  { icon: '🔐', text: 'Cybersecurity news & analysis' },
  { icon: '☁️', text: 'Cloud computing resources' },
  { icon: '📊', text: 'Data analytics deep-dives' },
];

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate(user?.role === 'admin' ? '/admin' : '/dashboard');
  }, [isAuthenticated, user, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.email, values.password);
      if (result.success) {
        if (values.remember) localStorage.setItem('rememberedEmail', values.email);
        else localStorage.removeItem('rememberedEmail');
        navigate(result.user.role === 'admin' ? '/admin' : '/dashboard');
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
        .auth-label { margin-bottom: 12px !important; }
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
          {/* bg circles */}
          <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(74,124,255,.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(108,92,231,.08)', pointerEvents: 'none' }} />
          {/* grid */}
          <div style={{ position: 'absolute', inset: 0, opacity: .03, backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '36px 36px', pointerEvents: 'none' }} />

          {/* Logo */}
          <div style={{ marginBottom: 36, alignSelf: 'flex-start' }}>
            <img src="/logo.jpg" alt="TGS Tech Info" style={{ height: 64, width: 'auto', display: 'block', borderRadius: 10 }} />
          </div>

          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4a7cff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Welcome Back</div>
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 28, lineHeight: 1.2, margin: '0 0 12px', letterSpacing: -.5 }}>
              Your Tech <span style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intelligence</span> Awaits
            </h1>
            <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.7, marginBottom: 28, maxWidth: 300, margin: '0 auto 24px' }}>
              Sign in to access exclusive articles, expert interviews, and the latest tech insights.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginBottom: 24 }}>
            {FEATURES.map(f => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(74,124,255,.15)', border: '1px solid rgba(74,124,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '14px 18px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, fontStyle: 'italic' }}>
              "500+ tech experts. Weekly insights. Always free."
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
          <div style={{ width: '100%', maxWidth: 400 }}>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#4a7cff,#6c5ce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: '0 6px 20px rgba(74,124,255,.3)' }}>
                <UserOutlined style={{ color: '#fff', fontSize: 20 }} />
              </div>
              <h2 style={{ fontWeight: 900, fontSize: 24, color: '#0f172a', margin: '0 0 4px', letterSpacing: -.5 }}>Sign In</h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Enter your credentials to access your account</p>
            </div>

            {/* Form */}
            <Form name="login" onFinish={onFinish} layout="vertical">
              <Form.Item name="email" label="Email Address" className="auth-label"
                rules={[{ required: true, message: 'Please enter your email' }, { type: 'email', message: 'Invalid email' }]}
              >
                <Input className="auth-input" prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="you@example.com" />
              </Form.Item>

              <Form.Item name="password" label="Password" className="auth-label"
                rules={[{ required: true, message: 'Please enter your password' }]}
              >
                <Input.Password className="auth-input" prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Enter your password"
                  iconRender={v => v ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox style={{ fontSize: 13, color: '#374151' }}>Remember me</Checkbox>
                </Form.Item>
                <Link to="/forgot-password" style={{ fontSize: 13, color: '#4a7cff', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link>
              </div>

              <Form.Item>
                <button type="submit" disabled={loading} style={{
                  width: '100%', height: 40, borderRadius: 8, border: 'none',
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg,#4a7cff,#6c5ce7)',
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 3px 10px rgba(74,124,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'opacity .2s'
                }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '.9'; }}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {loading ? 'Signing in...' : <><span>Sign In</span><ArrowRightOutlined style={{ fontSize: 11 }} /></>}
                </button>
              </Form.Item>
            </Form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 20px' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>OR CONTINUE WITH</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            {/* Social */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
              {[
                { label: 'Google', color: '#ea4335', bg: '#fff5f5', border: '#fecaca', emoji: '🔴' },
                { label: 'Facebook', color: '#1877f2', bg: '#eff6ff', border: '#bfdbfe', emoji: '🔵' },
                { label: 'LinkedIn', color: '#0077b5', bg: '#f0f9ff', border: '#bae6fd', emoji: '💼' },
              ].map(s => (
                <button key={s.label} style={{
                  flex: 1, height: 44, borderRadius: 10, border: `1.5px solid ${s.border}`,
                  background: s.bg, color: s.color, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'transform .15s, box-shadow .15s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${s.border}`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Sign up link */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 14, color: '#64748b' }}>Don't have an account? </span>
              <Link to="/register" style={{ fontSize: 14, color: '#4a7cff', fontWeight: 700, textDecoration: 'none' }}>Create one free →</Link>
            </div>

            {/* Demo credentials */}
            <div style={{ background: '#f8faff', border: '1px solid #dce6ff', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4a7cff', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Demo Credentials</div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.8 }}>
                👑 <strong>Admin:</strong> admin@tgstechinfo.com / Admin@123<br />
                👤 <strong>User:</strong> user@tgstechinfo.com / User@123
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
