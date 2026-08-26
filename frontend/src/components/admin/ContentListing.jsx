import React, { useState, useEffect } from 'react';
import {
  Table, Typography, Tag, Button, Dropdown,
  Input, Select, Space, Avatar, Checkbox, message,
  Row, Col, ConfigProvider, Tooltip,
} from 'antd';
import {
  EditOutlined, EyeOutlined, DeleteOutlined, MoreOutlined,
  SearchOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CalendarOutlined, FileTextOutlined, StarOutlined,
  PlusOutlined, UserOutlined, EyeOutlined as EyeIcon,
  UnorderedListOutlined, CheckOutlined, ThunderboltOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const { Text } = Typography;
const { Option } = Select;

/* ─────────────────────────────────────────────
   STYLING SYSTEM & ANIMATIONS (Dashboard Parity)
───────────────────────────────────────────── */
const listingStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

  .list-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    animation: listFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes listFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .list-stagger-1 { animation: listSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .list-stagger-2 { animation: listSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.10s both; }
  .list-stagger-3 { animation: listSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }

  @keyframes listSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .list-beacon-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #3B82F6;
    position: relative;
    display: inline-block;
  }
  .list-beacon-dot::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 2px solid #3B82F6;
    animation: listPulse 2s ease-out infinite;
  }
  @keyframes listPulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .list-kpi-card {
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
  .list-kpi-card:hover {
    transform: translateY(-3px);
  }
`;

const ContentListing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const D = darkMode;

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [contentType, setContentType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('draft');
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [stats, setStats] = useState({
    draft: 0,
    published: 0,
    pending: 0,
    total: 0,
  });

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/blogs')) {
      setContentType('blog');
      setStatusFilter('published');
    } else if (path.includes('/landing-pages')) {
      setContentType('landing-page');
      setStatusFilter('published');
    } else if (path.includes('/drafts')) {
      setContentType('all');
      setStatusFilter('draft');
    } else {
      setContentType('all');
      setStatusFilter('published');
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchContent();
  }, [filters, pagination.current, pagination.pageSize, contentType, statusFilter]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const offset = (pagination.current - 1) * pagination.pageSize;
      const params = { limit: pagination.pageSize, offset };

      if (contentType !== 'all') params.content_type = contentType;

      if (filters.status && filters.status !== 'all') {
        params.status = filters.status;
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (filters.search) params.search = filters.search;

      const endpoint = user?.role === 'admin' 
        ? '/api/admin/content/all' 
        : '/api/user/content';
      
      const response = await axios.get(endpoint, { params });
      
      if (user?.role === 'admin') {
        const data = response.data.data || [];
        setContent(data);
        setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
        
        const draftCount = data.filter(c => c.status === 'draft').length;
        const publishedCount = data.filter(c => c.status === 'published').length;
        const pendingCount = data.filter(c => c.status === 'pending').length;
        
        setStats({
          draft: draftCount,
          published: publishedCount,
          pending: pendingCount,
          total: data.length,
        });
      } else {
        const contentArray = response.data || [];
        setContent(contentArray);
        setPagination(prev => ({ ...prev, total: contentArray.length }));
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record, e) => {
    e?.stopPropagation();
    const canUserEdit = record.status === 'draft' || record.status === 'changes_requested';
    if (canUserEdit) {
      navigate(`/edit-content/${record.id}`);
    } else {
      navigate(`/admin/edit/${record.id}`);
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    try {
      const apiBase = user?.role === 'admin' ? '/api/admin' : '/api/user';
      await axios.delete(`${apiBase}/content/${id}`);
      message.success('Deleted successfully');
      fetchContent();
    } catch {
      message.error('Failed to delete');
    }
  };

  const statusColors = {
    published:         { color: '#10B981', bg: D ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)', icon: <CheckCircleOutlined /> },
    draft:             { color: '#6B7280', bg: D ? 'rgba(107,114,128,0.15)' : 'rgba(107,114,128,0.08)', icon: <EditOutlined /> },
    scheduled:         { color: '#F59E0B', bg: D ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)', icon: <CalendarOutlined /> },
    pending:           { color: '#3B82F6', bg: D ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.08)', icon: <ClockCircleOutlined /> },
    changes_requested: { color: '#F59E0B', bg: D ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)', icon: <EditOutlined /> },
    rejected:          { color: '#EF4444', bg: D ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)', icon: <DeleteOutlined /> },
    approved:          { color: '#10B981', bg: D ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)', icon: <CheckCircleOutlined /> },
  };

  const StatCard = ({ title, value, icon, color = 'primary', accentColor, subtitle }) => {
    const colorMap = {
      primary: { bg: D ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' },
      success: { bg: D ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
      warning: { bg: D ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
      danger: { bg: D ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
    };
    const c = colorMap[color] || colorMap.primary;

    return (
      <div
        className="list-kpi-card"
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
      title: '',
      dataIndex: 'selection',
      width: 40,
      render: (_, record) => (
        <Checkbox
          checked={selectedRowKeys.includes(record.id)}
          onChange={(e) => {
            e.stopPropagation();
            setSelectedRowKeys(prev =>
              e.target.checked ? [...prev, record.id] : prev.filter(k => k !== record.id)
            );
          }}
          onClick={e => e.stopPropagation()}
        />
      ),
    },
    {
      title: 'Article Details',
      dataIndex: 'title',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            background: D ? '#0F172A' : '#F1F5F9', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
          }}>
            {record.banner_image
              ? <img src={`/uploads/${record.banner_image}`} alt={text} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <FileTextOutlined style={{ fontSize: 18, color: D ? '#64748B' : '#94A3B8' }} />
            }
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '0.86rem', color: D ? '#F8FAFC' : '#0F172A', display: 'block' }}>
              {text}
            </span>
            <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>
              {record.category_name || 'General'}
              {record.content_type_name && (
                <Tag color="purple" style={{ marginLeft: 6, fontSize: '0.68rem', borderRadius: 4 }}>
                  {record.content_type_name}
                </Tag>
              )}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Author',
      dataIndex: 'first_name',
      render: (_, record) => {
        const name = [record.first_name, record.last_name].filter(Boolean).join(' ') || 'Editorial Team';
        return (
          <Space size={8}>
            <Avatar size={26} icon={<UserOutlined />} style={{ background: D ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.1)', color: '#3B82F6' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: D ? '#CBD5E1' : '#334155' }}>{name}</span>
          </Space>
        );
      },
    },
    {
      title: 'SEO Health',
      dataIndex: 'seo_meta_title',
      render: (_, record) => {
        const score = 85;
        const color = score >= 80 ? '#10B981' : '#F59E0B';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StarOutlined style={{ color, fontSize: 14 }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color }}>{score}%</span>
          </div>
        );
      },
    },
    {
      title: 'Views',
      dataIndex: 'view_count',
      render: (views) => (
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: D ? '#CBD5E1' : '#334155' }}>
          {(views || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => {
        const s = status || 'draft';
        const cfg = statusColors[s] || statusColors.draft;
        return (
          <Tag color={cfg.color} style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px', fontSize: '0.72rem', textTransform: 'capitalize' }}>
            {s.replace('_', ' ')}
          </Tag>
        );
      },
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      render: (_, record) => {
        const date = record.scheduled_publish_date || record.published_date || record.created_at;
        return (
          <span style={{ fontSize: '0.75rem', color: D ? '#64748B' : '#94A3B8', fontWeight: 600 }}>
            {date ? moment(date).format('MMM D, YYYY') : '—'}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 60,
      align: 'right',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit Content',
                onClick: ({ domEvent }) => handleEdit(record, domEvent),
              },
              {
                key: 'preview',
                icon: <EyeOutlined />,
                label: 'Preview Article',
                onClick: ({ domEvent }) => {
                  domEvent.stopPropagation();
                  navigate(`/${record.content_type || 'article'}-preview/${record.id}`);
                },
              },
              { type: 'divider' },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete Content',
                danger: true,
                onClick: ({ domEvent }) => handleDelete(record.id, domEvent),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            style={{ color: D ? '#64748B' : '#94A3B8', borderRadius: 6 }}
            onClick={e => e.stopPropagation()}
          />
        </Dropdown>
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
      <style>{listingStyles}</style>

      <div className="list-root" style={{ padding: '24px 28px', background: D ? '#0A1229' : '#F8FAFC', minHeight: '100vh' }}>
        {/* ── COMMAND HEADER BANNER ── */}
        <div
          className="list-stagger-1"
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
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent)' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="list-beacon-dot" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#3B82F6' }}>
                Content Studio & Drafts
              </span>
              <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>•</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B' }}>
                {stats.total} Total Articles
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileTextOutlined style={{ color: '#3B82F6' }} /> Drafts & Article Workspace
            </h1>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/dashboard/create-post')}
            style={{
              background: 'linear-gradient(135deg, #0B1F4D 0%, #2563EB 100%)',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              height: 42,
              padding: '0 20px',
              fontSize: '0.85rem',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            Create New Article
          </Button>
        </div>

        {/* ── EXECUTIVE KPI GRID ── */}
        <div
          className="list-stagger-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard title="Total Articles" value={stats.total} icon={<FileTextOutlined />} color="primary" accentColor="#3B82F6" subtitle="All Platform Content" />
          <StatCard title="Published Live" value={stats.published} icon={<CheckOutlined />} color="success" accentColor="#10B981" subtitle="Visible on Site" />
          <StatCard title="Draft Workspaces" value={stats.draft} icon={<UnorderedListOutlined />} color="warning" accentColor="#F59E0B" subtitle="In Progress" />
          <StatCard title="Pending Review" value={stats.pending} icon={<ClockCircleOutlined />} color="danger" accentColor="#EF4444" subtitle="In Queue" />
        </div>

        {/* ── MAIN TABLE CONTAINER ── */}
        <div
          className="list-stagger-3"
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
                Content Directory
              </h3>
              <span style={{ fontSize: '0.78rem', color: D ? '#64748B' : '#94A3B8' }}>
                Showing {content.length} of {pagination.total} articles
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
                  placeholder="Search articles..."
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
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
                style={{ width: 150, borderRadius: 10 }}
                value={filters.status}
                onChange={(v) => setFilters(f => ({ ...f, status: v }))}
              >
                <Option value="all">All Status</Option>
                <Option value="published">Published</Option>
                <Option value="draft">Drafts</Option>
                <Option value="pending">Pending</Option>
                <Option value="changes_requested">Revisions</Option>
              </Select>

              <Tooltip title="Reload Content">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchContent}
                  style={{
                    borderRadius: 10,
                    border: `1px solid ${D ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.8)'}`,
                    background: D ? '#1E293B' : '#F1F5F9',
                    color: D ? '#F8FAFC' : '#0F172A',
                  }}
                />
              </Tooltip>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={content}
            loading={loading}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showTotal: (total) => <span style={{ fontSize: '0.78rem', color: D ? '#64748B' : '#94A3B8' }}>Total {total} items</span>,
              onChange: (page, size) => setPagination(prev => ({ ...prev, current: page, pageSize: size })),
            }}
            onRow={(record) => ({
              onClick: () => handleEdit(record),
              style: { cursor: 'pointer' },
            })}
          />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default ContentListing;
