import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  MailOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
  SafetyCertificateOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';

const REASONS = [
  'I receive too many emails',
  'The content is no longer relevant to me',
  'I never signed up for this newsletter',
  'I prefer reading directly on the website',
  'Other reason'
];

const Unsubscribe = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'already' | 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [unsubscribedEmail, setUnsubscribedEmail] = useState(emailParam);

  // If token is present in URL, auto-process or prepare instant unsubscribe
  useEffect(() => {
    if (tokenParam) {
      handleTokenUnsubscribe(tokenParam);
    }
  }, [tokenParam]);

  const handleTokenUnsubscribe = async (token) => {
    setLoading(true);
    setStatus('loading');
    try {
      const res = await axios.get(`/api/public/newsletter/unsubscribe?token=${encodeURIComponent(token)}`);
      if (res.data.already_unsubscribed) {
        setStatus('already');
        setStatusMessage(res.data.message || 'You are already unsubscribed from our newsletter.');
      } else {
        setStatus('success');
        setStatusMessage(res.data.message || 'You have been successfully unsubscribed from our newsletter.');
      }
      if (res.data.email) {
        setUnsubscribedEmail(res.data.email);
      }
    } catch (err) {
      setStatus('error');
      setStatusMessage(err.response?.data?.message || 'Invalid or expired unsubscribe link. Please enter your email address below.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setStatusMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setStatus('loading');
    try {
      const res = await axios.post('/api/public/newsletter/unsubscribe', {
        email: email.trim(),
        reason: selectedReason === 'Other reason' ? customReason : selectedReason
      });

      if (res.data.already_unsubscribed) {
        setStatus('already');
        setStatusMessage(res.data.message || 'You are already unsubscribed from our newsletter.');
      } else {
        setStatus('success');
        setStatusMessage(res.data.message || 'You have been successfully unsubscribed from our newsletter.');
      }
      setUnsubscribedEmail(email.trim());
    } catch (err) {
      setStatus('error');
      setStatusMessage(err.response?.data?.message || 'Could not find an active subscription with this email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      padding: '40px 16px 80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: darkMode ? '#0B132B' : '#F8FAFC'
    }}>
      <div style={{
        maxWidth: 560,
        width: '100%',
        background: darkMode ? '#1E293B' : '#FFFFFF',
        borderRadius: 20,
        border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
        boxShadow: darkMode ? '0 20px 50px rgba(0,0,0,0.5)' : '0 20px 50px rgba(11,31,77,0.08)',
        padding: '36px 32px',
        position: 'relative'
      }}>

        {/* Back Link */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: darkMode ? '#94A3B8' : '#64748B',
            textDecoration: 'none',
            marginBottom: 24,
            transition: 'color .2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#F7941D'}
          onMouseLeave={e => e.currentTarget.style.color = darkMode ? '#94A3B8' : '#64748B'}
        >
          <ArrowLeftOutlined style={{ fontSize: 11 }} />
          <span>Back to TGS TechInfo Home</span>
        </Link>

        {/* Loading State */}
        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <LoadingOutlined style={{ fontSize: 42, color: '#F7941D', marginBottom: 18 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0B1F4D', marginBottom: 8 }}>
              Processing your request...
            </h2>
            <p style={{ fontSize: 14, color: darkMode ? '#94A3B8' : '#64748B' }}>
              Please wait while we update your subscription preferences.
            </p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: darkMode ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7',
              color: '#16A34A',
              fontSize: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <CheckCircleOutlined />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: darkMode ? '#F1F5F9' : '#0B1F4D', marginBottom: 10 }}>
              Unsubscribed Successfully
            </h2>

            <p style={{ fontSize: 14, color: darkMode ? '#CBD5E1' : '#475569', lineHeight: 1.6, marginBottom: 18 }}>
              {unsubscribedEmail ? (
                <>The email address <strong style={{ color: darkMode ? '#FFFFFF' : '#0B1F4D' }}>{unsubscribedEmail}</strong> has been unsubscribed from the TGS TechInfo newsletter.</>
              ) : (
                statusMessage
              )}
            </p>

            <div style={{
              background: darkMode ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
              borderRadius: 12,
              padding: '14px 16px',
              fontSize: 13,
              color: darkMode ? '#94A3B8' : '#64748B',
              marginBottom: 28,
              textAlign: 'left',
              lineHeight: 1.5
            }}>
              💡 <strong>Note:</strong> You will no longer receive our weekly tech articles, insights, and digest emails. If you ever change your mind, you can resubscribe anytime from our footer or newsletter section.
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link
                to="/"
                style={{
                  background: '#0B1F4D',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '10px 22px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        )}

        {/* Already Unsubscribed State */}
        {status === 'already' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: darkMode ? 'rgba(59, 130, 246, 0.15)' : '#E0F2FE',
              color: '#0284C7',
              fontSize: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <SafetyCertificateOutlined />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: darkMode ? '#F1F5F9' : '#0B1F4D', marginBottom: 10 }}>
              Already Unsubscribed
            </h2>

            <p style={{ fontSize: 14, color: darkMode ? '#CBD5E1' : '#475569', lineHeight: 1.6, marginBottom: 24 }}>
              {statusMessage || 'This email address is already inactive and will not receive newsletter updates.'}
            </p>

            <Link
              to="/"
              style={{
                background: '#0B1F4D',
                color: '#FFFFFF',
                textDecoration: 'none',
                padding: '10px 22px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              Return to Homepage
            </Link>
          </div>
        )}

        {/* Idle or Error State with Form */}
        {(status === 'idle' || status === 'error') && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: darkMode ? 'rgba(247, 148, 29, 0.15)' : '#FFF4E8',
                color: '#F7941D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20
              }}>
                <MailOutlined />
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: darkMode ? '#F1F5F9' : '#0B1F4D', margin: 0, lineHeight: 1.2 }}>
                  Unsubscribe from Newsletter
                </h1>
                <div style={{ fontSize: 13, color: darkMode ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                  Manage your TGS TechInfo email preferences
                </div>
              </div>
            </div>

            <p style={{ fontSize: 14, color: darkMode ? '#CBD5E1' : '#475569', lineHeight: 1.6, margin: '18px 0 22px' }}>
              We're sorry to see you go! Enter your registered email address below to unsubscribe from our newsletter, announcements, and tech digest emails.
            </p>

            {/* Error banner if present */}
            {status === 'error' && (
              <div style={{
                background: darkMode ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                border: darkMode ? '1px solid #7F1D1D' : '1px solid #FECACA',
                color: '#DC2626',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 20
              }}>
                <CloseCircleOutlined style={{ fontSize: 16, flexShrink: 0 }} />
                <span>{statusMessage}</span>
              </div>
            )}

            <form onSubmit={handleManualSubmit}>
              {/* Email Input */}
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 700,
                  color: darkMode ? '#F1F5F9' : '#0F172A',
                  marginBottom: 6
                }}>
                  Your Email Address <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: darkMode ? '1px solid #475569' : '1.5px solid #CBD5E1',
                    background: darkMode ? '#0F172A' : '#FFFFFF',
                    color: darkMode ? '#F1F5F9' : '#0F172A',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color .2s ease'
                  }}
                />
              </div>

              {/* Optional Reason Selection */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 700,
                  color: darkMode ? '#F1F5F9' : '#0F172A',
                  marginBottom: 8
                }}>
                  Reason for leaving (Optional)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {REASONS.map(r => (
                    <label
                      key={r}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 13,
                        color: darkMode ? '#CBD5E1' : '#334155',
                        cursor: 'pointer',
                        padding: '6px 8px',
                        borderRadius: 8,
                        background: selectedReason === r ? (darkMode ? 'rgba(59, 130, 246, 0.15)' : '#EAF2FF') : 'transparent',
                        transition: 'background .15s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="unsubscribe_reason"
                        value={r}
                        checked={selectedReason === r}
                        onChange={() => setSelectedReason(r)}
                        style={{ accentColor: '#F7941D' }}
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>

                {selectedReason === 'Other reason' && (
                  <textarea
                    rows={3}
                    placeholder="Tell us how we can improve (optional)..."
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: 10,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: darkMode ? '1px solid #475569' : '1px solid #CBD5E1',
                      background: darkMode ? '#0F172A' : '#FFFFFF',
                      color: darkMode ? '#F1F5F9' : '#0F172A',
                      fontSize: 13,
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 20px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all .2s ease',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#DC2626'; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#EF4444'; }}
                >
                  {loading ? 'Unsubscribing...' : 'Unsubscribe Me'}
                </button>

                <Link
                  to="/"
                  style={{
                    padding: '12px 18px',
                    borderRadius: 10,
                    border: darkMode ? '1px solid #475569' : '1px solid #CBD5E1',
                    background: 'transparent',
                    color: darkMode ? '#CBD5E1' : '#475569',
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    textAlign: 'center'
                  }}
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Unsubscribe;
