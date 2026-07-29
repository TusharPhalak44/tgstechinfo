/**
 * PDF Widget Component
 * Builder component for PDF embedding
 */

import React from 'react';
import { Input, Select, InputNumber, Switch } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function PDFWidget({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { url: '', fileName: '' });
  const settings = node.settings || {};

  const handleChange = (field, value) => {
    const updatedContent = { ...content, [field]: value };
    onUpdate?.({
      ...node,
      content: JSON.stringify(updatedContent),
    });
  };

  const handleSettingChange = (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    onUpdate?.({
      ...node,
      settings: updatedSettings,
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          PDF URL
        </label>
        <Input
          value={content.url || ''}
          onChange={(e) => handleChange('url', e.target.value)}
          placeholder="https://example.com/document.pdf"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Width
        </label>
        <Select
          value={settings.width || '100%'}
          onChange={(value) => handleSettingChange('width', value)}
          style={{ width: '100%' }}
        >
          <Option value="100%">Full Width</Option>
          <Option value="75%">75%</Option>
          <Option value="50%">50%</Option>
          <Option value="custom">Custom</Option>
        </Select>
      </div>

      {settings.width === 'custom' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Custom Width (px)
          </label>
          <InputNumber
            value={settings.customWidth || 800}
            onChange={(value) => handleSettingChange('customWidth', value)}
            style={{ width: '100%' }}
            min={200}
            max={1920}
          />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Height (px)
        </label>
        <InputNumber
          value={settings.height || 600}
          onChange={(value) => handleSettingChange('height', value)}
          style={{ width: '100%' }}
          min={200}
          max={2000}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Download Button
        </label>
        <Switch
          checked={settings.showDownload !== false}
          onChange={(checked) => handleSettingChange('showDownload', checked)}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Download Button Text
        </label>
        <Input
          value={settings.downloadText || 'Download PDF'}
          onChange={(e) => handleSettingChange('downloadText', e.target.value)}
          placeholder="Download PDF"
        />
      </div>
    </div>
  );
}
