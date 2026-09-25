import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Row, Col, Typography, Tag, Button, Form, Input,
  message, Card, Avatar, Space, Skeleton, Select
} from 'antd';
import { 
  CalendarOutlined, ClockCircleOutlined, ShareAltOutlined,
  UserOutlined, LockOutlined, CloseOutlined, MailOutlined,
  PhoneOutlined, IdcardOutlined, BankOutlined, SafetyCertificateOutlined,
  CheckCircleFilled, VideoCameraOutlined, RightOutlined, FireOutlined,
  ReadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import '../../prose-content.css';
import ContentRenderer from '../common/ContentRenderer';
import { useTheme } from '../../context/ThemeContext';
import { useTracking } from '../../context/TrackingContext';
import useEngagementTracking from '../../hooks/useEngagementTracking';
import WebinarCountdown from '../common/WebinarCountdown';
import { formatContentPublishDate, formatDateForLongDisplay, formatDateForDisplay, DATE_FORMATS } from '../../utils/dateHelper';

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
          onError={(event) => {
            if (event.currentTarget.dataset.fallbackApplied) return;
            const prefix = '/api/media/file/';
            if (!src.startsWith(prefix)) return;
            event.currentTarget.dataset.fallbackApplied = 'true';
            event.currentTarget.src = `/uploads/${src.slice(prefix.length)}`;
          }}
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
  const { isTrackingEnabled, sessionUuid, trackEngagement } = useTracking();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [customFields, setCustomFields] = useState([]);
  const [subscribing, setSubscribing] = useState(false);
  const [submittedData, setSubmittedData] = useState(null); // stores {name, email} after form submit
  const [pdfFile, setPdfFile] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Webinar Registration state
  const [webinarRegistered, setWebinarRegistered] = useState(false);
  const [webinarRegistering, setWebinarRegistering] = useState(false);
  const [webinarRegForm] = Form.useForm();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribing, setNewsletterSubscribing] = useState(false);

  // Engagement tracking hook
  const { isTracking, trackEngagement: trackEngagementHook } = useEngagementTracking({
    contentId: content?.id,
    contentType: content?.content_type_slug || content?.content_type,
    pageTitle: content?.title,
    enabled: !!content?.id && isTrackingEnabled
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/public/content/${slug}`);
        if (cancelled) return;
        const c = response.data.content;

        if (c?.id) {
          axios.post(`/api/public/content/${c.id}/view`).catch(() => {});
        }

        if (!c) {
          messageApi.error('Content not found');
          setContent(null);
          setLoading(false);
          return;
        }

        try {
          const layout = typeof c.builder_layout === 'string'
            ? JSON.parse(c.builder_layout)
            : c.builder_layout;
          const isHtmlBuilder = Array.isArray(layout) && layout[0] === 'html';
          // Visual Builder pages have builder_page_data set
          const isVisualBuilder = !!c.builder_page_data;
          if (isHtmlBuilder || isVisualBuilder) {
            // Redirect to the standalone page renderer (no navbar/footer)
            // encodeURIComponent handles slugs that may contain spaces or special chars
            navigate(`/content/${encodeURIComponent(c.slug)}`, { replace: true });
            return;
          }
        } catch (e) {
          console.log('[ArticleDetail] layout parse error:', e.message);
        }

        setContent(c);
        setRelatedArticles(response.data.relatedArticles || []);
        if (c?.id) {
          const isReg = localStorage.getItem(`webinar_registered_${c.id}`);
          if (isReg) setWebinarRegistered(true);
        }
        if (c?.custom_fields) {
          try {
            const cf = typeof c.custom_fields === 'string' ? JSON.parse(c.custom_fields) : c.custom_fields;
            setCustomFields(Array.isArray(cf) ? cf : []);
          } catch { setCustomFields([]); }
        }
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

  const handleWebinarRegisterSubmit = async (values) => {
    if (!content?.id) return;
    setWebinarRegistering(true);
    try {
      const res = await axios.post(`/api/public/content/${content.id}/register-webinar`, values);
      if (res.data?.success) {
        setWebinarRegistered(true);
        localStorage.setItem(`webinar_registered_${content.id}`, 'true');
        messageApi.success('Registration successful! Access granted to Live Webinar.');
      } else {
        messageApi.error(res.data?.message || 'Registration failed');
      }
    } catch (err) {
      messageApi.error(err.response?.data?.message || 'Failed to register for webinar');
    } finally {
      setWebinarRegistering(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfFile) return;
    
    // Track download engagement
    if (isTrackingEnabled && content?.id) {
      trackEngagement({
        content_id: content.id,
        engagement_type: 'download',
        engagement_data: {
          file_name: pdfFile,
          content_type: content.content_type_slug || content.content_type
        }
      }).catch(err => console.error('Download tracking error:', err));
    }
    
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

  const handleNewsletterSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      messageApi.error('Please enter a valid email address');
      return;
    }
    setNewsletterSubscribing(true);
    try {
      await axios.post('/api/public/newsletter', { email: newsletterEmail });
      messageApi.success('Successfully subscribed to newsletter!');
      setNewsletterEmail('');
    } catch (error) {
      messageApi.error(error.response?.data?.message || 'Failed to subscribe. Please try again.');
    } finally {
      setNewsletterSubscribing(false);
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

  const LANDING_TYPES = ['whitepaper', 'white paper', 'white-paper', 'event', 'e-book'];
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
                  <Text style={{ color: darkMode ? '#cbd5e1' : '#000' }}>{content.scheduled_publish_date ? moment(content.scheduled_publish_date).format('MMMM D, YYYY') : (content.published_date ? moment(content.published_date).format('MMMM D, YYYY') : (content.created_at ? moment(content.created_at).format('MMMM D, YYYY') : '—'))}</Text>
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

            {/* ── WEBINAR REGISTRATION & MEDIA SECTION ── */}
            {contentTypeName === 'webinar' && (() => {
              const isLive = content.webinar_type === 'live' || (!content.webinar_type && content.webinar_date);
              const isOnDemand = content.webinar_type === 'on_demand' || (!isLive && content.video_file);

              return (
                <div style={{ marginTop: 24, marginBottom: 32 }}>
                  {/* Host & Platform Metadata Banner */}
                  <div style={{
                    background: darkMode
                      ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                      : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    borderRadius: 16,
                    padding: '24px 28px',
                    marginBottom: 24,
                    border: darkMode ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #bae6fd',
                    boxShadow: darkMode ? '0 8px 25px rgba(0,0,0,0.3)' : '0 8px 25px rgba(186, 230, 253, 0.4)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Tag color="blue" style={{ fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          WEBINAR EVENT
                        </Tag>
                        {content.platform && (
                          <Tag color="purple" style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 12 }}>
                            Platform: {content.platform}
                          </Tag>
                        )}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: darkMode ? '#f8fafc' : '#0f172a', lineHeight: 1.3 }}>
                        {content.title}
                      </div>
                      {content.hosted_by && (
                        <div style={{ fontSize: 14, color: darkMode ? '#cbd5e1' : '#475569', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <UserOutlined style={{ color: '#38bdf8' }} /> Hosted by: <strong style={{ color: darkMode ? '#38bdf8' : '#0284c7' }}>{content.hosted_by}</strong>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Tag color={isLive ? 'red' : 'green'} style={{ fontSize: 13, padding: '6px 14px', borderRadius: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isLive ? '🔴 LIVE WEBINAR' : '📹 ON-DEMAND WEBINAR'}
                      </Tag>
                    </div>
                  </div>

                  {/* ── LIVE WEBINAR MODE ── */}
                  {isLive && (
                    <>
                      {/* Countdown Timer */}
                      {content.webinar_date && (
                        <WebinarCountdown webinarDate={content.webinar_date} darkMode={darkMode} title={content.title} />
                      )}

                      {/* Registration Form / Join Link Card */}
                      <div style={{
                        background: darkMode
                          ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)'
                          : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                        borderRadius: 20,
                        padding: '32px 36px',
                        marginTop: 24,
                        border: darkMode ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid #e2e8f0',
                        boxShadow: darkMode
                          ? '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.1)'
                          : '0 12px 40px rgba(0, 0, 0, 0.08)'
                      }}>
                        {webinarRegistered ? (
                          /* Registered State: Show Join Link Button */
                          <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                            <div style={{
                              width: 72,
                              height: 72,
                              borderRadius: '50%',
                              background: 'rgba(37, 99, 235, 0.15)',
                              border: '2px solid #2563eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 16px'
                            }}>
                              <CheckCircleFilled style={{ fontSize: 40, color: '#2563eb' }} />
                            </div>
                            <Title level={3} style={{ color: darkMode ? '#f8fafc' : '#0f172a', marginBottom: 8, fontWeight: 800 }}>
                              You are Registered for this Live Webinar!
                            </Title>
                            <Text style={{ color: darkMode ? '#94a3b8' : '#475569', fontSize: 15, display: 'block', maxWidth: 540, margin: '0 auto 28px', lineHeight: 1.6 }}>
                              Your seat has been reserved. You can access the session live using the direct link below when the event begins.
                            </Text>

                            {content.join_link ? (
                              <Button
                                type="primary"
                                size="large"
                                href={content.join_link.startsWith('http') ? content.join_link : `https://${content.join_link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                icon={<VideoCameraOutlined />}
                                style={{
                                  height: 54,
                                  padding: '0 44px',
                                  fontSize: 16,
                                  fontWeight: 800,
                                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                  border: 'none',
                                  borderRadius: 14,
                                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 10
                                }}
                              >
                                JOIN LIVE WEBINAR NOW ({content.platform || 'Meeting Link'})
                              </Button>
                            ) : (
                              <Tag color="orange" style={{ fontSize: 14, padding: '8px 20px', borderRadius: 16, fontWeight: 600 }}>
                                🔔 Join link will activate closer to the event launch time.
                              </Tag>
                            )}
                          </div>
                        ) : (
                          /* Unregistered State: Display Registration Form */
                          <div>
                            {/* Form Header */}
                            <div style={{ marginBottom: 28 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    background: '#ef4444',
                                    boxShadow: '0 0 10px #ef4444',
                                    display: 'inline-block'
                                  }} />
                                  <Title level={4} style={{ color: darkMode ? '#f8fafc' : '#0f172a', margin: 0, fontWeight: 800 }}>
                                    Reserve Your Spot Now
                                  </Title>
                                </div>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  background: darkMode ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
                                  border: darkMode ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #fde68a',
                                  padding: '4px 12px',
                                  borderRadius: 12,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: darkMode ? '#fbbf24' : '#b45309'
                                }}>
                                  <FireOutlined /> Free Virtual Pass Included
                                </div>
                              </div>
                              <Text style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: 14, display: 'block' }}>
                                Fill out the form below to secure your complimentary pass and receive instant calendar updates.
                              </Text>
                            </div>

                            <Form
                              form={webinarRegForm}
                              layout="vertical"
                              onFinish={handleWebinarRegisterSubmit}
                              requiredMark={false}
                            >
                              <Row gutter={16}>
                                <Col xs={24} sm={12}>
                                  <Form.Item
                                    name="first_name"
                                    label={<span style={{ color: darkMode ? '#cbd5e1' : '#334155', fontWeight: 700, fontSize: 13 }}>First Name *</span>}
                                    rules={[{ required: true, message: 'First name is required' }]}
                                  >
                                    <Input
                                      prefix={<UserOutlined style={{ color: '#38bdf8', marginRight: 4 }} />}
                                      placeholder="First name"
                                      size="large"
                                      style={{
                                        height: 48,
                                        borderRadius: 10,
                                        background: darkMode ? 'rgba(15, 23, 42, 0.6)' : '#fff',
                                        borderColor: darkMode ? '#334155' : '#cbd5e1',
                                        color: darkMode ? '#f8fafc' : '#0f172a'
                                      }}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                  <Form.Item
                                    name="last_name"
                                    label={<span style={{ color: darkMode ? '#cbd5e1' : '#334155', fontWeight: 700, fontSize: 13 }}>Last Name *</span>}
                                    rules={[{ required: true, message: 'Last name is required' }]}
                                  >
                                    <Input
                                      prefix={<IdcardOutlined style={{ color: '#38bdf8', marginRight: 4 }} />}
                                      placeholder="Last name"
                                      size="large"
                                      style={{
                                        height: 48,
                                        borderRadius: 10,
                                        background: darkMode ? 'rgba(15, 23, 42, 0.6)' : '#fff',
                                        borderColor: darkMode ? '#334155' : '#cbd5e1',
                                        color: darkMode ? '#f8fafc' : '#0f172a'
                                      }}
                                    />
                                  </Form.Item>
                                </Col>
                              </Row>

                              <Row gutter={16}>
                                <Col xs={24} sm={12}>
                                  <Form.Item
                                    name="email"
                                    label={<span style={{ color: darkMode ? '#cbd5e1' : '#334155', fontWeight: 700, fontSize: 13 }}>Work Email Address *</span>}
                                    rules={[
                                      { required: true, message: 'Email is required' },
                                      { type: 'email', message: 'Enter a valid email address' }
                                    ]}
                                  >
                                    <Input
                                      prefix={<MailOutlined style={{ color: '#818cf8', marginRight: 4 }} />}
                                      placeholder="name@company.com"
                                      size="large"
                                      style={{
                                        height: 48,
                                        borderRadius: 10,
                                        background: darkMode ? 'rgba(15, 23, 42, 0.6)' : '#fff',
                                        borderColor: darkMode ? '#334155' : '#cbd5e1',
                                        color: darkMode ? '#f8fafc' : '#0f172a'
                                      }}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                  <Form.Item
                                    name="contact_number"
                                    label={<span style={{ color: darkMode ? '#cbd5e1' : '#334155', fontWeight: 700, fontSize: 13 }}>Contact Number *</span>}
                                    rules={[{ required: true, message: 'Contact number is required' }]}
                                  >
                                    <Input
                                      prefix={<PhoneOutlined style={{ color: '#c084fc', marginRight: 4 }} />}
                                      placeholder="+1 (555) 000-0000"
                                      size="large"
                                      style={{
                                        height: 48,
                                        borderRadius: 10,
                                        background: darkMode ? 'rgba(15, 23, 42, 0.6)' : '#fff',
                                        borderColor: darkMode ? '#334155' : '#cbd5e1',
                                        color: darkMode ? '#f8fafc' : '#0f172a'
                                      }}
                                    />
                                  </Form.Item>
                                </Col>
                              </Row>

                              <Row gutter={16}>
                                <Col xs={24} sm={12}>
                                  <Form.Item
                                    name="job_title"
                                    label={<span style={{ color: darkMode ? '#cbd5e1' : '#334155', fontWeight: 700, fontSize: 13 }}>Job Title *</span>}
                                    rules={[{ required: true, message: 'Job title is required' }]}
                                  >
                                    <Input
                                      prefix={<IdcardOutlined style={{ color: '#f472b6', marginRight: 4 }} />}
                                      placeholder="e.g. CTO, VP of Tech"
                                      size="large"
                                      style={{
                                        height: 48,
                                        borderRadius: 10,
                                        background: darkMode ? 'rgba(15, 23, 42, 0.6)' : '#fff',
                                        borderColor: darkMode ? '#334155' : '#cbd5e1',
                                        color: darkMode ? '#f8fafc' : '#0f172a'
                                      }}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                  <Form.Item
                                    name="company_name"
                                    label={<span style={{ color: darkMode ? '#cbd5e1' : '#334155', fontWeight: 700, fontSize: 13 }}>Company Name *</span>}
                                    rules={[{ required: true, message: 'Company name is required' }]}
                                  >
                                    <Input
                                      prefix={<BankOutlined style={{ color: '#fbbf24', marginRight: 4 }} />}
                                      placeholder="e.g. Acme Enterprise"
                                      size="large"
                                      style={{
                                        height: 48,
                                        borderRadius: 10,
                                        background: darkMode ? 'rgba(15, 23, 42, 0.6)' : '#fff',
                                        borderColor: darkMode ? '#334155' : '#cbd5e1',
                                        color: darkMode ? '#f8fafc' : '#0f172a'
                                      }}
                                    />
                                  </Form.Item>
                                </Col>
                              </Row>

                              <Form.Item style={{ marginBottom: 0, marginTop: 12 }}>
                                <Button
                                  type="primary"
                                  htmlType="submit"
                                  loading={webinarRegistering}
                                  size="large"
                                  icon={<RightOutlined />}
                                  style={{
                                    width: '100%',
                                    height: 52,
                                    fontSize: 16,
                                    fontWeight: 800,
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                    border: 'none',
                                    borderRadius: 12,
                                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em'
                                  }}
                                >
                                  Reserve My Seat Now
                                </Button>
                              </Form.Item>
                            </Form>

                            {/* Trust Security Footer */}
                            <div style={{
                              marginTop: 20,
                              textAlign: 'center',
                              fontSize: 12,
                              color: darkMode ? '#94a3b8' : '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6
                            }}>
                              <SafetyCertificateOutlined style={{ color: '#10b981', fontSize: 14 }} />
                              <span>100% Confidential & Secure. Your information is protected under our Privacy Policy.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* ── ON-DEMAND WEBINAR VIDEO PLAYER ── */}
                  {isOnDemand && content.video_file && (
                    <div style={{ margin: '24px 0', borderRadius: 12, overflow: 'hidden', background: darkMode ? '#0f172a' : '#000', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
                      <video
                        controls
                        style={{ width: '100%', display: 'block' }}
                        preload="metadata"
                        poster={content.banner_image ? `/uploads/${content.banner_image}` : undefined}
                      >
                        <source src={`/uploads/${content.video_file}`} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Video Section for legacy non-webinar video content */}
            {contentTypeName !== 'webinar' && content.video_file && (
              <>
                {/* Show countdown for future webinars - NO VIDEO */}
                {content.webinar_date && moment(content.webinar_date).isAfter(moment()) ? (
                  <>
                    <WebinarCountdown webinarDate={content.webinar_date} darkMode={darkMode} />
                    <div style={{ 
                      margin: '24px 0 16px', 
                      borderRadius: 8, 
                      padding: '40px 20px', 
                      textAlign: 'center',
                      background: darkMode ? 'rgba(74, 124, 255, 0.1)' : '#eff6ff',
                      border: darkMode ? '2px solid #3b82f6' : '2px solid #bfdbfe'
                    }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
                      <div style={{ 
                        fontSize: 18, 
                        fontWeight: 600, 
                        color: darkMode ? '#f1f5f9' : '#1a1a2e',
                        marginBottom: 8 
                      }}>
                        Video Available After Webinar
                      </div>
                      <div style={{ 
                        fontSize: 14, 
                        color: darkMode ? '#94a3b8' : '#6b7280' 
                      }}>
                        The webinar video will be available to watch after the scheduled date and time.
                      </div>
                    </div>
                  </>
                ) : (
                  /* Show video for past webinars or if no webinar date */
                  <div style={{ margin: '24px 0 16px', borderRadius: 8, overflow: 'hidden', background: darkMode ? '#0f172a' : '#000' }}>
                    <video
                      controls
                      style={{ width: '100%', display: 'block' }}
                      preload="metadata"
                      onError={(e) => {
                        console.error('Video error:', e);
                        e.target.style.display = 'none';
                        const errorDiv = document.createElement('div');
                        errorDiv.style.cssText = `
                          padding: 40px 20px;
                          text-align: center;
                          color: ${darkMode ? '#cbd5e1' : '#666'};
                          background: ${darkMode ? '#1e293b' : '#f8fafc'};
                        `;
                        errorDiv.innerHTML = `
                          <div style="font-size: 48px; margin-bottom: 16px;">🎬</div>
                          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Video Not Available</div>
                          <div style="font-size: 14px;">The video file is missing from the server. Please contact the administrator to re-upload this video.</div>
                        `;
                        e.target.parentNode.appendChild(errorDiv);
                      }}
                    >
                      <source src={`/uploads/${content.video_file}`} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
              </>
            )}
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

            {/* ── Newsletter Box ── */}
            <div style={{
              background: 'linear-gradient(135deg, #0AAEEF 0%, #0284C7 50%, #0369A1 100%)',
              borderRadius: 16,
              padding: '24px',
              boxShadow: '0 4px 20px rgba(10, 174, 239, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: 24
            }}>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <ReadOutlined style={{ color: '#fff', fontSize: 18 }} />
                <span style={{ fontWeight: 800, fontSize: 13, color: '#fff', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Subscribe the Newsletter
                </span>
              </div>

              <form onSubmit={handleNewsletterSubscribe} style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter corporate email..."
                  required
                  disabled={newsletterSubscribing}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'rgba(255,255,255,0.95)',
                    color: '#1f2937',
                    fontSize: 12,
                    outline: 'none',
                    fontWeight: 500
                  }}
                />
                <button
                  type="submit"
                  disabled={newsletterSubscribing}
                  style={{
                    padding: '10px 16px',
                    background: '#0F172A',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: newsletterSubscribing ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: 12,
                    opacity: newsletterSubscribing ? 0.6 : 1
                  }}
                >
                  {newsletterSubscribing ? 'Joining...' : 'Join'}
                </button>
              </form>
            </div>

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
                        const isHtmlBuilder = Array.isArray(layout) && layout[0] === 'html';
                        const isVisualBuilder = !!article.builder_page_data;
                        if (isHtmlBuilder || isVisualBuilder) {
                          navigate(`/content/${encodeURIComponent(article.slug)}`);
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
                        {formatContentPublishDate(article)}
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