/**
 * Heading Inspector Component
 * Property panel inspector for heading widget
 */

import React from 'react';
import { Form, Input, Select, InputNumber, ColorPicker } from 'antd';

const { TextArea } = Input;

const { Option } = Select;

export default function HeadingInspector({ node, onUpdate }) {
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
        <Form.Item label="Text">
          <TextArea
            rows={2}
            value={node.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Enter heading text"
          />
        </Form.Item>
        <Form.Item label="Heading Level">
          <Select
            value={node.headingLevel || 'h2'}
            onChange={(value) => onUpdate({ headingLevel: value })}
            style={{ width: '100%' }}
          >
            <Option value="h1">H1</Option>
            <Option value="h2">H2</Option>
            <Option value="h3">H3</Option>
            <Option value="h4">H4</Option>
            <Option value="h5">H5</Option>
            <Option value="h6">H6</Option>
          </Select>
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
            value={parseInt(styles.fontSize) || 24}
            onChange={(value) => handleStyleChange('fontSize', `${value}px`)}
            min={12}
            max={72}
            step={1}
            style={{ width: '100%' }}
            addonAfter="px"
          />
        </Form.Item>

        <Form.Item label="Font Weight">
          <Select
            value={styles.fontWeight || '600'}
            onChange={(value) => handleStyleChange('fontWeight', value)}
            style={{ width: '100%' }}
          >
            <Option value="300">Light</Option>
            <Option value="400">Normal</Option>
            <Option value="500">Medium</Option>
            <Option value="600">Semi Bold</Option>
            <Option value="700">Bold</Option>
            <Option value="800">Extra Bold</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Line Height">
          <InputNumber
            value={parseFloat(styles.lineHeight) || 1.2}
            onChange={(value) => handleStyleChange('lineHeight', value)}
            min={1}
            max={3}
            step={0.1}
            style={{ width: '100%' }}
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
