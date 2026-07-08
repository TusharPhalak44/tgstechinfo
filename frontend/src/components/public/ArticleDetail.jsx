import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Row, Col, Typography, Tag, Divider, Button, Form, Input,
  Modal, message, Card, Avatar, Space, Skeleton
} from 'antd';
import { 
  CalendarOutlined, ClockCircleOutlined, ShareAltOutlined,
  UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, CloseOutlined
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
  const previewWords = Math.max(60, Math.floor(words.length * 0.3));
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
  const [showLandingModal, setShowLandingModal] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [customFields, setCustomFields] = useState([]);

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
      const { first_name, last_name, email, contact_number, ...extraValues } = values;

      // Build extra_fields with label as key (not raw field name)
      let extra_fields = null;
      if (customFields.length > 0) {
        extra_fields = {};
        customFields.forEach(field => {
          if (extraValues[field.name] !== undefined) {
            extra_fields[field.label || field.name] = extraValues[field.name];
          }
        });
      }

      const res = await axios.post('/api/public/landing-page', {
        first_name, last_name, email, contact_number,
        content_id: content.id,
        extra_fields
      });

      localStorage.setItem(`article-access-${content.id}`, 'true');
      setHasAccess(true);
      form.resetFields();
      messageApi.success('Access granted! You can now read the full article.');

      // Trigger PDF download if available
      if (res.data?.pdf_file) {
        const link = document.createElement('a');
        link.href = `/uploads/${res.data.pdf_file}`;
        link.download = res.data.pdf_file;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      navigate(`/article/${slug}`, { replace: true });
    } catch (error) {
      messageApi.error(error.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} style={{ padding: 24 }} />;
  if (!content) return <Title level={3} style={{ padding: 24 }}>Content not found</Title>;

  const fullContent = content.content || '';
  const contentParts = (fullContent || '').split('<!--more-->');
  const previewContent = getPreviewHtml(content.short_description || fullContent);
  const remainingContent = contentParts[1] || '';

  return (
    <>
      {contextHolder}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 0' }}>
      <style>{`
        .prose-content * { box-sizing: border-box; }
      `}</style>
      <Row gutter={[24, 24]} style={{ display: 'flex', flexWrap: 'wrap' }}>
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
            {!hasAccess && (
              <div style={{ marginBottom: 20, padding: '14px 16px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8 }}>
                <Text strong style={{ color: '#8c4b00' }}>
                  <LockOutlined style={{ marginRight: 8 }} /> Preview only. Fill the form on the right to unlock the full article.
                </Text>
              </div>
            )}

            <div 
              className="prose-content"
              style={{ fontSize: 16, lineHeight: 1.8, color: '#333', wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: hasAccess ? fullContent : previewContent }} 
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
          <div style={{ position: 'sticky', top: 80 }}>
            <Card style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 12,
              border: 'none'
            }}>
              <div style={{ color: '#fff' }}>
                {remainingContent && (
                  <>
                    <div dangerouslySetInnerHTML={{ __html: remainingContent }} />
                    <Divider style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                  </>
                )}

                <Title level={4} style={{ color: '#fff' }}>{hasAccess ? 'Full Article Unlocked' : 'Get Access'}</Title>
                {!hasAccess ? (
                  <Text style={{ color: 'rgba(255,255,255,0.9)', display: 'block', marginBottom: 16 }}>
                    Fill in your details to unlock the full article and receive access by email.
                  </Text>
                ) : (
                  <Text style={{ color: 'rgba(255,255,255,0.9)', display: 'block', marginBottom: 16 }}>
                    You can now read the complete article content.
                  </Text>
                )}
                
                {!hasAccess && (
                  <Form layout="vertical" onFinish={handleLandingPageSubmit} form={form}>
                    <Form.Item name="first_name" rules={[{ required: true, message: 'Required' }]}>
                      <Input placeholder="First Name" style={{ background: 'rgba(255,255,255,0.95)' }} />
                    </Form.Item>
                    <Form.Item name="last_name" rules={[{ required: true, message: 'Required' }]}>
                      <Input placeholder="Last Name" style={{ background: 'rgba(255,255,255,0.95)' }} />
                    </Form.Item>
                    <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
                      <Input placeholder="Email Address" style={{ background: 'rgba(255,255,255,0.95)' }} />
                    </Form.Item>
                    <Form.Item name="contact_number" rules={[{ required: true, message: 'Required' }]}>
                      <Input placeholder="Mobile Number" style={{ background: 'rgba(255,255,255,0.95)' }} />
                    </Form.Item>
                    {/* Dynamic custom fields */}
                    {customFields.map(field => (
                      <Form.Item
                        key={field.name}
                        name={field.name}
                        rules={[{ required: true, message: `${field.label} is required` }]}
                      >
                        {field.type === 'textarea' ? (
                          <Input.TextArea
                            placeholder={field.placeholder || field.label}
                            rows={3}
                            style={{ background: 'rgba(255,255,255,0.95)' }}
                          />
                        ) : field.type === 'select' ? (
                          <Select
                            placeholder={field.placeholder || field.label}
                            style={{ width: '100%' }}
                          >
                            {(field.options || '').split(',').map(o => o.trim()).filter(Boolean).map(o => (
                              <Select.Option key={o} value={o}>{o}</Select.Option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            type={field.type || 'text'}
                            placeholder={field.placeholder || field.label}
                            style={{ background: 'rgba(255,255,255,0.95)' }}
                          />
                        )}
                      </Form.Item>
                    ))}
                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button type="primary" htmlType="submit" block loading={submitting} style={{ background: '#fff', color: '#667eea', fontWeight: 600 }}>
                        {content?.pdf_file ? '📄 Unlock & Download PDF' : 'Unlock Full Article'}
                      </Button>
                    </Form.Item>
                  </Form>
                )}
              </div>
            </Card>
          </div>
        </Col>
      </Row>

      {/* Related Articles - mobile pe sidebar ke baad, desktop pe main col ke niche */}
      {relatedArticles.length > 0 && (
        <div style={{ marginTop: 40, padding: '0 12px' }}>
          <Title level={3}>Related Articles</Title>
          <Row gutter={[20, 20]}>
            {relatedArticles.map((article) => (
              <Col xs={24} sm={12} lg={8} key={article.id}>
                <Card
                  hoverable
                  onClick={() => navigate(`/article/${article.slug}`)}
                  style={{ borderRadius: 12, cursor: 'pointer' }}
                  styles={{ body: { padding: 0 } }}
                >
                  {article.banner_image ? (
                    <img src={`/uploads/${article.banner_image}`} alt={article.title}
                      style={{ width: '100%', height: 200, objectFit: 'contain', display: 'block', borderRadius: '8px 8px 0 0', background: '#f0f4ff' }} />
                  ) : (
                    <div style={{ height: 200, background: 'linear-gradient(135deg,#e0e9ff,#f0f4ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px 8px 0 0' }}>
                      <Text style={{ fontSize: 48 }}>📄</Text>
                    </div>
                  )}
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      <Tag color="blue" style={{ borderRadius: 12, fontSize: 11 }}>{article.category_name}</Tag>
                    </div>
                    <Text strong style={{ fontSize: 15, color: '#1a1a2e', display: 'block', marginBottom: 6, lineHeight: 1.4 }}>
                      {article.title}
                    </Text>
                    <div style={{ fontSize: 13, color: '#6c6c80', marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {article.short_description}
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#adb5bd' }}>
                      <span><CalendarOutlined /> {moment(article.published_date || article.created_at).format('MMM D, YYYY')}</span>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Modal */}
      <Modal
        title="Get Full Access"
        open={showLandingModal}
        onCancel={() => setShowLandingModal(false)}
        footer={null}
        width={400}
      >
        <Form layout="vertical" onFinish={handleLandingPageSubmit} form={form}>
          <Form.Item name="first_name" rules={[{ required: true }]}>
            <Input placeholder="First Name" prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item name="last_name" rules={[{ required: true }]}>
            <Input placeholder="Last Name" prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="Email" prefix={<MailOutlined />} />
          </Form.Item>
          <Form.Item name="contact_number" rules={[{ required: true }]}>
            <Input placeholder="Contact Number" prefix={<PhoneOutlined />} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              Get Access
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
    </>
  );
};

export default ArticleDetail;