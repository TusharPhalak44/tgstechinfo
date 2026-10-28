import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Row, Col, Typography, Tag, Button, Form, Input,
  message, Card, Avatar, Space, Skeleton, Select, Tooltip
} from 'antd';
import {
  CalendarOutlined, ClockCircleOutlined, ShareAltOutlined,
  UserOutlined, LockOutlined, CloseOutlined, MailOutlined,
  PhoneOutlined, IdcardOutlined, BankOutlined, SafetyCertificateOutlined,
  CheckCircleFilled, VideoCameraOutlined, RightOutlined, FireOutlined,
  ReadOutlined, CopyOutlined, CheckOutlined, LinkedinFilled, TwitterOutlined,
  FacebookFilled, WhatsAppOutlined, ArrowUpOutlined, DownloadOutlined,
  GlobalOutlined, LinkOutlined
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
import ArticleNewsletterBanner from './ArticleNewsletterBanner';
import { navigateContentItem, resolveContentRoute } from '../../lib/contentRoute';
import ContentShareModal from './ContentShareModal';

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
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [quickCopied, setQuickCopied] = useState(false);

  const handleQuickCopy = async () => {
    const url = window.location.href;
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        success = true;
      }
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (err) {
        console.error('ExecCommand copy failed:', err);
      }
    }
    if (success) {
      setQuickCopied(true);
      messageApi.success('Link copied to clipboard!');
      setTimeout(() => setQuickCopied(false), 2500);
    } else {
      messageApi.error('Failed to copy link');
    }
  };

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
          axios.post(`/api/public/content/${c.id}/view`).catch(() => { });
        }

        if (!c) {
          messageApi.error('Content not found');
          setContent(null);
          setLoading(false);
          return;
        }

        // If this content item is an Event, redirect immediately to the dedicated Event Detail Page
        const isEventContent = c.content_type_id === 5 || 
                               (typeof c.content_type === 'string' && c.content_type.toLowerCase() === 'event') ||
                               (typeof c.content_type_name === 'string' && c.content_type_name.toLowerCase() === 'event');
        if (isEventContent) {
          navigate(`/events/${encodeURIComponent(c.slug)}`, { replace: true });
          return;
        }

        try {
          const layout = typeof c.builder_layout === 'string'
            ? JSON.parse(c.builder_layout)
            : c.builder_layout;

          // File-based landing pages uploaded to backend/landing-pages/
          const isFileLanding = Boolean(
            c.is_file_landing_page ||
            (Array.isArray(layout) && (layout.includes('file-landing') || layout[0] === 'file-landing')) ||
            (typeof c.content === 'string' && c.content.includes('File-based landing page')) ||
            (c.url && (c.url.startsWith('/lp/') || c.url.includes('/lp/')))
          );
          if (isFileLanding) {
            window.location.href = `/lp/${encodeURIComponent(c.slug)}`;
            return;
          }

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
        if (c?.pdf_file) {
          setPdfFile(c.pdf_file);
        }
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
    const pageTitle = content.seo_meta_title || content.title || 'Article';
    document.title = `${pageTitle} | TGS Tech Info`;

    const setMeta = (attr, key, val) => {
      if (!val) return;
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    };

    const description = content.seo_meta_description || content.short_description || content.title || '';
    const keywords = content.seo_meta_keywords || (content.tags ? (typeof content.tags === 'string' ? content.tags : content.tags.join(', ')) : '');
    const currentUrl = window.location.href;
    const imageUrl = content.banner_image || 'https://tgstechinfo.com/favicon.svg';

    // Standard meta tags
    setMeta('name', 'description', description);
    if (keywords) setMeta('name', 'keywords', keywords);

    // OpenGraph tags
    setMeta('property', 'og:type', 'article');
    setMeta('property', 'og:title', pageTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', currentUrl);
    setMeta('property', 'og:image', imageUrl);

    // Twitter Card tags
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', pageTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', imageUrl);

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // JSON-LD structured schema
    let scriptTag = document.getElementById('article-json-ld');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'article-json-ld';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": content.title,
      "description": description,
      "image": [imageUrl],
      "datePublished": content.published_date || content.created_at,
      "dateModified": content.updated_at || content.published_date || content.created_at,
      "author": {
        "@type": "Person",
        "name": [content.first_name, content.last_name].filter(Boolean).join(' ') || 'Editorial Team'
      },
      "publisher": {
        "@type": "Organization",
        "name": "TGS Tech Info",
        "logo": {
          "@type": "ImageObject",
          "url": "https://tgstechinfo.com/favicon.svg"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": currentUrl
      }
    };
    scriptTag.textContent = JSON.stringify(schemaData);

    return () => {
      document.title = 'TGS Tech Info';
      const existingScript = document.getElementById('article-json-ld');
      if (existingScript) existingScript.remove();
    };
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
      const extra_fields = { ...values };
      if (customFields && customFields.length > 0) {
        customFields.forEach(field => {
          if (values[field.name] !== undefined) {
            extra_fields[field.name] = values[field.name];
            // webhook_key bhi store karo taaki backend correctly map kar sake
            if (field.webhook_key && field.webhook_key !== field.name)
              extra_fields[field.webhook_key] = values[field.name];
          }
        });
      }

      const res = await axios.post('/api/public/landing-page', {
        content_id: content.id,
        extra_fields
      });

      const redirectTarget = res.data?.redirect_url || res.data?.page_url || extra_fields.page_url || extra_fields.redirect_url;
      if (redirectTarget && typeof redirectTarget === 'string' && redirectTarget.trim() && redirectTarget.trim() !== '#' && !redirectTarget.trim().startsWith('javascript:')) {
        window.location.href = redirectTarget.trim();
        return;
      }

      localStorage.setItem(`article-access-${content.id}`, 'true');
      setHasAccess(true);
      if (res.data?.pdf_file || content?.pdf_file) {
        setPdfFile(res.data?.pdf_file || content?.pdf_file);
      }
      setSubmittedData(extra_fields);
      try {
        form.resetFields();
      } catch (e) { /* ignore */ }

      messageApi.success(res.data?.message || 'Access granted successfully!');

      if (res.data?.redirect_url) {
        const target = res.data.redirect_url.trim();
        if (target && !target.startsWith('javascript:') && target !== '#') {
          setTimeout(() => {
            window.location.href = target;
          }, 800);
        }
      }
    } catch (error) {
      const isAlreadySub = error.response?.status === 409 || error.response?.data?.alreadySubscribed;
      const msg = isAlreadySub
        ? (error.response?.data?.message || 'This email has been already subscribed')
        : (error.response?.data?.message || 'Failed to submit');
      if (isAlreadySub) {
        alert(msg);
      } else {
        messageApi.error(msg);
      }
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
    const fileToDownload = pdfFile || content?.pdf_file;
    if (!fileToDownload) {
      messageApi.warning('eBook PDF file is being prepared. Please check your email.');
      return;
    }

    // Track download engagement
    if (isTrackingEnabled && content?.id) {
      trackEngagement({
        content_id: content.id,
        engagement_type: 'download',
        engagement_data: {
          file_name: fileToDownload,
          content_type: content.content_type_slug || content.content_type
        }
      }).catch(err => console.error('Download tracking error:', err));
    }

    const downloadHref = fileToDownload.startsWith('http://') || fileToDownload.startsWith('https://')
      ? fileToDownload
      : (fileToDownload.startsWith('/') ? fileToDownload : `/uploads/${fileToDownload}`);

    const link = document.createElement('a');
    link.href = downloadHref;
    link.download = fileToDownload.split('/').pop() || 'ebook.pdf';
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
      const isAlreadySub = error.response?.status === 409 || error.response?.data?.alreadySubscribed;
      const msg = isAlreadySub
        ? (error.response?.data?.message || 'This email has been already subscribed')
        : (error.response?.data?.message || 'Failed to subscribe');
      if (isAlreadySub) {
        alert(msg);
      } else {
        messageApi.error(msg);
      }
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
      const isAlreadySub = error.response?.status === 409 || error.response?.data?.alreadySubscribed;
      const msg = isAlreadySub
        ? (error.response?.data?.message || 'This email has been already subscribed')
        : (error.response?.data?.message || 'Failed to subscribe. Please try again.');
      if (isAlreadySub) {
        alert(msg);
      } else {
        messageApi.error(msg);
      }
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

  const LANDING_TYPES = ['whitepaper', 'white paper', 'white-paper', 'e-book', 'ebook', 'ebooks'];
  const contentTypeName = (content?.content_type_name || content?.content_type || '').toLowerCase().trim();
  const isEbook = contentTypeName.includes('ebook') || content?.content_type_id === 7;
  const isEvent = content?.content_type_id === 5 ||
                  contentTypeName === 'event' ||
                  contentTypeName.includes('event') ||
                  Boolean(content?.event) ||
                  Boolean(content?.registration_url) ||
                  Boolean(content?.source_url);
  const requiresLanding = !isEvent && (LANDING_TYPES.some(t => contentTypeName.includes(t)) || isEbook);

  const eventSourceUrl = content?.source_url || content?.event?.source_url;
  const eventRegUrl = content?.registration_url || content?.event?.registration_url || (isEvent ? `/events/${content?.slug}` : null);
  const isExternalReg = (content?.registration_type === 'external' || content?.event?.registration_type === 'external') && Boolean(content?.registration_url || content?.event?.registration_url);

  const fullContent = content.content || '';
  const previewContent = getPreviewHtml(content.short_description || fullContent);

  const effectiveCustomFields = (customFields && customFields.length > 0)
    ? customFields
    : [
        { name: 'first_name', label: 'First Name', type: 'text', placeholder: 'Enter your first name', required: true },
        { name: 'last_name', label: 'Last Name', type: 'text', placeholder: 'Enter your last name', required: true },
        { name: 'email', label: 'Business Email', type: 'email', placeholder: 'name@company.com', required: true },
        { name: 'contact', label: 'Phone / Contact', type: 'text', placeholder: '+1 (555) 000-0000', required: false }
      ];

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
              {/* Category & Event Tags */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                <Tag color="blue">{content.category_name}</Tag>
                {isEvent && (
                  <>
                    <Tag color="cyan" style={{ fontWeight: 700 }}>
                      📅 EVENT
                    </Tag>
                    {eventSourceUrl && (
                      <a href={eventSourceUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <Tag color="geekblue" icon={<GlobalOutlined />} style={{ fontWeight: 600, cursor: 'pointer' }}>
                          Official Event Source ↗
                        </Tag>
                      </a>
                    )}
                    {eventRegUrl && (
                      <a href={eventRegUrl} target={isExternalReg ? "_blank" : "_self"} rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <Tag color="green" icon={<LinkOutlined />} style={{ fontWeight: 600, cursor: 'pointer' }}>
                          {isExternalReg ? 'Register on Organizer Website ↗' : 'Register for Event (Free) ↗'}
                        </Tag>
                      </a>
                    )}
                    <Link to={`/events/${encodeURIComponent(content.slug)}`} style={{ textDecoration: 'none' }}>
                      <Tag color="purple" style={{ fontWeight: 600, cursor: 'pointer' }}>
                        Open Dedicated Event Hub →
                      </Tag>
                    </Link>
                  </>
                )}
              </div>

              {/* Meta */}
              <div style={{
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
              }}>
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
                <Button
                  size="small"
                  icon={<ShareAltOutlined />}
                  onClick={() => setShareModalOpen(true)}
                  style={{
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: 600,
                    borderColor: darkMode ? '#475569' : '#cbd5e1',
                    color: darkMode ? '#cbd5e1' : '#334155',
                    background: darkMode ? 'rgba(51, 65, 85, 0.4)' : '#f8fafc'
                  }}
                >
                  Share
                </Button>
              </div>

              {/* Content rendered in saved layout order */}
              {requiresLanding && !hasAccess && (
                <div style={{ marginBottom: 20, padding: '14px 16px', background: darkMode ? 'rgba(251, 191, 36, 0.1)' : '#fff7e6', border: darkMode ? '1px solid #fbbf24' : '1px solid #ffd591', borderRadius: 8 }}>
                  <Text strong style={{ color: darkMode ? '#fcd34d' : '#8c4b00' }}>
                    <LockOutlined style={{ marginRight: 8 }} />
                    {isEbook
                      ? ' eBook Overview: Complete the form below to receive the complete eBook in PDF format directly in your email.'
                      : ' Preview only. Fill the form to unlock the full content.'}
                  </Text>
                </div>
              )}

              <ContentRenderer
                content={content}
                renderBanner={(src, alt) => <BannerImage src={src} alt={alt} darkMode={darkMode} />}
                contentHtml={(requiresLanding && !hasAccess) ? previewContent : fullContent}
                darkMode={darkMode}
                extraAfter={
                  <div style={{
                    marginTop: 24,
                    paddingTop: 20,
                    borderTop: darkMode ? '1px solid #334155' : '1px solid #f0f0f0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <Text strong style={{ color: darkMode ? '#f1f5f9' : '#1e293b', fontSize: 14 }}>
                        Share:
                      </Text>
                      <Button
                        type="primary"
                        icon={<ShareAltOutlined />}
                        onClick={() => setShareModalOpen(true)}
                        style={{
                          background: 'linear-gradient(135deg, #0AAEEF 0%, #0077b5 100%)',
                          border: 'none',
                          borderRadius: 20,
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(10, 174, 239, 0.25)'
                        }}
                      >
                        Share
                      </Button>
                      <Tooltip title="Share on LinkedIn">
                        <Button
                          shape="circle"
                          icon={<LinkedinFilled />}
                          onClick={() => {
                            const url = encodeURIComponent(window.location.href);
                            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=640,height=560,scrollbars=yes,resizable=yes');
                          }}
                          style={{
                            background: '#0A66C2',
                            color: '#fff',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Share on X (Twitter)">
                        <Button
                          shape="circle"
                          icon={<TwitterOutlined />}
                          onClick={() => {
                            const url = encodeURIComponent(window.location.href);
                            const title = encodeURIComponent(content?.title || '');
                            window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank', 'width=640,height=560,scrollbars=yes,resizable=yes');
                          }}
                          style={{
                            background: darkMode ? '#0f172a' : '#111827',
                            color: '#fff',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Share on WhatsApp">
                        <Button
                          shape="circle"
                          icon={<WhatsAppOutlined />}
                          onClick={() => {
                            const url = encodeURIComponent(window.location.href);
                            const title = encodeURIComponent(content?.title || '');
                            window.open(`https://api.whatsapp.com/send?text=${title}%20-%20${url}`, '_blank', 'width=640,height=560,scrollbars=yes,resizable=yes');
                          }}
                          style={{
                            background: '#25D366',
                            color: '#fff',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Share on Facebook">
                        <Button
                          shape="circle"
                          icon={<FacebookFilled />}
                          onClick={() => {
                            const url = encodeURIComponent(window.location.href);
                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=640,height=560,scrollbars=yes,resizable=yes');
                          }}
                          style={{
                            background: '#1877F2',
                            color: '#fff',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        />
                      </Tooltip>
                      <Tooltip title={quickCopied ? "Link Copied!" : "Copy Link"}>
                        <Button
                          icon={quickCopied ? <CheckOutlined /> : <CopyOutlined />}
                          onClick={handleQuickCopy}
                          style={{
                            borderRadius: 20,
                            borderColor: quickCopied ? '#10b981' : (darkMode ? '#475569' : '#d9d9d9'),
                            color: quickCopied ? '#10b981' : (darkMode ? '#cbd5e1' : '#374151'),
                            background: quickCopied ? (darkMode ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5') : 'transparent',
                            fontWeight: 500
                          }}
                        >
                          {quickCopied ? 'Copied!' : 'Copy Link'}
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                }
              />

              {/* ── EBOOK DOWNLOAD & LEAD CAPTURE SECTION (Directly below description) ── */}
              {isEbook && (
                <div
                  id="ebook-download-section"
                  style={{
                    marginTop: 32,
                    marginBottom: 32,
                    background: darkMode
                      ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)'
                      : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    borderRadius: 16,
                    border: darkMode ? '1.5px solid #334155' : '1.5px solid #e2e8f0',
                    boxShadow: darkMode
                      ? '0 10px 30px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                      : '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Gradient accent top bar */}
                  <div style={{
                    height: 4,
                    background: 'linear-gradient(90deg, #0AAEEF 0%, #4a7cff 50%, #6c5ce7 100%)'
                  }} />

                  {!hasAccess ? (
                    <div style={{ padding: '32px 28px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: 'linear-gradient(135deg, #0AAEEF 0%, #0077b5 100%)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                              boxShadow: '0 4px 12px rgba(10, 174, 239, 0.3)'
                            }}>
                              📥
                            </div>
                            <Title level={3} style={{ margin: 0, fontSize: 22, fontWeight: 800, color: darkMode ? '#f8fafc' : '#0f172a' }}>
                              Download Your Free Copy
                            </Title>
                          </div>
                          <Text style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: 14 }}>
                            Fill in your details below to receive the complete eBook (PDF) directly to your email inbox.
                          </Text>
                        </div>

                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: darkMode ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                          border: darkMode ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #a7f3d0',
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          color: darkMode ? '#34d399' : '#065f46'
                        }}>
                          ⚡ Free Instant Delivery via Email
                        </div>
                      </div>

                      <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleLandingPageSubmit}
                        requiredMark={false}
                      >
                        <Row gutter={16}>
                          {effectiveCustomFields.map(field => {
                            const isFullWidth = field.type === 'textarea' || field.type === 'checkbox' || effectiveCustomFields.length <= 2;
                            return (
                              <Col xs={24} sm={isFullWidth ? 24 : 12} key={field.name}>
                                <Form.Item
                                  name={field.name}
                                  label={
                                    <span style={{ color: darkMode ? '#cbd5e1' : '#334155', fontWeight: 600, fontSize: 13 }}>
                                      {field.label || field.name} {field.required !== false && <span style={{ color: '#ef4444' }}>*</span>}
                                    </span>
                                  }
                                  rules={[{ required: field.required !== false, message: `${field.label || field.name} is required` }]}
                                  style={{ marginBottom: 16 }}
                                >
                                  {field.type === 'textarea' ? (
                                    <Input.TextArea
                                      rows={3}
                                      placeholder={field.placeholder || field.label}
                                      style={{
                                        borderRadius: 8,
                                        background: darkMode ? '#0f172a' : '#fff',
                                        borderColor: darkMode ? '#334155' : '#cbd5e1',
                                        color: darkMode ? '#f8fafc' : '#0f172a'
                                      }}
                                    />
                                  ) : field.type === 'select' ? (
                                    <Select
                                      placeholder={field.placeholder || field.label}
                                      size="large"
                                      style={{ width: '100%' }}
                                    >
                                      {(field.options || '').split(',').map(o => o.trim()).filter(Boolean).map(o => (
                                        <Select.Option key={o} value={o}>{o}</Select.Option>
                                      ))}
                                    </Select>
                                  ) : field.type === 'checkbox' ? (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
                                      <input
                                        type="checkbox"
                                        id={`ebook_${field.name}`}
                                        required={field.required !== false}
                                        style={{ marginTop: 4, width: 16, height: 16, cursor: 'pointer' }}
                                      />
                                      <label htmlFor={`ebook_${field.name}`} style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#64748b', cursor: 'pointer' }}>
                                        {field.consent_text || field.label}
                                      </label>
                                    </div>
                                  ) : (
                                    <Input
                                      type={field.type === 'email' ? 'email' : 'text'}
                                      placeholder={field.placeholder || field.label}
                                      size="large"
                                      style={{
                                        height: 46,
                                        borderRadius: 8,
                                        background: darkMode ? '#0f172a' : '#fff',
                                        borderColor: darkMode ? '#334155' : '#cbd5e1',
                                        color: darkMode ? '#f8fafc' : '#0f172a'
                                      }}
                                    />
                                  )}
                                </Form.Item>
                              </Col>
                            );
                          })}
                        </Row>

                        <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            style={{
                              width: '100%',
                              height: 50,
                              fontSize: 16,
                              fontWeight: 700,
                              background: 'linear-gradient(135deg, #0AAEEF 0%, #4a7cff 100%)',
                              border: 'none',
                              borderRadius: 10,
                              boxShadow: '0 4px 16px rgba(10, 174, 239, 0.35)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8
                            }}
                          >
                            📥 Send eBook (PDF) to My Email
                          </Button>
                        </Form.Item>
                      </Form>

                      <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: darkMode ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <SafetyCertificateOutlined style={{ color: '#10b981', fontSize: 14 }} />
                        <span>We respect your privacy. No spam — your email is only used to deliver this eBook.</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '36px 28px', textAlign: 'center' }}>
                      <div style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: darkMode ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 32,
                        margin: '0 auto 16px'
                      }}>
                        ✅
                      </div>
                      <Title level={3} style={{ color: darkMode ? '#f8fafc' : '#0f172a', margin: '0 0 8px', fontWeight: 800 }}>
                        Your eBook is on its way!
                      </Title>
                      <Text style={{
                        color: darkMode ? '#94a3b8' : '#475569',
                        fontSize: 15,
                        display: 'block',
                        maxWidth: 550,
                        margin: '0 auto 24px',
                        lineHeight: 1.6
                      }}>
                        {submittedData?.email || submittedData?.email_address ? (
                          <>We have sent the PDF download link to <strong>{submittedData.email || submittedData.email_address}</strong>. Please check your inbox (and spam/promotions folder).</>
                        ) : (
                          <>We have sent the PDF download link to your email address. Please check your inbox (and spam/promotions folder).</>
                        )}
                      </Text>

                      {(pdfFile || content?.pdf_file) && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <Button
                            type="primary"
                            size="large"
                            icon={<DownloadOutlined />}
                            onClick={handleDownloadPdf}
                            style={{
                              height: 48,
                              padding: '0 32px',
                              fontSize: 15,
                              fontWeight: 700,
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              border: 'none',
                              borderRadius: 10,
                              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                            }}
                          >
                            📄 Download eBook PDF Now
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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

              {/* Newsletter Subscription Widget at Top of Right Sidebar */}
              <ArticleNewsletterBanner darkMode={darkMode} contentTitle={content?.title} />

              {/* Event Registration & Source Link Widget */}
              {isEvent && (
                <Card
                  style={{
                    background: darkMode ? '#1e293b' : '#fff',
                    borderRadius: 16,
                    border: darkMode ? '2px solid #0284C7' : '2px solid #bae6fd',
                    boxShadow: darkMode ? '0 6px 20px rgba(0,0,0,0.3)' : '0 6px 20px rgba(2, 132, 199, 0.1)',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    padding: '16px 20px',
                    margin: '-1px -1px 0 -1px',
                    color: '#fff'
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9 }}>
                      Virtual Event
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, marginTop: 4 }}>
                      Event Registration & Access
                    </div>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <p style={{ fontSize: 13, color: darkMode ? '#94A3B8' : '#475569', marginBottom: 16, lineHeight: 1.5 }}>
                      Access the official event portal, view full session schedule, and secure your registration.
                    </p>

                    {eventRegUrl && (
                      <a
                        href={eventRegUrl}
                        target={isExternalReg ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', display: 'block', marginBottom: 10 }}
                      >
                        <Button
                          type="primary"
                          block
                          size="large"
                          icon={<LinkOutlined />}
                          style={{
                            height: 46,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                            border: 'none',
                            fontWeight: 800,
                            fontSize: 14,
                            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                          }}
                        >
                          {isExternalReg ? 'Register on Organizer Site ↗' : 'Register for Event (Free)'}
                        </Button>
                      </a>
                    )}

                    {eventSourceUrl && (
                      <a
                        href={eventSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}
                      >
                        <Button
                          block
                          icon={<GlobalOutlined />}
                          style={{
                            height: 40,
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 13,
                            borderColor: darkMode ? '#334155' : '#cbd5e1',
                            color: darkMode ? '#cbd5e1' : '#334155',
                            background: darkMode ? '#0f172a' : '#f8fafc'
                          }}
                        >
                          Official Event Source ↗
                        </Button>
                      </a>
                    )}

                    <div style={{ textAlign: 'center', marginTop: 10 }}>
                      <Link
                        to={`/events/${encodeURIComponent(content.slug)}`}
                        style={{ fontSize: 13, fontWeight: 600, color: '#0284C7' }}
                      >
                        View Interactive Event Hub →
                      </Link>
                    </div>
                  </div>
                </Card>
              )}

              {/* ── Get Access Card — only for webinar/whitepaper ── */}
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
                    {/* BEFORE SUBMIT */}
                    {!hasAccess && (
                      isEbook ? (
                        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                          <div style={{
                            width: 52,
                            height: 52,
                            borderRadius: '50%',
                            background: darkMode ? 'rgba(10, 174, 239, 0.15)' : '#e0f2fe',
                            color: '#0AAEEF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 26,
                            margin: '0 auto 16px'
                          }}>
                            📖
                          </div>
                          <Title level={4} style={{ color: darkMode ? '#f8fafc' : '#0f172a', marginBottom: 8, fontWeight: 700 }}>
                            Free eBook Available
                          </Title>
                          <Text style={{ color: darkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: 20, fontSize: 13, lineHeight: 1.6 }}>
                            Download the full publication in PDF format. Fill out the quick form below the overview to have it delivered straight to your email.
                          </Text>
                          <Button
                            type="primary"
                            block
                            onClick={() => {
                              const el = document.getElementById('ebook-download-section');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #0AAEEF 0%, #4a7cff 100%)',
                              color: '#fff',
                              fontWeight: 700,
                              borderRadius: 8,
                              height: 44,
                              fontSize: 14,
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(10, 174, 239, 0.3)'
                            }}
                          >
                            📥 Go to Download Form ↓
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Text style={{ color: darkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: 20, fontSize: 14, lineHeight: 1.6 }}>
                            Fill in your details below to unlock the full article and get instant access.
                          </Text>
                          <Form layout="vertical" onFinish={handleLandingPageSubmit} form={form}>
                            {effectiveCustomFields.map(field => (
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
                              >
                                {submitting ? 'Submitting...' : 'Get Access →'}
                              </Button>
                            </Form.Item>
                          </Form>
                        </>
                      )
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
                                <div style={{ fontWeight: 700, fontSize: 14, color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                                  {isEbook ? 'eBook Unlocked' : 'Read Full Article'}
                                </div>
                                <Text style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}>
                                  {isEbook ? 'PDF link sent to email & available below' : 'Full article is now unlocked above'}
                                </Text>
                              </div>
                            </div>
                            {(pdfFile || content?.pdf_file) && (
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
                  {relatedArticles.map(article => {
                    const targetRoute = resolveContentRoute(article);
                    return (
                      <a
                        key={article.id}
                        href={targetRoute.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: 'none',
                          color: 'inherit',
                          display: 'block',
                          background: darkMode ? '#1e293b' : '#fff',
                          borderRadius: 10,
                          border: darkMode ? '1px solid #334155' : '1px solid #e8ecf4',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          transition: 'box-shadow 0.2s ease, transform 0.2s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.boxShadow = darkMode ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.08)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {article.banner_image
                          ? <img src={`/uploads/${article.banner_image}`} alt={article.title} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                          : <div style={{ height: 100, background: 'linear-gradient(135deg,#e0e9ff,#f0f4ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📄</div>
                        }
                        <div style={{ padding: '10px 12px' }}>
                          <Tag color="blue" style={{ fontSize: 10, marginBottom: 6 }}>{article.category_name}</Tag>
                          <div style={{
                            fontWeight: 600, fontSize: 13, color: darkMode ? '#f1f5f9' : '#0f172a', lineHeight: 1.4, marginBottom: 4,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                          }}>
                            {article.title}
                          </div>
                          <div style={{
                            fontSize: 11.5, color: darkMode ? '#94a3b8' : '#6b7280', lineHeight: 1.4,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                          }}>
                            {article.short_description}
                          </div>
                          <div style={{ fontSize: 11, color: darkMode ? '#64748b' : '#9ca3af', marginTop: 6 }}>
                            <CalendarOutlined style={{ marginRight: 3 }} />
                            {formatContentPublishDate(article)}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

            </div>
          </Col>
        </Row>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll to top"
            style={{
              position: 'fixed',
              bottom: 90,
              right: 28,
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: darkMode
                ? 'linear-gradient(135deg, #F7941D 0%, #EA580C 100%)'
                : 'linear-gradient(135deg, #F7941D 0%, #FF6B00 100%)',
              color: '#FFFFFF',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              boxShadow: darkMode
                ? '0 6px 24px rgba(247, 148, 29, 0.45)'
                : '0 6px 24px rgba(247, 148, 29, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              zIndex: 1000,
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: showScrollTop ? 1 : 0,
              transform: showScrollTop ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.1)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(247, 148, 29, 0.65)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = darkMode
                ? '0 6px 24px rgba(247, 148, 29, 0.45)'
                : '0 6px 24px rgba(247, 148, 29, 0.5)';
            }}
            title="Scroll to top"
          >
            <ArrowUpOutlined style={{ fontSize: 18 }} />
          </button>
        )}

        {/* Content Share Modal */}
        <ContentShareModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          content={content}
          darkMode={darkMode}
        />

      </div>
    </>
  );
};

export default ArticleDetail;