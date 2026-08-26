import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Row, Col, Card, Button, Space, Tag, Badge, message, Popconfirm,
  Typography, Tabs, Empty, Spin, Avatar, Pagination, ConfigProvider,
  Input, Select, Tooltip, Switch, Drawer, Table, Modal, Divider
} from 'antd';
import {
  EyeOutlined, EditOutlined, DeleteOutlined, SendOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  PlusOutlined, UserOutlined, CalendarOutlined, TagOutlined,
  FileTextOutlined, SearchOutlined, AppstoreOutlined, UnorderedListOutlined,
  GlobalOutlined, CheckOutlined, CloseOutlined, ArrowUpOutlined,
  FilterOutlined, ReloadOutlined, CompassOutlined, BookOutlined,
  VideoCameraOutlined, FilePdfOutlined, StarOutlined, LinkOutlined,
  ThunderboltOutlined, RiseOutlined, FireOutlined,
  EyeInvisibleOutlined, SafetyCertificateOutlined, CodeOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import './radar/RadarStyles.css';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

// Content Type Definitions & Icons
const CONTENT_TYPE_CONFIG = {
  all:         { label: 'All Content',   color: '#0AAEEF', icon: <FileTextOutlined /> },
  article:     { label: 'Articles',      color: '#3B82F6', icon: <FileTextOutlined /> },
  blog:        { label: 'Blogs',         color: '#8B5CF6', icon: <BookOutlined /> },
  news:        { label: 'News',          color: '#EC4899', icon: <ThunderboltOutlined /> },
  whitepaper:  { label: 'Whitepapers',  color: '#10B981', icon: <FilePdfOutlined /> },
  ebook:       { label: 'eBooks',        color: '#F59E0B', icon: <BookOutlined /> },
  webinar:     { label: 'Webinars',      color: '#6366F1', icon: <VideoCameraOutlined /> },
  event:       { label: 'Events',        color: '#14B8A6', icon: <CalendarOutlined /> },
  interview:   { label: 'Interviews',    color: '#06B6D4', icon: <UserOutlined /> },
  'case-study':{ label: 'Case Studies',  color: '#D946EF', icon: <StarOutlined /> },
  report:      { label: 'Reports',       color: '#84CC16', icon: <FileTextOutlined /> },
  guide:       { label: 'Guides',        color: '#F97316', icon: <CompassOutlined /> },
};

const STATUS_CONFIG = {
  published:         { color: 'success',    label: 'Published',         badge: '#10B981', bgDark: 'rgba(16, 185, 129, 0.15)', bgLight: '#ECFDF5' },
  draft:             { color: 'default',    label: 'Draft',             badge: '#94A3B8', bgDark: 'rgba(148, 163, 184, 0.15)', bgLight: '#F1F5F9' },
  pending:           { color: 'processing', label: 'Pending Review',    badge: '#0AAEEF', bgDark: 'rgba(10, 174, 239, 0.15)', bgLight: '#E0F2FE' },
  changes_requested: { color: 'warning',    label: 'Changes Requested', badge: '#F59E0B', bgDark: 'rgba(245, 158, 11, 0.15)', bgLight: '#FEF3C7' },
  rejected:          { color: 'error',      label: 'Rejected',          badge: '#EF4444', bgDark: 'rgba(239, 68, 68, 0.15)', bgLight: '#FEE2E2' },
  approved:          { color: 'cyan',       label: 'Approved',          badge: '#06B6D4', bgDark: 'rgba(6, 182, 212, 0.15)', bgLight: '#CFFAFE' },
};

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
};

const formatImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  let cleaned = url.trim().replace(/\\/g, '/');
  if (!cleaned) return null;
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://') || cleaned.startsWith('data:')) {
    return cleaned;
  }
  if (cleaned.startsWith('/uploads/')) {
    return cleaned;
  }
  if (cleaned.startsWith('uploads/')) {
    return `/${cleaned}`;
  }
  if (cleaned.startsWith('/')) {
    cleaned = cleaned.substring(1);
  }
  return `/uploads/${cleaned}`;
};

