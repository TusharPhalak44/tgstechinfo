import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Row, Col, Typography, Tag, Button, Form, Input,
  message, Card, Avatar, Space, Skeleton, Select
} from 'antd';
import { 
  CalendarOutlined, ClockCircleOutlined, ShareAltOutlined,
  UserOutlined, LockOutlined, CloseOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import '../../prose-content.css';
import ContentRenderer from '../common/ContentRenderer';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text } = Typography;

const stripHtml = (html = '') => {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getPreviewHtml = (html = '') => {
  const plainText = stripHtml(html);
  if (!plainText) return '';

  const words = plainText.split(' ').filter(Boolean);
  const previewWords = Math.max(40, Math.floor(words.length * 0.2));
  const previewText = words.slice(0, previewWords).join(' ');

  return `<p>${previewText}${words.length > previewWords ? '...' : ''}</p>`;
};

// Custom Comment Component
const CustomComment = ({ author, avatar, content, datetime, darkMode }) => (
  <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0' }}>
    <div>{avatar || <Avatar icon={<UserOutlined />} />}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 500, fontSize: 14, color: darkMode ? '#f1f5f9' : '#000' }}>{author}</div>
      <div style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#999', marginTop: 2 }}>{datetime}</div>
      <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: darkMode ? '#cbd5e1' : '#000' }}>{content}</div>
    </div>
  </div>
);

const BannerImage = ({ src, alt, darkMode }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      {/* 25-30% cropped preview with fixed height — click to open full */}
      <div
        onClick={() => setLightboxOpen(true)}
        style={{
          margin: '24px 0 16px',
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative',
          height: '350px',
        }}
        className="article-banner-image"
      >
        <img
          src={src}
          alt={alt}
          style={{ 
            width: '100%', 
            height: '100%', 
            display: 'block', 
            objectFit: 'cover',
            objectPosition: 'top center'
          }}
        />
        {/* Overlay showing only top 25-30% */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '75%',
          background: darkMode ? 'linear-gradient(to bottom, transparent 0%, #0f172a 60%)' : 'linear-gradient(to bottom, transparent 0%, #fff 60%)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          paddingBottom: 12,
        }}>
          <span style={{
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            fontSize: 12, padding: '4px 12px', borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            🔍 Click to view full image
          </span>
        </div>
      </div>

      {/* Lightbox — full image */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'fixed', top: 16, right: 16,
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: '50%', width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff', fontSize: 18, zIndex: 1001,
            }}
          >
            <CloseOutlined />
          </button>
          <img
            src={src}
            alt={alt}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '90vh',
              objectFit: 'contain', borderRadius: 8,
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}
          />
        </div>
      )}
    </>
  );
};

const ArticleDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [customFields, setCustomFields] = useState([]);
  const [subscribing, setSubscribing] = useState(false);
  const [submittedData, setSubmittedData] = useState(null); // stores {name, email} after form submit
  const [pdfFile, setPdfFile] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/public/content/${slug}`);
        if (cancelled) return;
        const c = response.data.content;

        if (c?.id) {
          const sessionKey = `viewed-${c.id}`;
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, '1');
            axios.post(`/api/public/content/${c.id}/view`).catch(() => {});
          }
        }

        if (!c) {
          messageApi.error('Content not found');
          setContent(null);
          setLoading(false);
          return;
        }

        console.log('[ArticleDetail] builder_layout raw:', c.builder_layout);
        console.log('[ArticleDetail] builder_layout type:', typeof c.builder_layout);

        try {
          const layout = typeof c.builder_layout === 'string'
            ? JSON.parse(c.builder_layout)
            : c.builder_layout;
          console.log('[ArticleDetail] layout parsed:', layout);
          const isHtmlBuilder = Array.isArray(layout) && layout[0] === 'html';
          console.log('[ArticleDetail] isHtmlBuilder:', isHtmlBuilder);
          if (isHtmlBuilder) {
            window.open(`/content/${c.slug}`, '_blank', 'noopener,noreferrer');
            navigate(-1);
            return;
          }
        } catch (e) {
          console.log('[ArticleDetail] layout parse error:', e.message);
        }

        setContent(c);
        setRelatedArticles(response.data.relatedArticles || []);
        if (c?.custom_fields) {
          try {
            const cf = typeof c.custom_fields === 'string' ? JSON.parse(c.custom_fields) : c.custom_fields;
            setCustomFields(Array.isArray(cf) ? cf : []);
          } catch { setCustomFields([]); }
        }
        setComments([
          { id: 1, author: 'Admin', content: 'Great article! Thanks for sharing.', datetime: moment().format('MMMM D, YYYY') }
        ]);
      } catch (error) {
        if (cancelled) return;
        console.error('[ArticleDetail] Fetch error:', error);
        messageApi.error('Failed to load content');
        setContent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!content) return;
    document.title = content.seo_meta_title || content.title || 'Article';
    const setMeta = (name, val) => {
      if (!val) return;
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
      el.setAttribute('content', val);
    };
    setMeta('description', content.seo_meta_description);
    setMeta('keywords', content.seo_meta_keywords);
    return () => { document.title = 'TGS Tech Info'; };
  }, [content]);

  useEffect(() => {
    if (content?.id) {
      const storedAccess = localStorage.getItem(`article-access-${content.id}`);
      setHasAccess(storedAccess === 'true');
    }
  }, [content?.id]);

  const handleLandingPageSubmit = async (values) => {
    setSubmitting(true);
    try {
      const extra_fields = {};
      customFields.forEach(field => {
        if (values[field.name] !== undefined) {
          extra_fields[field.name] = values[field.name];
          // webhook_key bhi store karo taaki backend correctly map kar sake
          if (field.webhook_key && field.webhook_key !== field.name)
            extra_fields[field.webhook_key] = values[field.name];
        }
      });

      const res = await axios.post('/api/public/landing-page', {
        content_id: content.id,
        extra_fields
      });

      localStorage.setItem(`article-access-${content.id}`, 'true');
      setHasAccess(true);
      setPdfFile(res.data?.pdf_file || null);
      setSubmittedData(extra_fields);
      form.resetFields();
    } catch (error) {
      messageApi.error(error.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfFile) return;
    const link = document.createElement('a');
    link.href = `/uploads/${pdfFile}`;
    link.download = pdfFile;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubscribe = async () => {
    if (!submittedData) return;
    setSubscribing(true);
    try {
      await axios.post('/api/public/subscribe-content', {
        content_id: content.id,
        extra_fields: submittedData
      });
      messageApi.success('Subscription email sent! Check your inbox.');
    } catch (error) {
      messageApi.error(error.response?.data?.message || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} style={{ padding: 24 }} />;
  if (!content) return (
    <div style={{ 
      textAlign: 'center', 
      padding: '80px 24px',
      background: darkMode ? '#1e293b' : '#fff',
      borderRadius: 8,
      boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>📄</div>
      <Title level={2} style={{ marginBottom: 8 }}>Content Not Found</Title>
      <Text style={{ color: darkMode ? '#94a3b8' : '#666', display: 'block', marginBottom: 24 }}>
        The content you're looking for doesn't exist or has been removed.
      </Text>
      <Button 
        type="primary" 
        onClick={() => navigate('/search')}
        style={{
          background: 'linear-gradient(135deg, #0B1F4D 0%, #123A8C 100%)',
          border: 'none'
        }}
      >
        Return to Search
      </Button>
    </div>
  );

  const LANDING_TYPES = ['webinar', 'whitepaper', 'white paper', 'white-paper', 'event', 'ebook', 'e-book'];
  const contentTypeName = (content?.content_type_name || content?.content_type || '').toLowerCase().trim();
  const requiresLanding = LANDING_TYPES.includes(contentTypeName);

  const fullContent = content.content || '';
  const previewContent = getPreviewHtml(content.short_description || fullContent);

  return (
    <>
      {contextHolder}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 20px 40px', background: darkMode ? '#0f172a' : '#f8fafc', minHeight: '100vh' }} className="article-detail-container">
      <style>{`
        .prose-content * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .article-detail-container {
            padding: 0 !important;
          }
          .article-content-card {
            padding: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .article-banner-image {
            margin-left: 16px !important;
            margin-right: 16px !important;
          }
        }
      `}</style>
      <Row gutter={[24, 24]} style={{ alignItems: 'flex-start' }}>
        {/* Main Content - 70% */}
        <Col xs={24} lg={17} style={{ order: 1 }}>
          <div style={{ background: darkMode ? '#1e293b' : '#fff', padding: 32, borderRadius: 8, boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)' }} className="article-content-card">
            {/* Back Button */}
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  background: 'none', border: darkMode ? '1.5px solid #475569' : '1.5px solid #d9d9d9', borderRadius: 8,
                  padding: '4px 12px', cursor: 'pointer', fontSize: 13,
                  color: darkMode ? '#cbd5e1' : '#374151', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = darkMode ? '#334155' : '#f5f5f5';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'none';
                }}
              >← Back</button>
            </div>

            {/* Category */}
            <Tag color="blue" style={{ marginBottom: 12 }}>{content.category_name}</Tag>

            {/* Meta */}
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0' }}>
              <Space size="middle" wrap>
                <Space>
                  <Avatar icon={<UserOutlined />} size="small" />
                  <Text strong style={{ color: darkMode ? '#f1f5f9' : '#000' }}>{`${content.first_name || ''} ${content.last_name || ''}`}</Text>
                </Space>
                <Space>
                  <CalendarOutlined style={{ color: darkMode ? '#94a3b8' : '#666' }} />
                  <Text style={{ color: darkMode ? '#cbd5e1' : '#000' }}>{moment(content.published_date || content.created_at).format('MMMM D, YYYY')}</Text>
                </Space>
                <Space>
                  <ClockCircleOutlined style={{ color: darkMode ? '#94a3b8' : '#666' }} />
                  <Text style={{ color: darkMode ? '#cbd5e1' : '#000' }}>{content.reading_time || 0} min read</Text>
                </Space>
              </Space>
            </div>

            {/* Content rendered in saved layout order */}
            {requiresLanding && !hasAccess && (
              <div style={{ marginBottom: 20, padding: '14px 16px', background: darkMode ? 'rgba(251, 191, 36, 0.1)' : '#fff7e6', border: darkMode ? '1px solid #fbbf24' : '1px solid #ffd591', borderRadius: 8 }}>
                <Text strong style={{ color: darkMode ? '#fcd34d' : '#8c4b00' }}>
                  <LockOutlined style={{ marginRight: 8 }} /> Preview only. Fill the form on the right to unlock the full article.
                </Text>
              </div>
            )}

            <ContentRenderer
              content={content}
              renderBanner={(src, alt) => <BannerImage src={src} alt={alt} darkMode={darkMode} />}
              contentHtml={(requiresLanding && !hasAccess) ? previewContent : fullContent}
              darkMode={darkMode}
              extraAfter={
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Text strong style={{ color: darkMode ? '#f1f5f9' : '#000' }}>Share:</Text>
                  <Button icon={<ShareAltOutlined />}>Share</Button>
                </div>
              }
            />
          </div>

          {/* Comments */}
          <div style={{ marginTop: 40, background: darkMode ? '#1e293b' : '#fff', padding: 24, borderRadius: 8 }}>
            <Title level={3} style={{ color: darkMode ? '#f1f5f9' : '#000' }}>Comments</Title>
            <div>
              {comments.map((item) => (
                <CustomComment
                  key={item.id}
                  author={item.author}
                  content={item.content}
                  datetime={item.datetime}
                  darkMode={darkMode}
                />
              ))}
            </div>
          </div>
        </Col>

        {/* Sidebar - 30% */}
        <Col xs={24} lg={7} style={{ order: 2 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Get Access Card — only for webinar/whitepaper/event ── */}
            {requiresLanding && (
              <Card 
                style={{ 
                  background: darkMode ? '#1e293b' : '#fff', 
                  borderRadius: 16, 
                  border: darkMode ? '2px solid #334155' : '2px solid #e8ecf4',
                  boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
                  overflow: 'hidden'
                }}
              >
                <style>{`
                  @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                  }
                  @keyframes pulse-ring {
                    0% { transform: scale(0.8); opacity: 1; }
                    100% { transform: scale(1.3); opacity: 0; }
                  }
                  @keyframes checkmark {
                    0% { stroke-dashoffset: 100; }
                    100% { stroke-dashoffset: 0; }
                  }
                  .submit-btn-loading {
                    position: relative;
                    overflow: hidden;
                  }
                  .submit-btn-loading::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                  }
                  .success-checkmark {
                    animation: checkmark 0.5s ease-in-out forwards;
                  }
                `}</style>
                {/* Header with accent background */}
                <div style={{
                  background: 'linear-gradient(135deg, #4a7cff 0%, #6c5ce7 100%)',
                  padding: '20px 24px',
                  margin: '-1px -1px 0 -1px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {hasAccess ? (
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20
                      }}>✅</div>
                    ) : (
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20
                      }}>🔒</div>
                    )}
                    <div>
                      <Title level={4} style={{ color: '#fff', marginBottom: 4, fontSize: 18, fontWeight: 700 }}>
                        {hasAccess ? 'Access Granted' : 'Get Access'}
                      </Title>
                      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                        {hasAccess ? 'Your access is unlocked' : 'Unlock the full content'}
                      </Text>
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: '24px' }}>
                  {/* BEFORE SUBMIT: show form */}
                  {!hasAccess && (
                    <>
                      <Text style={{ color: darkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: 20, fontSize: 14, lineHeight: 1.6 }}>
                        Fill in your details below to unlock the full article and get instant access.
                      </Text>
                      <Form layout="vertical" onFinish={handleLandingPageSubmit} form={form}>
                        {customFields.map(field => (
                          <Form.Item 
                            key={field.name} 
                            name={field.name} 
                            rules={[{ required: field.required !== false, message: `${field.label || field.name} is required` }]} 
                            style={{ marginBottom: 16 }}
                          >
                            {field.type === 'textarea' ? (
                              <Input.TextArea 
                                placeholder={field.placeholder || field.label} 
                                rows={3} 
                                style={{ 
                                  borderRadius: 8,
                                  border: darkMode ? '1px solid #475569' : '1px solid #e2e8f0',
                                  padding: '10px 12px',
                                  fontSize: 14,
                                  transition: 'all 0.2s',
                                  background: darkMode ? '#0f172a' : '#fff',
                                  color: darkMode ? '#f1f5f9' : '#000'
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = '#4a7cff'}
                                onBlur={e => e.currentTarget.style.borderColor = darkMode ? '#475569' : '#e2e8f0'}
                              />
                            ) : field.type === 'select' ? (
                              <Select 
                                placeholder={field.placeholder || field.label} 
                                style={{ 
                                  width: '100%',
                                  borderRadius: 8
                                }}
                              >
                                {(field.options || '').split(',').map(o => o.trim()).filter(Boolean).map(o => (
                                  <Select.Option key={o} value={o}>{o}</Select.Option>
                                ))}
                              </Select>
                            ) : field.type === 'checkbox' ? (
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <input 
                                  type="checkbox" 
                                  id={field.name}
                                  required={field.required !== false}
                                  style={{ marginTop: 4, width: 16, height: 16, cursor: 'pointer' }}
                                />
                                <label htmlFor={field.name} style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#64748b', lineHeight: 1.5, cursor: 'pointer' }}>
                                  {field.consent_text || field.label}
                                  {field.redirect_link && (
                                    <a href={field.redirect_link} target="_blank" rel="noopener noreferrer" style={{ color: '#4a7cff', marginLeft: 4 }}>
                                      Learn more →
                                    </a>
                                  )}
                                </label>
                              </div>
                            ) : (
                              <Input 
                                type={field.type || 'text'} 
                                placeholder={field.placeholder || field.label} 
                                style={{ 
                                  borderRadius: 8,
                                  border: darkMode ? '1px solid #475569' : '1px solid #e2e8f0',
                                  padding: '10px 12px',
                                  fontSize: 14,
                                  transition: 'all 0.2s',
                                  background: darkMode ? '#0f172a' : '#fff',
                                  color: darkMode ? '#f1f5f9' : '#000'
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = '#4a7cff'}
                                onBlur={e => e.currentTarget.style.borderColor = darkMode ? '#475569' : '#e2e8f0'}
                              />
                            )}
                          </Form.Item>
                        ))}
                        <Form.Item style={{ marginBottom: 0 }}>
                          <Button 
                            type="primary" 
                            htmlType="submit" 
                            block 
                            loading={submitting}
                            className={submitting ? 'submit-btn-loading' : ''}
                            style={{
                              background: submitting ? '#4a7cff' : 'linear-gradient(135deg, #4a7cff 0%, #6c5ce7 100%)',
                              color: '#fff',
                              fontWeight: 600,
                              borderRadius: 8,
                              height: 44,
                              fontSize: 15,
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(74, 124, 255, 0.3)',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={e => {
                              if (!submitting) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(74, 124, 255, 0.4)';
                              }
                            }}
                            onMouseLeave={e => {
                              if (!submitting) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 124, 255, 0.3)';
                              }
                            }}
                          >
                            {submitting ? 'Submitting...' : 'Get Access →'}
                          </Button>
                        </Form.Item>
                      </Form>
                    </>
                  )}

                  {/* AFTER SUBMIT: show 2 options */}
                  {hasAccess && (
                    <>
                      <div style={{ 
                        textAlign: 'center', 
                        marginBottom: 24,
                        padding: '16px',
                        background: darkMode ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4',
                        borderRadius: 8,
                        border: darkMode ? '1px solid #22c55e' : '1px solid #bbf7d0'
                      }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                        <Text style={{ color: darkMode ? '#86efac' : '#166534', fontSize: 15, fontWeight: 600, display: 'block' }}>
                          Access Unlocked!
                        </Text>
                        <Text style={{ color: darkMode ? '#4ade80' : '#15803d', fontSize: 13, display: 'block', marginTop: 4 }}>
                          Your details have been submitted successfully.
                        </Text>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Option 1: Read full article (+ PDF if available) */}
                        <div style={{ 
                          background: darkMode ? '#1e293b' : '#f8fafc', 
                          borderRadius: 12, 
                          padding: '16px', 
                          border: darkMode ? '2px solid #334155' : '2px solid #e2e8f0',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#4a7cff';
                          e.currentTarget.style.background = darkMode ? '#334155' : '#f0f9ff';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = darkMode ? '#334155' : '#e2e8f0';
                          e.currentTarget.style.background = darkMode ? '#1e293b' : '#f8fafc';
                        }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 8,
                              background: '#dbeafe',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 18
                            }}>📖</div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: darkMode ? '#f1f5f9' : '#1e293b' }}>Read Full Article</div>
                              <Text style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}>
                                Full article is now unlocked above
                              </Text>
                            </div>
                          </div>
                          {pdfFile && (
                            <Button 
                              block 
                              onClick={handleDownloadPdf}
                              style={{ 
                                background: 'linear-gradient(135deg, #4a7cff 0%, #6c5ce7 100%)',
                                color: '#fff', 
                                fontWeight: 600, 
                                border: 'none',
                                borderRadius: 8,
                                height: 40,
                                boxShadow: '0 2px 8px rgba(74, 124, 255, 0.3)',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 124, 255, 0.4)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 124, 255, 0.3)';
                              }}
                            >
                              📄 Download PDF
                            </Button>
                          )}
                        </div>

                        {/* Option 2: Subscribe */}
                        <div style={{ 
                          background: darkMode ? '#1e293b' : '#f8fafc', 
                          borderRadius: 12, 
                          padding: '16px', 
                          border: darkMode ? '2px solid #334155' : '2px solid #e2e8f0',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#4a7cff';
                          e.currentTarget.style.background = darkMode ? '#334155' : '#f0f9ff';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = darkMode ? '#334155' : '#e2e8f0';
                          e.currentTarget.style.background = darkMode ? '#1e293b' : '#f8fafc';
                        }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 8,
                              background: '#dbeafe',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 18
                            }}>📧</div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: darkMode ? '#f1f5f9' : '#1e293b' }}>Subscribe for Updates</div>
                              <Text style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}>
                                Get a confirmation email with access details
                              </Text>
                            </div>
                          </div>
                          <Button 
                            block 
                            loading={subscribing} 
                            onClick={handleSubscribe}
                            style={{ 
                              background: '#fff',
                              color: '#4a7cff', 
                              border: '2px solid #4a7cff',
                              fontWeight: 600,
                              borderRadius: 8,
                              height: 40,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#4a7cff';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = '#fff';
                              e.currentTarget.style.color = '#4a7cff';
                            }}
                          >
                            Subscribe & Get Email
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}

            {/* ── Related Articles — below landing card ── */}
            {relatedArticles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: darkMode ? '#f1f5f9' : '#1a1a2e', paddingBottom: 8, borderBottom: darkMode ? '2px solid #334155' : '2px solid #e8ecf4' }}>
                  Related Articles
                </div>
                {relatedArticles.map(article => (
                  <div
                    key={article.id}
                    onClick={() => {
                      try {
                        const layout = typeof article.builder_layout === 'string'
                          ? JSON.parse(article.builder_layout)
                          : article.builder_layout;
                        if (Array.isArray(layout) && layout[0] === 'html') {
                          window.open(`/content/${article.slug}`, '_blank', 'noopener,noreferrer');
                          return;
                        }
                      } catch { /* fall through */ }
                      navigate(`/article/${article.slug}`);
                    }}
                    style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 10, border: darkMode ? '1px solid #334155' : '1px solid #e8ecf4', overflow: 'hidden', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = darkMode ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    {article.banner_image
                      ? <img src={`/uploads/${article.banner_image}`} alt={article.title} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                      : <div style={{ height: 100, background: 'linear-gradient(135deg,#e0e9ff,#f0f4ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📄</div>
                    }
                    <div style={{ padding: '10px 12px' }}>
                      <Tag color="blue" style={{ fontSize: 10, marginBottom: 6 }}>{article.category_name}</Tag>
                      <div style={{ fontWeight: 600, fontSize: 13, color: darkMode ? '#f1f5f9' : '#0f172a', lineHeight: 1.4, marginBottom: 4,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {article.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: darkMode ? '#94a3b8' : '#6b7280', lineHeight: 1.4,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {article.short_description}
                      </div>
                      <div style={{ fontSize: 11, color: darkMode ? '#64748b' : '#9ca3af', marginTop: 6 }}>
                        <CalendarOutlined style={{ marginRight: 3 }} />
                        {moment(article.published_date || article.created_at).format('MMM D, YYYY')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </Col>
      </Row>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: 100,
            right: 30,
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: darkMode ? '#7c3aed' : '#6b21a8',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(107, 33, 168, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            zIndex: 1000,
            transition: 'all 0.3s ease',
            opacity: showScrollTop ? 1 : 0,
            transform: showScrollTop ? 'translateY(0)' : 'translateY(20px)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-5px) scale(1.1)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(107, 33, 168, 0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(107, 33, 168, 0.4)';
          }}
        >
          ↑
        </button>
      )}

    </div>
    </>
  );
};

export default ArticleDetail;