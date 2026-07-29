/**
 * PDF Inspector Component
 * Property inspector for PDF widget
 */

import React from 'react';
import { Form, Input, Select, InputNumber, Switch } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function PDFInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { url: '', fileName: '' });
  const settings = node.settings || {};

  const handleChange = (field, value) => {
    const updatedContent = { ...content, [field]: value };
    onUpdate({
      content: JSON.stringify(updatedContent),
    });
  };

  const handleSettingChange = (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    onUpdate({
      settings: updatedSettings,
    });
  };

  return (
    <Form layout="vertical" size="small">
      <Form.Item label="PDF URL">
        <Input
          value={content.url || ''}
          onChange={(e) => handleChange('url', e.target.value)}
        />
      </Form.Item>

      <Form.Item label="Width">
        <Select
          value={settings.width || '100%'}
          onChange={(value) => handleSettingChange('width', value)}
        >
          <Option value="100%">Full Width</Option>
          <Option value="75%">75%</Option>
          <Option value="50%">50%</Option>
          <Option value="custom">Custom</Option>
        </Select>
      </Form.Item>

      {settings.width === 'custom' && (
        <Form.Item label="Custom Width (px)">
          <InputNumber
            value={settings.customWidth || 800}
            onChange={(value) => handleSettingChange('customWidth', value)}
            min={200}
            max={1920}
            style={{ width: '100%' }}
          />
        </Form.Item>
      )}

      <Form.Item label="Height (px)">
        <InputNumber
          value={settings.height || 600}
          onChange={(value) => handleSettingChange('height', value)}
          min={200}
          max={2000}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item label="Download Button">
        <Switch
          checked={settings.showDownload !== false}
          onChange={(checked) => handleSettingChange('showDownload', checked)}
        />
      </Form.Item>

      <Form.Item label="Download Button Text">
        <Input
          value={settings.downloadText || 'Download PDF'}
          onChange={(e) => handleSettingChange('downloadText', e.target.value)}
        />
      </Form.Item>
    </Form>
  );
}
