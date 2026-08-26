import React, { useState, useEffect } from 'react';
import { Table, Select, DatePicker, Tag, Space, Input, Button, ConfigProvider, Tooltip } from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  ReloadOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';

const { RangePicker } = DatePicker;
const { Option } = Select;

/* ─────────────────────────────────────────────
   STYLING SYSTEM & ANIMATIONS (Dashboard Parity)
───────────────────────────────────────────── */
const auditStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

  .log-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    animation: logFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes logFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .log-stagger-1 { animation: logSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .log-stagger-2 { animation: logSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.10s both; }
  .log-stagger-3 { animation: logSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }

  @keyframes logSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .log-beacon-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #F7941D;
    position: relative;
    display: inline-block;
  }
  .log-beacon-dot::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 2px solid #F7941D;
    animation: logPulse 2s ease-out infinite;
  }
  @keyframes logPulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .log-kpi-card {
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
  .log-kpi-card:hover {
    transform: translateY(-3px);
  }
`;

const AuditLogs = () => {
  const { darkMode } = useTheme();
  const D = darkMode;

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    action: null,
    status: null,
    search: '',
  });
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    today: 0,
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.action) params.action = filters.action;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      
      const response = await axios.get('/api/audit-logs', {
        params,
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      const rawData = response.data?.data || response.data || [];
      const formattedLogs = Array.isArray(rawData) ? rawData.map(log => ({
        id: log.id,
        action: log.action,
        user: log.user_email || 'System Daemon',
        ip: log.ip_address || '127.0.0.1',
        timestamp: new Date(log.created_at).toLocaleString(),
        status: log.status || 'success',
        details: log.details || 'Operational record logged',
      })) : [];
      
      const today = new Date().toDateString();
      const success = formattedLogs.filter(l => l.status === 'success').length;
      const failed = formattedLogs.filter(l => l.status === 'failed').length;
      const todayCount = formattedLogs.filter(l => new Date(l.timestamp).toDateString() === today).length;
      
      setStats({
        total: formattedLogs.length,
        success,
        failed,
        today: todayCount,
      });
      
      setLogs(formattedLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const StatCard = ({ title, value, icon, color = 'primary', accentColor, subtitle }) => {
    const colorMap = {
      primary: { bg: D ? 'rgba(247, 148, 29, 0.12)' : 'rgba(247, 148, 29, 0.08)', text: '#F7941D', border: 'rgba(247, 148, 29, 0.3)' },
      success: { bg: D ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
      danger: { bg: D ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
      warning: { bg: D ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
    };
    const c = colorMap[color] || colorMap.primary;

    return (
      <div
        className="log-kpi-card"
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
      title: 'Action Performed',
      dataIndex: 'action',
      key: 'action',
      render: (text) => (
        <span style={{ fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A', fontSize: '0.85rem' }}>
          {text}
        </span>
      ),
    },
    {
      title: 'User Principal',
      dataIndex: 'user',
      key: 'user',
      render: (user) => <span style={{ fontSize: '0.8rem', color: D ? '#CBD5E1' : '#334155', fontWeight: 600 }}>{user}</span>,
    },
    {
      title: 'IP Address',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip) => (
        <code style={{ background: D ? 'rgba(30, 41, 59, 0.8)' : '#F1F5F9', color: '#F7941D', padding: '3px 9px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600 }}>
          <GlobalOutlined style={{ marginRight: 4 }} /> {ip}
        </code>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (ts) => <span style={{ fontSize: '0.75rem', color: D ? '#94A3B8' : '#64748B', fontWeight: 600 }}>{ts}</span>,
    },
    {
      title: 'Outcome Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'success' ? 'green' : 'red'} style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px', textTransform: 'uppercase' }}>
          {status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />} {status}
        </Tag>
      ),
    },
    {
      title: 'Operation Details',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      render: (details) => <span style={{ fontSize: '0.78rem', color: D ? '#64748B' : '#94A3B8' }}>{details}</span>,
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
      <style>{auditStyles}</style>

      <div className="log-root" style={{ padding: '24px 28px', background: D ? '#0A1229' : '#F8FAFC', minHeight: '100vh' }}>
        {/* ── COMMAND HEADER BANNER ── */}
        <div
          className="log-stagger-1"
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
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(247, 148, 29, 0.4), transparent)' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="log-beacon-dot" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#F7941D' }}>
                System Audit & Security Logs
              </span>
              <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>•</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B' }}>
                {stats.total} Logged Events
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
              <HistoryOutlined style={{ color: '#F7941D' }} /> Audit & Security Event Logs
            </h1>
          </div>

          <Button
            type="primary"
            icon={<DownloadOutlined />}
            style={{
              background: 'linear-gradient(135deg, #EA580C 0%, #F7941D 100%)',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              height: 42,
              padding: '0 20px',
              fontSize: '0.85rem',
            }}
          >
            Export Log History
          </Button>
        </div>

        {/* ── EXECUTIVE KPI GRID ── */}
        <div
          className="log-stagger-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard title="Total Audit Records" value={stats.total} icon={<HistoryOutlined />} color="primary" accentColor="#F7941D" subtitle="Recorded Transactions" />
          <StatCard title="Successful Operations" value={stats.success} icon={<CheckCircleOutlined />} color="success" accentColor="#10B981" subtitle="Passed Security Checks" />
          <StatCard title="Failed / Blocked Actions" value={stats.failed} icon={<CloseCircleOutlined />} color="danger" accentColor="#EF4444" subtitle="Security Alerts" />
          <StatCard title="Events Logged Today" value={stats.today} icon={<CalendarOutlined />} color="warning" accentColor="#F59E0B" subtitle="24h Log Volume" />
        </div>

        {/* ── MAIN TABLE CONTAINER ── */}
        <div
          className="log-stagger-3"
          style={{
            background: D ? 'rgba(15, 23, 42, 0.8)' : '#FFFFFF',
            borderRadius: 16,
            border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
            overflow: 'hidden',
            boxShadow: D ? '0 10px 30px -5px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(11, 31, 77, 0.05)',
          }}
        >
          {/* Action Bar */}
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
                System Audit Register
              </h3>
              <span style={{ fontSize: '0.78rem', color: D ? '#64748B' : '#94A3B8' }}>
                Showing {logs.length} audit entries
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: D ? '#1E293B' : '#F1F5F9',
                  border: `1px solid ${D ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.8)'}`,
                  borderRadius: 10,
                  padding: '6px 14px',
                  width: 220,
                }}
              >
                <SearchOutlined style={{ color: D ? '#64748B' : '#94A3B8', fontSize: 14 }} />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.82rem',
                    color: D ? '#F8FAFC' : '#0F172A',
                    width: '100%',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <Select
                placeholder="Action Filter"
                allowClear
                value={filters.action}
                onChange={(v) => setFilters({ ...filters, action: v })}
                style={{ width: 140, borderRadius: 10 }}
              >
                <Option value="login">Login</Option>
                <Option value="create">Create</Option>
                <Option value="update">Update</Option>
                <Option value="delete">Delete</Option>
              </Select>

              <Select
                placeholder="Status Filter"
                allowClear
                value={filters.status}
                onChange={(v) => setFilters({ ...filters, status: v })}
                style={{ width: 130, borderRadius: 10 }}
              >
                <Option value="success">Success</Option>
                <Option value="failed">Failed</Option>
              </Select>

              <Tooltip title="Reload Audit Logs">
                <Button icon={<ReloadOutlined />} onClick={fetchLogs} style={{ borderRadius: 10, background: D ? '#1E293B' : '#F1F5F9' }} />
              </Tooltip>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default AuditLogs;
