import React, { useState, useEffect } from 'react';
import { Button, Tag, message, Popconfirm, Pagination, Tabs, Card, Row, Col, Statistic, Space, Badge, ConfigProvider, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { 
  FileTextOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
  EyeOutlined,
  DeleteOutlined,
  SafetyOutlined,
  TeamOutlined,
  LockOutlined,
  SettingOutlined,
  DashboardOutlined,
  BarChartOutlined,
  AlertOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import RBACManagement from './RBACManagement';
import SecurityDashboard from '../user/SecurityDashboard';
import { useTheme } from '../../context/ThemeContext';

const AdminDashboard = () => {
  const { darkMode } = useTheme();
  const [stats, setStats] = useState({ 
    totalContent: 0, 
    pendingReview: 0, 
    published: 0, 
    totalUsers: 0 
  });
  const [allContent, setAllContent] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('content');
  const [visibleCards, setVisibleCards] = useState(9);
  const [dateRange, setDateRange] = useState(null);
  const pageSize = 15;
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setVisibleCards(9);
  }, [currentPage]);

  const fetchDashboardData = async (page = 1) => {
    setLoading(true);
    try {
      const [statsRes, contentRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/content/pending', { params: { page, limit: pageSize } })
      ]);
      setStats(statsRes.data);
      const res = contentRes.data;
      setAllContent(res?.data || []);
      setTotalItems(res?.total ?? 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectPublish = async (id) => {
    setPublishingId(id);
    try {
      await axios.put(`/api/admin/content/${id}/review`, { action: 'publish', comment: '' });
      message.success('Content published successfully');
      fetchDashboardData(currentPage);
    } catch {
      message.error('Failed to publish content');
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/content/${id}`);
      message.success('Content deleted successfully');
      const newTotal = totalItems - 1;
      const maxPage = Math.ceil(newTotal / pageSize) || 1;
      const goToPage = currentPage > maxPage ? maxPage : currentPage;
      if (goToPage !== currentPage) setCurrentPage(goToPage);
      else fetchDashboardData(currentPage);
    } catch {
      message.error('Failed to delete content');
    }
  };

  const handleShowMore = () => {
    setVisibleCards(prev => Math.min(prev + 3, pageSize));
  };

  const statusTagMap = {
    pending:           { color: 'orange', text: 'Pending Review' },
    approved:          { color: 'green',  text: 'Approved' },
    published:         { color: 'blue',   text: 'Published' },
    rejected:          { color: 'red',    text: 'Rejected' },
    changes_requested: { color: 'gold',   text: 'Changes Requested' },
    draft:             { color: 'default', text: 'Draft' }
  };

  const StatCard = ({ title, value, icon, color = 'primary', valueColor }) => {
    const colorMap = {
      primary: darkMode ? '#0AAEEF' : '#0AAEEF',
      success: darkMode ? '#5BBD2B' : '#5BBD2B',
      warning: darkMode ? '#F7941D' : '#F7941D',
      danger: darkMode ? '#c92a2a' : '#c92a2a',
      info: darkMode ? '#0AAEEF' : '#0AAEEF'
    };
    return (
      <div style={{
        background: darkMode ? '#1e293b' : '#fff',
        borderRadius: 12,
        padding: 'clamp(16px, 2vw, 24px)',
        border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
        boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 'clamp(13px, 1vw, 14px)', fontWeight: 500, color: darkMode ? '#94a3b8' : '#6b7280' }}>{title}</p>
            <p style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, marginTop: 4, color: valueColor || (darkMode ? '#f1f5f9' : '#111827') }}>{value}</p>
          </div>
          <div style={{ fontSize: 'clamp(28px, 3vw, 36px)', color: colorMap[color] }}>{icon}</div>
        </div>
      </div>
    );
  };

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  const filteredContent = allContent.filter(r => {
    // Search filter
    const matchesSearch = !searchQuery.trim() || (() => {
      const q = searchQuery.toLowerCase();
      return (
        (r.title || '').toLowerCase().includes(q) ||
        (`${r.first_name || ''} ${r.last_name || ''}`).toLowerCase().includes(q) ||
        (r.content_type_name || '').toLowerCase().includes(q) ||
        (statusTagMap[r.status]?.text || r.status || '').toLowerCase().includes(q)
      );
    })();

    // Date filter
    const matchesDate = !dateRange || (() => {
      if (!r.published_date) return false;
      const publishDate = dayjs(r.published_date);
      const [startDate, endDate] = dateRange;
      return publishDate.isAfter(startDate.subtract(1, 'day')) && publishDate.isBefore(endDate.add(1, 'day'));
    })();

    return matchesSearch && matchesDate;
  });

  if (loading) {
    return (
      <div style={{ padding: 'clamp(16px, 2vw, 24px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ height: 32, background: darkMode ? '#334155' : '#e5e7eb', borderRadius: 8, width: 192 }}></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: 'clamp(16px, 2vw, 24px)', border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb' }}>
                <div style={{ height: 16, background: darkMode ? '#334155' : '#e5e7eb', borderRadius: 4, width: 96, marginBottom: 8 }}></div>
                <div style={{ height: 32, background: darkMode ? '#334155' : '#e5e7eb', borderRadius: 4, width: 64 }}></div>
              </div>
            ))}
          </div>
          <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb' }}>
            <div style={{ padding: 'clamp(16px, 2vw, 24px)', borderBottom: darkMode ? '1px solid #334155' : '1px solid #e5e7eb' }}>
              <div style={{ height: 24, background: darkMode ? '#334155' : '#e5e7eb', borderRadius: 4, width: 160 }}></div>
            </div>
            <div style={{ padding: 'clamp(16px, 2vw, 24px)' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: 48, background: darkMode ? '#334155' : '#e5e7eb', borderRadius: 4, marginBottom: 8 }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: darkMode ? '#1e293b' : '#fff',
          colorText: darkMode ? '#cbd5e1' : '#374151',
          colorBorder: darkMode ? '#334155' : '#e5e7eb',
          colorBgElevated: darkMode ? '#1e293b' : '#fff',
          colorTextPlaceholder: darkMode ? '#64748b' : '#bfbfbf',
        },
        components: {
          Tabs: {
            itemActiveColor: darkMode ? '#0AAEEF' : '#0AAEEF',
            itemSelectedColor: darkMode ? '#0AAEEF' : '#0AAEEF',
            inkBarColor: darkMode ? '#0AAEEF' : '#0AAEEF',
          },
        },
      }}
    >
      <div style={{ padding: window.innerWidth < 768 ? 0 : 'clamp(16px, 2vw, 24px)' }}>
        <h1 style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 700, marginBottom: 'clamp(16px, 2vw, 24px)', padding: window.innerWidth < 768 ? '16px' : 0, color: darkMode ? '#f1f5f9' : '#111827' }}>Admin Dashboard</h1>

        <Tabs activeKey={activeTab} onChange={setActiveTab} className="admin-dashboard-tabs">
          <Tabs.TabPane tab={<span><DashboardOutlined /> Content Management</span>} key="content">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <StatCard title="Total Content" value={stats.totalContent} icon={<FileTextOutlined />} color="primary" />
              <StatCard title="Pending Review" value={stats.pendingReview} icon={<ClockCircleOutlined />} color="warning" valueColor={darkMode ? '#F7941D' : '#F59E0B'} />
              <StatCard title="Published" value={stats.totalPublished || stats.published} icon={<CheckCircleOutlined />} color="success" valueColor={darkMode ? '#5BBD2B' : '#10B981'} />
              <StatCard title="Total Users" value={stats.totalUsers} icon={<UserOutlined />} color="primary" />
            </div>

            <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: 'clamp(16px, 2vw, 24px)', borderBottom: darkMode ? '1px solid #334155' : '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 'clamp(16px, 1.5vw, 18px)', fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827' }}>Content Submissions</h2>
                    <span style={{ fontSize: 'clamp(12px, 1vw, 14px)', color: darkMode ? '#94a3b8' : '#6b7280' }}>Total: {stats.totalContent} submissions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: darkMode ? '#0f172a' : '#f7f8fa', border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb', borderRadius: 8, padding: 'clamp(6px, 1vw, 12px)', width: window.innerWidth < 768 ? '100%' : 200 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#94a3b8' : '#9ca3af'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search by title, author, type, status..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 'clamp(12px, 0.9vw, 13px)', color: darkMode ? '#f1f5f9' : '#1a1a2e', width: '100%', minWidth: window.innerWidth < 768 ? 120 : 150 }}
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: darkMode ? '#94a3b8' : '#9ca3af', fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
                      )}
                    </div>
                    <DatePicker.RangePicker
                      value={dateRange}
                      onChange={setDateRange}
                      format="YYYY-MM-DD"
                      placeholder={['Start Date', 'End Date']}
                      style={{ 
                        background: darkMode ? '#0f172a' : '#f7f8fa', 
                        border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
                        borderRadius: 8,
                        fontSize: 'clamp(12px, 0.9vw, 13px)',
                        color: darkMode ? '#f1f5f9' : '#1a1a2e'
                      }}
                    />
                  </div>
                </div>
                {searchQuery && (
                  <div style={{ marginTop: 8, fontSize: 12, color: darkMode ? '#94a3b8' : '#6b7280' }}>
                    Showing <strong style={{ color: darkMode ? '#f1f5f9' : '#1a1a2e' }}>{filteredContent.length}</strong> result{filteredContent.length !== 1 ? 's' : ''} for "<strong style={{ color: '#4a7cff' }}>{searchQuery}</strong>"
                  </div>
                )}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ display: 'block', width: '100%' }}>
                  <thead style={{ display: window.innerWidth < 768 ? 'none' : 'table-header-group', background: darkMode ? '#0f172a' : '#f9fafb' }}>
                    <tr>
                      <th style={{ padding: 'clamp(12px, 1.5vw, 14px) clamp(16px, 2vw, 24px)', textAlign: 'left', fontSize: 'clamp(11px, 0.8vw, 12px)', fontWeight: 600, color: darkMode ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</th>
                      <th style={{ padding: 'clamp(12px, 1.5vw, 14px) clamp(16px, 2vw, 24px)', textAlign: 'left', fontSize: 'clamp(11px, 0.8vw, 12px)', fontWeight: 600, color: darkMode ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Author</th>
                      <th style={{ padding: 'clamp(12px, 1.5vw, 14px) clamp(16px, 2vw, 24px)', textAlign: 'left', fontSize: 'clamp(11px, 0.8vw, 12px)', fontWeight: 600, color: darkMode ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                      <th style={{ padding: 'clamp(12px, 1.5vw, 14px) clamp(16px, 2vw, 24px)', textAlign: 'left', fontSize: 'clamp(11px, 0.8vw, 12px)', fontWeight: 600, color: darkMode ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                      <th style={{ padding: 'clamp(12px, 1.5vw, 14px) clamp(16px, 2vw, 24px)', textAlign: 'left', fontSize: 'clamp(11px, 0.8vw, 12px)', fontWeight: 600, color: darkMode ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Published Date</th>
                      <th style={{ padding: 'clamp(12px, 1.5vw, 14px) clamp(16px, 2vw, 24px)', textAlign: 'left', fontSize: 'clamp(11px, 0.8vw, 12px)', fontWeight: 600, color: darkMode ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ display: window.innerWidth < 768 ? 'block' : 'table-row-group', maxHeight: window.innerWidth < 768 ? 'none' : '520px', overflowY: window.innerWidth < 768 ? 'visible' : 'auto', background: darkMode ? '#1e293b' : '#fff' }}>
                    {filteredContent.length === 0 ? (
                      <tr style={{ display: window.innerWidth < 768 ? 'block' : 'table-row' }}>
                        <td colSpan={6} style={{ display: 'block', textAlign: 'center', padding: '32px 16px', color: darkMode ? '#94a3b8' : '#6b7280' }}>
                          {searchQuery ? `No results found for "${searchQuery}"` : 'No content found'}
                        </td>
                      </tr>
                    ) : (
                      filteredContent.slice(0, visibleCards).map((record) => (
                        <tr key={record.id} style={{ display: window.innerWidth < 768 ? 'block' : 'table-row', marginBottom: window.innerWidth < 768 ? 16 : 0, border: window.innerWidth < 768 ? `1px solid ${darkMode ? '#334155' : '#e5e7eb'}` : 'none', borderRadius: window.innerWidth < 768 ? 8 : 0, padding: window.innerWidth < 768 ? 12 : 0, background: window.innerWidth < 768 ? (darkMode ? '#1e293b' : '#fff') : 'transparent', borderBottom: window.innerWidth >= 768 ? `1px solid ${darkMode ? '#334155' : '#e5e7eb'}` : 'none' }}>
                        {window.innerWidth >= 768 ? (
                          <>
                            <td style={{ padding: 'clamp(12px, 1.5vw, 14px) clamp(16px, 2vw, 24px)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {record.banner_image && (
                                  <img
                                    src={`/uploads/${record.banner_image}`}
                                    alt=""
                                    style={{ width: 48, height: 36, objectFit: 'contain', borderRadius: 4, flexShrink: 0, border: `1px solid ${darkMode ? '#334155' : '#e5e7eb'}`, background: darkMode ? '#0f172a' : '#f0f4ff' }}
                                  />
                                )}
                                <span
                                  style={{ color: '#4a7cff', cursor: 'pointer', transition: 'color 0.2s' }}
                                  onClick={() => navigate(`/admin/review/${record.id}`)}
                                >
                                  {record.title}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: 'clamp(12px, 1.5vw, 14px) clamp(16px, 2vw, 24px)', whiteSpace: 'nowrap', fontSize: 'clamp(13px, 1vw, 14px)', color: darkMode ? '#cbd5e1' : '#111827' }}>
                              {record.first_name} {record.last_name}
                            </td>
                            <td style={{ padding: 'clamp(12px, 1.5vw, 14px) clamp(16px, 2vw, 24px)', whiteSpace: 'nowrap' }}>
                              <Tag color="blue">{record.content_type_name}</Tag>
                            </td>
                            <td style={{ padding: 'clamp(12px, 1.5vw, 14px) clamp(16px, 2vw, 24px)', whiteSpace: 'nowrap' }}>
                              <Tag color={statusTagMap[record.status]?.color || 'default'}>
                                {statusTagMap[record.status]?.text || record.status}
                              </Tag>
                            </td>
                            <td style={{ padding: 'clamp(12px, 1.5vw, 14px) clamp(16px, 2vw, 24px)', whiteSpace: 'nowrap', fontSize: 'clamp(13px, 1vw, 14px)', color: darkMode ? '#cbd5e1' : '#111827' }}>
                              {record.published_date ? new Date(record.published_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                            </td>
                            <td style={{ padding: 'clamp(12px, 1.5vw, 14px) clamp(16px, 2vw, 24px)', whiteSpace: 'nowrap', fontSize: 'clamp(13px, 1vw, 14px)', color: darkMode ? '#94a3b8' : '#6b7280' }}>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'nowrap' }}>
                                {record.status === 'pending' && (
                                  <Button type="primary" size="small" icon={<EyeOutlined />}
                                    onClick={() => navigate(`/admin/review/${record.id}`)}
                                    style={{ minWidth: 80, background: '#10B981', borderColor: '#10B981' }}>
                                    Review
                                  </Button>
                                )}
                                {record.status === 'approved' && (
                                  <Button type="primary" size="small" icon={<SendOutlined />}
                                    loading={publishingId === record.id}
                                    onClick={() => handleDirectPublish(record.id)}
                                    style={{ minWidth: 80, background: '#0AAEEF', borderColor: '#0AAEEF' }}>
                                    Publish
                                  </Button>
                                )}
                                {record.status !== 'pending' && record.status !== 'approved' && (
                                  <Button size="small" icon={<EyeOutlined />}
                                    onClick={() => navigate(`/admin/review/${record.id}`)}
                                    style={{ minWidth: 60 }}>View</Button>
                                )}
                                <Popconfirm
                                  title="Delete permanently?"
                                  description="This cannot be undone."
                                  onConfirm={() => handleDelete(record.id)}
                                  okText="Delete" okButtonProps={{ danger: true }} cancelText="Cancel"
                                >
                                  <Button danger size="small" icon={<DeleteOutlined />} style={{ minWidth: 40 }} />
                                </Popconfirm>
                              </div>
                            </td>
                          </>
                        ) : (
                          <td style={{ display: 'block', padding: 0 }}>
                            <div style={{ marginBottom: 12 }}>
                              {record.banner_image && (
                                <img
                                  src={`/uploads/${record.banner_image}`}
                                  alt=""
                                  style={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 8, marginBottom: 8, border: `1px solid ${darkMode ? '#334155' : '#e5e7eb'}`, background: darkMode ? '#0f172a' : '#f0f4ff' }}
                                />
                              )}
                              <span
                                style={{ color: '#4a7cff', cursor: 'pointer', transition: 'color 0.2s', fontSize: 15, fontWeight: 600, display: 'block', marginBottom: 8 }}
                                onClick={() => navigate(`/admin/review/${record.id}`)}
                              >
                                {record.title}
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                              <div>
                                <span style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Author</span>
                                <div style={{ fontSize: 13, color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{record.first_name} {record.last_name}</div>
                              </div>
                              <div>
                                <span style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</span>
                                <div style={{ marginTop: 4 }}><Tag color="blue" style={{ fontSize: 12 }}>{record.content_type_name}</Tag></div>
                              </div>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                              <span style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Published Date</span>
                              <div style={{ marginTop: 4, fontSize: 13, color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>
                                {record.published_date ? new Date(record.published_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                              </div>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                              <span style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                              <div style={{ marginTop: 4 }}>
                                <Tag color={statusTagMap[record.status]?.color || 'default'} style={{ fontSize: 12 }}>
                                  {statusTagMap[record.status]?.text || record.status}
                                </Tag>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                              {record.status === 'pending' && (
                                <Button type="primary" size="small" icon={<EyeOutlined />}
                                  onClick={() => navigate(`/admin/review/${record.id}`)}
                                  style={{ minWidth: 80, flex: window.innerWidth < 768 ? '1 1 auto' : 'auto', background: '#10B981', borderColor: '#10B981' }}>
                                  Review
                                </Button>
                              )}
                              {record.status === 'approved' && (
                                <Button type="primary" size="small" icon={<SendOutlined />}
                                  loading={publishingId === record.id}
                                  onClick={() => handleDirectPublish(record.id)}
                                  style={{ minWidth: 80, flex: window.innerWidth < 768 ? '1 1 auto' : 'auto', background: '#0AAEEF', borderColor: '#0AAEEF' }}>
                                  Publish
                                </Button>
                              )}
                              {record.status !== 'pending' && record.status !== 'approved' && (
                                <Button size="small" icon={<EyeOutlined />}
                                  onClick={() => navigate(`/admin/review/${record.id}`)}
                                  style={{ minWidth: 60, flex: window.innerWidth < 768 ? '1 1 auto' : 'auto' }}>View</Button>
                              )}
                              <Popconfirm
                                title="Delete permanently?"
                                description="This cannot be undone."
                                onConfirm={() => handleDelete(record.id)}
                                okText="Delete" okButtonProps={{ danger: true }} cancelText="Cancel"
                              >
                                <Button danger size="small" icon={<DeleteOutlined />} style={{ minWidth: 40, flex: window.innerWidth < 768 ? '1 1 auto' : 'auto' }} />
                              </Popconfirm>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalItems > 0 && (
              <div style={{ padding: 'clamp(12px, 2vw, 24px)', borderTop: darkMode ? '1px solid #334155' : '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, flexDirection: window.innerWidth < 768 ? 'column' : 'row', alignItems: window.innerWidth < 768 ? 'stretch' : 'center' }}>
                <span style={{ fontSize: 'clamp(11px, 0.85vw, 13px)', color: darkMode ? '#94a3b8' : '#6b7280', textAlign: window.innerWidth < 768 ? 'center' : 'left' }}>
                  Showing {startIndex}-{endIndex} of {totalItems} submissions
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: window.innerWidth < 768 ? 'center' : 'flex-end', width: window.innerWidth < 768 ? '100%' : 'auto' }}>
                  {visibleCards < pageSize && visibleCards < filteredContent.length && (
                    <Button
                      type="default"
                      onClick={handleShowMore}
                      style={{ borderRadius: 8 }}
                    >
                      Show More ({pageSize - visibleCards} more)
                    </Button>
                  )}
                  {visibleCards >= pageSize && (
                    <Pagination
                      current={currentPage}
                      total={totalItems}
                      pageSize={pageSize}
                      onChange={(page) => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      showSizeChanger={false}
                      showQuickJumper={totalItems > 100}
                      size={window.innerWidth < 768 ? 'small' : 'default'}
                      style={{ width: window.innerWidth < 768 ? '100%' : 'auto', display: 'flex', justifyContent: window.innerWidth < 768 ? 'center' : 'flex-end' }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span><SafetyOutlined /> Security Overview</span>} key="security">
          <SecurityDashboard />
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span><TeamOutlined /> RBAC Management</span>} key="rbac">
          <RBACManagement />
        </Tabs.TabPane>
      </Tabs>
      <style>{`
        @media (max-width: 768px) {
          .admin-dashboard-tabs .ant-tabs-nav {
            overflow-x: auto !important;
            white-space: nowrap !important;
            -webkit-overflow-scrolling: touch;
          }
          .admin-dashboard-tabs .ant-tabs-nav::-webkit-scrollbar {
            display: none;
          }
          .admin-dashboard-tabs .ant-tabs-tab {
            flex-shrink: 0 !important;
          }
        }
      `}</style>
    </div>
    </ConfigProvider>
  );
};

export default AdminDashboard;
