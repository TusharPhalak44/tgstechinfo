import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Row, Col, Typography, Tag, Avatar, Skeleton, Empty, Button, Input, Breadcrumb } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  EyeOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  BankOutlined,
  GlobalOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useTheme } from '../context/ThemeContext';
import { formatViewsToM } from '../utils/numberHelper';
import { resolveContentRoute } from '../lib/contentRoute';

const { Title, Text } = Typography;

// Color gradients for avatars based on author name
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #3B82F6, #1D4ED8)',
  'linear-gradient(135deg, #8B5CF6, #6D28D9)',
  'linear-gradient(135deg, #EC4899, #BE185D)',
  'linear-gradient(135deg, #10B981, #047857)',
  'linear-gradient(135deg, #F59E0B, #B45309)',
  'linear-gradient(135deg, #06B6D4, #0E7490)',
  'linear-gradient(135deg, #6366F1, #4338CA)',
];

const getGradientForName = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
};

const getInitials = (firstName = '', lastName = '') => {
  const f = (firstName || '').trim().charAt(0).toUpperCase();
  const l = (lastName || '').trim().charAt(0).toUpperCase();
  return (f + l) || 'AU';
};

const getBannerSrc = (banner) => {
  if (!banner) return null;
  if (banner.startsWith('http://') || banner.startsWith('https://') || banner.startsWith('data:')) return banner;
  if (banner.startsWith('/')) return banner;
  return `/uploads/${banner}`;
};

const INITIAL_VISIBLE = 10;
const SEE_MORE_STEP = 5;

const AuthorProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [author, setAuthor] = useState(null);
  const [contents, setContents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  // Responsive mobile check
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = windowWidth < 768;

  useEffect(() => {
    let cancelled = false;
    const fetchAuthorData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/public/authors/${id}`);
        if (!cancelled) {
          setAuthor(response.data.author);
          setContents(response.data.contents || []);
          setCategories(response.data.categories || []);
          setContentTypes(response.data.contentTypes || []);
        }
      } catch (err) {
        console.error('Failed to load author profile:', err);
        if (!cancelled) {
          setAuthor(null);
          setContents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAuthorData();
    return () => { cancelled = true; };
  }, [id]);

  // Filter contents
  const filteredContents = useMemo(() => {
    return contents.filter(item => {
      // Category filter
      if (selectedCategory && (item.category_name || item.category_slug) !== selectedCategory) {
        return false;
      }
      // Content type filter
      if (selectedType) {
        const t = (item.content_type_name || item.content_type || '').toLowerCase();
        if (t !== selectedType.toLowerCase()) return false;
      }
      // Search keyword
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const descMatch = (item.short_description || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch) return false;
      }
      return true;
    });
  }, [contents, selectedCategory, selectedType, searchQuery]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [selectedCategory, selectedType, searchQuery]);

  // Theme-aware styles
  const accent = '#0AAEEF';
  const bgCard = darkMode ? '#1e293b' : '#ffffff';
  const borderCard = darkMode ? '#334155' : '#e2e8f0';
  const textHeading = darkMode ? '#f8fafc' : '#0f172a';
  const textMuted = darkMode ? '#94a3b8' : '#64748b';

  const handleItemClick = (item, e) => {
    const routeInfo = resolveContentRoute(item);
    if (!routeInfo.newTab) {
      if (e) e.preventDefault();
      navigate(routeInfo.url);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '40px auto', padding: '0 20px', minHeight: '80vh' }}>
        <Skeleton active avatar={{ size: 80 }} paragraph={{ rows: 4 }} />
        <div style={{ marginTop: 40 }}>
          {[1, 2, 3, 4].map(k => (
            <div key={k} style={{ marginBottom: 24, padding: '20px 0', borderBottom: `1px solid ${borderCard}` }}>
              <Skeleton active avatar={{ size: 100, shape: 'square' }} paragraph={{ rows: 3 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div style={{ maxWidth: 700, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <Empty description="Author profile not found or has no published articles." />
        <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: 20, borderRadius: 8, background: accent }}>
          Back to Home
        </Button>
      </div>
    );
  }

  const fullName = `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Author';
  const avatarGradient = getGradientForName(fullName);
  const initials = getInitials(author.first_name, author.last_name);
  const isAdmin = author.role === 'admin';

  return (
    <div style={{
      minHeight: '100vh',
      background: darkMode ? '#0b1120' : '#f8fafc',
      paddingBottom: 72,
      transition: 'background 0.3s ease'
    }}>
      <style>{`
        .topic-cat-pill {
          transition: all 0.2s ease;
        }
        .topic-cat-pill:hover, .topic-cat-pill.is-active {
          background: ${accent} !important;
          color: #ffffff !important;
          border-color: ${accent} !important;
          box-shadow: 0 4px 12px ${accent}33;
        }
        .topic-cat-pill:hover .topic-cat-count, .topic-cat-pill.is-active .topic-cat-count {
          background: #ffffff !important;
          color: ${accent} !important;
        }
        .author-list-item:hover .author-item-title {
          color: ${accent} !important;
        }
      `}</style>

      {/* ── Breadcrumb & Back bar ── */}
      <div style={{
        background: darkMode ? '#0f172a' : '#ffffff',
        borderBottom: `1px solid ${borderCard}`,
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ fontWeight: 600, color: textMuted }}
          >
            Back
          </Button>

          <Breadcrumb
            items={[
              { title: <Link to="/">Home</Link> },
              { title: 'Author' },
              { title: fullName },
            ]}
          />
        </div>
      </div>

      {/* ── Author Profile Header ── */}
      <div style={{
        background: darkMode
          ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
        borderBottom: `1px solid ${borderCard}`,
        padding: isMobile ? '28px 16px' : '40px 24px'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 18 : 28,
            flexWrap: 'wrap'
          }}>
            {/* Author Avatar */}
            {author.avatar ? (
              <Avatar
                size={isMobile ? 76 : 100}
                src={author.avatar}
                style={{
                  border: `4px solid ${accent}`,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  flexShrink: 0
                }}
              />
            ) : (
              <div style={{
                width: isMobile ? 76 : 100,
                height: isMobile ? 76 : 100,
                borderRadius: '50%',
                background: avatarGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: isMobile ? 26 : 34,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                flexShrink: 0
              }}>
                {initials}
              </div>
            )}

            {/* Author Meta Details */}
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <Title level={isMobile ? 3 : 2} style={{ color: textHeading, margin: 0, fontWeight: 900, letterSpacing: '-0.02em' }}>
                  {fullName}
                </Title>
                <CheckCircleFilled style={{ color: '#0ea5e9', fontSize: 20 }} title="Verified Author" />
                <Tag
                  color={isAdmin ? 'blue' : 'purple'}
                  style={{
                    padding: '3px 12px',
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: 700
                  }}
                >
                  {isAdmin ? '🛡️ Editorial Team & Admin' : '✍️ Verified Contributor'}
                </Tag>
              </div>

              {(author.job_title || author.company_name) && (
                <div style={{ fontSize: isMobile ? 13 : 15, color: textMuted, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <BankOutlined style={{ color: '#38bdf8' }} />
                  <span>{[author.job_title, author.company_name].filter(Boolean).join(' • ')}</span>
                </div>
              )}

              {author.country && (
                <div style={{ fontSize: isMobile ? 12 : 13, color: textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GlobalOutlined style={{ color: '#10b981' }} />
                  <span>{author.country}</span>
                </div>
              )}
            </div>

            {/* Author Metric Badges */}
            <div style={{
              display: 'flex',
              gap: 16,
              background: darkMode ? '#0f172a' : '#ffffff',
              padding: isMobile ? '12px 18px' : '16px 24px',
              borderRadius: 14,
              border: `1px solid ${borderCard}`,
              boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.04)'
            }}>
              <div style={{ textAlign: 'center', minWidth: 70 }}>
                <div style={{ fontSize: 11, color: textMuted, textTransform: 'uppercase', fontWeight: 700 }}>
                  Publications
                </div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: textHeading, marginTop: 4 }}>
                  <FileTextOutlined style={{ color: accent, marginRight: 6 }} />
                  {author.total_articles || contents.length || 0}
                </div>
              </div>

              <div style={{ width: 1, background: borderCard }} />

              <div style={{ textAlign: 'center', minWidth: 70 }}>
                <div style={{ fontSize: 11, color: textMuted, textTransform: 'uppercase', fontWeight: 700 }}>
                  Total Reads
                </div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: '#0ea5e9', marginTop: 4 }}>
                  <EyeOutlined style={{ marginRight: 6 }} />
                  {formatViewsToM(author.total_views || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Body: Publishing Website List View ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 16px' : '36px 24px', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Category & Topic Filter Pills (matching publishing website CategoryList) */}
        {categories.length > 0 && (
          <div style={{ marginBottom: isMobile ? 16 : 22, width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontWeight: 700, fontSize: isMobile ? 12 : 13, color: textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Filter by Topic / Category
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`topic-cat-pill ${!selectedCategory ? 'is-active' : ''}`}
                style={{
                  padding: isMobile ? '6px 12px' : '7px 15px',
                  background: !selectedCategory ? accent : (darkMode ? '#1e293b' : '#fff'),
                  border: `1.5px solid ${!selectedCategory ? accent : (darkMode ? '#334155' : '#dbeafe')}`,
                  borderRadius: 20,
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 600,
                  color: !selectedCategory ? '#fff' : (darkMode ? '#f1f5f9' : '#0f172a'),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0
                }}
              >
                All Topics
                <span
                  className="topic-cat-count"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: !selectedCategory ? '#ffffff' : (darkMode ? '#334155' : '#f1f5f9'),
                    color: !selectedCategory ? accent : textMuted,
                    borderRadius: 12,
                    padding: '1px 6px',
                    minWidth: 20,
                    textAlign: 'center'
                  }}
                >
                  {contents.length}
                </span>
              </button>

              {categories.map(cat => {
                const isActive = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(prev => prev === cat.name ? null : cat.name)}
                    className={`topic-cat-pill ${isActive ? 'is-active' : ''}`}
                    style={{
                      padding: isMobile ? '6px 12px' : '7px 15px',
                      background: isActive ? accent : (darkMode ? '#1e293b' : '#fff'),
                      border: `1.5px solid ${isActive ? accent : (darkMode ? '#334155' : '#dbeafe')}`,
                      borderRadius: 20,
                      fontSize: isMobile ? 12 : 13,
                      fontWeight: 600,
                      color: isActive ? '#fff' : (darkMode ? '#f1f5f9' : '#0f172a'),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexShrink: 0
                    }}
                  >
                    {cat.name}
                    <span
                      className="topic-cat-count"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: isActive ? '#ffffff' : (darkMode ? '#334155' : '#f1f5f9'),
                        color: isActive ? accent : textMuted,
                        borderRadius: 12,
                        padding: '1px 6px',
                        minWidth: 20,
                        textAlign: 'center'
                      }}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Type Filter Pills (if author has multiple content types e.g. Articles, Whitepapers) */}
        {contentTypes.length > 1 && (
          <div style={{ marginBottom: isMobile ? 18 : 24, width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontWeight: 700, fontSize: isMobile ? 12 : 13, color: textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Content Format
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
              <button
                type="button"
                onClick={() => setSelectedType(null)}
                className={`topic-cat-pill ${!selectedType ? 'is-active' : ''}`}
                style={{
                  padding: isMobile ? '6px 12px' : '7px 15px',
                  background: !selectedType ? accent : (darkMode ? '#1e293b' : '#fff'),
                  border: `1.5px solid ${!selectedType ? accent : (darkMode ? '#334155' : '#dbeafe')}`,
                  borderRadius: 20,
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 600,
                  color: !selectedType ? '#fff' : (darkMode ? '#f1f5f9' : '#0f172a'),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0
                }}
              >
                All Formats
              </button>

              {contentTypes.map(ct => {
                const isActive = selectedType === ct.name;
                return (
                  <button
                    key={ct.name}
                    type="button"
                    onClick={() => setSelectedType(prev => prev === ct.name ? null : ct.name)}
                    className={`topic-cat-pill ${isActive ? 'is-active' : ''}`}
                    style={{
                      padding: isMobile ? '6px 12px' : '7px 15px',
                      background: isActive ? accent : (darkMode ? '#1e293b' : '#fff'),
                      border: `1.5px solid ${isActive ? accent : (darkMode ? '#334155' : '#dbeafe')}`,
                      borderRadius: 20,
                      fontSize: isMobile ? 12 : 13,
                      fontWeight: 600,
                      color: isActive ? '#fff' : (darkMode ? '#f1f5f9' : '#0f172a'),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexShrink: 0
                    }}
                  >
                    {ct.name}
                    <span
                      className="topic-cat-count"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: isActive ? '#ffffff' : (darkMode ? '#334155' : '#f1f5f9'),
                        color: isActive ? accent : textMuted,
                        borderRadius: 12,
                        padding: '1px 6px',
                        minWidth: 20,
                        textAlign: 'center'
                      }}
                    >
                      {ct.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Title, Search, and Count bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          paddingBottom: isMobile ? 12 : 16,
          borderBottom: `3px solid ${accent}`,
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: isMobile ? 16 : 19, color: textHeading, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {searchQuery
                ? `Search Results for "${searchQuery}"`
                : selectedCategory
                  ? `Published Works: ${selectedCategory}`
                  : `Published Articles & Research Works`}
              {(selectedCategory || selectedType || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedType(null);
                    setSearchQuery('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Clear Filters ✕
                </button>
              )}
            </span>
            <div style={{ fontSize: 13, color: textMuted, marginTop: 4 }}>
              Showing {Math.min(filteredContents.length, visibleCount)} of {filteredContents.length} publications by {fullName}
            </div>
          </div>

          <div style={{ width: isMobile ? '100%' : 260 }}>
            <Input
              placeholder="Search in author's works..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ borderRadius: 8, height: 38 }}
            />
          </div>
        </div>

        {/* ── Articles List with Left Banner Image (Like CategoryList) ── */}
        <div style={{
          background: bgCard,
          borderRadius: 16,
          border: `1px solid ${borderCard}`,
          padding: isMobile ? '8px 16px' : '12px 28px',
          boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          {filteredContents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: isMobile ? '40px 0' : '60px 0', color: textMuted }}>
              <Empty description="No publications match your selected filters." />
              {(selectedCategory || selectedType || searchQuery) && (
                <Button
                  type="primary"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedType(null);
                    setSearchQuery('');
                  }}
                  style={{ marginTop: 16, borderRadius: 8, background: accent }}
                >
                  Reset All Filters
                </Button>
              )}
            </div>
          ) : (
            filteredContents.slice(0, visibleCount).map((item, idx) => {
              const routeInfo = resolveContentRoute(item);
              const targetUrl = routeInfo?.url || '#';
              const bannerSrc = getBannerSrc(item.banner_image);
              const typeLabel = item.content_type_name || item.content_type || 'Article';
              const isLast = idx === Math.min(filteredContents.length, visibleCount) - 1;

              return (
                <a
                  key={item.id}
                  href={targetUrl}
                  target={routeInfo.newTab ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  onClick={(e) => handleItemClick(item, e)}
                  style={{
                    display: 'flex',
                    gap: isMobile ? 12 : 24,
                    padding: isMobile ? '16px 0' : '22px 0',
                    borderBottom: isLast ? 'none' : `1px solid ${borderCard}`,
                    cursor: 'pointer',
                    transition: 'background .15s',
                    borderRadius: 6,
                    flexDirection: isMobile ? 'column' : 'row',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                  className="author-list-item"
                  onMouseEnter={e => e.currentTarget.style.background = darkMode ? '#1e293b' : '#fafbff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Thumbnail / Banner Image */}
                  <div style={{
                    width: isMobile ? '100%' : 240,
                    maxWidth: '100%',
                    height: isMobile ? 180 : 155,
                    flexShrink: 0,
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: darkMode ? '#1e293b' : '#f0f4ff',
                    position: 'relative',
                    minHeight: isMobile ? 180 : 155,
                    maxHeight: isMobile ? 180 : 155,
                    boxSizing: 'border-box'
                  }}>
                    {bannerSrc ? (
                      <img
                        src={bannerSrc}
                        alt={item.title}
                        style={{
                          transition: 'transform .4s ease',
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        onError={e => {
                          e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? 36 : 32,
                        background: darkMode ? '#0f172a' : '#f1f5f9',
                        color: textMuted
                      }}>
                        <FileTextOutlined />
                      </div>
                    )}

                    {/* Badge Overlay */}
                    <span style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      background: accent,
                      color: '#fff',
                      fontSize: isMobile ? 9 : 10,
                      fontWeight: 800,
                      padding: isMobile ? '2px 8px' : '3px 10px',
                      borderRadius: 20,
                      letterSpacing: .5,
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}>
                      {typeLabel}
                    </span>
                  </div>

                  {/* Content Details */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isMobile ? 6 : 8, flexWrap: 'wrap' }}>
                      {item.category_name && (
                        <span style={{
                          fontSize: isMobile ? 10 : 11,
                          fontWeight: 700,
                          color: accent,
                          textTransform: 'uppercase',
                          letterSpacing: .8
                        }}>
                          {item.category_name}
                        </span>
                      )}
                    </div>

                    <h3 style={{
                      fontWeight: 700,
                      fontSize: isMobile ? 15 : 17,
                      color: textHeading,
                      margin: '0 0 8px',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      transition: 'color 0.2s ease'
                    }}
                    className="author-item-title"
                    >
                      {item.title}
                    </h3>

                    {item.short_description && (
                      <p style={{
                        fontSize: isMobile ? 12 : 13,
                        color: textMuted,
                        lineHeight: 1.65,
                        margin: '0 0 12px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1
                      }}>
                        {item.short_description}
                      </p>
                    )}

                    {/* Meta strip */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? 12 : 16,
                      fontSize: isMobile ? 11 : 12,
                      color: textMuted,
                      flexWrap: 'wrap',
                      marginTop: 'auto'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CalendarOutlined style={{ fontSize: isMobile ? 10 : 11 }} />
                        {item.published_date ? moment(item.published_date).format('MMM D, YYYY') : '-'}
                      </span>
                      {item.reading_time > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ClockCircleOutlined style={{ fontSize: isMobile ? 10 : 11 }} />
                          {item.reading_time} min read
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <EyeOutlined style={{ fontSize: isMobile ? 10 : 11 }} />
                        {formatViewsToM(item.view_count || 0)}
                      </span>
                      <span style={{
                        marginLeft: isMobile ? 0 : 'auto',
                        fontSize: isMobile ? 11 : 12,
                        fontWeight: 700,
                        color: accent,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        → Read Publication
                      </span>
                    </div>
                  </div>
                </a>
              );
            })
          )}
        </div>

        {/* See More Button */}
        {!loading && filteredContents.length > visibleCount && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: isMobile ? 20 : 28 }}>
            <button
              onClick={() => setVisibleCount(v => Math.min(v + SEE_MORE_STEP, filteredContents.length))}
              style={{
                padding: isMobile ? '10px 24px' : '11px 36px',
                background: darkMode ? '#1e293b' : '#fff',
                color: accent,
                border: `2px solid ${accent}`,
                borderRadius: 30,
                fontWeight: 700,
                fontSize: isMobile ? 13 : 14,
                cursor: 'pointer',
                transition: 'all .2s',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
              onMouseEnter={e => { e.currentTarget.style.background = accent; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = darkMode ? '#1e293b' : '#fff'; e.currentTarget.style.color = accent; }}
            >
              Load More Publications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorProfilePage;
