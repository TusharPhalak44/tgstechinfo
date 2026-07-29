/**
 * PageSettingsPanel Component
 * Panel for managing page settings (SEO, meta tags, custom CSS/JS)
 */

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Tabs, message } from 'antd';
import { SettingOutlined, CodeOutlined, GlobalOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { TextArea } = Input;

/**
 * PageSettingsPanel Component
 */
export default function PageSettingsPanel({ visible, onClose, page, onUpdate }) {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('seo');

  useEffect(() => {
    if (visible && page) {
      form.setFieldsValue({
        metaTitle: page.metadata?.seo?.metaTitle || '',
        metaDescription: page.metadata?.seo?.metaDescription || '',
        keywords: page.metadata?.seo?.keywords || '',
        ogImage: page.metadata?.seo?.ogImage || '',
        canonicalUrl: page.metadata?.seo?.canonicalUrl || '',
        favicon: page.metadata?.seo?.favicon || '',
        customCSS: page.metadata?.customCSS || '',
        customJS: page.metadata?.customJS || '',
        bodyBackground: page.metadata?.bodyBackground || '#ffffff',
      });
    }
  }, [visible, page, form]);

  const handleSave = () => {
    form.validateFields().then(values => {
      const updates = {
        metadata: {
          ...page.metadata,
          seo: {
            metaTitle: values.metaTitle,
            metaDescription: values.metaDescription,
            keywords: values.keywords,
            ogImage: values.ogImage,
            canonicalUrl: values.canonicalUrl,
            favicon: values.favicon,
          },
          customCSS: values.customCSS,
          customJS: values.customJS,
          bodyBackground: values.bodyBackground,
        },
      };

      if (onUpdate) {
        onUpdate(updates);
      }
      message.success('Page settings saved');
      onClose();
    });
  };

  return (
    <Modal
      title="Page Settings"
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Save Settings
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" size="small">
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="small">
          <TabPane tab={<span><GlobalOutlined /> SEO</span>} key="seo">
            <Form.Item
              label="Meta Title"
              name="metaTitle"
              help="Recommended length: 50-60 characters"
            >
              <Input placeholder="Page title for search engines" maxLength={60} showCount />
            </Form.Item>

            <Form.Item
              label="Meta Description"
              name="metaDescription"
              help="Recommended length: 150-160 characters"
            >
              <TextArea
                rows={3}
                placeholder="Page description for search engines"
                maxLength={160}
                showCount
              />
            </Form.Item>

            <Form.Item
              label="Keywords"
              name="keywords"
              help="Comma-separated keywords"
            >
              <Input placeholder="keyword1, keyword2, keyword3" />
            </Form.Item>

            <Form.Item label="OG Image" name="ogImage" help="Open Graph image for social sharing">
              <Input placeholder="https://example.com/og-image.jpg" />
            </Form.Item>

            <Form.Item label="Canonical URL" name="canonicalUrl">
              <Input placeholder="https://example.com/canonical-url" />
            </Form.Item>

            <Form.Item label="Favicon" name="favicon">
              <Input placeholder="https://example.com/favicon.ico" />
            </Form.Item>
          </TabPane>

          <TabPane tab={<span><CodeOutlined /> Custom Code</span>} key="code">
            <Form.Item label="Custom CSS" name="customCSS">
              <TextArea
                rows={8}
                placeholder="/* Custom CSS */"
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
              />
            </Form.Item>

            <Form.Item label="Custom JavaScript" name="customJS">
              <TextArea
                rows={8}
                placeholder="// Custom JavaScript"
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
              />
            </Form.Item>
          </TabPane>

          <TabPane tab={<span><SettingOutlined /> Appearance</span>} key="appearance">
            <Form.Item label="Body Background" name="bodyBackground">
              <Input type="color" style={{ width: '100%', height: 40 }} />
            </Form.Item>
          </TabPane>
        </Tabs>
      </Form>
    </Modal>
  );
}
