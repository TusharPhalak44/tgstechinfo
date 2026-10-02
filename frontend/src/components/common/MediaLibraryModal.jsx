import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button, Image, Row, Col, Typography, Space, Tooltip, App, Spin, Upload } from 'antd';
import { SearchOutlined, PictureOutlined, CopyOutlined, CheckOutlined, ReloadOutlined, VideoCameraOutlined, FileOutlined, UploadOutlined, ExportOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const { Text } = Typography;
const { Option } = Select;

/**
 * Helper to ensure a media URL is fully qualified and accessible anywhere
 */
export const getFullMediaUrl = (rawUrl) => {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }
  const origin = window.location.origin;
  const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  return `${origin}${cleanPath}`;
};

/**
 * MediaLibraryModal - Reusable modal for browsing, uploading, and inserting media
 * 
 * @param {boolean} visible - Controls modal visibility
 * @param {function} onClose - Callback when modal closes
 * @param {function} onSelect - Callback when media is selected / inserted (receives (url, mediaObject))
 * @param {boolean} userOnly - Force user's own media even if admin
 */
const MediaLibraryModal = ({ visible, onClose, onSelect, userOnly }) => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [media, setMedia] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    search: '',
  });
  const [copiedId, setCopiedId] = useState(null);

  // Admin panel sees all media; user panel sees only that user's own media
  const isAdmin = user?.role === 'admin' && !userOnly;
  const endpoint = isAdmin ? '/api/media/all' : '/api/media/user/all';

  useEffect(() => {
    if (visible) {
      setSelectedItem(null);
      fetchMedia();
    }
  }, [visible, user?.role, userOnly]);

  useEffect(() => {
    if (visible) {
      fetchMedia();
    }
  }, [filters]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.type && filters.type !== 'all') params.file_type = filters.type;
      if (filters.search) params.search = filters.search;
      
      const response = await axios.get(endpoint, { 
        params,
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      const mediaData = response?.data?.data || response?.data || [];
      const list = Array.isArray(mediaData) ? mediaData : [];
      setMedia(list);
      return list;
    } catch (error) {
      console.error('[MediaLibraryModal] Error fetching media:', error);
      message.error('Failed to load media library');
      setMedia([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = (file) => {
    const allowedExtensions = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|mp4|mov|avi/i;
    const ext = (file.name || '').split('.').pop().toLowerCase();
    
    if (!allowedExtensions.test(ext)) {
      message.error('This file type is not supported.');
      return Upload.LIST_IGNORE;
    }
    
    const maxSizeBytes = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSizeBytes) {
      message.error('File size exceeds the allowed limit.');
      return Upload.LIST_IGNORE;
    }
    
    return true;
  };

  const handleUpload = async ({ file, onSuccess, onError }) => {
    if (uploading) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('/api/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && (response.data.file || response.data.url || response.data.path)) {
        message.success('Media uploaded successfully.');
        if (onSuccess) onSuccess(response.data);
        
        // Refresh media library and auto-select uploaded item
        const updatedList = await fetchMedia();
        const uploadedFilename = response.data.file?.filename || response.data.file?.path?.split('/')?.pop();
        const found = updatedList?.find(m => m.filename === uploadedFilename || m.id === response.data.file?.id);
        const resolvedUrl = getFullMediaUrl(response.data.file?.url || response.data.file?.full_url || response.data.file?.path);
        
        if (found) {
          setSelectedItem({
            ...found,
            url: getFullMediaUrl(found.url),
            full_url: getFullMediaUrl(found.url)
          });
        } else if (response.data.file) {
          const fallbackItem = {
            id: response.data.file.id,
            name: response.data.file.originalname,
            filename: response.data.file.filename,
            type: response.data.file.mimetype?.startsWith('image') 
              ? 'image' 
              : (response.data.file.mimetype?.startsWith('video') ? 'video' : 'document'),
            url: resolvedUrl,
            full_url: resolvedUrl,
            relative_url: response.data.file.relative_url || response.data.file.path,
            size: response.data.file.size
          };
          setSelectedItem(fallbackItem);
        }
      } else {
        throw new Error('Upload response missing file data');
      }
    } catch (err) {
      console.error('[MediaLibraryModal] Upload error:', err);
      if (onError) onError(err);
      message.error('Failed to upload media. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleInsert = (item, mode = 'url') => {
    const target = item || selectedItem;
    if (!target) {
      message.warning('Please select a media item to insert');
      return;
    }
    const fullUrl = getFullMediaUrl(target.url || target.full_url || target.path);
    if (onSelect) {
      onSelect(fullUrl, {
        ...target,
        url: fullUrl,
        full_url: fullUrl,
        relative_url: target.relative_url || target.url,
        insertMode: mode
      }, mode);
    }
    if (onClose) {
      onClose();
    }
  };

  const copyToClipboard = (url, id) => {
    const fullUrl = getFullMediaUrl(url);
    if (!fullUrl) {
      message.error('No URL available to copy');
      return;
    }
    
    // Modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        setCopiedId(id);
        message.success('Image URL copied: ' + fullUrl);
        setTimeout(() => setCopiedId(null), 2500);
      }).catch((err) => {
        console.warn('[MediaLibraryModal] Clipboard API failed, falling back:', err);
        fallbackCopyToClipboard(fullUrl, id);
      });
    } else {
      fallbackCopyToClipboard(fullUrl, id);
    }
  };

  const fallbackCopyToClipboard = (url, id) => {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    
    try {
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopiedId(id);
        message.success('URL copied to clipboard!');
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        throw new Error('execCommand failed');
      }
    } catch (err) {
      document.body.removeChild(textArea);
      message.info({
        content: (
          <div>
            <div>Failed to copy automatically. Copy this URL:</div>
            <div style={{ 
              background: '#f5f5f5', 
              padding: '8px', 
              marginTop: '4px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              wordBreak: 'break-all'
            }}>
              {url}
            </div>
          </div>
        ),
        duration: 5
      });
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('image')) return <PictureOutlined />;
    if (fileType?.includes('video')) return <VideoCameraOutlined />;
    return <FileOutlined />;
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
      width={900}
      styles={{
        body: { 
          maxHeight: '60vh', 
          overflowY: 'auto',
          background: darkMode ? '#0f172a' : '#fafafa',
          padding: 0
        },
        footer: {
          padding: 0,
          background: darkMode ? '#1e293b' : '#fff'
        }
      }}
      footer={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: darkMode ? '#1e293b' : '#fff',
          borderTop: darkMode ? '1px solid #334155' : '1px solid #f0f0f0',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, overflow: 'hidden' }}>
            {selectedItem ? (
              <>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: darkMode ? '#0f172a' : '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8'
                }}>
                  {selectedItem.type?.startsWith('image') && selectedItem.url ? (
                    <img src={selectedItem.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    getFileIcon(selectedItem.type)
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <Text ellipsis strong style={{ fontSize: 13, display: 'block', color: darkMode ? '#f1f5f9' : '#111827', maxWidth: 360 }}>
                    {selectedItem.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#8c8c8c' }}>
                    {selectedItem.type?.toUpperCase()} • {(selectedItem.size || selectedItem.file_size) ? `${((selectedItem.size || selectedItem.file_size) / 1024).toFixed(1)} KB` : ''}
                  </Text>
                </div>
              </>
            ) : (
              <Text style={{ fontSize: 12, color: darkMode ? '#64748b' : '#8c8c8c' }}>
                Select a media item to insert
              </Text>
            )}
          </div>
          <Space>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              disabled={!selectedItem} 
              onClick={() => handleInsert(selectedItem, 'url')}
              style={{
                background: selectedItem ? '#4a7cff' : undefined,
                borderColor: selectedItem ? '#4a7cff' : undefined,
                fontWeight: 600
              }}
            >
              Insert Only
            </Button>
          </Space>
        </div>
      }
    >
      {/* Action / Filters Bar - Layout: [ Search media... ] [ All Types ▼ ] [ Refresh ] [ Upload ] */}
      <div style={{ 
        padding: '16px 24px', 
        background: darkMode ? '#1e293b' : '#fff',
        borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 1
      }}>
        <Space style={{ width: '100%', flexWrap: 'wrap' }} size="middle">
          <Input
            placeholder="Search media..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            value={filters.type}
            onChange={(value) => setFilters({ ...filters, type: value })}
            style={{ width: 140 }}
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
          <Upload
            customRequest={handleUpload}
            beforeUpload={beforeUpload}
            showUploadList={false}
            accept="image/*,video/*,.pdf,.doc,.docx,.svg"
            disabled={uploading}
          >
            <Button 
              type="primary" 
              icon={<UploadOutlined />} 
              loading={uploading}
              disabled={uploading}
              style={{ 
                background: '#4a7cff', 
                borderColor: '#4a7cff',
                fontWeight: 500
              }}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </Upload>
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
            {filteredMedia.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <Col key={item.id} xs={12} sm={8} md={6}>
                  <div
                    onClick={() => {
                      setSelectedItem(item);
                      copyToClipboard(item.url, item.id);
                    }}
                    onDoubleClick={() => handleInsert(item, 'url')}
                    style={{
                      background: darkMode ? '#1e293b' : '#fff',
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: isSelected 
                        ? '2px solid #4a7cff' 
                        : (darkMode ? '1px solid #334155' : '1px solid #e8e8e8'),
                      boxShadow: isSelected 
                        ? '0 0 0 2px rgba(74, 124, 255, 0.25)' 
                        : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = darkMode 
                          ? '0 8px 16px rgba(0,0,0,0.3)' 
                          : '0 8px 16px rgba(0,0,0,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {/* Selected Badge */}
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        background: '#4a7cff',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 22,
                        height: 22,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}>
                        <CheckOutlined style={{ fontSize: 12, strokeWidth: 2 }} />
                      </div>
                    )}

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
                          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghgg0Aj8i0JO4OzsrPv69Wv+hi2qPHr0qNvf39+iI97soRIh4f3z58/u7du3SXX7Xt7Z2enevHmzfQe+oSN2apSAPj09TSrb+XKI/f379+08+A0cNRE2ANkupk+ACNPvkSPcAAEibACyXUyfABGm3yNHuAECRNgAZLuYPgEirKlHu7u7XdyytGwHAd8jjNyng4OD7vnz51dbPT8/7z58+NB9+/bt6jU/TI+AGWHEnrx48eJ/EsSmHzx40L18+fLyzxF3ZVMjEyDCiEDjMYZZS5wiPXnyZFbJaxMhQIQRGzHvWR7XCyOCXsOmiDAi1HmPMMQjDpbpEiDCiL358eNHurW/5SnWdIBbXiDCiA38/Pnzrce2YyZ4//59F3ePLNMl4PbpiL2J0L979+7yDtHDhw8vtzzvdGnEXdvUigSIsCLAWavHp/+qM0BcXMd/q25n1vF57TYBp0a3mUzilePj4+7k5KSLb6gt6ydAhPUzXnoPR0dHl79WGTNCfBnn1uvSCJdegQhLI1vvCk+fPu2ePXt2tZOYEV6/fn31dz+shwAR1sP1cqvLntbEN9MxA9xcYjsxS1jWR4AIa2Ibzx0tc44fYX/16lV6NDFLXH+YL32jwiACRBiEbf5KcXoTIsQSpzXx4N28Ja4BQoK7rgXiydbHjx/P25TaQAJEGAguWy0+2Q8PD6/Ki4R8EVl+bzBOnZY95fq9rj9zAkTI2SxdidBHqG9+skdw43borCXO/ZcJdraPWdv22uIEiLA4q7nvvCug8WTqzQveOH26fodo7g6uFe/a17W3+nFBAkRYENRdb1vkkz1CH9cPsVy/jrhr27PqMYvENYNlHAIesRiBYwRy0V+8iXP8+/fvX11Mr7L7ECueb/r48eMqm7FuI2BGWDEG8cm+7G3NEOfmdcTQw4h9/55lhm7DekRYKQPZF2ArbXTAyu4kDYB2YxUzwg0gi/41ztHnfQG26HbGel/crVrm7tNY+/1btkOEAZ2M05r4FB7r9GbAIdxaZYrHdOsgJ/wCEQY0J74TmOKnbxxT9n3FgGGWWsVdowHtjt9Nnvf7yQM2aZU/TIAIAxrw6dOnAWtZZcoEnBpNuTuObWMEiLAx1HY0ZQJEmHJ3HNvGCBBhY6jtaMoEiJB0Z29vL6ls58vxPcO8/zfrdo5qvKO+d3Fx8Wu8zf1dW4p/cPzLly/dtv9Ts/EbcvGAHhHyfBIhZ6NSiIBTo0LNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQBEK/wswAV+sl9IxZQAAAABJRU5ErkJggg=="
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
                          color: '#fff',
                          zIndex: 3
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
                            color: darkMode ? '#cbd5e1' : '#1a1a2e',
                            fontWeight: isSelected ? 600 : 400
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
                          {(item.size || item.file_size) && !isNaN(item.size || item.file_size) 
                            ? `${((item.size || item.file_size) / 1024).toFixed(1)} KB`
                            : ''
                          }
                        </Text>
                        <Space size={2}>
                          <Tooltip title="Copy full URL">
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined style={{ color: '#4a7cff', fontSize: 13 }} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(item.url, item.id);
                              }}
                              style={{ width: 22, height: 22, padding: 0 }}
                            />
                          </Tooltip>
                          <Tooltip title="Open in new tab">
                            <Button
                              type="text"
                              size="small"
                              icon={<ExportOutlined style={{ color: '#10b981', fontSize: 13 }} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(getFullMediaUrl(item.url), '_blank');
                              }}
                              style={{ width: 22, height: 22, padding: 0 }}
                            />
                          </Tooltip>
                        </Space>
                      </div>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    </Modal>
  );
};

export default MediaLibraryModal;
