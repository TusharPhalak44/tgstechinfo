/**
 * Table Inspector Component
 * Property inspector for table widget
 */

import React from 'react';
import { Form, InputNumber, Select, Switch } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function TableInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { data: [['Header 1', 'Header 2', 'Header 3'], ['Cell 1', 'Cell 2', 'Cell 3']] });
  const settings = node.settings || {};

  const handleSettingChange = (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    onUpdate({
      settings: updatedSettings,
    });
  };

  return (
    <Form layout="vertical" size="small">
      <Form.Item label="Table Style">
        <Select
          value={settings.style || 'default'}
          onChange={(value) => handleSettingChange('style', value)}
        >
          <Option value="default">Default</Option>
          <Option value="striped">Striped</Option>
          <Option value="bordered">Bordered</Option>
          <Option value="minimal">Minimal</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Header Row">
        <Switch
          checked={settings.hasHeader !== false}
          onChange={(checked) => handleSettingChange('hasHeader', checked)}
        />
      </Form.Item>

      <Form.Item label="Border Width">
        <InputNumber
          value={settings.borderWidth || 1}
          onChange={(value) => handleSettingChange('borderWidth', value)}
          min={0}
          max={5}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item label="Cell Padding">
        <InputNumber
          value={settings.cellPadding || 12}
          onChange={(value) => handleSettingChange('cellPadding', value)}
          min={0}
          max={50}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  );
}
