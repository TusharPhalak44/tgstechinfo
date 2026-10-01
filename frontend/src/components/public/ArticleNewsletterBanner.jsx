import React, { useState } from 'react';
import { Input, Button, message, Typography } from 'antd';
import { MailOutlined, SendOutlined, CheckCircleFilled, SafetyCertificateOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

const ArticleNewsletterBanner = ({ darkMode = false, contentTitle = '' }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribedEmail, setSubscribedEmail] = useState('');

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    const trimmed = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!trimmed || !emailRegex.test(trimmed)) {
      message.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/public/newsletter', { email: trimmed });
      if (res.data?.alreadySubscribed) {
        message.info(res.data?.message || 'This email address is already subscribed to our newsletter.');
      } else {
        message.success(res.data?.message || 'Successfully subscribed to newsletter!');
      }
      setSubscribed(true);
      setSubscribedEmail(trimmed);
      setEmail('');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to subscribe. Please try again.';
      if (err.response?.status === 400 && msg.toLowerCase().includes('already subscribed')) {
        message.info(msg);
        setSubscribed(true);
        setSubscribedEmail(trimmed);
      } else {
        message.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="article-newsletter-widget"
      style={{
        borderRadius: 16,
        padding: '20px',
        background: darkMode
          ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)'
          : 'linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%)',
        border: darkMode ? '2px solid #334155' : '2px solid #e8ecf4',
        boxShadow: darkMode
          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
          : '0 4px 20px rgba(74, 124, 255, 0.08)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Decorative gradient top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #0AAEEF 0%, #4a7cff 50%, #F7941D 100%)'
        }}
      />

      {subscribed ? (
        /* Success State */
        <div style={{ textAlign: 'center', padding: '12px 6px' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: darkMode ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}
          >
            <CheckCircleFilled style={{ fontSize: 28, color: '#10b981' }} />
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: darkMode ? '#f1f5f9' : '#0f172a',
              marginBottom: 6
            }}
          >
            You're Subscribed!
          </div>
          <Text
            style={{
              fontSize: 13,
              color: darkMode ? '#94a3b8' : '#64748b',
              lineHeight: 1.5,
              display: 'block',
              marginBottom: 16
            }}
          >
            A welcome confirmation has been sent to <strong style={{ color: darkMode ? '#38bdf8' : '#0284c7' }}>{subscribedEmail}</strong>.
          </Text>
          <Button
            size="small"
            onClick={() => setSubscribed(false)}
            style={{
              borderRadius: 8,
              fontSize: 12,
              borderColor: darkMode ? '#475569' : '#cbd5e1',
              color: darkMode ? '#cbd5e1' : '#475569'
            }}
          >
            Subscribe another email
          </Button>
        </div>
      ) : (
        /* Normal State */
        <div>
          {/* Badge & Meta */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12
            }}
          >
            <span
              style={{
                background: 'linear-gradient(135deg, #0AAEEF 0%, #4a7cff 100%)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 20,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <MailOutlined style={{ fontSize: 11 }} /> Newsletter
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11.5,
                color: darkMode ? '#94a3b8' : '#64748b'
              }}
            >
              <SafetyCertificateOutlined style={{ color: '#10b981' }} />
              <span>Verified Delivery</span>
            </span>
          </div>

          {/* Heading */}
          <h3
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: darkMode ? '#f8fafc' : '#0f172a',
              margin: '0 0 6px 0',
              lineHeight: 1.35
            }}
          >
            Subscribe for Weekly Tech Insights
          </h3>
          <Text
            style={{
              fontSize: 12.5,
              color: darkMode ? '#cbd5e1' : '#64748b',
              lineHeight: 1.5,
              display: 'block',
              marginBottom: 16
            }}
          >
            Get curated technical analysis, software comparison battlecards, and enterprise whitepapers directly to your inbox.
          </Text>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              prefix={<MailOutlined style={{ color: darkMode ? '#38bdf8' : '#0284c7' }} />}
              disabled={loading}
              style={{
                width: '100%',
                height: 42,
                borderRadius: 10,
                fontSize: 13.5,
                border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1',
                background: darkMode ? '#0f172a' : '#ffffff',
                color: darkMode ? '#f8fafc' : '#0f172a'
              }}
            />
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SendOutlined />}
              style={{
                width: '100%',
                height: 42,
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                background: 'linear-gradient(135deg, #0AAEEF 0%, #1e40af 100%)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(10, 174, 239, 0.35)'
              }}
            >
              {loading ? 'Subscribing...' : 'Subscribe Free'}
            </Button>
          </form>

          {/* Privacy Note */}
          <div
            style={{
              marginTop: 10,
              textAlign: 'center',
              fontSize: 11,
              color: darkMode ? '#64748b' : '#94a3b8'
            }}
          >
            🔒 100% free • No spam • 1-click unsubscribe
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleNewsletterBanner;
