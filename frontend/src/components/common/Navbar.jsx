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
import { Button as EnhancedButton } from '@/components/ui/button';
import { ButtonWithIcon } from '@/components/ui/button-witn-icon';
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
      { label: 'Whitepapers', desc: 'Research reports & benchmarks', to: '/category/whitepaper', icon: <FolderOpenOutlined /> },
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

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        top: anchorRect.bottom + 10,
        left,
        width,
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
        position: 'absolute', top: -7, left: width / 2 - 7,
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
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: darkMode ? '#1E293B' : '#FFF4E8',
                  border: darkMode ? '1px solid #334155' : '1px solid #FFE0B2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F7941D',
                  fontSize: 16,
                  flexShrink: 0
                }}>
                  {item.icon}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: darkMode ? '#F1F5F9' : '#0B1F4D',
                  lineHeight: 1.3
                }}>
                  {item.label}
                </div>
                {item.desc && (
                  <div style={{
                    fontSize: 11.5,
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
      <Link to={item.to} style={{
        fontSize: 13.5,
        fontWeight: active ? 700 : 600,
        color: active
          ? (darkMode ? '#3B82F6' : '#0B1F4D')
          : (darkMode ? '#CBD5E1' : '#0F172A'),
        textDecoration: 'none',
        padding: '5px 10px',
        borderRadius: 20,
        background: active
          ? (darkMode ? 'rgba(59, 130, 246, 0.15)' : '#EAF2FF')
          : 'transparent',
        transition: 'all .2s ease',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative'
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
        style={{
          background: open
            ? (darkMode ? 'rgba(59, 130, 246, 0.15)' : '#EAF2FF')
            : 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13.5,
          fontWeight: open ? 700 : 600,
          color: open
            ? (darkMode ? '#3B82F6' : '#0B1F4D')
            : (darkMode ? '#CBD5E1' : '#0F172A'),
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '5px 10px',
          borderRadius: 20,
          transition: 'all .2s ease',
          whiteSpace: 'nowrap'
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
        {item.label}
        <DownOutlined style={{ fontSize: 10, transition: 'transform .2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
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

// ── Mobile Menu Item with Dropdown Accordion ──────────────────────────────
const MobileMenuItem = ({ item, onClose, isAuthenticated, setIsMobileOpen }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!item.children) {
    return (
      <Link to={item.to} onClick={() => { onClose(); setIsMobileOpen(false); }} style={{
        display: 'block',
        padding: '14px 0',
        fontSize: 15,
        fontWeight: 600,
        color: 'var(--color-heading)',
        textDecoration: 'none',
        borderBottom: '1px solid var(--color-border)'
      }}>
        {item.label}
      </Link>
    );
  }

  return (
    <div style={{ borderBottom: '1px solid var(--color-border)' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '14px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--color-heading)'
        }}
      >
        <span>{item.label}</span>
        <span style={{
          transition: 'transform .3s ease',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          display: 'flex',
          alignItems: 'center',
          color: '#F7941D'
        }}>
          <RightOutlined style={{ fontSize: 13 }} />
        </span>
      </button>

      <div style={{
        maxHeight: isOpen ? '500px' : '0',
        overflow: 'hidden',
        transition: 'max-height .3s ease, opacity .3s ease',
        opacity: isOpen ? 1 : 0,
        marginBottom: isOpen ? '8px' : '0'
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
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--color-body)',
              textDecoration: 'none',
              borderRadius: 10,
              marginBottom: 4,
              transition: 'background .2s, color .2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#EAF2FF';
              e.currentTarget.style.color = '#0B1F4D';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-body)';
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
    width: 360,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [isLaptop, setIsLaptop] = useState(window.innerWidth > 900 && window.innerWidth <= 1200);
  const [navItems, setNavItems] = useState(STATIC_NAV);
  const [themeSpin, setThemeSpin] = useState(false);
  const searchRef = useRef(null);
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

  useEffect(() => {
    const handler = () => {
      const width = window.innerWidth;
      setScrolled(window.scrollY > 8);
      setIsMobile(width <= 900);
      setIsLaptop(width > 900 && width <= 1200);
    };
    window.addEventListener('scroll', handler);
    window.addEventListener('resize', handler);
    return () => { window.removeEventListener('scroll', handler); window.removeEventListener('resize', handler); };
  }, []);

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

  useEffect(() => {
    const handler = e => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchVisible(false); setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchVisible(false); setSearchQuery('');
    }
  };

  const userMenuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: isAdmin ? 'Admin Dashboard' : 'Dashboard', onClick: () => navigate(isAdmin ? '/admin' : '/user-dashboard') },
    { key: 'my-content', icon: <UserOutlined />, label: 'My Content', onClick: () => navigate(isAdmin ? '/admin/content' : '/user-dashboard/my-content') },
    ...(isAdmin
      ? [{ key: 'submissions', icon: <UserOutlined />, label: 'Submissions', onClick: () => navigate('/admin/submissions') }]
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
        @keyframes communityPulseGlow {
          0% { box-shadow: 0 3px 12px rgba(247, 148, 29, 0.35); }
          100% { box-shadow: 0 6px 20px rgba(247, 148, 29, 0.6); }
        }
      `}</style>

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <header style={{
          background: scrolled
            ? (darkMode ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)')
            : (darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)'),
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
          boxShadow: scrolled
            ? (darkMode ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(11,31,77,0.08)')
            : 'none',
          transition: 'all .3s ease',
        }}>
          <div style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: isMobile ? '0 12px' : '0 20px',
            height: 62,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: isMobile ? 8 : 14
          }}>

            {/* Brand Logo */}
            <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
              {navbarLogo ? (
                <img src={navbarLogo} alt="TGS TechInfo" style={{
                  height: isMobile ? 42 : isLaptop ? 46 : (logoSizes.navbar.height || 52),
                  width: 'auto',
                  display: 'block'
                }} />
              ) : (
                <span style={{
                  fontSize: 21,
                  fontWeight: 900,
                  color: '#0B1F4D',
                  letterSpacing: '-0.5px'
                }}>
                  TGS<span style={{ color: '#F7941D' }}>Tech</span><span style={{ color: '#0AAEEF' }}>Info</span>
                </span>
              )}
            </Link>

            {/* Desktop Navigation Links */}
            {!isMobile && (
              <nav style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                flexShrink: 1,
                minWidth: 0
              }}>
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

            {/* Right Action Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0
            }}>

              {/* Compact Expanding Search Bar */}
              <div ref={searchRef} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: darkMode ? 'rgba(255,255,255,0.06)' : '#EAF2FF',
                  borderRadius: 24,
                  padding: '0 10px',
                  border: darkMode ? '1px solid #334155' : '1.5px solid #CBD5E1',
                  transition: 'all .25s ease'
                }}>
                  <SearchOutlined style={{
                    color: '#0B1F4D',
                    fontSize: 13,
                    flexShrink: 0,
                    cursor: 'pointer'
                  }} onClick={() => { if (isMobile) setSearchVisible(!searchVisible); }} />

                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Search..."
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: 12.5,
                      padding: '6px 6px',
                      width: isMobile ? (searchVisible ? 110 : 0) : (searchVisible ? 140 : 70),
                      overflow: 'hidden',
                      color: darkMode ? '#F1F5F9' : '#0F172A',
                      transition: 'width .25s ease',
                    }}
                    onFocus={() => setSearchVisible(true)}
                    onBlur={() => { if (!searchQuery) setSearchVisible(false); }}
                  />

                  {searchQuery && (
                    <CloseOutlined
                      style={{
                        color: 'var(--color-muted)',
                        fontSize: 11,
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      onClick={() => { setSearchQuery(''); setSearchVisible(false); }}
                    />
                  )}
                </div>
              </div>

              {/* Notifications */}
              {isAuthenticated && (
                <Dropdown
                  open={notifOpen} onOpenChange={setNotifOpen}
                  dropdownRender={() => <NotifPanel notifications={notifications} onMarkRead={markAsRead} />}
                  trigger={['click']} placement="bottomRight"
                >
                  <Badge count={notifications.length} size="small" overflowCount={99}>
                    <button style={{
                      background: darkMode ? 'rgba(255,255,255,0.06)' : '#EAF2FF',
                      border: darkMode ? '1px solid #334155' : '1px solid #CBD5E1',
                      cursor: 'pointer',
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0B1F4D',
                      transition: 'all .2s ease'
                    }}>
                      <BellOutlined style={{ fontSize: 16 }} />
                    </button>
                  </Badge>
                </Dropdown>
              )}

              {/* User Account / Auth Actions */}
              {isAuthenticated ? (
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    padding: '4px 12px 4px 4px',
                    borderRadius: 24,
                    border: '1.5px solid #0B1F4D',
                    background: '#EAF2FF',
                    transition: 'all .2s ease'
                  }}>
                    <Avatar
                      size={28}
                      icon={<UserOutlined />}
                      style={{ background: '#0B1F4D', flexShrink: 0 }}
                    />
                    {!isMobile && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0B1F4D' }}>
                        {user?.first_name}
                      </span>
                    )}
                    <DownOutlined style={{ fontSize: 9, color: '#F7941D' }} />
                  </div>
                </Dropdown>
              ) : !isMobile ? (
                <div style={{ display: 'flex', gap: isLaptop ? 6 : 10, alignItems: 'center' }}>
                  {/* Contact Us Button - Brand Navy #0B1F4D with Balanced Icon Circle */}
                  <button
                    onClick={() => navigate('/contact')}
                    className={`group relative rounded-full font-bold transition-all duration-300 inline-flex items-center cursor-pointer select-none ${
                      isLaptop ? 'h-9 pl-1.5 pr-4 text-xs gap-2' : 'h-10 pl-1.5 pr-5 text-[13px] gap-2.5'
                    } ${
                      darkMode
                        ? 'bg-[rgba(59,130,246,0.1)] border-[1.5px] border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white hover:shadow-[0_6px_18px_rgba(59,130,246,0.35)]'
                        : 'bg-[#EAF2FF] border-[1.5px] border-[#0B1F4D] text-[#0B1F4D] hover:bg-[#0B1F4D] hover:text-white hover:shadow-[0_6px_18px_rgba(11,31,77,0.25)]'
                    } hover:-translate-y-0.5 active:translate-y-0 shadow-sm`}
                  >
                    <div
                      className={`rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                        isLaptop ? 'w-6 h-6' : 'w-7 h-7'
                      } ${
                        darkMode
                          ? 'bg-blue-500/20 text-[#38BDF8] group-hover:bg-white group-hover:text-[#3B82F6]'
                          : 'bg-white text-[#0B1F4D] shadow-xs group-hover:bg-white group-hover:text-[#0B1F4D]'
                      }`}
                    >
                      <PhoneCall className={`${isLaptop ? 'w-3 h-3' : 'w-3.5 h-3.5'} transition-transform duration-300 group-hover:scale-110 shrink-0`} />
                    </div>
                    <span className="tracking-wide font-extrabold whitespace-nowrap">Contact Us</span>
                  </button>

                  {/* Join Our Community Button - button-witn-icon design */}
                  <ButtonWithIcon
                    onClick={() => navigate('/login')}
                    size={isLaptop ? 'sm' : 'default'}
                    className={isLaptop ? 'h-9 text-xs' : 'h-10 text-[13px]'}
                  >
                    Join Our Community
                  </ButtonWithIcon>
                </div>
              ) : null}

              {/* Dark Mode Theme Toggle - Placed RIGHT of Join Our Community / User Profile */}
              <button
                onClick={handleThemeToggle}
                aria-label="Toggle Theme"
                style={{
                  background: darkMode ? 'rgba(255,255,255,0.08)' : '#EAF2FF',
                  border: darkMode ? '1px solid #334155' : '1px solid #CBD5E1',
                  cursor: 'pointer',
                  width: isLaptop ? 36 : 38,
                  height: isLaptop ? 36 : 38,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: darkMode ? '#FBBF24' : '#0B1F4D',
                  transition: 'background .25s ease, border-color .25s ease, box-shadow .25s ease, transform .25s ease',
                  flexShrink: 0,
                  marginLeft: 2
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.16)' : '#D0E3FF';
                  e.currentTarget.style.borderColor = darkMode ? '#FBBF24' : '#0B1F4D';
                  e.currentTarget.style.boxShadow = darkMode
                    ? '0 0 12px rgba(251, 191, 36, 0.35)'
                    : '0 0 12px rgba(11, 31, 77, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#EAF2FF';
                  e.currentTarget.style.borderColor = darkMode ? '#334155' : '#CBD5E1';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{
                  display: 'inline-flex',
                  transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: themeSpin ? 'rotate(360deg) scale(1.25)' : 'rotate(0deg) scale(1)'
                }}>
                  {darkMode ? <SunOutlined style={{ fontSize: 15 }} /> : <MoonOutlined style={{ fontSize: 15 }} />}
                </span>
              </button>

              {/* Mobile Hamburger Icon */}
              {isMobile && (
                <button
                  onClick={() => setMobileOpen(o => !o)}
                  aria-label="Toggle Mobile Menu"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-heading)',
                    flexShrink: 0
                  }}
                >
                  {mobileOpen ? <CloseOutlined style={{ fontSize: 18 }} /> : <MenuOutlined style={{ fontSize: 18 }} />}
                </button>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobile && mobileOpen && (
        <div style={{
          position: 'fixed',
          top: 62,
          left: 0,
          right: 0,
          bottom: 0,
          background: darkMode ? '#0F172A' : '#FFFFFF',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 9998,
          overflowY: 'auto',
          padding: '20px 20px 32px',
          borderTop: darkMode ? '1px solid #334155' : '1px solid #E2E8F0'
        }}>
          {/* Navigation Items */}
          {navItems.map(item => (
            <MobileMenuItem
              key={item.key}
              item={item}
              onClose={() => setMobileOpen(false)}
              isAuthenticated={isAuthenticated}
              setIsMobileOpen={setMobileOpen}
            />
          ))}

          {/* Action Buttons for Mobile */}
          {!isAuthenticated && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: 24,
              paddingTop: 20,
              borderTop: '1px solid var(--color-border)'
            }}>
              <button
                onClick={() => {
                  navigate('/contact');
                  setMobileOpen(false);
                }}
                className={`w-full rounded-full py-2.5 px-4 font-bold text-sm inline-flex items-center justify-center gap-2.5 transition-all duration-300 ${
                  darkMode
                    ? 'bg-slate-900/90 border border-slate-700 text-slate-200 hover:border-[#0AAEEF] hover:text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-800 hover:border-[#0AAEEF] hover:text-[#0AAEEF] shadow-sm'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-sky-500/10 text-[#0AAEEF] flex items-center justify-center shrink-0">
                  <PhoneCall className="w-3.5 h-3.5" />
                </div>
                <span className="font-extrabold whitespace-nowrap">Contact Us</span>
              </button>

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
            </div>
          )}

          {/* Authenticated User Banner */}
          {isAuthenticated && (
            <div style={{
              marginTop: 24,
              paddingTop: 18,
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <Avatar
                size={40}
                icon={<UserOutlined />}
                style={{ background: '#0B1F4D' }}
              />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-heading)' }}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  {user?.email}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;