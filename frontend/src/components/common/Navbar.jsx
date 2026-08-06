import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dropdown, Button, Avatar, Badge, List, Typography, Empty, Tag } from 'antd';
import {
  UserOutlined, LogoutOutlined, DashboardOutlined,
  MenuOutlined, CloseOutlined, SearchOutlined, BellOutlined,
  CheckOutlined, DownOutlined, RightOutlined, SunOutlined, MoonOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import axios from 'axios';

const { Text } = Typography;

const NOTIF_COLOR = {
  review: 'blue', approved: 'green', published: 'purple',
  rejected: 'red', changes_requested: 'orange', delete: 'red',
};

const STATIC_NAV = [
  { key: 'home', label: 'Home', to: '/' },
  {
    key: 'insights', label: 'Insights',
    children: [
      { label: 'Articles', to: '/articles' },
      { label: 'Interviews', to: '/interviews' },
      { label: 'News', to: '/news' },
      { label: 'eBooks', to: '/ebooks' },
    ]
  },
  {
    key: 'resources', label: 'Resources',
    children: [
      { label: 'Blog', to: '/blogs' },
      { label: 'Whitepaper', to: '/category/whitepaper' },
      { label: 'Webinar', to: '/webinars' },
      { label: 'Events', to: '/events' },
      { label: 'Case Study', to: '/case-studies' },
    ]
  },
  { key: 'technology', label: 'Technology', dynamic: true },
  
  { key: 'industries', label: 'Industries', dynamic: true },
  { key: 'about', label: 'About', to: '/about' },
  { key: 'contact', label: 'Contact', to: '/contact' },
];

// ── Dropdown panel ─ fixed position ─────────────────────────────
const MegaPanel = ({ items, onClose, anchorRect, onMouseEnter, onMouseLeave }) => {
  if (!anchorRect) return null;
  const left = Math.max(8, anchorRect.left + anchorRect.width / 2 - 130);
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
      position: 'fixed',
      top: anchorRect.bottom + 8,
      left,
      zIndex: 99999,
      background: 'var(--color-surface)',
      borderRadius: 14,
      padding: '10px 6px',
      boxShadow: '0 12px 48px rgba(11,31,77,0.16)',
      border: '1px solid var(--color-border)',
      minWidth: 220,
      animation: 'navFadeDown .18s ease'
    }}>
      {/* arrow */}
      <div style={{
        position: 'absolute', top: -7, left: 130 - 8,
        width: 14, height: 14, background: 'var(--color-surface)',
        border: '1px solid var(--color-border)', borderBottom: 'none', borderRight: 'none',
        transform: 'rotate(45deg)', borderRadius: '2px 0 0 0'
      }} />
      {items.map(item => (
        <Link key={item.label} to={item.to} onClick={onClose} style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '9px 14px', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 500, color: 'var(--color-heading)',
            transition: 'background .15s, color .15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-light)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-heading)'; }}
          >
            {item.label}
          </div>
        </Link>
      ))}
    </div>
  );
};

// ── Nav link ─────────────────────────────────────────────────────
const NavLink = ({ item, active }) => {
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
        fontSize: 13.5, fontWeight: 600, color: active ? 'var(--color-primary)' : 'var(--color-heading)',
        textDecoration: 'none', padding: '4px 2px', position: 'relative',
        transition: 'color .2s', whiteSpace: 'nowrap'
      }}>
        {item.label}
        <span style={{
          position: 'absolute', bottom: -2, left: 0, right: 0, height: 2,
          background: 'var(--color-primary)', borderRadius: 2,
          transform: active ? 'scaleX(1)' : 'scaleX(0)',
          transition: 'transform .22s', transformOrigin: 'left'
        }} />
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
          background: open ? 'var(--color-primary-light)' : 'none',
          border: 'none', cursor: 'pointer',
          fontSize: 13.5, fontWeight: 600,
          color: open ? 'var(--color-primary)' : 'var(--color-heading)',
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 8,
          transition: 'all .2s', whiteSpace: 'nowrap'
        }}
      >
        {item.label}
        <DownOutlined style={{
          fontSize: 9,
          transition: 'transform .22s',
          transform: open ? 'rotate(180deg)' : 'none'
        }} />
      </button>
      {open && (
        <MegaPanel
          items={item.children}
          onClose={() => setOpen(false)}
          anchorRect={rect}
          onMouseEnter={() => clearTimeout(closeTimer.current)}
          onMouseLeave={handleMouseLeave}
        />
      )}
    </div>
  );
};

