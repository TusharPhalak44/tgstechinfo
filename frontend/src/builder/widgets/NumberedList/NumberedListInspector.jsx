/**
 * Numbered List Inspector Component
 * Property inspector for numbered list widget
 */

import React from 'react';
import { Select, InputNumber, Input, Button, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function NumberedListInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { items: ['First item', 'Second item'] });
  const settings = node.settings || {};
  const items = Array.isArray(content.items) ? content.items : ['First item', 'Second item'];

  const handleSettingChange = (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    onUpdate({
      settings: updatedSettings,
    });
  };

  const handleItemChange = (index, value) => {
    const newItems = [...items];
    newItems[index] = value;
    onUpdate({
      content: JSON.stringify({ items: newItems }),
    });
  };

  const handleAddItem = () => {
    const newItems = [...items, 'New item'];
    onUpdate({
      content: JSON.stringify({ items: newItems }),
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdate({
      content: JSON.stringify({ items: newItems.length > 0 ? newItems : ['First item'] }),
    });
  };

  return (
    <InspectorPanel>
      <InspectorFormItem label="List Items">
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {items.map((item, index) => (
            <Space.Compact key={index} style={{ width: '100%' }}>
              <Input
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder={`Item ${index + 1}`}
                style={{ flex: 1 }}
              />
              {items.length > 1 && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveItem(index)}
                />
              )}
            </Space.Compact>
          ))}
          <Button
            type="dashed"
            onClick={handleAddItem}
            icon={<PlusOutlined />}
            style={{ width: '100%' }}
          >
            Add List Item
          </Button>
        </Space>
      </InspectorFormItem>

      <InspectorFormItem label="Numbering Style">
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
      </InspectorFormItem>

      <InspectorFormItem label="Start From">
        <InputNumber
          value={settings.start || 1}
          onChange={(value) => handleSettingChange('start', value)}
          min={1}
          style={{ width: '100%' }}
        />
      </InspectorFormItem>
    </InspectorPanel>
  );
}
