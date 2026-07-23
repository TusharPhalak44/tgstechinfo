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
  message,
  Pagination,
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
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

const MediaLibrary = () => {
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
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCards, setVisibleCards] = useState(24);
  const pageSize = 36;

  useEffect(() => {
    fetchMedia();
  }, [filters]);

  useEffect(() => {
    setVisibleCards(24);
  }, [currentPage]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      // Load uploaded files from the server's uploads directory via content API
      const response = await axios.get('/api/admin/content/all', {
        params: { limit: 100, offset: 0 },
      });
      const items = (response.data.data || []).flatMap(c => {
        const files = [];
        if (c.banner_image) files.push({
          id: `img-${c.id}`,
          name: c.banner_image,
          type: 'image',
          url: `/uploads/${c.banner_image}`,
          thumbnail: `/uploads/${c.banner_image}`,
          size: 0,
          folder: 'Images',
          createdAt: c.created_at,
          usageCount: 1,
          content_title: c.title,
        });
        if (c.pdf_file) files.push({
          id: `pdf-${c.id}`,
          name: c.pdf_file,
          type: 'document',
          url: `/uploads/${c.pdf_file}`,
          thumbnail: null,
          size: 0,
          folder: 'Documents',
          createdAt: c.created_at,
          usageCount: 1,
          content_title: c.title,
        });
        return files;
      });
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
    action: '/api/admin/media/upload',
    onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
        fetchMedia();
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed`);
      }
    },
  };

  const handleDelete = (id) => {
    setMedia(media.filter(item => item.id !== id));
    message.success('Media deleted successfully');
  };

  const handleShowMore = () => {
    setVisibleCards(prev => Math.min(prev + 6, pageSize));
  };

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

  const folders = [
    { name: 'All Media', count: 24, icon: <PictureOutlined /> },
    { name: 'Blog', count: 8, icon: <FolderOutlined /> },
    { name: 'Products', count: 6, icon: <FolderOutlined /> },
    { name: 'Team', count: 5, icon: <FolderOutlined /> },
    { name: 'Marketing', count: 5, icon: <FolderOutlined /> },
  ];

  const mediaItemMenu = (item) => ({
    items: [
      {
        key: 'download',
        icon: <DownloadOutlined />,
        label: 'Download',
      },
      {
        key: 'copy-url',
        icon: <FileOutlined />,
        label: 'Copy URL',
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
    <div style={{ padding: window.innerWidth < 768 ? '16px' : '24px' }}>
      <div style={{ marginBottom: window.innerWidth < 768 ? 16 : 24 }}>
        <Title level={2} style={{ fontSize: window.innerWidth < 768 ? 24 : 30, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
          Media Library
        </Title>
        <Text style={{ fontSize: window.innerWidth < 768 ? 13 : 15, color: '#6B7280' }}>
          Manage all your images, videos, and documents
        </Text>
      </div>

      <Row gutter={[window.innerWidth < 768 ? 16 : 24, window.innerWidth < 768 ? 16 : 24]}>
        {/* Sidebar */}
        <Col xs={24} lg={4}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
              <Text strong style={{ fontSize: window.innerWidth < 768 ? 12 : 13, color: '#6B7280', display: 'block', marginBottom: window.innerWidth < 768 ? 8 : 12 }}>
                Folders
              </Text>
              {folders.map((folder, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: window.innerWidth < 768 ? '6px 10px' : '8px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    marginBottom: 4,
                    background: filters.folder === (index === 0 ? 'all' : folder.name.toLowerCase()) ? '#F1F5F9' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => setFilters({ ...filters, folder: index === 0 ? 'all' : folder.name.toLowerCase() })}
                  onMouseEnter={(e) => {
                    if (filters.folder !== (index === 0 ? 'all' : folder.name.toLowerCase())) {
                      e.currentTarget.style.background = '#F8FAFC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filters.folder !== (index === 0 ? 'all' : folder.name.toLowerCase())) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {folder.icon}
                    <Text style={{ fontSize: window.innerWidth < 768 ? 12 : 13, color: '#111827' }}>{folder.name}</Text>
                  </div>
                  <Text style={{ fontSize: window.innerWidth < 768 ? 11 : 12, color: '#6B7280' }}>{folder.count}</Text>
                </div>
              ))}
            </div>

            <div>
              <Text strong style={{ fontSize: window.innerWidth < 768 ? 12 : 13, color: '#6B7280', display: 'block', marginBottom: window.innerWidth < 768 ? 8 : 12 }}>
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
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: window.innerWidth < 768 ? 12 : 16,
          }}>
            <Space size={window.innerWidth < 768 ? 8 : 12} style={{ width: window.innerWidth < 768 ? '100%' : 'auto', flexDirection: window.innerWidth < 768 ? 'column' : 'row', alignItems: window.innerWidth < 768 ? 'stretch' : 'center' }}>
              <Input
                placeholder="Search media..."
                prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
                style={{ width: window.innerWidth < 768 ? '100%' : 280, borderRadius: 8 }}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                size={window.innerWidth < 768 ? 'middle' : 'default'}
              />
              <Text style={{ fontSize: window.innerWidth < 768 ? 12 : 13, color: '#6B7280' }}>
                {media.length} items
              </Text>
            </Space>
            <Space size={window.innerWidth < 768 ? 8 : 12} style={{ width: window.innerWidth < 768 ? '100%' : 'auto', justifyContent: window.innerWidth < 768 ? 'flex-start' : 'flex-end' }}>
              {selectedItems.length > 0 && (
                <Button danger icon={<DeleteOutlined />} size={window.innerWidth < 768 ? 'middle' : 'default'}>
                  Delete ({selectedItems.length})
                </Button>
              )}
              <Button icon={<PlusOutlined />} size={window.innerWidth < 768 ? 'middle' : 'default'}>
                New Folder
              </Button>
            </Space>
          </div>

          {/* Upload Area */}
          {uploadModalVisible && (
            <Card
              style={{
                marginBottom: 16,
                borderRadius: 12,
                border: '2px dashed #E5E7EB',
                background: '#F8FAFC',
              }}
              bodyStyle={{ padding: window.innerWidth < 768 ? '20px' : '32px' }}
            >
              <Dragger {...uploadProps} style={{ background: 'transparent' }}>
                <p className="ant-upload-drag-icon">
                  <CloudUploadOutlined style={{ fontSize: window.innerWidth < 768 ? 36 : 48, color: '#0AAEEF' }} />
                </p>
                <p style={{ fontSize: window.innerWidth < 768 ? 14 : 16, color: '#111827', marginBottom: 8 }}>
                  Click or drag files to upload
                </p>
                <p style={{ fontSize: window.innerWidth < 768 ? 12 : 13, color: '#6B7280' }}>
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
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #E5E7EB',
            padding: window.innerWidth < 768 ? '0 16px 16px 16px' : '20px',
            paddingTop: window.innerWidth < 768 ? '16px' : '20px',
            minHeight: 400,
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: window.innerWidth < 768 ? '40px 0' : '60px 0' }}>
                <Text style={{ color: '#6B7280', fontSize: window.innerWidth < 768 ? 12 : 14 }}>Loading media...</Text>
              </div>
            ) : media.length === 0 ? (
              <div style={{ textAlign: 'center', padding: window.innerWidth < 768 ? '40px 0' : '60px 0' }}>
                <PictureOutlined style={{ fontSize: window.innerWidth < 768 ? 36 : 48, color: '#E5E7EB', marginBottom: window.innerWidth < 768 ? 12 : 16 }} />
                <Title level={4} style={{ color: '#6B7280', marginBottom: 8, fontSize: window.innerWidth < 768 ? 16 : 20 }}>
                  No media found
                </Title>
                <Text style={{ color: '#9CA3AF', fontSize: window.innerWidth < 768 ? 12 : 14 }}>
                  Upload your first media file to get started
                </Text>
              </div>
            ) : (
              <>
              <Row gutter={[window.innerWidth < 768 ? 0 : 24, window.innerWidth < 768 ? 0 : 24]}>
                {media.slice(0, visibleCards).map((item) => (
                  <Col xs={12} sm={8} md={6} lg={4} xl={4} key={item.id}>
                    <div style={{ padding: window.innerWidth < 768 ? '0 10px 16px 10px' : 0 }}>
                      <Card
                        hoverable
                        style={{
                          borderRadius: 8,
                          border: selectedItems.includes(item.id) ? '2px solid #0AAEEF' : '1px solid #E5E7EB',
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
                            background: '#F1F5F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {item.type === 'image' ? (
                            <Image
                              src={item.thumbnail}
                              alt={item.name}
                              preview={false}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ textAlign: 'center' }}>
                              {getTypeIcon(item.type)}
                              <div style={{ fontSize: window.innerWidth < 768 ? 10 : 11, color: '#6B7280', marginTop: 4 }}>
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
                              top: 8,
                              right: 8,
                              background: 'rgba(255,255,255,0.9)',
                              borderRadius: 4,
                              opacity: selectedItems.includes(item.id) ? 0 : 1,
                            }}
                            onClick={(e) => e.stopPropagation()}
                            size={window.innerWidth < 768 ? 'small' : 'default'}
                          />
                        </Dropdown>
                      </div>
                      <div style={{ padding: window.innerWidth < 768 ? '10px' : '12px' }}>
                        <Text
                          strong
                          style={{
                            fontSize: window.innerWidth < 768 ? 12 : 13,
                            color: '#111827',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.name}
                        </Text>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                          <Text style={{ fontSize: window.innerWidth < 768 ? 10 : 11, color: '#6B7280' }}>
                            {formatFileSize(item.size)}
                          </Text>
                          <Text style={{ fontSize: window.innerWidth < 768 ? 10 : 11, color: '#6B7280' }}>
                            {item.usageCount} uses
                          </Text>
                        </div>
                      </div>
                    </Card>
                    </div>
                  </Col>
                ))}
              </Row>
              <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                {visibleCards < pageSize && visibleCards < media.length && (
                  <Button
                    type="default"
                    onClick={handleShowMore}
                    style={{ borderRadius: 8 }}
                  >
                    Show More ({Math.min(pageSize - visibleCards, media.length - visibleCards)} more)
                  </Button>
                )}
                {visibleCards >= pageSize && (
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={media.length}
                    showSizeChanger={false}
                    showTotal={(total) => `${total} items`}
                    onChange={handlePageChange}
                  />
                )}
              </div>
              </>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default MediaLibrary;
