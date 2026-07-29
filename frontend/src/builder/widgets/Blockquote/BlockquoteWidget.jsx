/**
 * Blockquote Widget Component
 * Builder component for blockquote editing
 */

import React from 'react';
import { Input, Select } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function BlockquoteWidget({ node, onUpdate }) {
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
          Quote Text
        </label>
        <Input.TextArea
          value={content.text || ''}
          onChange={(e) => handleChange('text', e.target.value)}
          placeholder="Enter your quote"
          rows={4}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Citation (Optional)
        </label>
        <Input
          value={content.citation || ''}
          onChange={(e) => handleChange('citation', e.target.value)}
          placeholder="- Author Name"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Alignment
        </label>
        <Select
          value={settings.alignment || 'left'}
          onChange={(value) => handleSettingChange('alignment', value)}
          style={{ width: '100%' }}
        >
          <Option value="left">Left</Option>
          <Option value="center">Center</Option>
          <Option value="right">Right</Option>
        </Select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Style
        </label>
        <Select
          value={settings.style || 'default'}
          onChange={(value) => handleSettingChange('style', value)}
          style={{ width: '100%' }}
        >
          <Option value="default">Default</Option>
          <Option value="modern">Modern</Option>
          <Option value="minimal">Minimal</Option>
        </Select>
      </div>
    </div>
  );
}
