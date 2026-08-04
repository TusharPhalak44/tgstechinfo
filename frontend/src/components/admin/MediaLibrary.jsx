import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Typography, 
  Button, 
  Input, 
  Select, 
  Space, 
  Image, 
  Tooltip,
  Dropdown,
  Checkbox,
  Upload,
  App,
  Pagination,
  ConfigProvider,
  Modal,
} from 'antd';
import {
  SearchOutlined,
  UploadOutlined,
  FolderOutlined,
  PictureOutlined,
  FileOutlined,
  VideoCameraOutlined,
  DeleteOutlined,
  DownloadOutlined,
  MoreOutlined,
  PlusOutlined,
  CloudUploadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

const MediaLibrary = () => {
  const { darkMode } = useTheme();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    type: 'all',
    folder: 'all',
    search: '',
  });
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [newFolderModalVisible, setNewFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameFolderModalVisible, setRenameFolderModalVisible] = useState(false);
  const [renameFolderIndex, setRenameFolderIndex] = useState(null);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 36;

  useEffect(() => {
    fetchMedia();
  }, [filters]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setCurrentPage(1);
      // Load uploaded files from database via media API
      const params = {};
      if (filters.type && filters.type !== 'all') params.file_type = filters.type;
      if (filters.folder && filters.folder !== 'all') params.folder = filters.folder;
      if (filters.search) params.search = filters.search;
      
      const response = await axios.get('/api/media/all', { 
        params,
        headers: { 'Cache-Control': 'no-cache' }
      });
      let items = response.data.data || [];
      console.log('Media fetched from database:', items.length);
      
      // Fetch folder counts
      const countsResponse = await axios.get('/api/media/folder-counts');
      const folderCounts = countsResponse.data || {
        'All Media': 0,
        'Images': 0,
        'Documents': 0,
        'Videos': 0
      };
      
      setFolders(prevFolders => prevFolders.map(folder => ({
        ...folder,
        count: folderCounts[folder.name] || 0
      })));
      
      setMedia(items);
    } catch (error) {
      console.error('Error fetching media:', error);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  const generateMockMedia = () => { return []; };

  const uploadProps = {
    name: 'file',
    multiple: true,
    customRequest: async ({ file, onProgress, onSuccess, onError }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await axios.post('/api/media/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({ percent });
          },
        });
        
        onSuccess(response.data, file);
        message.success(`${file.name} uploaded successfully`);
        fetchMedia();
      } catch (error) {
        onError(error);
        message.error(`${file.name} upload failed`);
      }
    },
    onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        // Success is handled in customRequest
      } else if (status === 'error') {
        // Error is handled in customRequest
      }
    },
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/media/${id}`);
      setMedia(media.filter(item => item.id !== id));
      message.success('Media deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      message.error('Failed to delete media');
    }
  };

  const handleDownload = (item) => {
    const link = document.createElement('a');
    link.href = `/api/media/file/${item.filename}?download=1`;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Download started');
  };

  const handleCopyUrl = (item) => {
    const fullUrl = window.location.origin + item.url;
    navigator.clipboard.writeText(fullUrl).then(() => {
      message.success('URL copied to clipboard');
    }).catch(() => {
      message.error('Failed to copy URL');
    });
  };

  const handleShowMore = () => {};

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelect = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleRefresh = () => {
    setFilters({ ...filters, search: '' });
    fetchMedia();
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      message.error('Please enter a folder name');
      return;
    }
    // Add new folder to the folders array
    const newFolder = { name: newFolderName, count: 0, icon: <FolderOutlined /> };
    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setNewFolderModalVisible(false);
    message.success('Folder created successfully');
  };

  const handleRenameFolder = () => {
    if (!renameFolderName.trim()) {
      message.error('Please enter a folder name');
      return;
    }
    const updatedFolders = [...folders];
    updatedFolders[renameFolderIndex].name = renameFolderName;
    setFolders(updatedFolders);
    setRenameFolderName('');
    setRenameFolderModalVisible(false);
    setRenameFolderIndex(null);
    message.success('Folder renamed successfully');
  };

  const handleDeleteFolder = (index) => {
    if (index === 0) {
      message.error('Cannot delete All Media folder');
      return;
    }
    const updatedFolders = folders.filter((_, i) => i !== index);
    setFolders(updatedFolders);
    message.success('Folder deleted successfully');
  };

  const openRenameModal = (index) => {
    setRenameFolderIndex(index);
    setRenameFolderName(folders[index].name);
    setRenameFolderModalVisible(true);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'image':
        return <PictureOutlined />;
      case 'video':
        return <VideoCameraOutlined />;
      case 'document':
        return <FileOutlined />;
      default:
        return <FileOutlined />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const [folders, setFolders] = useState([
    { name: 'All Media', count: 0, icon: <PictureOutlined /> },
    { name: 'Images', count: 0, icon: <FolderOutlined /> },
    { name: 'Videos', count: 0, icon: <FolderOutlined /> },
    { name: 'Documents', count: 0, icon: <FolderOutlined /> },
  ]);

  const mediaItemMenu = (item) => ({
    items: [
      {
        key: 'download',
        icon: <DownloadOutlined />,
        label: 'Download',
        onClick: () => handleDownload(item),
      },
      {
        key: 'copy-url',
        icon: <FileOutlined />,
        label: 'Copy URL',
        onClick: () => handleCopyUrl(item),
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Delete',
        danger: true,
        onClick: () => handleDelete(item.id),
      },
    ],
  });

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: darkMode ? '#1e293b' : '#fff',
          colorText: darkMode ? '#cbd5e1' : '#374151',
          colorBorder: darkMode ? '#334155' : '#d9d9d9',
          colorBgElevated: darkMode ? '#1e293b' : '#fff',
          colorTextPlaceholder: darkMode ? '#64748b' : '#bfbfbf',
        },
      }}
    >
      <div style={{ padding: window.innerWidth < 768 ? '16px' : '24px', background: darkMode ? '#0f172a' : '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: window.innerWidth < 768 ? 16 : 24 }}>
        <Title level={2} style={{ fontSize: window.innerWidth < 768 ? 24 : 30, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827', marginBottom: 8 }}>
          Media Library
        </Title>
        <Text style={{ fontSize: window.innerWidth < 768 ? 13 : 15, color: darkMode ? '#94a3b8' : '#6B7280' }}>
          Manage all your images, videos, and documents
        </Text>
      </div>

      <Row gutter={[window.innerWidth < 768 ? 16 : 24, window.innerWidth < 768 ? 16 : 24]}>
        {/* Sidebar */}
        <Col xs={24} lg={4}>
          <Card
            style={{
              borderRadius: 12,
              border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
              boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
              background: darkMode ? '#1e293b' : '#fff',
            }}
            bodyStyle={{ padding: window.innerWidth < 768 ? '12px' : '16px' }}
          >
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              block
              style={{ marginBottom: window.innerWidth < 768 ? 12 : 16, borderRadius: 8 }}
              onClick={() => setUploadModalVisible(true)}
              size={window.innerWidth < 768 ? 'middle' : 'default'}
            >
              Upload Media
            </Button>
            
            <div style={{ marginBottom: window.innerWidth < 768 ? 12 : 16 }}>
              <Text strong style={{ fontSize: window.innerWidth < 768 ? 12 : 13, color: darkMode ? '#94a3b8' : '#6B7280', display: 'block', marginBottom: window.innerWidth < 768 ? 8 : 12 }}>
                Folders
              </Text>
              {folders.map((folder, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: window.innerWidth < 768 ? '8px 10px' : '10px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    marginBottom: 4,
                    background: filters.folder === (index === 0 ? 'all' : folder.name.toLowerCase()) ? (darkMode ? '#334155' : '#F1F5F9') : 'transparent',
                    transition: 'background 0.2s',
                    minHeight: window.innerWidth < 768 ? 36 : 40,
                  }}
                  onClick={() => setFilters({ ...filters, folder: index === 0 ? 'all' : folder.name.toLowerCase() })}
                  onMouseEnter={(e) => {
                    if (filters.folder !== (index === 0 ? 'all' : folder.name.toLowerCase())) {
                      e.currentTarget.style.background = darkMode ? '#1e293b' : '#F8FAFC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filters.folder !== (index === 0 ? 'all' : folder.name.toLowerCase())) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {folder.icon}
                    </span>
                    <Text 
                      style={{ 
                        fontSize: window.innerWidth < 768 ? 12 : 13, 
                        color: darkMode ? '#cbd5e1' : '#111827',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1
                      }}
                    >
                      {folder.name}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <Text style={{ fontSize: window.innerWidth < 768 ? 11 : 12, color: darkMode ? '#94a3b8' : '#6B7280', flexShrink: 0 }}>{folder.count}</Text>
                    {index !== 0 && (
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'rename',
                              label: 'Rename',
                              onClick: () => openRenameModal(index),
                            },
                            {
                              key: 'delete',
                              label: 'Delete',
                              danger: true,
                              onClick: () => handleDeleteFolder(index),
                            },
                          ],
                        }}
                        trigger={['click']}
                      >
                        <Button
                          type="text"
                          icon={<MoreOutlined />}
                          size="small"
                          style={{ padding: '2px 4px', color: darkMode ? '#94a3b8' : '#6B7280', minWidth: 'auto', height: 'auto' }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <Text strong style={{ fontSize: window.innerWidth < 768 ? 12 : 13, color: darkMode ? '#94a3b8' : '#6B7280', display: 'block', marginBottom: window.innerWidth < 768 ? 8 : 12 }}>
                Filter by Type
              </Text>
              <Select
                style={{ width: '100%', borderRadius: 8 }}
                value={filters.type}
                onChange={(value) => setFilters({ ...filters, type: value })}
                size={window.innerWidth < 768 ? 'middle' : 'default'}
              >
                <Option value="all">All Types</Option>
                <Option value="image">Images</Option>
                <Option value="video">Videos</Option>
                <Option value="document">Documents</Option>
              </Select>
            </div>
          </Card>
        </Col>

        {/* Main Content */}
        <Col xs={24} lg={20}>
          {/* Search and Actions */}
          <div style={{
            marginBottom: 16,
            padding: window.innerWidth < 768 ? '12px 16px' : '16px 20px',
            background: darkMode ? '#1e293b' : '#FFFFFF',
            borderRadius: 12,
            border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: window.innerWidth < 768 ? 12 : 16,
          }}>
            <Space size={window.innerWidth < 768 ? 8 : 12} style={{ width: window.innerWidth < 768 ? '100%' : 'auto', flexDirection: window.innerWidth < 768 ? 'column' : 'row', alignItems: window.innerWidth < 768 ? 'stretch' : 'center' }}>
              <Input
                placeholder="Search media..."
                prefix={<SearchOutlined style={{ color: darkMode ? '#64748b' : '#9CA3AF' }} />}
                style={{ width: window.innerWidth < 768 ? '100%' : 280, borderRadius: 8 }}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                size={window.innerWidth < 768 ? 'middle' : 'default'}
                allowClear
              />
              <Text style={{ fontSize: window.innerWidth < 768 ? 12 : 13, color: darkMode ? '#94a3b8' : '#6B7280' }}>
                {media.length} items
              </Text>
            </Space>
            <Space size={window.innerWidth < 768 ? 8 : 12} style={{ width: window.innerWidth < 768 ? '100%' : 'auto', justifyContent: window.innerWidth < 768 ? 'flex-start' : 'flex-end' }}>
              <Button icon={<ReloadOutlined />} size={window.innerWidth < 768 ? 'middle' : 'default'} onClick={handleRefresh}>
                Refresh
              </Button>
              {selectedItems.length > 0 && (
                <Button danger icon={<DeleteOutlined />} size={window.innerWidth < 768 ? 'middle' : 'default'}>
                  Delete ({selectedItems.length})
                </Button>
              )}
              <Button icon={<PlusOutlined />} size={window.innerWidth < 768 ? 'middle' : 'default'} onClick={() => setNewFolderModalVisible(true)}>
                New Folder
              </Button>
            </Space>
          </div>

          {/* New Folder Modal */}
          <Modal
            title="Create New Folder"
            open={newFolderModalVisible}
            onOk={handleCreateFolder}
            onCancel={() => {
              setNewFolderModalVisible(false);
              setNewFolderName('');
            }}
            okText="Create"
            cancelText="Cancel"
          >
            <Input
              placeholder="Enter folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onPressEnter={handleCreateFolder}
              autoFocus
            />
          </Modal>

          {/* Rename Folder Modal */}
          <Modal
            title="Rename Folder"
            open={renameFolderModalVisible}
            onOk={handleRenameFolder}
            onCancel={() => {
              setRenameFolderModalVisible(false);
              setRenameFolderName('');
              setRenameFolderIndex(null);
            }}
            okText="Rename"
            cancelText="Cancel"
          >
            <Input
              placeholder="Enter new folder name"
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              onPressEnter={handleRenameFolder}
              autoFocus
            />
          </Modal>

          {/* Upload Area */}
          {uploadModalVisible && (
            <Card
              style={{
                marginBottom: 16,
                borderRadius: 12,
                border: darkMode ? '2px dashed #475569' : '2px dashed #E5E7EB',
                background: darkMode ? '#0f172a' : '#F8FAFC',
              }}
              bodyStyle={{ padding: window.innerWidth < 768 ? '20px' : '32px' }}
            >
              <Dragger {...uploadProps} style={{ background: 'transparent' }}>
                <p className="ant-upload-drag-icon">
                  <CloudUploadOutlined style={{ fontSize: window.innerWidth < 768 ? 36 : 48, color: '#0AAEEF' }} />
                </p>
                <p style={{ fontSize: window.innerWidth < 768 ? 14 : 16, color: darkMode ? '#f1f5f9' : '#111827', marginBottom: 8 }}>
                  Click or drag files to upload
                </p>
                <p style={{ fontSize: window.innerWidth < 768 ? 12 : 13, color: darkMode ? '#94a3b8' : '#6B7280' }}>
                  Support for images, videos, and documents
                </p>
              </Dragger>
              <div style={{ textAlign: 'center', marginTop: window.innerWidth < 768 ? 12 : 16 }}>
                <Button onClick={() => setUploadModalVisible(false)} size={window.innerWidth < 768 ? 'middle' : 'default'}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Media Grid */}
          <div style={{
            background: darkMode ? '#1e293b' : '#FFFFFF',
            borderRadius: 12,
            border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
            padding: window.innerWidth < 768 ? '0 16px 16px 16px' : '20px',
            paddingTop: window.innerWidth < 768 ? '16px' : '20px',
            minHeight: 400,
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: window.innerWidth < 768 ? '40px 0' : '60px 0' }}>
                <Text style={{ color: darkMode ? '#94a3b8' : '#6B7280', fontSize: window.innerWidth < 768 ? 12 : 14 }}>Loading media...</Text>
              </div>
            ) : media.length === 0 ? (
              <div style={{ textAlign: 'center', padding: window.innerWidth < 768 ? '40px 0' : '60px 0' }}>
                <PictureOutlined style={{ fontSize: window.innerWidth < 768 ? 36 : 48, color: darkMode ? '#475569' : '#E5E7EB', marginBottom: window.innerWidth < 768 ? 12 : 16 }} />
                <Title level={4} style={{ color: darkMode ? '#94a3b8' : '#6B7280', marginBottom: 8, fontSize: window.innerWidth < 768 ? 16 : 20 }}>
                  No media found
                </Title>
                <Text style={{ color: darkMode ? '#64748b' : '#9CA3AF', fontSize: window.innerWidth < 768 ? 12 : 14 }}>
                  Upload your first media file to get started
                </Text>
              </div>
            ) : (
              <>
              <Row gutter={[window.innerWidth < 768 ? 0 : 24, window.innerWidth < 768 ? 0 : 24]}>
                {media.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item) => (
                  <Col xs={12} sm={8} md={6} lg={4} xl={4} key={item.id}>
                    <div style={{ padding: window.innerWidth < 768 ? '0 10px 16px 10px' : 0 }}>
                      <Card
                        hoverable
                        style={{
                          borderRadius: 8,
                          border: selectedItems.includes(item.id) ? '2px solid #0AAEEF' : (darkMode ? '1px solid #334155' : '1px solid #E5E7EB'),
                          overflow: 'hidden',
                          cursor: 'pointer',
                        }}
                      bodyStyle={{ padding: 0 }}
                      onClick={() => handleSelect(item.id)}
                    >
                      <div style={{ position: 'relative' }}>
                        <div
                          style={{
                            width: '100%',
                            height: window.innerWidth < 768 ? 100 : 120,
                            background: darkMode ? '#0f172a' : '#F1F5F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {item.type === 'image' ? (
                            <img
                              src={item.url}
                              alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                console.error('Image load error for:', item.url);
                                // Show placeholder when image fails to load
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `
                                  <div style="text-align: center; color: ${darkMode ? '#94a3b8' : '#6B7280'}">
                                    <PictureOutlined style="font-size: 24px; margin-bottom: 4px;" />
                                    <div style="font-size: 10px;">Image not found</div>
                                  </div>
                                `;
                              }}
                            />
                          ) : (
                            <div style={{ textAlign: 'center' }}>
                              {getTypeIcon(item.type)}
                              <div style={{ fontSize: window.innerWidth < 768 ? 10 : 11, color: darkMode ? '#94a3b8' : '#6B7280', marginTop: 4 }}>
                                {item.type.toUpperCase()}
                              </div>
                            </div>
                          )}
                        </div>
                        {selectedItems.includes(item.id) && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: '#0AAEEF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: 12,
                            }}
                          >
                            ✓
                          </div>
                        )}
                        <Dropdown menu={mediaItemMenu(item)} trigger={['click']}>
                          <Button
                            type="text"
                            icon={<MoreOutlined />}
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              background: darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255,255,255,0.9)',
                              borderRadius: 4,
                              opacity: selectedItems.includes(item.id) ? 0 : 1,
                              padding: '2px 6px',
                              minWidth: 'auto',
                              height: 'auto',
                              fontSize: 14,
                            }}
                            onClick={(e) => e.stopPropagation()}
                            size="small"
                          />
                        </Dropdown>
                      </div>
                      <div style={{ padding: window.innerWidth < 768 ? '10px' : '12px' }}>
                        <Text
                          strong
                          style={{
                            fontSize: window.innerWidth < 768 ? 12 : 13,
                            color: darkMode ? '#f1f5f9' : '#111827',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.name}
                        </Text>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                          <Text style={{ fontSize: window.innerWidth < 768 ? 10 : 11, color: darkMode ? '#94a3b8' : '#6B7280' }}>
                            {formatFileSize(item.size)}
                          </Text>
                          <Text style={{ fontSize: window.innerWidth < 768 ? 10 : 11, color: darkMode ? '#94a3b8' : '#6B7280' }}>
                            {item.usageCount} uses
                          </Text>
                        </div>
                      </div>
                    </Card>
                    </div>
                  </Col>
                ))}
              </Row>
              <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={media.length}
                  showSizeChanger={false}
                  showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                  onChange={handlePageChange}
                />
              </div>
              </>
            )}
          </div>
        </Col>
      </Row>
    </div>
    </ConfigProvider>
  );
};

export default MediaLibrary;
