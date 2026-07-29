/**
 * Blockquote Inspector Component
 * Property inspector for blockquote widget
 */

import React from 'react';
import { Form, Input, Select } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function BlockquoteInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, {});
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
      <Form.Item label="Quote Text">
        <Input.TextArea
          value={content.text || ''}
          onChange={(e) => handleChange('text', e.target.value)}
          rows={4}
        />
      </Form.Item>

      <Form.Item label="Citation">
        <Input
          value={content.citation || ''}
          onChange={(e) => handleChange('citation', e.target.value)}
          placeholder="- Author Name"
        />
      </Form.Item>

      <Form.Item label="Alignment">
        <Select
          value={settings.alignment || 'left'}
          onChange={(value) => handleSettingChange('alignment', value)}
        >
          <Option value="left">Left</Option>
          <Option value="center">Center</Option>
          <Option value="right">Right</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Style">
        <Select
          value={settings.style || 'default'}
          onChange={(value) => handleSettingChange('style', value)}
        >
          <Option value="default">Default</Option>
          <Option value="modern">Modern</Option>
          <Option value="minimal">Minimal</Option>
        </Select>
      </Form.Item>
    </Form>
  );
}
