// UserDashboardLayout.jsx - Enterprise Parity with Admin Dashboard
import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Badge, Tooltip, Popover, Tag } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  EditOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SearchOutlined,
  BellOutlined,
  PlusOutlined,
  MoonOutlined,
  SunOutlined,
  AppstoreOutlined,
  CloseOutlined,
  LineChartOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  RocketOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FolderOpenOutlined,
  CrownOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { notificationApi } from '../../services/notificationApi';
import axios from 'axios';

const { Header, Sider, Content } = Layout;

/* ─────────────────────────────────────────────
   INJECTED CSS — User Panel Enterprise Design System
───────────────────────────────────────────── */
const layoutStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .user-root-shell {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif !important;
  }

  /* ─── SIDEBAR SHELL ─── */
  .user-enterprise-sidebar {
    transition: width 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
  }

  .user-enterprise-sidebar .ant-menu {
    background: transparent !important;
    border-inline-end: none !important;
  }

  /* Section group titles with distinct corporate tones */
  .user-enterprise-sidebar .ant-menu-item-group-title {
    font-size: 0.64rem !important;
    font-weight: 800 !important;
    letter-spacing: 0.12em !important;
    color: #64748B !important;
    padding: 16px 20px 6px !important;
    text-transform: uppercase !important;
    line-height: 1.2 !important;
    user-select: none;
  }

  /* Individual nav items */
  .user-enterprise-sidebar .ant-menu-item {
    border-radius: 10px !important;
    margin: 3px 12px !important;
    width: calc(100% - 24px) !important;
    font-weight: 600 !important;
    font-size: 0.825rem !important;
    height: 40px !important;
    line-height: 40px !important;
    display: flex !important;
    align-items: center !important;
    transition: all 0.18s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
  }

  /* Light mode hover & active */
  .user-light-side .ant-menu-item:hover {
    background: rgba(11, 31, 77, 0.05) !important;
    color: #0B1F4D !important;
  }
  .user-light-side .ant-menu-item-selected {
    background: linear-gradient(135deg, rgba(11, 31, 77, 0.08) 0%, rgba(247, 148, 29, 0.06) 100%) !important;
    color: #0B1F4D !important;
    font-weight: 700 !important;
    border-left: 3.5px solid #F7941D !important;
    padding-left: calc(var(--ant-menu-inline-indent, 24px) - 3.5px) !important;
    box-shadow: inset 0 0 0 1px rgba(247, 148, 29, 0.15) !important;
  }

  /* Dark mode hover & active */
  .user-dark-side .ant-menu-item:hover {
    background: rgba(59, 130, 246, 0.1) !important;
    color: #60A5FA !important;
  }
  .user-dark-side .ant-menu-item-selected {
    background: linear-gradient(135deg, rgba(11, 31, 77, 0.45) 0%, rgba(247, 148, 29, 0.12) 100%) !important;
    color: #F7941D !important;
    font-weight: 700 !important;
    border-left: 3.5px solid #F7941D !important;
    box-shadow: inset 0 0 12px rgba(247, 148, 29, 0.08), 0 0 0 1px rgba(247, 148, 29, 0.2) !important;
  }

  /* Icon color styling */
  .user-enterprise-sidebar .ant-menu-item .anticon {
    font-size: 15px !important;
    transition: transform 0.18s ease !important;
  }
  .user-enterprise-sidebar .ant-menu-item:hover .anticon {
    transform: scale(1.1);
  }

  /* ─── LOGO ZONE ─── */
  .user-logo-zone {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 18px;
    flex-shrink: 0;
  }
  .user-logo-mark {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #0B1F4D 0%, #1D3D8F 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 800;
    color: #F7941D;
    letter-spacing: -0.03em;
    flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(11, 31, 77, 0.25);
    cursor: pointer;
    border: 1px solid rgba(247, 148, 29, 0.3);
    transition: transform 0.2s;
  }
  .user-logo-mark:hover { transform: scale(1.05); }

  /* ─── TOP HEADER ─── */
  .user-top-header {
    position: fixed !important;
    top: 0;
    right: 0;
    height: 64px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 0 28px !important;
    z-index: 1000;
    overflow: visible !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    transition: left 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
    line-height: 1 !important;
  }

  /* ─── FORMAL SEARCH PILL ─── */
  .user-search-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 10px;
    padding: 0 12px;
    height: 36px;
    width: 250px;
    cursor: text;
    transition: all 0.22s ease;
  }
  .user-search-pill:focus-within {
    width: 320px;
    border-color: #2563EB !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
  }
  .user-search-input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.82rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    width: 100%;
    min-width: 0;
  }
  .user-kbd-badge {
    font-size: 0.62rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 6px;
    white-space: nowrap;
    line-height: 1.4;
    flex-shrink: 0;
  }

  /* ─── LIVE STATUS PILL (EMERALD HEALTH) ─── */
  .user-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 100px;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    white-space: nowrap;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.25);
    color: #059669;
  }
  .dark-status-pill {
    color: #10B981 !important;
    background: rgba(16, 185, 129, 0.15) !important;
    border-color: rgba(16, 185, 129, 0.3) !important;
  }
  .user-beacon {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10B981;
    box-shadow: 0 0 8px #10B981;
    animation: beaconPulse 1.8s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes beaconPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.35; }
  }

  /* ─── PRIMARY CREATE CTA (CORPORATE NAVY + AMBER FLAME) ─── */
  .user-create-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #0B1F4D 0%, #1D3D8F 100%);
    border: 1px solid rgba(247, 148, 29, 0.35);
    border-radius: 10px;
    color: #FFFFFF;
    font-weight: 700;
    font-size: 0.8rem;
    padding: 0 15px;
    height: 36px;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(11, 31, 77, 0.2);
    transition: all 0.2s ease;
    white-space: nowrap;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .user-create-btn:hover {
    transform: translateY(-1px);
    background: linear-gradient(135deg, #1D3D8F 0%, #0B1F4D 50%, #F7941D 200%);
    box-shadow: 0 6px 18px rgba(11, 31, 77, 0.35), 0 0 0 1.5px rgba(247, 148, 29, 0.35);
    color: #FFFFFF;
  }
  .user-create-btn:active { transform: translateY(0); }

  /* ─── ACTION ICON BUTTONS ─── */
  .user-icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    transition: all 0.18s;
    flex-shrink: 0;
    font-family: inherit;
  }

  /* ─── NOTIFICATION PANEL ─── */
  .user-notif-panel {
    width: 320px;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(11, 31, 77, 0.15);
  }
  .user-notif-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px 10px;
    border-bottom: 1px solid;
  }
  .user-notif-item {
    padding: 12px 16px;
    border-bottom: 1px solid;
    transition: background 0.15s;
  }
  .user-notif-item:last-child { border-bottom: none; }

  /* ─── USER PROFILE CHIP ─── */
  .user-chip {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 4px 10px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.18s;
  }

  /* ─── SCROLLBAR ─── */
  .user-scroll::-webkit-scrollbar { width: 5px; }
  .user-scroll::-webkit-scrollbar-track { background: transparent; }
  .user-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.35); border-radius: 4px; }
  .user-scroll::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.6); }

  /* ─── MOBILE OVERLAY ─── */
  .user-mobile-overlay {
    position: fixed;
    inset: 0;
    background: rgba(11, 31, 77, 0.5);
    backdrop-filter: blur(4px);
    z-index: 998;
    animation: fadeInOverlay 0.2s ease;
  }
  @keyframes fadeInOverlay {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

/* ── Menu Item Builder Helper ── */
const navItem = (key, icon, label, badge, badgeColor = '#2563EB') => ({
  key,
  icon,
  label: badge ? (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <span>{label}</span>
      <span style={{
        background: badgeColor,
        color: '#FFFFFF',
        fontSize: '0.62rem',
        fontWeight: 800,
        padding: '1px 7px',
        borderRadius: 20,
        minWidth: 18,
        textAlign: 'center',
        lineHeight: 1.6,
        boxShadow: `0 2px 6px ${badgeColor}40`,
      }}>{badge}</span>
    </span>
  ) : label,
});

const navGroup = (key, label, children) => ({ key, label, type: 'group', children });

const UserDashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [contentCounts, setContentCounts] = useState({ total: 0, drafts: 0, pending: 0, published: 0 });
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const searchRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { settings, navbarLogo, mainLogo, cmsLogo, cmsLogo1, cmsLogo2, favicon, logoSizes } = useSiteSettings();

  const D = darkMode;
  const logoDisplay = cmsLogo1 || settings?.cms_logo1 || navbarLogo || settings?.website_navbar_logo || mainLogo || settings?.website_main_logo || '';
  const iconLogo = cmsLogo1 || settings?.cms_logo1 || cmsLogo2 || settings?.cms_logo2 || settings?.cms_favicon || favicon || settings?.website_favicon || '';

  /* ── Responsive detection ── */
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ── Fetch badge counts ── */
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await axios.get('/api/user/content');
        const items = res.data || [];
        const drafts = items.filter(i => i.status === 'draft').length;
        const pending = items.filter(i => i.status === 'pending').length;
        const published = items.filter(i => i.status === 'published' || i.status === 'approved').length;
        setContentCounts({ total: items.length, drafts, pending, published });
      } catch (err) {}

      try {
        const subRes = await axios.get('/api/user/submissions?limit=1');
        setSubmissionsCount(subRes.data?.total || 0);
      } catch (err) {}
    };
    fetchCounts();
  }, []);

  /* ── Fetch notifications ── */
  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      try {
        const data = await notificationApi.getNotifications();
        setNotifications(data || []);
      } catch {
        setNotifications([]);
      }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  /* ── Keyboard shortcut ⌘K / Ctrl+K ── */
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  /* ── Menu Definition ── */
  const menuItems = [
    navGroup('core', 'Workspace', [
      navItem('/user-dashboard', <DashboardOutlined />, 'Overview'),
    ]),
    navGroup('content-group', 'Content Studio', [
      navItem('/user-dashboard/my-content', <FileTextOutlined />, 'My Content', contentCounts.total > 0 ? contentCounts.total : null, '#2563EB'),
      navItem('/user-dashboard/drafts', <EditOutlined />, 'Drafts', contentCounts.drafts > 0 ? contentCounts.drafts : null, '#64748B'),
      navItem('/user-dashboard/my-submissions', <SendOutlined />, 'Leads & Submissions', submissionsCount > 0 ? submissionsCount : null, '#10B981'),
      navItem('/user-dashboard/create-post', <PlusOutlined />, 'Create New Story'),
      navItem('/user-dashboard/analytics', <LineChartOutlined />, 'Content Analytics'),
    ]),
    navGroup('media-group', 'Assets & Media', [
      navItem('/user-dashboard/media-library', <AppstoreOutlined />, 'Media Library'),
    ]),
    navGroup('account-group', 'Account & Security', [
      navItem('/user-dashboard/profile', <UserOutlined />, 'Profile & Security'),
    ]),
  ];

  /* ── User dropdown menu ── */
  const userMenuDropdown = [
    {
      key: 'user-header',
      label: (
        <div style={{ padding: '4px 0 6px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.86rem', color: D ? '#F8FAFC' : '#0B1F4D' }}>
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || 'Creator'}
          </div>
          <div style={{ fontSize: '0.73rem', color: D ? '#94A3B8' : '#64748B' }}>
            {user?.email || 'user@portal.com'}
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #0B1F4D, #1D3D8F)',
              color: '#F7941D',
              padding: '2px 8px',
              borderRadius: 6,
              letterSpacing: '0.04em',
              border: '1px solid rgba(247, 148, 29, 0.3)'
            }}>
              {user?.role?.toUpperCase() || 'CREATOR'}
            </span>
          </div>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'profile',
      icon: <UserOutlined style={{ color: '#2563EB' }} />,
      label: <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>Profile Settings</span>,
      onClick: () => navigate('/user-dashboard/profile'),
    },
    {
      key: 'my-content',
      icon: <FileTextOutlined style={{ color: '#10B981' }} />,
      label: <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>My Content</span>,
      onClick: () => navigate('/user-dashboard/my-content'),
    },
    {
      key: 'submissions',
      icon: <SendOutlined style={{ color: '#F7941D' }} />,
      label: <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>My Leads</span>,
      onClick: () => navigate('/user-dashboard/my-submissions'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: '#EF4444' }} />,
      label: <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#EF4444' }}>Sign Out</span>,
      onClick: handleLogout,
    },
  ];

  /* Dynamic dimensions */
  const siderWidth = collapsed ? 76 : 260;
  const headerLeft = isMobile ? 0 : siderWidth;

  return (
    <>
      <style>{layoutStyles}</style>

      <Layout className="user-root-shell" style={{ minHeight: '100vh', background: D ? '#090E17' : '#F4F6F9', width: '100%' }}>

        {/* Mobile Backdrop Overlay */}
        {isMobile && mobileOpen && (
          <div className="user-mobile-overlay" onClick={() => setMobileOpen(false)} />
        )}

        {/* ── SIDEBAR ── */}
        <Sider
          className={`user-enterprise-sidebar ${D ? 'user-dark-side' : 'user-light-side'}`}
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={260}
          collapsedWidth={isMobile ? 0 : 76}
          style={{
            position: 'fixed',
            top: 0,
            left: isMobile ? (mobileOpen ? 0 : -260) : 0,
            bottom: 0,
            height: '100vh',
            zIndex: 1001,
            background: D ? '#0B132B' : '#FFFFFF',
            borderRight: `1px solid ${D ? 'rgba(255,255,255,0.07)' : 'rgba(11, 31, 77, 0.08)'}`,
            boxShadow: D ? '4px 0 24px rgba(0,0,0,0.4)' : '4px 0 20px rgba(11, 31, 77, 0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'left 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), width 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          {/* Logo Zone */}
          <div
            className="user-logo-zone"
            style={{
              borderBottom: `1px solid ${D ? 'rgba(255,255,255,0.07)' : 'rgba(11, 31, 77, 0.08)'}`,
              height: 64,
              padding: collapsed && !isMobile ? '0 18px' : '0 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', overflow: 'hidden', minWidth: 0 }}
              onClick={() => navigate('/user-dashboard')}
            >
              {collapsed && !isMobile ? (
                iconLogo ? (
                  <img
                    src={iconLogo}
                    alt="TGS"
                    style={{
                      height: 36,
                      width: 36,
                      maxWidth: 36,
                      maxHeight: 36,
                      objectFit: 'contain',
                      display: 'block',
                      margin: '0 auto',
                    }}
                  />
                ) : (
                  <div className="user-logo-mark">
                    <RocketOutlined style={{ fontSize: 18 }} />
                  </div>
                )
              ) : (cmsLogo1 && cmsLogo2) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 215, overflow: 'hidden' }}>
                  <img
                    src={cmsLogo1}
                    alt="TGS"
                    style={{
                      height: logoSizes?.cms_logo1?.height ? Math.min(logoSizes.cms_logo1.height, 42) : 38,
                      width: 'auto',
                      maxWidth: 52,
                      maxHeight: 42,
                      objectFit: 'contain',
                      flexShrink: 0,
                      display: 'block',
                    }}
                  />
                  <img
                    src={cmsLogo2}
                    alt="TECHINFO"
                    style={{
                      height: logoSizes?.cms_logo2?.height ? Math.min(logoSizes.cms_logo2.height, 36) : 32,
                      width: 'auto',
                      maxWidth: 145,
                      maxHeight: 36,
                      objectFit: 'contain',
                      flexShrink: 1,
                      display: 'block',
                    }}
                  />
                </div>
              ) : logoDisplay ? (
                <img
                  src={logoDisplay}
                  alt={settings?.site_name || "TgsTechInfo"}
                  style={{
                    height: logoSizes?.cms_logo1?.height || 42,
                    maxWidth: logoSizes?.cms_logo1?.width || 195,
                    objectFit: 'contain',
                    objectPosition: 'left center',
                    display: 'block',
                  }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                  <div className="user-logo-mark">
                    <RocketOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div style={{ lineHeight: 1.15, overflow: 'hidden' }}>
                    <div style={{
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      letterSpacing: '-0.02em',
                      color: D ? '#FFFFFF' : '#0B1F4D',
                      whiteSpace: 'nowrap',
                    }}>
                      {settings?.site_name || 'TgsTechInfo'}
                    </div>
                    <div style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      color: '#F7941D',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}>
                      Creator Studio
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isMobile && (
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: D ? '#94A3B8' : '#64748B',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                <CloseOutlined />
              </button>
            )}
          </div>

          {/* Navigation Menu */}
          <div
            className="user-scroll"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingTop: 8,
              paddingBottom: 24,
            }}
          >
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={({ key }) => {
                navigate(key);
                if (isMobile) setMobileOpen(false);
              }}
              inlineCollapsed={collapsed}
            />
          </div>

          {/* Sidebar Footer — Workspace Badge */}
          {!collapsed && (
            <div
              style={{
                padding: '12px 16px',
                borderTop: `1px solid ${D ? 'rgba(255,255,255,0.07)' : 'rgba(11, 31, 77, 0.08)'}`,
                background: D ? 'rgba(0,0,0,0.2)' : '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CrownOutlined style={{ color: '#F7941D', fontSize: 14 }} />
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: D ? '#E2E8F0' : '#1E293B' }}>
                    Creator Plan
                  </div>
                  <div style={{ fontSize: '0.62rem', color: D ? '#64748B' : '#94A3B8' }}>
                    Standard Edition
                  </div>
                </div>
              </div>
              <Tag color="orange" style={{ margin: 0, fontSize: '0.62rem', fontWeight: 800 }}>PRO</Tag>
            </div>
          )}
        </Sider>

        {/* ── RIGHT WORKSPACE CONTENT ── */}
        <Layout
          style={{
            marginLeft: isMobile ? 0 : siderWidth,
            transition: 'margin-left 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
            background: D ? '#090E17' : '#F4F6F9',
            minHeight: '100vh',
            width: isMobile ? '100%' : `calc(100% - ${siderWidth}px)`,
          }}
        >
          {/* ── TOP HEADER ── */}
          <Header
            className="user-top-header"
            style={{
              left: headerLeft,
              background: D ? 'rgba(11, 19, 43, 0.88)' : 'rgba(255, 255, 255, 0.92)',
              borderBottom: `1px solid ${D ? 'rgba(255,255,255,0.07)' : 'rgba(11, 31, 77, 0.08)'}`,
              boxShadow: D ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(11, 31, 77, 0.04)',
            }}
          >
            {/* Left: Collapse toggle + Greeting / Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                className="user-icon-btn"
                onClick={() => isMobile ? setMobileOpen(!mobileOpen) : setCollapsed(!collapsed)}
                style={{
                  color: D ? '#94A3B8' : '#64748B',
                  background: D ? 'rgba(255,255,255,0.05)' : 'rgba(11, 31, 77, 0.04)',
                  border: `1px solid ${D ? 'rgba(255,255,255,0.08)' : 'rgba(11, 31, 77, 0.08)'}`,
                }}
                title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {isMobile ? <MenuUnfoldOutlined /> : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>

              {/* User Portal Pill */}
              <div className={`user-status-pill ${D ? 'dark-status-pill' : ''}`}>
                <span className="user-beacon" />
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>USER PORTAL</span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>ACTIVE</span>
              </div>

              {!isMobile && (
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: D ? '#94A3B8' : '#475569', marginLeft: 6 }}>
                  {getGreeting()}, <strong style={{ color: D ? '#F8FAFC' : '#0B1F4D' }}>{user?.first_name || 'Creator'}</strong>
                </span>
              )}
            </div>

            {/* Center: Formal Search Pill */}
            {!isMobile && (
              <div
                className="user-search-pill"
                style={{
                  background: D ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                  border: `1px solid ${D ? 'rgba(255,255,255,0.08)' : 'rgba(11, 31, 77, 0.1)'}`,
                }}
                onClick={() => searchRef.current?.focus()}
              >
                <SearchOutlined style={{ color: D ? '#64748B' : '#94A3B8', fontSize: 13 }} />
                <input
                  ref={searchRef}
                  className="user-search-input"
                  placeholder="Search content, stories, leads..."
                  style={{ color: D ? '#F8FAFC' : '#0B1F4D' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      navigate(`/user-dashboard/my-content?q=${encodeURIComponent(e.target.value.trim())}`);
                    }
                  }}
                />
                <span
                  className="user-kbd-badge"
                  style={{
                    background: D ? 'rgba(255,255,255,0.08)' : 'rgba(11, 31, 77, 0.08)',
                    color: D ? '#94A3B8' : '#64748B',
                    border: `1px solid ${D ? 'rgba(255,255,255,0.1)' : 'rgba(11, 31, 77, 0.12)'}`,
                  }}
                >
                  ⌘K
                </span>
              </div>
            )}

            {/* Right: Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Quick Create CTA */}
              <button
                className="user-create-btn"
                onClick={() => navigate('/user-dashboard/create-post')}
              >
                <PlusOutlined style={{ fontSize: 12 }} />
                <span>Create Story</span>
              </button>

              {/* Theme Toggle */}
              <Tooltip title={D ? 'Switch to Light Mode' : 'Switch to Dark Mode'} placement="bottom">
                <button
                  className="user-icon-btn"
                  onClick={toggleTheme}
                  style={{
                    color: D ? '#F7941D' : '#64748B',
                    background: D ? 'rgba(247, 148, 29, 0.1)' : 'rgba(11, 31, 77, 0.04)',
                    border: `1px solid ${D ? 'rgba(247, 148, 29, 0.25)' : 'rgba(11, 31, 77, 0.08)'}`,
                  }}
                >
                  {D ? <SunOutlined /> : <MoonOutlined />}
                </button>
              </Tooltip>

              {/* Notifications Popover */}
              <Popover
                open={notifOpen}
                onOpenChange={setNotifOpen}
                trigger="click"
                placement="bottomRight"
                content={
                  <div
                    className="user-notif-panel"
                    style={{
                      background: D ? '#0F172A' : '#FFFFFF',
                      border: `1px solid ${D ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
                    }}
                  >
                    <div
                      className="user-notif-header"
                      style={{
                        borderColor: D ? 'rgba(255,255,255,0.07)' : '#F1F5F9',
                        background: D ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BellOutlined style={{ color: '#F7941D', fontSize: 14 }} />
                        <span style={{ fontWeight: 700, fontSize: '0.84rem', color: D ? '#F8FAFC' : '#0B1F4D' }}>
                          Notifications
                        </span>
                      </div>
                      {notifications.length > 0 && (
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: 'rgba(247, 148, 29, 0.15)',
                          color: '#F7941D',
                          padding: '2px 8px',
                          borderRadius: 10,
                        }}>
                          {notifications.length} new
                        </span>
                      )}
                    </div>

                    <div className="user-scroll" style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: D ? '#64748B' : '#94A3B8' }}>
                          <BellOutlined style={{ fontSize: 24, opacity: 0.3, marginBottom: 8, display: 'block' }} />
                          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>No unread notifications</span>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className="user-notif-item"
                            style={{
                              borderColor: D ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              notificationApi.markAsRead(n.id);
                              setNotifications((prev) => prev.filter((item) => item.id !== n.id));
                            }}
                          >
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: D ? '#E2E8F0' : '#1E293B', marginBottom: 2 }}>
                              {n.message}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: D ? '#64748B' : '#94A3B8' }}>
                              {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                }
              >
                <Badge count={notifications.length} size="small" offset={[-2, 4]} color="#F7941D">
                  <button
                    className="user-icon-btn"
                    style={{
                      color: D ? '#94A3B8' : '#64748B',
                      background: D ? 'rgba(255,255,255,0.05)' : 'rgba(11, 31, 77, 0.04)',
                      border: `1px solid ${D ? 'rgba(255,255,255,0.08)' : 'rgba(11, 31, 77, 0.08)'}`,
                    }}
                  >
                    <BellOutlined />
                  </button>
                </Badge>
              </Popover>

              {/* User Avatar Chip Dropdown */}
              <Dropdown menu={{ items: userMenuDropdown }} trigger={['click']} placement="bottomRight">
                <div
                  className="user-chip"
                  style={{
                    background: D ? 'rgba(255,255,255,0.05)' : 'rgba(11, 31, 77, 0.04)',
                    border: `1px solid ${D ? 'rgba(255,255,255,0.08)' : 'rgba(11, 31, 77, 0.08)'}`,
                  }}
                >
                  <Avatar
                    size={28}
                    style={{
                      background: 'linear-gradient(135deg, #0B1F4D 0%, #1D3D8F 100%)',
                      color: '#F7941D',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      border: '1.5px solid #F7941D',
                    }}
                  >
                    {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                  {!isMobile && (
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: D ? '#F8FAFC' : '#0B1F4D', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.first_name || user?.username || 'Creator'}
                    </span>
                  )}
                </div>
              </Dropdown>
            </div>
          </Header>

          {/* ── MAIN CONTENT OUTLET ── */}
          <Content
            style={{
              marginTop: 64,
              padding: isMobile ? '16px 12px' : '24px 28px',
              minHeight: 'calc(100vh - 64px)',
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </>
  );
};

export default UserDashboardLayout;