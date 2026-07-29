/**
 * TemplateGallery Component
 * Template selection modal with preview cards, categories, and search
 */

import React, { useState, useEffect } from 'react';
import { Modal, Card, Row, Col, Input, Select, Button, Empty, Spin, Tag, Tooltip } from 'antd';
import { SearchOutlined, AppstoreOutlined, FileTextOutlined, ThunderboltOutlined, GiftOutlined, TeamOutlined, PhoneOutlined, BookOutlined, RocketOutlined, ExperimentOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

const templates = [
  {
    id: 'blank',
    name: 'Blank Page',
    category: 'basic',
    description: 'Start with a clean slate',
    icon: <FileTextOutlined />,
    color: '#1890ff',
    preview: 'Empty canvas ready for your content',
  },
  {
    id: 'webinar',
    name: 'Webinar Landing',
    category: 'marketing',
    description: 'Promote your online events',
    icon: <ThunderboltOutlined />,
    color: '#722ed1',
    preview: 'Hero section, speaker profiles, registration form',
  },
  {
    id: 'whitepaper',
    name: 'Whitepaper Download',
    category: 'content',
    description: 'Capture leads with valuable content',
    icon: <BookOutlined />,
    color: '#52c41a',
    preview: 'Value proposition, benefits, download form',
  },
  {
    id: 'ebook',
    name: 'eBook Landing',
    category: 'content',
    description: 'Showcase your digital publications',
    icon: <BookOutlined />,
    color: '#13c2c2',
    preview: 'Book preview, chapter list, download CTA',
  },
  {
    id: 'event',
    name: 'Event Registration',
    category: 'marketing',
    description: 'Drive registrations for your events',
    icon: <AppstoreOutlined />,
    color: '#fa8c16',
    preview: 'Event details, schedule, registration form',
  },
  {
    id: 'product',
    name: 'Product Launch',
    category: 'marketing',
    description: 'Launch your new product with impact',
    icon: <RocketOutlined />,
    color: '#f5222d',
    preview: 'Product showcase, features, pricing, CTA',
  },
  {
    id: 'ai',
    name: 'AI Landing Page',
    category: 'technology',
    description: 'Modern AI product landing page',
    icon: <ExperimentOutlined />,
    color: '#2f54eb',
    preview: 'Futuristic design, feature highlights, demo',
  },
  {
    id: 'case',
    name: 'Case Study',
    category: 'content',
    description: 'Share your success stories',
    icon: <TeamOutlined />,
    color: '#eb2f96',
    preview: 'Challenge, solution, results, testimonials',
  },
  {
    id: 'contact',
    name: 'Contact Page',
    category: 'basic',
    description: 'Professional contact page',
    icon: <PhoneOutlined />,
    color: '#fa541c',
    preview: 'Contact form, map, office information',
  },
];

const categories = [
  { value: 'all', label: 'All Templates' },
  { value: 'basic', label: 'Basic' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'content', label: 'Content' },
  { value: 'technology', label: 'Technology' },
];

export default function TemplateGallery({ visible, onClose, onLoadTemplate, onReplaceTemplate, onAppendTemplate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
    setPreviewMode(true);
  };

  const handleLoadTemplate = async (mode = 'replace') => {
    if (!selectedTemplate) return;
    
    setLoading(true);
    
    try {
      if (mode === 'replace') {
        await onReplaceTemplate?.(selectedTemplate.id);
      } else if (mode === 'append') {
        await onAppendTemplate?.(selectedTemplate.id);
      } else {
        await onLoadTemplate?.(selectedTemplate.id);
      }
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setPreviewMode(false);
    setSearchQuery('');
    setSelectedCategory('all');
    onClose?.();
  };

  return (
    <Modal
      title="Template Gallery"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={previewMode ? 900 : 800}
      style={{ top: 20 }}
    >
      {!previewMode ? (
        <>
          {/* Search and Filter */}
          <div style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={16}>
                <Search
                  placeholder="Search templates..."
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="large"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Col>
              <Col span={8}>
                <Select
                  size="large"
                  style={{ width: '100%' }}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                >
                  {categories.map(cat => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </div>

          {/* Template Grid */}
          {filteredTemplates.length === 0 ? (
            <Empty
              description="No templates found"
              style={{ padding: '40px 0' }}
            />
          ) : (
            <Row gutter={[16, 16]}>
              {filteredTemplates.map(template => (
                <Col key={template.id} xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    onClick={() => handleTemplateClick(template)}
                    style={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          backgroundColor: template.color + '20',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          fontSize: 32,
                          color: template.color,
                        }}
                      >
                        {template.icon}
                      </div>
                    </div>
                    <h4 style={{ textAlign: 'center', marginBottom: 8, marginTop: 16 }}>
                      {template.name}
                    </h4>
                    <Tag color={template.color} style={{ display: 'block', textAlign: 'center', marginBottom: 8 }}>
                      {categories.find(c => c.value === template.category)?.label}
                    </Tag>
                    <p style={{ 
                      textAlign: 'center', 
                      color: '#666', 
                      fontSize: 13,
                      marginBottom: 12,
                      minHeight: 40
                    }}>
                      {template.description}
                    </p>
                    <div style={{ 
                      textAlign: 'center', 
                      fontSize: 12, 
                      color: '#999',
                      fontStyle: 'italic'
                    }}>
                      {template.preview}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </>
      ) : (
        <>
          {/* Template Preview */}
          <div style={{ marginBottom: 24 }}>
            <Button onClick={() => setPreviewMode(false)} style={{ marginBottom: 16 }}>
              ← Back to Gallery
            </Button>
            
            <Card>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: selectedTemplate.color + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    fontSize: 40,
                    color: selectedTemplate.color,
                    marginBottom: 16,
                  }}
                >
                  {selectedTemplate.icon}
                </div>
                <h2 style={{ marginBottom: 8 }}>{selectedTemplate.name}</h2>
                <Tag color={selectedTemplate.color} style={{ marginBottom: 16 }}>
                  {categories.find(c => c.value === selectedTemplate.category)?.label}
                </Tag>
                <p style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>
                  {selectedTemplate.description}
                </p>
                <p style={{ color: '#999', fontSize: 13, fontStyle: 'italic' }}>
                  {selectedTemplate.preview}
                </p>
              </div>

              <div style={{
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                padding: 24,
                textAlign: 'center',
                minHeight: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #d9d9d9',
              }}>
                <div>
                  <GiftOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                  <p style={{ color: '#999' }}>Template preview will appear here</p>
                  <p style={{ color: '#999', fontSize: 12 }}>
                    This is a placeholder for the actual template preview
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div style={{ textAlign: 'center', display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Tooltip title="Replace current page content with this template">
              <Button
                type="primary"
                size="large"
                onClick={() => handleLoadTemplate('replace')}
                loading={loading}
                icon={<AppstoreOutlined />}
              >
                Replace Page
              </Button>
            </Tooltip>
            
            <Tooltip title="Add this template to the end of current page">
              <Button
                size="large"
                onClick={() => handleLoadTemplate('append')}
                loading={loading}
                icon={<FileTextOutlined />}
              >
                Append to Page
              </Button>
            </Tooltip>
            
            <Tooltip title="Load this template as a new page">
              <Button
                size="large"
                onClick={() => handleLoadTemplate('new')}
                loading={loading}
                icon={<ThunderboltOutlined />}
              >
                Load as New
              </Button>
            </Tooltip>
          </div>
        </>
      )}
    </Modal>
  );
}
