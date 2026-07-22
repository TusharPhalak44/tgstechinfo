import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Typography, Input, Badge, Tooltip } from 'antd';
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
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import PermissionWrapper from '../common/PermissionWrapper';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { Search } = Input;

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  // Section-based menu items with role-based filtering
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
            key: '/dashboard/menus',
            icon: <MenuUnfoldOutlined />,
            label: 'Menus',
          },
          {
            key: '/dashboard/navigation',
            icon: <GlobalOutlined />,
            label: 'Navigation',
          },
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
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
          boxShadow: collapsed ? 'none' : '4px 0 24px rgba(0,0,0,0.02)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 24px',
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
      <Layout style={{ marginLeft: collapsed ? 80 : 280, transition: 'margin-left 0.2s', background: darkMode ? '#0F172A' : '#F8FAFC' }}>
        <Header
          style={{
            padding: '0 32px',
            height: 64,
            background: darkMode ? '#1E293B' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                color: darkMode ? '#94A3B8' : '#6B7280',
              }}
            />
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
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tooltip title="Toggle Theme">
              <Button
                type="text"
                icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                style={{ color: darkMode ? '#94A3B8' : '#6B7280' }}
              />
            </Tooltip>
            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ color: darkMode ? '#94A3B8' : '#6B7280' }}
              />
            </Badge>
            <PermissionWrapper permissions="content.create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/dashboard/create-post')}
                style={{
                  background: '#0AAEEF',
                  borderColor: '#0AAEEF',
                  borderRadius: 8,
                  fontWeight: 500,
                }}
              >
                Create
              </Button>
            </PermissionWrapper>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                size={36}
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
            padding: '32px',
            minHeight: 'calc(100vh - 64px)',
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
