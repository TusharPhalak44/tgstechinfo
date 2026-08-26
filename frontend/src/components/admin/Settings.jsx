import React, { useState, useEffect } from 'react';
import { Card, Form, Upload, Button, message, Input, Tabs, ConfigProvider, Row, Col, Space, Tooltip } from 'antd';
import { UploadOutlined, DeleteOutlined, PictureOutlined, SaveOutlined, SettingOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import axios from 'axios';

const DEFAULT_LOGO_SIZES = {
  website_main_logo: { width: 200, height: 60 },
  website_navbar_logo: { width: 120, height: 40 },
  website_footer_logo: { width: 150, height: 50 },
  website_favicon: { width: 32, height: 32 },
  cms_logo1: { width: 180, height: 50 },
  cms_logo2: { width: 40, height: 40 },
  cms_favicon: { width: 32, height: 32 }
};

const deepEqualLogoSizes = (a, b) => {
  if (!a || !b) return false;
  return Object.keys(DEFAULT_LOGO_SIZES).every(k =>
    a[k]?.height === b[k]?.height && a[k]?.width === b[k]?.width
  );
};

/* ─────────────────────────────────────────────
   STYLING SYSTEM & ANIMATIONS (Dashboard Parity)
───────────────────────────────────────────── */
const settingsStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

  .set-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    animation: setFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes setFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .set-stagger-1 { animation: setSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .set-stagger-2 { animation: setSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.10s both; }
  .set-stagger-3 { animation: setSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }

  @keyframes setSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .set-beacon-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #06B6D4;
    position: relative;
    display: inline-block;
  }
  .set-beacon-dot::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 2px solid #06B6D4;
    animation: setPulse 2s ease-out infinite;
  }
  @keyframes setPulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .set-kpi-card {
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
  .set-kpi-card:hover {
    transform: translateY(-3px);
  }
`;

const Settings = () => {
  const { darkMode } = useTheme();
  const D = darkMode;
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
  const [logoSizes, setLogoSizes] = useState({ ...DEFAULT_LOGO_SIZES });
  const [originalLogoSizes, setOriginalLogoSizes] = useState({ ...DEFAULT_LOGO_SIZES });
  const [siteName, setSiteName] = useState('TgsTechInfo');
  const [siteDescription, setSiteDescription] = useState('');
  const [siteKeywords, setSiteKeywords] = useState('');
  const [pendingLogoUploads, setPendingLogoUploads] = useState({});

  const logoSizesChanged = !deepEqualLogoSizes(logoSizes, originalLogoSizes);

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
        
        let parsedLogoSizes = { ...DEFAULT_LOGO_SIZES };
        if (settings.logo_sizes) {
          try {
            const rawSizes = typeof settings.logo_sizes === 'string' 
              ? JSON.parse(settings.logo_sizes) 
              : settings.logo_sizes;
            if (rawSizes) {
              parsedLogoSizes = {
                website_main_logo: {
                  width: rawSizes.website_main_logo?.width || rawSizes.main?.width || 200,
                  height: rawSizes.website_main_logo?.height || rawSizes.main?.height || 60
                },
                website_navbar_logo: {
                  width: rawSizes.website_navbar_logo?.width || rawSizes.navbar?.width || 120,
                  height: rawSizes.website_navbar_logo?.height || rawSizes.navbar?.height || 40
                },
                website_footer_logo: {
                  width: rawSizes.website_footer_logo?.width || rawSizes.footer?.width || 150,
                  height: rawSizes.website_footer_logo?.height || rawSizes.footer?.height || 50
                },
                website_favicon: {
                  width: rawSizes.website_favicon?.width || 32,
                  height: rawSizes.website_favicon?.height || 32
                },
                cms_logo1: {
                  width: rawSizes.cms_logo1?.width || 180,
                  height: rawSizes.cms_logo1?.height || 50
                },
                cms_logo2: {
                  width: rawSizes.cms_logo2?.width || 40,
                  height: rawSizes.cms_logo2?.height || 40
                },
                cms_favicon: {
                  width: rawSizes.cms_favicon?.width || 32,
                  height: rawSizes.cms_favicon?.height || 32
                }
              };
            }
          } catch (e) {}
        }
        setLogoSizes(parsedLogoSizes);
        setOriginalLogoSizes(parsedLogoSizes);
        setSiteName(settings.site_name || 'TgsTechInfo');
        setSiteDescription(settings.site_description || '');
        setSiteKeywords(settings.site_keywords || '');
      }
    } catch (error) {
      message.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

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
      message.success('Image processed. Click "Save Branding Changes" to persist.');
    } catch (error) {
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
      
      if (updates.cms_logo1) setCmsLogo1Url(updates.cms_logo1);
      if (updates.cms_logo2) setCmsLogo2Url(updates.cms_logo2);
      if (updates.cms_favicon) setCmsFaviconUrl(updates.cms_favicon);
      if (updates.website_logo) setWebsiteLogoUrl(updates.website_logo);
      if (updates.website_favicon) setWebsiteFaviconUrl(updates.website_favicon);
      if (updates.website_main_logo) setWebsiteMainLogoUrl(updates.website_main_logo);
      if (updates.website_navbar_logo) setWebsiteNavbarLogoUrl(updates.website_navbar_logo);
      if (updates.website_footer_logo) setWebsiteFooterLogoUrl(updates.website_footer_logo);
      
      await axios.put('/api/site-settings', { logo_sizes: logoSizes });
      
      setPendingLogoUploads({});
      setOriginalLogoSizes(logoSizes);
      message.success('Logo & dimension changes saved successfully');
      await refreshSettings?.();
    } catch (error) {
      message.error('Failed to save branding changes');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = async (type) => {
    setLoading(true);
    try {
      await axios.put(`/api/site-settings/logo/${type}`, { imageData: '' });
      if (type === 'cms_logo1') setCmsLogo1Url('');
      if (type === 'cms_logo2') setCmsLogo2Url('');
      if (type === 'cms_favicon') setCmsFaviconUrl('');
      if (type === 'website_logo') setWebsiteLogoUrl('');
      if (type === 'website_favicon') setWebsiteFaviconUrl('');
      if (type === 'website_main_logo') setWebsiteMainLogoUrl('');
      if (type === 'website_navbar_logo') setWebsiteNavbarLogoUrl('');
      if (type === 'website_footer_logo') setWebsiteFooterLogoUrl('');
      message.success('Image removed successfully');
    } catch (error) {
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
      setOriginalLogoSizes(logoSizes);
      await fetchSettings();
      await refreshSettings?.();
    } catch (error) {
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

  const StatCard = ({ title, value, icon, color = 'primary', accentColor, subtitle }) => {
    const colorMap = {
      primary: { bg: D ? 'rgba(6, 182, 212, 0.12)' : 'rgba(6, 182, 212, 0.08)', text: '#06B6D4', border: 'rgba(6, 182, 212, 0.3)' },
      success: { bg: D ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
      info: { bg: D ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' },
    };
    const c = colorMap[color] || colorMap.primary;

    return (
      <div
        className="set-kpi-card"
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

  const renderLogoCard = (type, title, description) => {
    const preview = getLogoPreview(type);
    const sizeConfig = logoSizes[type] || DEFAULT_LOGO_SIZES[type] || { width: 100, height: 40 };

    return (
      <Card
        style={{
          borderRadius: 16,
          background: D ? 'rgba(15, 23, 42, 0.8)' : '#FFFFFF',
          border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
          boxShadow: D ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(11,31,77,0.05)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A' }}>{title}</h4>
            <p style={{ fontSize: '0.75rem', color: D ? '#64748B' : '#94A3B8', margin: '0 0 14px' }}>{description}</p>

            {/* Preview Box */}
            <div
              style={{
                height: 130,
                borderRadius: 12,
                background: D ? '#0F172A' : '#F1F5F9',
                border: `2px dashed ${D ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.8)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 12,
                marginBottom: 14,
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt={title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: D ? '#64748B' : '#94A3B8' }}>
                  <PictureOutlined style={{ fontSize: 28, display: 'block', marginBottom: 4 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>No Image Configured</span>
                </div>
              )}
            </div>

            {/* Individual Dimension Settings Control for this exact image */}
            <div
              style={{
                background: D ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC',
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: D ? '#94A3B8' : '#64748B' }}>
                  Asset Dimensions
                </span>
                <span style={{ fontSize: '0.7rem', color: '#06B6D4', fontWeight: 700 }}>
                  {sizeConfig.width} × {sizeConfig.height} px
                </span>
              </div>

              <Row gutter={8}>
                <Col span={12}>
                  <Input
                    addonBefore={<span style={{ fontSize: '0.68rem', fontWeight: 700 }}>W</span>}
                    type="number"
                    value={sizeConfig.width}
                    onChange={(e) => setLogoSizes(prev => ({
                      ...prev,
                      [type]: { ...(prev[type] || { width: 100, height: 40 }), width: Number(e.target.value) }
                    }))}
                    style={{ borderRadius: 6, fontSize: '0.8rem' }}
                  />
                </Col>
                <Col span={12}>
                  <Input
                    addonBefore={<span style={{ fontSize: '0.68rem', fontWeight: 700 }}>H</span>}
                    type="number"
                    value={sizeConfig.height}
                    onChange={(e) => setLogoSizes(prev => ({
                      ...prev,
                      [type]: { ...(prev[type] || { width: 100, height: 40 }), height: Number(e.target.value) }
                    }))}
                    style={{ borderRadius: 6, fontSize: '0.8rem' }}
                  />
                </Col>
              </Row>
            </div>
          </div>

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Upload {...createUploadProps(type)}>
              <Button icon={<UploadOutlined />} style={{ borderRadius: 8, fontWeight: 700 }}>
                Upload Image
              </Button>
            </Upload>
            {preview && (
              <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveImage(type)} style={{ borderRadius: 8 }} />
            )}
          </Space>
        </div>
      </Card>
    );
  };

  const hasPendingChanges = Object.keys(pendingLogoUploads).length > 0 || logoSizesChanged;

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
      <style>{settingsStyles}</style>

      <div className="set-root" style={{ padding: '24px 28px', background: D ? '#0A1229' : '#F8FAFC', minHeight: '100vh' }}>
        {/* ── COMMAND HEADER BANNER ── */}
        <div
          className="set-stagger-1"
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
              <span className="set-beacon-dot" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#06B6D4' }}>
                Platform Settings & Identity
              </span>
              <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>•</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B' }}>
                {siteName} CMS Brand Control
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
              <SettingOutlined style={{ color: '#06B6D4' }} /> Platform Branding & Individual Asset Dimensions
            </h1>
          </div>

          <Space size={10}>
            {hasPendingChanges && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveLogoChanges}
                loading={loading}
                style={{
                  background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  height: 42,
                  padding: '0 20px',
                }}
              >
                Save Branding & Dimensions
              </Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchSettings}
              style={{ borderRadius: 10, height: 42, background: D ? '#1E293B' : '#F1F5F9' }}
            />
          </Space>
        </div>

        {/* ── EXECUTIVE KPI GRID ── */}
        <div
          className="set-stagger-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard title="Active Main Brand Logo" value={websiteMainLogoUrl ? `${logoSizes.website_main_logo?.width || 200}×${logoSizes.website_main_logo?.height || 60}px` : 'Default'} icon={<PictureOutlined />} color="primary" accentColor="#06B6D4" subtitle="Front-facing Website Header" />
          <StatCard title="Navbar Logo Asset" value={websiteNavbarLogoUrl ? `${logoSizes.website_navbar_logo?.width || 120}×${logoSizes.website_navbar_logo?.height || 40}px` : 'Standard'} icon={<CheckCircleOutlined />} color="success" accentColor="#10B981" subtitle="Top Bar Dimensions" />
          <StatCard title="Footer Identity Logo" value={websiteFooterLogoUrl ? `${logoSizes.website_footer_logo?.width || 150}×${logoSizes.website_footer_logo?.height || 50}px` : 'Standard'} icon={<SettingOutlined />} color="info" accentColor="#3B82F6" subtitle="Bottom Bar Variant" />
        </div>

        {/* ── SETTINGS TABS ── */}
        <div
          className="set-stagger-3"
          style={{
            background: D ? 'rgba(15, 23, 42, 0.8)' : '#FFFFFF',
            borderRadius: 16,
            border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
            padding: 24,
            boxShadow: D ? '0 10px 30px -5px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(11, 31, 77, 0.05)',
          }}
        >
          <Tabs
            defaultActiveKey="logos"
            items={[
              {
                key: 'logos',
                label: <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Website Logos & Assets</span>,
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12} lg={6}>{renderLogoCard('website_main_logo', 'Main Header Logo', 'Primary high-res logo used in header hero banner')}</Col>
                    <Col xs={24} md={12} lg={6}>{renderLogoCard('website_navbar_logo', 'Navbar Logo', 'Compact version tailored for top navigation bar')}</Col>
                    <Col xs={24} md={12} lg={6}>{renderLogoCard('website_footer_logo', 'Footer Logo', 'Monochrome / light variant for website footer section')}</Col>
                    <Col xs={24} md={12} lg={6}>{renderLogoCard('website_favicon', 'Website Favicon', 'Browser tab icon (.ico or .png)')}</Col>
                  </Row>
                ),
              },
              {
                key: 'cms',
                label: <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>CMS Admin Branding</span>,
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>{renderLogoCard('cms_logo1', 'CMS Primary Logo', 'Sidebar brand logo for admin panel')}</Col>
                    <Col xs={24} md={8}>{renderLogoCard('cms_logo2', 'CMS Compact Icon', 'Collapsed sidebar icon for dashboard')}</Col>
                    <Col xs={24} md={8}>{renderLogoCard('cms_favicon', 'CMS Favicon', 'Browser tab favicon for admin workspace')}</Col>
                  </Row>
                ),
              },
              {
                key: 'sizes',
                label: <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>All Asset Dimensions Matrix</span>,
                children: (
                  <div style={{ maxWidth: 800 }}>
                    <p style={{ fontSize: '0.82rem', color: D ? '#94A3B8' : '#64748B', marginBottom: 16 }}>
                      Configure the exact width and height specifications for every image asset rendered across the platform.
                    </p>
                    <Form layout="vertical">
                      <Row gutter={[16, 16]}>
                        {[
                          { key: 'website_main_logo', name: 'Website Main Header Logo' },
                          { key: 'website_navbar_logo', name: 'Website Navbar Logo' },
                          { key: 'website_footer_logo', name: 'Website Footer Logo' },
                          { key: 'website_favicon', name: 'Website Favicon' },
                          { key: 'cms_logo1', name: 'CMS Sidebar Primary Logo' },
                          { key: 'cms_logo2', name: 'CMS Sidebar Icon' },
                          { key: 'cms_favicon', name: 'CMS Favicon' },
                        ].map(item => (
                          <Col xs={24} sm={12} key={item.key}>
                            <div style={{ background: D ? '#0F172A' : '#F8FAFC', padding: 14, borderRadius: 10, border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}` }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A', display: 'block', marginBottom: 8 }}>
                                {item.name}
                              </span>
                              <Row gutter={8}>
                                <Col span={12}>
                                  <Form.Item label={<span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Width (px)</span>} style={{ marginBottom: 0 }}>
                                    <Input
                                      type="number"
                                      value={logoSizes[item.key]?.width || DEFAULT_LOGO_SIZES[item.key]?.width}
                                      onChange={(e) => setLogoSizes({
                                        ...logoSizes,
                                        [item.key]: { ...(logoSizes[item.key] || DEFAULT_LOGO_SIZES[item.key]), width: Number(e.target.value) }
                                      })}
                                      style={{ borderRadius: 8 }}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item label={<span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Height (px)</span>} style={{ marginBottom: 0 }}>
                                    <Input
                                      type="number"
                                      value={logoSizes[item.key]?.height || DEFAULT_LOGO_SIZES[item.key]?.height}
                                      onChange={(e) => setLogoSizes({
                                        ...logoSizes,
                                        [item.key]: { ...(logoSizes[item.key] || DEFAULT_LOGO_SIZES[item.key]), height: Number(e.target.value) }
                                      })}
                                      style={{ borderRadius: 8 }}
                                    />
                                  </Form.Item>
                                </Col>
                              </Row>
                            </div>
                          </Col>
                        ))}
                      </Row>

                      <div style={{ marginTop: 20 }}>
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          onClick={handleSaveSettings}
                          loading={loading}
                          style={{
                            background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 700,
                            height: 40,
                          }}
                        >
                          Save All Dimensions Matrix
                        </Button>
                      </div>
                    </Form>
                  </div>
                ),
              },
              {
                key: 'general',
                label: <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>General Information</span>,
                children: (
                  <div style={{ maxWidth: 640 }}>
                    <Form layout="vertical">
                      <Form.Item label={<span style={{ fontWeight: 700 }}>Website Name</span>}>
                        <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} style={{ borderRadius: 8, height: 40 }} />
                      </Form.Item>
                      <Form.Item label={<span style={{ fontWeight: 700 }}>Site Description</span>}>
                        <Input.TextArea rows={3} value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} style={{ borderRadius: 8 }} />
                      </Form.Item>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSaveSettings}
                        loading={loading}
                        style={{
                          background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 700,
                        }}
                      >
                        Save General Info
                      </Button>
                    </Form>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default Settings;
