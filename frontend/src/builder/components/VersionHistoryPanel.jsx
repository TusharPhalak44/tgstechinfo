/**
 * VersionHistoryPanel Component
 * Panel for managing page version history with restore capability
 */

import React, { useState, useEffect } from 'react';
import { Modal, List, Button, Tag, Space, Tooltip, Popconfirm, message, Empty, Input } from 'antd';
import { HistoryOutlined, RestoreOutlined, DeleteOutlined, SearchOutlined, ClockCircleOutlined } from '@ant-design/icons';

/**
 * VersionHistoryPanel Component
 */
export default function VersionHistoryPanel({ visible, onClose, page, onRestore, onDelete }) {
  const [versions, setVersions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadVersions();
    }
  }, [visible]);

  const loadVersions = () => {
    setLoading(true);
    // In a real app, this would fetch from backend
    // For now, generate mock versions
    const mockVersions = generateMockVersions();
    setVersions(mockVersions);
    setLoading(false);
  };

  const generateMockVersions = () => {
    const versions = [];
    const now = Date.now();
    
    for (let i = 0; i < 10; i++) {
      versions.push({
        id: `version-${i}`,
        timestamp: now - (i * 3600000), // 1 hour apart
        user: 'Current User',
        notes: i === 0 ? 'Current version' : `Auto-save ${i} hours ago`,
        isCurrent: i === 0,
        changes: [
          { type: 'update', nodeId: 'node-1', description: 'Updated heading text' },
          { type: 'add', nodeId: 'node-2', description: 'Added new paragraph' },
        ],
      });
    }
    
    return versions;
  };

  const filteredVersions = versions.filter(version =>
    version.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
    version.user.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRestore = (versionId) => {
    if (onRestore) {
      onRestore(versionId);
      message.success('Version restored successfully');
    }
  };

  const handleDelete = (versionId) => {
    if (onDelete) {
      onDelete(versionId);
      setVersions(versions.filter(v => v.id !== versionId));
      message.success('Version deleted');
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  };

  return (
    <Modal
      title="Version History"
      open={visible}
      onCancel={onClose}
      width={700}
      footer={null}
    >
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search versions..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading versions...</div>
      ) : filteredVersions.length === 0 ? (
        <Empty description="No versions found" />
      ) : (
        <List
          dataSource={filteredVersions}
          renderItem={(version) => (
            <List.Item
              key={version.id}
              actions={[
                version.isCurrent ? (
                  <Tag color="green">Current</Tag>
                ) : (
                  <Tooltip title="Restore this version">
                    <Popconfirm
                      title="Restore this version?"
                      description="This will replace the current version with the selected one."
                      onConfirm={() => handleRestore(version.id)}
                      okText="Restore"
                      cancelText="Cancel"
                    >
                      <Button
                        type="text"
                        icon={<RestoreOutlined />}
                        size="small"
                      >
                        Restore
                      </Button>
                    </Popconfirm>
                  </Tooltip>
                ),
                !version.isCurrent && (
                  <Tooltip title="Delete version">
                    <Popconfirm
                      title="Delete this version?"
                      onConfirm={() => handleDelete(version.id)}
                      okText="Delete"
                      cancelText="Cancel"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                      />
                    </Popconfirm>
                  </Tooltip>
                ),
              ]}
            >
              <List.Item.Meta
                avatar={<ClockCircleOutlined style={{ fontSize: 20, color: '#1890ff' }} />}
                title={
                  <Space>
                    <span style={{ fontWeight: 600 }}>{version.notes}</span>
                    {version.isCurrent && <Tag color="blue">Latest</Tag>}
                  </Space>
                }
                description={
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                      {formatTimestamp(version.timestamp)} ({getTimeAgo(version.timestamp)})
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      By {version.user} • {version.changes.length} change(s)
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
}

/**
 * Hook to use version history
 */
export function useVersionHistory() {
  const [versions, setVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);

  const createSnapshot = (page, notes = '') => {
    const snapshot = {
      id: `version-${Date.now()}`,
      timestamp: Date.now(),
      user: 'Current User',
      notes: notes || 'Manual save',
      isCurrent: true,
      data: JSON.parse(JSON.stringify(page)),
      changes: [],
    };

    setVersions(prev => {
      const newVersions = prev.map(v => ({ ...v, isCurrent: false }));
      return [snapshot, ...newVersions];
    });
    setCurrentVersion(snapshot);

    return snapshot.id;
  };

  const restoreSnapshot = (versionId) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setCurrentVersion(version);
      return version.data;
    }
    return null;
  };

  return {
    versions,
    currentVersion,
    createSnapshot,
    restoreSnapshot,
  };
}
