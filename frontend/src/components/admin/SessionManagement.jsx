import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, message, Tag, Popconfirm, Tooltip, ConfigProvider } from 'antd';
import { useTheme } from '../../context/ThemeContext';
import { 
  MobileOutlined, 
  DesktopOutlined, 
  TabletOutlined,
  LogoutOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Text } = Typography;

/* ─────────────────────────────────────────────
   STYLING SYSTEM & ANIMATIONS (Dashboard Parity)
───────────────────────────────────────────── */
const sessionStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

  .ses-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    animation: sesFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes sesFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .ses-stagger-1 { animation: sesSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .ses-stagger-2 { animation: sesSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.10s both; }
  .ses-stagger-3 { animation: sesSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }

  @keyframes sesSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .ses-beacon-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #EF4444;
    position: relative;
    display: inline-block;
  }
  .ses-beacon-dot::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 2px solid #EF4444;
    animation: sesPulse 2s ease-out infinite;
  }
  @keyframes sesPulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .ses-kpi-card {
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
  .ses-kpi-card:hover {
    transform: translateY(-3px);
  }
`;

const SessionManagement = () => {
  const { darkMode } = useTheme();
  const D = darkMode;
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    desktop: 0,
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/auth/sessions');
      const sessionsList = response.data.sessions || [];
      setSessions(sessionsList);
      
      const active = sessionsList.filter(s => !s.expired_at).length;
      const expired = sessionsList.filter(s => s.expired_at).length;
      const desktop = sessionsList.filter(s => s.device_type === 'desktop').length;
      
      setStats({
        total: sessionsList.length,
        active,
        expired,
        desktop,
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
      message.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await axios.delete(`/api/auth/sessions/${sessionId}`);
      message.success('Session revoked successfully');
      fetchSessions();
    } catch (error) {
      message.error('Failed to revoke session');
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      await axios.post('/api/auth/sessions/revoke-others');
      message.success('All other sessions revoked successfully');
      fetchSessions();
    } catch (error) {
      message.error('Failed to revoke sessions');
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <MobileOutlined style={{ fontSize: 18, color: '#3B82F6' }} />;
      case 'tablet':
        return <TabletOutlined style={{ fontSize: 18, color: '#F59E0B' }} />;
      case 'desktop':
      default:
        return <DesktopOutlined style={{ fontSize: 18, color: '#10B981' }} />;
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary', accentColor, subtitle }) => {
    const colorMap = {
      primary: { bg: D ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
      success: { bg: D ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
      warning: { bg: D ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
      info: { bg: D ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' },
    };
    const c = colorMap[color] || colorMap.primary;

    return (
      <div
        className="ses-kpi-card"
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

  const columns = [
    {
      title: 'Device & Operating System',
      key: 'device',
      render: (_, record) => (
        <Space size={12}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: D ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {getDeviceIcon(record.device_type)}
          </div>
          <div>
            <span style={{ fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A', fontSize: '0.85rem', display: 'block' }}>
              {record.device_name || 'Workstation Terminal'}
            </span>
            <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>
              {record.browser || 'Chrome'} on {record.os || 'Windows'}
            </span>
          </div>
        </Space>
      ),
    },
    {
      title: 'IP Location Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip) => (
        <code style={{ background: D ? 'rgba(30, 41, 59, 0.8)' : '#F1F5F9', color: '#3B82F6', padding: '3px 9px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600 }}>
          <GlobalOutlined style={{ marginRight: 4 }} /> {ip || '127.0.0.1'}
        </code>
      ),
    },
    {
      title: 'Last Activity Timestamp',
      dataIndex: 'last_activity',
      key: 'last_activity',
      render: (date) => (
        <span style={{ fontSize: '0.78rem', color: D ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
          {date ? moment(date).fromNow() : 'Just now'}
        </span>
      ),
    },
    {
      title: 'Session Status',
      key: 'status',
      render: (_, record) => (
        <Space size={6}>
          {record.is_current ? (
            <Tag color="blue" icon={<SafetyOutlined />} style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px' }}>
              Current Session
            </Tag>
          ) : (
            <Tag color={record.is_active ? 'green' : 'red'} style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px' }}>
              {record.is_active ? 'Active' : 'Revoked'}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'right',
      render: (_, record) => (
        !record.is_current && (
          <Popconfirm
            title="Revoke session access?"
            description="The user will be immediately logged out from this device."
            onConfirm={() => handleRevokeSession(record.id)}
            okText="Revoke"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<LogoutOutlined />}
              disabled={!record.is_active}
              style={{ borderRadius: 8, background: D ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.06)' }}
            >
              Revoke
            </Button>
          </Popconfirm>
        )
      ),
    },
  ];

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
      <style>{sessionStyles}</style>

      <div className="ses-root" style={{ padding: '24px 28px', background: D ? '#0A1229' : '#F8FAFC', minHeight: '100vh' }}>
        {/* ── COMMAND HEADER BANNER ── */}
        <div
          className="ses-stagger-1"
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
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.4), transparent)' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="ses-beacon-dot" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#EF4444' }}>
                Security & Authentication Control
              </span>
              <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>•</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B' }}>
                {stats.active} Active Token Connections
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
              <SafetyOutlined style={{ color: '#EF4444' }} /> Active Session Control
            </h1>
          </div>

          <Popconfirm
            title="Revoke all other active sessions?"
            description="You will remain logged in on this current browser device."
            onConfirm={handleRevokeAllOtherSessions}
            okText="Revoke All Others"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<LogoutOutlined />}
              style={{
                borderRadius: 10,
                fontWeight: 700,
                height: 42,
                padding: '0 20px',
                fontSize: '0.85rem',
              }}
            >
              Revoke All Other Sessions
            </Button>
          </Popconfirm>
        </div>

        {/* ── EXECUTIVE KPI GRID ── */}
        <div
          className="ses-stagger-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard title="Total Tracked Sessions" value={stats.total} icon={<SafetyOutlined />} color="primary" accentColor="#EF4444" subtitle="Session Log Registry" />
          <StatCard title="Active Connections" value={stats.active} icon={<CheckCircleOutlined />} color="success" accentColor="#10B981" subtitle="Live User Tokens" />
          <StatCard title="Expired Connections" value={stats.expired} icon={<ClockCircleOutlined />} color="warning" accentColor="#F59E0B" subtitle="Inactivity Timeouts" />
          <StatCard title="Desktop Terminals" value={stats.desktop} icon={<DesktopOutlined />} color="info" accentColor="#3B82F6" subtitle="Workstation Browsers" />
        </div>

        {/* ── MAIN TABLE CONTAINER ── */}
        <div
          className="ses-stagger-3"
          style={{
            background: D ? 'rgba(15, 23, 42, 0.8)' : '#FFFFFF',
            borderRadius: 16,
            border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
            overflow: 'hidden',
            boxShadow: D ? '0 10px 30px -5px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(11, 31, 77, 0.05)',
          }}
        >
          <div
            style={{
              padding: '16px 22px',
              borderBottom: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A' }}>
                Active Token Sessions Directory
              </h3>
              <span style={{ fontSize: '0.78rem', color: D ? '#64748B' : '#94A3B8' }}>
                Showing {sessions.length} sessions
              </span>
            </div>

            <Tooltip title="Reload Sessions">
              <Button icon={<ReloadOutlined />} onClick={fetchSessions} style={{ borderRadius: 10, background: D ? '#1E293B' : '#F1F5F9' }} />
            </Tooltip>
          </div>

          <Table
            columns={columns}
            dataSource={sessions}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default SessionManagement;
