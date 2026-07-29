/**
 * Line Break Inspector Component
 * Property panel inspector for line break widget
 */

import React from 'react';
import { Form, InputNumber, Select } from 'antd';

const { Option } = Select;

export default function LineBreakInspector({ node, onUpdate }) {
  const styles = node.styles || {};

  const handleStyleChange = (key, value) => {
    onUpdate({
      styles: {
        ...styles,
        [key]: value,
      },
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <Form layout="vertical">
        <Form.Item label="Height">
          <InputNumber
            value={parseFloat(styles.height) || 1}
            onChange={(value) => handleStyleChange('height', `${value}em`)}
            min={0.1}
            max={10}
            step={0.1}
            style={{ width: '100%' }}
            addonAfter="em"
          />
        </Form.Item>

        <Form.Item label="Display">
          <Select
            value={styles.display || 'block'}
            onChange={(value) => handleStyleChange('display', value)}
            style={{ width: '100%' }}
          >
            <Option value="block">Block</Option>
            <Option value="inline">Inline</Option>
            <Option value="inline-block">Inline Block</Option>
            <Option value="none">None</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Margin Top">
          <InputNumber
            value={parseFloat(styles.marginTop) || 0}
            onChange={(value) => handleStyleChange('marginTop', `${value}px`)}
            min={0}
            max={100}
            step={1}
            style={{ width: '100%' }}
            addonAfter="px"
          />
        </Form.Item>

        <Form.Item label="Margin Bottom">
          <InputNumber
            value={parseFloat(styles.marginBottom) || 0}
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
