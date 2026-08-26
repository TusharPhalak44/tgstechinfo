import React, { useState } from 'react';
import { 
  Typography, 
  Button, 
  Upload, 
  Progress, 
  Space, 
  List, 
  Tag, 
  App,
  Row,
  Col,
  ConfigProvider,
} from 'antd';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  FileOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;
const { Dragger } = Upload;

/* ─────────────────────────────────────────────
   STYLING SYSTEM & ANIMATIONS (Dashboard Parity)
───────────────────────────────────────────── */
const uploadStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

  .up-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    animation: upFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes upFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .up-stagger-1 { animation: upSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .up-stagger-2 { animation: upSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.10s both; }
  .up-stagger-3 { animation: upSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }

  @keyframes upSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .up-beacon-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #F7941D;
    position: relative;
    display: inline-block;
  }
  .up-beacon-dot::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 2px solid #F7941D;
    animation: upPulse 2s ease-out infinite;
  }
  @keyframes upPulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .up-kpi-card {
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
  .up-kpi-card:hover {
    transform: translateY(-3px);
  }
`;

const Uploads = () => {
  const { darkMode } = useTheme();
  const D = darkMode;
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [fileList, setFileList] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    uploading: 0,
    failed: 0,
  });

  const uploadProps = {
    name: 'file',
    multiple: true,
    fileList,
    customRequest: async ({ file, onProgress, onSuccess, onError }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        setUploading(true);
        const response = await axios.post('/api/media/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({ percent });
            setUploadProgress(prev => ({
              ...prev,
              [file.uid]: percent
            }));
          },
        });
        
        onSuccess(response.data, file);
        message.success(`${file.name} uploaded successfully`);
      } catch (error) {
        onError(error);
        message.error(`${file.name} upload failed`);
      } finally {
        setUploading(false);
      }
    },
    onChange: ({ fileList }) => {
      setFileList(fileList);
      
      const completed = fileList.filter(f => f.status === 'done').length;
      const uploading = fileList.filter(f => f.status === 'uploading').length;
      const failed = fileList.filter(f => f.status === 'error').length;
      
      setStats({
        total: fileList.length,
        completed,
        uploading,
        failed,
      });
    },
    onRemove: (file) => {
      setFileList(fileList.filter(item => item.uid !== file.uid));
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.uid];
        return newProgress;
      });
    },
  };

  const handleClearAll = () => {
    setFileList([]);
    setUploadProgress({});
  };

  const handleViewMediaLibrary = () => {
    navigate('/dashboard/media-library');
  };

  const getFileIcon = (type) => {
    if (!type) return <FileOutlined style={{ fontSize: 24, color: '#64748B' }} />;
    if (type.startsWith('image/')) return <PictureOutlined style={{ fontSize: 24, color: '#3B82F6' }} />;
    if (type.startsWith('video/')) return <VideoCameraOutlined style={{ fontSize: 24, color: '#F59E0B' }} />;
    if (type.startsWith('text/') || type.includes('pdf')) return <FileTextOutlined style={{ fontSize: 24, color: '#10B981' }} />;
    return <FileOutlined style={{ fontSize: 24, color: '#64748B' }} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const StatCard = ({ title, value, icon, color = 'primary', accentColor, subtitle }) => {
    const colorMap = {
      primary: { bg: D ? 'rgba(247, 148, 29, 0.12)' : 'rgba(247, 148, 29, 0.08)', text: '#F7941D', border: 'rgba(247, 148, 29, 0.3)' },
      success: { bg: D ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
      warning: { bg: D ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
      danger: { bg: D ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
    };
    const c = colorMap[color] || colorMap.primary;

    return (
      <div
        className="up-kpi-card"
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
      <style>{uploadStyles}</style>

      <div className="up-root" style={{ padding: '24px 28px', background: D ? '#0A1229' : '#F8FAFC', minHeight: '100vh' }}>
        {/* ── COMMAND HEADER BANNER ── */}
        <div
          className="up-stagger-1"
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
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(247, 148, 29, 0.4), transparent)' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="up-beacon-dot" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#F7941D' }}>
                Batch Ingestion & Uploads
              </span>
              <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>•</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B' }}>
                {stats.total} Queue Items
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CloudUploadOutlined style={{ color: '#F7941D' }} /> Asset Upload Portal
            </h1>
          </div>

          <Button
            type="primary"
            icon={<FolderOpenOutlined />}
            onClick={handleViewMediaLibrary}
            style={{
              background: 'linear-gradient(135deg, #EA580C 0%, #F7941D 100%)',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              height: 42,
              padding: '0 20px',
              fontSize: '0.85rem',
              boxShadow: '0 4px 14px rgba(247, 148, 29, 0.3)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            Explore Media Library <ArrowRightOutlined />
          </Button>
        </div>

        {/* ── EXECUTIVE KPI GRID ── */}
        <div
          className="up-stagger-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard title="Total Upload Queue" value={stats.total} icon={<FileOutlined />} color="primary" accentColor="#F7941D" subtitle="Batch Queue Count" />
          <StatCard title="Completed Uploads" value={stats.completed} icon={<CheckCircleOutlined />} color="success" accentColor="#10B981" subtitle="Successfully Saved" />
          <StatCard title="In Transfer" value={stats.uploading} icon={<CloudUploadOutlined />} color="warning" accentColor="#F59E0B" subtitle="Active Processing" />
          <StatCard title="Failed Transfers" value={stats.failed} icon={<DeleteOutlined />} color="danger" accentColor="#EF4444" subtitle="Upload Errors" />
        </div>

        {/* ── MAIN WORKSPACE GRID ── */}
        <Row gutter={[20, 20]} className="up-stagger-3">
          <Col xs={24} lg={15}>
            <div
              style={{
                background: D ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                borderRadius: 16,
                border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                padding: 24,
                boxShadow: D ? '0 10px 30px -5px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(11, 31, 77, 0.05)',
              }}
            >
              <Dragger {...uploadProps} style={{ padding: '30px 20px', borderRadius: 12, border: `2px dashed ${D ? '#38BDF8' : '#3B82F6'}`, background: D ? '#0F172A' : '#F0F9FF' }}>
                <p className="ant-upload-drag-icon" style={{ marginBottom: 12 }}>
                  <CloudUploadOutlined style={{ fontSize: 52, color: '#F7941D' }} />
                </p>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A', margin: '4px 0 6px' }}>
                  Drag & Drop Files Here to Upload
                </p>
                <p style={{ fontSize: '0.82rem', color: D ? '#64748B' : '#94A3B8', margin: 0 }}>
                  Supports bulk selection of Images, Videos, PDFs, and Documents (Max 10MB per file)
                </p>
              </Dragger>

              {fileList.length > 0 && (
                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button icon={<FolderOpenOutlined />} onClick={handleViewMediaLibrary} style={{ borderRadius: 10, fontWeight: 600 }}>
                    Open Media Library
                  </Button>
                  <Button onClick={handleClearAll} disabled={uploading} style={{ borderRadius: 10 }}>
                    Clear Queue
                  </Button>
                </div>
              )}
            </div>
          </Col>

          <Col xs={24} lg={9}>
            <div
              style={{
                background: D ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                borderRadius: 16,
                border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                padding: 20,
                boxShadow: D ? '0 10px 30px -5px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(11, 31, 77, 0.05)',
                minHeight: 380,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`, paddingBottom: 12 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CloudUploadOutlined style={{ color: '#F7941D' }} /> Active Upload Queue
                </span>
                <Tag color="orange" style={{ borderRadius: 6, fontWeight: 700, fontSize: '0.72rem' }}>
                  {fileList.length} Items
                </Tag>
              </div>

              {fileList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 0', color: D ? '#64748B' : '#94A3B8' }}>
                  <CloudUploadOutlined style={{ fontSize: 42, opacity: 0.3, marginBottom: 10 }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Queue is currently empty</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: 2 }}>Files added to the dropzone will appear here.</div>
                </div>
              ) : (
                <List
                  dataSource={fileList}
                  renderItem={(file) => (
                    <List.Item style={{ padding: '10px 0', borderBottom: `1px solid ${D ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.6)'}` }}>
                      <List.Item.Meta
                        avatar={getFileIcon(file.type)}
                        title={
                          <Space>
                            <Text ellipsis style={{ maxWidth: 160, color: D ? '#F8FAFC' : '#0F172A', fontWeight: 700, fontSize: '0.82rem' }}>
                              {file.name}
                            </Text>
                            {file.status === 'done' && <Tag color="success" icon={<CheckCircleOutlined />} style={{ borderRadius: 6 }}>Done</Tag>}
                            {file.status === 'uploading' && <Tag color="processing" style={{ borderRadius: 6 }}>Uploading</Tag>}
                            {file.status === 'error' && <Tag color="error" style={{ borderRadius: 6 }}>Error</Tag>}
                          </Space>
                        }
                        description={
                          <div>
                            <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>
                              {formatFileSize(file.size)}
                            </span>
                            {file.status === 'uploading' && uploadProgress[file.uid] && (
                              <Progress 
                                percent={uploadProgress[file.uid]} 
                                size="small" 
                                style={{ marginTop: 4 }}
                                status={uploadProgress[file.uid] === 100 ? 'success' : 'active'}
                              />
                            )}
                          </div>
                        }
                      />
                      {file.status !== 'uploading' && (
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={() => uploadProps.onRemove(file)}
                          style={{ borderRadius: 6 }}
                        />
                      )}
                    </List.Item>
                  )}
                />
              )}
            </div>
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  );
};

export default Uploads;
