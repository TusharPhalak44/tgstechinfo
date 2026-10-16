import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Typography, Tooltip, message } from 'antd';
import {
  ShareAltOutlined,
  CopyOutlined,
  CheckOutlined,
  LinkedinFilled,
  TwitterOutlined,
  FacebookFilled,
  WhatsAppOutlined,
  MailOutlined,
  LinkOutlined,
  MobileOutlined
} from '@ant-design/icons';

const { Text, Paragraph, Title } = Typography;

export default function ContentShareModal({
  open = false,
  visible = false,
  onClose = () => {},
  content = {},
  darkMode = false,
  url = ''
}) {
  const [copied, setCopied] = useState(false);
  const isOpen = open || visible;

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = content?.title || 'Check out this content';
  const shareDescription = content?.short_description || content?.title || '';

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  const handleCopyLink = async () => {
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        success = true;
      }
    } catch (e) {
      console.warn('navigator.clipboard write failed, falling back:', e);
    }

    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
    }

    if (success) {
      setCopied(true);
      message.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } else {
      message.error('Failed to copy link. Please copy directly from browser address bar.');
    }
  };

  const openShareWindow = (targetUrl) => {
    const width = 640;
    const height = 560;
    const left = typeof window !== 'undefined' ? Math.max(0, (window.screen.width - width) / 2) : 0;
    const top = typeof window !== 'undefined' ? Math.max(0, (window.screen.height - height) / 2) : 0;
    window.open(
      targetUrl,
      '_blank',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  };

  const handleSocialShare = (platform) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);

    switch (platform) {
      case 'linkedin':
        openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`);
        break;
      case 'twitter':
        openShareWindow(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`);
        break;
      case 'facebook':
        openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
        break;
      case 'whatsapp':
        openShareWindow(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle} - ${shareUrl}`)}`);
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`${shareTitle}\n\nRead more here:\n${shareUrl}`)}`;
        break;
      default:
        break;
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleNativeShare = async () => {
    if (canNativeShare) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl,
        });
        onClose();
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed:', err);
        }
      }
    }
  };

  const platforms = [
    {
      key: 'linkedin',
      name: 'LinkedIn',
      icon: <LinkedinFilled style={{ fontSize: 20 }} />,
      bg: '#0A66C2',
      color: '#ffffff',
      hoverBg: '#084e96',
    },
    {
      key: 'twitter',
      name: 'X (Twitter)',
      icon: <TwitterOutlined style={{ fontSize: 20 }} />,
      bg: darkMode ? '#0f172a' : '#111827',
      color: '#ffffff',
      hoverBg: '#000000',
    },
    {
      key: 'whatsapp',
      name: 'WhatsApp',
      icon: <WhatsAppOutlined style={{ fontSize: 20 }} />,
      bg: '#25D366',
      color: '#ffffff',
      hoverBg: '#1eb857',
    },
    {
      key: 'facebook',
      name: 'Facebook',
      icon: <FacebookFilled style={{ fontSize: 20 }} />,
      bg: '#1877F2',
      color: '#ffffff',
      hoverBg: '#135fc2',
    },
    {
      key: 'email',
      name: 'Email',
      icon: <MailOutlined style={{ fontSize: 20 }} />,
      bg: '#EA4335',
      color: '#ffffff',
      hoverBg: '#c93427',
    },
  ];

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={520}
      centered
      styles={{
        content: {
          background: darkMode ? '#1e293b' : '#ffffff',
          borderRadius: 16,
          padding: '24px',
          boxShadow: darkMode ? '0 20px 40px rgba(0,0,0,0.6)' : '0 20px 40px rgba(0,0,0,0.12)',
          border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
        },
        header: {
          background: 'transparent',
          borderBottom: 'none',
          paddingBottom: 0,
        }
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0AAEEF 0%, #0077b5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18
          }}>
            <ShareAltOutlined />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: darkMode ? '#f8fafc' : '#0f172a', lineHeight: 1.2 }}>
              Share this content
            </div>
            <div style={{ fontSize: 12, fontWeight: 400, color: darkMode ? '#94a3b8' : '#64748b', marginTop: 2 }}>
              Spread the knowledge with your colleagues and network
            </div>
          </div>
        </div>
      }
    >
      <div style={{ marginTop: 20 }}>
        {/* Content Preview Snippet */}
        {content?.title && (
          <div style={{
            padding: '12px 14px',
            background: darkMode ? '#0f172a' : '#f8fafc',
            border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
            borderRadius: 12,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            {content.banner_image && (
              <img
                src={`/api/media/file/${content.banner_image}`}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 8,
                  objectFit: 'cover',
                  flexShrink: 0
                }}
              />
            )}
            <div style={{ overflow: 'hidden' }}>
              <Text strong style={{
                fontSize: 13,
                color: darkMode ? '#f1f5f9' : '#0f172a',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.4
              }}>
                {content.title}
              </Text>
              {content.category_name && (
                <span style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#0AAEEF',
                  marginTop: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {content.category_name}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Social Platforms Grid */}
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ fontSize: 13, color: darkMode ? '#cbd5e1' : '#475569', display: 'block', marginBottom: 12 }}>
            Share to Social Media
          </Text>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
            gap: 10
          }}>
            {platforms.map(p => (
              <button
                key={p.key}
                onClick={() => handleSocialShare(p.key)}
                style={{
                  outline: 'none',
                  cursor: 'pointer',
                  background: darkMode ? '#0f172a' : '#f8fafc',
                  padding: '12px 8px',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)';
                  e.currentTarget.style.borderColor = p.bg;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = darkMode ? '#334155' : '#e2e8f0';
                }}
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: p.bg,
                  color: p.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 10px ${p.bg}44`
                }}>
                  {p.icon}
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: darkMode ? '#e2e8f0' : '#1e293b'
                }}>
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Device Share Button (Mobile / Supported Browsers) */}
        {canNativeShare && (
          <div style={{ marginBottom: 20 }}>
            <Button
              block
              icon={<MobileOutlined />}
              onClick={handleNativeShare}
              style={{
                height: 42,
                borderRadius: 10,
                border: darkMode ? '1px solid #3b82f6' : '1px solid #bae6fd',
                background: darkMode ? 'rgba(59, 130, 246, 0.1)' : '#f0f9ff',
                color: darkMode ? '#60a5fa' : '#0284c7',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              Share via device apps...
            </Button>
          </div>
        )}

        {/* Copy Link Section */}
        <div>
          <Text strong style={{ fontSize: 13, color: darkMode ? '#cbd5e1' : '#475569', display: 'block', marginBottom: 8 }}>
            Page Link
          </Text>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: darkMode ? '#0f172a' : '#f8fafc',
            border: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
            borderRadius: 10,
            padding: '4px 6px 4px 12px'
          }}>
            <LinkOutlined style={{ color: darkMode ? '#64748b' : '#94a3b8', fontSize: 16 }} />
            <input
              type="text"
              readOnly
              value={shareUrl}
              onClick={e => e.target.select()}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: darkMode ? '#cbd5e1' : '#334155',
                fontSize: 13,
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            />
            <Button
              type={copied ? "default" : "primary"}
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopyLink}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                background: copied
                  ? (darkMode ? '#059669' : '#10b981')
                  : 'linear-gradient(135deg, #0AAEEF 0%, #0077b5 100%)',
                borderColor: copied ? '#10b981' : '#0AAEEF',
                color: '#ffffff'
              }}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
