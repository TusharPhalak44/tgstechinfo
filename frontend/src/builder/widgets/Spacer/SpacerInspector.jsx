/**
 * Spacer Inspector Component
 * Property panel inspector for spacer widget
 */

import React from 'react';
import { InputNumber, Select } from 'antd';

const { Option } = Select;

export default function SpacerInspector({ node, onUpdate }) {
  const settings = node.settings || {};
  const styles = node.styles || {};

  const handleSettingChange = (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    onUpdate?.({
      ...node,
      settings: updatedSettings,
    });
  };

  const handleStyleChange = (field, value) => {
    const updatedStyles = { ...styles, [field]: value };
    onUpdate?.({
      ...node,
      styles: updatedStyles,
    });
  };

  return (
    <div style={{ padding: 16 }}>
      {/* Size Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#4a7cff' }}>
          Size
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Height (px)
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
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Width
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
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
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

      {/* Spacing Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#4a7cff' }}>
          Additional Spacing
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Margin Top (px)
          </label>
          <InputNumber
            value={parseInt(styles.marginTop) || 0}
            onChange={(value) => handleStyleChange('marginTop', `${value}px`)}
            style={{ width: '100%' }}
            min={0}
            max={100}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Margin Bottom (px)
          </label>
          <InputNumber
            value={parseInt(styles.marginBottom) || 0}
            onChange={(value) => handleStyleChange('marginBottom', `${value}px`)}
            style={{ width: '100%' }}
            min={0}
            max={100}
          />
        </div>
      </div>
    </div>
  );
}
