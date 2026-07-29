/**
 * Numbered List Inspector Component
 * Property inspector for numbered list widget
 */

import React from 'react';
import { Form, Select, InputNumber } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function NumberedListInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { items: ['First item', 'Second item'] });
  const settings = node.settings || {};

  const handleSettingChange = (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    onUpdate({
      settings: updatedSettings,
    });
  };

  return (
    <Form layout="vertical" size="small">
      <Form.Item label="Numbering Style">
        <Select
          value={settings.style || 'decimal'}
          onChange={(value) => handleSettingChange('style', value)}
        >
          <Option value="decimal">1, 2, 3...</Option>
          <Option value="decimal-leading-zero">01, 02, 03...</Option>
          <Option value="lower-alpha">a, b, c...</Option>
          <Option value="upper-alpha">A, B, C...</Option>
          <Option value="lower-roman">i, ii, iii...</Option>
          <Option value="upper-roman">I, II, III...</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Start From">
        <InputNumber
          value={settings.start || 1}
          onChange={(value) => handleSettingChange('start', value)}
          min={1}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  );
}
