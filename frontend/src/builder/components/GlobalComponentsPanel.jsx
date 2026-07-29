/**
 * GlobalComponentsPanel Component
 * Panel for managing reusable global components
 */

import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Card, Row, Col, Button, Empty, message, Popconfirm, Tooltip, Tag } from 'antd';
import { SaveOutlined, DeleteOutlined, CopyOutlined, EditOutlined, SearchOutlined, AppstoreOutlined } from '@ant-design/icons';
import globalComponentManager from '../core/GlobalComponentManager';
import { globalComponentTypes } from '../utils/types';

const { Search } = Input;

/**
 * GlobalComponentsPanel Component
 */
export default function GlobalComponentsPanel({ visible, onClose, onInsertComponent }) {
  const [components, setComponents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [saveForm, setSaveForm] = useState({
    name: '',
    category: 'general',
  });

  useEffect(() => {
    if (visible) {
      loadComponents();
    }
  }, [visible]);

  const loadComponents = () => {
    setComponents(globalComponentManager.getAllComponents());
    setCategories(['all', ...globalComponentManager.getCategories()]);
  };

  const filteredComponents = components.filter(component => {
    const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
    const matchesSearch = component.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveAsGlobal = (node) => {
    setSelectedNode(node);
    setSaveForm({
      name: `${node.type} - ${new Date().toLocaleDateString()}`,
      category: 'general',
    });
    setSaveModalVisible(true);
  };

  const handleSaveComponent = () => {
    if (!selectedNode) return;

    const componentId = globalComponentManager.saveComponent({
      name: saveForm.name,
      type: getComponentType(selectedNode),
      data: selectedNode,
      category: saveForm.category,
    });

    setSaveModalVisible(false);
    loadComponents();
    message.success('Component saved successfully');
  };

  const handleInsertComponent = (component) => {
    if (onInsertComponent) {
      onInsertComponent(component);
    }
  };

  const handleDeleteComponent = (componentId) => {
    globalComponentManager.deleteComponent(componentId);
    loadComponents();
    message.success('Component deleted');
  };

  const handleDuplicateComponent = (componentId) => {
    globalComponentManager.duplicateComponent(componentId);
    loadComponents();
    message.success('Component duplicated');
  };

  const getComponentType = (node) => {
    if (node.type === 'section') return 'section';
    if (node.type === 'container') return 'container';
    return 'widget';
  };

  const getComponentIcon = (type) => {
    switch (type) {
      case 'section': return '📄';
      case 'container': return '📦';
      default: return '🧩';
    }
  };

  return (
    <>
      <Modal
        title="Global Components"
        open={visible}
        onCancel={onClose}
        width={900}
        footer={null}
      >
        {/* Search and Filter */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
          <Search
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
            prefix={<SearchOutlined />}
          />
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{ width: 150 }}
          >
            {categories.map(category => (
              <Select.Option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Components Grid */}
        {filteredComponents.length === 0 ? (
          <Empty
            description="No global components found"
            style={{ margin: '40px 0' }}
          />
        ) : (
          <Row gutter={[16, ]}>
            {filteredComponents.map(component => (
              <Col key={component.id} span={8}>
                <Card
                  hoverable
                  size="small"
                  style={{ height: '100%' }}
                  actions={[
                    <Tooltip title="Insert">
                      <Button
                        type="text"
                        icon={<AppstoreOutlined />}
                        onClick={() => handleInsertComponent(component)}
                      />
                    </Tooltip>,
                    <Tooltip title="Duplicate">
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => handleDuplicateComponent(component.id)}
                      />
                    </Tooltip>,
                    <Popconfirm
                      title="Delete this component?"
                      onConfirm={() => handleDeleteComponent(component.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Tooltip title="Delete">
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Tooltip>
                    </Popconfirm>,
                  ]}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{getComponentIcon(component.type)}</span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {component.name}
                      </div>
                      <Tag color="blue" style={{ fontSize: 10, marginTop: 4 }}>
                        {component.type}
                      </Tag>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {component.category}
                  </div>
                  <div style={{ fontSize: 11, color: '#ccc', marginTop: 4 }}>
                    {component.instances.length} instance(s)
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Modal>

      {/* Save as Global Modal */}
      <Modal
        title="Save as Global Component"
        open={saveModalVisible}
        onCancel={() => setSaveModalVisible(false)}
        onOk={handleSaveComponent}
        okText="Save"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Component Name
          </label>
          <Input
            value={saveForm.name}
            onChange={(e) => setSaveForm({ ...saveForm, name: e.target.value })}
            placeholder="Enter component name"
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Category
          </label>
          <Select
            value={saveForm.category}
            onChange={(value) => setSaveForm({ ...saveForm, category: value })}
            style={{ width: '100%' }}
          >
            <Select.Option value="general">General</Select.Option>
            <Select.Option value="headers">Headers</Select.Option>
            <Select.Option value="footers">Footers</Select.Option>
            <Select.Option value="hero">Hero Sections</Select.Option>
            <Select.Option value="features">Features</Select.Option>
            <Select.Option value="testimonials">Testimonials</Select.Option>
            <Select.Option value="pricing">Pricing</Select.Option>
            <Select.Option value="cta">CTA Sections</Select.Option>
            <Select.Option value="forms">Forms</Select.Option>
            <Select.Option value="custom">Custom</Select.Option>
          </Select>
        </div>
      </Modal>
    </>
  );
}

/**
 * Hook to expose save as global functionality
 */
export function useGlobalComponents() {
  const handleSaveAsGlobal = (node, callback) => {
    // This would typically open the save modal
    // For now, just save with default values
    const componentId = globalComponentManager.saveComponent({
      name: `${node.type} - ${new Date().toLocaleDateString()}`,
      type: node.type === 'section' ? 'section' : node.type === 'container' ? 'container' : 'widget',
      data: node,
      category: 'general',
    });
    
    if (callback) callback(componentId);
  };

  return {
    saveAsGlobal: handleSaveAsGlobal,
    getComponents: globalComponentManager.getAllComponents,
    getComponent: globalComponentManager.getComponent,
  };
}
