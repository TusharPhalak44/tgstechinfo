/**
 * SectionControls Component
 * Controls for section manipulation: Move, Duplicate, Delete, Save Block, Collapse, Expand, Add Above, Add Below
 */

import React, { useState } from 'react';
import { Button, Dropdown, Menu, Modal, message, Tooltip } from 'antd';
import { 
  ArrowUpOutlined, ArrowDownOutlined, CopyOutlined, 
  DeleteOutlined, SaveOutlined, UpOutlined, DownOutlined,
  PlusOutlined, MinusOutlined, MoreOutlined
} from '@ant-design/icons';

export default function SectionControls({ section, onMoveUp, onMoveDown, onDuplicate, onDelete, onSaveBlock, onCollapse, onExpand, onAddAbove, onAddBelow, isCollapsed }) {
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [blockName, setBlockName] = useState('');

  const handleSaveBlock = () => {
    if (blockName.trim()) {
      onSaveBlock?.(section.id, blockName.trim());
      message.success('Section saved as block');
      setSaveModalVisible(false);
      setBlockName('');
    }
  };

  const menu = (
    <Menu onClick={({ key }) => {
      switch (key) {
        case 'moveUp':
          onMoveUp?.();
          break;
        case 'moveDown':
          onMoveDown?.();
          break;
        case 'duplicate':
          onDuplicate?.();
          message.success('Section duplicated');
          break;
        case 'delete':
          Modal.confirm({
            title: 'Delete this section?',
            content: 'This action cannot be undone.',
            onOk: () => {
              onDelete?.();
              message.success('Section deleted');
            },
          });
          break;
        case 'saveBlock':
          setSaveModalVisible(true);
          break;
        case 'collapse':
          onCollapse?.();
          break;
        case 'expand':
          onExpand?.();
          break;
        case 'addAbove':
          onAddAbove?.();
          break;
        case 'addBelow':
          onAddBelow?.();
          break;
      }
    }}>
      <Menu.Item key="moveUp" icon={<ArrowUpOutlined />}>Move Up</Menu.Item>
      <Menu.Item key="moveDown" icon={<ArrowDownOutlined />}>Move Down</Menu.Item>
      <Menu.Divider />
      <Menu.Item key="duplicate" icon={<CopyOutlined />}>Duplicate</Menu.Item>
      <Menu.Item key="saveBlock" icon={<SaveOutlined />}>Save as Block</Menu.Item>
      <Menu.Divider />
      <Menu.Item key="addAbove" icon={<PlusOutlined />}>Add Section Above</Menu.Item>
      <Menu.Item key="addBelow" icon={<PlusOutlined />}>Add Section Below</Menu.Item>
      <Menu.Divider />
      {isCollapsed ? (
        <Menu.Item key="expand" icon={<DownOutlined />}>Expand</Menu.Item>
      ) : (
        <Menu.Item key="collapse" icon={<MinusOutlined />}>Collapse</Menu.Item>
      )}
      <Menu.Divider />
      <Menu.Item key="delete" icon={<DeleteOutlined />} danger>Delete</Menu.Item>
    </Menu>
  );

  return (
    <div style={{
      position: 'absolute',
      top: '-40px',
      right: 0,
      display: 'flex',
      gap: 4,
      background: '#fff',
      border: '1px solid #e8e8e8',
      borderRadius: 6,
      padding: 4,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      zIndex: 100,
    }}>
      <Tooltip title="Move Up">
        <Button
          type="text"
          size="small"
          icon={<ArrowUpOutlined />}
          onClick={onMoveUp}
        />
      </Tooltip>
      
      <Tooltip title="Move Down">
        <Button
          type="text"
          size="small"
          icon={<ArrowDownOutlined />}
          onClick={onMoveDown}
        />
      </Tooltip>
      
      <Tooltip title="Duplicate">
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          onClick={onDuplicate}
        />
      </Tooltip>
      
      <Tooltip title="Add Section Above">
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          onClick={onAddAbove}
        />
      </Tooltip>
      
      <Tooltip title="Add Section Below">
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          onClick={onAddBelow}
        />
      </Tooltip>
      
      <Tooltip title={isCollapsed ? 'Expand' : 'Collapse'}>
        <Button
          type="text"
          size="small"
          icon={isCollapsed ? <DownOutlined /> : <MinusOutlined />}
          onClick={isCollapsed ? onExpand : onCollapse}
        />
      </Tooltip>
      
      <Dropdown overlay={menu} trigger={['click']}>
        <Tooltip title="More Options">
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
          />
        </Tooltip>
      </Dropdown>
      
      <Modal
        title="Save Section as Block"
        open={saveModalVisible}
        onOk={handleSaveBlock}
        onCancel={() => {
          setSaveModalVisible(false);
          setBlockName('');
        }}
        okText="Save"
        cancelText="Cancel"
      >
        <input
          type="text"
          value={blockName}
          onChange={(e) => setBlockName(e.target.value)}
          placeholder="Enter block name"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
          }}
          autoFocus
        />
      </Modal>
    </div>
  );
}

/**
 * SectionHeader Component
 * Collapsible section header with controls
 */
export function SectionHeader({ section, isCollapsed, onToggle, children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: '#fafafa',
        border: '1px solid #e8e8e8',
        borderRadius: '4px 4px 0 0',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={onToggle}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16, color: '#999' }}>
          {isCollapsed ? <PlusOutlined /> : <MinusOutlined />}
        </span>
        <span style={{ fontWeight: 500, color: '#262626' }}>
          {section.label || 'Section'}
        </span>
      </div>
      {children}
    </div>
  );
}
