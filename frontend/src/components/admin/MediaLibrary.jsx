import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Typography, 
  Button, 
  Input, 
  Select, 
  Space, 
  Tooltip,
  Dropdown,
  Upload,
  App,
  Pagination,
  ConfigProvider,
  Modal,
  Tag,
} from 'antd';
import {
  SearchOutlined,
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
  LinkOutlined,
  EyeOutlined,
  FolderAddOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const { Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

/* ─────────────────────────────────────────────
   STYLING SYSTEM & ANIMATIONS (Dashboard Parity)
───────────────────────────────────────────── */
const mediaStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

  .media-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    animation: mediaFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes mediaFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .media-stagger-1 { animation: mediaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .media-stagger-2 { animation: mediaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.10s both; }
  .media-stagger-3 { animation: mediaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }

  @keyframes mediaSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .media-beacon-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #06B6D4;
    position: relative;
    display: inline-block;
  }
  .media-beacon-dot::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 2px solid #06B6D4;
    animation: mediaPulse 2s ease-out infinite;
  }
  @keyframes mediaPulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .media-kpi-card {
    border-radius: 16px;
    padding: 20px 22px;
    position: relative;
    overflow: hidden;
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .media-kpi-card:hover {
    transform: translateY(-3px);
  }

  .media-item-card {
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
  }
  .media-item-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px -4px rgba(0,0,0,0.15);
  }
`;

const MediaLibrary = () => {
  const { darkMode } = useTheme();
  const D = darkMode;
  const { message } = App.useApp();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
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
  const [previewItem, setPreviewItem] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    images: 0,
    videos: 0,
    documents: 0,
  });
  const pageSize = 36;

  const [folders, setFolders] = useState([
    { name: 'All Media', count: 0, icon: <PictureOutlined /> },
    { name: 'Images', count: 0, icon: <FolderOutlined /> },
    { name: 'Videos', count: 0, icon: <FolderOutlined /> },
    { name: 'Documents', count: 0, icon: <FolderOutlined /> },
  ]);

  useEffect(() => {
    fetchMedia();
  }, [filters]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setCurrentPage(1);
      const params = {};
      if (filters.type && filters.type !== 'all') params.file_type = filters.type;
      if (filters.folder && filters.folder !== 'all') params.folder = filters.folder;
      if (filters.search) params.search = filters.search;
      
      const endpoint = user?.role === 'admin' 
        ? '/api/media/all' 
        : '/api/media/user/all';
      
      const response = await axios.get(endpoint, { 
        params,
        headers: { 'Cache-Control': 'no-cache' }
      });
      let items = response.data.data || [];
      
      const countsEndpoint = user?.role === 'admin'
        ? '/api/media/folder-counts'
        : '/api/media/user/folder-counts';
      const countsResponse = await axios.get(countsEndpoint);
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
      
      const imageCount = items.filter(i => i.type === 'image').length;
      const videoCount = items.filter(i => i.type === 'video').length;
      const documentCount = items.filter(i => i.type === 'document').length;
      
      setStats({
        total: items.length,
        images: imageCount,
        videos: videoCount,
        documents: documentCount,
      });
      
      setMedia(items);
    } catch (error) {
      console.error('Error fetching media:', error);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedItems.map(id => axios.delete(`/api/media/${id}`)));
      setMedia(media.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
      message.success(`${selectedItems.length} items deleted successfully`);
    } catch (error) {
      message.error('Failed to delete selected items');
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

  const handleSelect = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      message.error('Please enter a folder name');
      return;
    }
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
        return <PictureOutlined style={{ fontSize: 24, color: '#06B6D4' }} />;
      case 'video':
        return <VideoCameraOutlined style={{ fontSize: 24, color: '#F59E0B' }} />;
      case 'document':
        return <FileOutlined style={{ fontSize: 24, color: '#10B981' }} />;
      default:
        return <FileOutlined style={{ fontSize: 24, color: '#64748B' }} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const StatCard = ({ title, value, icon, color = 'primary', accentColor, subtitle }) => {
    const colorMap = {
      primary: { bg: D ? 'rgba(6, 182, 212, 0.12)' : 'rgba(6, 182, 212, 0.08)', text: '#06B6D4', border: 'rgba(6, 182, 212, 0.3)' },
      info: { bg: D ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' },
      warning: { bg: D ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
      purple: { bg: D ? 'rgba(168, 85, 247, 0.12)' : 'rgba(168, 85, 247, 0.08)', text: '#A855F7', border: 'rgba(168, 85, 247, 0.3)' },
    };
    const c = colorMap[color] || colorMap.primary;

    return (
      <div
        className="media-kpi-card"
        style={{
          background: D
            ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.65) 100%)'
            : 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)'}`,
          boxShadow: D
            ? '0 10px 30px -5px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 10px 30px -5px rgba(11, 31, 77, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accentColor || c.text }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: D ? '#94A3B8' : '#64748B' }}>
            {title}
          </span>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bg, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: `1px solid ${c.border}` }}>
            {icon}
          </div>
        </div>

        <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: D ? '#F8FAFC' : '#0F172A', lineHeight: 1 }}>
          {value}
        </div>

        {subtitle && (
          <div style={{ marginTop: 8, fontSize: '0.75rem', fontWeight: 600, color: D ? '#64748B' : '#94A3B8' }}>
            {subtitle}
          </div>
        )}
      </div>
    );
  };

  const mediaItemMenu = (item) => ({
    items: [
      {
        key: 'preview',
        icon: <EyeOutlined />,
        label: 'Preview Details',
        onClick: () => setPreviewItem(item),
      },
      {
        key: 'download',
        icon: <DownloadOutlined />,
        label: 'Download File',
        onClick: () => handleDownload(item),
      },
      {
        key: 'copy-url',
        icon: <LinkOutlined />,
        label: 'Copy Public Link',
        onClick: () => handleCopyUrl(item),
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Delete Asset',
        danger: true,
        onClick: () => handleDelete(item.id),
      },
    ],
  });

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: D ? '#1E293B' : '#FFFFFF',
          colorText: D ? '#CBD5E1' : '#334155',
          colorBorder: D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)',
          colorBgElevated: D ? '#1E293B' : '#FFFFFF',
          fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
        },
      }}
    >
      <style>{mediaStyles}</style>

      <div className="media-root" style={{ padding: '24px 28px', background: D ? '#0A1229' : '#F8FAFC', minHeight: '100vh' }}>
        {/* ── COMMAND HEADER BANNER ── */}
        <div
          className="media-stagger-1"
          style={{
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 24,
            background: D
              ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.75) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)'}`,
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: D ? '0 12px 32px -4px rgba(0, 0, 0, 0.4)' : '0 12px 32px -4px rgba(11, 31, 77, 0.05)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.4), transparent)' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="media-beacon-dot" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#06B6D4' }}>
                Digital Asset Management (DAM)
              </span>
              <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>•</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B' }}>
                {stats.total} Total Files Stored
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
              <PictureOutlined style={{ color: '#06B6D4' }} /> Media & Asset Library
            </h1>
          </div>

          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={() => setUploadModalVisible(true)}
            style={{
              background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              height: 42,
              padding: '0 20px',
              fontSize: '0.85rem',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            Upload New Assets
          </Button>
        </div>

        {/* ── EXECUTIVE KPI GRID ── */}
        <div
          className="media-stagger-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard title="Total Stored Assets" value={stats.total} icon={<FileOutlined />} color="primary" accentColor="#06B6D4" subtitle="All Media Repositories" />
          <StatCard title="Images & Graphics" value={stats.images} icon={<PictureOutlined />} color="info" accentColor="#3B82F6" subtitle="PNG, JPG, SVG, WebP" />
          <StatCard title="Video & Motion" value={stats.videos} icon={<VideoCameraOutlined />} color="warning" accentColor="#F59E0B" subtitle="MP4, WebM, Streams" />
          <StatCard title="Documents & PDFs" value={stats.documents} icon={<FileOutlined />} color="purple" accentColor="#A855F7" subtitle="PDF, DOCX, Spreadsheets" />
        </div>

        <Row gutter={[20, 20]}>
          {/* ── FOLDERS & FILTERS SIDEBAR ── */}
          <Col xs={24} lg={5}>
            <div
              className="media-stagger-3"
              style={{
                background: D ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                borderRadius: 16,
                border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                padding: 18,
                boxShadow: D ? '0 10px 30px -5px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(11, 31, 77, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: D ? '#94A3B8' : '#64748B' }}>
                  Media Folders
                </span>
                <Button
                  type="text"
                  icon={<FolderAddOutlined />}
                  size="small"
                  onClick={() => setNewFolderModalVisible(true)}
                  style={{ color: '#06B6D4', borderRadius: 6 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                {folders.map((folder, index) => {
                  const isSelected = filters.folder === (index === 0 ? 'all' : folder.name.toLowerCase());
                  return (
                    <div
                      key={index}
                      onClick={() => setFilters({ ...filters, folder: index === 0 ? 'all' : folder.name.toLowerCase() })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: isSelected
                          ? (D ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.08)')
                          : 'transparent',
                        border: isSelected
                          ? `1px solid ${D ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.2)'}`
                          : '1px solid transparent',
                        color: isSelected ? '#06B6D4' : (D ? '#CBD5E1' : '#334155'),
                        fontWeight: isSelected ? 700 : 500,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {folder.icon}
                        <span style={{ fontSize: '0.83rem' }}>{folder.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.72rem', background: D ? 'rgba(255,255,255,0.06)' : '#F1F5F9', padding: '2px 8px', borderRadius: 6 }}>
                          {folder.count}
                        </span>
                        {index !== 0 && (
                          <Dropdown
                            menu={{
                              items: [
                                { key: 'rename', label: 'Rename', onClick: () => openRenameModal(index) },
                                { key: 'delete', label: 'Delete', danger: true, onClick: () => handleDeleteFolder(index) },
                              ],
                            }}
                            trigger={['click']}
                          >
                            <Button type="text" icon={<MoreOutlined />} size="small" style={{ padding: '0 4px', color: D ? '#64748B' : '#94A3B8' }} onClick={e => e.stopPropagation()} />
                          </Dropdown>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`, paddingTop: 16 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: D ? '#94A3B8' : '#64748B', display: 'block', marginBottom: 8 }}>
                  Filter File Type
                </span>
                <Select
                  style={{ width: '100%', borderRadius: 10 }}
                  value={filters.type}
                  onChange={(value) => setFilters({ ...filters, type: value })}
                >
                  <Option value="all">📂 All File Formats</Option>
                  <Option value="image">🖼️ Images Only</Option>
                  <Option value="video">🎥 Videos Only</Option>
                  <Option value="document">📄 Documents Only</Option>
                </Select>
              </div>
            </div>
          </Col>

          {/* ── MAIN MEDIA ASSET GRID ── */}
          <Col xs={24} lg={19}>
            <div
              className="media-stagger-3"
              style={{
                background: D ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                borderRadius: 16,
                border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                padding: 20,
                boxShadow: D ? '0 10px 30px -5px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(11, 31, 77, 0.05)',
                minHeight: 500,
              }}
            >
              {/* Search and Action Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 240 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: D ? '#1E293B' : '#F1F5F9',
                      border: `1px solid ${D ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.8)'}`,
                      borderRadius: 10,
                      padding: '6px 14px',
                      flex: 1,
                      maxWidth: 320,
                    }}
                  >
                    <SearchOutlined style={{ color: D ? '#64748B' : '#94A3B8', fontSize: 14 }} />
                    <input
                      type="text"
                      placeholder="Search files by name..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '0.82rem',
                        color: D ? '#F8FAFC' : '#0F172A',
                        width: '100%',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  <span style={{ fontSize: '0.78rem', color: D ? '#64748B' : '#94A3B8' }}>
                    {media.length} Items Available
                  </span>
                </div>

                <Space size={8}>
                  <Tooltip title="Reload Library">
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => { setFilters({ ...filters, search: '' }); fetchMedia(); }}
                      style={{ borderRadius: 10, background: D ? '#1E293B' : '#F1F5F9' }}
                    />
                  </Tooltip>

                  {selectedItems.length > 0 && (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleBulkDelete}
                      style={{ borderRadius: 10, fontWeight: 700 }}
                    >
                      Delete Selected ({selectedItems.length})
                    </Button>
                  )}
                </Space>
              </div>

              {/* Upload Drop Area Modal Trigger */}
              {uploadModalVisible && (
                <div
                  style={{
                    marginBottom: 20,
                    padding: 20,
                    borderRadius: 14,
                    border: `2px dashed ${D ? '#38BDF8' : '#0284C7'}`,
                    background: D ? 'rgba(15, 23, 42, 0.95)' : 'rgba(240, 249, 255, 0.95)',
                    textAlign: 'center',
                  }}
                >
                  <Dragger {...uploadProps} style={{ background: 'transparent', border: 'none' }}>
                    <p style={{ margin: 0 }}>
                      <CloudUploadOutlined style={{ fontSize: 42, color: '#06B6D4', marginBottom: 8 }} />
                    </p>
                    <p style={{ fontSize: '0.92rem', fontWeight: 700, color: D ? '#F8FAFC' : '#0F172A', margin: '4px 0' }}>
                      Click or Drag files to Upload to Library
                    </p>
                    <p style={{ fontSize: '0.78rem', color: D ? '#64748B' : '#94A3B8', margin: 0 }}>
                      PNG, JPG, SVG, MP4, PDF, DOCX (Up to 10MB per file)
                    </p>
                  </Dragger>
                  <Button onClick={() => setUploadModalVisible(false)} style={{ marginTop: 12, borderRadius: 8 }}>
                    Close Upload Box
                  </Button>
                </div>
              )}

              {/* Media Cards Grid */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: D ? '#64748B' : '#94A3B8' }}>
                  Loading media library assets...
                </div>
              ) : media.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: D ? '#64748B' : '#94A3B8' }}>
                  <PictureOutlined style={{ fontSize: 48, opacity: 0.4, marginBottom: 12 }} />
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: D ? '#F8FAFC' : '#0F172A' }}>No media assets found</div>
                  <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Upload image, video or document files to populate your repository.</div>
                </div>
              ) : (
                <>
                  <Row gutter={[16, 16]}>
                    {media.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item) => {
                      const isSelected = selectedItems.includes(item.id);
                      return (
                        <Col xs={12} sm={8} md={6} lg={6} xl={4} key={item.id}>
                          <div
                            className="media-item-card"
                            onClick={() => handleSelect(item.id)}
                            style={{
                              background: D ? '#1E293B' : '#FFFFFF',
                              border: `2px solid ${isSelected ? '#06B6D4' : (D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)')}`,
                              boxShadow: isSelected ? '0 0 12px rgba(6, 182, 212, 0.3)' : 'none',
                            }}
                          >
                            <div style={{ position: 'relative', height: 110, background: D ? '#0F172A' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                              {item.type === 'image' ? (
                                <img
                                  src={item.url}
                                  alt={item.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                getTypeIcon(item.type)
                              )}

                              {isSelected && (
                                <div style={{ position: 'absolute', top: 6, left: 6, width: 20, height: 20, borderRadius: '50%', background: '#06B6D4', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                  ✓
                                </div>
                              )}

                              <Dropdown menu={mediaItemMenu(item)} trigger={['click']}>
                                <Button
                                  type="text"
                                  icon={<MoreOutlined />}
                                  style={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    background: D ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: 6,
                                    padding: '0 6px',
                                    height: 26,
                                  }}
                                  onClick={e => e.stopPropagation()}
                                />
                              </Dropdown>
                            </div>

                            <div style={{ padding: '10px 12px' }}>
                              <Text
                                strong
                                style={{
                                  fontSize: '0.8rem',
                                  color: D ? '#F8FAFC' : '#0F172A',
                                  display: 'block',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.name}
                              </Text>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                <span style={{ fontSize: '0.7rem', color: D ? '#64748B' : '#94A3B8' }}>{formatFileSize(item.size)}</span>
                                <span style={{ fontSize: '0.7rem', color: D ? '#64748B' : '#94A3B8' }}>{item.type}</span>
                              </div>
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>

                  <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={media.length}
                      showSizeChanger={false}
                      onChange={(p) => setCurrentPage(p)}
                    />
                  </div>
                </>
              )}
            </div>
          </Col>
        </Row>

        {/* Create Folder Modal */}
        <Modal
          title={<div style={{ fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A' }}>Create New Media Folder</div>}
          open={newFolderModalVisible}
          onOk={handleCreateFolder}
          onCancel={() => setNewFolderModalVisible(false)}
          okText="Create Folder"
          okButtonProps={{ style: { background: '#06B6D4', border: 'none', borderRadius: 8 } }}
        >
          <Input
            placeholder="Enter folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            style={{ borderRadius: 8, marginTop: 12 }}
          />
        </Modal>

        {/* Rename Folder Modal */}
        <Modal
          title={<div style={{ fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A' }}>Rename Folder</div>}
          open={renameFolderModalVisible}
          onOk={handleRenameFolder}
          onCancel={() => setRenameFolderModalVisible(false)}
          okText="Rename Folder"
          okButtonProps={{ style: { background: '#06B6D4', border: 'none', borderRadius: 8 } }}
        >
          <Input
            placeholder="Enter new folder name..."
            value={renameFolderName}
            onChange={(e) => setRenameFolderName(e.target.value)}
            style={{ borderRadius: 8, marginTop: 12 }}
          />
        </Modal>

        {/* Preview Details Modal */}
        {previewItem && (
          <Modal
            title={<div style={{ fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A' }}>{previewItem.name}</div>}
            open={!!previewItem}
            onCancel={() => setPreviewItem(null)}
            footer={[
              <Button key="close" onClick={() => setPreviewItem(null)} style={{ borderRadius: 8 }}>Close</Button>,
              <Button key="copy" icon={<LinkOutlined />} onClick={() => handleCopyUrl(previewItem)} style={{ borderRadius: 8 }}>Copy Link</Button>,
              <Button key="dl" type="primary" icon={<DownloadOutlined />} onClick={() => handleDownload(previewItem)} style={{ background: '#06B6D4', border: 'none', borderRadius: 8 }}>Download</Button>,
            ]}
          >
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              {previewItem.type === 'image' ? (
                <img src={previewItem.url} alt={previewItem.name} style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, objectFit: 'contain' }} />
              ) : (
                getTypeIcon(previewItem.type)
              )}
            </div>
            <div style={{ fontSize: '0.82rem', color: D ? '#CBD5E1' : '#334155', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div><strong>File Name:</strong> {previewItem.name}</div>
              <div><strong>File Type:</strong> {previewItem.type}</div>
              <div><strong>Size:</strong> {formatFileSize(previewItem.size)}</div>
              <div><strong>URL:</strong> <code style={{ fontSize: '0.75rem' }}>{previewItem.url}</code></div>
            </div>
          </Modal>
        )}
      </div>
    </ConfigProvider>
  );
};

export default MediaLibrary;
