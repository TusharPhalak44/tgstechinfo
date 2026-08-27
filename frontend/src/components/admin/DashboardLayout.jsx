import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Badge, Tooltip, Popover, Tag } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  EditOutlined,
  FolderOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  BarChartOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SearchOutlined,
  BellOutlined,
  PlusOutlined,
  MoonOutlined,
  SunOutlined,
  PictureOutlined,
  TagOutlined,
  UploadOutlined,
  LineChartOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  MenuOutlined,
  MailOutlined,
  SendOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  ApiOutlined,
  SafetyCertificateOutlined,
  ApartmentOutlined,
  LockOutlined,
  FormOutlined,
  CrownOutlined,
  RocketOutlined,
  CompassOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { notificationApi } from '../../services/notificationApi';
import axios from 'axios';
import './radar/RadarStyles.css';

const { Header, Sider, Content } = Layout;

/* ─────────────────────────────────────────────
   INJECTED CSS — Enterprise Formal Design System
───────────────────────────────────────────── */
const layoutStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .admin-root-shell {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif !important;
  }

  /* ─── SIDEBAR SHELL ─── */
  .admin-enterprise-sidebar {
    transition: width 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
  }

  .admin-enterprise-sidebar .ant-menu {
    background: transparent !important;
    border-inline-end: none !important;
  }

  /* Section group titles with distinct corporate tones */
  .admin-enterprise-sidebar .ant-menu-item-group-title {
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
  .admin-enterprise-sidebar .ant-menu-item {
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
  .admin-light-side .ant-menu-item:hover {
    background: rgba(11, 31, 77, 0.05) !important;
    color: #0B1F4D !important;
  }
  .admin-light-side .ant-menu-item-selected {
    background: linear-gradient(135deg, rgba(11, 31, 77, 0.08) 0%, rgba(247, 148, 29, 0.06) 100%) !important;
    color: #0B1F4D !important;
    font-weight: 700 !important;
    border-left: 3.5px solid #F7941D !important;
    padding-left: calc(var(--ant-menu-inline-indent, 24px) - 3.5px) !important;
    box-shadow: inset 0 0 0 1px rgba(247, 148, 29, 0.15) !important;
  }

  /* Dark mode hover & active */
  .admin-dark-side .ant-menu-item:hover {
    background: rgba(59, 130, 246, 0.1) !important;
    color: #60A5FA !important;
  }
  .admin-dark-side .ant-menu-item-selected {
    background: linear-gradient(135deg, rgba(11, 31, 77, 0.45) 0%, rgba(247, 148, 29, 0.12) 100%) !important;
    color: #F7941D !important;
    font-weight: 700 !important;
    border-left: 3.5px solid #F7941D !important;
    box-shadow: inset 0 0 12px rgba(247, 148, 29, 0.08), 0 0 0 1px rgba(247, 148, 29, 0.2) !important;
  }

  /* Icon color styling */
  .admin-enterprise-sidebar .ant-menu-item .anticon {
    font-size: 15px !important;
    transition: transform 0.18s ease !important;
  }
  .admin-enterprise-sidebar .ant-menu-item:hover .anticon {
    transform: scale(1.1);
  }

  /* ─── LOGO ZONE ─── */
  .admin-logo-zone {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 18px;
    flex-shrink: 0;
  }
  .admin-logo-mark {
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
  .admin-logo-mark:hover { transform: scale(1.05); }

  /* ─── TOP HEADER ─── */
  .admin-top-header {
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
  .admin-search-pill {
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
  .admin-search-pill:focus-within {
    width: 320px;
    border-color: #2563EB !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
  }
  .admin-search-input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.82rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    width: 100%;
    min-width: 0;
  }
  .admin-kbd-badge {
    font-size: 0.62rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 6px;
    white-space: nowrap;
    line-height: 1.4;
    flex-shrink: 0;
  }

  /* ─── LIVE STATUS PILL (EMERALD HEALTH) ─── */
  .admin-status-pill {
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
  .admin-beacon {
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
  .admin-create-btn {
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
  .admin-create-btn:hover {
    transform: translateY(-1px);
    background: linear-gradient(135deg, #1D3D8F 0%, #0B1F4D 50%, #F7941D 200%);
    box-shadow: 0 6px 18px rgba(11, 31, 77, 0.35), 0 0 0 1.5px rgba(247, 148, 29, 0.35);
  }
  .admin-create-btn:active { transform: translateY(0); }

  /* ─── ACTION ICON BUTTONS ─── */
  .admin-icon-btn {
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
  .admin-notif-panel {
    width: 320px;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(11, 31, 77, 0.15);
  }
  .admin-notif-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px 10px;
    border-bottom: 1px solid;
  }
  .admin-notif-item {
    padding: 12px 16px;
    border-bottom: 1px solid;
    transition: background 0.15s;
  }
  .admin-notif-item:last-child { border-bottom: none; }

  /* ─── USER PROFILE CHIP ─── */
  .admin-user-chip {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 4px 10px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.18s;
  }

  /* ─── SCROLLBAR ─── */
  .admin-scroll::-webkit-scrollbar { width: 5px; }
  .admin-scroll::-webkit-scrollbar-track { background: transparent; }
  .admin-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.35); border-radius: 4px; }
  .admin-scroll::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.6); }

  /* ─── MOBILE OVERLAY ─── */
  .admin-mobile-overlay {
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

/* ─────────────────────────────────────────────
   MENU ITEM BUILDER HELPERS WITH FORMAL COLORS
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   MAIN DASHBOARD LAYOUT COMPONENT
───────────────────────────────────────────── */
const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadLeads, setUnreadLeads] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { cmsLogo, mainLogo } = useSiteSettings();

  const D = darkMode;

  /* ── RESPONSIVE DETECTION ── */
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

  /* ── FETCH COUNTS FOR BADGES ── */
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await axios.get('/api/admin/content-by-status');
        if (res.data) {
          const p = res.data.find(s => s.status === 'pending');
          if (p) setPendingCount(p.count || 0);
        }
      } catch {}
      try {
        const res = await axios.get('/api/admin/submissions?limit=1');
        const total = res.data?.total || 0;
        if (total > 0) setUnreadLeads(total);
      } catch {}
    };
    fetchBadges();
  }, []);

  /* ── FETCH SYSTEM NOTIFICATIONS ── */
  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      try {
        const data = await notificationApi.getAdminNotifications();
        setNotifications(data || []);
      } catch {
        setNotifications([]);
      }
    };
    fetch();
  }, [user?.id]);

  /* ── KEYBOARD SHORTCUT ⌘K / Ctrl+K ── */
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

  /* ── FORMAL COLOR-CODED NAVIGATION MENU ── */
  const buildMenuItems = () => {
    const items = [
      /* ── 1. CORE OVERVIEW (Sapphire / Tech Blue) ── */
      navGroup('g-core', '⚡ Core Overview', [
        navItem('/dashboard', <DashboardOutlined style={{ color: D ? '#38BDF8' : '#0284C7' }} />, 'Dashboard Overview'),
        navItem('/dashboard/analytics', <RocketOutlined style={{ color: D ? '#60A5FA' : '#2563EB' }} />, 'Live Analytics'),
      ]),

      /* ── 2. CONTENT STUDIO (Royal Indigo & Purple) ── */
      navGroup('g-content', '✍️ Content Studio', [
        navItem('/dashboard/content', <FileTextOutlined style={{ color: D ? '#818CF8' : '#4F46E5' }} />, 'All Content'),
        navItem('/dashboard/content?action=create', <EditOutlined style={{ color: D ? '#A78BFA' : '#7C3AED' }} />, 'Create Article'),
        navItem('/dashboard/categories', <FolderOutlined style={{ color: D ? '#C084FC' : '#9333EA' }} />, 'Categories'),
        navItem('/dashboard/tags', <TagOutlined style={{ color: D ? '#E879F9' : '#C026D3' }} />, 'Tags & Topics'),
        navItem('/dashboard/media-library', <PictureOutlined style={{ color: D ? '#818CF8' : '#4338CA' }} />, 'Media Library'),
        navItem('/dashboard/uploads', <UploadOutlined style={{ color: D ? '#60A5FA' : '#2563EB' }} />, 'Asset Uploads'),
      ]),

      /* ── 3. EDITORIAL GOVERNANCE (Emerald & Sage) ── */
      navGroup('g-editorial', '🛡️ Editorial Governance', [
        navItem('/dashboard/pending-review', <CheckCircleOutlined style={{ color: D ? '#34D399' : '#059669' }} />, 'Review Queue', pendingCount > 0 ? pendingCount : null, '#10B981'),
        navItem('/dashboard/drafts', <EditOutlined style={{ color: D ? '#6EE7B7' : '#10B981' }} />, 'Drafts Workspace'),
      ]),

      /* ── 4. LEAD GEN & INBOUND (Solar Flame & Amber) ── */
      navGroup('g-leads', '🎯 Lead Gen & Inbound', [
        navItem('/admin/submissions', <SendOutlined style={{ color: D ? '#FB923C' : '#EA580C' }} />, 'Form Submissions', unreadLeads > 0 ? unreadLeads : null, '#EA580C'),
        navItem('/dashboard/forms', <FormOutlined style={{ color: D ? '#FBBF24' : '#D97706' }} />, 'Forms Builder'),
        navItem('/dashboard/email-templates', <MailOutlined style={{ color: D ? '#F59E0B' : '#B45309' }} />, 'Email Templates'),
      ]),

      /* ── 4.5. AUDIENCE INTELLIGENCE (Taraj Cyan & Deep Blue) ── */
      navGroup('g-audience', '🎯 Audience Intelligence', [
        navItem('/audience-intelligence', <CompassOutlined style={{ color: D ? '#38BDF8' : '#0284C7' }} />, 'Live Audience Sizing'),
        navItem('/admin/audience', <DatabaseOutlined style={{ color: D ? '#0AAEEF' : '#0284C7' }} />, 'Data Demographics Hub'),
      ]),

      /* ── 5. SEO & DISTRIBUTION (Teal & Cyan) ── */
      navGroup('g-seo', '🌐 SEO & Distribution', [
        navItem('/dashboard/seo', <LineChartOutlined style={{ color: D ? '#2DD4BF' : '#0D9488' }} />, 'SEO Health'),
        navItem('/dashboard/integrations', <ApiOutlined style={{ color: D ? '#22D3EE' : '#0891B2' }} />, 'Integrations'),
      ]),
    ];

    /* ── 6. ACCESS & ADMINISTRATION (Slate & Security Steel) ── */
    if (user?.role === 'admin' || user?.permissions?.includes('user.read') || user?.permissions?.includes('settings.manage')) {
      const adminChildren = [];
      if (user?.role === 'admin' || user?.permissions?.includes('user.read')) {
        adminChildren.push(navItem('/dashboard/users', <TeamOutlined style={{ color: D ? '#93C5FD' : '#3B82F6' }} />, 'Team Users'));
        adminChildren.push(navItem('/dashboard/roles', <CrownOutlined style={{ color: D ? '#FCD34D' : '#D97706' }} />, 'Roles & Access'));
        adminChildren.push(navItem('/dashboard/permissions', <ApartmentOutlined style={{ color: D ? '#CBD5E1' : '#475569' }} />, 'RBAC Permissions'));
        adminChildren.push(navItem('/dashboard/sessions', <LockOutlined style={{ color: D ? '#F87171' : '#DC2626' }} />, 'Session Control'));
      }
      if (user?.role === 'admin' || user?.permissions?.includes('settings.manage')) {
        adminChildren.push(navItem('/dashboard/audit-logs', <HistoryOutlined style={{ color: D ? '#94A3B8' : '#64748B' }} />, 'Audit Logs'));
        adminChildren.push(navItem('/dashboard/settings', <SettingOutlined style={{ color: D ? '#A1A1AA' : '#52525B' }} />, 'Platform Settings'));
      }
      if (adminChildren.length > 0) {
        items.push(navGroup('g-admin', '🔐 Access & Administration', adminChildren));
      }
    }

    return items;
  };

  const handleMenuClick = ({ key }) => {
    if (key.startsWith('g-')) return;
    navigate(key.split('?')[0]);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  /* ─ FORMAL THEME TOKENS ─ */
  const sidebarBg = D ? '#0A1229' : '#FFFFFF';
  const headerBg = D ? 'rgba(10, 18, 41, 0.94)' : 'rgba(255, 255, 255, 0.94)';
  const borderColor = D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)';
  const textPrimary = D ? '#F1F5F9' : '#0F172A';
  const textMuted = D ? '#64748B' : '#94A3B8';
  const searchBg = D ? '#111C3D' : '#F8FAFC';
  const iconBtnHover = D ? 'rgba(255, 255, 255, 0.08)' : 'rgba(11, 31, 77, 0.05)';

  const logoDisplay = cmsLogo || mainLogo;
  const selectedKey = (location.pathname === '/admin' || location.pathname === '/dashboard' || location.pathname === '/dashboard/') ? '/dashboard' : location.pathname;

  /* ─ NOTIFICATION POPUP PANEL ─ */
  const notifPanel = (
    <div className="admin-notif-panel" style={{ background: D ? '#111C3D' : '#FFFFFF' }}>
      <div className="admin-notif-header" style={{ borderBottomColor: borderColor }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: textPrimary }}>System Notifications</span>
        <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, fontSize: '0.7rem' }}>
          {notifications.length} Unread
        </Tag>
      </div>
      {notifications.length === 0 ? (
        <div style={{ padding: '24px 16px', textAlign: 'center', color: textMuted, fontSize: '0.8rem' }}>
          <BellOutlined style={{ fontSize: 24, opacity: 0.35, display: 'block', marginBottom: 8, color: '#3B82F6' }} />
          All platform systems operational
        </div>
      ) : (
        notifications.slice(0, 5).map((n, i) => (
          <div key={i} className="admin-notif-item" style={{ borderBottomColor: borderColor }}
            onMouseEnter={e => e.currentTarget.style.background = D ? '#0A1229' : '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: textPrimary, marginBottom: 2 }}>
              {n.title || 'System Alert'}
            </div>
            <div style={{ fontSize: '0.72rem', color: textMuted }}>
              {n.message || 'Operational log details'}
            </div>
          </div>
        ))
      )}
    </div>
  );

  /* ─ USER DROPDOWN ─ */
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined style={{ color: '#2563EB' }} />,
      label: 'Account Profile',
      onClick: () => navigate('/dashboard/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined style={{ color: '#64748B' }} />,
      label: 'Platform Settings',
      onClick: () => navigate('/dashboard/settings'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: handleLogout,
      danger: true,
    },
  ];

  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <>
      <style>{layoutStyles}</style>

      <Layout className="admin-root-shell" style={{ minHeight: '100vh', background: D ? '#070C1E' : '#F8FAFC' }}>

        {/* ══ MOBILE BACKDROP OVERLAY ══ */}
        {isMobile && mobileOpen && (
          <div className="admin-mobile-overlay" onClick={() => setMobileOpen(false)} />
        )}

        {/* ══════════════════════════════════════
            SIDEBAR (CORPORATE HIERARCHY)
        ═════════════════════════════════════════ */}
        <Sider
          trigger={null}
          collapsible
          collapsed={isMobile ? false : collapsed}
          width={260}
          collapsedWidth={isMobile ? 0 : 72}
          className="admin-enterprise-sidebar admin-scroll"
          style={{
            background: sidebarBg,
            overflowY: 'auto',
            overflowX: 'hidden',
            height: '100vh',
            position: 'fixed',
            left: isMobile ? (mobileOpen ? 0 : -270) : 0,
            top: 0,
            bottom: 0,
            borderRight: `1px solid ${borderColor}`,
            zIndex: isMobile ? 999 : 100,
            transition: isMobile
              ? 'left 0.28s cubic-bezier(0.2,0.8,0.2,1)'
              : 'width 0.28s cubic-bezier(0.2,0.8,0.2,1)',
            boxShadow: D ? 'none' : '4px 0 24px rgba(11, 31, 77, 0.03)',
          }}
        >
          {/* ─ LOGO ZONE ─ */}
          <div
            className="admin-logo-zone"
            style={{ borderBottom: `1px solid ${borderColor}`, padding: collapsed && !isMobile ? '0 17px' : '0 18px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 0 }}
              onClick={() => navigate('/admin')}
            >
              {logoDisplay ? (
                <img
                  src={logoDisplay}
                  alt="TGS Tech"
                  style={{
                    height: 36,
                    maxWidth: collapsed && !isMobile ? 36 : 130,
                    objectFit: 'contain',
                    transition: 'max-width 0.28s ease',
                  }}
                />
              ) : (
                <>
                  <div className="admin-logo-mark">TGS</div>
                  {(!collapsed || isMobile) && (
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                        TGS Tech
                      </div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Enterprise Control
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {isMobile && (
              <button
                className="admin-icon-btn"
                onClick={() => setMobileOpen(false)}
                style={{ color: textMuted }}
              >
                <CloseOutlined style={{ fontSize: 15 }} />
              </button>
            )}
          </div>

          {/* ─ NAVIGATION LIST ─ */}
          <div style={{ paddingTop: 8, paddingBottom: 32 }}>
            <Menu
              theme={D ? 'dark' : 'light'}
              mode="inline"
              selectedKeys={[selectedKey]}
              items={buildMenuItems()}
              onClick={handleMenuClick}
              style={{ background: 'transparent', border: 'none' }}
              className={D ? 'admin-dark-side' : 'admin-light-side'}
              inlineIndent={collapsed && !isMobile ? 0 : 14}
            />
          </div>

          {/* ─ SIDEBAR FOOTER ─ */}
          {(!collapsed || isMobile) && (
            <div style={{
              position: 'sticky',
              bottom: 0,
              padding: '12px 16px',
              background: D
                ? 'linear-gradient(0deg, #0A1229 85%, transparent)'
                : 'linear-gradient(0deg, #FFFFFF 85%, transparent)',
              borderTop: `1px solid ${borderColor}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar
                  size={34}
                  style={{
                    background: 'linear-gradient(135deg, #0B1F4D 0%, #2563EB 100%)',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  {user?.first_name ? user.first_name[0].toUpperCase() : 'A'}
                </Avatar>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.first_name || 'Administrator'} {user?.last_name || ''}
                  </div>
                  <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#2563EB', textTransform: 'capitalize' }}>
                    {user?.role || 'Enterprise Admin'}
                  </div>
                </div>
                <SafetyCertificateOutlined style={{ color: '#10B981', fontSize: 14, flexShrink: 0 }} />
              </div>
            </div>
          )}
        </Sider>

        {/* ══════════════════════════════════════
            RIGHT WORKSPACE CONTENT
        ═════════════════════════════════════════ */}
        <Layout
          style={{
            marginLeft: isMobile ? 0 : sidebarWidth,
            transition: 'margin-left 0.28s cubic-bezier(0.2,0.8,0.2,1)',
            background: D ? '#070C1E' : '#F8FAFC',
            minHeight: '100vh',
          }}
        >

          {/* ══════════════════════════════════════
              GLASSMORPHIC ENTERPRISE HEADER
          ═════════════════════════════════════════ */}
          <Header
            className="admin-top-header"
            style={{
              left: isMobile ? 0 : sidebarWidth,
              background: headerBg,
              borderBottom: `1px solid ${borderColor}`,
              padding: isMobile ? '0 16px' : '0 28px',
            }}
          >
            {/* ─ LEFT: Navigation Drawer / Search ─ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="admin-icon-btn"
                onClick={() => isMobile ? setMobileOpen(true) : setCollapsed(!collapsed)}
                style={{ color: textMuted }}
                onMouseEnter={e => e.currentTarget.style.background = iconBtnHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {isMobile
                  ? <MenuOutlined style={{ fontSize: 17 }} />
                  : collapsed
                    ? <MenuUnfoldOutlined style={{ fontSize: 16 }} />
                    : <MenuFoldOutlined style={{ fontSize: 16 }} />
                }
              </button>

              {/* Quick Search */}
              {!isMobile && (
                <div
                  className="admin-search-pill"
                  style={{
                    background: searchBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <SearchOutlined style={{ color: textMuted, fontSize: 13, flexShrink: 0 }} />
                  <input
                    ref={searchRef}
                    placeholder="Search publications, leads, users..."
                    className="admin-search-input"
                    style={{ color: textPrimary }}
                  />
                  <span
                    className="admin-kbd-badge"
                    style={{ background: D ? 'rgba(255,255,255,0.08)' : 'rgba(11,31,77,0.06)', color: textMuted }}
                  >
                    ⌘K
                  </span>
                </div>
              )}
            </div>

            {/* ─ RIGHT: Controls & Profile ─ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

              {/* Platform Status */}
              <div className={`admin-status-pill ${D ? 'dark-status-pill' : ''}`}>
                <span className="admin-beacon" />
                <span>Platform Operational • 99.8%</span>
              </div>

              {/* Create Publication Action */}
              {!isMobile && (
                <button
                  className="admin-create-btn"
                  onClick={() => navigate('/dashboard/content')}
                >
                  <PlusOutlined style={{ fontSize: 12, color: '#F7941D' }} />
                  Create Publication
                </button>
              )}

              {/* Theme Switcher */}
              <Tooltip title={D ? 'Switch to Light Mode' : 'Switch to Dark Mode'} placement="bottom">
                <button
                  className="admin-icon-btn"
                  onClick={toggleTheme}
                  style={{ color: D ? '#F59E0B' : '#475569' }}
                  onMouseEnter={e => e.currentTarget.style.background = iconBtnHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {D ? <SunOutlined style={{ fontSize: 16 }} /> : <MoonOutlined style={{ fontSize: 15 }} />}
                </button>
              </Tooltip>

              {/* Notifications */}
              <Popover
                content={notifPanel}
                trigger="click"
                open={notifOpen}
                onOpenChange={setNotifOpen}
                placement="bottomRight"
                overlayInnerStyle={{ padding: 0, borderRadius: 14, overflow: 'hidden' }}
              >
                <Badge count={notifications.length} size="small" offset={[-2, 2]}>
                  <button
                    className="admin-icon-btn"
                    style={{ color: textMuted }}
                    onMouseEnter={e => e.currentTarget.style.background = iconBtnHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <BellOutlined style={{ fontSize: 16 }} />
                  </button>
                </Badge>
              </Popover>

              {/* User Dropdown */}
              <Dropdown 
                menu={{ items: userMenuItems }} 
                placement="bottomRight" 
                arrow 
                trigger={['click']}
                getPopupContainer={(triggerNode) => document.body}
              >
                <div
                  className="admin-user-chip"
                  style={{ border: `1px solid ${borderColor}` }}
                  onMouseEnter={e => e.currentTarget.style.background = iconBtnHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Avatar
                    size={30}
                    style={{
                      background: 'linear-gradient(135deg, #0B1F4D 0%, #2563EB 100%)',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      flexShrink: 0,
                    }}
                  >
                    {user?.first_name ? user.first_name[0].toUpperCase() : 'A'}
                  </Avatar>
                  {!isMobile && (
                    <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: textPrimary, whiteSpace: 'nowrap' }}>
                        {user?.first_name || 'Admin'}
                      </div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 600, color: '#2563EB', textTransform: 'capitalize' }}>
                        {user?.role || 'Admin'}
                      </div>
                    </div>
                  )}
                </div>
              </Dropdown>

            </div>
          </Header>

          {/* ══════════════════════════════════════
              SUBPAGE CONTENT AREA
          ═════════════════════════════════════════ */}
          <Content
            className="admin-scroll"
            style={{
              marginTop: 64,
              padding: isMobile ? '16px 14px' : '28px 32px',
              minHeight: 'calc(100vh - 64px)',
              overflowY: 'auto',
            }}
          >
            <Outlet />
          </Content>

        </Layout>
      </Layout>
    </>
  );
};

export default DashboardLayout;
