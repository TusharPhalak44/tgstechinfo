import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button, Image, Row, Col, Typography, Space, Tooltip, App, Spin } from 'antd';
import { SearchOutlined, PictureOutlined, CopyOutlined, CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';

const { Text } = Typography;
const { Option } = Select;

/**
 * MediaLibraryModal - Reusable modal for browsing and copying media URLs
 * 
 * @param {boolean} visible - Controls modal visibility
 * @param {function} onClose - Callback when modal closes
 * @param {function} onSelect - Optional callback when media is selected (receives media object)
 */
const MediaLibraryModal = ({ visible, onClose, onSelect }) => {
  const { darkMode } = useTheme();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    search: '',
  });
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchMedia();
    }
  }, [visible, filters]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.type && filters.type !== 'all') params.file_type = filters.type;
      if (filters.search) params.search = filters.search;
      
      const response = await axios.get('/api/media/all', { 
        params,
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      console.log('[MediaLibraryModal] API Response:', response.data);
      const mediaData = response.data.data || response.data || [];
      console.log('[MediaLibraryModal] Media items count:', mediaData.length);
      if (mediaData.length > 0) {
        console.log('[MediaLibraryModal] First item structure:', mediaData[0]);
      }
      
      setMedia(mediaData);
    } catch (error) {
      console.error('[MediaLibraryModal] Error fetching media:', error);
      message.error('Failed to load media library');
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      message.success('URL copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
      
      // If onSelect callback provided, call it with the URL string
      if (onSelect) {
        onSelect(url);
      }
    }).catch(() => {
      message.error('Failed to copy URL');
    });
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('image')) return <PictureOutlined />;
    return <PictureOutlined />;
  };

  const filteredMedia = media;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PictureOutlined style={{ fontSize: 18, color: '#4a7cff' }} />
          <span>Media Library</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      styles={{
        body: { 
          maxHeight: '70vh', 
          overflowY: 'auto',
          background: darkMode ? '#0f172a' : '#fafafa',
          padding: 0
        }
      }}
    >
      {/* Filters Section */}
      <div style={{ 
        padding: '16px 24px', 
        background: darkMode ? '#1e293b' : '#fff',
        borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 1
      }}>
        <Space style={{ width: '100%' }} size="middle">
          <Input
            placeholder="Search media..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            value={filters.type}
            onChange={(value) => setFilters({ ...filters, type: value })}
            style={{ width: 150 }}
          >
            <Option value="all">All Types</Option>
            <Option value="image">Images</Option>
            <Option value="video">Videos</Option>
            <Option value="document">Documents</Option>
          </Select>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchMedia}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
        <div style={{ 
          marginTop: 12, 
          fontSize: 12, 
          color: darkMode ? '#94a3b8' : '#8c8c8c' 
        }}>
          💡 Click on any image to copy its URL to clipboard
        </div>
      </div>

      {/* Media Grid */}
      <div style={{ padding: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: darkMode ? '#94a3b8' : '#8c8c8c' }}>
              Loading media...
            </div>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: darkMode ? '#94a3b8' : '#8c8c8c'
          }}>
            <PictureOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
            <div style={{ fontSize: 14 }}>No media found</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>
              {filters.search ? 'Try a different search term' : 'Upload some media to get started'}
            </div>
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredMedia.map((item) => (
              <Col key={item.id} xs={12} sm={8} md={6}>
                <div
                  onClick={() => copyToClipboard(item.url, item.id)}
                  style={{
                    background: darkMode ? '#1e293b' : '#fff',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = darkMode 
                      ? '0 8px 16px rgba(0,0,0,0.3)' 
                      : '0 8px 16px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Image Preview */}
                  <div style={{ 
                    height: 140, 
                    background: darkMode ? '#0f172a' : '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    {item.type?.startsWith('image') && item.url ? (
                      <Image
                        src={item.url}
                        alt={item.name || 'Media'}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }}
                        preview={false}
                        fallback="data:image/png;base64,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"
                      />
                    ) : (
                      <div style={{ fontSize: 40, color: darkMode ? '#475569' : '#bfbfbf' }}>
                        {getFileIcon(item.type)}
                      </div>
                    )}
                    
                    {/* Copy Indicator */}
                    {copiedId === item.id && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(34, 197, 94, 0.9)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff'
                      }}>
                        <CheckOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>URL Copied!</span>
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div style={{ padding: 8 }}>
                    <Tooltip title={item.name}>
                      <Text 
                        ellipsis 
                        style={{ 
                          fontSize: 11, 
                          display: 'block',
                          color: darkMode ? '#cbd5e1' : '#1a1a2e'
                        }}
                      >
                        {item.name}
                      </Text>
                    </Tooltip>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginTop: 4
                    }}>
                      <Text 
                        style={{ 
                          fontSize: 10, 
                          color: darkMode ? '#64748b' : '#999' 
                        }}
                      >
                        {item.file_size && !isNaN(item.file_size) 
                          ? `${(item.file_size / 1024).toFixed(1)} KB`
                          : 'Size unknown'
                        }
                      </Text>
                      <CopyOutlined 
                        style={{ 
                          fontSize: 12, 
                          color: '#4a7cff' 
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </Modal>
  );
};

export default MediaLibraryModal;
