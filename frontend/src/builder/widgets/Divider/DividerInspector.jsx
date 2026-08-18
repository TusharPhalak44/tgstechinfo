/**
 * Divider Inspector Component
 * Property panel inspector for divider widget
 */

import React from 'react';
import { Select, Slider, InputNumber } from 'antd';
import InspectorPanel, { InspectorFormItem } from '../../components/InspectorPanel';

const { Option } = Select;

export default function DividerInspector({ node, onUpdate }) {
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
      {/* Style Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#4a7cff' }}>
          Style
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
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
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
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
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
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

      {/* Spacing Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#4a7cff' }}>
          Spacing
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Margin Top (px)
          </label>
          <InputNumber
            value={parseInt(styles.marginTop) || 20}
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
            value={parseInt(styles.marginBottom) || 20}
            onChange={(value) => handleStyleChange('marginBottom', `${value}px`)}
            style={{ width: '100%' }}
            min={0}
            max={100}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Width (%)
          </label>
          <InputNumber
            value={parseInt(styles.width) || 100}
            onChange={(value) => handleStyleChange('width', `${value}%`)}
            style={{ width: '100%' }}
            min={1}
            max={100}
          />
        </div>
      </div>
    </div>
  );
}
