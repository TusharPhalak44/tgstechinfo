import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MailOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
  SafetyCertificateOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';

const REASON_OPTIONS = [
  'I receive too many emails / Email frequency is too high',
  'The content is no longer relevant to my interests',
  'I never signed up for this newsletter',
  'Content quality or frequency did not meet expectations'
];

const Unsubscribe = () => {
  const { darkMode } = useTheme();
  const [searchParams] = useSearchParams();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(Boolean(tokenParam && !emailParam));
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'already' | 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [unsubscribedEmail, setUnsubscribedEmail] = useState(emailParam);

  // If token is present and email wasn't provided in query param, verify token read-only to pre-fill email
  useEffect(() => {
    if (tokenParam) {
      verifyToken(tokenParam);
    }
  }, [tokenParam]);

  const verifyToken = async (token) => {
    try {
      setVerifying(true);
      const res = await axios.get(`/api/public/newsletter/unsubscribe?token=${encodeURIComponent(token)}&verify=1`);
      if (res.data) {
        if (res.data.is_active === 0) {
          setStatus('already');
          setStatusMessage('This email address is already unsubscribed from our newsletter.');
        }
        if (res.data.email) {
          setEmail(res.data.email);
          setUnsubscribedEmail(res.data.email);
        }
      }
    } catch {
      // If token verification fails, allow manual entry
    } finally {
      setVerifying(false);
    }
  };

  const toggleReason = (reason) => {
    setSelectedReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const targetEmail = (email || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setStatus('error');
      setStatusMessage('Please enter a valid email address.');
      return;
    }

    // Require either at least one checkbox selected OR text in the custom input
    if (selectedReasons.length === 0 && !customReason.trim()) {
      setStatus('error');
      setStatusMessage('Please select at least one reason or enter your feedback before unsubscribing.');
      return;
    }

    setLoading(true);
    setStatus('loading');

    try {
      const reasonsList = [...selectedReasons];
      if (customReason.trim()) {
        reasonsList.push(`Other: ${customReason.trim()}`);
      }
      const combinedReason = reasonsList.join('; ');

      const res = await axios.post('/api/public/newsletter/unsubscribe', {
        token: tokenParam || undefined,
        email: targetEmail,
        reason: combinedReason
      });

      if (res.data.already_unsubscribed) {
        setStatus('already');
        setStatusMessage(res.data.message || 'You are already unsubscribed from our newsletter.');
      } else {
        setStatus('success');
        setStatusMessage(res.data.message || 'You have been successfully unsubscribed from our newsletter.');
      }
      setUnsubscribedEmail(targetEmail);
    } catch (err) {
      setStatus('error');
      setStatusMessage(err.response?.data?.message || 'Could not process unsubscribe request. Please verify your email and try again.');
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
        maxWidth: 620,
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

        {/* Verifying Link State */}
        {verifying && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <LoadingOutlined style={{ fontSize: 40, color: '#F7941D', marginBottom: 16 }} />
            <p style={{ fontSize: 14, color: darkMode ? '#CBD5E1' : '#64748B' }}>
              Loading subscription details...
            </p>
          </div>
        )}

        {/* Loading / Submitting State */}
        {!verifying && status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <LoadingOutlined style={{ fontSize: 42, color: '#EF4444', marginBottom: 18 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0B1F4D', marginBottom: 8 }}>
              Processing your request...
            </h2>
            <p style={{ fontSize: 14, color: darkMode ? '#94A3B8' : '#64748B' }}>
              Updating your subscription preferences. Please wait.
            </p>
          </div>
        )}

        {/* Success State */}
        {!verifying && status === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: darkMode ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7',
              color: '#16A34A',
              fontSize: 34,
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
                <>The email address <strong style={{ color: darkMode ? '#FFFFFF' : '#0B1F4D' }}>{unsubscribedEmail}</strong> has been removed from the TGS Tech Info newsletter list.</>
              ) : (
                statusMessage
              )}
            </p>

            <div style={{
              background: darkMode ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
              borderRadius: 12,
              padding: '14px 18px',
              fontSize: 13,
              color: darkMode ? '#94A3B8' : '#64748B',
              marginBottom: 28,
              textAlign: 'left',
              lineHeight: 1.6
            }}>
              🙏 <strong>Thank you for your feedback!</strong> Your responses help us improve our content. If you ever want to rejoin in the future, you can resubscribe anytime from our website.
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link
                to="/"
                style={{
                  background: 'linear-gradient(135deg, #0B1F4D 0%, #1a237e 100%)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '12px 26px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(11, 31, 77, 0.25)'
                }}
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        )}

        {/* Already Unsubscribed State */}
        {!verifying && status === 'already' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: darkMode ? 'rgba(59, 130, 246, 0.15)' : '#E0F2FE',
              color: '#0284C7',
              fontSize: 34,
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
              {statusMessage || 'This email address is already inactive and will not receive any newsletter emails.'}
            </p>

            <Link
              to="/"
              style={{
                background: 'linear-gradient(135deg, #0B1F4D 0%, #1a237e 100%)',
                color: '#FFFFFF',
                textDecoration: 'none',
                padding: '12px 26px',
                borderRadius: 10,
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

        {/* Main Form State (Not yet unsubscribed) */}
        {!verifying && (status === 'idle' || status === 'error') && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: darkMode ? 'rgba(247, 148, 29, 0.15)' : '#FFF4E8',
                color: '#F7941D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0
              }}>
                <MailOutlined />
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: darkMode ? '#F1F5F9' : '#0B1F4D', margin: 0, lineHeight: 1.2 }}>
                  Unsubscribe from Newsletter
                </h1>
                <div style={{ fontSize: 13, color: darkMode ? '#94A3B8' : '#64748B', marginTop: 3 }}>
                  Manage your TGS Tech Info email subscription preferences
                </div>
              </div>
            </div>

            <p style={{ fontSize: 14, color: darkMode ? '#CBD5E1' : '#475569', lineHeight: 1.6, margin: '14px 0 20px' }}>
              We're sorry to see you go! Before unsubscribing, please take a moment to tell us why. Your feedback helps us deliver better tech insights.
            </p>

            {/* Error Banner */}
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

            <form onSubmit={handleFormSubmit}>
              {/* Target Email Display or Input */}
              {email ? (
                <div style={{
                  background: darkMode ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                  border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '12px 16px',
                  marginBottom: 22,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <InfoCircleOutlined style={{ color: '#0284C7', fontSize: 16 }} />
                  <div style={{ fontSize: 13, color: darkMode ? '#CBD5E1' : '#334155' }}>
                    Unsubscribing email: <strong style={{ color: darkMode ? '#38BDF8' : '#0B1F4D' }}>{email}</strong>
                  </div>
                </div>
              ) : (
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
                    placeholder="Enter your registered email address"
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
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* 3-4 Reason Checkboxes */}
              <div style={{ marginBottom: 22 }}>
                <label style={{
                  display: 'block',
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: darkMode ? '#F1F5F9' : '#0F172A',
                  marginBottom: 10
                }}>
                  Please select your reason(s) for unsubscribing:
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {REASON_OPTIONS.map((reason) => {
                    const isChecked = selectedReasons.includes(reason);
                    return (
                      <label
                        key={reason}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          fontSize: 13.5,
                          color: darkMode ? '#E2E8F0' : '#334155',
                          cursor: 'pointer',
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: isChecked
                            ? (darkMode ? '1px solid #F7941D' : '1px solid #F7941D')
                            : (darkMode ? '1px solid #334155' : '1px solid #E2E8F0'),
                          background: isChecked
                            ? (darkMode ? 'rgba(247, 148, 29, 0.12)' : '#FFF7ED')
                            : (darkMode ? 'rgba(255,255,255,0.02)' : '#FFFFFF'),
                          transition: 'all .15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleReason(reason)}
                          style={{
                            width: 18,
                            height: 18,
                            marginTop: 1,
                            accentColor: '#F7941D',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        />
                        <span style={{ lineHeight: 1.45 }}>{reason}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Custom Reason Input Box */}
              <div style={{ marginBottom: 26 }}>
                <label style={{
                  display: 'block',
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: darkMode ? '#F1F5F9' : '#0F172A',
                  marginBottom: 6
                }}>
                  Other reason or additional feedback:
                </label>
                <div style={{ fontSize: 12, color: darkMode ? '#94A3B8' : '#64748B', marginBottom: 8 }}>
                  If your reason is not listed above, please mention it below:
                </div>
                <textarea
                  rows={3}
                  placeholder="Enter your exact reason for unsubscribing or suggestions to help us improve..."
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: darkMode ? '1px solid #475569' : '1.5px solid #CBD5E1',
                    background: darkMode ? '#0F172A' : '#FFFFFF',
                    color: darkMode ? '#F1F5F9' : '#0F172A',
                    fontSize: 13.5,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: 1.5
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '13px 22px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all .2s ease',
                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)'
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#B91C1C'; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#DC2626'; }}
                >
                  {loading ? 'Processing...' : 'Confirm Unsubscribe'}
                </button>

                <Link
                  to="/"
                  style={{
                    padding: '13px 20px',
                    borderRadius: 10,
                    border: darkMode ? '1px solid #475569' : '1.5px solid #CBD5E1',
                    background: 'transparent',
                    color: darkMode ? '#CBD5E1' : '#475569',
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    textAlign: 'center'
                  }}
                >
                  Keep Subscription
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
