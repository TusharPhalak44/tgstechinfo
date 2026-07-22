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
const CustomComment = ({ author, avatar, content, datetime }) => (
  <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
    <div>{avatar || <Avatar icon={<UserOutlined />} />}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 500, fontSize: 14 }}>{author}</div>
      <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{datetime}</div>
      <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>{content}</div>
    </div>
  </div>
);

const BannerImage = ({ src, alt }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      {/* 35% cropped preview — click to open full */}
      <div
        onClick={() => setLightboxOpen(true)}
        style={{
          margin: '24px -32px 32px',
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{ width: '100%', height: 'auto', display: 'block', transform: 'translateY(0)' }}
        />
        {/* Overlay showing only top 35% */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '85%',
          background: 'linear-gradient(to bottom, transparent 0%, #fff 60%)',
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

  useEffect(() => {
    fetchContent();
  }, [slug]);

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

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/public/content/${slug}`);
      const c = response.data.content;

      // If this is an HTML builder page, redirect to the standalone route
      try {
        const layout = typeof c.builder_layout === 'string'
          ? JSON.parse(c.builder_layout)
          : c.builder_layout;
        if (Array.isArray(layout) && layout[0] === 'html') {
          navigate(`/content/${c.slug}`, { replace: true });
          return;
        }
      } catch { /* not an html builder page, continue */ }

      setContent(c);
      setRelatedArticles(response.data.relatedArticles || []);
      // Parse custom fields
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
      messageApi.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

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
  if (!content) return <Title level={3} style={{ padding: 24 }}>Content not found</Title>;

  const LANDING_TYPES = ['webinar', 'whitepaper', 'white paper', 'white-paper', 'event', 'ebook', 'e-book'];
  const contentTypeName = (content?.content_type_name || content?.content_type || '').toLowerCase().trim();
  const requiresLanding = LANDING_TYPES.includes(contentTypeName);

  const fullContent = content.content || '';
  const previewContent = getPreviewHtml(content.short_description || fullContent);

  return (
    <>
      {contextHolder}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 20px 40px' }}>
      <style>{`
        .prose-content * { box-sizing: border-box; }
      `}</style>
      <Row gutter={[24, 24]} style={{ alignItems: 'flex-start' }}>
        {/* Main Content - 70% */}
        <Col xs={24} lg={17} style={{ order: 1 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {/* Back Button + Breadcrumb */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  background: 'none', border: '1.5px solid #d9d9d9', borderRadius: 8,
                  padding: '4px 12px', cursor: 'pointer', fontSize: 13,
                  color: '#374151', display: 'flex', alignItems: 'center', gap: 6,
                  flexShrink: 0
                }}
              >← Back</button>
              <div style={{ fontSize: 14 }}>
                <Link to="/" style={{ color: '#1890ff' }}>Home</Link>
              <span style={{ margin: '0 8px', color: '#999' }}>/</span>
              <Link to={`/category/${content.category_slug}`} style={{ color: '#1890ff' }}>
                {content.category_name}
              </Link>
              <span style={{ margin: '0 8px', color: '#999' }}>/</span>
              <span>{content.title}</span>
            </div>
            </div>

            {/* Category */}
            <Tag color="blue" style={{ marginBottom: 12 }}>{content.category_name}</Tag>

            {/* Meta */}
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
              <Space size="middle" wrap>
                <Space>
                  <Avatar icon={<UserOutlined />} size="small" />
                  <Text strong>{`${content.first_name || ''} ${content.last_name || ''}`}</Text>
                </Space>
                <Space>
                  <CalendarOutlined />
                  {moment(content.published_date || content.created_at).format('MMMM D, YYYY')}
                </Space>
                <Space>
                  <ClockCircleOutlined /> {content.reading_time || 0} min read
                </Space>
              </Space>
            </div>

            {/* Content rendered in saved layout order */}
            {requiresLanding && !hasAccess && (
              <div style={{ marginBottom: 20, padding: '14px 16px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8 }}>
                <Text strong style={{ color: '#8c4b00' }}>
                  <LockOutlined style={{ marginRight: 8 }} /> Preview only. Fill the form on the right to unlock the full article.
                </Text>
              </div>
            )}

            <ContentRenderer
              content={content}
              renderBanner={(src, alt) => <BannerImage src={src} alt={alt} />}
              contentHtml={(requiresLanding && !hasAccess) ? previewContent : fullContent}
              extraAfter={
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Text strong>Share:</Text>
                  <Button icon={<ShareAltOutlined />}>Share</Button>
                </div>
              }
            />
          </div>

          {/* Comments */}
          <div style={{ marginTop: 40, background: '#fff', padding: 24, borderRadius: 8 }}>
            <Title level={3}>Comments</Title>
            <div>
              {comments.map((item) => (
                <CustomComment
                  key={item.id}
                  author={item.author}
                  content={item.content}
                  datetime={item.datetime}
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
                  background: '#fff', 
                  borderRadius: 16, 
                  border: '2px solid #e8ecf4',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
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
                      <Text style={{ color: '#64748b', display: 'block', marginBottom: 20, fontSize: 14, lineHeight: 1.6 }}>
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
                                  border: '1px solid #e2e8f0',
                                  padding: '10px 12px',
                                  fontSize: 14,
                                  transition: 'all 0.2s'
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = '#4a7cff'}
                                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
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
                                <label htmlFor={field.name} style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, cursor: 'pointer' }}>
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
                                  border: '1px solid #e2e8f0',
                                  padding: '10px 12px',
                                  fontSize: 14,
                                  transition: 'all 0.2s'
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = '#4a7cff'}
                                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
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
                        background: '#f0fdf4',
                        borderRadius: 8,
                        border: '1px solid #bbf7d0'
                      }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                        <Text style={{ color: '#166534', fontSize: 15, fontWeight: 600, display: 'block' }}>
                          Access Unlocked!
                        </Text>
                        <Text style={{ color: '#15803d', fontSize: 13, display: 'block', marginTop: 4 }}>
                          Your details have been submitted successfully.
                        </Text>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Option 1: Read full article (+ PDF if available) */}
                        <div style={{ 
                          background: '#f8fafc', 
                          borderRadius: 12, 
                          padding: '16px', 
                          border: '2px solid #e2e8f0',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#4a7cff';
                          e.currentTarget.style.background = '#f0f9ff';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.background = '#f8fafc';
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
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Read Full Article</div>
                              <Text style={{ color: '#64748b', fontSize: 12 }}>
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
                          background: '#f8fafc', 
                          borderRadius: 12, 
                          padding: '16px', 
                          border: '2px solid #e2e8f0',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#4a7cff';
                          e.currentTarget.style.background = '#f0f9ff';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.background = '#f8fafc';
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
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Subscribe for Updates</div>
                              <Text style={{ color: '#64748b', fontSize: 12 }}>
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

            {/* SEO Info Card — sidebar */}
            {(content.seo_meta_title || content.seo_meta_description || content.seo_meta_keywords) && (
              <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8ecf4', padding: '16px 18px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
                  🔍 SEO Info
                </div>
                {content.seo_meta_title && (
                  <div style={{ marginBottom: 10 }}>
                    <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Meta Title</Text>
                    <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>{content.seo_meta_title}</div>
                  </div>
                )}
                {content.seo_meta_description && (
                  <div style={{ marginBottom: 10 }}>
                    <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Meta Description</Text>
                    <div style={{ fontSize: 13, color: '#374151', marginTop: 2, lineHeight: 1.5 }}>{content.seo_meta_description}</div>
                  </div>
                )}
                {content.seo_meta_keywords && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Keywords</Text>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {content.seo_meta_keywords.split(',').map(k => k.trim()).filter(Boolean).map((k, i) => (
                        <Tag key={i} style={{ fontSize: 11, borderRadius: 12 }}>{k}</Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Related Articles — below landing card ── */}
            {relatedArticles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', paddingBottom: 8, borderBottom: '2px solid #e8ecf4' }}>
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
                          navigate(`/content/${article.slug}`);
                          return;
                        }
                      } catch { /* fall through */ }
                      navigate(`/article/${article.slug}`);
                    }}
                    style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8ecf4', overflow: 'hidden', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    {article.banner_image
                      ? <img src={`/uploads/${article.banner_image}`} alt={article.title} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                      : <div style={{ height: 100, background: 'linear-gradient(135deg,#e0e9ff,#f0f4ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📄</div>
                    }
                    <div style={{ padding: '10px 12px' }}>
                      <Tag color="blue" style={{ fontSize: 10, marginBottom: 6 }}>{article.category_name}</Tag>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', lineHeight: 1.4, marginBottom: 4,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {article.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#6b7280', lineHeight: 1.4,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {article.short_description}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
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


    </div>
    </>
  );
};

export default ArticleDetail;