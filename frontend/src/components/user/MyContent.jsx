import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Tag, Badge, Empty, Spin, message, Modal, Tooltip } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DownOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  FolderOpenOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text } = Typography;

/* ─────────────────────────────────────────────
   INJECTED CSS — My Content Enterprise Styling
───────────────────────────────────────────── */
const myContentStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  .content-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    letter-spacing: -0.01em;
    animation: contentFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  @keyframes contentFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .c-stagger-1 { animation: cSlideUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .c-stagger-2 { animation: cSlideUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.10s both; }
  .c-stagger-3 { animation: cSlideUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }

  @keyframes cSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Header Command Bar ── */
  .content-header {
    border-radius: 16px;
    padding: 18px 24px;
    margin-bottom: 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(16px);
  }
  .content-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent);
  }

  /* ── Story Card ── */
  .content-card {
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid;
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }
  .content-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.2);
  }
  .content-thumb {
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    width: 100%;
    height: 180px;
    object-fit: cover;
  }
  .content-card:hover .content-thumb {
    transform: scale(1.04);
  }

  .content-btn-primary {
    background: linear-gradient(135deg, #0B1F4D 0%, #1D3D8F 100%);
    border: 1px solid rgba(247, 148, 29, 0.35);
    color: #FFFFFF;
    font-weight: 700;
    border-radius: 10px;
    padding: 7px 16px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
    font-size: 0.82rem;
  }
  .content-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(11, 31, 77, 0.3);
    color: #FFFFFF;
  }