const getContentImage = (item) => {
  if (!item) return null;
  const raw = item.banner_image || item.featured_image || item.image_url || item.thumbnail || item.cover_image;
  if (raw && typeof raw === 'string' && raw.trim()) {
    return formatImageUrl(raw);
  }
  if (item.pdf_file && typeof item.pdf_file === 'string' && item.pdf_file.match(/\.(jpg|jpeg|png|webp|svg)/i)) {
    return formatImageUrl(item.pdf_file);
  }
  if (item.builder_content_elements) {
    try {
      const elements = typeof item.builder_content_elements === 'string' ? JSON.parse(item.builder_content_elements) : item.builder_content_elements;
      if (Array.isArray(elements)) {
        const imgEl = elements.find(e => (e.type === 'image' || e.type === 'banner') && (e.src || e.url));
        if (imgEl) return formatImageUrl(imgEl.src || imgEl.url);
      }
    } catch {}
  }
  return null;
};

const AdminContent = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Primary Data State
  const [allContents, setAllContents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);
  const [visibilityLoadingId, setVisibilityLoadingId] = useState(null);

  // Filters & Controls
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [activeTypeTab, setActiveTypeTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'views', 'title'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  // Quick Inspection Drawer
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load Content on Mount
  useEffect(() => {
    fetchContents();
    fetchCategories();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/content/all', { params: { limit: 10000 } });
      setAllContents(res.data.data || []);
    } catch (error) {
      console.error('Failed to load content:', error);
      message.error('Failed to load publications library');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/admin/categories');
      setCategories(res.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  // Actions
  const handleSubmitForReview = async (e, contentId) => {
    if (e) e.stopPropagation();
    setSubmittingId(contentId);
    try {
      await axios.post(`/api/admin/content/${contentId}/submit`);
      message.success('Publication submitted for editorial review');
      fetchContents();
    } catch (err) {
      message.error('Failed to submit content');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDelete = async (contentId) => {
    try {
      await axios.delete(`/api/admin/content/${contentId}`);
      message.success('Publication deleted successfully');
      fetchContents();
      if (selectedArticle?.id === contentId) setDrawerOpen(false);
    } catch (err) {
      message.error('Failed to delete publication');
    }
  };

  const handleToggleVisibility = async (e, content) => {
    if (e) e.stopPropagation();
    setVisibilityLoadingId(content.id);
    const newVisibility = content.is_visible === 0 ? 1 : 0;
    try {
      await axios.put(`/api/admin/content/${content.id}/visibility`, { is_visible: newVisibility });
      message.success(`Publication is now ${newVisibility ? 'visible' : 'hidden'} on live website`);
      setAllContents(prev => prev.map(c => c.id === content.id ? { ...c, is_visible: newVisibility } : c));
      if (selectedArticle?.id === content.id) {
        setSelectedArticle(prev => ({ ...prev, is_visible: newVisibility }));
      }
    } catch (err) {
      message.error('Failed to update publication visibility');
    } finally {
      setVisibilityLoadingId(null);
    }
  };

  // Filtered & Sorted Content Computation
  const filteredContents = useMemo(() => {
    return allContents.filter(item => {
      // 1. Content Type Filter
      if (activeTypeTab !== 'all') {
        const itemType = (item.content_type_name || item.content_type || '').toLowerCase();
        if (itemType !== activeTypeTab) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // 3. Category Filter
      if (categoryFilter !== 'all') {
        const catId = item.category_id ? String(item.category_id) : '';
        const catName = (item.category_name || '').toLowerCase();
        if (catId !== categoryFilter && catName !== categoryFilter.toLowerCase()) {
          return false;
        }
      }

      // 4. Search Query (Title, Description, Author, Tags)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const descMatch = (item.short_description || '').toLowerCase().includes(q);
        const authorMatch = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase().includes(q);
        const tags = parseTags(item.tags).join(' ').toLowerCase();
        const tagMatch = tags.includes(q);
        if (!titleMatch && !descMatch && !authorMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      if (sortBy === 'views') {
        return (b.view_count || 0) - (a.view_count || 0);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });
  }, [allContents, activeTypeTab, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Key KPI Overview Metrics
  const metrics = useMemo(() => {
    const total = allContents.length;
    const published = allContents.filter(c => c.status === 'published').length;
    const inReview = allContents.filter(c => c.status === 'pending').length;
    const drafts = allContents.filter(c => c.status === 'draft' || c.status === 'changes_requested').length;
    const totalViews = allContents.reduce((acc, c) => acc + (c.view_count || 0), 0);

    return { total, published, inReview, drafts, totalViews };
  }, [allContents]);

  // Paginated Slices
  const paginatedContents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContents.slice(start, start + pageSize);
  }, [filteredContents, currentPage, pageSize]);

  // Dynamic Theme Colors
  const bgCard = darkMode ? 'rgba(30, 41, 59, 0.75)' : '#ffffff';
  const borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';
  const textPrimary = darkMode ? '#F1F5F9' : '#0F172A';
  const textMuted = darkMode ? '#94A3B8' : '#64748B';

  // Table Columns Setup
  const tableColumns = [
    {
      title: 'Publication',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => {
        const typeKey = (record.content_type_name || record.content_type || 'article').toLowerCase();
        const typeConfig = CONTENT_TYPE_CONFIG[typeKey] || CONTENT_TYPE_CONFIG.article;
        const itemImg = getContentImage(record);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              overflow: 'hidden',
              background: 'rgba(14, 165, 233, 0.1)',
              border: `1px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {itemImg ? (
                <img src={itemImg} alt={text} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: typeConfig.color, fontSize: 16 }}>{typeConfig.icon}</span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                onClick={() => { setSelectedArticle(record); setDrawerOpen(true); }}
                style={{
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  color: textPrimary,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 320
                }}
              >
                {text || 'Untitled Publication'}
              </div>
              <div style={{ fontSize: '0.72rem', color: textMuted, display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                <span>{record.category_name || 'General'}</span>
                <span>•</span>
                <span>{moment(record.created_at).format('MMM D, YYYY')}</span>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      title: 'Type',
      key: 'content_type',
      width: 120,
      render: (_, record) => {
        const typeKey = (record.content_type_name || record.content_type || 'article').toLowerCase();
        const cfg = CONTENT_TYPE_CONFIG[typeKey] || CONTENT_TYPE_CONFIG.article;
        return (
          <div className="radar-chip" style={{ color: cfg.color, borderColor: `${cfg.color}40`, background: `${cfg.color}15` }}>
            {cfg.icon}
            <span style={{ textTransform: 'capitalize' }}>{typeKey}</span>
          </div>
        );
      }
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      render: (_, record) => {
        const st = STATUS_CONFIG[record.status] || STATUS_CONFIG.draft;
        return (
          <Tag color={st.color} style={{ borderRadius: 6, fontWeight: 600, padding: '2px 8px' }}>
            {st.label}
          </Tag>
        );
      }
    },
    {
      title: 'Author',
      key: 'author',
      width: 140,
      render: (_, record) => (
        <div style={{ fontSize: '0.8rem', color: textPrimary, fontWeight: 500 }}>
          {record.first_name ? `${record.first_name} ${record.last_name || ''}` : (record.author_email || 'Editorial')}
        </div>
      )
    },
    {
      title: 'Views',
      dataIndex: 'view_count',
      key: 'view_count',
      width: 90,
      sorter: (a, b) => (a.view_count || 0) - (b.view_count || 0),
      render: (views) => (
        <span style={{ fontWeight: 700, color: '#0AAEEF', fontSize: '0.84rem' }}>
          {(views || 0).toLocaleString()}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Quick Inspect">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => { setSelectedArticle(record); setDrawerOpen(true); }}
              style={{ color: '#0AAEEF' }}
            />
          </Tooltip>
          <Tooltip title="Edit Publication">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/dashboard/create-post?edit=${record.id}`)}
              style={{ color: '#3B82F6' }}
            />
          </Tooltip>
          <Tooltip title={record.is_visible === 0 ? 'Make Visible' : 'Hide from Site'}>
            <Button
              type="text"
              size="small"
              icon={record.is_visible === 0 ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={(e) => handleToggleVisibility(e, record)}
              loading={visibilityLoadingId === record.id}
              style={{ color: record.is_visible === 0 ? '#F59E0B' : '#10B981' }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Publication"
            description="Are you sure you want to permanently delete this content?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className={`radar-dashboard-root ${darkMode ? 'dark' : 'light'} radar-grid-bg`} style={{ minHeight: '100vh', padding: '24px' }}>
      {/* ── 1. CYBER HEADER COMMAND BAR ── */}
      <div className="radar-glass-panel" style={{ padding: '18px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Live signal beacon */}
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, rgba(10, 174, 239, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)', border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <span className="live-indicator-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: '#0AAEEF', display: 'inline-block' }}></span>
            <div className="pulse-beacon" style={{ position: 'absolute', width: 24, height: 24, borderRadius: '50%', border: '2px solid #0AAEEF', pointerEvents: 'none' }}></div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: textPrimary, letterSpacing: '-0.02em' }}>
                All Contents & Global Publications
              </h1>
              <span className="radar-chip" style={{ fontSize: '0.7rem' }}>
                <ThunderboltOutlined style={{ color: '#0AAEEF' }} /> LIVE ENGINE
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: textMuted }}>
              Centralized repository for articles, blogs, whitepapers, case studies, and corporate media.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            type="default"
            icon={<ReloadOutlined spin={loading} />}
            onClick={fetchContents}
            style={{ borderRadius: 10, fontWeight: 600, borderColor, background: darkMode ? 'rgba(15,23,42,0.6)' : '#fff', color: textPrimary }}
          >
            Refresh
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/dashboard/create-post')}
            style={{ borderRadius: 10, fontWeight: 700, background: 'linear-gradient(135deg, #0B1F4D 0%, #1D3D8F 60%, #F7941D 200%)', border: '1px solid rgba(247,148,29,0.35)', boxShadow: '0 4px 14px rgba(11,31,77,0.28)' }}
          >
            Create Publication
          </Button>
        </div>
      </div>

      {/* ── 2. EXECUTIVE METRICS KPI PANEL ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6} lg={6}>
          <div className="radar-glass-panel radar-card-hover" style={{ padding: '16px 20px', background: bgCard, borderColor, borderLeft: '3px solid #F7941D' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Publications
              </span>
              <FileTextOutlined style={{ fontSize: 18, color: '#F7941D' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: textPrimary, marginTop: 8 }}>
              {metrics.total.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10B981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <RiseOutlined /> Active Content Library
            </div>
          </div>
        </Col>

        <Col xs={12} sm={12} md={6} lg={6}>
          <div className="radar-glass-panel radar-card-hover" style={{ padding: '16px 20px', background: bgCard, borderColor }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Published Live
              </span>
              <CheckCircleOutlined style={{ fontSize: 18, color: '#10B981' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', marginTop: 8 }}>
              {metrics.published.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: textMuted, marginTop: 4 }}>
              {metrics.total > 0 ? `${Math.round((metrics.published / metrics.total) * 100)}% of total portfolio` : '0%'}
            </div>
          </div>
        </Col>

        <Col xs={12} sm={12} md={6} lg={6}>
          <div className="radar-glass-panel radar-card-hover" style={{ padding: '16px 20px', background: bgCard, borderColor }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Drafts & In-Review
              </span>
              <ClockCircleOutlined style={{ fontSize: 18, color: '#F59E0B' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F59E0B', marginTop: 8 }}>
              {(metrics.drafts + metrics.inReview).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: textMuted, marginTop: 4 }}>
              {metrics.inReview} awaiting approval
            </div>
          </div>
        </Col>

        <Col xs={12} sm={12} md={6} lg={6}>
          <div className="radar-glass-panel radar-card-hover" style={{ padding: '16px 20px', background: bgCard, borderColor, borderLeft: '3px solid #0B1F4D' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Aggregate Views
              </span>
              <FireOutlined style={{ fontSize: 18, color: '#0AAEEF' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0AAEEF', marginTop: 8 }}>
              {metrics.totalViews.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: textMuted, marginTop: 4 }}>
              Combined readership engagement
            </div>
          </div>
        </Col>
      </Row>

      {/* ── 3. FILTER & NAVIGATION BAR ── */}
      <div className="radar-glass-panel" style={{ padding: '16px 20px', marginBottom: 20 }}>
        {/* Top Tier: Content Type Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 14, borderBottom: `1px solid ${borderColor}` }} className="cyber-scrollbar">
          {Object.keys(CONTENT_TYPE_CONFIG).map(typeKey => {
            const cfg = CONTENT_TYPE_CONFIG[typeKey];
            const isActive = activeTypeTab === typeKey;
            const count = typeKey === 'all'
              ? allContents.length
              : allContents.filter(c => (c.content_type_name || c.content_type || '').toLowerCase() === typeKey).length;

            return (
              <button
                key={typeKey}
                onClick={() => { setActiveTypeTab(typeKey); setCurrentPage(1); }}
                className={`cyber-tab-pill ${isActive ? 'active' : ''}`}
              >
                <span style={{ color: isActive ? '#0AAEEF' : cfg.color }}>{cfg.icon}</span>
                <span>{cfg.label}</span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: 10,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  background: isActive ? '#0AAEEF' : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                  color: isActive ? '#fff' : textMuted
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Tier: Search, Filters & View Mode */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 280 }}>
            {/* Cyber Search Input */}
            <Input
              prefix={<SearchOutlined style={{ color: '#0AAEEF' }} />}
              placeholder="Search title, description, author or tags..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              allowClear
              style={{
                borderRadius: 10,
                background: darkMode ? 'rgba(15, 23, 42, 0.6)' : '#fff',
                borderColor,
                color: textPrimary,
                maxWidth: 360
              }}
            />

            {/* Status Filter Dropdown */}
            <Select
              value={statusFilter}
              onChange={val => { setStatusFilter(val); setCurrentPage(1); }}
              style={{ width: 150 }}
              dropdownStyle={{ background: darkMode ? '#0f172a' : '#fff' }}
            >
              <Option value="all">All Statuses</Option>
              <Option value="published">Published</Option>
              <Option value="draft">Drafts</Option>
              <Option value="pending">Pending Review</Option>
              <Option value="changes_requested">Changes Requested</Option>
              <Option value="rejected">Rejected</Option>
            </Select>

            {/* Category Filter Dropdown */}
            <Select
              value={categoryFilter}
              onChange={val => { setCategoryFilter(val); setCurrentPage(1); }}
              style={{ width: 150 }}
              dropdownStyle={{ background: darkMode ? '#0f172a' : '#fff' }}
            >
              <Option value="all">All Categories</Option>
              {categories.map(cat => (
                <Option key={cat.id} value={String(cat.id)}>{cat.name}</Option>
              ))}
            </Select>

            {/* Sort Selector */}
            <Select
              value={sortBy}
              onChange={val => setSortBy(val)}
              style={{ width: 140 }}
              dropdownStyle={{ background: darkMode ? '#0f172a' : '#fff' }}
            >
              <Option value="newest">Newest First</Option>
              <Option value="oldest">Oldest First</Option>
              <Option value="views">Most Viewed</Option>
              <Option value="title">Title A-Z</Option>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: darkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(226, 232, 240, 0.6)', padding: 3, borderRadius: 10, border: `1px solid ${borderColor}` }}>
            <Button
              type={viewMode === 'grid' ? 'primary' : 'text'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('grid')}
              size="small"
              style={{ borderRadius: 7 }}
            >
              Grid
            </Button>
            <Button
              type={viewMode === 'table' ? 'primary' : 'text'}
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode('table')}
              size="small"
              style={{ borderRadius: 7 }}
            >
              Table
            </Button>
          </div>
        </div>
      </div>

      {/* ── 4. CONTENT DISPLAY ZONE ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" tip="Scanning publication library..." />
        </div>
      ) : paginatedContents.length === 0 ? (
        <div className="radar-glass-panel" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <Empty description={<span style={{ color: textMuted }}>No publications match your filter criteria</span>}>
            <Button
              type="primary"
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); setCategoryFilter('all'); setActiveTypeTab('all'); }}
              style={{ borderRadius: 10, background: '#0AAEEF' }}
            >
              Reset Filters
            </Button>
          </Empty>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <Row gutter={[18, 18]}>
          {paginatedContents.map((item, idx) => {
            const typeKey = (item.content_type_name || item.content_type || 'article').toLowerCase();
            const typeConfig = CONTENT_TYPE_CONFIG[typeKey] || CONTENT_TYPE_CONFIG.article;
            const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
            const isVisible = item.is_visible !== 0;
            const itemImg = getContentImage(item);

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                <div
                  className="radar-glass-panel radar-card-hover cyber-card-animated"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    background: bgCard,
                    borderColor,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    animationDelay: `${Math.min(idx * 0.04, 0.4)}s`
                  }}
                >
                  {/* Thumbnail / Header Area */}
                  <div style={{ position: 'relative', height: 165, background: 'rgba(15, 23, 42, 0.85)', overflow: 'hidden' }}>
                    {itemImg ? (
                      <img
                        src={itemImg}
                        alt={item.title}
                        className="cyber-image-zoom"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isVisible ? 1 : 0.45 }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement.querySelector('.image-fallback-box');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="image-fallback-box" style={{ width: '100%', height: '100%', display: itemImg ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(circle at 50% 50%, ${typeConfig.color}30 0%, rgba(15,23,42,0.9) 100%)` }}>
                      <span style={{ fontSize: 38, color: typeConfig.color, filter: 'drop-shadow(0 0 10px rgba(10,174,239,0.4))' }}>{typeConfig.icon}</span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 6, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700 }}>
                        {typeConfig.label}
                      </span>
                    </div>

                    {/* Top Overlay Badges */}
                    <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="radar-chip" style={{ color: typeConfig.color, borderColor: `${typeConfig.color}50`, background: 'rgba(15,23,42,0.75)' }}>
                        {typeConfig.icon} <span style={{ textTransform: 'capitalize' }}>{typeKey}</span>
                      </span>

                      <Tag color={statusConfig.color} style={{ margin: 0, borderRadius: 6, fontWeight: 700 }}>
                        {statusConfig.label}
                      </Tag>
                    </div>

                    {/* Visibility indicator */}
                    {!isVisible && (
                      <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
                        <Tag color="volcano" style={{ margin: 0, borderRadius: 6 }}>Hidden from Live Site</Tag>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: textMuted, marginBottom: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span>{item.category_name || 'General'}</span>
                        <span>•</span>
                        <span>{moment(item.created_at).format('MMM D, YYYY')}</span>
                      </div>

                      <h3
                        onClick={() => { setSelectedArticle(item); setDrawerOpen(true); }}
                        style={{
                          fontSize: '0.94rem',
                          fontWeight: 700,
                          color: textPrimary,
                          margin: '0 0 8px 0',
                          cursor: 'pointer',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.35'
                        }}
                      >
                        {item.title || 'Untitled Article'}
                      </h3>

                      {item.short_description && (
                        <p style={{
                          fontSize: '0.78rem',
                          color: textMuted,
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.4'
                        }}>
                          {item.short_description}
                        </p>
                      )}
                    </div>

                    {/* Author & Stats Footer */}
                    <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar size="small" icon={<UserOutlined />} style={{ background: '#0AAEEF' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: textPrimary, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.first_name ? `${item.first_name}` : 'Editorial'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0AAEEF', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <EyeOutlined /> {(item.view_count || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Quick Action Bar */}
                  <div style={{ padding: '10px 16px', background: darkMode ? 'rgba(15, 23, 42, 0.4)' : 'rgba(240, 249, 255, 0.5)', borderTop: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => { setSelectedArticle(item); setDrawerOpen(true); }}
                      style={{ padding: 0, color: '#0AAEEF', fontSize: '0.78rem', fontWeight: 600 }}
                    >
                      Inspect
                    </Button>

                    <Space size="small">
                      <Tooltip title="Edit">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => navigate(`/dashboard/create-post?edit=${item.id}`)}
                          style={{ color: '#3B82F6' }}
                        />
                      </Tooltip>

                      <Tooltip title={isVisible ? 'Hide Content' : 'Show Content'}>
                        <Button
                          type="text"
                          size="small"
                          icon={isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                          onClick={(e) => handleToggleVisibility(e, item)}
                          loading={visibilityLoadingId === item.id}
                          style={{ color: isVisible ? '#10B981' : '#F59E0B' }}
                        />
                      </Tooltip>

                      <Popconfirm
                        title="Delete Content"
                        description="Permanently delete this publication?"
                        onConfirm={() => handleDelete(item.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      ) : (
        /* TABLE VIEW */
        <div className="radar-glass-panel" style={{ padding: '16px', background: bgCard, borderColor }}>
          <Table
            dataSource={paginatedContents}
            columns={tableColumns}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        </div>
      )}

      {/* ── 5. CYBER PAGINATION BAR ── */}
      {filteredContents.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredContents.length}
            onChange={(page, pSize) => { setCurrentPage(page); setPageSize(pSize); }}
            showSizeChanger
            pageSizeOptions={['12', '18', '24', '48', '96']}
          />
        </div>
      )}

      {/* ── 6. QUICK INSPECTION CYBER DRAWER ── */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: textPrimary }}>
            <ThunderboltOutlined style={{ color: '#0AAEEF' }} />
            <span>Publication Quick Inspection</span>
          </div>
        }
        placement="right"
        width={540}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        drawerStyle={{ background: darkMode ? '#0c1c38' : '#f8fafc', color: textPrimary }}
        headerStyle={{ background: darkMode ? '#060c18' : '#fff', borderBottom: `1px solid ${borderColor}` }}
      >
        {selectedArticle && (() => {
          const selectedImg = getContentImage(selectedArticle);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Header Image */}
              {selectedImg && (
                <div style={{ width: '100%', height: 210, borderRadius: 12, overflow: 'hidden', border: `1px solid ${borderColor}` }}>
                  <img src={selectedImg} alt={selectedArticle.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

            {/* Title & Status */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Tag color={STATUS_CONFIG[selectedArticle.status]?.color || 'default'}>
                  {STATUS_CONFIG[selectedArticle.status]?.label || selectedArticle.status}
                </Tag>
                <span className="radar-chip" style={{ fontSize: '0.7rem' }}>
                  {selectedArticle.content_type_name || selectedArticle.content_type || 'Article'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: textPrimary, margin: 0 }}>
                {selectedArticle.title}
              </h2>
            </div>

            {/* Key Meta Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }} className="radar-glass-panel">
              <div style={{ padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: textMuted }}>READERSHIP VIEWS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0AAEEF', marginTop: 2 }}>
                  {(selectedArticle.view_count || 0).toLocaleString()}
                </div>
              </div>
              <div style={{ padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: textMuted }}>VISIBILITY</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedArticle.is_visible !== 0 ? '#10B981' : '#F59E0B', marginTop: 4 }}>
                  {selectedArticle.is_visible !== 0 ? 'Live Website' : 'Hidden'}
                </div>
              </div>
              <div style={{ padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: textMuted }}>CATEGORY</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: textPrimary, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedArticle.category_name || 'General'}
                </div>
              </div>
            </div>

            {/* Short Description */}
            {selectedArticle.short_description && (
              <div>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: textMuted, letterSpacing: '0.05em' }}>Description</h4>
                <p style={{ fontSize: '0.86rem', color: textPrimary, lineHeight: '1.5' }}>
                  {selectedArticle.short_description}
                </p>
              </div>
            )}

            {/* Meta Tags */}
            {parseTags(selectedArticle.tags).length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: textMuted, letterSpacing: '0.05em' }}>Tags</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {parseTags(selectedArticle.tags).map((tag, i) => (
                    <span key={i} className="radar-chip" style={{ fontSize: '0.72rem' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Divider style={{ borderColor }} />

            {/* Quick Control Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                block
                onClick={() => { setDrawerOpen(false); navigate(`/dashboard/create-post?edit=${selectedArticle.id}`); }}
                style={{ borderRadius: 10, background: 'linear-gradient(135deg, #0B1F4D 0%, #1D3D8F 60%, #F7941D 200%)', border: '1px solid rgba(247,148,29,0.35)', boxShadow: '0 4px 14px rgba(11,31,77,0.3)' }}
              >
                Edit Publication
              </Button>

              <Button
                icon={selectedArticle.is_visible === 0 ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                block
                onClick={(e) => handleToggleVisibility(e, selectedArticle)}
                loading={visibilityLoadingId === selectedArticle.id}
                style={{ borderRadius: 10, borderColor }}
              >
                {selectedArticle.is_visible === 0 ? 'Make Visible on Site' : 'Hide from Public Site'}
              </Button>

              {selectedArticle.status === 'draft' && (
                <Button
                  icon={<SendOutlined />}
                  block
                  loading={submittingId === selectedArticle.id}
                  onClick={(e) => handleSubmitForReview(e, selectedArticle.id)}
                  style={{ borderRadius: 10, borderColor: '#F59E0B', color: '#F59E0B' }}
                >
                  Submit for Editorial Review
                </Button>
              )}
            </div>
          </div>
        );
      })()}
      </Drawer>
    </div>
  );
};

export default AdminContent;
