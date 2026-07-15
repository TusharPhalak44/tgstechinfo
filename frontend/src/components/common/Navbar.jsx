import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dropdown, Button, Avatar, Badge, List, Typography, Empty, Tag } from 'antd';
import {
  UserOutlined, LogoutOutlined, DashboardOutlined,
  MenuOutlined, CloseOutlined, SearchOutlined, BellOutlined,
  CheckOutlined, DownOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
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
    ]
  },
  { key: 'technology', label: 'Technology', dynamic: true },
  { key: 'industries', label: 'Industries', dynamic: true },
  { key: 'newsletter', label: 'Newsletter', to: '/newsletter' },
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
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [navItems, setNavItems] = useState(STATIC_NAV);
  const searchRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    axios.get('/api/public/categories').then(({ data }) => {
      const toChildren = (type) =>
        data
          .filter(c => c.type === type)
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
      setScrolled(window.scrollY > 8);
      setIsMobile(window.innerWidth <= 900);
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
        background: scrolled ? 'rgba(255,255,255,0.98)' : 'var(--color-surface)',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        boxShadow: scrolled ? '0 4px 24px rgba(11,31,77,0.09)' : '0 1px 0 var(--color-border)',
        transition: 'box-shadow .3s, background .3s',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', gap: 24 }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <img src="/logo.jpg" alt="TGS TechInfo" style={{ height: 52, width: 'auto', display: 'block' }} />
          </Link>

          {/* Desktop nav */}
          {!isMobile && (
            <nav style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
              {navItems.map(item => (
                <NavLink key={item.key} item={item} active={location.pathname === item.to} />
              ))}
            </nav>
          )}

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 'auto' }}>

            {/* Search */}
            <div ref={searchRef} style={{ display: 'flex', alignItems: 'center' }}>
              {searchVisible ? (
                <div style={{
                  display: 'flex', alignItems: 'center',
                  background: 'var(--color-primary-light)', borderRadius: 24,
                  padding: '0 12px', border: '1.5px solid var(--color-primary)'
                }}>
                  <SearchOutlined style={{ color: 'var(--color-primary)', fontSize: 13 }} />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Search..."
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, padding: '7px 8px', width: 180, color: 'var(--color-heading)' }}
                  />
                  <CloseOutlined style={{ color: 'var(--color-muted)', fontSize: 11, cursor: 'pointer' }} onClick={() => { setSearchVisible(false); setSearchQuery(''); }} />
                </div>
              ) : (
                <button onClick={() => setSearchVisible(true)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  width: 36, height: 36, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-muted)', transition: 'background .2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-light)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <SearchOutlined style={{ fontSize: 16 }} />
                </button>
              )}
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
                    width: 36, height: 36, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-muted)', transition: 'background .2s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-light)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <BellOutlined style={{ fontSize: 16 }} />
                  </button>
                </Badge>
              </Dropdown>
            )}

            {/* User */}
            {isAuthenticated ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '5px 12px 5px 6px', borderRadius: 24,
                  border: '1.5px solid var(--color-primary-light)', background: 'var(--color-primary-light)',
                  transition: 'border-color .2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-primary-light)'}
                >
                  <Avatar size={26} icon={<UserOutlined />} style={{ background: 'var(--color-primary)', flexShrink: 0 }} />
                  {!isMobile && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-heading)' }}>{user?.first_name}</span>}
                  <DownOutlined style={{ fontSize: 9, color: 'var(--color-primary)' }} />
                </div>
              </Dropdown>
            ) : !isMobile ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => navigate('/login')} style={{
                  padding: '7px 18px', borderRadius: 24, border: '1.5px solid var(--color-primary)',
                  background: 'transparent', color: 'var(--color-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all .2s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                >
                  Login
                </button>
                <button onClick={() => navigate('/register')} style={{
                  padding: '7px 18px', borderRadius: 24, border: 'none',
                  background: 'var(--color-accent)', color: '#fff',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(247,148,29,.3)', transition: 'opacity .2s'
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
                  width: 36, height: 36, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-heading)', flexShrink: 0
                }}
              >
                {mobileOpen ? <CloseOutlined style={{ fontSize: 18 }} /> : <MenuOutlined style={{ fontSize: 18 }} />}
              </button>
            )}
          </div>
        </div>
      </header>
      </div>

      {/* Mobile menu */}
      {isMobile && mobileOpen && (
        <div style={{
          position: 'fixed', top: 61, left: 0, right: 0, bottom: 0,
          background: 'var(--color-surface)', zIndex: 9998, overflowY: 'auto', padding: '16px 20px',
          borderTop: '1px solid var(--color-border)'
        }}>
          {navItems.map(item => (
            <div key={item.key}>
              {item.to
                ? <Link to={item.to} onClick={() => setMobileOpen(false)} style={{
                    display: 'block', padding: '12px 0', fontSize: 15, fontWeight: 600,
                    color: 'var(--color-heading)', textDecoration: 'none', borderBottom: '1px solid var(--color-border)'
                  }}>{item.label}</Link>
                : <>
                    <div style={{ padding: '12px 0 6px', fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1.2 }}>{item.label}</div>
                    {item.children?.map(c => (
                      <Link key={c.label} to={c.to} onClick={() => setMobileOpen(false)} style={{
                        display: 'block', padding: '9px 12px', fontSize: 14, color: 'var(--color-body)',
                        textDecoration: 'none', borderRadius: 8
                      }}>{c.label}</Link>
                    ))}
                  </>
              }
            </div>
          ))}
          {!isAuthenticated && (
            <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
              <button onClick={() => { navigate('/login'); setMobileOpen(false); }} style={{
                flex: 1, padding: '10px', borderRadius: 24, border: '1.5px solid var(--color-primary)',
                background: 'transparent', color: 'var(--color-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}>Login</button>
              <button onClick={() => { navigate('/register'); setMobileOpen(false); }} style={{
                flex: 1, padding: '10px', borderRadius: 24, border: 'none',
                background: 'var(--color-accent)', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}>Register</button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;
