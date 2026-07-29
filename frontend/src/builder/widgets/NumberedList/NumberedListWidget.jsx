/**
 * Numbered List Widget Component
 * Builder component for numbered list editing
 */

import React, { useState } from 'react';
import { Button, Input, Space, Select } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function NumberedListWidget({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { items: ['First item', 'Second item'] });
  const settings = node.settings || {};

  const [items, setItems] = useState(content.items || ['']);

  const handleItemChange = (index, value) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
    
    onUpdate?.({
      ...node,
      content: JSON.stringify({
        ...content,
        items: newItems,
      }),
    });
  };

  const addItem = () => {
    const newItems = [...items, ''];
    setItems(newItems);
    
    onUpdate?.({
      ...node,
      content: JSON.stringify({
        ...content,
        items: newItems,
      }),
    });
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    
    onUpdate?.({
      ...node,
      content: JSON.stringify({
        ...content,
        items: newItems,
      }),
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
          Numbering Style
        </label>
        <Select
          value={settings.style || 'decimal'}
          onChange={(value) => handleSettingChange('style', value)}
          style={{ width: '100%' }}
        >
          <Option value="decimal">1, 2, 3...</Option>
          <Option value="decimal-leading-zero">01, 02, 03...</Option>
          <Option value="lower-alpha">a, b, c...</Option>
          <Option value="upper-alpha">A, B, C...</Option>
          <Option value="lower-roman">i, ii, iii...</Option>
          <Option value="upper-roman">I, II, III...</Option>
        </Select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Start From
        </label>
        <input
          type="number"
          value={settings.start || 1}
          onChange={(e) => handleSettingChange('start', parseInt(e.target.value) || 1)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
          min={1}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          List Items
        </label>
        <Space direction="vertical" style={{ width: '100%' }}>
          {items.map((item, index) => (
            <Space key={index} style={{ width: '100%' }}>
              <span style={{ fontSize: '14px', minWidth: '30px', fontWeight: 600 }}>
                {index + (settings.start || 1)}.
              </span>
              <Input
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder={`Item ${index + 1}`}
                style={{ flex: 1 }}
              />
              {items.length > 1 && (
                <Button
                  type="text"
                  icon={<MinusOutlined />}
                  onClick={() => removeItem(index)}
                  danger
                />
              )}
            </Space>
          ))}
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addItem}
            style={{ width: '100%' }}
          >
            Add Item
          </Button>
        </Space>
      </div>
    </div>
  );
}