// ── Mobile Menu Item with Dropdown ──────────────────────────────
const MobileMenuItem = ({ item, onClose, isAuthenticated, setIsMobileOpen }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!item.children) {
    return (
      <Link to={item.to} onClick={() => { onClose(); setIsMobileOpen(false); }} style={{
        display: 'block',
        padding: '14px 0',
        fontSize: 16,
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
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--color-heading)',
          transition: 'color .2s'
        }}
      >
        <span>{item.label}</span>
        <span style={{
          transition: 'transform .3s ease',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--color-muted)'
        }}>
          <RightOutlined style={{ fontSize: 14 }} />
        </span>
      </button>
      <div style={{
        maxHeight: isOpen ? '500px' : '0',
        overflow: 'hidden',
        transition: 'max-height .3s ease, opacity .3s ease, margin .3s ease',
        opacity: isOpen ? 1 : 0,
        marginBottom: isOpen ? '8px' : '0'
      }}>
        {item.children.map(child => (
          <Link
            key={child.label}
            to={child.to}
            onClick={() => { onClose(); setIsMobileOpen(false); }}
            style={{
              display: 'block',
              padding: '10px 0 10px 16px',
              fontSize: 15,
              fontWeight: 500,
              color: 'var(--color-body)',
              textDecoration: 'none',
              borderRadius: 8,
              transition: 'background .2s, color .2s, padding-left .2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--color-primary-light)';
              e.currentTarget.style.color = 'var(--color-primary)';
              e.currentTarget.style.paddingLeft = '22px';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-body)';
              e.currentTarget.style.paddingLeft = '16px';
            }}
          >
            {child.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

// ── Notification panel ───────────────────────────────────────────
const NotifPanel = ({ notifications, onMarkRead }) => (
  <div style={{
    width: 360, background: 'var(--color-surface)', borderRadius: 14,
    boxShadow: '0 8px 40px rgba(11,31,77,0.12)', border: '1px solid var(--color-border)', overflow: 'hidden'
  }}>
    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', fontWeight: 700, fontSize: 14, color: 'var(--color-heading)', display: 'flex', alignItems: 'center', gap: 8 }}>
      Notifications
      {notifications.length > 0 && <Tag color="blue" style={{ borderRadius: 10, fontSize: 11 }}>{notifications.length}</Tag>}
    </div>
    {notifications.length === 0
      ? <Empty description="No new notifications" style={{ padding: '28px 0' }} />
      : <List style={{ maxHeight: 380, overflowY: 'auto' }} dataSource={notifications}
          renderItem={item => (
            <List.Item style={{ padding: '10px 18px', alignItems: 'flex-start' }}
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
  const searchRef = useRef(null);
  const pollRef = useRef(null);

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
    }).catch(() => {});
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
    } catch {}
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
    } catch {}
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
    { key: 'dashboard', icon: <DashboardOutlined />, label: isAdmin ? 'Admin Dashboard' : 'Dashboard', onClick: () => navigate(isAdmin ? '/admin' : '/dashboard') },
    { key: 'my-content', icon: <UserOutlined />, label: 'My Content', onClick: () => navigate('/my-content') },
    ...(isAdmin
      ? [{ key: 'submissions', icon: <UserOutlined />, label: 'Submissions', onClick: () => navigate('/admin/submissions') }]
      : [
          { key: 'create', icon: <UserOutlined />, label: 'Create Content', onClick: () => navigate('/create-content') },
          { key: 'my-submissions', icon: <UserOutlined />, label: 'My Submissions', onClick: () => navigate('/my-submissions') },
        ]
    ),
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: logout, danger: true },
  ];

  const showCondensedNav = isLaptop || isMobile;

  return (
    <>
      <style>{`
        @keyframes navFadeDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>

      <header style={{
        background: scrolled ? (darkMode ? 'rgba(15,23,42,0.98)' : 'rgba(255,255,255,0.98)') : 'var(--color-surface)',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        boxShadow: scrolled ? '0 4px 24px rgba(11,31,77,0.09)' : '0 1px 0 var(--color-border)',
        transition: 'box-shadow .3s, background .3s',
      }}>
        <div style={{ 
          maxWidth: 1280, 
          margin: '0 auto', 
          padding: isMobile ? '0 12px' : isLaptop ? '0 16px' : '0 24px', 
          height: 58, 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? 12 : isLaptop ? 16 : 24 
        }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            {navbarLogo ? (
              <img src={navbarLogo} alt="TGS TechInfo" style={{ 
                height: isMobile ? 50 : isLaptop ? 55 : (logoSizes.navbar.height || 65), 
                width: 'auto', 
                display: 'block' 
              }} />
            ) : (
              <span style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--color-text)' }}>TGS TechInfo</span>
            )}
          </Link>

          {/* Desktop nav - Hide on mobile */}
          {!isMobile && (
            <nav style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              gap: isLaptop ? 8 : 16, 
              minWidth: 0,
              overflow: 'hidden'
            }}>
              {navItems.map(item => {
                return (
                  <NavLink key={item.key} item={item} active={location.pathname === item.to} />
                );
              })}
            </nav>
          )}

          {/* Right actions */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? 4 : isLaptop ? 6 : 8, 
            flexShrink: 0, 
            marginLeft: 'auto' 
          }}>

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                width: isMobile ? 32 : 36,
                height: isMobile ? 32 : 36,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-muted)',
                transition: 'background .2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-light)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {darkMode ? <SunOutlined style={{ fontSize: isMobile ? 14 : 16 }} /> : <MoonOutlined style={{ fontSize: isMobile ? 14 : 16 }} />}
            </button>

            {/* Search — compact bar */}
            <div ref={searchRef} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--color-primary-light)', borderRadius: 24,
                padding: isMobile ? '0 8px' : '0 12px',
                border: '1.5px solid var(--color-border)',
                transition: 'border-color .2s'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <SearchOutlined style={{ 
                  color: 'var(--color-primary)', 
                  fontSize: isMobile ? 12 : 13, 
                  flexShrink: 0,
                  cursor: 'pointer'
                }} onClick={() => { if (isMobile) setSearchVisible(!searchVisible); }} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder={isMobile ? "Search..." : "Search..."}
                  style={{
                    border: 'none', background: 'transparent', outline: 'none',
                    fontSize: isMobile ? 12 : 13, 
                    padding: isMobile ? '5px 6px' : '7px 8px',
                    width: isMobile ? (searchVisible ? 140 : 0) : (searchVisible ? (isLaptop ? 120 : 180) : (isLaptop ? 80 : 130)),
                    maxWidth: isMobile ? (searchVisible ? 160 : 0) : (isLaptop ? 140 : 180),
                    overflow: 'hidden',
                    color: 'var(--color-heading)',
                    transition: 'width .25s ease',
                  }}
                  onFocus={() => setSearchVisible(true)}
                  onBlur={() => { if (!searchQuery) setSearchVisible(false); }}
                />
                {searchQuery && (
                  <CloseOutlined
                    style={{ 
                      color: 'var(--color-muted)', 
                      fontSize: isMobile ? 10 : 11, 
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
                    background: 'none', border: 'none', cursor: 'pointer',
                    width: isMobile ? 32 : 36, 
                    height: isMobile ? 32 : 36, 
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-muted)', transition: 'background .2s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-light)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <BellOutlined style={{ fontSize: isMobile ? 14 : 16 }} />
                  </button>
                </Badge>
              </Dropdown>
            )}

            {/* User */}
            {isAuthenticated ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8, 
                  cursor: 'pointer',
                  padding: isMobile ? '4px 8px 4px 4px' : '5px 12px 5px 6px', 
                  borderRadius: 24,
                  border: '1.5px solid var(--color-primary-light)', 
                  background: 'var(--color-primary-light)',
                  transition: 'border-color .2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-primary-light)'}
                >
                  <Avatar 
                    size={isMobile ? 22 : 26} 
                    icon={<UserOutlined />} 
                    style={{ background: 'var(--color-primary)', flexShrink: 0 }} 
                  />
                  {!isMobile && !isLaptop && (
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-heading)' }}>
                      {user?.first_name}
                    </span>
                  )}
                  {!isMobile && (
                    <DownOutlined style={{ fontSize: 9, color: 'var(--color-primary)' }} />
                  )}
                </div>
              </Dropdown>
            ) : !isMobile ? (
              <div style={{ display: 'flex', gap: isLaptop ? 4 : 8 }}>
                <button onClick={() => window.open('/login', '_blank')} style={{
                  padding: isLaptop ? '5px 12px' : '7px 18px', 
                  borderRadius: 24, 
                  border: '1.5px solid var(--color-primary)',
                  background: 'transparent', 
                  color: 'var(--color-primary)', 
                  fontSize: isLaptop ? 12 : 13, 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  transition: 'all .2s',
                  whiteSpace: 'nowrap'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                >
                  Login
                </button>
                <button onClick={() => navigate('/register')} style={{
                  padding: isLaptop ? '5px 12px' : '7px 18px', 
                  borderRadius: 24, 
                  border: 'none',
                  background: 'var(--color-accent)', 
                  color: '#fff',
                  fontSize: isLaptop ? 12 : 13, 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(247,148,29,.3)', 
                  transition: 'opacity .2s',
                  whiteSpace: 'nowrap'
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Register
                </button>
              </div>
            ) : null}

            {/* Mobile toggle */}
            {isMobile && (
              <button
                onClick={() => setMobileOpen(o => !o)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  width: 32, height: 32, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-heading)', flexShrink: 0
                }}
              >
                {mobileOpen ? <CloseOutlined style={{ fontSize: 16 }} /> : <MenuOutlined style={{ fontSize: 16 }} />}
              </button>
            )}
          </div>
        </div>
      </header>
      </div>

      {/* Mobile menu with dropdown support */}
      {isMobile && mobileOpen && (
        <div style={{
          position: 'fixed', 
          top: 58, 
          left: 0, 
          right: 0, 
          bottom: 0,
          background: 'var(--color-surface)', 
          zIndex: 9998, 
          overflowY: 'auto', 
          padding: '16px 20px 24px',
          borderTop: '1px solid var(--color-border)'
        }}>
          {/* Close button at top */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            marginBottom: 8 
          }}>
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                background: 'var(--color-primary-light)',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--color-primary)',
                fontSize: 16
              }}
            >
              <CloseOutlined />
            </button>
          </div>

          {/* Navigation items with dropdown */}
          {navItems.map(item => (
            <MobileMenuItem 
              key={item.key} 
              item={item} 
              onClose={() => setMobileOpen(false)}
              isAuthenticated={isAuthenticated}
              setIsMobileOpen={setMobileOpen}
            />
          ))}

          {/* User actions in mobile menu */}
          {!isAuthenticated && (
            <div style={{ 
              display: 'flex', 
              gap: 10, 
              marginTop: 20, 
              paddingTop: 16, 
              borderTop: '1px solid var(--color-border)' 
            }}>
              <button 
                onClick={() => { 
                  window.open('/login', '_blank'); 
                  setMobileOpen(false); 
                }} 
                style={{
                  flex: 1, 
                  padding: '12px', 
                  borderRadius: 12, 
                  border: '1.5px solid var(--color-primary)',
                  background: 'transparent', 
                  color: 'var(--color-primary)', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  cursor: 'pointer'
                }}
              >
                Login
              </button>
              <button 
                onClick={() => { 
                  navigate('/register'); 
                  setMobileOpen(false); 
                }} 
                style={{
                  flex: 1, 
                  padding: '12px', 
                  borderRadius: 12, 
                  border: 'none',
                  background: 'var(--color-accent)', 
                  color: '#fff',
                  fontSize: 14, 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(247,148,29,.3)'
                }}
              >
                Register
              </button>
            </div>
          )}

          {/* User info when authenticated */}
          {isAuthenticated && (
            <div style={{ 
              marginTop: 20, 
              paddingTop: 16, 
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <Avatar 
                size={40} 
                icon={<UserOutlined />} 
                style={{ background: 'var(--color-primary)' }} 
              />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-heading)' }}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                  {user?.email}
                </div>
              </div>
            </div>
          )}

          {/* Version info */}
          <div style={{ 
            marginTop: 24, 
            textAlign: 'center', 
            fontSize: 11, 
            color: 'var(--color-muted)',
            opacity: 0.6
          }}>
            v1.0.0
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;