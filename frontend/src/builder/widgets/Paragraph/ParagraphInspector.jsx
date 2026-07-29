/**
 * Paragraph Inspector Component
 * Property panel inspector for paragraph widget
 */

import React from 'react';
import { Form, Input, Select, InputNumber, ColorPicker } from 'antd';

const { Option } = Select;
const { TextArea } = Input;

export default function ParagraphInspector({ node, onUpdate }) {
  const styles = node.styles || {};
  const settings = node.settings || {};

  const handleStyleChange = (key, value) => {
    onUpdate({
      styles: {
        ...styles,
        [key]: value,
      },
    });
  };

  const handleSettingChange = (key, value) => {
    onUpdate({
      settings: {
        ...settings,
        [key]: value,
      },
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <Form layout="vertical">
        <Form.Item label="Content">
          <TextArea
            value={node.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            rows={4}
            placeholder="Enter paragraph text"
          />
        </Form.Item>

        <Form.Item label="Alignment">
          <Select
            value={node.alignment || 'left'}
            onChange={(value) => onUpdate({ alignment: value })}
            style={{ width: '100%' }}
          >
            <Option value="left">Left</Option>
            <Option value="center">Center</Option>
            <Option value="right">Right</Option>
            <Option value="justify">Justify</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Color">
          <ColorPicker
            value={styles.color || '#262626'}
            onChange={(color) => handleStyleChange('color', color.toHexString())}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="Font Size">
          <InputNumber
            value={parseInt(styles.fontSize) || 16}
            onChange={(value) => handleStyleChange('fontSize', `${value}px`)}
            min={12}
            max="32"
            step={1}
            style={{ width: '100%' }}
            addonAfter="px"
          />
        </Form.Item>

        <Form.Item label="Font Weight">
          <Select
            value={styles.fontWeight || '400'}
            onChange={(value) => handleStyleChange('fontWeight', value)}
            style={{ width: '100%' }}
          >
            <Option value="300">Light</Option>
            <Option value="400">Normal</Option>
            <Option value="500">Medium</Option>
            <Option value="600">Semi Bold</Option>
            <Option value="700">Bold</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Line Height">
          <InputNumber
            value={parseFloat(styles.lineHeight) || 1.6}
            onChange={(value) => handleStyleChange('lineHeight', value)}
            min={1}
            max={3}
            step={0.1}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="Letter Spacing">
          <InputNumber
            value={parseFloat(styles.letterSpacing) || 0}
            onChange={(value) => handleStyleChange('letterSpacing', `${value}px`)}
            min={-2}
            max={10}
            step={0.1}
            style={{ width: '100%' }}
            addonAfter="px"
          />
        </Form.Item>

        <Form.Item label="Margin Bottom">
          <InputNumber
            value={parseInt(styles.marginBottom) || 16}
            onChange={(value) => handleStyleChange('marginBottom', `${value}px`)}
            min={0}
            max={100}
            step={1}
            style={{ width: '100%' }}
            addonAfter="px"
          />
        </Form.Item>
      </Form>
    </div>
  );
}
