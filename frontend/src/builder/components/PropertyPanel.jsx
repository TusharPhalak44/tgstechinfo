/**
 * PropertyPanel Component
 * Right sidebar for editing selected node properties
 * Tabs: Content, Style, Responsive, Dynamic, Animation, Visibility, Interactions, Advanced
 */

import React, { useState } from 'react';
import { Tabs, Empty, Form, Input, Select, Button, InputNumber, ColorPicker, Slider, Collapse, Switch, Alert } from 'antd';
import { PictureOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useBuilderSelection, useBuilderActions, useBuilderPage } from '../core/BuilderStore.jsx';
import widgetRegistry from '../registry/WidgetRegistry';
import ResponsivePropertyPanel from './ResponsivePropertyPanel';
import DynamicContentPanel from './DynamicContentPanel';
import AnimationPanel from './AnimationPanel';
import VisibilityPanel from './VisibilityPanel';
import InteractionPanel from './InteractionPanel';
import FormWidget from '../widgets/Form/FormWidget';
import ImageInspector from '../widgets/Image/ImageInspector.jsx';
import VideoInspector from '../widgets/Video/VideoInspector.jsx';
import HeadingInspector from '../widgets/Heading/HeadingInspector.jsx';
import MediaLibraryModal from '../../components/common/MediaLibraryModal';

const { TabPane } = Tabs;

// Layout types that don't need widget registration
const LAYOUT_TYPES = ['page', 'section', 'container', 'column', 'column-1', 'column-2', 'column-3', 'column-4'];

/**
 * PropertyPanel Component
 */
