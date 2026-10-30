import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Input, Tag, Avatar, Skeleton, Empty, Button, Typography, Space } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  TeamOutlined,
  SearchOutlined,
  FileTextOutlined,
  EyeOutlined,
  ArrowRightOutlined,
  CompassOutlined,
  CheckCircleFilled,
  FireOutlined,
  GlobalOutlined,
  BankOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { formatViewsToM } from '../utils/numberHelper';
import { getAuthorSlug } from '../utils/authorHelper';

const { Title, Text, Paragraph } = Typography;

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

const AuthorsPage = ({ defaultType }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  // Determine initial type from URL or prop ('user' | 'admin')
  const initialType = defaultType || (location.pathname.includes('/admin') ? 'admin' : 'user');
  const [activeType, setActiveType] = useState(initialType);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Update activeType if location changes
  useEffect(() => {
    if (location.pathname.includes('/admin')) {
      setActiveType('admin');
    } else if (location.pathname.includes('/users')) {
      setActiveType('user');
    } else if (defaultType) {
      setActiveType(defaultType);
    }
  }, [location.pathname, defaultType]);

  // Fetch authors from backend
  useEffect(() => {
    let cancelled = false;
    const fetchAuthors = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/public/authors', {
          params: { type: activeType }
        });
        if (!cancelled) {
          setAuthors(response.data.authors || []);
        }
      } catch (err) {
        console.error('Failed to load authors:', err);
        if (!cancelled) setAuthors([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAuthors();
    return () => { cancelled = true; };
  }, [activeType]);

  // Client-side filtering by search query
  const filteredAuthors = useMemo(() => {
    if (!searchQuery.trim()) return authors;
    const q = searchQuery.toLowerCase().trim();
    return authors.filter(author => {
      const fullName = `${author.first_name || ''} ${author.last_name || ''}`.toLowerCase();
      const job = (author.job_title || '').toLowerCase();
      const company = (author.company_name || '').toLowerCase();
      const country = (author.country || '').toLowerCase();
      return fullName.includes(q) || job.includes(q) || company.includes(q) || country.includes(q);
    });
  }, [authors, searchQuery]);

  // Theme-aware styles
  const bgCard = darkMode ? '#1e293b' : '#ffffff';
  const borderCard = darkMode ? '#334155' : '#e2e8f0';
  const textHeading = darkMode ? '#f8fafc' : '#0f172a';
  const textMuted = darkMode ? '#94a3b8' : '#64748b';

  return (
    <div style={{
      minHeight: '100vh',
      background: darkMode ? '#0b1120' : '#f8fafc',
      paddingBottom: 64,
      transition: 'background 0.3s ease'
    }}>
      {/* ── Top Hero Header ── */}
      <div style={{
        background: darkMode
          ? 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0b1120 100%)'
          : 'linear-gradient(180deg, #eff6ff 0%, #e0e7ff 50%, #f8fafc 100%)',
        padding: '56px 24px 44px 24px',
        borderBottom: `1px solid ${borderCard}`,
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Tag
            color={activeType === 'admin' ? 'blue' : 'purple'}
            style={{
              padding: '4px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 16,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {activeType === 'admin' ? '🛡️ Editorial Team & In-House Analysts' : '✍️ Verified Contributors & Industry Experts'}
          </Tag>

          <Title
            level={1}
            style={{
              color: textHeading,
              fontWeight: 900,
              fontSize: 'clamp(28px, 4vw, 44px)',
              marginBottom: 14,
              letterSpacing: '-0.02em'
            }}
          >
            {activeType === 'admin' ? 'Admin & Editorial Authors' : 'Contributing Tech Authors'}
          </Title>

          <Paragraph
            style={{
              fontSize: 'clamp(15px, 1.2vw, 17px)',
              color: textMuted,
              maxWidth: 680,
              margin: '0 auto 28px auto',
              lineHeight: 1.6
            }}
          >
            {activeType === 'admin'
              ? 'Browse enterprise technology research, whitepapers, and authoritative market intelligence published directly by the TGS Tech Info editorial board.'
              : 'Discover independent enterprise thought leaders, CTOs, solution architects, and technology writers publishing articles across global industry verticals.'}
          </Paragraph>

          {/* ── Type Selector Tabs ── */}
          <div style={{
            display: 'inline-flex',
            background: darkMode ? '#1e293b' : '#ffffff',
            padding: 4,
            borderRadius: 14,
            border: `1px solid ${borderCard}`,
            boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)',
            marginBottom: 24
          }}>
            <button
              onClick={() => {
                setActiveType('user');
                navigate('/authors/users');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 22px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 14,
                transition: 'all 0.2s ease',
                background: activeType === 'user' ? (darkMode ? '#3b82f6' : '#2563eb') : 'transparent',
                color: activeType === 'user' ? '#ffffff' : textMuted
              }}
            >
              <TeamOutlined />
              <span>Guest & User Authors</span>
            </button>

            <button
              onClick={() => {
                setActiveType('admin');
                navigate('/authors/admin');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 22px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 14,
                transition: 'all 0.2s ease',
                background: activeType === 'admin' ? (darkMode ? '#3b82f6' : '#2563eb') : 'transparent',
                color: activeType === 'admin' ? '#ffffff' : textMuted
              }}
            >
              <UserOutlined />
              <span>Admin Authors</span>
            </button>
          </div>

          {/* ── Search Bar ── */}
          <div style={{ maxWidth: 540, margin: '0 auto' }}>
            <Input
              size="large"
              placeholder={`Search ${activeType === 'admin' ? 'admin authors' : 'authors'} by name, role, or company...`}
              prefix={<SearchOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{
                borderRadius: 12,
                padding: '10px 18px',
                background: darkMode ? '#1e293b' : '#ffffff',
                borderColor: borderCard,
                color: textHeading,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '36px 20px' }}>
        {loading ? (
          <Row gutter={[24, 24]}>
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <Col xs={24} sm={12} md={8} key={k}>
                <div style={{ padding: 24, background: bgCard, borderRadius: 16, border: `1px solid ${borderCard}` }}>
                  <Skeleton avatar active paragraph={{ rows: 3 }} />
                </div>
              </Col>
            ))}
          </Row>
        ) : filteredAuthors.length === 0 ? (
          <div style={{
            background: bgCard,
            padding: '64px 24px',
            borderRadius: 16,
            textAlign: 'center',
            border: `1px solid ${borderCard}`
          }}>
            <Empty
              description={
                <span style={{ color: textMuted, fontSize: 16 }}>
                  {searchQuery ? `No authors found matching "${searchQuery}"` : 'No authors found in this category.'}
                </span>
              }
            >
              {searchQuery && (
                <Button onClick={() => setSearchQuery('')} type="primary" style={{ borderRadius: 8 }}>
                  Clear Search
                </Button>
              )}
            </Empty>
          </div>
        ) : (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <Text style={{ color: textMuted, fontWeight: 600, fontSize: 14 }}>
                Showing <strong style={{ color: textHeading }}>{filteredAuthors.length}</strong> {activeType === 'admin' ? 'Admin' : 'Contributing'} Author{filteredAuthors.length === 1 ? '' : 's'}
              </Text>
            </div>

            <Row gutter={[24, 24]}>
              {filteredAuthors.map((author) => {
                const fullName = `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Author';
                const avatarGradient = getGradientForName(fullName);
                const initials = getInitials(author.first_name, author.last_name);
                const isAdmin = author.role === 'admin';
                const authorTargetUrl = `/author/${getAuthorSlug(author)}`;

                return (
                  <Col xs={24} sm={12} lg={8} key={author.id}>
                    <div
                      onClick={() => navigate(authorTargetUrl)}
                      style={{
                        background: bgCard,
                        border: `1px solid ${borderCard}`,
                        borderRadius: 18,
                        padding: 24,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 14px rgba(0,0,0,0.03)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.borderColor = isAdmin ? '#3b82f6' : '#8b5cf6';
                        e.currentTarget.style.boxShadow = darkMode
                          ? '0 12px 28px rgba(0,0,0,0.45)'
                          : '0 12px 28px rgba(59, 130, 246, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = borderCard;
                        e.currentTarget.style.boxShadow = darkMode
                          ? '0 4px 12px rgba(0,0,0,0.2)'
                          : '0 4px 14px rgba(0,0,0,0.03)';
                      }}
                    >
                      {/* Top Header: Avatar + Name + Role */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                        {author.avatar ? (
                          <Avatar size={62} src={author.avatar} style={{ border: `2px solid ${borderCard}` }} />
                        ) : (
                          <div style={{
                            width: 62,
                            height: 62,
                            borderRadius: '50%',
                            background: avatarGradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: 22,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{
                              fontWeight: 800,
                              fontSize: 18,
                              color: textHeading,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {fullName}
                            </span>
                            <CheckCircleFilled style={{ color: '#0ea5e9', fontSize: 14 }} title="Verified Author" />
                          </div>

                          <Tag
                            color={isAdmin ? 'blue' : 'purple'}
                            style={{
                              margin: 0,
                              fontSize: 11,
                              fontWeight: 700,
                              borderRadius: 6
                            }}
                          >
                            {isAdmin ? 'Editorial Admin' : 'Contributing Author'}
                          </Tag>
                        </div>
                      </div>

                      {/* Author Info / Bio snippet */}
                      <div style={{ flex: 1, marginBottom: 18 }}>
                        {(author.job_title || author.company_name) && (
                          <div style={{
                            fontSize: 13,
                            color: textMuted,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 6
                          }}>
                            <BankOutlined style={{ color: '#38bdf8' }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {[author.job_title, author.company_name].filter(Boolean).join(' • ')}
                            </span>
                          </div>
                        )}

                        {author.country && (
                          <div style={{
                            fontSize: 12,
                            color: textMuted,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}>
                            <GlobalOutlined style={{ color: '#10b981' }} />
                            <span>{author.country}</span>
                          </div>
                        )}
                      </div>

                      {/* Stats Metric Strip */}
                      <div style={{
                        background: darkMode ? 'rgba(15, 23, 42, 0.6)' : '#f1f5f9',
                        borderRadius: 12,
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        marginBottom: 16
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: textMuted, textTransform: 'uppercase', fontWeight: 600 }}>
                            Publications
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: textHeading, marginTop: 2 }}>
                            <FileTextOutlined style={{ color: '#3b82f6', marginRight: 4 }} />
                            {author.total_articles || 0}
                          </div>
                        </div>

                        <div style={{ width: 1, height: 26, background: borderCard }} />

                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: textMuted, textTransform: 'uppercase', fontWeight: 600 }}>
                            Reads
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#0ea5e9', marginTop: 2 }}>
                            <EyeOutlined style={{ marginRight: 4 }} />
                            {formatViewsToM(author.total_views || 0)}
                          </div>
                        </div>
                      </div>

                      {/* Footer Action */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 12,
                        borderTop: `1px solid ${borderCard}`,
                        fontSize: 13,
                        fontWeight: 700,
                        color: isAdmin ? '#3b82f6' : '#8b5cf6'
                      }}>
                        <span>Explore Published Articles</span>
                        <ArrowRightOutlined />
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorsPage;

