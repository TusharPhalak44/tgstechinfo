/**
 * Spacer Widget Component
 * Builder component for spacer editing
 */

import React from 'react';
import { InputNumber, Select } from 'antd';

const { Option } = Select;

export default function SpacerWidget({ node, onUpdate }) {
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
          Spacer Height (px)
        </label>
        <InputNumber
          value={settings.height || 20}
          onChange={(value) => handleSettingChange('height', value)}
          style={{ width: '100%' }}
          min={0}
          max={500}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Spacer Width
        </label>
        <Select
          value={settings.width || '100%'}
          onChange={(value) => handleSettingChange('width', value)}
          style={{ width: '100%' }}
        >
          <Option value="100%">Full Width</Option>
          <Option value="auto">Auto</Option>
          <Option value="custom">Custom</Option>
        </Select>
      </div>

      {settings.width === 'custom' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Custom Width (px)
          </label>
          <InputNumber
            value={settings.customWidth || 100}
            onChange={(value) => handleSettingChange('customWidth', value)}
            style={{ width: '100%' }}
            min={1}
            max={2000}
          />
        </div>
      )}
    </div>
  );
}