`;

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
};

const statusConfig = {
  draft:             { color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)', text: 'Draft' },
  pending:           { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)',  text: 'Pending Review' },
  approved:          { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', text: 'Approved' },
  published:         { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', text: 'Published' },
  rejected:          { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)',   text: 'Rejected' },
  changes_requested: { color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', text: 'Changes Requested' }
};

const STATUS_FILTERS = [
  { key: 'all',               label: 'All Status' },
  { key: 'published',         label: 'Published' },
  { key: 'pending',           label: 'In Review' },
  { key: 'draft',             label: 'Drafts' },
  { key: 'changes_requested', label: 'Needs Revisions' },
];

const CONTENT_TABS = [
  { key: 'all',        label: 'All Formats' },
  { key: 'article',    label: 'Articles' },
  { key: 'news',       label: 'News' },
  { key: 'blog',       label: 'Blogs' },
  { key: 'whitepaper', label: 'Whitepapers' },
  { key: 'interview',  label: 'Interviews' },
  { key: 'webinar',    label: 'Webinars' },
  { key: 'event',      label: 'Events' },
];

const INITIAL_SHOW = 12;
const LOAD_MORE_COUNT = 6;

const MyContent = () => {
  const { darkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const D = darkMode;

  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [activeTypeTab, setActiveTypeTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_SHOW);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/drafts')) {
      setStatusFilter('draft');
    } else {
      setStatusFilter('all');
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/user/content');
      setContents(res.data || []);
    } catch {
      message.error('Failed to load your publications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async (e, contentId) => {
    e.stopPropagation();
    setSubmitting(contentId);
    try {
      await axios.post(`/api/user/content/${contentId}/submit`);
      message.success('Content submitted for review!');
      fetchContents();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to submit for review');
    } finally {
      setSubmitting(null);
    }
  };

  const handleDelete = (e, contentId) => {
    e.stopPropagation();
    Modal.confirm({
      title: 'Delete Story',
      content: 'Are you sure you want to delete this piece of content? This cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await axios.delete(`/api/user/content/${contentId}`);
          message.success('Story deleted successfully');
          fetchContents();
        } catch {
          message.error('Failed to delete content');
        }
      }
    });
  };

  const filteredContents = contents.filter(c => {
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'published' ? (c.status === 'published' || c.status === 'approved') : c.status === statusFilter);
    const matchesType = activeTypeTab === 'all' || (c.content_type || 'article').toLowerCase() === activeTypeTab;
    const matchesSearch = !searchQuery ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const visibleItems = filteredContents.slice(0, visibleCount);
  const hasMore = visibleCount < filteredContents.length;

  return (
    <div className="content-root">
      <style>{myContentStyles}</style>

      {/* ── COMMAND HEADER ── */}
      <div
        className="content-header c-stagger-1"
        style={{
          background: D
            ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 31, 77, 0.5) 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: `1px solid ${D ? 'rgba(255, 255, 255, 0.08)' : 'rgba(11, 31, 77, 0.08)'}`,
          boxShadow: D ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(11, 31, 77, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0B1F4D 0%, #1D3D8F 100%)',
              border: '1px solid rgba(247, 148, 29, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F7941D',
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            <FolderOpenOutlined />
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '1.24rem',
              fontWeight: 800,
              color: D ? '#F8FAFC' : '#0B1F4D',
              letterSpacing: '-0.02em',
            }}>
              My Content Studio
            </h1>
            <p style={{
              margin: '2px 0 0',
              fontSize: '0.78rem',
              color: D ? '#94A3B8' : '#64748B',
            }}>
              Organize, monitor publication statuses, and manage your editorial submissions.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={fetchContents}
            style={{
              background: D ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
              border: `1px solid ${D ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
              color: D ? '#94A3B8' : '#475569',
              padding: '7px 14px',
              borderRadius: 10,
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <ReloadOutlined spin={loading} />
            <span>Refresh</span>
          </button>

          <button
            className="content-btn-primary"
            onClick={() => navigate('/user-dashboard/create-post')}
          >
            <PlusOutlined />
            <span>Create Story</span>
          </button>
        </div>
      </div>

      {/* ── STATUS TABS FILTER BAR ── */}
      <div
        className="c-stagger-2"
        style={{
          background: D ? '#0F172A' : '#FFFFFF',
          borderRadius: 12,
          padding: '12px 16px',
          border: `1px solid ${D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0'}`,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {/* Status Pill Filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(st => {
            const isSelected = statusFilter === st.key;
            const count = st.key === 'all'
              ? contents.length
              : contents.filter(c => st.key === 'published' ? (c.status === 'published' || c.status === 'approved') : c.status === st.key).length;

            return (
              <button
                key={st.key}
                onClick={() => { setStatusFilter(st.key); setVisibleCount(INITIAL_SHOW); }}
                style={{
                  border: isSelected ? '1px solid rgba(247, 148, 29, 0.35)' : `1px solid ${D ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 600,
                  cursor: 'pointer',
                  background: isSelected
                    ? 'linear-gradient(135deg, #0B1F4D 0%, #1D3D8F 100%)'
                    : (D ? 'rgba(255,255,255,0.04)' : '#F8FAFC'),
                  color: isSelected ? '#F7941D' : (D ? '#94A3B8' : '#64748B'),
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.18s ease',
                }}
              >
                <span>{st.label}</span>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: isSelected ? 'rgba(247, 148, 29, 0.2)' : (D ? 'rgba(255,255,255,0.08)' : '#E2E8F0'),
                    color: isSelected ? '#F7941D' : (D ? '#94A3B8' : '#64748B'),
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Filter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 8,
            padding: '5px 12px',
            background: D ? '#1E293B' : '#F1F5F9',
            border: `1px solid ${D ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
            width: 240,
          }}
        >
          <SearchOutlined style={{ color: D ? '#64748B' : '#94A3B8', fontSize: 13 }} />
          <input
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.78rem',
              color: D ? '#F8FAFC' : '#0B1F4D',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* ── CONTENT TYPE SUB-BAR ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {CONTENT_TABS.map(t => {
          const isSelected = activeTypeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => { setActiveTypeTab(t.key); setVisibleCount(INITIAL_SHOW); }}
              style={{
                border: 'none',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                background: isSelected ? (D ? '#334155' : '#E2E8F0') : 'transparent',
                color: isSelected ? (D ? '#F8FAFC' : '#0B1F4D') : (D ? '#64748B' : '#94A3B8'),
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── STORIES GRID ── */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: D ? '#94A3B8' : '#64748B', fontSize: '0.84rem' }}>
            Loading your stories...
          </div>
        </div>
      ) : filteredContents.length === 0 ? (
        <div
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            background: D ? '#0F172A' : '#FFFFFF',
            borderRadius: 16,
            border: `1px solid ${D ? 'rgba(255,255,255,0.07)' : '#E2E8F0'}`,
          }}
        >
          <Empty
            description={
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: D ? '#F8FAFC' : '#0B1F4D', marginBottom: 4 }}>
                  No Content Matching Filters
                </div>
                <div style={{ fontSize: '0.8rem', color: D ? '#94A3B8' : '#64748B' }}>
                  {searchQuery || statusFilter !== 'all' ? 'Try changing the status or format filters.' : 'Create a new post to get started!'}
                </div>
              </div>
            }
          >
            <button
              className="content-btn-primary"
              onClick={() => navigate('/user-dashboard/create-post')}
              style={{ marginTop: 14 }}
            >
              <PlusOutlined />
              <span>Create New Content</span>
            </button>
          </Empty>
        </div>
      ) : (
        <div className="c-stagger-3">
          <Row gutter={[18, 18]}>
            {visibleItems.map((article) => {
              const status = statusConfig[article.status] || { color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)', text: article.status };
              const canEdit = article.status === 'draft' || article.status === 'changes_requested';

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={article.id}>
                  <div
                    className="content-card"
                    style={{
                      background: D ? '#0F172A' : '#FFFFFF',
                      borderColor: D ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/${article.content_type || 'article'}-preview/${article.id}`)}
                  >
                    {/* Image / Thumbnail */}
                    <div style={{ position: 'relative', height: 170, overflow: 'hidden', background: D ? '#1E293B' : '#F1F5F9' }}>
                      {article.banner_image ? (
                        <img
                          src={`/uploads/${article.banner_image}`}
                          alt={article.title}
                          className="content-thumb"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: D ? 'linear-gradient(135deg, #0B1F4D, #0F172A)' : 'linear-gradient(135deg, #EEF2FF, #F8FAFC)' }}>
                          <FileTextOutlined style={{ fontSize: 36, color: D ? '#3B82F6' : '#94A3B8', opacity: 0.6 }} />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          background: D ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.94)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: 20,
                          padding: '3px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          border: `1px solid ${status.color}30`,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.color }} />
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: status.color }}>
                          {status.text}
                        </span>
                      </div>

                      {/* Format Pill */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          background: 'rgba(11, 31, 77, 0.85)',
                          color: '#F7941D',
                          backdropFilter: 'blur(8px)',
                          borderRadius: 6,
                          padding: '2px 8px',
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {article.content_type || 'Article'}
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        {article.category_name && (
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            color: '#2563EB',
                            background: 'rgba(37, 99, 235, 0.08)',
                            padding: '2px 8px',
                            borderRadius: 6,
                            display: 'inline-block',
                            marginBottom: 8,
                          }}>
                            {article.category_name}
                          </span>
                        )}

                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            color: D ? '#F8FAFC' : '#0B1F4D',
                            lineHeight: 1.35,
                            marginBottom: 8,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {article.title || 'Untitled'}
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${D ? 'rgba(255,255,255,0.06)' : '#F1F5F9'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: '0.7rem', color: D ? '#64748B' : '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CalendarOutlined />
                            {article.created_at ? moment(article.created_at).format('MMM D, YYYY') : 'Recent'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: D ? '#64748B' : '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <EyeOutlined />
                            {article.views_count || 0} views
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/${article.content_type || 'article'}-preview/${article.id}`); }}
                            style={{
                              flex: 1,
                              background: D ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                              border: `1px solid ${D ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
                              color: D ? '#94A3B8' : '#475569',
                              padding: '5px 8px',
                              borderRadius: 8,
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                            }}
                          >
                            <EyeOutlined />
                            <span>Preview</span>
                          </button>

                          {canEdit && (
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/user-dashboard/create-post?edit=${article.id}`); }}
                              style={{
                                background: 'rgba(37, 99, 235, 0.08)',
                                border: '1px solid rgba(37, 99, 235, 0.2)',
                                color: '#2563EB',
                                padding: '5px 8px',
                                borderRadius: 8,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <EditOutlined />
                              <span>Edit</span>
                            </button>
                          )}

                          {article.status === 'draft' && (
                            <button
                              onClick={(e) => handleSubmitForReview(e, article.id)}
                              disabled={submitting === article.id}
                              style={{
                                background: 'linear-gradient(135deg, #0B1F4D 0%, #1D3D8F 100%)',
                                border: '1px solid rgba(247, 148, 29, 0.35)',
                                color: '#FFFFFF',
                                padding: '5px 10px',
                                borderRadius: 8,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <SendOutlined />
                              <span>Submit</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => handleDelete(e, article.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: D ? '#64748B' : '#94A3B8',
                              padding: '5px',
                              cursor: 'pointer',
                              borderRadius: 6,
                            }}
                            title="Delete Story"
                          >
                            <DeleteOutlined style={{ fontSize: 13 }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 28, marginBottom: 16 }}>
              <button
                onClick={() => setVisibleCount(prev => prev + LOAD_MORE_COUNT)}
                style={{
                  background: D ? '#0F172A' : '#FFFFFF',
                  border: `1px solid ${D ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
                  color: D ? '#F8FAFC' : '#0B1F4D',
                  padding: '9px 24px',
                  borderRadius: 24,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <DownOutlined />
                <span>Show More ({visibleItems.length} of {filteredContents.length})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyContent;