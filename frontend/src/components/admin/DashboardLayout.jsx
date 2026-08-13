import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Typography, Input, Badge, Tooltip, Popover } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  EditOutlined,
  FolderOutlined,
  CalendarOutlined,
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
  LayoutOutlined,
  RocketOutlined,
  SecurityScanOutlined,
  AppstoreOutlined,
  TagOutlined,
  UploadOutlined,
  GlobalOutlined,
  FormOutlined,
  LineChartOutlined,
  HistoryOutlined,
  ApiOutlined,
  LockOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  MenuOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import PermissionWrapper from '../common/PermissionWrapper';
import { notificationApi } from '../../services/notificationApi';
import axios from 'axios';
 

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { Search } = Input;

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [siteName, setSiteName] = useState('TgsTechInfo');
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [cmsLogo1, setCmsLogo1] = useState('');
  const [cmsLogo2, setCmsLogo2] = useState('');
  const [cmsFavicon, setCmsFavicon] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

    // Load site name from localStorage
  useEffect(() => {
    fetchSiteSettings();
  }, []);
 
  const fetchSiteSettings = async () => {
    try {
      const response = await axios.get('/api/site-settings');
      const settings = response.data.settings;
      if (settings) {
        setSiteName(settings.site_name || 'TgsTechInfo');
        setCmsLogo1(settings.cms_logo1 || '');
        setCmsLogo2(settings.cms_logo2 || '');
        setCmsFavicon(settings.cms_favicon || '');
       
        // Apply favicon
        if (settings.cms_favicon) {
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            link.sizes = '64x64';
            document.head.appendChild(link);
          }
          link.href = settings.cms_favicon;
        }
      }
    } catch (error) {
      console.error('Failed to fetch site settings:', error);
    }
  };

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      
      setLoadingNotifications(true);
      try {
        const data = await notificationApi.getAdminNotifications();
        setNotifications(data || []);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setNotifications([]);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
  }, [user?.id]);

  // Section-based menu items with role-based filtering
  const getMenuItems = () => {
    const items = [
      {
        key: '/admin',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      },
      {
        type: 'divider',
      },
      {
        key: 'content-section',
        label: 'CONTENT',
        type: 'group',
        children: [
          {
            key: '/dashboard/content',
            icon: <FileTextOutlined />,
            label: 'Content',
          },
          {
            key: '/dashboard/pending-review',
            icon: <CheckCircleOutlined />,
            label: 'Pending Review',
          },
          {
            key: '/dashboard/drafts',
            icon: <EditOutlined />,
            label: 'Drafts',
          },
          {
            key: '/dashboard/categories',
            icon: <FolderOutlined />,
            label: 'Categories',
          },
          {
            key: '/dashboard/tags',
            icon: <TagOutlined />,
            label: 'Tags',
          },
        ],
      },
      {
        key: 'media-section',
        label: 'MEDIA',
        type: 'group',
        children: [
          {
            key: '/dashboard/media-library',
            icon: <PictureOutlined />,
            label: 'Media Library',
          },
          {
            key: '/dashboard/uploads',
            icon: <UploadOutlined />,
            label: 'Uploads',
          },
        ],
      },
      {
        key: 'website-section',
        label: 'WEBSITE',
        type: 'group',
        children: [
          {
            key: '/dashboard/forms',
            icon: <FormOutlined />,
            label: 'Forms',
          },
        ],
      },
      {
        key: 'marketing-section',
        label: 'MARKETING',
        type: 'group',
        children: [
          {
            key: '/dashboard/seo',
            icon: <LineChartOutlined />,
            label: 'SEO',
          },
          {
            key: '/dashboard/analytics',
            icon: <BarChartOutlined />,
            label: 'Analytics',
          },
        ],
      },
    ];

    // Add Users section for admins and users with user.read permission
    const usersSection = {
      key: 'users-section',
      label: 'USERS',
      type: 'group',
      children: [
        {
          key: '/dashboard/users',
          icon: <TeamOutlined />,
          label: 'Users',
        },
        {
          key: '/dashboard/roles',
          icon: <SecurityScanOutlined />,
          label: 'Roles',
        },
        {
          key: '/dashboard/permissions',
          icon: <LockOutlined />,
          label: 'Permissions',
        },
      ],
    };

    // Add System section for admins
    const systemSection = {
      key: 'system-section',
      label: 'SYSTEM',
      type: 'group',
      children: [
        {
          key: '/dashboard/settings',
          icon: <SettingOutlined />,
          label: 'Settings',
        },
         {
          key: '/dashboard/email-templates',
          icon: <MailOutlined />,
          label: 'Email Templates',
        },
        {
          key: '/dashboard/audit-logs',
          icon: <HistoryOutlined />,
          label: 'Audit Logs',
        },
        {
          key: '/dashboard/integrations',
          icon: <ApiOutlined />,
          label: 'Integrations',
        },
      ],
    };

    // Add sections based on permissions
    if (user?.role === 'admin' || user?.permissions?.includes('user.read')) {
      items.push(usersSection);
    }

    if (user?.role === 'admin' || user?.permissions?.includes('settings.manage')) {
      items.push(systemSection);
    }

    return items;
  };

  const handleMenuClick = ({ key }) => {
    if (key.includes('-section')) return;
    navigate(key);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/dashboard/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/dashboard/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
      danger: true,
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <Layout style={{ minHeight: '100vh', background: darkMode ? '#0F172A' : '#F8FAFC' }}>
      <style>{`
        .admin-layout-scroll {
          scrollbar-width: thin;
          scrollbar-color: #4a7cff ${darkMode ? '#1e293b' : '#f0f0f0'};
        }
        .admin-layout-scroll::-webkit-scrollbar {
          width: 6px !important;
          display: block !important;
        }
        .admin-layout-scroll::-webkit-scrollbar-track {
          background: ${darkMode ? '#1e293b' : '#f0f0f0'};
          border-radius: 4px;
        }
        .admin-layout-scroll::-webkit-scrollbar-thumb {
          background: #4a7cff;
          border-radius: 4px;
        }
        .admin-layout-scroll::-webkit-scrollbar-thumb:hover {
          background: #3b6de8;
        }
      `}</style>
      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            onClick: () => setMobileMenuOpen(false)
          }}
        />
      )}
      
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={280}
        collapsedWidth={80}
        style={{
          background: darkMode ? '#1E293B' : '#FFFFFF',
          overflow: 'auto',
          height: '100vh',
          position: isMobile ? 'fixed' : 'fixed',
          left: isMobile && mobileMenuOpen ? 0 : (isMobile ? -280 : 0),
          top: 0,
          bottom: 0,
          borderRight: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
          boxShadow: collapsed ? 'none' : '4px 0 24px rgba(0,0,0,0.02)',
          zIndex: isMobile ? 1000 : 1,
          transition: isMobile ? 'left 0.3s ease' : 'none',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? 0 : '0 16px',
            borderBottom: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
            color: darkMode ? '#F8FAFC' : '#111827',
            fontSize: collapsed ? 16 : 18,
            fontWeight: 600,
            letterSpacing: '-0.5px',
          }}
        >
         <span
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => navigate('/dashboard/settings')}
          >
            {(cmsLogo1 || cmsLogo2) ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {cmsLogo1 && (
                  <img
                    src={cmsLogo1}
                    alt="Logo 1"
                    style={{
                      height: collapsed ? 32 : 40,
                      maxWidth: collapsed ? 32 : 70,
                      objectFit: 'contain'
                    }}
                  />
                )}
                {cmsLogo2 && (
                  <img
                    src={cmsLogo2}
                    alt="Logo 2"
                    style={{
                      height: collapsed ? 32 : 48,
                      maxWidth: collapsed ? 32 : 120,
                      objectFit: 'contain'
                    }}
                  />
                )}
              </div>
            ) : (
              <>
            <AppstoreOutlined style={{ fontSize: 24, color: '#0AAEEF' }} />
            {!collapsed && <span>{siteName}</span>}
              </>
            )}
          </span>
          {isMobile && (
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: '16px',
                color: darkMode ? '#94A3B8' : '#6B7280',
              }}
            />
          )}
        </div>
        <Menu
          theme={darkMode ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
          style={{
            background: 'transparent',
            border: 'none',
            paddingTop: 8,
          }}
          inlineIndent={collapsed ? 0 : 16}
        />
      </Sider>
      <Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : 280), transition: isMobile ? 'none' : 'margin-left 0.2s', background: darkMode ? '#0F172A' : '#F8FAFC' }}>
        <Header
          style={{
            padding: isMobile ? '0 16px' : '0 32px',
            height: 64,
            background: darkMode ? '#1E293B' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
            position: 'fixed',
            top: 0,
            left: isMobile ? 0 : (collapsed ? 80 : 280),
            right: 0,
            zIndex: 10,
            transition: isMobile ? 'none' : 'left 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16 }}>
            {isMobile ? (
              <>
                {mobileMenuOpen ? (
                  <Button
                    type="text"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      fontSize: '14px',
                      color: darkMode ? '#94A3B8' : '#6B7280',
                    }}
                  >
                    Cancel
                  </Button>
                ) : (
                  <Button
                    type="text"
                    icon={<MenuOutlined />}
                    onClick={() => setMobileMenuOpen(true)}
                    style={{
                      fontSize: '16px',
                      color: darkMode ? '#94A3B8' : '#6B7280',
                    }}
                  />
                )}
              </>
            ) : (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: '16px',
                  color: darkMode ? '#94A3B8' : '#6B7280',
                }}
              />
            )}
            {!isMobile && (
              <Search
                placeholder="Search pages, posts, media... (⌘K)"
                style={{
                  width: 320,
                  borderRadius: 8,
                  background: darkMode ? '#334155' : '#F1F5F9',
                  border: 'none',
                }}
                prefix={<SearchOutlined style={{ color: darkMode ? '#94A3B8' : '#9CA3AF' }} />}
              />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
            <Tooltip title="Toggle Theme">
              <Button
                type="text"
                icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                style={{ color: darkMode ? '#94A3B8' : '#6B7280' }}
              />
            </Tooltip>
            {!isMobile && (
              <>
                <Popover
                  open={notificationVisible}
                  onOpenChange={setNotificationVisible}
                  title="Notifications"
                  content={
                    <div style={{ maxWidth: 320 }}>
                      {loadingNotifications ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: darkMode ? '#94A3B8' : '#6B7280' }}>
                          Loading...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: darkMode ? '#94A3B8' : '#6B7280' }}>
                          No new notifications
                        </div>
                      ) : (
                        <>
                          <div style={{ padding: '8px 0', borderBottom: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`, marginBottom: 8 }}>
                            <div style={{ fontSize: 12, color: darkMode ? '#94A3B8' : '#6B7280' }}>
                              You have {notifications.length} new notifications
                            </div>
                          </div>
                          
<div style={{
                            fontSize: 13,
                            color: darkMode ? '#CBD5E1' : '#374151',
                            maxHeight: 300,
                            overflowY: 'auto',
                            paddingRight: 8
                          }}>                            {notifications.map((notification) => (
                              <div 
                                key={notification.id} 
                                style={{ 
                                  padding: '8px 0', 
                                  borderBottom: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
                                  cursor: 'pointer'
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  notificationApi.markAdminAsRead(notification.id);
                                  setNotifications(prev => prev.filter(n => n.id !== notification.id));
                                }}
                              >
                                <div style={{ fontWeight: 500, marginBottom: 4 }}>{notification.message}</div>
                                <div style={{ fontSize: 12, color: darkMode ? '#94A3B8' : '#6B7280' }}>
                                  {new Date(notification.created_at).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  }
                  trigger="click"
                  placement="bottomRight"
                >
                  <Badge count={notifications.length} size="small">
                    <Button
                      type="text"
                      icon={<BellOutlined />}
                      style={{ color: darkMode ? '#94A3B8' : '#6B7280' }}
                    />
                  </Badge>
                </Popover>
                <PermissionWrapper permissions="content.create">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/dashboard/create-post')}
                    size="small"
                    style={{
                      background: '#0AAEEF',
                      borderColor: '#0AAEEF',
                      borderRadius: 6,
                      fontWeight: 500,
                      fontSize: 13,
                      height: 32,
                      padding: '4px 12px',
                      minWidth: 'auto'
                    }}
                  >
                    Create
                  </Button>
                </PermissionWrapper>
              </>
            )}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                size={isMobile ? 32 : 36}
                icon={<UserOutlined />}
                style={{ 
                  background: '#0AAEEF', 
                  cursor: 'pointer',
                  border: `2px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
                }}
              />
            </Dropdown>
          </div>
        </Header>
        <Content
          className="admin-layout-scroll"
          style={{
            margin: 0,
            padding: isMobile ? '64px 0 0' : '64px 32px 32px',
            height: 'calc(100vh - 64px)',
            overflowY: 'auto',
            background: darkMode ? '#0F172A' : '#F8FAFC',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
