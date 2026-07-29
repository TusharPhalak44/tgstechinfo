/**
 * ResponsivePropertyPanel Component
 * Property panel with device-specific editing for responsive design
 */

import React, { useState } from 'react';
import { Tabs, Form, InputNumber, Select, ColorPicker, Slider, Collapse } from 'antd';
import { DesktopOutlined, TabletOutlined, MobileOutlined } from '@ant-design/icons';
import { useResponsiveMode } from '../core/BuilderStore';
import { deviceConfig } from '../utils/types';

const { TabPane } = Tabs;

/**
 * ResponsivePropertyPanel Component
 */
export default function ResponsivePropertyPanel({ node, onUpdate }) {
  const responsiveMode = useResponsiveMode();
  const [activeDevice, setActiveDevice] = useState(responsiveMode);
  const [form] = Form.useForm();

  // Get responsive styles for current device
  const getResponsiveStyles = () => {
    const responsive = node.responsive || {};
    return responsive[activeDevice] || {};
  };

  // Update responsive styles for current device
  const handleUpdateResponsiveStyle = (changedValues) => {
    const currentResponsive = node.responsive || {};
    const deviceStyles = currentResponsive[activeDevice] || {};
    
    onUpdate({
      responsive: {
        ...currentResponsive,
        [activeDevice]: {
          ...deviceStyles,
          ...changedValues,
        },
      },
    });
  };

  // Get base styles (non-responsive)
  const baseStyles = node.styles || {};

  // Check if device has custom overrides
  const hasDeviceOverrides = () => {
    const responsive = node.responsive || {};
    const deviceStyles = responsive[activeDevice];
    return deviceStyles && Object.keys(deviceStyles).length > 0;
  };

  React.useEffect(() => {
    form.setFieldsValue(getResponsiveStyles());
  }, [activeDevice, node, form]);

  return (
    <div className="responsive-property-panel">
      {/* Device Selector */}
      <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e8e8e8' }}>
        <Tabs
          activeKey={activeDevice}
          onChange={setActiveDevice}
          size="small"
          type="card"
        >
          <TabPane tab={<span><DesktopOutlined /> Desktop</span>} key="desktop" />
          <TabPane tab={<span><TabletOutlined /> Tablet</span>} key="tablet" />
          <TabPane tab={<span><MobileOutlined /> Mobile</span>} key="mobile" />
        </Tabs>
        {hasDeviceOverrides() && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#f59e0b' }}>
            ⚠️ Custom overrides active for this device
          </div>
        )}
      </div>

      {/* Responsive Properties */}
      <Form
        form={form}
        layout="vertical"
        size="small"
        onValuesChange={handleUpdateResponsiveStyle}
      >
        <Collapse defaultActiveKey={['size', 'spacing', 'typography']} size="small" ghost>
          <Collapse.Panel header="Size" key="size">
            <Form.Item label="Width (px)" name="width">
              <InputNumber min={0} max={2000} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Height (px)" name="height">
              <InputNumber min={0} max={2000} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Max Width (px)" name="maxWidth">
              <InputNumber min={0} max={2000} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Min Height (px)" name="minHeight">
              <InputNumber min={0} max={2000} style={{ width: '100%' }} />
            </Form.Item>
          </Collapse.Panel>

          <Collapse.Panel header="Spacing" key="spacing">
            <Form.Item label="Padding (px)" name="padding">
              <InputNumber min={0} max={200} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Margin (px)" name="margin">
              <InputNumber min={0} max={200} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Gap (px)" name="gap">
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Collapse.Panel>

          <Collapse.Panel header="Typography" key="typography">
            <Form.Item label="Font Size (px)" name="fontSize">
              <InputNumber min={8} max={200} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Line Height" name="lineHeight">
              <InputNumber min={0.8} max={3} step={0.1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Letter Spacing (px)" name="letterSpacing">
              <InputNumber min={-5} max={20} step={0.5} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Alignment" name="textAlign">
              <Select>
                <Select.Option value="left">Left</Select.Option>
                <Select.Option value="center">Center</Select.Option>
                <Select.Option value="right">Right</Select.Option>
                <Select.Option value="justify">Justify</Select.Option>
              </Select>
            </Form.Item>
          </Collapse.Panel>

          <Collapse.Panel header="Appearance" key="appearance">
            <Form.Item label="Border Radius (px)" name="borderRadius">
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Image Size" name="imageSize">
              <Select>
                <Select.Option value="auto">Auto</Select.Option>
                <Select.Option value="cover">Cover</Select.Option>
                <Select.Option value="contain">Contain</Select.Option>
                <Select.Option value="custom">Custom</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Visibility" name="visibility">
              <Select>
                <Select.Option value="visible">Visible</Select.Option>
                <Select.Option value="hidden">Hidden</Select.Option>
              </Select>
            </Form.Item>
          </Collapse.Panel>

          <Collapse.Panel header="Advanced" key="advanced">
            <Form.Item label="Custom Width (%)" name="customWidth">
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Custom Height (%)" name="customHeight">
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Order" name="order">
              <InputNumber min={-999} max={999} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Flex Direction" name="flexDirection">
              <Select>
                <Select.Option value="row">Row</Select.Option>
                <Select.Option value="column">Column</Select.Option>
                <Select.Option value="row-reverse">Row Reverse</Select.Option>
                <Select.Option value="column-reverse">Column Reverse</Select.Option>
              </Select>
            </Form.Item>
          </Collapse.Panel>
        </Collapse>
      </Form>
    </div>
  );
}
