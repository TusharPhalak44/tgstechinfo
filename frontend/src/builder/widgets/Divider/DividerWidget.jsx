/**
 * Divider Widget Component
 * Builder component for divider editing
 */

import React from 'react';
import { Select, InputNumber, Slider } from 'antd';

const { Option } = Select;

export default function DividerWidget({ node, onUpdate }) {
  const settings = node.settings || {};

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
          Divider Style
        </label>
        <Select
          value={settings.style || 'solid'}
          onChange={(value) => handleSettingChange('style', value)}
          style={{ width: '100%' }}
        >
          <Option value="solid">Solid</Option>
          <Option value="dashed">Dashed</Option>
          <Option value="dotted">Dotted</Option>
          <Option value="double">Double</Option>
        </Select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Thickness (px)
        </label>
        <Slider
          value={settings.thickness || 1}
          onChange={(value) => handleSettingChange('thickness', value)}
          min={1}
          max={10}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Color
        </label>
        <input
          type="color"
          value={settings.color || '#e8e8e8'}
          onChange={(e) => handleSettingChange('color', e.target.value)}
          style={{ width: '100%', height: 40 }}
        />
      </div>
    </div>
  );
}
