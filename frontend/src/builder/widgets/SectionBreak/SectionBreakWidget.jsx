/**
 * Section Break Widget Component
 * Builder component for section break editing
 */

import React from 'react';
import { Select, InputNumber } from 'antd';

const { Option } = Select;

export default function SectionBreakWidget({ node, onUpdate }) {
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
          Break Style
        </label>
        <Select
          value={settings.style || 'line'}
          onChange={(value) => handleSettingChange('style', value)}
          style={{ width: '100%' }}
        >
          <Option value="line">Line</Option>
          <Option value="dashed">Dashed Line</Option>
          <Option value="dotted">Dotted Line</Option>
          <Option value="double">Double Line</Option>
          <Option value="space">Space Only</Option>
        </Select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Thickness (px)
        </label>
        <InputNumber
          value={settings.thickness || 1}
          onChange={(value) => handleSettingChange('thickness', value)}
          style={{ width: '100%' }}
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
          style={{ width: '100%', height: '40px', cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: '4px', padding: '2px' }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Width
        </label>
        <Select
          value={settings.width || '100%'}
          onChange={(value) => handleSettingChange('width', value)}
          style={{ width: '100%' }}
        >
          <Option value="100%">Full Width</Option>
          <Option value="75%">75%</Option>
          <Option value="50%">50%</Option>
          <Option value="25%">25%</Option>
          <Option value="custom">Custom</Option>
        </Select>
      </div>

      {settings.width === 'custom' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Custom Width (px)
          </label>
          <InputNumber
            value={settings.customWidth || 200}
            onChange={(value) => handleSettingChange('customWidth', value)}
            style={{ width: '100%' }}
            min={50}
            max={1200}
          />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Alignment
        </label>
        <Select
          value={settings.alignment || 'center'}
          onChange={(value) => handleSettingChange('alignment', value)}
          style={{ width: '100%' }}
        >
          <Option value="left">Left</Option>
          <Option value="center">Center</Option>
          <Option value="right">Right</Option>
        </Select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Spacing Above (px)
        </label>
        <InputNumber
          value={settings.spacingAbove || 20}
          onChange={(value) => handleSettingChange('spacingAbove', value)}
          style={{ width: '100%' }}
          min={0}
          max={100}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Spacing Below (px)
        </label>
        <InputNumber
          value={settings.spacingBelow || 20}
          onChange={(value) => handleSettingChange('spacingBelow', value)}
          style={{ width: '100%' }}
          min={0}
          max={100}
        />
      </div>
    </div>
  );
}
