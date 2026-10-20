import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dropdown, Button, Avatar, Badge, List, Typography, Empty, Tag } from 'antd';
import {
  UserOutlined, LogoutOutlined, DashboardOutlined,
  MenuOutlined, CloseOutlined, SearchOutlined, BellOutlined,
  CheckOutlined, DownOutlined, RightOutlined, SunOutlined, MoonOutlined,
  FileTextOutlined, TeamOutlined, FireOutlined, ReadOutlined,
  GlobalOutlined, FolderOpenOutlined, LineChartOutlined, CalendarOutlined,
  AppstoreOutlined, BuildOutlined, CompassOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { ButtonWithIcon } from '@/components/ui/button-with-icon';
import { PhoneCall } from 'lucide-react';
import axios from 'axios';

const { Text } = Typography;

const NOTIF_COLOR = {
  review: 'blue', approved: 'green', published: 'purple',
  rejected: 'red', changes_requested: 'orange', delete: 'red',
};

const STATIC_NAV = [
  { key: 'home', label: 'Home', to: '/' },
  { key: 'audience', label: 'Audience', to: '/audience', icon: <GlobalOutlined /> },
  {
    key: 'insights', label: 'Insights',
    children: [
      { label: 'Articles', desc: 'In-depth tech analysis & tutorials', to: '/articles', icon: <FileTextOutlined /> },
      { label: 'Interviews', desc: 'Exclusives with CXOs & Tech Leaders', to: '/interviews', icon: <TeamOutlined /> },
      { label: 'News', desc: 'Breaking enterprise tech news', to: '/news', icon: <FireOutlined /> },
      { label: 'eBooks', desc: 'Comprehensive tech guides & books', to: '/ebooks', icon: <ReadOutlined /> },
    ]
  },
  {
    key: 'resources', label: 'Resources',
    children: [
      { label: 'Blog', desc: 'Expert insights & opinion pieces', to: '/blogs', icon: <GlobalOutlined /> },
      { label: 'Whitepapers', desc: 'Research reports & benchmarks', to: '/whitepapers', icon: <FolderOpenOutlined /> },
      { label: 'Webinars', desc: 'Live & on-demand tech webinars', to: '/webinars', icon: <LineChartOutlined /> },
      { label: 'Events', desc: 'Industry summits & conferences', to: '/events', icon: <CalendarOutlined /> },
      { label: 'Case Studies', desc: 'Real-world customer success stories', to: '/case-studies', icon: <CheckOutlined /> },
    ]
  },
  { key: 'technology', label: 'Technology', dynamic: true, icon: <AppstoreOutlined /> },
  { key: 'industries', label: 'Industries', dynamic: true, icon: <BuildOutlined /> },
  { key: 'about', label: 'About Us', to: '/about' },
];

// ── Rich Dropdown MegaPanel ───────────────────────────────────────────
const MegaPanel = ({ items, onClose, anchorRect, onMouseEnter, onMouseLeave, darkMode }) => {
  if (!anchorRect) return null;
  const width = Math.min(330, window.innerWidth - 32);
  const left = Math.max(16, Math.min(anchorRect.left + anchorRect.width / 2 - width / 2, window.innerWidth - width - 16));
  const arrowLeft = Math.min(Math.max(16, anchorRect.left + anchorRect.width / 2 - left - 7), width - 24);

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        top: anchorRect.bottom + 10,
        left,
        width,
        maxHeight: 'calc(100vh - 85px)',
        overflowY: 'auto',
        zIndex: 99999,
        background: darkMode ? '#0F172A' : '#FFFFFF',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 16,
        padding: '10px 8px',
        boxShadow: darkMode ? '0 16px 48px rgba(0,0,0,0.6)' : '0 16px 48px rgba(11,31,77,0.14)',
        border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
        animation: 'navFadeDown .18s ease-out'
      }}>
      {/* Top pointer arrow */}
      <div style={{
        position: 'absolute', top: -7, left: arrowLeft,
        width: 14, height: 14,
        background: darkMode ? '#0F172A' : '#FFFFFF',
        border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
        borderBottom: 'none', borderRight: 'none',
        transform: 'rotate(45deg)', borderRadius: '2px 0 0 0'
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(item => (
          <Link key={item.label} to={item.to} onClick={onClose} style={{ textDecoration: 'none' }}>
            <div
              style={{
                padding: '9px 12px',
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all .18s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = darkMode ? '#1E3A8A' : '#EAF2FF';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {item.icon && (
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: darkMode ? '#1E293B' : '#FFF4E8',
                  border: darkMode ? '1px solid #334155' : '1px solid #FFE0B2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F7941D',
                  fontSize: 15,
                  flexShrink: 0
                }}>
                  {item.icon}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: darkMode ? '#F1F5F9' : '#0B1F4D',
                  lineHeight: 1.3
                }}>
                  {item.label}
                </div>
                {item.desc && (
                  <div style={{
                    fontSize: 11,
                    color: darkMode ? '#94A3B8' : '#64748B',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: 2
                  }}>
                    {item.desc}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

// ── Nav Link Component ─────────────────────────────────────────────
const NavLink = ({ item, active, darkMode }) => {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const ref = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const handleMouseEnter = () => {
    clearTimeout(closeTimer.current);
    if (ref.current) setRect(ref.current.getBoundingClientRect());
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  if (!item.children) {
    return (
      <Link
        to={item.to}
        className="nav-link-item"
        style={{
          fontWeight: active ? 700 : 600,
          color: active
            ? (darkMode ? '#3B82F6' : '#0B1F4D')
            : (darkMode ? '#CBD5E1' : '#0F172A'),
          textDecoration: 'none',
          borderRadius: 20,
          background: active
            ? (darkMode ? 'rgba(59, 130, 246, 0.15)' : '#EAF2FF')
            : 'transparent',
          transition: 'all .2s ease',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          position: 'relative',
          lineHeight: 1
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.color = darkMode ? '#3B82F6' : '#0B1F4D';
            e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.1)' : '#EAF2FF';
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.color = darkMode ? '#CBD5E1' : '#0F172A';
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        {item.label}
        {active && (
          <span style={{
            position: 'absolute',
            bottom: 2,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 16,
            height: 2,
            borderRadius: 2,
            background: '#F7941D'
          }} />
        )}
      </Link>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="nav-link-item"
        style={{
          background: open
            ? (darkMode ? 'rgba(59, 130, 246, 0.15)' : '#EAF2FF')
            : 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontWeight: open ? 700 : 600,
          color: open
            ? (darkMode ? '#3B82F6' : '#0B1F4D')
            : (darkMode ? '#CBD5E1' : '#0F172A'),
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          borderRadius: 20,
          transition: 'all .2s ease',
          whiteSpace: 'nowrap',
          lineHeight: 1
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.color = darkMode ? '#3B82F6' : '#0B1F4D';
            e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.1)' : '#EAF2FF';
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.color = darkMode ? '#CBD5E1' : '#0F172A';
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <span>{item.label}</span>
        <DownOutlined style={{ fontSize: 9, transition: 'transform .2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>

      {open && (
        <MegaPanel
          items={item.children}
          onClose={() => setOpen(false)}
          anchorRect={rect}
          onMouseEnter={() => clearTimeout(closeTimer.current)}
          onMouseLeave={handleMouseLeave}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

// ── Mobile Menu Item with Dropdown Accordion (Only for Mobile <768px) ──
const MobileMenuItem = ({ item, onClose, isAuthenticated, setIsMobileOpen, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!item.children) {
    return (
      <Link to={item.to} onClick={() => { onClose(); setIsMobileOpen(false); }} style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 4px',
        fontSize: 15,
        fontWeight: 600,
        color: darkMode ? '#F1F5F9' : '#0F172A',
        textDecoration: 'none',
        borderBottom: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0',
        transition: 'color .2s ease'
      }}>
        {item.icon && <span style={{ color: '#F7941D', fontSize: 16 }}>{item.icon}</span>}
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <div style={{ borderBottom: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '13px 4px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 600,
          color: darkMode ? '#F1F5F9' : '#0F172A',
          textAlign: 'left'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {item.icon && <span style={{ color: '#F7941D', fontSize: 16 }}>{item.icon}</span>}
          <span>{item.label}</span>
        </span>
        <span style={{
          transition: 'transform .3s ease',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          display: 'flex',
          alignItems: 'center',
          color: '#F7941D'
        }}>
          <RightOutlined style={{ fontSize: 12 }} />
        </span>
      </button>

      <div style={{
        maxHeight: isOpen ? '1000px' : '0',
        overflow: 'hidden',
        transition: 'max-height .35s ease, opacity .25s ease',
        opacity: isOpen ? 1 : 0,
        paddingLeft: 8,
        paddingBottom: isOpen ? 8 : 0
      }}>
        {item.children.map(child => (
          <Link
            key={child.label}
            to={child.to}
            onClick={() => { onClose(); setIsMobileOpen(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              fontSize: 13.5,
              fontWeight: 500,
              color: darkMode ? '#94A3B8' : '#475569',
              textDecoration: 'none',
              borderRadius: 10,
              marginBottom: 2,
              transition: 'background .2s, color .2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = darkMode ? '#1E3A8A' : '#EAF2FF';
              e.currentTarget.style.color = darkMode ? '#60A5FA' : '#0B1F4D';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = darkMode ? '#94A3B8' : '#475569';
            }}
          >
            {child.icon && <span style={{ color: '#F7941D', fontSize: 14 }}>{child.icon}</span>}
            <span>{child.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

// ── Notification Panel ───────────────────────────────────────────
const NotifPanel = ({ notifications, onMarkRead }) => (
  <div style={{
    width: 340,
    maxWidth: '90vw',
    background: 'var(--color-surface)',
    borderRadius: 16,
    boxShadow: '0 12px 40px rgba(11,31,77,0.16)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden'
  }}>
    <div style={{
      padding: '14px 18px',
      borderBottom: '1px solid var(--color-border)',
      fontWeight: 700,
      fontSize: 14,
      color: 'var(--color-heading)',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }}>
      Notifications
      {notifications.length > 0 && <Tag color="orange" style={{ borderRadius: 10, fontSize: 11 }}>{notifications.length}</Tag>}
    </div>
    {notifications.length === 0
      ? <Empty description="No new notifications" style={{ padding: '28px 0' }} />
      : <List
        style={{ maxHeight: 380, overflowY: 'auto' }}
        dataSource={notifications}
        renderItem={item => (
          <List.Item style={{ padding: '12px 18px', alignItems: 'flex-start' }}
            actions={[
              <Button key="r" type="text" size="small" icon={<CheckOutlined />}
                style={{ color: 'var(--color-success)', fontSize: 12 }} onClick={e => onMarkRead(item.id, e)}>
                Read
              </Button>
            ]}>
            <List.Item.Meta
              title={<Tag color={NOTIF_COLOR[item.type] || 'default'} style={{ fontSize: 11 }}>{item.type?.replace('_', ' ').toUpperCase()}</Tag>}
              description={
                <div>
                  <Text style={{ fontSize: 13, color: 'var(--color-body)' }}>{item.message}</Text>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>{new Date(item.created_at).toLocaleString()}</div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    }
  </div>
);

// ── Main Navbar ──────────────────────────────────────────────────
const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { navbarLogo, logoSizes } = useSiteSettings();
  const navigate = useNavigate();
  const location = useLocation();

  // Mobile strictly < 768px. All desktop & laptop views (>= 768px) share the exact full desktop navbar.
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [navItems, setNavItems] = useState(STATIC_NAV);
  const [themeSpin, setThemeSpin] = useState(false);

  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const pollRef = useRef(null);

  const handleThemeToggle = () => {
    setThemeSpin(true);
    toggleTheme();
    setTimeout(() => setThemeSpin(false), 450);
  };

  useEffect(() => {
    axios.get('/api/public/categories').then(({ data }) => {
      const toChildren = (type) =>
        data
          .filter(c => c.type === type || (!c.type && type === 'technology'))
          .map(c => ({ label: c.name, to: `/category/${c.slug}` }));

      setNavItems(STATIC_NAV.map(item => {
        if (item.key === 'technology') return { ...item, children: toChildren('technology') };
        if (item.key === 'industries') return { ...item, children: toChildren('industry') };
        return item;
      }));
    }).catch(() => { });
  }, []);

  // Update screen category on resize & scroll
  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 8);
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('resize', handler, { passive: true });
    window.addEventListener('orientationchange', handler, { passive: true });
    return () => {
      window.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Close mobile drawer and mobile search on route navigation
  useEffect(() => {
    setMobileOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  // Close mobile drawer if resized to desktop/laptop
  useEffect(() => {
    if (!isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isMobile, mobileOpen]);

  // Autofocus mobile search input when opened
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchInputRef.current) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
    }
  }, [mobileSearchOpen]);

  // Close mobile search on escape key or outside click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setMobileSearchOpen(false);
        setSearchVisible(false);
      }
    };
    const handleClickOutside = (e) => {
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) {
        setMobileSearchOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchVisible(false);
        if (!searchQuery) setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchQuery]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await axios.get(isAdmin ? '/api/admin/notifications' : '/api/user/notifications');
      setNotifications(data);
    } catch { }
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!isAuthenticated) { setNotifications([]); return; }
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 30000);
    return () => clearInterval(pollRef.current);
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.put(isAdmin ? `/api/admin/notifications/${id}/read` : `/api/user/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { }
  };

  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchVisible(false);
      setMobileSearchOpen(false);
      setMobileOpen(false);
      setSearchQuery('');
    }
  };

  const userMenuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: isAdmin ? 'Admin Dashboard' : 'Dashboard', onClick: () => navigate(isAdmin ? '/dashboard' : '/user-dashboard') },
    { key: 'my-content', icon: <UserOutlined />, label: 'My Content', onClick: () => navigate(isAdmin ? '/dashboard/content' : '/user-dashboard/my-content') },
    ...(isAdmin
      ? [{ key: 'submissions', icon: <UserOutlined />, label: 'Submissions', onClick: () => navigate('/dashboard/submissions') }]
      : [
        { key: 'create', icon: <UserOutlined />, label: 'Create Content', onClick: () => navigate('/user-dashboard/create-post') },
        { key: 'my-submissions', icon: <UserOutlined />, label: 'My Submissions', onClick: () => navigate('/user-dashboard/my-submissions') },
      ]
    ),
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: logout, danger: true },
  ];

  return (
    <>
      <style>{`
        @keyframes navFadeDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes navSlideDown {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Granular Responsive Styles for Zero-Overlap Desktop & Laptop Navbar ── */
        @media (min-width: 768px) and (max-width: 1040px) {
          .nav-link-item {
            font-size: 11.5px !important;
            padding: 3px 5px !important;
          }
          .desktop-nav-container {
            gap: 1px !important;
          }
          .navbar-logo-img {
            height: 36px !important;
            max-width: 125px !important;
          }
          .nav-contact-btn {
            height: 34px !important;
            padding-left: 6px !important;
            padding-right: 10px !important;
            font-size: 11.5px !important;
            gap: 5px !important;
          }
          .nav-contact-icon {
            width: 22px !important;
            height: 22px !important;
          }
          .nav-join-btn {
            height: 34px !important;
            padding: 0 10px !important;
            font-size: 11.5px !important;
          }
          .nav-search-input {
            width: 45px !important;
          }
          .nav-search-input:focus {
            width: 85px !important;
          }
          .nav-theme-btn {
            width: 34px !important;
            height: 34px !important;
          }
          .nav-user-badge {
            padding: 2px 6px 2px 2px !important;
          }
          .nav-user-name {
            font-size: 11.5px !important;
            max-width: 65px !important;
          }
        }

        @media (min-width: 1041px) and (max-width: 1260px) {
          .nav-link-item {
            font-size: 12.5px !important;
            padding: 4px 7px !important;
          }
          .desktop-nav-container {
            gap: 2px !important;
          }
          .navbar-logo-img {
            height: 42px !important;
            max-width: 160px !important;
          }
          .nav-contact-btn {
            height: 36px !important;
            padding-left: 6px !important;
            padding-right: 12px !important;
            font-size: 12px !important;
            gap: 6px !important;
          }
          .nav-contact-icon {
            width: 24px !important;
            height: 24px !important;
          }
          .nav-join-btn {
            height: 36px !important;
            padding: 0 13px !important;
            font-size: 12px !important;
          }
          .nav-search-input {
            width: 55px !important;
          }
          .nav-search-input:focus {
            width: 105px !important;
          }
          .nav-theme-btn {
            width: 36px !important;
            height: 36px !important;
          }
          .nav-user-badge {
            padding: 3px 8px 3px 3px !important;
          }
          .nav-user-name {
            font-size: 12px !important;
            max-width: 85px !important;
          }
        }

        @media (min-width: 1261px) {
          .nav-link-item {
            font-size: 13.5px !important;
            padding: 5px 10px !important;
          }
          .desktop-nav-container {
            gap: 4px !important;
          }
          .navbar-logo-img {
            height: 48px !important;
            max-width: 200px !important;
          }
          .nav-contact-btn {
            height: 40px !important;
            padding-left: 6px !important;
            padding-right: 16px !important;
            font-size: 13px !important;
            gap: 8px !important;
          }
          .nav-contact-icon {
            width: 28px !important;
            height: 28px !important;
          }
          .nav-join-btn {
            height: 40px !important;
            padding: 0 18px !important;
            font-size: 13px !important;
          }
          .nav-search-input {
            width: 65px !important;
          }
          .nav-search-input:focus {
            width: 130px !important;
          }
          .nav-theme-btn {
            width: 38px !important;
            height: 38px !important;
          }
          .nav-user-badge {
            padding: 4px 12px 4px 4px !important;
          }
          .nav-user-name {
            font-size: 13px !important;
            max-width: 110px !important;
          }
        }
      `}</style>

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <header style={{
          background: scrolled
            ? (darkMode ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)')
            : (darkMode ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)'),
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
          boxShadow: scrolled
            ? (darkMode ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(11,31,77,0.08)')
            : 'none',
          transition: 'all .25s ease',
        }}>
          <div style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: isMobile ? '0 10px' : '0 clamp(10px, 1.2vw, 20px)',
            height: isMobile ? 60 : 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: isMobile ? 6 : 8,
            position: 'relative'
          }}>

            {/* Left: Brand Logo (FlexShrink 0 to never shrink or get overlapped) */}
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                {navbarLogo ? (
                  <img
                    src={navbarLogo}
                    alt="TGS TechInfo"
                    className="navbar-logo-img"
                    style={{
                      height: isMobile ? 36 : (logoSizes.navbar.height || 48),
                      maxHeight: isMobile ? 38 : 52,
                      maxWidth: isMobile ? 125 : 200,
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                ) : (
                  <span style={{
                    fontSize: isMobile ? 18 : 22,
                    fontWeight: 900,
                    color: darkMode ? '#FFFFFF' : '#0B1F4D',
                    letterSpacing: '-0.5px',
                    whiteSpace: 'nowrap'
                  }}>
                    TGS<span style={{ color: '#F7941D' }}>Tech</span><span style={{ color: '#0AAEEF' }}>Info</span>
                  </span>
                )}
              </Link>
            </div>

            {/* Center: Full Desktop Navigation Links (Flex 1 to occupy space between logo & actions without overlapping) */}
            {!isMobile && (
              <nav
                className="desktop-nav desktop-nav-container"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  minWidth: 0,
                  margin: '0 4px',
                  overflow: 'visible'
                }}
              >
                {navItems.map(item => (
                  <NavLink
                    key={item.key}
                    item={item}
                    active={location.pathname === item.to}
                    darkMode={darkMode}
                  />
                ))}
              </nav>
            )}

            {/* Right: Action Controls (FlexShrink 0 to never get crushed or overlapped) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 6 : 'clamp(5px, 0.7vw, 10px)',
              flexShrink: 0
            }}>

              {/* 1. Search Bar */}
              {!isMobile ? (
                <div ref={searchRef} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: darkMode ? 'rgba(255,255,255,0.06)' : '#EAF2FF',
                    borderRadius: 24,
                    padding: '0 8px',
                    border: darkMode ? '1px solid #334155' : '1.5px solid #CBD5E1',
                    height: 36,
                    transition: 'all .25s ease'
                  }}>
                    <SearchOutlined
                      aria-label="Search"
                      role="button"
                      tabIndex={0}
                      style={{
                        color: darkMode ? '#94A3B8' : '#0B1F4D',
                        fontSize: 13,
                        flexShrink: 0,
                        cursor: 'pointer'
                      }}
                      onClick={handleSearch}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleSearch(); }}
                    />

                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder="Search..."
                      aria-label="Search articles and publications"
                      className="nav-search-input"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        fontSize: 12,
                        padding: '0 5px',
                        color: darkMode ? '#F1F5F9' : '#0F172A',
                        transition: 'width .25s ease',
                      }}
                      onFocus={() => setSearchVisible(true)}
                      onBlur={() => { if (!searchQuery) setSearchVisible(false); }}
                    />

                    {searchQuery && (
                      <CloseOutlined
                        aria-label="Clear search input"
                        role="button"
                        tabIndex={0}
                        style={{
                          color: 'var(--color-muted)',
                          fontSize: 11,
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                        onClick={() => { setSearchQuery(''); setSearchVisible(false); }}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setSearchQuery(''); setSearchVisible(false); } }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                /* Mobile Search Icon Button */
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(prev => !prev)}
                  aria-label="Toggle search input"
                  style={{
                    background: mobileSearchOpen
                      ? (darkMode ? '#3B82F6' : '#0B1F4D')
                      : (darkMode ? 'rgba(255,255,255,0.06)' : '#EAF2FF'),
                    border: darkMode ? '1px solid #334155' : '1px solid #CBD5E1',
                    color: mobileSearchOpen ? '#FFFFFF' : (darkMode ? '#94A3B8' : '#0B1F4D'),
                    cursor: 'pointer',
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all .2s ease'
                  }}
                >
                  <SearchOutlined style={{ fontSize: 14 }} />
                </button>
              )}

              {/* 2. Contact Us Button */}
              {!isMobile && (
                <button
                  onClick={() => navigate('/contact')}
                  aria-label="Contact Us"
                  className={`nav-contact-btn group relative rounded-full font-bold transition-all duration-300 inline-flex items-center cursor-pointer select-none ${
                    darkMode
                      ? 'bg-[rgba(59,130,246,0.1)] border-[1.5px] border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white hover:shadow-[0_6px_18px_rgba(59,130,246,0.35)]'
                      : 'bg-[#EAF2FF] border-[1.5px] border-[#0B1F4D] text-[#0B1F4D] hover:bg-[#0B1F4D] hover:text-white hover:shadow-[0_6px_18px_rgba(11,31,77,0.25)]'
                  } hover:-translate-y-0.5 active:translate-y-0 shadow-xs`}
                >
                  <div className={`nav-contact-icon rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                    darkMode
                      ? 'bg-blue-500/20 text-[#38BDF8] group-hover:bg-white group-hover:text-[#3B82F6]'
                      : 'bg-white text-[#0B1F4D] shadow-xs group-hover:bg-white group-hover:text-[#0B1F4D]'
                  }`}>
                    <PhoneCall className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110 shrink-0" />
                  </div>
                  <span className="tracking-wide font-extrabold whitespace-nowrap">Contact Us</span>
                </button>
              )}

              {/* 3. Notifications (Authenticated) */}
              {isAuthenticated && (
                <Dropdown
                  open={notifOpen} onOpenChange={setNotifOpen}
                  dropdownRender={() => <NotifPanel notifications={notifications} onMarkRead={markAsRead} />}
                  trigger={['click']} placement="bottomRight"
                >
                  <Badge count={notifications.length} size="small" overflowCount={99}>
                    <button
                      type="button"
                      aria-label="View notifications"
                      className="nav-theme-btn"
                      style={{
                        background: darkMode ? 'rgba(255,255,255,0.06)' : '#EAF2FF',
                        border: darkMode ? '1px solid #334155' : '1px solid #CBD5E1',
                        cursor: 'pointer',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: darkMode ? '#F1F5F9' : '#0B1F4D',
                        transition: 'all .2s ease'
                      }}
                    >
                      <BellOutlined style={{ fontSize: isMobile ? 14 : 15 }} />
                    </button>
                  </Badge>
                </Dropdown>
              )}

              {/* 4. User Account Menu OR Join Our Community CTA */}
              {isAuthenticated ? (
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="User account menu"
                    className="nav-user-badge"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      borderRadius: 24,
                      border: darkMode ? '1.5px solid #334155' : '1.5px solid #0B1F4D',
                      background: darkMode ? 'rgba(255,255,255,0.08)' : '#EAF2FF',
                      transition: 'all .2s ease',
                      flexShrink: 0
                    }}
                  >
                    <Avatar
                      size={isMobile ? 26 : 28}
                      src={user?.avatar || null}
                      icon={<UserOutlined />}
                      style={{ background: darkMode ? '#3B82F6' : '#0B1F4D', flexShrink: 0 }}
                    />
                    {!isMobile && (
                      <span className="nav-user-name" style={{
                        fontWeight: 700,
                        color: darkMode ? '#F1F5F9' : '#0B1F4D',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {user?.first_name}
                      </span>
                    )}
                    <DownOutlined style={{ fontSize: 9, color: '#F7941D' }} />
                  </div>
                </Dropdown>
              ) : !isMobile ? (
                <ButtonWithIcon
                  onClick={() => navigate('/login')}
                  size="default"
                  className="nav-join-btn font-bold whitespace-nowrap"
                >
                  Join Our Community
                </ButtonWithIcon>
              ) : null}

              {/* 5. Dark Mode Theme Toggle */}
              <button
                type="button"
                onClick={handleThemeToggle}
                aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                className="nav-theme-btn"
                style={{
                  background: darkMode ? 'rgba(255,255,255,0.08)' : '#EAF2FF',
                  border: darkMode ? '1px solid #334155' : '1px solid #CBD5E1',
                  cursor: 'pointer',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: darkMode ? '#FBBF24' : '#0B1F4D',
                  transition: 'background .25s ease, border-color .25s ease, box-shadow .25s ease, transform .25s ease',
                  flexShrink: 0
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.16)' : '#D0E3FF';
                  e.currentTarget.style.borderColor = darkMode ? '#FBBF24' : '#0B1F4D';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#EAF2FF';
                  e.currentTarget.style.borderColor = darkMode ? '#334155' : '#CBD5E1';
                }}
              >
                <span style={{
                  display: 'inline-flex',
                  transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: themeSpin ? 'rotate(360deg) scale(1.2)' : 'rotate(0deg) scale(1)'
                }}>
                  {darkMode ? <SunOutlined style={{ fontSize: isMobile ? 14 : 15 }} /> : <MoonOutlined style={{ fontSize: isMobile ? 14 : 15 }} />}
                </span>
              </button>

              {/* 6. Mobile Hamburger Toggle - ONLY on Mobile (< 768px) */}
              {isMobile && (
                <button
                  type="button"
                  className="mobile-menu-toggle"
                  onClick={() => setMobileOpen(o => !o)}
                  aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                  style={{
                    background: mobileOpen
                      ? (darkMode ? '#3B82F6' : '#0B1F4D')
                      : (darkMode ? 'rgba(255,255,255,0.06)' : '#EAF2FF'),
                    border: darkMode ? '1px solid #334155' : '1px solid #CBD5E1',
                    cursor: 'pointer',
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: mobileOpen ? '#FFFFFF' : (darkMode ? '#F1F5F9' : '#0B1F4D'),
                    flexShrink: 0,
                    transition: 'all .2s ease'
                  }}
                >
                  {mobileOpen ? <CloseOutlined style={{ fontSize: 16 }} /> : <MenuOutlined style={{ fontSize: 16 }} />}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Full-Width Search Dropdown Bar (Only on Mobile) */}
          {isMobile && mobileSearchOpen && (
            <div
              ref={mobileSearchRef}
              style={{
                background: darkMode ? '#0F172A' : '#FFFFFF',
                padding: '10px 12px',
                borderTop: darkMode ? '1px solid #1E293B' : '1px solid #F1F5F9',
                borderBottom: darkMode ? '1px solid #334155' : '1px solid #CBD5E1',
                boxShadow: darkMode ? '0 12px 30px rgba(0,0,0,0.5)' : '0 12px 30px rgba(11,31,77,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                animation: 'navSlideDown .2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                background: darkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                borderRadius: 20,
                padding: '0 12px',
                border: darkMode ? '1px solid #334155' : '1.5px solid #CBD5E1',
                height: 38
              }}>
                <SearchOutlined style={{ color: darkMode ? '#94A3B8' : '#0B1F4D', fontSize: 14 }} />
                <input
                  ref={mobileSearchInputRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Search articles, topics, ebooks..."
                  aria-label="Search articles"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: 13,
                    padding: '0 8px',
                    width: '100%',
                    color: darkMode ? '#F1F5F9' : '#0F172A'
                  }}
                />
                {searchQuery && (
                  <CloseOutlined
                    style={{ color: 'var(--color-muted)', fontSize: 12, cursor: 'pointer' }}
                    onClick={() => setSearchQuery('')}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={handleSearch}
                style={{
                  background: '#F7941D',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 18,
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Go
              </button>
            </div>
          )}
        </header>
      </div>

      {/* Mobile Drawer Menu - ONLY shown on Mobile (< 768px) */}
      {isMobile && mobileOpen && (
        <div style={{
          position: 'fixed',
          top: 60,
          left: 0,
          right: 0,
          bottom: 0,
          background: darkMode ? '#0F172A' : '#FFFFFF',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 9998,
          overflowY: 'auto',
          padding: '16px 16px 36px',
          borderTop: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
          animation: 'navFadeDown .22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Quick Search inside Mobile Drawer */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: darkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
              borderRadius: 24,
              padding: '0 12px',
              border: darkMode ? '1px solid #334155' : '1.5px solid #CBD5E1',
              height: 42
            }}>
              <SearchOutlined style={{ color: darkMode ? '#94A3B8' : '#0B1F4D', fontSize: 15 }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search articles, ebooks, news..."
                aria-label="Search articles"
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: 14,
                  padding: '0 8px',
                  width: '100%',
                  color: darkMode ? '#F1F5F9' : '#0F172A'
                }}
              />
              {searchQuery && (
                <CloseOutlined
                  style={{ color: 'var(--color-muted)', fontSize: 13, cursor: 'pointer' }}
                  onClick={() => setSearchQuery('')}
                />
              )}
              <button
                type="button"
                onClick={handleSearch}
                style={{
                  background: '#F7941D',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 18,
                  padding: '6px 14px',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginLeft: 4
                }}
              >
                Go
              </button>
            </div>
          </div>

          {/* Navigation Links with smooth Accordion */}
          {navItems.map(item => (
            <MobileMenuItem
              key={item.key}
              item={item}
              onClose={() => setMobileOpen(false)}
              isAuthenticated={isAuthenticated}
              setIsMobileOpen={setMobileOpen}
              darkMode={darkMode}
            />
          ))}

          {/* Action Buttons for Mobile */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginTop: 22,
            paddingTop: 18,
            borderTop: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0'
          }}>
            <button
              onClick={() => {
                navigate('/contact');
                setMobileOpen(false);
              }}
              className={`w-full rounded-full py-2.5 px-4 font-bold text-sm inline-flex items-center justify-center gap-2.5 transition-all duration-300 ${
                darkMode
                  ? 'bg-slate-900 border border-slate-700 text-slate-200 hover:border-[#0AAEEF] hover:text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-800 hover:border-[#0AAEEF] hover:text-[#0AAEEF] shadow-sm'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-sky-500/10 text-[#0AAEEF] flex items-center justify-center shrink-0">
                <PhoneCall className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold whitespace-nowrap">Contact Us</span>
            </button>

            {!isAuthenticated && (
              <ButtonWithIcon
                onClick={() => {
                  navigate('/login');
                  setMobileOpen(false);
                }}
                size="default"
                className="w-full py-2.5 text-sm"
              >
                Join Our Community
              </ButtonWithIcon>
            )}
          </div>

          {/* Authenticated User Banner */}
          {isAuthenticated && (
            <div style={{
              marginTop: 22,
              paddingTop: 16,
              borderTop: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <Avatar
                size={40}
                src={user?.avatar || null}
                icon={<UserOutlined />}
                style={{ background: '#0B1F4D', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0B1F4D', fontSize: 14 }}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div style={{ fontSize: 12, color: darkMode ? '#94A3B8' : '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <LogoutOutlined />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;