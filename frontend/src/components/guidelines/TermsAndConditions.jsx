import React from 'react';
import { Modal, Typography, Checkbox, Divider, Button } from 'antd';
import { FileTextOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export const TermsAndConditions = ({ visible, onClose, onAccept, accepted }) => {
  const handleAgree = () => {
    onAccept(true);
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileTextOutlined style={{ color: '#4a7cff', fontSize: 20 }} />
          <span>Terms and Conditions</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Checkbox
            checked={accepted}
            onChange={(e) => onAccept(e.target.checked)}
            style={{ fontSize: 14 }}
          >
            <Text strong>I have read and agree to the Terms and Conditions</Text>
          </Checkbox>
          <Button
            type="primary"
            onClick={handleAgree}
            disabled={!accepted}
            style={{ marginLeft: 16 }}
          >
            Agree & Continue
          </Button>
        </div>
      }
      width={800}
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0 8px' }}>
        <Paragraph style={{ marginBottom: 20, color: '#64748b' }}>
          Please read and accept these terms and conditions before submitting content.
        </Paragraph>

        {/* Content Ownership */}
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ marginBottom: 12, color: '#1e293b' }}>
            <CheckCircleOutlined style={{ color: '#4a7cff', marginRight: 8 }} />
            Content Ownership
          </Title>
          <Paragraph style={{ marginBottom: 8, color: '#475569' }}>
            By submitting content, you confirm that:
          </Paragraph>
          <ul style={{ paddingLeft: 20, color: '#64748b', lineHeight: 1.8 }}>
            <li>You are the original creator of the content or have proper authorization to submit it</li>
            <li>The content does not infringe on any copyright, trademark, or intellectual property rights</li>
            <li>You retain ownership of your content but grant us a non-exclusive license to publish it</li>
            <li>You have the right to use all images, videos, and media included in your submission</li>
          </ul>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* Plagiarism Policy */}
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ marginBottom: 12, color: '#1e293b' }}>
            <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
            Plagiarism Policy
          </Title>
          <Paragraph style={{ marginBottom: 8, color: '#475569' }}>
            Plagiarism is strictly prohibited:
          </Paragraph>
          <ul style={{ paddingLeft: 20, color: '#64748b', lineHeight: 1.8 }}>
            <li>All content must be 100% original and written by you</li>
            <li>Copying content from other sources without attribution is not allowed</li>
            <li>Proper citation and attribution must be provided for referenced material</li>
            <li>AI-generated content must be disclosed and properly attributed</li>
            <li>Violations will result in immediate rejection and potential account suspension</li>
          </ul>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* Publishing Rights */}
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ marginBottom: 12, color: '#1e293b' }}>
            <CheckCircleOutlined style={{ color: '#4a7cff', marginRight: 8 }} />
            Publishing Rights & Licensing
          </Title>
          <Paragraph style={{ marginBottom: 8, color: '#475569' }}>
            By submitting content, you agree to:
          </Paragraph>
          <ul style={{ paddingLeft: 20, color: '#64748b', lineHeight: 1.8 }}>
            <li>Grant us a worldwide, non-exclusive, royalty-free license to publish, display, and distribute your content</li>
            <li>Allow us to edit, format, and optimize your content for publication</li>
            <li>Permit us to use your content for promotional purposes with attribution</li>
            <li>Understand that you may republish your content elsewhere after 30 days</li>
            <li>Acknowledge that we may remove content at our discretion for policy violations</li>
          </ul>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* Revision & Removal */}
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ marginBottom: 12, color: '#1e293b' }}>
            <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
            Revision & Removal Policy
          </Title>
          <Paragraph style={{ marginBottom: 8, color: '#475569' }}>
            Content may be revised or removed if:
          </Paragraph>
          <ul style={{ paddingLeft: 20, color: '#64748b', lineHeight: 1.8 }}>
            <li>It violates our editorial guidelines or quality standards</li>
            <li>It contains false, misleading, or harmful information</li>
            <li>It infringes on copyright or intellectual property rights</li>
            <li>It violates applicable laws or regulations</li>
            <li>It receives legitimate complaints from third parties</li>
            <li>We reserve the right to edit or remove content without prior notice</li>
          </ul>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* Copyright & Attribution */}
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ marginBottom: 12, color: '#1e293b' }}>
            <CheckCircleOutlined style={{ color: '#4a7cff', marginRight: 8 }} />
            Copyright & Attribution
          </Title>
          <Paragraph style={{ marginBottom: 8, color: '#475569' }}>
            You must:
          </Paragraph>
          <ul style={{ paddingLeft: 20, color: '#64748b', lineHeight: 1.8 }}>
            <li>Provide proper attribution for all quoted or referenced material</li>
            <li>Use only royalty-free or properly licensed images and media</li>
            <li>Respect the intellectual property rights of others</li>
            <li>Include citations and links to original sources when appropriate</li>
            <li>Understand that copyright violations may result in legal action</li>
          </ul>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* User Responsibilities */}
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ marginBottom: 12, color: '#1e293b' }}>
            <CheckCircleOutlined style={{ color: '#4a7cff', marginRight: 8 }} />
            User Responsibilities
          </Title>
          <ul style={{ paddingLeft: 20, color: '#64748b', lineHeight: 1.8 }}>
            <li>Ensure all content is accurate, truthful, and not misleading</li>
            <li>Update content if information becomes outdated or incorrect</li>
            <li>Respond promptly to admin feedback and revision requests</li>
            <li>Maintain professional conduct in all communications</li>
            <li>Report any issues or concerns about published content</li>
          </ul>
        </div>

        {/* Warning Box */}
        <div style={{
          marginTop: 24,
          padding: 16,
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12
        }}>
          <WarningOutlined style={{ color: '#ea580c', fontSize: 18, marginTop: 2 }} />
          <div>
            <Text strong style={{ color: '#c2410c', display: 'block', marginBottom: 4 }}>
              Important Notice
            </Text>
            <Text style={{ color: '#9a3412', fontSize: 13 }}>
              By accepting these terms, you agree to abide by all policies outlined above. Violations may result in content rejection, account suspension, or legal action.
            </Text>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TermsAndConditions;
