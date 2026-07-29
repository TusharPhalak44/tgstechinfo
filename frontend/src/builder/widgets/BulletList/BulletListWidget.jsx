/**
 * Bullet List Widget Component
 * Builder component for bullet list editing
 */

import React, { useState } from 'react';
import { Button, Input, Space } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

export default function BulletListWidget({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { items: ['List item 1', 'List item 2'] });
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
          List Style
        </label>
        <select
          value={settings.style || 'disc'}
          onChange={(e) => handleSettingChange('style', e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
        >
          <option value="disc">Disc (•)</option>
          <option value="circle">Circle (○)</option>
          <option value="square">Square (■)</option>
          <option value="none">None</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          List Items
        </label>
        <Space direction="vertical" style={{ width: '100%' }}>
          {items.map((item, index) => (
            <Space key={index} style={{ width: '100%' }}>
              <span style={{ fontSize: '18px', minWidth: '20px' }}>•</span>
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
