/**
 * Navigator Component
 * Left-side panel showing hierarchical view of the page structure with enhanced features
 */

import React, { useMemo, useState } from 'react';
import { Tree, Empty, Input, Modal, message, Dropdown, Menu } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, CopyOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useBuilderPage, useBuilderSelection, useBuilderActions } from '../core/BuilderStore.jsx';

const { Search } = Input;

/**
 * Navigator Component
 */
export default function Navigator() {
  const page = useBuilderPage();
  const { selectedNodeId } = useBuilderSelection();
  const { selectNode, deleteNode, duplicateNode, renameNode } = useBuilderActions();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [editingNode, setEditingNode] = useState(null);
  const [newLabel, setNewLabel] = useState('');

  // Convert BuilderNode tree to Ant Design Tree data format
  const treeData = useMemo(() => {
    if (!page || !page.root) return [];

    const convertNodeToTreeData = (node) => {
      const treeNode = {
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 8 }}>
            <span>{node.label || node.type}</span>
            <Dropdown
              overlay={
                <Menu onClick={(e) => handleMenuClick(e, node)}>
                  <Menu.Item key="rename" icon={<EditOutlined />}>Rename</Menu.Item>
                  <Menu.Item key="duplicate" icon={<CopyOutlined />}>Duplicate</Menu.Item>
                  <Menu.Item key="delete" icon={<DeleteOutlined />} danger>Delete</Menu.Item>
                  <Menu.Item key="moveUp" icon={<UpOutlined />}>Move Up</Menu.Item>
                  <Menu.Item key="moveDown" icon={<DownOutlined />}>Move Down</Menu.Item>
                </Menu>
              }
              trigger={['click']}
            >
              <span style={{ fontSize: 12, color: '#999', cursor: 'pointer' }}>•••</span>
            </Dropdown>
          </div>
        ),
        key: node.id,
        selectable: true,
        isLeaf: !node.children || node.children.length === 0,
        data: node,
      };

      if (node.children && node.children.length > 0) {
        treeNode.children = node.children.map(convertNodeToTreeData);
      }

      return treeNode;
    };

    return page.root.children.map(convertNodeToTreeData);
  }, [page]);

  // Filter tree data based on search query
  const filteredTreeData = useMemo(() => {
    if (!searchQuery) return treeData;

    const filterNode = (node) => {
      const title = node.props?.title?.props?.children[0] || '';
      const matches = title.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (node.children) {
        const filteredChildren = node.children.map(filterNode).filter(Boolean);
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
      }
      
      return matches ? node : null;
    };

    return treeData.map(filterNode).filter(Boolean);
  }, [treeData, searchQuery]);

  const handleSelect = (selectedKeys, { node }) => {
    if (selectedKeys.length > 0) {
      selectNode(node.data.id);
      // Scroll to node in canvas
      const canvasNode = document.querySelector(`[data-node-id="${node.data.id}"]`);
      if (canvasNode) {
        canvasNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleDrop = (info) => {
    // Handle drag-and-drop reordering in navigator
    console.log('Navigator drop:', info);
    // This would need to be implemented with the BuilderEngine
    message.info('Drag and drop reordering coming soon');
  };

  const handleMenuClick = (e, node) => {
    e.domEvent.stopPropagation();
    
    switch (e.key) {
      case 'rename':
        setEditingNode(node.data);
        setNewLabel(node.data.label || node.data.type);
        break;
      case 'duplicate':
        duplicateNode(node.data.id);
        message.success('Duplicated');
        break;
      case 'delete':
        Modal.confirm({
          title: 'Delete this element?',
          content: 'This action cannot be undone.',
          onOk: () => {
            deleteNode(node.data.id);
            message.success('Deleted');
          },
        });
        break;
      case 'moveUp':
        // Move node up in parent's children array
        message.info('Move up coming soon');
        break;
      case 'moveDown':
        // Move node down in parent's children array
        message.info('Move down coming soon');
        break;
    }
  };

  const handleRename = () => {
    if (editingNode && newLabel.trim()) {
      renameNode(editingNode.id, newLabel.trim());
      message.success('Renamed');
    }
    setEditingNode(null);
    setNewLabel('');
  };

  const handleCancelRename = () => {
    setEditingNode(null);
    setNewLabel('');
  };

  const handleExpandAll = () => {
    const allKeys = getAllKeys(treeData);
    setExpandedKeys(allKeys);
  };

  const handleCollapseAll = () => {
    setExpandedKeys([]);
  };

  const getAllKeys = (nodes) => {
    let keys = [];
    nodes.forEach(node => {
      keys.push(node.key);
      if (node.children) {
        keys = keys.concat(getAllKeys(node.children));
      }
    });
    return keys;
  };

  // Empty state
  if (!page || !page.root || page.root.children.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No sections added yet"
        style={{ marginTop: 40 }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search and actions */}
      <div style={{ padding: '12px', borderBottom: '1px solid #e8e8e8' }}>
        <Search
          placeholder="Search elements..."
          allowClear
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleExpandAll}
            style={{
              border: 'none',
              background: 'none',
              color: '#1890ff',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Expand All
          </button>
          <span style={{ color: '#e8e8e8' }}>|</span>
          <button
            onClick={handleCollapseAll}
            style={{
              border: 'none',
              background: 'none',
              color: '#1890ff',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        <Tree
          treeData={filteredTreeData}
          selectedKeys={selectedNodeId ? [selectedNodeId] : []}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys)}
          onSelect={handleSelect}
          onDrop={handleDrop}
          draggable
          blockNode
          showLine
          style={{
            fontSize: 13,
          }}
        />
      </div>

      {/* Rename modal */}
      <Modal
        title="Rename Element"
        open={!!editingNode}
        onOk={handleRename}
        onCancel={handleCancelRename}
        okText="Rename"
        cancelText="Cancel"
      >
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Enter new name"
          onPressEnter={handleRename}
          autoFocus
        />
      </Modal>
    </div>
  );
}
