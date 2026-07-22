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
  message,
  Row,
  Col
} from 'antd';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  FileOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const Uploads = () => {
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
    <div style={{ padding: '24px' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <CloudUploadOutlined /> Upload Files
      </Title>

      <Row gutter={16}>
        <Col span={16}>
          <Card>
            <Dragger {...uploadProps} style={{ marginBottom: 16 }}>
              <p className="ant-upload-drag-icon">
                <CloudUploadOutlined style={{ fontSize: 48, color: '#0AAEEF' }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 16, fontWeight: 500 }}>
                Click or drag files to this area to upload
              </p>
              <p className="ant-upload-hint" style={{ color: '#6B7280' }}>
                Support for single or bulk upload. Images, videos, documents up to 10MB.
              </p>
            </Dragger>

            {fileList.length > 0 && (
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Button onClick={handleClearAll} disabled={uploading}>
                  Clear All
                </Button>
              </div>
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Upload Queue" style={{ minHeight: 400 }}>
            {fileList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
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
                          <Text type="secondary" style={{ fontSize: 12 }}>
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
  );
};

export default Uploads;
