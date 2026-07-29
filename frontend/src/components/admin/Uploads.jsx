import React, { useState } from 'react';
import { 
  Card, 
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
  ConfigProvider
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
} from '@ant-design/icons';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const Uploads = () => {
  const { darkMode } = useTheme();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [fileList, setFileList] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);

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
    navigate('/admin/media-library');
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <PictureOutlined style={{ fontSize: 24, color: '#0AAEEF' }} />;
    if (type.startsWith('video/')) return <VideoCameraOutlined style={{ fontSize: 24, color: '#F59E0B' }} />;
    if (type.startsWith('text/') || type.includes('pdf')) return <FileTextOutlined style={{ fontSize: 24, color: '#10B981' }} />;
    return <FileOutlined style={{ fontSize: 24, color: '#6B7280' }} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

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
      <div style={{ padding: '24px', background: darkMode ? '#0f172a' : '#f8fafc', minHeight: '100vh' }}>
      <Title level={3} style={{ marginBottom: 24, color: darkMode ? '#f1f5f9' : '#111827' }}>
        <CloudUploadOutlined /> Upload Files
      </Title>

      <Row gutter={16}>
        <Col span={16}>
          <Card style={{ background: darkMode ? '#1e293b' : '#fff', border: darkMode ? '1px solid #334155' : '#1px solid #e8e8e8' }}>
            <Dragger {...uploadProps} style={{ marginBottom: 16 }}>
              <p className="ant-upload-drag-icon">
                <CloudUploadOutlined style={{ fontSize: 48, color: '#0AAEEF' }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 16, fontWeight: 500 }}>
                Click or drag files to this area to upload
              </p>
              <p className="ant-upload-hint" style={{ color: darkMode ? '#94a3b8' : '#6B7280' }}>
                Support for single or bulk upload. Images, videos, documents up to 10MB.
              </p>
            </Dragger>

            {fileList.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button icon={<FolderOpenOutlined />} onClick={handleViewMediaLibrary}>
                  View in Media Library
                </Button>
                <Button onClick={handleClearAll} disabled={uploading}>
                  Clear All
                </Button>
              </div>
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Upload Queue" style={{ minHeight: 400, background: darkMode ? '#1e293b' : '#fff', border: darkMode ? '1px solid #334155' : '#1px solid #e8e8e8' }}>
            {fileList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: darkMode ? '#64748b' : '#9CA3AF' }}>
                <CloudUploadOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>No files in queue</p>
              </div>
            ) : (
              <List
                dataSource={fileList}
                renderItem={(file) => (
                  <List.Item style={{ padding: '12px 0' }}>
                    <List.Item.Meta
                      avatar={getFileIcon(file.type)}
                      title={
                        <Space>
                          <Text ellipsis style={{ maxWidth: 150 }}>
                            {file.name}
                          </Text>
                          {file.status === 'done' && (
                            <Tag color="success" icon={<CheckCircleOutlined />}>
                              Done
                            </Tag>
                          )}
                          {file.status === 'uploading' && (
                            <Tag color="processing">Uploading</Tag>
                          )}
                          {file.status === 'error' && (
                            <Tag color="error">Error</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <div>
                          <Text type="secondary" style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#6B7280' }}>
                            {formatFileSize(file.size)}
                          </Text>
                          {file.status === 'uploading' && uploadProgress[file.uid] && (
                            <Progress 
                              percent={uploadProgress[file.uid]} 
                              size="small" 
                              style={{ marginTop: 4 }}
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
                      />
                    )}
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
    </ConfigProvider>
  );
};

export default Uploads;
