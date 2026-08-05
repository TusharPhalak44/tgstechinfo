// UserDashboardLayout.jsx - Updated
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Typography, Input, Badge, Tooltip, Popover } from 'antd';
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
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { notificationApi } from '../../services/notificationApi';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { Search } = Input;

const UserDashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      
      setLoadingNotifications(true);
      try {
        const data = await notificationApi.getNotifications();
        setNotifications(data || []);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setNotifications([]);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const getMenuItems = () => {
    const items = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      },
      {
        type: 'divider',
      },
      {
        key: 'content-section',
        label: 'MY CONTENT',
        type: 'group',
        children: [
          {
            key: '/dashboard/my-content',
            icon: <FileTextOutlined />,
            label: 'My Content',
          },
          {
            key: '/dashboard/my-submissions',
            icon: <FileTextOutlined />,
            label: 'My Submissions',
          },
          {
            key: '/dashboard/drafts',
            icon: <EditOutlined />,
            label: 'Drafts',
          },
          {
            key: '/dashboard/create-post',
            icon: <PlusOutlined />,
            label: 'Create Content',
          },
        ],
      },
      {
        key: 'account-section',
        label: 'ACCOUNT',
        type: 'group',
        children: [
          {
            key: '/dashboard/profile',
            icon: <UserOutlined />,
            label: 'Profile',
          },
        ],
      },
    ];

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
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={280}
        collapsedWidth={isMobile ? 0 : 80}
        style={{
          background: darkMode ? '#1E293B' : '#FFFFFF',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: isMobile && !mobileMenuOpen ? -280 : 0,
          top: 0,
          bottom: 0,
          borderRight: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
          boxShadow: collapsed ? 'none' : '4px 0 24px rgba(0,0,0,0.02)',
          zIndex: isMobile ? 1000 : 1,
          transition: isMobile ? 'left 0.3s ease' : 'all 0.2s',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMobile && mobileMenuOpen ? 'space-between' : (collapsed ? 'center' : 'flex-start'),
            padding: isMobile && mobileMenuOpen ? '0 16px' : (collapsed ? 0 : '0 24px'),
            borderBottom: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
            color: darkMode ? '#F8FAFC' : '#111827',
            fontSize: collapsed ? 16 : 18,
            fontWeight: 600,
            letterSpacing: '-0.5px',
          }}
        >
          {collapsed ? (
            <AppstoreOutlined style={{ fontSize: 24, color: '#0AAEEF' }} />
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AppstoreOutlined style={{ fontSize: 24, color: '#0AAEEF' }} />
              <span>TgsTechInfo</span>
            </span>
          )}
          {isMobile && mobileMenuOpen && (
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: '18px',
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
      
      <Layout style={{ 
        marginLeft: isMobile ? 0 : (collapsed ? 80 : 280), 
        transition: isMobile ? 'none' : 'margin-left 0.2s', 
        background: darkMode ? '#0F172A' : '#F8FAFC',
        width: isMobile ? '100%' : `calc(100% - ${collapsed ? 80 : 280}px)`,
        minHeight: '100vh'
      }}>
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
            right: 0,
            left: isMobile ? 0 : (collapsed ? 80 : 280),
            zIndex: isMobile ? 999 : 10,
            transition: isMobile ? 'none' : 'left 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
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
                    icon={<MenuUnfoldOutlined />}
                    onClick={() => setMobileMenuOpen(true)}
                    style={{
                      fontSize: '18px',
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
              <Text style={{ fontSize: 16, fontWeight: 500, color: darkMode ? '#F8FAFC' : '#111827' }}>
                {getGreeting()}, {user?.first_name || 'User'}!
              </Text>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
            {!isMobile && (
              <Tooltip title="Toggle Theme">
                <Button
                  type="text"
                  icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                  onClick={toggleTheme}
                  style={{ color: darkMode ? '#94A3B8' : '#6B7280' }}
                />
              </Tooltip>
            )}
            {!isMobile && (
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
                        }}>
                          {notifications.map((notification) => (
                            <div 
                              key={notification.id} 
                              style={{ 
                                padding: '8px 0', 
                                borderBottom: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                notificationApi.markAsRead(notification.id);
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
            )}
            {!isMobile && (
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
            )}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                size={32}
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
          style={{
            margin: 0,
            padding: isMobile ? '64px 0 0 0' : '88px 24px 24px 24px',
            minHeight: '100vh',
            background: darkMode ? '#0F172A' : '#F8FAFC',
            width: '100%',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
      
      {/* Mobile overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998,
          }}
        />
      )}
    </Layout>
  );
};

export default UserDashboardLayout;