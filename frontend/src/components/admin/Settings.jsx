import React, { useState, useEffect } from 'react';
import { Card, Form, Upload, Button, message, Typography, Space, Divider, Input, Switch } from 'antd';
import { UploadOutlined, DeleteOutlined, PictureOutlined, SaveOutlined } from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text } = Typography;

const Settings = () => {
  const { darkMode } = useTheme();
  const [sidebarLogo1Url, setSidebarLogo1Url] = useState('');
  const [sidebarLogo2Url, setSidebarLogo2Url] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [siteName, setSiteName] = useState('TgsTechInfo');

  useEffect(() => {
    // Load saved settings
    const savedSidebarLogo1 = localStorage.getItem('cmsSidebarLogo1Url');
    const savedSidebarLogo2 = localStorage.getItem('cmsSidebarLogo2Url');
    const savedFavicon = localStorage.getItem('cmsFaviconUrl');
    const savedSiteName = localStorage.getItem('cmsSiteName');
    if (savedSidebarLogo1) setSidebarLogo1Url(savedSidebarLogo1);
    if (savedSidebarLogo2) setSidebarLogo2Url(savedSidebarLogo2);
    if (savedFavicon) setFaviconUrl(savedFavicon);
    if (savedSiteName) setSiteName(savedSiteName);
  }, []);

  const handleSidebarLogo1Upload = (info) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }
    if (info.file.status === 'done') {
      setUploading(false);
      const reader = new FileReader();
      reader.readAsDataURL(info.file.originFileObj);
      reader.onload = () => {
        const base64Url = reader.result;
        localStorage.setItem('cmsSidebarLogo1Url', base64Url);
        localStorage.setItem('cmsLogoUrl', base64Url); // Keep for backward compatibility
        setSidebarLogo1Url(base64Url);
        message.success('Sidebar Logo 1 uploaded successfully');
      };
    }
    if (info.file.status === 'error') {
      setUploading(false);
      message.error('Logo upload failed');
    }
  };

  const handleSidebarLogo2Upload = (info) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }
    if (info.file.status === 'done') {
      setUploading(false);
      const reader = new FileReader();
      reader.readAsDataURL(info.file.originFileObj);
      reader.onload = () => {
        const base64Url = reader.result;
        localStorage.setItem('cmsSidebarLogo2Url', base64Url);
        setSidebarLogo2Url(base64Url);
        message.success('Sidebar Logo 2 uploaded successfully');
      };
    }
    if (info.file.status === 'error') {
      setUploading(false);
      message.error('Logo upload failed');
    }
  };

  const handleFaviconUpload = (info) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }
    if (info.file.status === 'done') {
      setUploading(false);
      const reader = new FileReader();
      reader.readAsDataURL(info.file.originFileObj);
      reader.onload = () => {
        const base64Url = reader.result;
        localStorage.setItem('cmsFaviconUrl', base64Url);
        setFaviconUrl(base64Url);
        // Update favicon in document
        updateFavicon(base64Url);
        message.success('Favicon uploaded successfully');
      };
    }
    if (info.file.status === 'error') {
      setUploading(false);
      message.error('Favicon upload failed');
    }
  };

  const updateFavicon = (url) => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = url;
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return false;
    }
    return true;
  };

  const handleRemoveSidebarLogo1 = () => {
    localStorage.removeItem('cmsSidebarLogo1Url');
    localStorage.removeItem('cmsLogoUrl');
    setSidebarLogo1Url('');
    message.success('Sidebar Logo 1 removed');
  };

  const handleRemoveSidebarLogo2 = () => {
    localStorage.removeItem('cmsSidebarLogo2Url');
    setSidebarLogo2Url('');
    message.success('Sidebar Logo 2 removed');
  };

  const handleRemoveFavicon = () => {
    localStorage.removeItem('cmsFaviconUrl');
    setFaviconUrl('');
    message.success('Favicon removed');
  };

  const handleSaveSiteName = () => {
    localStorage.setItem('cmsSiteName', siteName);
    message.success('Site name saved');
  };

  const sidebarLogo1UploadProps = {
    name: 'sidebarLogo1',
    customRequest: ({ onSuccess }) => {
      setTimeout(() => {
        onSuccess('ok');
      }, 1000);
    },
    beforeUpload,
    onChange: handleSidebarLogo1Upload,
    showUploadList: false,
  };

  const sidebarLogo2UploadProps = {
    name: 'sidebarLogo2',
    customRequest: ({ onSuccess }) => {
      setTimeout(() => {
        onSuccess('ok');
      }, 1000);
    },
    beforeUpload,
    onChange: handleSidebarLogo2Upload,
    showUploadList: false,
  };

  const faviconUploadProps = {
    name: 'favicon',
    customRequest: ({ onSuccess }) => {
      setTimeout(() => {
        onSuccess('ok');
      }, 1000);
    },
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return false;
      }
      const isLt500K = file.size / 1024 < 500;
      if (!isLt500K) {
        message.error('Favicon must be smaller than 500KB!');
        return false;
      }
      return true;
    },
    onChange: handleFaviconUpload,
    showUploadList: false,
  };

  return (
    <div style={{ padding: '24px', maxWidth: 800 }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        Settings
      </Title>

      <Card 
        title="Branding" 
        style={{ marginBottom: 24 }}
        extra={<PictureOutlined />}
      >
        <div style={{ marginBottom: 32 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Sidebar Logos
          </Text>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Upload two logos to display side by side in the sidebar. Recommended size: 70x40px each, max 2MB.
          </Text>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Combined preview */}
            {(sidebarLogo1Url || sidebarLogo2Url) && (
              <div style={{ 
                padding: 16, 
                border: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
                borderRadius: 8,
                background: darkMode ? '#1E293B' : '#F8FAFC',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 16
              }}>
                {sidebarLogo1Url && (
                  <img 
                    src={sidebarLogo1Url} 
                    alt="Sidebar Logo 1" 
                    style={{ 
                      height: 40, 
                      maxWidth: 70,
                      objectFit: 'contain' 
                    }} 
                  />
                )}
                {sidebarLogo2Url && (
                  <img 
                    src={sidebarLogo2Url} 
                    alt="Sidebar Logo 2" 
                    style={{ 
                      height: 60, 
                      maxWidth: 100,
                      objectFit: 'contain' 
                    }} 
                  />
                )}
              </div>
            )}

            {/* Logo 1 Upload */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Logo 1 (Left)
              </Text>
              <Space>
                <Upload {...sidebarLogo1UploadProps}>
                  <Button 
                    icon={<UploadOutlined />} 
                    loading={uploading}
                  >
                    {sidebarLogo1Url ? 'Change Logo 1' : 'Upload Logo 1'}
                  </Button>
                </Upload>

                {sidebarLogo1Url && (
                  <Button 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveSidebarLogo1}
                  >
                    Remove
                  </Button>
                )}
              </Space>
            </div>

            {/* Logo 2 Upload */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Logo 2 (Right)
              </Text>
              <Space>
                <Upload {...sidebarLogo2UploadProps}>
                  <Button 
                    icon={<UploadOutlined />} 
                    loading={uploading}
                  >
                    {sidebarLogo2Url ? 'Change Logo 2' : 'Upload Logo 2'}
                  </Button>
                </Upload>

                {sidebarLogo2Url && (
                  <Button 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveSidebarLogo2}
                  >
                    Remove
                  </Button>
                )}
              </Space>
            </div>
          </Space>
        </div>

        <Divider />

        <div style={{ marginBottom: 32 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Favicon
          </Text>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Upload a favicon for the browser tab. Recommended size: 32x32px or 16x16px, max 500KB.
          </Text>

          <Space direction="vertical" style={{ width: '100%' }}>
            {faviconUrl && (
              <div style={{ 
                padding: 16, 
                border: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
                borderRadius: 8,
                background: darkMode ? '#1E293B' : '#F8FAFC',
                display: 'inline-block'
              }}>
                <img 
                  src={faviconUrl} 
                  alt="Current Favicon" 
                  style={{ 
                    width: 32, 
                    height: 32,
                    objectFit: 'contain' 
                  }} 
                />
              </div>
            )}

            <Space>
              <Upload {...faviconUploadProps}>
                <Button 
                  icon={<UploadOutlined />} 
                  loading={uploading}
                >
                  {faviconUrl ? 'Change Favicon' : 'Upload Favicon'}
                </Button>
              </Upload>

              {faviconUrl && (
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={handleRemoveFavicon}
                >
                  Remove
                </Button>
              )}
            </Space>
          </Space>
        </div>

        <Divider />

        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Site Name
          </Text>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            The name displayed in the sidebar when no logo is uploaded.
          </Text>

          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Enter site name"
              style={{ flex: 1 }}
            />
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleSaveSiteName}
            >
              Save
            </Button>
          </Space.Compact>
        </div>
      </Card>

      <Card title="Appearance" extra={<PictureOutlined />}>
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Dark Mode
          </Text>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Toggle dark mode for the entire dashboard.
          </Text>
          <Switch 
            checked={darkMode}
            disabled
          />
          <Text type="secondary" style={{ marginLeft: 8 }}>
            (Use the toggle in the header)
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
