/**
 * NodeToolbar Component
 * Floating toolbar for selected/hovered nodes with actions
 */

import React, { useState } from 'react';
import { Button, Tooltip, Popconfirm, Dropdown, Menu } from 'antd';
import { 
  CopyOutlined, DeleteOutlined, 
  ArrowUpOutlined, ArrowDownOutlined,
  DragOutlined, LockOutlined, UnlockOutlined,
  EyeOutlined, EyeInvisibleOutlined,
  SaveOutlined, MoreOutlined
} from '@ant-design/icons';
import { useBuilderActions } from '../core/BuilderStore.jsx';

/**
 * NodeToolbar Component
 */
export default function NodeToolbar({ node, isSelected }) {
  const { duplicateNode, deleteNode, copyNodes, moveNode } = useBuilderActions();
  const [isLocked, setIsLocked] = useState(node.settings?.locked || false);
  const [isHidden, setIsHidden] = useState(node.settings?.hidden || false);

  const handleDuplicate = () => {
    duplicateNode(node.id);
  };

  const handleDelete = () => {
    deleteNode(node.id);
  };

  const handleCopy = () => {
    copyNodes([node.id]);
  };

  const handleMoveUp = () => {
    moveNode(node.id, 'up');
  };

  const handleMoveDown = () => {
    moveNode(node.id, 'down');
  };

  const handleLock = () => {
    setIsLocked(!isLocked);
    // Update node settings
    // This would need to be implemented in BuilderStore
  };

  const handleHide = () => {
    setIsHidden(!isHidden);
    // Update node settings
    // This would need to be implemented in BuilderStore
  };

  const handleSaveAsBlock = () => {
    // Placeholder for save as block functionality
    console.log('Save as block:', node.id);
    // This would need to be implemented in BuilderStore
  };

  const moreMenu = (
    <Menu>
      <Menu.Item key="lock" icon={isLocked ? <UnlockOutlined /> : <LockOutlined />} onClick={handleLock}>
        {isLocked ? 'Unlock' : 'Lock'}
      </Menu.Item>
      <Menu.Item key="hide" icon={isHidden ? <EyeOutlined /> : <EyeInvisibleOutlined />} onClick={handleHide}>
        {isHidden ? 'Show' : 'Hide'}
      </Menu.Item>
      <Menu.Item key="save" icon={<SaveOutlined />} onClick={handleSaveAsBlock}>
        Save as Block
      </Menu.Item>
    </Menu>
  );

  return (
    <div 
      className="node-toolbar"
      style={{
        position: 'absolute',
        top: -40,
        right: 0,
        display: 'flex',
        gap: 4,
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: 6,
        padding: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 100,
      }}
    >
      <Tooltip title="Duplicate">
        <Button 
          type="text" 
          size="small" 
          icon={<CopyOutlined />}
          onClick={handleDuplicate}
        />
      </Tooltip>
      
      <Tooltip title="Copy">
        <Button 
          type="text" 
          size="small" 
          icon={<CopyOutlined />}
          onClick={handleCopy}
        />
      </Tooltip>
      
      <Tooltip title="Move Up">
        <Button 
          type="text" 
          size="small" 
          icon={<ArrowUpOutlined />}
          onClick={handleMoveUp}
          disabled={isLocked}
        />
      </Tooltip>
      
      <Tooltip title="Move Down">
        <Button 
          type="text" 
          size="small" 
          icon={<ArrowDownOutlined />}
          onClick={handleMoveDown}
          disabled={isLocked}
        />
      </Tooltip>
      
      <Tooltip title={isLocked ? 'Locked' : 'Lock'}>
        <Button 
          type="text" 
          size="small" 
          icon={isLocked ? <LockOutlined /> : <UnlockOutlined />}
          onClick={handleLock}
          style={{ color: isLocked ? '#ff4d4f' : undefined }}
        />
      </Tooltip>
      
      <Tooltip title={isHidden ? 'Hidden' : 'Hide'}>
        <Button 
          type="text" 
          size="small" 
          icon={isHidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={handleHide}
          style={{ color: isHidden ? '#ff4d4f' : undefined }}
        />
      </Tooltip>
      
      <Dropdown overlay={moreMenu} trigger={['click']}>
        <Tooltip title="More Options">
          <Button 
            type="text" 
            size="small" 
            icon={<MoreOutlined />}
          />
        </Tooltip>
      </Dropdown>
      
      <Popconfirm
        title="Delete this element?"
        description="This action cannot be undone."
        onConfirm={handleDelete}
        okText="Yes"
        cancelText="No"
        disabled={isLocked}
      >
        <Tooltip title="Delete">
          <Button 
            type="text" 
            size="small" 
            danger
            icon={<DeleteOutlined />}
            disabled={isLocked}
          />
        </Tooltip>
      </Popconfirm>
    </div>
  );
}
