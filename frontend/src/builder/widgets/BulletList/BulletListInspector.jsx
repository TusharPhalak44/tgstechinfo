/**
 * Bullet List Inspector Component
 * Property inspector for bullet list widget
 */

import React from 'react';
import { Form, Select } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function BulletListInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { items: ['List item 1', 'List item 2'] });
  const settings = node.settings || {};

  const handleSettingChange = (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    onUpdate({
      settings: updatedSettings,
    });
  };

  return (
    <Form layout="vertical" size="small">
      <Form.Item label="List Style">
        <Select
          value={settings.style || 'disc'}
          onChange={(value) => handleSettingChange('style', value)}
        >
          <Option value="disc">Disc (•)</Option>
          <Option value="circle">Circle (○)</Option>
          <Option value="square">Square (■)</Option>
          <Option value="none">None</Option>
        </Select>
      </Form.Item>
    </Form>
  );
}
