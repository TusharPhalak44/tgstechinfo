import React, { useState } from 'react';
import { Modal, Input, Button, message } from 'antd';
import { CopyOutlined, CheckOutlined, LinkOutlined, SendOutlined, ExportOutlined, FileTextOutlined } from '@ant-design/icons';
import { audienceService } from '../../services/audienceService';
import { useAuth } from '../../context/AuthContext';

export default function AudienceShareModal({
  visible = false,
  onClose = () => {},
  filters = {},
  totalContacts = 0,
  totalCompanies = 0
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState('B2B Audience Target Sizing & Market Proposal');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const getCreatorName = () => {
    if (!user) return 'admin';
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    if (fullName) return fullName;
    return user.username || user.name || user.role || 'admin';
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const creatorName = getCreatorName();
      const payloadFilters = {
        ...filters,
        proposal_description: description,
        created_by_name: creatorName
      };

      const res = await audienceService.createShareToken({
        filters: payloadFilters,
        title: title || 'B2B Audience Target Sizing & Market Proposal',
        client_name: clientName || 'Valued Client',
        total_contacts: totalContacts,
        total_companies: totalCompanies,
        created_by_name: creatorName
      });

      const fullUrl = `${window.location.origin}${res.share_url}`;
      setShareUrl(fullUrl);
      message.success('Client proposal deck link generated!');
    } catch (err) {
      message.error(err.message || 'Failed to generate presentation link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    message.success('Proposal link copied to clipboard!');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0AAEEF', fontWeight: 800 }}>
          <LinkOutlined />
          <span>Generate Client Presentation Proposal Link</span>
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
        <p style={{ color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.5 }}>
          Create a personalized executive presentation link showing this exact target segment (
          <strong style={{ color: '#0AAEEF' }}>{(totalContacts || 0).toLocaleString()} Verified Contacts</strong> across{' '}
          <strong style={{ color: '#F7941D' }}>{(totalCompanies || 0).toLocaleString()} Target Accounts</strong>
          ) to share with your prospect.
        </p>

        {!shareUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>
                Client / Prospect Organization Name:
              </label>
              <Input
                placeholder="e.g. Acme Corp Sales Leadership"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                style={{ marginTop: 4, borderRadius: 6 }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>
                Proposal Deck Title:
              </label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ marginTop: 4, borderRadius: 6 }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FileTextOutlined style={{ color: '#0AAEEF' }} /> Proposal Executive Summary / Description:
              </label>
              <Input.TextArea
                rows={3}
                placeholder="Enter custom proposal notes or executive summary for the client (e.g. Customized B2B audience sizing for Q4 content syndication campaign targeting Enterprise CTOs & CIOs)..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ marginTop: 4, borderRadius: 6, fontSize: '0.8125rem' }}
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
                height: 42,
                marginTop: 8,
                boxShadow: '0 4px 14px rgba(10, 174, 239, 0.35)'
              }}
            >
              Generate Client Presentation Link
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            <div style={{ background: 'rgba(9, 18, 34, 0.85)', padding: 14, borderRadius: 10, border: '1px solid rgba(10, 174, 239, 0.4)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: 4, fontWeight: 700 }}>
                Personalized Presentation Deck URL:
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
                  height: 40
                }}
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Share Link'}
              </Button>

              <Button
                icon={<ExportOutlined />}
                onClick={() => window.open(shareUrl, '_blank')}
                style={{
                  background: 'rgba(15, 26, 48, 0.8)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#F8FAFC',
                  borderRadius: 8,
                  fontWeight: 600,
                  height: 40
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
