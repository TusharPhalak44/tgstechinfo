import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Tag, Badge, Avatar, Empty, Spin, Space, message, Tabs, Tooltip, Modal } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  UserOutlined,
  CalendarOutlined,
  EditOutlined,
  CloseCircleOutlined,
  SendOutlined,
  TagOutlined,
  EyeOutlined,
  DownOutlined,
  DeleteOutlined,
  ReloadOutlined,
  RiseOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  FolderOpenOutlined,
  LineChartOutlined,
  AppstoreOutlined,
  SearchOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

/* ─────────────────────────────────────────────
   INJECTED CSS — Modern Executive User Dashboard
───────────────────────────────────────────── */
const userDashboardStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  .user-dash-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    letter-spacing: -0.01em;
    animation: userDashFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  @keyframes userDashFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Staggered Entrance Animations ── */
  .u-stagger-1 { animation: uSlideUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.04s both; }
  .u-stagger-2 { animation: uSlideUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both; }
  .u-stagger-3 { animation: uSlideUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both; }
  .u-stagger-4 { animation: uSlideUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.16s both; }
  .u-stagger-5 { animation: uSlideUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.20s both; }

  @keyframes uSlideUp {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Header Command Bar ── */
  .user-dash-header {
    border-radius: 16px;
    padding: 20px 24px;
    margin-bottom: 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(16px);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .user-dash-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(247, 148, 29, 0.4), transparent);
  }

  /* ── Live Beacon Animation ── */
  .user-beacon-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10B981;
    position: relative;
    display: inline-block;
  }
  .user-beacon-dot::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 2px solid #10B981;
    animation: userPulse 2s ease-out infinite;
  }
  @keyframes userPulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  /* ── Executive KPI Cards ── */
  .user-kpi-card {
    border-radius: 14px;
    padding: 18px 20px;
    border: 1px solid;
    position: relative;
    overflow: hidden;
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .user-kpi-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2.5px;
    background: var(--card-accent, #2563EB);
    opacity: 0.9;
    transition: height 0.2s ease;
  }
  .user-kpi-card::after {
    content: '';
    position: absolute;
    top: -30px;
    right: -30px;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--card-accent, transparent);
    opacity: 0.08;
    filter: blur(18px);
    pointer-events: none;
  }
  .user-kpi-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 32px -8px rgba(0, 0, 0, 0.2), 0 0 16px -2px var(--card-glow, rgba(37, 99, 235, 0.2));
  }
  .user-kpi-card:hover::before {
    height: 3.5px;
  }

  /* ── Quick Action Tiles ── */
  .user-quick-tile {
    border-radius: 12px;
    padding: 14px 16px;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .user-quick-tile:hover {
    transform: translateY(-2px);
  }

  /* ── Content Grid Cards ── */
  .user-story-card {
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid;
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }
  .user-story-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.2);
  }
  .user-story-thumb {
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    width: 100%;
    height: 180px;
    object-fit: cover;
  }
  .user-story-card:hover .user-story-thumb {
    transform: scale(1.04);
  }

  /* ── Custom Tab Styling ── */
  .user-tab-nav .ant-tabs-nav {
    margin-bottom: 20px !important;
  }
  .user-tab-nav .ant-tabs-tab {
    font-weight: 600 !important;
    font-size: 0.84rem !important;
    padding: 8px 16px !important;
    border-radius: 8px !important;
    transition: all 0.2s !important;
  }

  /* ── Action Buttons ── */
  .user-btn-primary {
    background: linear-gradient(135deg, #0B1F4D 0%, #1D3D8F 100%);
    border: 1px solid rgba(247, 148, 29, 0.35);
    color: #FFFFFF;
    font-weight: 700;
    border-radius: 10px;
    padding: 6px 16px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
    font-size: 0.82rem;
  }
  .user-btn-primary:hover {
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

const CONTENT_TABS = [
  { key: 'all',        label: 'All Content' },
  { key: 'article',    label: 'Articles' },
  { key: 'news',       label: 'News' },
  { key: 'blog',       label: 'Blogs' },
  { key: 'whitepaper', label: 'Whitepapers' },
  { key: 'interview',  label: 'Interviews' },
  { key: 'webinar',    label: 'Webinars' },
  { key: 'event',      label: 'Events' },
];

const ITEMS_PER_PAGE = 20;
const INITIAL_SHOW = 12;
const LOAD_MORE_COUNT = 6;

const Dashboard = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const D = darkMode;

  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_SHOW);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    pending: 0,
    draft: 0,
    totalViews: 0,
    totalSubmissions: 0,
  });

  useEffect(() => {
    fetchDashboardContent();
  }, []);

  const fetchDashboardContent = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/user/content');
      const data = res.data || [];
      setContents(data);

      const total = data.length;
      const published = data.filter(c => c.status === 'published' || c.status === 'approved').length;
      const pending = data.filter(c => c.status === 'pending').length;
      const draft = data.filter(c => c.status === 'draft' || c.status === 'changes_requested').length;
      const totalViews = data.reduce((acc, c) => acc + (Number(c.views_count) || 0), 0);

      setStats({ total, published, pending, draft, totalViews });
    } catch (err) {
      console.error('Failed to load user content', err);
      message.error('Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async (e, contentId) => {
    e.stopPropagation();
    setSubmitting(contentId);
    try {
      await axios.post(`/api/user/content/${contentId}/submit`);
      message.success('Story submitted for editorial review!');
      fetchDashboardContent();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to submit story');
    } finally {
      setSubmitting(null);
    }
  };

  const handleDelete = (e, contentId) => {
    e.stopPropagation();
    Modal.confirm({
      title: 'Delete Content',
      content: 'Are you sure you want to delete this story? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await axios.delete(`/api/user/content/${contentId}`);
          message.success('Story deleted successfully');
          fetchDashboardContent();
        } catch (err) {
          message.error('Failed to delete story');
        }
      }
    });
  };

  const filteredContents = contents.filter(item => {
    const matchesTab = activeTab === 'all' || (item.content_type || 'article').toLowerCase() === activeTab;
    const matchesSearch = !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const visibleItems = filteredContents.slice(0, visibleCount);
  const hasMore = visibleCount < filteredContents.length;

  return (
    <div className="user-dash-root">
      <style>{userDashboardStyles}</style>

      {/* ── COMMAND BAR HEADER ── */}
      <div
        className="user-dash-header u-stagger-1"
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
              boxShadow: '0 4px 14px rgba(11, 31, 77, 0.25)',
            }}
          >
            <RocketOutlined />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{
                margin: 0,
                fontSize: '1.28rem',
                fontWeight: 800,
                color: D ? '#F8FAFC' : '#0B1F4D',
                letterSpacing: '-0.02em',
              }}>
                Creator Workspace
              </h1>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                borderRadius: 20,
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '0.66rem',
                fontWeight: 700,
                color: '#10B981',
              }}>
                <span className="user-beacon-dot" />
                <span>STUDIO LIVE</span>
              </div>
            </div>
            <p style={{
              margin: '3px 0 0',
              fontSize: '0.78rem',
              color: D ? '#94A3B8' : '#64748B',
              fontWeight: 500,
            }}>
              Welcome back, <strong>{user?.first_name || 'Creator'}</strong> • Manage your publications, track story review states, and create new content.
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={fetchDashboardContent}
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
              transition: 'all 0.2s',
            }}
          >
            <ReloadOutlined spin={loading} />
            <span>Sync</span>
          </button>

          <button
            className="user-btn-primary"
            onClick={() => navigate('/user-dashboard/create-post')}
          >
            <PlusOutlined />
            <span>New Story</span>
          </button>
        </div>
      </div>

      {/* ── EXECUTIVE KPI STAT CARDS ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }} className="u-stagger-2">
        {/* Total Content */}
        <Col xs={12} sm={12} md={6}>
          <div
            className="user-kpi-card"
            style={{
              '--card-accent': '#2563EB',
              '--card-glow': 'rgba(37, 99, 235, 0.2)',
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255, 255, 255, 0.07)' : 'rgba(11, 31, 77, 0.08)',
              minHeight: 115,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Stories
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(37, 99, 235, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                <FileTextOutlined style={{ fontSize: 16 }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ fontSize: '1.65rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', letterSpacing: '-0.02em' }}>
                {stats.total}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563EB', background: 'rgba(37, 99, 235, 0.1)', padding: '2px 8px', borderRadius: 12 }}>
                Portfolio
              </span>
            </div>
          </div>
        </Col>

        {/* Published & Live */}
        <Col xs={12} sm={12} md={6}>
          <div
            className="user-kpi-card"
            style={{
              '--card-accent': '#10B981',
              '--card-glow': 'rgba(16, 185, 129, 0.2)',
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255, 255, 255, 0.07)' : 'rgba(11, 31, 77, 0.08)',
              minHeight: 115,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Live & Published
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                <CheckCircleOutlined style={{ fontSize: 16 }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ fontSize: '1.65rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', letterSpacing: '-0.02em' }}>
                {stats.published}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: 12 }}>
                Active Live
              </span>
            </div>
          </div>
        </Col>

        {/* Pending Review */}
        <Col xs={12} sm={12} md={6}>
          <div
            className="user-kpi-card"
            style={{
              '--card-accent': '#F59E0B',
              '--card-glow': 'rgba(245, 158, 11, 0.2)',
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255, 255, 255, 0.07)' : 'rgba(11, 31, 77, 0.08)',
              minHeight: 115,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                In Editorial Review
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                <ClockCircleOutlined style={{ fontSize: 16 }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ fontSize: '1.65rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', letterSpacing: '-0.02em' }}>
                {stats.pending}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: 12 }}>
                Queued
              </span>
            </div>
          </div>
        </Col>

        {/* Drafts & Revisions */}
        <Col xs={12} sm={12} md={6}>
          <div
            className="user-kpi-card"
            style={{
              '--card-accent': '#8B5CF6',
              '--card-glow': 'rgba(139, 92, 246, 0.2)',
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255, 255, 255, 0.07)' : 'rgba(11, 31, 77, 0.08)',
              minHeight: 115,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Drafts & WIP
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                <EditOutlined style={{ fontSize: 16 }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ fontSize: '1.65rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', letterSpacing: '-0.02em' }}>
                {stats.draft}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8B5CF6', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 8px', borderRadius: 12 }}>
                Editing
              </span>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── QUICK ACTION LAUNCHPAD ── */}
      <Row gutter={[14, 14]} style={{ marginBottom: 24 }} className="u-stagger-3">
        <Col xs={12} sm={6}>
          <div
            className="user-quick-tile"
            onClick={() => navigate('/user-dashboard/create-post')}
            style={{
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255,255,255,0.07)' : '#E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(247, 148, 29, 0.12)', color: '#F7941D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlusOutlined style={{ fontSize: 14 }} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: D ? '#F8FAFC' : '#0B1F4D' }}>
                Create Post
              </span>
            </div>
            <ArrowRightOutlined style={{ color: D ? '#64748B' : '#94A3B8', fontSize: 12 }} />
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div
            className="user-quick-tile"
            onClick={() => navigate('/user-dashboard/my-submissions')}
            style={{
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255,255,255,0.07)' : '#E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SendOutlined style={{ fontSize: 14 }} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: D ? '#F8FAFC' : '#0B1F4D' }}>
                My Leads
              </span>
            </div>
            <ArrowRightOutlined style={{ color: D ? '#64748B' : '#94A3B8', fontSize: 12 }} />
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div
            className="user-quick-tile"
            onClick={() => navigate('/user-dashboard/media-library')}
            style={{
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255,255,255,0.07)' : '#E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(37, 99, 235, 0.12)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AppstoreOutlined style={{ fontSize: 14 }} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: D ? '#F8FAFC' : '#0B1F4D' }}>
                Media Library
              </span>
            </div>
            <ArrowRightOutlined style={{ color: D ? '#64748B' : '#94A3B8', fontSize: 12 }} />
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div
            className="user-quick-tile"
            onClick={() => navigate('/user-dashboard/analytics')}
            style={{
              background: D ? '#0F172A' : '#FFFFFF',
              borderColor: D ? 'rgba(255,255,255,0.07)' : '#E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LineChartOutlined style={{ fontSize: 14 }} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: D ? '#F8FAFC' : '#0B1F4D' }}>
                Analytics
              </span>
            </div>
            <ArrowRightOutlined style={{ color: D ? '#64748B' : '#94A3B8', fontSize: 12 }} />
          </div>
        </Col>
      </Row>

      {/* ── TOOLBAR & TABS ── */}
      <div
        className="u-stagger-4"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', overflowX: 'auto', paddingBottom: 4 }}>
          {CONTENT_TABS.map(t => {
            const isSelected = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setVisibleCount(INITIAL_SHOW); }}
                style={{
                  borderRadius: 10,
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 600,
                  cursor: 'pointer',
                  background: isSelected
                    ? 'linear-gradient(135deg, #0B1F4D 0%, #1D3D8F 100%)'
                    : (D ? 'rgba(255,255,255,0.05)' : '#F1F5F9'),
                  color: isSelected ? '#F7941D' : (D ? '#94A3B8' : '#64748B'),
                  boxShadow: isSelected ? '0 4px 12px rgba(11, 31, 77, 0.25)' : 'none',
                  transition: 'all 0.18s ease',
                  border: isSelected ? '1px solid rgba(247, 148, 29, 0.3)' : '1px solid transparent',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 10,
            padding: '4px 12px',
            background: D ? '#0F172A' : '#FFFFFF',
            border: `1px solid ${D ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
            width: 240,
          }}
        >
          <SearchOutlined style={{ color: D ? '#64748B' : '#94A3B8', fontSize: 13 }} />
          <input
            placeholder="Filter current view..."
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

      {/* ── CONTENT GRID ── */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: D ? '#94A3B8' : '#64748B', fontSize: '0.84rem' }}>
            Loading your content studio...
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
                  No Stories Found
                </div>
                <div style={{ fontSize: '0.8rem', color: D ? '#94A3B8' : '#64748B' }}>
                  {searchQuery ? 'Try adjusting your search criteria.' : 'Create your first piece of content to share with our audience!'}
                </div>
              </div>
            }
          >
            <button
              className="user-btn-primary"
              onClick={() => navigate('/user-dashboard/create-post')}
              style={{ marginTop: 14 }}
            >
              <PlusOutlined />
              <span>Create Your First Story</span>
            </button>
          </Empty>
        </div>
      ) : (
        <div className="u-stagger-5">
          <Row gutter={[18, 18]}>
            {visibleItems.map((article) => {
              const status = statusConfig[article.status] || { color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)', text: article.status };
              const tags = parseTags(article.tags);
              const canEdit = article.status === 'draft' || article.status === 'changes_requested';

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={article.id}>
                  <div
                    className="user-story-card"
                    style={{
                      background: D ? '#0F172A' : '#FFFFFF',
                      borderColor: D ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/${article.content_type || 'article'}-preview/${article.id}`)}
                  >
                    {/* Thumbnail Zone */}
                    <div style={{ position: 'relative', height: 170, overflow: 'hidden', background: D ? '#1E293B' : '#F1F5F9' }}>
                      {article.banner_image ? (
                        <img
                          src={`/uploads/${article.banner_image}`}
                          alt={article.title}
                          className="user-story-thumb"
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
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.color }} />
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: status.color }}>
                          {status.text}
                        </span>
                      </div>

                      {/* Content Type Pill on Right */}
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
                          letterSpacing: '0.04em',
                          border: '1px solid rgba(247, 148, 29, 0.3)',
                        }}
                      >
                        {article.content_type || 'Article'}
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        {/* Category Tag */}
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

                        {/* Title */}
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
                          {article.title || 'Untitled Story'}
                        </div>
                      </div>

                      {/* Footer Info & Actions */}
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

                        {/* Quick Action Buttons */}
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

          {/* Show More Button */}
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
                  boxShadow: D ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
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

export default Dashboard;