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

  const LANDING_TYPES = ['webinar', 'whitepaper', 'white paper', 'white-paper', 'event'];
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

            {/* Title */}
            <Title level={1} style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
              {content.title}
            </Title>

            {/* Meta */}
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
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

            {/* Hero Image */}
            {content.banner_image && (
              <BannerImage src={`/uploads/${content.banner_image}`} alt={content.title} />
            )}

            {/* Content */}
            {requiresLanding && !hasAccess && (
              <div style={{ marginBottom: 20, padding: '14px 16px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8 }}>
                <Text strong style={{ color: '#8c4b00' }}>
                  <LockOutlined style={{ marginRight: 8 }} /> Preview only. Fill the form on the right to unlock the full article.
                </Text>
              </div>
            )}

            <div
              className="prose-content"
              dangerouslySetInnerHTML={{ __html: (requiresLanding && !hasAccess) ? previewContent : fullContent }}
            />

            {/* Share */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 16, alignItems: 'center' }}>
              <Text strong>Share:</Text>
              <Button icon={<ShareAltOutlined />}>Share</Button>
            </div>
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
              <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 12, border: 'none' }}>
                <div style={{ color: '#fff' }}>
                  <Title level={4} style={{ color: '#fff', marginBottom: 16 }}>
                    {hasAccess ? '✅ Access Granted' : 'Get Access'}
                  </Title>
                  {/* BEFORE SUBMIT: show form */}
                  {!hasAccess && (
                    <>
                      <Text style={{ color: 'rgba(255,255,255,0.9)', display: 'block', marginBottom: 16 }}>
                        Fill in your details to unlock the full article.
                      </Text>
                      <Form layout="vertical" onFinish={handleLandingPageSubmit} form={form}>
                        {customFields.map(field => (
                          <Form.Item key={field.name} name={field.name} rules={[{ required: field.required !== false, message: `${field.label || field.name} is required` }]} style={{ marginBottom: 10 }}>
                            {field.type === 'textarea' ? (
                              <Input.TextArea placeholder={field.placeholder || field.label} rows={3} style={{ background: 'rgba(255,255,255,0.95)' }} />
                            ) : field.type === 'select' ? (
                              <Select placeholder={field.placeholder || field.label} style={{ width: '100%' }}>
                                {(field.options || '').split(',').map(o => o.trim()).filter(Boolean).map(o => (
                                  <Select.Option key={o} value={o}>{o}</Select.Option>
                                ))}
                              </Select>
                            ) : (
                              <Input type={field.type || 'text'} placeholder={field.placeholder || field.label} style={{ background: 'rgba(255,255,255,0.95)' }} />
                            )}
                          </Form.Item>
                        ))}
                        <Form.Item style={{ marginBottom: 0 }}>
                          <Button type="primary" htmlType="submit" block loading={submitting}
                            style={{ background: '#fff', color: '#667eea', fontWeight: 600 }}>
                            Submit
                          </Button>
                        </Form.Item>
                      </Form>
                    </>
                  )}

                  {/* AFTER SUBMIT: show 2 options */}
                  {hasAccess && (
                    <>
                      <Text style={{ color: 'rgba(255,255,255,0.9)', display: 'block', marginBottom: 16, fontSize: 13 }}>
                        ✅ Details submitted! Choose an option below:
                      </Text>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {/* Option 1: Read full article (+ PDF if available) */}
                        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.25)' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>📖 Option 1: Read Full Article</div>
                          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'block', marginBottom: 10 }}>
                            Full article is now unlocked above.{pdfFile ? ' PDF will also be downloaded.' : ''}
                          </Text>
                          {pdfFile && (
                            <Button block onClick={handleDownloadPdf}
                              style={{ background: '#fff', color: '#667eea', fontWeight: 600, border: 'none' }}>
                              📄 Download PDF
                            </Button>
                          )}
                        </div>

                        {/* Option 2: Subscribe */}
                        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.25)' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>📧 Option 2: Subscribe</div>
                          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'block', marginBottom: 10 }}>
                            Get a subscription confirmation email with access details.
                          </Text>
                          <Button block loading={subscribing} onClick={handleSubscribe}
                            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 600 }}>
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
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', paddingBottom: 8, borderBottom: '2px solid #e8ecf4' }}>
                  Related Articles
                </div>
                {relatedArticles.map(article => (
                  <div
                    key={article.id}
                    onClick={() => navigate(`/article/${article.slug}`)}
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