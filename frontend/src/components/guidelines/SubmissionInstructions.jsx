import React from 'react';
import { Modal, Typography, Steps, Tag, Alert } from 'antd';
import { SendOutlined, CheckCircleOutlined, ClockCircleOutlined, EyeOutlined, WarningOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

const workflowSteps = [
  {
    title: 'Create Draft',
    icon: <SendOutlined />,
    description: 'Start by creating your content in draft mode',
    details: [
      'Fill in all required fields (title, content, category)',
      'Upload banner image (1200x630px recommended)',
      'Add relevant tags and SEO metadata',
      'Preview your content before saving'
    ]
  },
  {
    title: 'Submit for Review',
    icon: <SendOutlined />,
    description: 'Submit your draft for admin review',
    details: [
      'Click "Submit for Review" button',
      'Content status changes to "pending"',
      'Admin receives notification for review',
      'You cannot edit while in pending status'
    ]
  },
  {
    title: 'Admin Review',
    icon: <ClockCircleOutlined />,
    description: 'Admin reviews your content',
    details: [
      'Admin checks quality and compliance',
      'Review typically takes 24-48 hours',
      'Admin may request changes if needed',
      'Status updates to "review" during process'
    ]
  },
  {
    title: 'Approval & Publish',
    icon: <CheckCircleOutlined />,
    description: 'Content approved and published',
    details: [
      'Admin approves content',
      'Status changes to "published"',
      'Content appears on the website',
      'You receive confirmation notification'
    ]
  }
];

const tips = [
  {
    icon: <CheckCircleOutlined />,
    title: 'Follow Guidelines',
    text: 'Review editorial guidelines before submitting to avoid rejections'
  },
  {
    icon: <EyeOutlined />,
    title: 'Preview Before Submit',
    text: 'Always preview your content to check formatting and layout'
  },
  {
    icon: <WarningOutlined />,
    title: 'Avoid Common Mistakes',
    text: 'Check for spelling errors, broken links, and missing images'
  },
  {
    icon: <ClockCircleOutlined />,
    title: 'Be Patient',
    text: 'Review takes 24-48 hours. Do not submit duplicate requests'
  }
];

const commonMistakes = [
  'Missing required fields (title, content, category)',
  'Plagiarized or copied content',
  'Poor grammar and spelling',
  'Missing or inappropriate images',
  'Broken or irrelevant links',
  'Insufficient word count',
  'Missing SEO metadata',
  'Incorrect formatting'
];

export const SubmissionInstructions = ({ visible, onClose }) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SendOutlined style={{ color: '#4a7cff', fontSize: 20 }} />
          <span>How to Submit Content</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Paragraph style={{ marginBottom: 24, color: '#64748b' }}>
          Follow this step-by-step guide to submit your content for review and publication.
        </Paragraph>

        {/* Workflow Steps */}
        <Title level={4} style={{ marginBottom: 16 }}>Submission Workflow</Title>
        <Steps
          direction="vertical"
          current={-1}
          style={{ marginBottom: 24 }}
        >
          {workflowSteps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
              style={{ marginBottom: 16 }}
            >
              <div style={{ marginTop: 8, paddingLeft: 24 }}>
                {step.details.map((detail, i) => (
                  <div key={i} style={{ marginBottom: 4, color: '#64748b', fontSize: 13 }}>
                    • {detail}
                  </div>
                ))}
              </div>
            </Step>
          ))}
        </Steps>

        {/* Tips Section */}
        <Title level={4} style={{ marginBottom: 16 }}>Tips for Faster Approval</Title>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {tips.map((tip, index) => (
            <div
              key={index}
              style={{
                padding: 12,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start'
              }}
            >
              <span style={{ color: '#4a7cff', fontSize: 16 }}>{tip.icon}</span>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>{tip.title}</Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>{tip.text}</Text>
              </div>
            </div>
          ))}
        </div>

        {/* Common Mistakes */}
        <Title level={4} style={{ marginBottom: 16 }}>Common Mistakes to Avoid</Title>
        <div style={{ marginBottom: 24 }}>
          {commonMistakes.map((mistake, index) => (
            <Tag
              key={index}
              color="orange"
              style={{ marginBottom: 8, marginRight: 8, fontSize: 12 }}
            >
              {mistake}
            </Tag>
          ))}
        </div>

        {/* Status Information */}
        <Alert
          message="Content Status Guide"
          description={
            <div style={{ marginTop: 8 }}>
              <div style={{ marginBottom: 4 }}>
                <Tag color="default">Draft</Tag> <Text style={{ fontSize: 12 }}>Content is being edited, not submitted</Text>
              </div>
              <div style={{ marginBottom: 4 }}>
                <Tag color="processing">Pending</Tag> <Text style={{ fontSize: 12 }}>Submitted for review, awaiting admin action</Text>
              </div>
              <div style={{ marginBottom: 4 }}>
                <Tag color="warning">Review</Tag> <Text style={{ fontSize: 12 }}>Admin is reviewing the content</Text>
              </div>
              <div style={{ marginBottom: 4 }}>
                <Tag color="error">Changes Requested</Tag> <Text style={{ fontSize: 12 }}>Admin requested revisions, make changes and resubmit</Text>
              </div>
              <div>
                <Tag color="success">Published</Tag> <Text style={{ fontSize: 12 }}>Content is live on the website</Text>
              </div>
            </div>
          }
          type="info"
          showIcon
          style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}
        />
      </div>
    </Modal>
  );
};

export default SubmissionInstructions;
