import React, { useState, useEffect } from 'react';
import { Card, Form, Upload, Button, message, Typography, Space, Divider, Input, Switch, Tabs } from 'antd';
import { UploadOutlined, DeleteOutlined, PictureOutlined, SaveOutlined } from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import axios from 'axios';

const { Title, Text } = Typography;

const Settings = () => {
  const { darkMode } = useTheme();
  const { refreshSettings } = useSiteSettings();
  const [loading, setLoading] = useState(false);
  const [cmsLogo1Url, setCmsLogo1Url] = useState('');
  const [cmsLogo2Url, setCmsLogo2Url] = useState('');
  const [cmsFaviconUrl, setCmsFaviconUrl] = useState('');
  const [websiteLogoUrl, setWebsiteLogoUrl] = useState('');
  const [websiteFaviconUrl, setWebsiteFaviconUrl] = useState('');
  const [websiteMainLogoUrl, setWebsiteMainLogoUrl] = useState('');
  const [websiteNavbarLogoUrl, setWebsiteNavbarLogoUrl] = useState('');
  const [websiteFooterLogoUrl, setWebsiteFooterLogoUrl] = useState('');
  const [logoSizes, setLogoSizes] = useState({ main: { height: 60, width: 200 }, navbar: { height: 40, width: 120 }, footer: { height: 50, width: 150 } });
  const [siteName, setSiteName] = useState('TgsTechInfo');
  const [siteDescription, setSiteDescription] = useState('');
  const [siteKeywords, setSiteKeywords] = useState('');
  const [pendingLogoUploads, setPendingLogoUploads] = useState({});

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
        setWebsiteMainLogoUrl(settings.website_main_logo || '');
        setWebsiteNavbarLogoUrl(settings.website_navbar_logo || '');
        setWebsiteFooterLogoUrl(settings.website_footer_logo || '');
        let parsedLogoSizes = { 
          main: { height: 60, width: 200 }, 
          navbar: { height: 40, width: 120 }, 
          footer: { height: 50, width: 150 } 
        };
        if (settings.logo_sizes) {
          try {
            const rawSizes = typeof settings.logo_sizes === 'string' 
              ? JSON.parse(settings.logo_sizes) 
              : settings.logo_sizes;
            if (rawSizes) {
              parsedLogoSizes = {
                main: { 
                  height: (rawSizes.main && rawSizes.main.height) || 60, 
                  width: (rawSizes.main && rawSizes.main.width) || 200 
                },
                navbar: { 
                  height: (rawSizes.navbar && rawSizes.navbar.height) || 40, 
                  width: (rawSizes.navbar && rawSizes.navbar.width) || 120 
                },
                footer: { 
                  height: (rawSizes.footer && rawSizes.footer.height) || 50, 
                  width: (rawSizes.footer && rawSizes.footer.width) || 150 
                }
              };
            }
          } catch (e) {
            console.error('Error parsing logo sizes:', e);
          }
        }
        setLogoSizes(parsedLogoSizes);
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

  // Compress image to max 400px wide at 75% quality before storing as base64.
  // This keeps logo data well under MySQL's max_allowed_packet limit on hosted servers.
  const compressImageToBase64 = (file, maxWidth = 400, quality = 0.75) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          // Use image/png for images with transparency, else jpeg for smaller size
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          resolve(canvas.toDataURL(mimeType, quality));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageUpload = async (file, type) => {
    try {
      const compressed = await compressImageToBase64(file);
      setPendingLogoUploads(prev => ({ ...prev, [type]: compressed }));
      message.success('Image ready to save. Click "Save Changes" to apply.');
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Failed to process image');
    }
  };

  const handleSaveLogoChanges = async () => {
    setLoading(true);
    try {
      const updates = {};
      
      for (const [type, base64Url] of Object.entries(pendingLogoUploads)) {
        await axios.put(`/api/site-settings/logo/${type}`, { imageData: base64Url });
        updates[type] = base64Url;
      }
      
      // Update local state after successful save
      if (updates.cms_logo1) setCmsLogo1Url(updates.cms_logo1);
      if (updates.cms_logo2) setCmsLogo2Url(updates.cms_logo2);
      if (updates.cms_favicon) {
        setCmsFaviconUrl(updates.cms_favicon);
        updateFavicon(updates.cms_favicon);
      }
      if (updates.website_logo) setWebsiteLogoUrl(updates.website_logo);
      if (updates.website_favicon) setWebsiteFaviconUrl(updates.website_favicon);
      if (updates.website_main_logo) setWebsiteMainLogoUrl(updates.website_main_logo);
      if (updates.website_navbar_logo) setWebsiteNavbarLogoUrl(updates.website_navbar_logo);
      if (updates.website_footer_logo) setWebsiteFooterLogoUrl(updates.website_footer_logo);
      
      // Save logo sizes
      await axios.put('/api/site-settings', { logo_sizes: logoSizes });
      
      setPendingLogoUploads({});
      message.success('Logo changes saved successfully');
      await refreshSettings?.();
    } catch (error) {
      console.error('Save error:', error);
      message.error('Failed to save logo changes');
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
        case 'website_main_logo':
          setWebsiteMainLogoUrl('');
          break;
        case 'website_navbar_logo':
          setWebsiteNavbarLogoUrl('');
          break;
        case 'website_footer_logo':
          setWebsiteFooterLogoUrl('');
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
        site_keywords: siteKeywords,
        logo_sizes: logoSizes
      });
      message.success('Settings saved successfully');
      // Refresh settings to get updated data
      await fetchSettings();
      await refreshSettings?.();
    } catch (error) {
      console.error('Save settings error:', error);
      message.error(error.response?.data?.message || 'Failed to save settings');
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

  const getLogoPreview = (type) => {
    return pendingLogoUploads[type] || (
      type === 'cms_logo1' ? cmsLogo1Url :
      type === 'cms_logo2' ? cmsLogo2Url :
      type === 'cms_favicon' ? cmsFaviconUrl :
      type === 'website_logo' ? websiteLogoUrl :
      type === 'website_favicon' ? websiteFaviconUrl :
      type === 'website_main_logo' ? websiteMainLogoUrl :
      type === 'website_navbar_logo' ? websiteNavbarLogoUrl :
      type === 'website_footer_logo' ? websiteFooterLogoUrl :
      ''
    );
  };

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
                    {(getLogoPreview('cms_logo1') || getLogoPreview('cms_logo2')) && (
                      <div style={{
                        padding: 16,
                        border: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
                        borderRadius: 8,
                        background: darkMode ? '#1E293B' : '#F8FAFC',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 16
                      }}>
                        {getLogoPreview('cms_logo1') && (
                          <img
                            src={getLogoPreview('cms_logo1')}
                            alt="CMS Logo 1"
                            style={{
                              height: 40,
                              maxWidth: 70,
                              objectFit: 'contain'
                            }}
                          />
                        )}
                        {getLogoPreview('cms_logo2') && (
                          <img
                            src={getLogoPreview('cms_logo2')}
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

                {Object.keys(pendingLogoUploads).length > 0 && (
                  <>
                    <Divider />
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveLogoChanges} loading={loading} style={{ marginTop: 16 }}>
                      Save Logo Changes
                    </Button>
                  </>
                )}
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
                    Website Main Logo
                  </Text>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Upload the main logo for your website. Recommended size: 200x60px, max 2MB.
                  </Text>

                  <Space direction="vertical" style={{ width: '100%' }}>
                    {getLogoPreview('website_main_logo') && (
                      <div style={{
                        padding: 16,
                        border: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
                        borderRadius: 8,
                        background: darkMode ? '#1E293B' : '#F8FAFC',
                        display: 'inline-block'
                      }}>
                        <img
                          src={getLogoPreview('website_main_logo')}
                          alt="Website Main Logo"
                          style={{
                            maxHeight: logoSizes.main.height,
                            maxWidth: logoSizes.main.width,
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                    )}

                    <Space>
                      <Upload {...createUploadProps('website_main_logo')}>
                        <Button icon={<UploadOutlined />} loading={loading}>
                          {websiteMainLogoUrl ? 'Change Main Logo' : 'Upload Main Logo'}
                        </Button>
                      </Upload>
                      {websiteMainLogoUrl && (
                        <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveImage('website_main_logo')}>
                          Remove
                        </Button>
                      )}
                    </Space>

                    <div style={{ marginTop: 16 }}>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Logo Size
                      </Text>
                      <Space>
                        <Input
                          type="number"
                          placeholder="Height"
                          value={logoSizes.main.height}
                          onChange={(e) => setLogoSizes(prev => ({ ...prev, main: { ...prev.main, height: parseInt(e.target.value) || 60 } }))}
                          style={{ width: 100 }}
                          addonAfter="px"
                        />
                        <Input
                          type="number"
                          placeholder="Width"
                          value={logoSizes.main.width}
                          onChange={(e) => setLogoSizes(prev => ({ ...prev, main: { ...prev.main, width: parseInt(e.target.value) || 200 } }))}
                          style={{ width: 100 }}
                          addonAfter="px"
                        />
                      </Space>
                    </div>
                  </Space>
                </div>

                <Divider />

                <div style={{ marginBottom: 32 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Website Navbar Logo
                  </Text>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Upload the logo for your website navbar. Recommended size: 120x40px, max 2MB.
                  </Text>

                  <Space direction="vertical" style={{ width: '100%' }}>
                    {getLogoPreview('website_navbar_logo') && (
                      <div style={{
                        padding: 16,
                        border: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
                        borderRadius: 8,
                        background: darkMode ? '#1E293B' : '#F8FAFC',
                        display: 'inline-block'
                      }}>
                        <img
                          src={getLogoPreview('website_navbar_logo')}
                          alt="Website Navbar Logo"
                          style={{
                            maxHeight: logoSizes.navbar.height,
                            maxWidth: logoSizes.navbar.width,
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                    )}

                    <Space>
                      <Upload {...createUploadProps('website_navbar_logo')}>
                        <Button icon={<UploadOutlined />} loading={loading}>
                          {websiteNavbarLogoUrl ? 'Change Navbar Logo' : 'Upload Navbar Logo'}
                        </Button>
                      </Upload>
                      {websiteNavbarLogoUrl && (
                        <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveImage('website_navbar_logo')}>
                          Remove
                        </Button>
                      )}
                    </Space>

                    <div style={{ marginTop: 16 }}>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Logo Size
                      </Text>
                      <Space>
                        <Input
                          type="number"
                          placeholder="Height"
                          value={logoSizes.navbar.height}
                          onChange={(e) => setLogoSizes(prev => ({ ...prev, navbar: { ...prev.navbar, height: parseInt(e.target.value) || 40 } }))}
                          style={{ width: 100 }}
                          addonAfter="px"
                        />
                        <Input
                          type="number"
                          placeholder="Width"
                          value={logoSizes.navbar.width}
                          onChange={(e) => setLogoSizes(prev => ({ ...prev, navbar: { ...prev.navbar, width: parseInt(e.target.value) || 120 } }))}
                          style={{ width: 100 }}
                          addonAfter="px"
                        />
                      </Space>
                    </div>
                  </Space>
                </div>

                <Divider />

                <div style={{ marginBottom: 32 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Website Footer Logo
                  </Text>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Upload the logo for your website footer. Recommended size: 150x50px, max 2MB.
                  </Text>

                  <Space direction="vertical" style={{ width: '100%' }}>
                    {getLogoPreview('website_footer_logo') && (
                      <div style={{
                        padding: 16,
                        border: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
                        borderRadius: 8,
                        background: darkMode ? '#1E293B' : '#F8FAFC',
                        display: 'inline-block'
                      }}>
                        <img
                          src={getLogoPreview('website_footer_logo')}
                          alt="Website Footer Logo"
                          style={{
                            maxHeight: logoSizes.footer.height,
                            maxWidth: logoSizes.footer.width,
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                    )}

                    <Space>
                      <Upload {...createUploadProps('website_footer_logo')}>
                        <Button icon={<UploadOutlined />} loading={loading}>
                          {websiteFooterLogoUrl ? 'Change Footer Logo' : 'Upload Footer Logo'}
                        </Button>
                      </Upload>
                      {websiteFooterLogoUrl && (
                        <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveImage('website_footer_logo')}>
                          Remove
                        </Button>
                      )}
                    </Space>

                    <div style={{ marginTop: 16 }}>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Logo Size
                      </Text>
                      <Space>
                        <Input
                          type="number"
                          placeholder="Height"
                          value={logoSizes.footer.height}
                          onChange={(e) => setLogoSizes(prev => ({ ...prev, footer: { ...prev.footer, height: parseInt(e.target.value) || 50 } }))}
                          style={{ width: 100 }}
                          addonAfter="px"
                        />
                        <Input
                          type="number"
                          placeholder="Width"
                          value={logoSizes.footer.width}
                          onChange={(e) => setLogoSizes(prev => ({ ...prev, footer: { ...prev.footer, width: parseInt(e.target.value) || 150 } }))}
                          style={{ width: 100 }}
                          addonAfter="px"
                        />
                      </Space>
                    </div>
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

                {Object.keys(pendingLogoUploads).length > 0 && (
                  <>
                    <Divider />
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveLogoChanges} loading={loading} style={{ marginTop: 16 }}>
                      Save Logo Changes
                    </Button>
                  </>
                )}
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
