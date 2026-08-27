import React, { useState } from 'react';
import { Modal, Input, Button, message } from 'antd';
import { CopyOutlined, CheckOutlined, LinkOutlined, SendOutlined } from '@ant-design/icons';
import { audienceService } from '../../services/audienceService';

export default function AudienceShareModal({
  visible = false,
  onClose = () => {},
  filters = {},
  totalContacts = 0,
  totalCompanies = 0
}) {
  const [title, setTitle] = useState('Taraj Global — B2B Audience Sizing Proposal');
  const [clientName, setClientName] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const res = await audienceService.createShareToken({
        filters,
        title,
        client_name: clientName,
        total_contacts: totalContacts,
        total_companies: totalCompanies
      });

      const fullUrl = `${window.location.origin}${res.share_url}`;
      setShareUrl(fullUrl);
      message.success('Client presentation link generated!');
    } catch (err) {
      message.error(err.message || 'Failed to generate presentation link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    message.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Modal
      open={visible}
      onCancel={() => {
        setShareUrl('');
        onClose();
      }}
      footer={null}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0AAEEF' }}>
          <LinkOutlined />
          <span>Generate Client Presentation Link</span>
        </div>
      }
      styles={{
        content: {
          background: '#0D1A30',
          border: '1px solid rgba(10, 174, 239, 0.4)',
          borderRadius: 16,
          color: '#F8FAFC'
        },
        header: {
          background: '#0D1A30',
          borderBottom: '1px solid rgba(30, 58, 102, 0.4)'
        }
      }}
    >
      <div style={{ padding: '12px 0' }}>
        <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
          Create a secure, read-only presentation link showing this exact target audience (
          <strong style={{ color: '#F7941D' }}>{totalContacts.toLocaleString()} Contacts</strong>
          ) to share with your prospect during or after your sales call.
        </p>

        {!shareUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                Client / Prospect Name:
              </label>
              <Input
                placeholder="e.g. Acme Corp Sales Leadership"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                Presentation Title:
              </label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </div>

            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleGenerate}
              loading={isGenerating}
              block
              style={{
                background: 'linear-gradient(135deg, #0AAEEF, #0284C7)',
                borderColor: '#0AAEEF',
                borderRadius: 8,
                fontWeight: 700,
                height: 40,
                marginTop: 8
              }}
            >
              Generate Live Presentation URL
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            <div style={{ background: 'rgba(9, 18, 34, 0.8)', padding: 12, borderRadius: 10, border: '1px solid rgba(10, 174, 239, 0.3)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: 4 }}>
                Secure Presentation URL:
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem', color: '#38BDF8', wordBreak: 'break-all' }}>
                {shareUrl}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                type="primary"
                icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={handleCopy}
                block
                style={{
                  background: copied ? '#10B981' : '#0AAEEF',
                  borderColor: copied ? '#10B981' : '#0AAEEF',
                  borderRadius: 8,
                  fontWeight: 700,
                  height: 38
                }}
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Share Link'}
              </Button>

              <Button
                onClick={() => window.open(shareUrl, '_blank')}
                style={{
                  background: 'rgba(15, 26, 48, 0.8)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#F8FAFC',
                  borderRadius: 8,
                  fontWeight: 600,
                  height: 38
                }}
              >
                Open View
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
