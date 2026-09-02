import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Card, Button, Tag, message, Divider, Spin, Space, Tooltip,
  Typography, Row, Col
} from 'antd';
import {
  EyeOutlined, EditOutlined, DeleteOutlined, SendOutlined,
  EyeInvisibleOutlined, ThunderboltOutlined, ArrowLeftOutlined,
  CheckOutlined, CloseOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import './radar/RadarStyles.css';

const { Title, Paragraph, Text } = Typography;

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

// Add custom styles for content display
const contentDisplayStyles = `
  .admin-content-display p {
    margin-bottom: 16px;
    margin-top: 16px;
  }
  .admin-content-display h1,
  .admin-content-display h2,
  .admin-content-display h3,
  .admin-content-display h4,
  .admin-content-display h5,
  .admin-content-display h6 {
    margin-top: 20px;
    margin-bottom: 12px;
  }
  .admin-content-display ul {
    margin-bottom: 16px;
    margin-top: 16px;
    padding-left: 25px;
    list-style-type: disc;
  }
  .admin-content-display ol {
    margin-bottom: 16px;
    margin-top: 16px;
    padding-left: 25px;
    list-style-type: decimal;
  }
  .admin-content-display li {
    margin-bottom: 8px;
    line-height: 1.6;
  }
  .admin-content-display ul ul {
    list-style-type: circle;
  }
  .admin-content-display ul ul ul {
    list-style-type: square;
  }
  .admin-content-display br {
    line-height: 1.6;
  }
  .admin-content-display div {
    margin-bottom: 12px;
  }
  .admin-content-display strong {
    font-weight: 700;
  }
  .admin-content-display em {
    font-style: italic;
  }
  .admin-content-display a {
    color: #0AAEEF;
    text-decoration: underline;
  }
  .admin-content-display blockquote {
    border-left: 3px solid #0AAEEF;
    padding-left: 16px;
    margin: 16px 0;
    color: #64748B;
    font-style: italic;
  }
  .admin-content-display code {
    background: rgba(10, 174, 239, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
  }
  .admin-content-display pre {
    background: rgba(15, 23, 42, 0.8);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;
  }
  .admin-content-display pre code {
    background: transparent;
    padding: 0;
  }
`;

const ContentDetail = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewActionLoading, setReviewActionLoading] = useState(null);

  const bgCard = darkMode ? 'rgba(30, 41, 59, 0.75)' : '#ffffff';
  const borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';
  const textPrimary = darkMode ? '#F1F5F9' : '#0F172A';
  const textMuted = darkMode ? '#94A3B8' : '#64748B';

  useEffect(() => {
    fetchContentDetail();
  }, [id]);

  const fetchContentDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/admin/content/${id}`);
      setContent(res.data);
    } catch (error) {
      console.error('Failed to load content detail:', error);
      message.error('Failed to load content details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    setVisibilityLoading(true);
    const newVisibility = content.is_visible === 0 ? 1 : 0;
    try {
      await axios.put(`/api/admin/content/${content.id}/visibility`, { is_visible_on_site: newVisibility });
      message.success(`Publication is now ${newVisibility ? 'visible' : 'hidden'} on live website`);
      setContent(prev => ({ ...prev, is_visible: newVisibility }));
    } catch (err) {
      message.error('Failed to update publication visibility');
    } finally {
      setVisibilityLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    try {
      await axios.post(`/api/admin/content/${content.id}/submit`);
      message.success('Publication submitted for editorial review');
      fetchContentDetail();
    } catch (err) {
      message.error('Failed to submit content');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/admin/content/${content.id}`);
      message.success('Publication deleted successfully');
      navigate('/dashboard/content');
    } catch (err) {
      message.error('Failed to delete publication');
    }
  };

  const handleReviewAction = async (action) => {
    setReviewActionLoading(action);
    try {
      await axios.put(`/api/admin/content/${content.id}/review`, {
        action,
        comment: ''
      });
      
      const actionMessages = {
        approve: 'Content approved successfully',
        publish: 'Content published successfully',
        reject: 'Content rejected',
        request_changes: 'Changes requested successfully'
      };
      
      message.success(actionMessages[action] || 'Action completed');
      fetchContentDetail();
    } catch (error) {
      message.error('Failed to review content');
    } finally {
      setReviewActionLoading(null);
    }
  };

  const isFromReviewQueue = location.state?.fromReviewQueue || location.pathname.includes('/pending-review');

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" tip="Loading content details..." />
      </div>
    );
  }

  if (!content) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={3} style={{ color: textPrimary }}>Content not found</Title>
          <Button onClick={() => navigate('/dashboard/content')}>Back to All Content</Button>
        </div>
      </div>
    );
  }

  const contentImg = getContentImage(content);
  const statusConfig = STATUS_CONFIG[content.status] || STATUS_CONFIG.draft;

  return (
    <>
      <style>{contentDisplayStyles}</style>
      <div className={`radar-dashboard-root ${darkMode ? 'dark' : 'light'} radar-grid-bg`} style={{ minHeight: '100vh', padding: '24px' }}>
        {/* Header */}
        <div className="radar-glass-panel" style={{ padding: '18px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => isFromReviewQueue ? navigate('/dashboard/pending-review') : navigate('/dashboard/content')}
              style={{ borderRadius: 10, borderColor }}
            >
              {isFromReviewQueue ? 'Back to Review Queue' : 'Back to All Content'}
            </Button>
            <div>
              <Title level={3} style={{ margin: 0, color: textPrimary, fontSize: '1.25rem' }}>
                Publication Details
              </Title>
              <Text style={{ color: textMuted, fontSize: '0.78rem' }}>
                View complete content information and metadata
              </Text>
            </div>
          </div>

          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/dashboard/create-post/${content.id}`)}
              style={{ borderRadius: 10, borderColor }}
            >
              Edit Publication
            </Button>
          </Space>
        </div>

        {/* Content Details */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={18}>
            {/* Main Content Card */}
            <Card className="radar-glass-panel" style={{ background: bgCard, borderColor, marginBottom: 24 }}>
              {/* Banner Image */}
              {contentImg && (
                <div style={{ width: '100%', height: 300, borderRadius: 12, overflow: 'hidden', marginBottom: 20, border: `1px solid ${borderColor}` }}>
                  <img src={contentImg} alt={content.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {/* Title & Status */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Tag color={statusConfig.color} style={{ borderRadius: 6, fontWeight: 600 }}>
                    {statusConfig.label}
                  </Tag>
                  <span className="radar-chip" style={{ fontSize: '0.7rem' }}>
                    {content.content_type_name || content.content_type || 'Article'}
                  </span>
                </div>
                <Title level={2} style={{ color: textPrimary, margin: 0 }}>
                  {content.title}
                </Title>
              </div>

              {/* Key Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }} className="radar-glass-panel">
                <div style={{ padding: 16, textAlign: 'center', background: darkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.7rem', color: textMuted, marginBottom: 4 }}>READERSHIP VIEWS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0AAEEF' }}>
                    {(content.view_count || 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: 16, textAlign: 'center', background: darkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.7rem', color: textMuted, marginBottom: 4 }}>VISIBILITY</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: content.is_visible !== 0 ? '#10B981' : '#F59E0B' }}>
                    {content.is_visible !== 0 ? 'Live Website' : 'Hidden'}
                  </div>
                </div>
                <div style={{ padding: 16, textAlign: 'center', background: darkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.7rem', color: textMuted, marginBottom: 4 }}>CATEGORY</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: textPrimary }}>
                    {content.category_name || 'General'}
                  </div>
                </div>
              </div>

              {/* Short Description */}
              {content.short_description && (
                <div style={{ marginBottom: 24 }}>
                  <Title level={4} style={{ color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>
                    Short Description
                  </Title>
                  <Paragraph style={{ color: textPrimary, lineHeight: '1.6', fontSize: '0.95rem' }}>
                    {content.short_description}
                  </Paragraph>
                </div>
              )}

              {/* Full Content */}
              {content.content && (
                <div style={{ marginBottom: 24 }}>
                  <Title level={4} style={{ color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>
                    Full Content
                  </Title>
                  <div 
                    className="admin-content-display"
                    style={{ 
                      fontSize: '0.95rem', 
                      color: textPrimary, 
                      lineHeight: '1.6',
                      padding: '16px',
                      background: darkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)',
                      borderRadius: 8,
                      border: `1px solid ${borderColor}`,
                      minHeight: '200px'
                    }}
                    dangerouslySetInnerHTML={{ __html: content.content }}
                  />
                </div>
              )}

              {/* Tags */}
              {parseTags(content.tags).length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <Title level={4} style={{ color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>
                    Tags
                  </Title>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {parseTags(content.tags).map((tag, i) => (
                      <span key={i} className="radar-chip" style={{ fontSize: '0.8rem' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={6}>
            {/* SEO Settings */}
            <Card className="radar-glass-panel" style={{ background: bgCard, borderColor, marginBottom: 24 }}>
              <Title level={4} style={{ color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem', marginBottom: 16 }}>
                SEO Settings
              </Title>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {content.seo_title && (
                  <div>
                    <Text style={{ fontSize: '0.75rem', color: textMuted, display: 'block', marginBottom: 4 }}>SEO Title</Text>
                    <Text style={{ fontSize: '0.9rem', color: textPrimary, fontWeight: 600, display: 'block' }}>
                      {content.seo_title}
                    </Text>
                  </div>
                )}

                {content.seo_description && (
                  <div>
                    <Text style={{ fontSize: '0.75rem', color: textMuted, display: 'block', marginBottom: 4 }}>SEO Description</Text>
                    <Text style={{ fontSize: '0.9rem', color: textPrimary, lineHeight: '1.4', display: 'block' }}>
                      {content.seo_description}
                    </Text>
                  </div>
                )}

                {content.seo_keywords && (
                  <div>
                    <Text style={{ fontSize: '0.75rem', color: textMuted, display: 'block', marginBottom: 4 }}>SEO Keywords</Text>
                    <Text style={{ fontSize: '0.9rem', color: textPrimary, display: 'block' }}>
                      {content.seo_keywords}
                    </Text>
                  </div>
                )}

                {content.slug && (
                  <div>
                    <Text style={{ fontSize: '0.75rem', color: textMuted, display: 'block', marginBottom: 4 }}>URL Slug</Text>
                    <Text style={{ fontSize: '0.9rem', color: '#0AAEEF', fontWeight: 600, display: 'block' }}>
                      {content.slug}
                    </Text>
                  </div>
                )}

                {content.canonical_url && (
                  <div>
                    <Text style={{ fontSize: '0.75rem', color: textMuted, display: 'block', marginBottom: 4 }}>Canonical URL</Text>
                    <Text style={{ fontSize: '0.9rem', color: textPrimary, display: 'block' }}>
                      {content.canonical_url}
                    </Text>
                  </div>
                )}
              </div>
            </Card>

            {/* Additional Information */}
            <Card className="radar-glass-panel" style={{ background: bgCard, borderColor, marginBottom: 24 }}>
              <Title level={4} style={{ color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem', marginBottom: 16 }}>
                Additional Information
              </Title>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <Text style={{ fontSize: '0.75rem', color: textMuted, display: 'block', marginBottom: 4 }}>Created Date</Text>
                  <Text style={{ fontSize: '0.9rem', color: textPrimary, fontWeight: 600, display: 'block' }}>
                    {moment(content.created_at).format('MMM D, YYYY')}
                  </Text>
                </div>

                <div>
                  <Text style={{ fontSize: '0.75rem', color: textMuted, display: 'block', marginBottom: 4 }}>Updated Date</Text>
                  <Text style={{ fontSize: '0.9rem', color: textPrimary, fontWeight: 600, display: 'block' }}>
                    {moment(content.updated_at).format('MMM D, YYYY')}
                  </Text>
                </div>

                <div>
                  <Text style={{ fontSize: '0.75rem', color: textMuted, display: 'block', marginBottom: 4 }}>Author</Text>
                  <Text style={{ fontSize: '0.9rem', color: textPrimary, fontWeight: 600, display: 'block' }}>
                    {content.first_name ? `${content.first_name} ${content.last_name || ''}` : 'Editorial'}
                  </Text>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="radar-glass-panel" style={{ background: bgCard, borderColor }}>
              <Title level={4} style={{ color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem', marginBottom: 16 }}>
                Quick Actions
              </Title>
              
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  block
                  onClick={() => navigate(`/dashboard/create-post/${content.id}`)}
                  style={{ borderRadius: 10, background: 'linear-gradient(135deg, #0B1F4D 0%, #1D3D8F 60%, #F7941D 200%)', border: '1px solid rgba(247,148,29,0.35)' }}
                >
                  Edit Publication
                </Button>

                <Button
                  icon={content.is_visible === 0 ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                  block
                  onClick={handleToggleVisibility}
                  loading={visibilityLoading}
                  style={{ borderRadius: 10, borderColor }}
                >
                  {content.is_visible === 0 ? 'Make Visible on Site' : 'Hide from Public Site'}
                </Button>

                {content.status === 'draft' && (
                  <Button
                    icon={<SendOutlined />}
                    block
                    loading={submitting}
                    onClick={handleSubmitForReview}
                    style={{ borderRadius: 10, borderColor: '#F59E0B', color: '#F59E0B' }}
                  >
                    Submit for Editorial Review
                  </Button>
                )}

                {/* Review Queue Actions */}
                {isFromReviewQueue && (content.status === 'pending' || content.status === 'approved' || content.status === 'changes_requested' || content.status === 'rejected') && (
                  <>
                    <Divider style={{ margin: '12px 0', borderColor }} />
                    <Title level={5} style={{ color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', marginBottom: 12 }}>
                      Editorial Review Actions
                    </Title>
                    
                    {content.status === 'pending' && (
                      <>
                        <Button
                          type="primary"
                          icon={<CheckOutlined />}
                          block
                          loading={reviewActionLoading === 'approve'}
                          onClick={() => handleReviewAction('approve')}
                          style={{ borderRadius: 10, background: '#10B981', border: 'none', marginBottom: 8 }}
                        >
                          Approve Content
                        </Button>
                        <Button
                          icon={<CloseOutlined />}
                          block
                          loading={reviewActionLoading === 'reject'}
                          onClick={() => handleReviewAction('reject')}
                          danger
                          style={{ borderRadius: 10, marginBottom: 8 }}
                        >
                          Reject Content
                        </Button>
                        <Button
                          icon={<EditOutlined />}
                          block
                          loading={reviewActionLoading === 'request_changes'}
                          onClick={() => handleReviewAction('request_changes')}
                          style={{ borderRadius: 10, borderColor: '#F59E0B', color: '#F59E0B', marginBottom: 8 }}
                        >
                          Request Changes
                        </Button>
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          block
                          loading={reviewActionLoading === 'publish'}
                          onClick={() => handleReviewAction('publish')}
                          style={{ borderRadius: 10, background: 'linear-gradient(135deg, #0B1F4D 0%, #2563EB 100%)', border: 'none' }}
                        >
                          Approve & Publish
                        </Button>
                      </>
                    )}

                    {content.status === 'approved' && (
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        block
                        loading={reviewActionLoading === 'publish'}
                        onClick={() => handleReviewAction('publish')}
                        style={{ borderRadius: 10, background: 'linear-gradient(135deg, #0B1F4D 0%, #2563EB 100%)', border: 'none' }}
                      >
                        Publish Content
                      </Button>
                    )}

                    {(content.status === 'changes_requested' || content.status === 'rejected') && (
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        block
                        loading={reviewActionLoading === 'approve'}
                        onClick={() => handleReviewAction('approve')}
                        style={{ borderRadius: 10, background: '#10B981', border: 'none' }}
                      >
                        Approve After Changes
                      </Button>
                    )}
                  </>
                )}

                <Button
                  danger
                  icon={<DeleteOutlined />}
                  block
                  onClick={handleDelete}
                  style={{ borderRadius: 10 }}
                >
                  Delete Publication
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default ContentDetail;