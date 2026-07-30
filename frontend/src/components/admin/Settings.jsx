import React, { useState, useEffect } from 'react';
import { Card, Form, Upload, Button, message, Typography, Space, Divider, Input, Switch, Tabs } from 'antd';
import { UploadOutlined, DeleteOutlined, PictureOutlined, SaveOutlined } from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';

const { Title, Text } = Typography;

const Settings = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [cmsLogo1Url, setCmsLogo1Url] = useState('');
  const [cmsLogo2Url, setCmsLogo2Url] = useState('');
  const [cmsFaviconUrl, setCmsFaviconUrl] = useState('');
  const [websiteLogoUrl, setWebsiteLogoUrl] = useState('');
  const [websiteFaviconUrl, setWebsiteFaviconUrl] = useState('');
  const [siteName, setSiteName] = useState('TgsTechInfo');
  const [siteDescription, setSiteDescription] = useState('');
  const [siteKeywords, setSiteKeywords] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/site-settings');
      const settings = response.data.settings;
      if (settings) {
        setCmsLogo1Url(settings.cms_logo1 || '');
        setCmsLogo2Url(settings.cms_logo2 || '');
        setCmsFaviconUrl(settings.cms_favicon || '');
        setWebsiteLogoUrl(settings.website_logo || '');
        setWebsiteFaviconUrl(settings.website_favicon || '');
        setSiteName(settings.site_name || 'TgsTechInfo');
        setSiteDescription(settings.site_description || '');
        setSiteKeywords(settings.site_keywords || '');
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
      message.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file, type) => {
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Url = reader.result;
        await axios.put(`/api/site-settings/logo/${type}`, { imageData: base64Url });
        
        // Update local state
        switch (type) {
          case 'cms_logo1':
            setCmsLogo1Url(base64Url);
            break;
          case 'cms_logo2':
            setCmsLogo2Url(base64Url);
            break;
          case 'cms_favicon':
            setCmsFaviconUrl(base64Url);
            updateFavicon(base64Url);
            break;
          case 'website_logo':
            setWebsiteLogoUrl(base64Url);
            break;
          case 'website_favicon':
            setWebsiteFaviconUrl(base64Url);
            break;
        }
        message.success('Image uploaded successfully');
      };
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Failed to upload image');
    } finally {
      setLoading(false);
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

  const handleRemoveImage = async (type) => {
    setLoading(true);
    try {
      await axios.put(`/api/site-settings/logo/${type}`, { imageData: '' });
      
      switch (type) {
        case 'cms_logo1':
          setCmsLogo1Url('');
          break;
        case 'cms_logo2':
          setCmsLogo2Url('');
          break;
        case 'cms_favicon':
          setCmsFaviconUrl('');
          break;
        case 'website_logo':
          setWebsiteLogoUrl('');
          break;
        case 'website_favicon':
          setWebsiteFaviconUrl('');
          break;
      }
      message.success('Image removed successfully');
    } catch (error) {
      console.error('Remove error:', error);
      message.error('Failed to remove image');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await axios.put('/api/site-settings', {
        site_name: siteName,
        site_description: siteDescription,
        site_keywords: siteKeywords
      });
      message.success('Settings saved successfully');
    } catch (error) {
      console.error('Save settings error:', error);
      message.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const createUploadProps = (type) => ({
    customRequest: ({ file, onSuccess }) => {
      handleImageUpload(file, type);
      setTimeout(() => onSuccess('ok'), 100);
    },
    beforeUpload,
    showUploadList: false,
  });

  return (
    <div style={{ padding: '24px', maxWidth: 1200 }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        Site Settings
      </Title>

      <Tabs
        defaultActiveKey="cms"
        items={[
          {
            key: 'cms',
            label: 'CMS Settings',
            children: (
              <Card
                title="CMS Branding"
                extra={<PictureOutlined />}
                style={{ marginBottom: 24 }}
              >
                <div style={{ marginBottom: 32 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    CMS Logos
                  </Text>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Upload logos for the CMS sidebar. Recommended size: 70x40px each, max 2MB.
                  </Text>

                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {(cmsLogo1Url || cmsLogo2Url) && (
                      <div style={{
                        padding: 16,
                        border: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
                        borderRadius: 8,
                        background: darkMode ? '#1E293B' : '#F8FAFC',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 16
                      }}>
                        {cmsLogo1Url && (
                          <img
                            src={cmsLogo1Url}
                            alt="CMS Logo 1"
                            style={{
                              height: 40,
                              maxWidth: 70,
                              objectFit: 'contain'
                            }}
                          />
                        )}
                        {cmsLogo2Url && (
                          <img
                            src={cmsLogo2Url}
                            alt="CMS Logo 2"
                            style={{
                              height: 60,
                              maxWidth: 100,
                              objectFit: 'contain'
                            }}
                          />
                        )}
                      </div>
                    )}

                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Logo 1 (Left)
                      </Text>
                      <Space>
                        <Upload {...createUploadProps('cms_logo1')}>
                          <Button icon={<UploadOutlined />} loading={loading}>
                            {cmsLogo1Url ? 'Change Logo 1' : 'Upload Logo 1'}
                          </Button>
                        </Upload>
                        {cmsLogo1Url && (
                          <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveImage('cms_logo1')}>
                            Remove
                          </Button>
                        )}
                      </Space>
                    </div>

                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Logo 2 (Right)
                      </Text>
                      <Space>
                        <Upload {...createUploadProps('cms_logo2')}>
                          <Button icon={<UploadOutlined />} loading={loading}>
                            {cmsLogo2Url ? 'Change Logo 2' : 'Upload Logo 2'}
                          </Button>
                        </Upload>
                        {cmsLogo2Url && (
                          <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveImage('cms_logo2')}>
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
                    CMS Favicon
                  </Text>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Upload a favicon for the CMS browser tab. Recommended size: 32x32px, max 500KB.
                  </Text>

                  <Space direction="vertical" style={{ width: '100%' }}>
                    {cmsFaviconUrl && (
                      <div style={{
                        padding: 16,
                        border: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
                        borderRadius: 8,
                        background: darkMode ? '#1E293B' : '#F8FAFC',
                        display: 'inline-block'
                      }}>
                        <img
                          src={cmsFaviconUrl}
                          alt="CMS Favicon"
                          style={{
                            width: 32,
                            height: 32,
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                    )}

                    <Space>
                      <Upload {...createUploadProps('cms_favicon')}>
                        <Button icon={<UploadOutlined />} loading={loading}>
                          {cmsFaviconUrl ? 'Change Favicon' : 'Upload Favicon'}
                        </Button>
                      </Upload>
                      {cmsFaviconUrl && (
                        <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveImage('cms_favicon')}>
                          Remove
                        </Button>
                      )}
                    </Space>
                  </Space>
                </div>
              </Card>
            )
          },
          {
            key: 'website',
            label: 'Website Settings',
            children: (
              <Card
                title="Website Branding"
                extra={<PictureOutlined />}
                style={{ marginBottom: 24 }}
              >
                <div style={{ marginBottom: 32 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Website Logo
                  </Text>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Upload the main logo for your website. Recommended size: 200x60px, max 2MB.
                  </Text>

                  <Space direction="vertical" style={{ width: '100%' }}>
                    {websiteLogoUrl && (
                      <div style={{
                        padding: 16,
                        border: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
                        borderRadius: 8,
                        background: darkMode ? '#1E293B' : '#F8FAFC',
                        display: 'inline-block'
                      }}>
                        <img
                          src={websiteLogoUrl}
                          alt="Website Logo"
                          style={{
                            maxHeight: 60,
                            maxWidth: 200,
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                    )}

                    <Space>
                      <Upload {...createUploadProps('website_logo')}>
                        <Button icon={<UploadOutlined />} loading={loading}>
                          {websiteLogoUrl ? 'Change Logo' : 'Upload Logo'}
                        </Button>
                      </Upload>
                      {websiteLogoUrl && (
                        <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveImage('website_logo')}>
                          Remove
                        </Button>
                      )}
                    </Space>
                  </Space>
                </div>

                <Divider />

                <div style={{ marginBottom: 32 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Website Favicon
                  </Text>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Upload a favicon for the website browser tab. Recommended size: 32x32px, max 500KB.
                  </Text>

                  <Space direction="vertical" style={{ width: '100%' }}>
                    {websiteFaviconUrl && (
                      <div style={{
                        padding: 16,
                        border: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
                        borderRadius: 8,
                        background: darkMode ? '#1E293B' : '#F8FAFC',
                        display: 'inline-block'
                      }}>
                        <img
                          src={websiteFaviconUrl}
                          alt="Website Favicon"
                          style={{
                            width: 32,
                            height: 32,
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                    )}

                    <Space>
                      <Upload {...createUploadProps('website_favicon')}>
                        <Button icon={<UploadOutlined />} loading={loading}>
                          {websiteFaviconUrl ? 'Change Favicon' : 'Upload Favicon'}
                        </Button>
                      </Upload>
                      {websiteFaviconUrl && (
                        <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveImage('website_favicon')}>
                          Remove
                        </Button>
                      )}
                    </Space>
                  </Space>
                </div>
              </Card>
            )
          },
          {
            key: 'general',
            label: 'General Settings',
            children: (
              <Card
                title="Site Information"
                extra={<PictureOutlined />}
              >
                <div style={{ marginBottom: 24 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Site Name
                  </Text>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    The name of your site displayed throughout the application.
                  </Text>
                  <Input
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Enter site name"
                    style={{ marginBottom: 16 }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Site Description
                  </Text>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    A brief description of your site for SEO and metadata.
                  </Text>
                  <Input.TextArea
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    placeholder="Enter site description"
                    rows={4}
                    style={{ marginBottom: 16 }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Site Keywords
                  </Text>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Comma-separated keywords for SEO (e.g., tech, news, blog).
                  </Text>
                  <Input
                    value={siteKeywords}
                    onChange={(e) => setSiteKeywords(e.target.value)}
                    placeholder="Enter keywords separated by commas"
                    style={{ marginBottom: 16 }}
                  />
                </div>

                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveSettings} loading={loading}>
                  Save Settings
                </Button>
              </Card>
            )
          }
        ]}
      />
    </div>
  );
};

export default Settings;
