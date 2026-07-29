/**
 * ThemeSettingsPanel Component
 * Panel for editing theme settings and global styles
 */

import React, { useState, useEffect } from 'react';
import { Tabs, Form, Input, Select, ColorPicker, InputNumber, Collapse, Button, Modal, message } from 'antd';
import { BgColorsOutlined, FontSizeOutlined, BorderOutlined, ThunderboltOutlined } from '@ant-design/icons';
import themeManager from '../core/ThemeManager';

const { TabPane } = Tabs;

/**
 * ThemeSettingsPanel Component
 */
export default function ThemeSettingsPanel({ visible, onClose }) {
  const [form] = Form.useForm();
  const [globalStylesForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('colors');
  const [theme, setTheme] = useState(themeManager.getTheme());
  const [globalStyles, setGlobalStyles] = useState(themeManager.getGlobalStyles());

  useEffect(() => {
    if (visible) {
      setTheme(themeManager.getTheme());
      setGlobalStyles(themeManager.getGlobalStyles());
      form.setFieldsValue(theme);
      globalStylesForm.setFieldsValue(globalStyles);
    }
  }, [visible, form, globalStylesForm]);

  const handleThemeChange = (changedValues) => {
    const newTheme = { ...theme, ...changedValues };
    setTheme(newTheme);
    themeManager.setTheme(newTheme);
  };

  const handleGlobalStylesChange = (changedValues) => {
    const newGlobalStyles = { ...globalStyles, ...changedValues };
    setGlobalStyles(newGlobalStyles);
    
    // Update specific global styles
    Object.keys(changedValues).forEach(key => {
      if (key.startsWith('heading_')) {
        const heading = key.replace('heading_', '');
        themeManager.updateHeadingStyle(heading, changedValues[key]);
      } else if (key.startsWith('paragraph_')) {
        const type = key.replace('paragraph_', '');
        themeManager.updateParagraphStyle(type, changedValues[key]);
      } else if (key.startsWith('button_')) {
        const type = key.replace('button_', '');
        themeManager.updateButtonStyle(type, changedValues[key]);
      } else if (key.startsWith('link_')) {
        themeManager.updateLinkStyle(changedValues[key]);
      } else if (key.startsWith('list_')) {
        const type = key.replace('list_', '');
        themeManager.updateListStyle(type, changedValues[key]);
      }
    });
  };

  const handleResetTheme = () => {
    Modal.confirm({
      title: 'Reset Theme',
      content: 'Are you sure you want to reset the theme to default values?',
      onOk: () => {
        themeManager.resetToDefault();
        setTheme(themeManager.getTheme());
        setGlobalStyles(themeManager.getGlobalStyles());
        form.setFieldsValue(themeManager.getTheme());
        globalStylesForm.setFieldsValue(themeManager.getGlobalStyles());
        message.success('Theme reset to default');
      },
    });
  };

  const handleSaveTheme = () => {
    // In a real app, this would save to backend
    message.success('Theme saved successfully');
  };

  return (
    <Modal
      title="Theme Settings"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="reset" onClick={handleResetTheme}>
          Reset to Default
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSaveTheme}>
          Save Theme
        </Button>,
      ]}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} size="small">
        <TabPane tab={<span><BgColorsOutlined /> Colors</span>} key="colors">
          <Form
            form={form}
            layout="vertical"
            size="small"
            onValuesChange={handleThemeChange}
            initialValues={theme}
          >
            <Collapse defaultActiveKey={['brand', 'semantic']} size="small" ghost>
              <Collapse.Panel header="Brand Colors" key="brand">
                <Form.Item label="Primary" name={['colors', 'primary']}>
                  <ColorPicker showText style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Secondary" name={['colors', 'secondary']}>
                  <ColorPicker showText style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Accent" name={['colors', 'accent']}>
                  <ColorPicker showText style={{ width: '100%' }} />
                </Form.Item>
              </Collapse.Panel>
              <Collapse.Panel header="Semantic Colors" key="semantic">
                <Form.Item label="Success" name={['colors', 'success']}>
                  <ColorPicker showText style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Warning" name={['colors', 'warning']}>
                  <ColorPicker showText style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Danger" name={['colors', 'danger']}>
                  <ColorPicker showText style={{ width: '100%' }} />
                </Form.Item>
              </Collapse.Panel>
              <Collapse.Panel header="Background & Text" key="background">
                <Form.Item label="Background" name={['colors', 'background']}>
                  <ColorPicker showText style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Surface" name={['colors', 'surface']}>
                  <ColorPicker showText style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Text" name={['colors', 'text']}>
                  <ColorPicker showText style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Border" name={['colors', 'border']}>
                  <ColorPicker showText style={{ width: '100%' }} />
                </Form.Item>
              </Collapse.Panel>
            </Collapse>
          </Form>
        </TabPane>

        <TabPane tab={<span><FontSizeOutlined /> Typography</span>} key="typography">
          <Form
            form={form}
            layout="vertical"
            size="small"
            onValuesChange={handleThemeChange}
            initialValues={theme}
          >
            <Collapse defaultActiveKey={['fonts', 'sizes']} size="small" ghost>
              <Collapse.Panel header="Font Families" key="fonts">
                <Form.Item label="Primary Font" name={['typography', 'primaryFont']}>
                  <Select>
                    <Select.Option value="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Inter</Select.Option>
                    <Select.Option value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica</Select.Option>
                    <Select.Option value="Georgia, serif">Georgia</Select.Option>
                    <Select.Option value="'Times New Roman', Times, serif">Times New Roman</Select.Option>
                    <Select.Option value="'Courier New', Courier, monospace">Courier New</Select.Option>
                    <Select.Option value="Verdana, sans-serif">Verdana</Select.Option>
                    <Select.Option value="'Segoe UI', sans-serif">Segoe UI</Select.Option>
                    <Select.Option value="Roboto, sans-serif">Roboto</Select.Option>
                    <Select.Option value="'Open Sans', sans-serif">Open Sans</Select.Option>
                    <Select.Option value="Lato, sans-serif">Lato</Select.Option>
                    <Select.Option value="Montserrat, sans-serif">Montserrat</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Secondary Font" name={['typography', 'secondaryFont']}>
                  <Select>
                    <Select.Option value="Georgia, serif">Georgia</Select.Option>
                    <Select.Option value="'Times New Roman', Times, serif">Times New Roman</Select.Option>
                    <Select.Option value="'Playfair Display', serif">Playfair Display</Select.Option>
                    <Select.Option value="'Merriweather', serif">Merriweather</Select.Option>
                  </Select>
                </Form.Item>
              </Collapse.Panel>
              <Collapse.Panel header="Font Sizes" key="sizes">
                <Form.Item label="Extra Small" name={['typography', 'fontSize', 'xs']}>
                  <Input style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Small" name={['typography', 'fontSize', 'sm']}>
                  <Input style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Medium" name={['typography', 'fontSize', 'md']}>
                  <Input style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Large" name={['typography', 'fontSize', 'lg']}>
                  <Input style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Extra Large" name={['typography', 'fontSize', 'xl']}>
                  <Input style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="2X Large" name={['typography', 'fontSize', '2xl']}>
                  <Input style={{ width: '100%' }} />
                </Form.Item>
              </Collapse.Panel>
              <Collapse.Panel header="Line Heights" key="lineHeights">
                <Form.Item label="Tight" name={['typography', 'lineHeight', 'tight']}>
                  <InputNumber min={1} max={2} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Normal" name={['typography', 'lineHeight', 'normal']}>
                  <InputNumber min={1} max={2} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Relaxed" name={['typography', 'lineHeight', 'relaxed']}>
                  <InputNumber min={1} max={2.5} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
              </Collapse.Panel>
            </Collapse>
          </Form>
        </TabPane>

        <TabPane tab={<span><BorderOutlined /> Spacing & Borders</span>} key="spacing">
          <Form
            form={form}
            layout="vertical"
            size="small"
            onValuesChange={handleThemeChange}
            initialValues={theme}
          >
            <Collapse defaultActiveKey={['spacing', 'radius', 'shadows']} size="small" ghost>
              <Collapse.Panel header="Spacing" key="spacing">
                <Form.Item label="Spacing Unit (px)" name={['spacing', 'unit']}>
                  <InputNumber min={4} max={16} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Container Width (px)" name={['spacing', 'containerWidth']}>
                  <InputNumber min={800} max={1600} step={50} style={{ width: '100%' }} />
                </Form.Item>
              </Collapse.Panel>
              <Collapse.Panel header="Border Radius" key="radius">
                <Form.Item label="Small" name={['borderRadius', 'sm']}>
                  <Input style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Medium" name={['borderRadius', 'md']}>
                  <Input style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Large" name={['borderRadius', 'lg']}>
                  <Input style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Extra Large" name={['borderRadius', 'xl']}>
                  <Input style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="2X Large" name={['borderRadius', '2xl']}>
                  <Input style={{ width: '100%' }} />
                </Form.Item>
              </Collapse.Panel>
              <Collapse.Panel header="Shadows" key="shadows">
                <Form.Item label="Small" name={['shadows', 'sm']}>
                  <Input.TextArea rows={2} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Medium" name={['shadows', 'md']}>
                  <Input.TextArea rows={2} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Large" name={['shadows', 'lg']}>
                  <Input.TextArea rows={2} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Extra Large" name={['shadows', 'xl']}>
                  <Input.TextArea rows={2} style={{ width: '100%' }} />
                </Form.Item>
              </Collapse.Panel>
            </Collapse>
          </Form>
        </TabPane>

        <TabPane tab={<span><ThunderboltOutlined /> Global Styles</span>} key="global">
          <Form
            form={globalStylesForm}
            layout="vertical"
            size="small"
            onValuesChange={handleGlobalStylesChange}
            initialValues={globalStyles}
          >
            <Collapse defaultActiveKey={['headings', 'paragraphs', 'buttons']} size="small" ghost>
              <Collapse.Panel header="Headings" key="headings">
                <Form.Item label="H1 Font Size" name={['headings', 'h1', 'fontSize']}>
                  <Input style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="H2 Font Size" name={['headings', 'h2', 'fontSize']}>
                  <Input style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="H3 Font Size" name={['headings', 'h3', 'fontSize']}>
                  <Input style={{ width: '100%' }} />
                </Form.Item>
              </Collapse.Panel>
              <Collapse.Panel header="Paragraphs" key="paragraphs">
                <Form.Item label="Body Font Size" name={['paragraphs', 'body', 'fontSize']}>
                  <Input style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Body Line Height" name={['paragraphs', 'body', 'lineHeight']}>
                  <InputNumber min={1} max={2.5} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
              </Collapse.Panel>
              <Collapse.Panel header="Buttons" key="buttons">
                <Form.Item label="Primary Background" name={['buttons', 'primary', 'backgroundColor']}>
                  <ColorPicker showText style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Primary Color" name={['buttons', 'primary', 'color']}>
                  <ColorPicker showText style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Primary Border Radius" name={['buttons', 'primary', 'borderRadius']}>
                  <Input style={{ width: '100%' }} />
                </Form.Item>
              </Collapse.Panel>
              <Collapse.Panel header="Links" key="links">
                <Form.Item label="Link Color" name={['links', 'color']}>
                  <ColorPicker showText style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Hover Color" name={['links', 'hoverColor']}>
                  <ColorPicker showText style={{ width: '100%' }} />
                </Form.Item>
              </Collapse.Panel>
            </Collapse>
          </Form>
        </TabPane>
      </Tabs>
    </Modal>
  );
}
