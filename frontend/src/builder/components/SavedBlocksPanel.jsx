/**
 * SavedBlocksPanel Component
 * Panel for managing saved blocks with categories, search, and preview
 */

import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Card, Row, Col, Button, Empty, message, Popconfirm, Tooltip, Tag, Space } from 'antd';
import { SaveOutlined, DeleteOutlined, CopyOutlined, EditOutlined, SearchOutlined, AppstoreOutlined } from '@ant-design/icons';
import blockManager from '../core/BlockManager';

const { Search } = Input;

/**
 * SavedBlocksPanel Component
 */
export default function SavedBlocksPanel({ visible, onClose, onInsertBlock, onSaveBlock }) {
  const [blocks, setBlocks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState(null);
  const [saveForm, setSaveForm] = useState({
    name: '',
    category: 'general',
    description: '',
    tags: [],
  });

  useEffect(() => {
    if (visible) {
      loadBlocks();
    }
  }, [visible]);

  const loadBlocks = () => {
    setBlocks(blockManager.getAllBlocks());
    setCategories(['all', ...blockManager.getCategories()]);
  };

  const filteredBlocks = blocks.filter(block => {
    const matchesCategory = selectedCategory === 'all' || block.category === selectedCategory;
    const matchesSearch = block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         block.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         block.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSaveBlock = (nodes) => {
    setSelectedNodes(nodes);
    setSaveForm({
      name: `Block - ${new Date().toLocaleDateString()}`,
      category: 'general',
      description: '',
      tags: [],
    });
    setSaveModalVisible(true);
  };

  const handleSave = () => {
    if (!selectedNodes) return;

    const blockId = blockManager.saveBlock({
      name: saveForm.name,
      category: saveForm.category,
      data: selectedNodes,
      description: saveForm.description,
      tags: saveForm.tags,
    });

    setSaveModalVisible(false);
    loadBlocks();
    message.success('Block saved successfully');
  };

  const handleInsertBlock = (block) => {
    if (onInsertBlock) {
      onInsertBlock(block);
    }
  };

  const handleDeleteBlock = (blockId) => {
    blockManager.deleteBlock(blockId);
    loadBlocks();
    message.success('Block deleted');
  };

  const handleDuplicateBlock = (blockId) => {
    blockManager.duplicateBlock(blockId);
    loadBlocks();
    message.success('Block duplicated');
  };

  const handleRenameBlock = (blockId, newName) => {
    blockManager.renameBlock(blockId, newName);
    loadBlocks();
    message.success('Block renamed');
  };

  return (
    <>
      <Modal
        title="Saved Blocks"
        open={visible}
        onCancel={onClose}
        width={900}
        footer={null}
      >
        {/* Search and Filter */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
          <Search
            placeholder="Search blocks..."
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

        {/* Blocks Grid */}
        {filteredBlocks.length === 0 ? (
          <Empty
            description="No saved blocks found"
            style={{ margin: '40px 0' }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredBlocks.map(block => (
              <Col key={block.id} span={8}>
                <Card
                  hoverable
                  size="small"
                  style={{ height: '100%' }}
                  actions={[
                    <Tooltip title="Insert">
                      <Button
                        type="text"
                        icon={<AppstoreOutlined />}
                        onClick={() => handleInsertBlock(block)}
                      />
                    </Tooltip>,
                    <Tooltip title="Duplicate">
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => handleDuplicateBlock(block.id)}
                      />
                    </Tooltip>,
                    <Popconfirm
                      title="Delete this block?"
                      onConfirm={() => handleDeleteBlock(block.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Tooltip title="Delete">
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Tooltip>
                    </Popconfirm>,
                  ]}
                >
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{block.name}</div>
                    <Tag color="blue" style={{ fontSize: 10 }}>{block.category}</Tag>
                  </div>
                  {block.description && (
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                      {block.description}
                    </div>
                  )}
                  {block.tags.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      {block.tags.slice(0, 3).map((tag, index) => (
                        <Tag key={index} style={{ fontSize: 10 }}>{tag}</Tag>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#999' }}>
                    {new Date(block.metadata.createdAt).toLocaleDateString()}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Modal>

      {/* Save Block Modal */}
      <Modal
        title="Save as Block"
        open={saveModalVisible}
        onCancel={() => setSaveModalVisible(false)}
        onOk={handleSave}
        okText="Save"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Block Name
          </label>
          <Input
            value={saveForm.name}
            onChange={(e) => setSaveForm({ ...saveForm, name: e.target.value })}
            placeholder="Enter block name"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Category
          </label>
          <Select
            value={saveForm.category}
            onChange={(value) => setSaveForm({ ...saveForm, category: value })}
            style={{ width: '100%' }}
          >
            <Select.Option value="general">General</Select.Option>
            <Select.Option value="hero">Hero Sections</Select.Option>
            <Select.Option value="features">Features</Select.Option>
            <Select.Option value="testimonials">Testimonials</Select.Option>
            <Select.Option value="pricing">Pricing</Select.Option>
            <Select.Option value="cta">CTA Sections</Select.Option>
            <Select.Option value="footer">Footers</Select.Option>
            <Select.Option value="forms">Forms</Select.Option>
            <Select.Option value="custom">Custom</Select.Option>
          </Select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Description
          </label>
          <Input.TextArea
            value={saveForm.description}
            onChange={(e) => setSaveForm({ ...saveForm, description: e.target.value })}
            placeholder="Enter block description"
            rows={3}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Tags (comma-separated)
          </label>
          <Input
            value={saveForm.tags.join(', ')}
            onChange={(e) => setSaveForm({ ...saveForm, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
            placeholder="tag1, tag2, tag3"
          />
        </div>
      </Modal>
    </>
  );
}

/**
 * Hook to use saved blocks
 */
export function useSavedBlocks() {
  const saveBlock = (nodes, metadata) => {
    return blockManager.saveBlock({
      data: nodes,
      ...metadata,
    });
  };

  const getBlocks = () => {
    return blockManager.getAllBlocks();
  };

  const getBlock = (id) => {
    return blockManager.getBlock(id);
  };

  return {
    saveBlock,
    getBlocks,
    getBlock,
    searchBlocks: blockManager.searchBlocks,
  };
}
