import React, { useState } from 'react';
import { Modal, Typography, Collapse, Tag } from 'antd';
import { BookOutlined, CheckCircleOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const guidelines = [
  {
    key: 'quality',
    icon: <BookOutlined />,
    title: 'Content Quality Standards',
    content: [
      { label: 'Word Count', value: 'Minimum 500 words for articles, 300 for blog posts' },
      { label: 'Originality', value: '100% original content - no plagiarism allowed' },
      { label: 'Grammar', value: 'Proper grammar, spelling, and punctuation required' },
      { label: 'Tone', value: 'Professional, informative, and engaging tone' },
      { label: 'Accuracy', value: 'Fact-check all information and cite sources' },
    ]
  },
  {
    key: 'formatting',
    icon: <CheckCircleOutlined />,
    title: 'Formatting Rules',
    content: [
      { label: 'Headings', value: 'Use H1 for title, H2 for main sections, H3 for subsections' },
      { label: 'Paragraphs', value: 'Keep paragraphs short (2-4 sentences)' },
      { label: 'Lists', value: 'Use bullet points for lists, numbered for steps' },
      { label: 'Bold/Italic', value: 'Use bold for emphasis, italic for terms' },
      { label: 'Spacing', value: 'Add line breaks between sections for readability' },
    ]
  },
  {
    key: 'seo',
    icon: <InfoCircleOutlined />,
    title: 'SEO Guidelines',
    content: [
      { label: 'Title', value: 'Include primary keyword, keep under 60 characters' },
      { label: 'Meta Description', value: '150-160 characters, include keywords naturally' },
      { label: 'Keywords', value: 'Use 3-5 relevant keywords throughout content' },
      { label: 'Internal Links', value: 'Link to 2-3 related articles' },
      { label: 'External Links', value: 'Cite authoritative sources when applicable' },
    ]
  },
  {
    key: 'images',
    icon: <WarningOutlined />,
    title: 'Image Requirements',
    content: [
      { label: 'Dimensions', value: 'Banner: 1200x630px, Inline: 800x600px' },
      { label: 'Format', value: 'JPG, PNG, or WebP formats only' },
      { label: 'File Size', value: 'Under 500KB for optimal loading' },
      { label: 'Alt Text', value: 'Descriptive alt text for all images' },
      { label: 'Copyright', value: 'Use only royalty-free or licensed images' },
    ]
  },
  {
    key: 'links',
    icon: <CheckCircleOutlined />,
    title: 'Link Policies',
    content: [
      { label: 'Internal Links', value: 'Link to relevant content within the site' },
      { label: 'External Links', value: 'Link to authoritative, trustworthy sources' },
      { label: 'Affiliate Links', value: 'Disclose affiliate links clearly' },
      { label: 'Broken Links', value: 'Test all links before submission' },
      { label: 'Link Text', value: 'Use descriptive anchor text, not "click here"' },
    ]
  }
];

export const EditorialGuidelines = ({ visible, onClose }) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOutlined style={{ color: '#4a7cff', fontSize: 20 }} />
          <span>Editorial Guidelines</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Paragraph style={{ marginBottom: 16, color: '#64748b' }}>
          Follow these guidelines to ensure your content meets our quality standards and gets approved faster.
        </Paragraph>

        <Collapse
          defaultActiveKey={['quality']}
          expandIconPosition="right"
          style={{ background: 'transparent' }}
        >
          {guidelines.map((section) => (
            <Panel
              key={section.key}
              header={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#4a7cff' }}>{section.icon}</span>
                  <span style={{ fontWeight: 500 }}>{section.title}</span>
                </div>
              }
              style={{
                background: '#f8fafc',
                marginBottom: 8,
                borderRadius: 8,
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ padding: '8px 0' }}>
                {section.content.map((item, index) => (
                  <div key={index} style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
                    <Tag color="blue" style={{ minWidth: 100, textAlign: 'center' }}>
                      {item.label}
                    </Tag>
                    <Text style={{ flex: 1 }}>{item.value}</Text>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </Collapse>

        <div style={{
          marginTop: 20,
          padding: 16,
          background: '#fffbe6',
          border: '1px solid #ffe58f',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12
        }}>
          <WarningOutlined style={{ color: '#faad14', fontSize: 18, marginTop: 2 }} />
          <div>
            <Text strong style={{ color: '#d48806', display: 'block', marginBottom: 4 }}>
              Important Note
            </Text>
            <Text style={{ color: '#874d00', fontSize: 13 }}>
              Content that does not meet these guidelines may be rejected or require revisions before approval.
            </Text>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditorialGuidelines;
