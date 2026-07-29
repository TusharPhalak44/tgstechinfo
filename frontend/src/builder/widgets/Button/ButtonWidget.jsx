/**
 * Button Widget Component
 * Builder component for button editing
 */

import React from 'react';
import { Input, Select, ColorPicker } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function ButtonWidget({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, {});
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
          Button Text
        </label>
        <Input
          value={content.text || ''}
          onChange={(e) => handleChange('text', e.target.value)}
          placeholder="Click me"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Link URL
        </label>
        <Input
          value={content.url || ''}
          onChange={(e) => handleChange('url', e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Button Style
        </label>
        <Select
          value={settings.style || 'primary'}
          onChange={(value) => handleSettingChange('style', value)}
          style={{ width: '100%' }}
        >
          <Option value="primary">Primary</Option>
          <Option value="secondary">Secondary</Option>
          <Option value="outline">Outline</Option>
          <Option value="text">Text</Option>
        </Select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Button Size
        </label>
        <Select
          value={settings.size || 'medium'}
          onChange={(value) => handleSettingChange('size', value)}
          style={{ width: '100%' }}
        >
          <Option value="small">Small</Option>
          <Option value="medium">Medium</Option>
          <Option value="large">Large</Option>
        </Select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Background Color
        </label>
        <ColorPicker
          value={settings.backgroundColor || '#4a7cff'}
          onChange={(color) => handleSettingChange('backgroundColor', color.toHexString())}
          showText
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Text Color
        </label>
        <ColorPicker
          value={settings.textColor || '#ffffff'}
          onChange={(color) => handleSettingChange('textColor', color.toHexString())}
          showText
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Open in New Tab
        </label>
        <Select
          value={settings.target || '_self'}
          onChange={(value) => handleSettingChange('target', value)}
          style={{ width: '100%' }}
        >
          <Option value="_self">Same Tab</Option>
          <Option value="_blank">New Tab</Option>
        </Select>
      </div>
    </div>
  );
}
