/**
 * Bullet List Inspector Component
 * Property inspector for bullet list widget
 */

import React from 'react';
import { Select, Input, Button, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function BulletListInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { items: ['List item 1', 'List item 2'] });
  const settings = node.settings || {};
  const items = Array.isArray(content.items) ? content.items : ['List item 1', 'List item 2'];

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
      content: JSON.stringify({ items: newItems.length > 0 ? newItems : ['List item 1'] }),
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

      <InspectorFormItem label="List Style">
        <Select
          value={settings.style || 'disc'}
          onChange={(value) => handleSettingChange('style', value)}
        >
          <Option value="disc">Disc (•)</Option>
          <Option value="circle">Circle (○)</Option>
          <Option value="square">Square (■)</Option>
          <Option value="none">None</Option>
        </Select>
      </InspectorFormItem>
    </InspectorPanel>
  );
}