export default function PropertyPanel({ collapsed, darkMode = false }) {
  const { selectedNodeId } = useBuilderSelection();
  const { updateNode } = useBuilderActions();
  const page = useBuilderPage();
  const [activeTab, setActiveTab] = useState('content');

  // Find selected node
  const selectedNode = React.useMemo(() => {
    if (!page || !page.root || !selectedNodeId) return null;
    
    const findNode = (node) => {
      if (node.id === selectedNodeId) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findNode(page.root);
  }, [page, selectedNodeId]);

  const widget = selectedNode?.type && !LAYOUT_TYPES.includes(selectedNode?.type) 
    ? widgetRegistry.get(selectedNode?.type) 
    : null;

  if (collapsed) {
    return null;
  }

  // Empty state when no node is selected
  if (!selectedNode) {
    return (
      <div className="property-panel" style={{ padding: 16, background: darkMode ? '#1e293b' : undefined, minHeight: '100%' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span style={{ color: darkMode ? '#94a3b8' : undefined }}>Select an element to edit its properties</span>}
          style={{ marginTop: 40 }}
        />
      </div>
    );
  }

  return (
    <div className="property-panel" style={{ padding: 16, background: darkMode ? '#1e293b' : undefined, minHeight: '100%' }}>
      {/* Node Info */}
      <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${darkMode ? '#334155' : '#e8e8e8'}` }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: darkMode ? '#f1f5f9' : undefined }}>
          {widget?.metadata?.label || selectedNode.label || selectedNode.type}
        </div>
        <div style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#999', marginTop: 4 }}>
          {selectedNode.type}
        </div>
      </div>

      {/* Property Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} size="small">
        <TabPane tab="Content" key="content">
          <ContentPanel 
            node={selectedNode} 
            widget={widget}
            onUpdate={(updates) => updateNode(selectedNode.id, updates)}
          />
        </TabPane>
        
        <TabPane tab="Style" key="style">
          <StylePanel 
            node={selectedNode} 
            widget={widget}
            onUpdate={(updates) => updateNode(selectedNode.id, updates)}
          />
        </TabPane>
        
        <TabPane tab="Responsive" key="responsive">
          <ResponsivePropertyPanel 
            node={selectedNode} 
            onUpdate={(updates) => updateNode(selectedNode.id, updates)}
          />
        </TabPane>
        
        <TabPane tab="Dynamic" key="dynamic">
          <DynamicContentPanel 
            node={selectedNode} 
            onUpdate={(updates) => updateNode(selectedNode.id, updates)}
          />
        </TabPane>
        
        <TabPane tab="Animation" key="animation">
          <AnimationPanel 
            node={selectedNode} 
            onUpdate={(updates) => updateNode(selectedNode.id, updates)}
          />
        </TabPane>
        
        <TabPane tab="Visibility" key="visibility">
          <VisibilityPanel 
            node={selectedNode} 
            onUpdate={(updates) => updateNode(selectedNode.id, updates)}
          />
        </TabPane>
        
        <TabPane tab="Interactions" key="interactions">
          <InteractionPanel 
            node={selectedNode} 
            onUpdate={(updates) => updateNode(selectedNode.id, updates)}
          />
        </TabPane>
        
        <TabPane tab="Advanced" key="advanced">
          <AdvancedPanel 
            node={selectedNode} 
            widget={widget}
            onUpdate={(updates) => updateNode(selectedNode.id, updates)}
          />
        </TabPane>
      </Tabs>
    </div>
  );
}

/**
 * ContentPanel Component
 * Content editing for selected node
 */
function ContentPanel({ node, widget, onUpdate }) {
  const [form] = Form.useForm();

  // Update form when node changes
  React.useEffect(() => {
    form.setFieldsValue({
      content: node.content,
      headingLevel: node.headingLevel,
      alignment: node.alignment,
      label: node.label,
    });
  }, [node, form]);

  const handleValuesChange = (changedValues) => {
    onUpdate(changedValues);
  };

  // If widget has a custom inspector, use it
  if (widget && widget.inspector) {
    const Inspector = widget.inspector;
    return <Inspector node={node} onUpdate={onUpdate} />;
  }

  // Render content editor based on widget type
  const renderContentEditor = () => {
    switch (node.type) {
      case 'heading':
        return (
          <HeadingInspector node={node} onUpdate={onUpdate} />
        );

      case 'paragraph':
        return (
          <>
            <Form.Item label="Text" name="content">
              <Input.TextArea 
                rows={4} 
                placeholder="Enter paragraph text"
                onChange={(e) => onUpdate({ content: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Alignment" name="alignment">
              <Select 
                onChange={(value) => onUpdate({ alignment: value })}
              >
                <Select.Option value="left">Left</Select.Option>
                <Select.Option value="center">Center</Select.Option>
                <Select.Option value="right">Right</Select.Option>
                <Select.Option value="justify">Justify</Select.Option>
              </Select>
            </Form.Item>
          </>
        );

      case 'image':
        return (
          <ImageInspector
            node={node}
            onUpdate={onUpdate}
          />
        );

      case 'video':
        return (
          <VideoInspector
            node={node}
            onUpdate={onUpdate}
          />
        );

      case 'button':
        return (
          <>
            <Form.Item label="Button Text" name="content">
              <Input 
                placeholder="Click Me"
                onChange={(e) => onUpdate({ content: e.target.value })}
              />
            </Form.Item>
          </>
        );

      case 'form':
        return <FormWidget node={node} onUpdate={onUpdate} />;

      default:
        return (
          <Form.Item label="Content" name="content">
            <Input.TextArea 
              rows={4} 
              placeholder="Enter content"
              onChange={(e) => onUpdate({ content: e.target.value })}
            />
          </Form.Item>
        );
    }
  };

  // Widgets that manage their own state — render without Ant Design Form wrapper
  // to avoid circular update loops from onValuesChange + useEffect
  if (node.type === 'form' || node.type === 'image' || node.type === 'video' || node.type === 'heading') {
    return renderContentEditor();
  }

  return (
    <Form
      form={form}
      layout="vertical"
      size="small"
      onValuesChange={handleValuesChange}
    >
      {renderContentEditor()}
    </Form>
  );
}

/**
 * StylePanel Component
 * Style editing for selected node
 */
function StylePanel({ node, widget, onUpdate }) {
  const styles = node.styles || {};
  const defaultStyles = widget?.defaultStyles || {};
  const [form] = Form.useForm();
  const [mediaLibraryVisible, setMediaLibraryVisible] = useState(false);

  // Normalize color values for ColorPicker
  const normalizeColorValue = (value) => {
    if (!value) return undefined;
    // If value is an object with metaColor (Ant Design internal format), extract the hex string
    if (typeof value === 'object' && value.metaColor) {
      return value.toHexString ? value.toHexString() : undefined;
    }
    // If already a string, return as-is
    if (typeof value === 'string') return value;
    return undefined;
  };

  // Parse numeric values from CSS strings (e.g., "16px" → 16)
  const parseNumericValue = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  };

  React.useEffect(() => {
    // Merge default styles with node styles (node styles take precedence)
    // This ensures the form always shows current values, not blank fields
    const mergedStyles = { ...defaultStyles, ...styles };
    const formValues = {};
    
    Object.keys(mergedStyles).forEach(key => {
      const val = mergedStyles[key];
      if (key.toLowerCase().includes('color')) {
        // Color fields: normalize objects → hex string
        formValues[key] = normalizeColorValue(val) || val;
      } else if (key === 'backgroundGradient') {
        // Check if background is a gradient and extract it
        if (styles.background && typeof styles.background === 'string' && styles.background.includes('gradient')) {
          formValues[key] = styles.background;
        } else {
          formValues[key] = val || 'none';
        }
      } else if (key === 'backgroundImage') {
        // Strip url() wrapper so the Input shows a plain URL
        if (typeof val === 'string' && val.startsWith('url(')) {
          formValues[key] = val.slice(4, -1).replace(/['"]/g, '');
        } else {
          formValues[key] = val;
        }
      } else if (['fontSize', 'lineHeight', 'letterSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 
                   'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'gap', 'borderRadius', 'borderWidth',
                   'width', 'height', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight'].includes(key)) {
        // Parse numeric values from CSS strings
        formValues[key] = parseNumericValue(val);
      } else {
        formValues[key] = val;
      }
    });
    
    // Set all form values at once to populate fields
    form.setFieldsValue(formValues);
  }, [styles, defaultStyles, form, node.id]); // Re-run when node changes

  const handleValuesChange = (changedValues) => {
    const normalized = {};
    Object.keys(changedValues).forEach(key => {
      const val = changedValues[key];
      // ColorPicker returns an AggregationColor object — extract hex string
      if (val && typeof val === 'object' && typeof val.toHexString === 'function') {
        normalized[key] = val.toHexString();
      } else if (val && typeof val === 'object' && typeof val.toRgbString === 'function') {
        normalized[key] = val.toRgbString();
      } else if (key === 'backgroundGradient') {
        // backgroundGradient is not a real CSS property — store as 'background'
        if (!val || val === 'none') {
          normalized.backgroundGradient = 'none';
          // Only clear background if it was previously a gradient
          if (typeof styles.background === 'string' && styles.background.includes('gradient')) {
            normalized.background = '';
          }
        } else {
          // Store gradient as both internal flag and actual CSS background
          normalized.backgroundGradient = val;
          normalized.background = val; // This applies the gradient to the element
        }
      } else if (key === 'backgroundImage') {
        // backgroundImage URL needs url() wrapping for CSS
        normalized.backgroundImage = val;
        if (val && val !== 'none' && !val.startsWith('url(')) {
          normalized.backgroundImage = `url(${val})`;
        }
      } else if (['fontSize', 'letterSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
                   'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'gap', 'borderRadius', 'borderWidth'].includes(key)) {
        // Add 'px' suffix for numeric CSS properties
        normalized[key] = typeof val === 'number' ? `${val}px` : val;
      } else {
        normalized[key] = val;
      }
    });
    onUpdate({ styles: { ...styles, ...normalized } });
  };

  return (
    <>
    <Form form={form} layout="vertical" size="small" onValuesChange={handleValuesChange}>
      <Collapse defaultActiveKey={['typography']} size="small" ghost>
        <Collapse.Panel header="Typography" key="typography">
          <Form.Item label="Font Family" name="fontFamily">
            <Select>
              <Select.Option value="inherit">Inherit</Select.Option>
              <Select.Option value="Arial, sans-serif">Arial</Select.Option>
              <Select.Option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</Select.Option>
              <Select.Option value="Georgia, serif">Georgia</Select.Option>
              <Select.Option value="'Times New Roman', Times, serif">Times New Roman</Select.Option>
              <Select.Option value="'Courier New', Courier, monospace">Courier New</Select.Option>
              <Select.Option value="Verdana, sans-serif">Verdana</Select.Option>
              <Select.Option value="'Trebuchet MS', sans-serif">Trebuchet MS</Select.Option>
              <Select.Option value="'Segoe UI', sans-serif">Segoe UI</Select.Option>
              <Select.Option value="Roboto, sans-serif">Roboto</Select.Option>
              <Select.Option value="'Open Sans', sans-serif">Open Sans</Select.Option>
              <Select.Option value="Lato, sans-serif">Lato</Select.Option>
              <Select.Option value="Montserrat, sans-serif">Montserrat</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Font Size (px)" name="fontSize">
            <InputNumber min={8} max={200} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Font Weight" name="fontWeight">
            <Select>
              <Select.Option value="100">Thin (100)</Select.Option>
              <Select.Option value="300">Light (300)</Select.Option>
              <Select.Option value="400">Normal (400)</Select.Option>
              <Select.Option value="500">Medium (500)</Select.Option>
              <Select.Option value="600">Semi Bold (600)</Select.Option>
              <Select.Option value="700">Bold (700)</Select.Option>
              <Select.Option value="800">Extra Bold (800)</Select.Option>
              <Select.Option value="900">Black (900)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Line Height" name="lineHeight">
            <InputNumber min={0.8} max={3} step={0.1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Letter Spacing (px)" name="letterSpacing">
            <InputNumber min={-5} max={20} step={0.5} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Text Color" name="color">
            <ColorPicker showText style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Text Align" name="textAlign">
            <Select>
              <Select.Option value="left">Left</Select.Option>
              <Select.Option value="center">Center</Select.Option>
              <Select.Option value="right">Right</Select.Option>
              <Select.Option value="justify">Justify</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Text Transform" name="textTransform">
            <Select>
              <Select.Option value="none">None</Select.Option>
              <Select.Option value="uppercase">Uppercase</Select.Option>
              <Select.Option value="lowercase">Lowercase</Select.Option>
              <Select.Option value="capitalize">Capitalize</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Text Decoration" name="textDecoration">
            <Select>
              <Select.Option value="none">None</Select.Option>
              <Select.Option value="underline">Underline</Select.Option>
              <Select.Option value="line-through">Line Through</Select.Option>
              <Select.Option value="overline">Overline</Select.Option>
            </Select>
          </Form.Item>
        </Collapse.Panel>

        <Collapse.Panel header="Spacing" key="spacing">
          <Form.Item label="Padding Top (px)" name="paddingTop">
            <InputNumber min={0} max={200} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Padding Right (px)" name="paddingRight">
            <InputNumber min={0} max={200} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Padding Bottom (px)" name="paddingBottom">
            <InputNumber min={0} max={200} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Padding Left (px)" name="paddingLeft">
            <InputNumber min={0} max={200} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Margin Top (px)" name="marginTop">
            <InputNumber min={0} max={200} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Margin Right (px)" name="marginRight">
            <InputNumber min={0} max={200} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Margin Bottom (px)" name="marginBottom">
            <InputNumber min={0} max={200} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Margin Left (px)" name="marginLeft">
            <InputNumber min={0} max={200} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Gap (px)" name="gap">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Collapse.Panel>

        <Collapse.Panel header="Size" key="size">
          <Form.Item label="Width" name="width">
            <Select>
              <Select.Option value="auto">Auto</Select.Option>
              <Select.Option value="100%">100%</Select.Option>
              <Select.Option value="75%">75%</Select.Option>
              <Select.Option value="50%">50%</Select.Option>
              <Select.Option value="25%">25%</Select.Option>
              <Select.Option value="custom">Custom</Select.Option>
            </Select>
          </Form.Item>

          {styles.width === 'custom' && (
            <Form.Item label="Custom Width (px)" name="customWidth">
              <InputNumber min={1} max={2000} style={{ width: '100%' }} />
            </Form.Item>
          )}

          <Form.Item label="Height" name="height">
            <Select>
              <Select.Option value="auto">Auto</Select.Option>
              <Select.Option value="100%">100%</Select.Option>
              <Select.Option value="custom">Custom</Select.Option>
            </Select>
          </Form.Item>

          {styles.height === 'custom' && (
            <Form.Item label="Custom Height (px)" name="customHeight">
              <InputNumber min={1} max={2000} style={{ width: '100%' }} />
            </Form.Item>
          )}

          <Form.Item label="Min Height (px)" name="minHeight">
            <InputNumber min={0} max={2000} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Max Width (px)" name="maxWidth">
            <InputNumber min={0} max={2000} style={{ width: '100%' }} />
          </Form.Item>
        </Collapse.Panel>

        <Collapse.Panel header="Background" key="background">
          <Form.Item label="Background Color" name="backgroundColor">
            <ColorPicker showText style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Background Gradient" name="backgroundGradient">
            <Select>
              <Select.Option value="none">None</Select.Option>
              <Select.Option value="linear-gradient(90deg, #667eea 0%, #764ba2 100%)">Purple</Select.Option>
              <Select.Option value="linear-gradient(90deg, #f093fb 0%, #f5576c 100%)">Pink</Select.Option>
              <Select.Option value="linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)">Blue</Select.Option>
              <Select.Option value="linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)">Green</Select.Option>
              <Select.Option value="linear-gradient(90deg, #fa709a 0%, #fee140 100%)">Orange</Select.Option>
              <Select.Option value="linear-gradient(180deg, #2af598 0%, #009efd 100%)">Teal</Select.Option>
              <Select.Option value="radial-gradient(circle, #667eea 0%, #764ba2 100%)">Radial Purple</Select.Option>
              <Select.Option value="conic-gradient(from 0deg, #667eea, #764ba2, #667eea)">Conic</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Background Image URL" name="backgroundImage">
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>
          
          <Button
            icon={<PictureOutlined />}
            onClick={() => setMediaLibraryVisible(true)}
            size="small"
            block
            style={{ marginBottom: 12 }}
          >
            Select from Media Library
          </Button>

          <Form.Item label="Background Size" name="backgroundSize">
            <Select>
              <Select.Option value="cover">Cover</Select.Option>
              <Select.Option value="contain">Contain</Select.Option>
              <Select.Option value="auto">Auto</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Background Position" name="backgroundPosition">
            <Select>
              <Select.Option value="center">Center</Select.Option>
              <Select.Option value="top">Top</Select.Option>
              <Select.Option value="bottom">Bottom</Select.Option>
              <Select.Option value="left">Left</Select.Option>
              <Select.Option value="right">Right</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Background Repeat" name="backgroundRepeat">
            <Select>
              <Select.Option value="no-repeat">No Repeat</Select.Option>
              <Select.Option value="repeat">Repeat</Select.Option>
              <Select.Option value="repeat-x">Repeat X</Select.Option>
              <Select.Option value="repeat-y">Repeat Y</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Backdrop Blur (px)" name="backdropBlur">
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>
        </Collapse.Panel>

        <Collapse.Panel header="Border" key="border">
          <Form.Item label="Border Width (px)" name="borderWidth">
            <InputNumber min={0} max={20} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Border Style" name="borderStyle">
            <Select>
              <Select.Option value="solid">Solid</Select.Option>
              <Select.Option value="dashed">Dashed</Select.Option>
              <Select.Option value="dotted">Dotted</Select.Option>
              <Select.Option value="double">Double</Select.Option>
              <Select.Option value="none">None</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Border Color" name="borderColor">
            <ColorPicker showText style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Border Radius (px)" name="borderRadius">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Border Top Left Radius (px)" name="borderTopLeftRadius">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Border Top Right Radius (px)" name="borderTopRightRadius">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Border Bottom Left Radius (px)" name="borderBottomLeftRadius">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Border Bottom Right Radius (px)" name="borderBottomRightRadius">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Collapse.Panel>

        <Collapse.Panel header="Shadow" key="shadow">
          <Form.Item label="Box Shadow" name="boxShadow">
            <Select>
              <Select.Option value="none">None</Select.Option>
              <Select.Option value="0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)">Small</Select.Option>
              <Select.Option value="0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)">Medium</Select.Option>
              <Select.Option value="0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)">Large</Select.Option>
              <Select.Option value="0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)">Extra Large</Select.Option>
              <Select.Option value="inset 0 1px 3px rgba(0,0,0,0.12)">Inset</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Text Shadow" name="textShadow">
            <Select>
              <Select.Option value="none">None</Select.Option>
              <Select.Option value="0 1px 2px rgba(0,0,0,0.3)">Small</Select.Option>
              <Select.Option value="0 2px 4px rgba(0,0,0,0.4)">Medium</Select.Option>
              <Select.Option value="0 4px 8px rgba(0,0,0,0.5)">Large</Select.Option>
            </Select>
          </Form.Item>
        </Collapse.Panel>

        <Collapse.Panel header="Opacity" key="opacity">
          <Form.Item label="Opacity" name="opacity">
            <Slider min={0} max={1} step={0.01} />
          </Form.Item>
        </Collapse.Panel>

        <Collapse.Panel header="Display" key="display">
          <Form.Item label="Display" name="display">
            <Select>
              <Select.Option value="block">Block</Select.Option>
              <Select.Option value="inline">Inline</Select.Option>
              <Select.Option value="inline-block">Inline Block</Select.Option>
              <Select.Option value="flex">Flex</Select.Option>
              <Select.Option value="grid">Grid</Select.Option>
              <Select.Option value="none">None</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Position" name="position">
            <Select>
              <Select.Option value="static">Static</Select.Option>
              <Select.Option value="relative">Relative</Select.Option>
              <Select.Option value="absolute">Absolute</Select.Option>
              <Select.Option value="fixed">Fixed</Select.Option>
              <Select.Option value="sticky">Sticky</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Z-Index" name="zIndex">
            <InputNumber min={-9999} max={9999} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Overflow" name="overflow">
            <Select>
              <Select.Option value="visible">Visible</Select.Option>
              <Select.Option value="hidden">Hidden</Select.Option>
              <Select.Option value="scroll">Scroll</Select.Option>
              <Select.Option value="auto">Auto</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Overflow X" name="overflowX">
            <Select>
              <Select.Option value="visible">Visible</Select.Option>
              <Select.Option value="hidden">Hidden</Select.Option>
              <Select.Option value="scroll">Scroll</Select.Option>
              <Select.Option value="auto">Auto</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Overflow Y" name="overflowY">
            <Select>
              <Select.Option value="visible">Visible</Select.Option>
              <Select.Option value="hidden">Hidden</Select.Option>
              <Select.Option value="scroll">Scroll</Select.Option>
              <Select.Option value="auto">Auto</Select.Option>
            </Select>
          </Form.Item>
        </Collapse.Panel>

        <Collapse.Panel header="Flex" key="flex">
          <Form.Item label="Flex Direction" name="flexDirection">
            <Select>
              <Select.Option value="row">Row</Select.Option>
              <Select.Option value="row-reverse">Row Reverse</Select.Option>
              <Select.Option value="column">Column</Select.Option>
              <Select.Option value="column-reverse">Column Reverse</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Justify Content" name="justifyContent">
            <Select>
              <Select.Option value="flex-start">Flex Start</Select.Option>
              <Select.Option value="flex-end">Flex End</Select.Option>
              <Select.Option value="center">Center</Select.Option>
              <Select.Option value="space-between">Space Between</Select.Option>
              <Select.Option value="space-around">Space Around</Select.Option>
              <Select.Option value="space-evenly">Space Evenly</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Align Items" name="alignItems">
            <Select>
              <Select.Option value="flex-start">Flex Start</Select.Option>
              <Select.Option value="flex-end">Flex End</Select.Option>
              <Select.Option value="center">Center</Select.Option>
              <Select.Option value="baseline">Baseline</Select.Option>
              <Select.Option value="stretch">Stretch</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Align Content" name="alignContent">
            <Select>
              <Select.Option value="flex-start">Flex Start</Select.Option>
              <Select.Option value="flex-end">Flex End</Select.Option>
              <Select.Option value="center">Center</Select.Option>
              <Select.Option value="space-between">Space Between</Select.Option>
              <Select.Option value="space-around">Space Around</Select.Option>
              <Select.Option value="stretch">Stretch</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Flex Wrap" name="flexWrap">
            <Select>
              <Select.Option value="nowrap">No Wrap</Select.Option>
              <Select.Option value="wrap">Wrap</Select.Option>
              <Select.Option value="wrap-reverse">Wrap Reverse</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Flex Grow" name="flexGrow">
            <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Flex Shrink" name="flexShrink">
            <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Flex Basis" name="flexBasis">
            <Select>
              <Select.Option value="auto">Auto</Select.Option>
              <Select.Option value="content">Content</Select.Option>
              <Select.Option value="custom">Custom</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Order" name="order">
            <InputNumber min={-999} max={999} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Align Self" name="alignSelf">
            <Select>
              <Select.Option value="auto">Auto</Select.Option>
              <Select.Option value="flex-start">Flex Start</Select.Option>
              <Select.Option value="flex-end">Flex End</Select.Option>
              <Select.Option value="center">Center</Select.Option>
              <Select.Option value="stretch">Stretch</Select.Option>
              <Select.Option value="baseline">Baseline</Select.Option>
            </Select>
          </Form.Item>
        </Collapse.Panel>

        <Collapse.Panel header="Grid" key="grid">
          <Form.Item label="Grid Template Columns" name="gridTemplateColumns">
            <Input placeholder="repeat(3, 1fr)" />
          </Form.Item>

          <Form.Item label="Grid Template Rows" name="gridTemplateRows">
            <Input placeholder="repeat(2, 1fr)" />
          </Form.Item>

          <Form.Item label="Grid Gap" name="gridGap">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Grid Column Gap" name="gridColumnGap">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Grid Row Gap" name="gridRowGap">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Justify Items" name="justifyItems">
            <Select>
              <Select.Option value="start">Start</Select.Option>
              <Select.Option value="end">End</Select.Option>
              <Select.Option value="center">Center</Select.Option>
              <Select.Option value="stretch">Stretch</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Align Items" name="gridAlignItems">
            <Select>
              <Select.Option value="start">Start</Select.Option>
              <Select.Option value="end">End</Select.Option>
              <Select.Option value="center">Center</Select.Option>
              <Select.Option value="stretch">Stretch</Select.Option>
            </Select>
          </Form.Item>
        </Collapse.Panel>

        <Collapse.Panel header="Filters" key="filters">
          <Form.Item label="Blur (px)" name="filterBlur">
            <InputNumber min={0} max={20} step={0.5} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Brightness (%)" name="filterBrightness">
            <Slider min={0} max={200} step={5} marks={{ 0: '0%', 100: '100%', 200: '200%' }} />
          </Form.Item>

          <Form.Item label="Contrast (%)" name="filterContrast">
            <Slider min={0} max={200} step={5} marks={{ 0: '0%', 100: '100%', 200: '200%' }} />
          </Form.Item>

          <Form.Item label="Grayscale (%)" name="filterGrayscale">
            <Slider min={0} max={100} step={5} marks={{ 0: '0%', 100: '100%' }} />
          </Form.Item>

          <Form.Item label="Saturate (%)" name="filterSaturate">
            <Slider min={0} max={200} step={5} marks={{ 0: '0%', 100: '100%', 200: '200%' }} />
          </Form.Item>

          <Form.Item label="Hue Rotate (deg)" name="filterHueRotate">
            <Slider min={0} max={360} step={15} marks={{ 0: '0°', 90: '90°', 180: '180°', 270: '270°', 360: '360°' }} />
          </Form.Item>

          <Form.Item label="Invert (%)" name="filterInvert">
            <Slider min={0} max={100} step={5} marks={{ 0: '0%', 100: '100%' }} />
          </Form.Item>

          <Form.Item label="Opacity (%)" name="filterOpacity">
            <Slider min={0} max={100} step={1} marks={{ 0: '0%', 100: '100%' }} />
          </Form.Item>
        </Collapse.Panel>

        <Collapse.Panel header="Transform" key="transform">
          <Form.Item label="Rotate (deg)" name="transformRotate">
            <Slider min={-180} max={180} step={5} marks={{ '-180': '-180°', '-90': '-90°', 0: '0°', 90: '90°', 180: '180°' }} />
          </Form.Item>

          <Form.Item label="Scale X" name="transformScaleX">
            <Slider min={0.1} max={3} step={0.1} marks={{ 0.1: '0.1x', 1: '1x', 2: '2x', 3: '3x' }} />
          </Form.Item>

          <Form.Item label="Scale Y" name="transformScaleY">
            <Slider min={0.1} max={3} step={0.1} marks={{ 0.1: '0.1x', 1: '1x', 2: '2x', 3: '3x' }} />
          </Form.Item>

          <Form.Item label="Translate X (px)" name="transformTranslateX">
            <InputNumber min={-500} max={500} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Translate Y (px)" name="transformTranslateY">
            <InputNumber min={-500} max={500} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Skew X (deg)" name="transformSkewX">
            <Slider min={-45} max={45} step={5} marks={{ '-45': '-45°', 0: '0°', 45: '45°' }} />
          </Form.Item>

          <Form.Item label="Skew Y (deg)" name="transformSkewY">
            <Slider min={-45} max={45} step={5} marks={{ '-45': '-45°', 0: '0°', 45: '45°' }} />
          </Form.Item>

          <Form.Item label="Transform Origin" name="transformOrigin">
            <Select>
              <Select.Option value="center">Center</Select.Option>
              <Select.Option value="top">Top</Select.Option>
              <Select.Option value="bottom">Bottom</Select.Option>
              <Select.Option value="left">Left</Select.Option>
              <Select.Option value="right">Right</Select.Option>
              <Select.Option value="top left">Top Left</Select.Option>
              <Select.Option value="top right">Top Right</Select.Option>
              <Select.Option value="bottom left">Bottom Left</Select.Option>
              <Select.Option value="bottom right">Bottom Right</Select.Option>
            </Select>
          </Form.Item>
        </Collapse.Panel>

        <Collapse.Panel header="Clip Path" key="clipPath">
          <Form.Item label="Clip Path" name="clipPath">
            <Select>
              <Select.Option value="none">None</Select.Option>
              <Select.Option value="circle(50%)">Circle</Select.Option>
              <Select.Option value="polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)">Diamond</Select.Option>
              <Select.Option value="polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)">Pentagon</Select.Option>
              <Select.Option value="polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)">Hexagon</Select.Option>
              <Select.Option value="polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)">Star</Select.Option>
              <Select.Option value="inset(10% 10% 10% 10%)">Inset</Select.Option>
            </Select>
          </Form.Item>
        </Collapse.Panel>
      </Collapse>
    </Form>
    
    {/* Media Library Modal */}
    <MediaLibraryModal
      visible={mediaLibraryVisible}
      onClose={() => setMediaLibraryVisible(false)}
      onSelect={(media) => {
        // Set the backgroundImage field with the selected media URL
        const imageUrl = media.file_path || media.url;
        form.setFieldsValue({ backgroundImage: imageUrl });
        handleValuesChange({ backgroundImage: imageUrl });
        setMediaLibraryVisible(false);
      }}
    />
  </>
  );
}

/**
 * AdvancedPanel Component
 * Advanced properties for selected node
 */
function AdvancedPanel({ node, widget, onUpdate }) {
  const settings = node.settings || {};
  const [form] = Form.useForm();

  React.useEffect(() => {
    form.setFieldsValue(settings);
  }, [settings, form]);

  const handleValuesChange = (changedValues) => {
    onUpdate({ settings: { ...settings, ...changedValues } });
  };

  return (
    <>
      {/* Info Section */}
      <Alert
        message="Advanced Settings"
        description={
          <div style={{ fontSize: 12, lineHeight: 1.6 }}>
            <p style={{ marginBottom: 8 }}>
              Fine-tune technical aspects and add custom code for advanced customization.
            </p>
            <p style={{ marginBottom: 8 }}>
              <strong>Key Features:</strong>
            </p>
            <ul style={{ marginLeft: 16, marginBottom: 8 }}>
              <li><strong>CSS Classes & IDs:</strong> Add custom identifiers for styling or JavaScript targeting</li>
              <li><strong>Visibility Controls:</strong> Show/hide on specific devices (desktop, tablet, mobile)</li>
              <li><strong>Custom Attributes:</strong> Add data attributes for JavaScript or tracking</li>
              <li><strong>ARIA Labels:</strong> Improve accessibility for screen readers</li>
              <li><strong>Custom CSS:</strong> Write custom styles specific to this element</li>
            </ul>
            <p style={{ marginBottom: 0 }}>
              <strong>Note:</strong> Use the Animation tab (not this panel) for animation effects.
            </p>
          </div>
        }
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />

    <Form form={form} layout="vertical" size="small" onValuesChange={handleValuesChange}>
      <Collapse defaultActiveKey={['general']} size="small" ghost>
        <Collapse.Panel header="General" key="general">
          <Form.Item label="CSS Class" name="cssClass">
            <Input placeholder="custom-class" />
          </Form.Item>

          <Form.Item label="ID" name="id">
            <Input placeholder="element-id" />
          </Form.Item>
        </Collapse.Panel>

        <Collapse.Panel header="Visibility" key="visibility">
          <Form.Item label="Desktop" name="visibleDesktop">
            <Switch defaultChecked />
          </Form.Item>

          <Form.Item label="Tablet" name="visibleTablet">
            <Switch defaultChecked />
          </Form.Item>

          <Form.Item label="Mobile" name="visibleMobile">
            <Switch defaultChecked />
          </Form.Item>
        </Collapse.Panel>

        <Collapse.Panel header="Custom Attributes" key="attributes">
          <Form.Item label="Data Attributes" name="dataAttributes">
            <Input.TextArea 
              rows={3} 
              placeholder='{"key": "value"}'
            />
          </Form.Item>

          <Form.Item label="ARIA Label" name="ariaLabel">
            <Input placeholder="Accessible label" />
          </Form.Item>

          <Form.Item label="ARIA Role" name="ariaRole">
            <Select>
              <Select.Option value="">None</Select.Option>
              <Select.Option value="button">Button</Select.Option>
              <Select.Option value="link">Link</Select.Option>
              <Select.Option value="navigation">Navigation</Select.Option>
              <Select.Option value="main">Main</Select.Option>
              <Select.Option value="article">Article</Select.Option>
              <Select.Option value="section">Section</Select.Option>
              <Select.Option value="aside">Aside</Select.Option>
            </Select>
          </Form.Item>
        </Collapse.Panel>

        <Collapse.Panel header="Custom CSS" key="customCss">
          <Form.Item label="Custom CSS" name="customCss">
            <Input.TextArea 
              rows={8} 
              placeholder=".custom-class { color: red; }"
              style={{ fontFamily: 'monospace', fontSize: '13px' }}
            />
          </Form.Item>
        </Collapse.Panel>

        <Collapse.Panel header="Animation" key="animation">
          <Form.Item label="Animation Type" name="animationType">
            <Select>
              <Select.Option value="none">None</Select.Option>
              <Select.Option value="fade-in">Fade In</Select.Option>
              <Select.Option value="slide-up">Slide Up</Select.Option>
              <Select.Option value="slide-down">Slide Down</Select.Option>
              <Select.Option value="slide-left">Slide Left</Select.Option>
              <Select.Option value="slide-right">Slide Right</Select.Option>
              <Select.Option value="zoom-in">Zoom In</Select.Option>
              <Select.Option value="zoom-out">Zoom Out</Select.Option>
              <Select.Option value="bounce">Bounce</Select.Option>
              <Select.Option value="rotate">Rotate</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Animation Duration (ms)" name="animationDuration">
            <InputNumber min={100} max={5000} step={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Animation Delay (ms)" name="animationDelay">
            <InputNumber min={0} max={5000} step={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Animation Iteration" name="animationIteration">
            <Select>
              <Select.Option value="1">Once</Select.Option>
              <Select.Option value="2">Twice</Select.Option>
              <Select.Option value="3">Three Times</Select.Option>
              <Select.Option value="infinite">Infinite</Select.Option>
            </Select>
          </Form.Item>
        </Collapse.Panel>
      </Collapse>
    </Form>
    </>
  );
}
