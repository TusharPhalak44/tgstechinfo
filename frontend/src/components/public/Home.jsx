// Home.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Tag, Skeleton, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarOutlined, EyeOutlined, ArrowRightOutlined,
  SearchOutlined, CloseOutlined, FireOutlined,
  ReadOutlined, GlobalOutlined, TeamOutlined,
  FileTextOutlined, FolderOpenOutlined, LineChartOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '../../context/ThemeContext';
import { navigateContentItem } from '../../lib/contentRoute';

// Newsletter Subscribe Form Component
const NewsletterSubscribeForm = ({ darkMode = false }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      message.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/public/newsletter', { email });
      message.success('Successfully subscribed to newsletter!');
      setEmail('');
    } catch (error) {
      if (error.response?.status === 400) {
        message.error(error.response.data.message || 'Email already subscribed');
      } else {
        message.error('Failed to subscribe. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="newsletter-form" style={{
      display: 'flex',
      gap: 10,
      maxWidth: 440,
      margin: '0 auto',
      flexWrap: 'wrap',
      justifyContent: 'center'
    }}>
      <input
        type="email"
        placeholder="Enter your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        className="newsletter-input"
        style={{
          flex: 1,
          minWidth: 200,
          padding: '12px 18px',
          borderRadius: 10,
          border: 'none',
          fontSize: 14,
          outline: 'none',
          background: darkMode ? 'rgba(255,255,255,.95)' : 'var(--color-surface)',
          color: darkMode ? '#333' : 'var(--color-heading)'
        }}
      />
      <button
        type="submit"
        disabled={loading}
        className="newsletter-btn"
        style={{
          padding: '12px 24px',
          borderRadius: 10,
          border: 'none',
          background: darkMode ? '#F7941D' : 'var(--color-accent)',
          color: '#fff',
          fontWeight: 600,
          fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
          opacity: loading ? 0.7 : 1,
          boxShadow: darkMode ? '0 4px 16px rgba(247, 148, 29, 0.4)' : '0 4px 16px rgba(247, 148, 29, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={e => {
          if (!loading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = darkMode ? '0 6px 20px rgba(247, 148, 29, 0.5)' : '0 6px 20px rgba(247, 148, 29, 0.4)';
          }
        }}
        onMouseLeave={e => {
          if (!loading) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = darkMode ? '0 4px 16px rgba(247, 148, 29, 0.4)' : '0 4px 16px rgba(247, 148, 29, 0.3)';
          }
        }}
      >
        {loading ? 'Subscribing...' : 'Subscribe Free'}
      </button>
    </form>
  );
};

// ── Scroll-reveal hook ──────────────────────────────────────────
const useReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

// ── Lightbox ────────────────────────────────────────────────────
const Lightbox = ({ src, alt, onClose }) => (
  <div onClick={onClose} style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <button onClick={onClose} style={{
      position: 'absolute', top: 18, right: 22, background: 'none',
      border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer'
    }}><CloseOutlined /></button>
    <img src={src} alt={alt} onClick={e => e.stopPropagation()}
      style={{ maxWidth: '92vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 10 }} />
  </div>
);

// ── Animated count-up ────────────────────────────────────────────
const useCountUp = (target, visible, duration = 1400) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible || !target) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target]);
  return count;
};

// ── Single Stat Item ──────────────────────────────────────────
const StatCard = ({ s, i, visible, darkMode = false, isLast = false }) => {
  const num = useCountUp(Number(s.value) || 0, visible);
  return (
    <div
      className="stat-simple-card"
      style={{
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${i * 100}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 100}ms, background .25s ease`,
        borderRadius: 16,
        background: 'transparent'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.04)' : '#EAF2FF';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Icon Badge */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(10,174,239,0.08)',
        border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(10,174,239,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        color: s.color,
        marginBottom: 14,
        transition: 'transform 0.3s ease'
      }}>
        {s.icon}
      </div>

      {/* Number Counter */}
      <div style={{
        fontSize: 'clamp(32px, 3.2vw, 44px)',
        fontWeight: 900,
        color: darkMode ? '#F1F5F9' : '#0B1F4D',
        letterSpacing: '-1.5px',
        lineHeight: 1,
        marginBottom: 6,
        display: 'flex',
        alignItems: 'baseline',
        gap: 2
      }}>
        <span>{num.toLocaleString()}</span>
        {s.suffix && <span style={{ color: s.color, fontSize: '0.7em' }}>{s.suffix}</span>}
      </div>

      {/* Label */}
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: darkMode ? '#94A3B8' : '#475569',
        letterSpacing: '-0.2px'
      }}>
        {s.label}
      </div>

      {/* Divider line for desktop */}
      {!isLast && (
        <div className="stat-divider" style={{
          position: 'absolute',
          right: 0,
          top: '20%',
          height: '60%',
          width: 1,
          background: darkMode ? 'rgba(255,255,255,0.1)' : 'var(--color-border)'
        }} />
      )}
    </div>
  );
};

const StatsBar = ({ stats, darkMode = false }) => {
  const [ref, visible] = useReveal();

  const items = [
    { label: 'Articles Published', value: stats.totalPublished, icon: <FileTextOutlined />, color: '#0AAEEF', suffix: '+' },
    { label: 'Total Reads & Views', value: stats.totalViews, icon: <EyeOutlined />, color: '#F7941D', suffix: '+' },
    { label: 'Verified Contributors', value: stats.totalAuthors, icon: <TeamOutlined />, color: '#16A34A', suffix: '+' },
    { label: 'Tech Categories', value: stats.totalCategories, icon: <FolderOpenOutlined />, color: '#8B5CF6' },
  ];

  return (
    <div ref={ref} style={{ margin: '48px 0' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <span style={{
          fontSize: 11,
          fontWeight: 800,
          color: '#F7941D',
          textTransform: 'uppercase',
          letterSpacing: 2,
          background: 'rgba(247,148,29,0.1)',
          padding: '4px 12px',
          borderRadius: 16,
          display: 'inline-block',
          marginBottom: 10
        }}>
          By The Numbers
        </span>
        <h2 style={{
          fontSize: 'clamp(24px, 2.5vw, 36px)',
          fontWeight: 900,
          color: darkMode ? '#F1F5F9' : '#0B1F4D',
          margin: '0 0 8px',
          letterSpacing: '-0.5px'
        }}>
          Trusted by Tech Professionals
        </h2>
        <p style={{
          color: darkMode ? '#94A3B8' : '#64748B',
          fontSize: 'clamp(14px, 1vw, 15px)',
          margin: 0,
          fontWeight: 500
        }}>
          Insights into our growing developer community.
        </p>
      </div>

      {/* Modern Minimal Grid Container */}
      <div style={{
        background: darkMode ? '#0F172A' : '#FFFFFF',
        borderRadius: 24,
        border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
        boxShadow: darkMode ? '0 12px 32px rgba(0,0,0,0.4)' : '0 8px 30px rgba(11,31,77,0.06)',
        padding: '12px 16px',
        maxWidth: 1140,
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          alignItems: 'center'
        }} className="stats-simple-grid">
          {items.map((s, i) => (
            <StatCard key={i} s={s} i={i} visible={visible} darkMode={darkMode} isLast={i === items.length - 1} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .stats-simple-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px;
          }
          .stat-divider {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .stats-simple-grid {
            grid-template-columns: 1fr !important;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

// ── Helper: detect HTML builder content ──────────────────────────
const isHtmlBuilderContent = (item) => {
  try {
    const layout = item.builder_layout
      ? (typeof item.builder_layout === 'string' ? JSON.parse(item.builder_layout) : item.builder_layout)
      : null;
    if (Array.isArray(layout) && layout[0] === 'html') return true;
    return ['landing-page', 'landing page'].includes(
      (item.content_type || item.content_type_name || '').toLowerCase().trim()
    );
  } catch {
    return false;
  }
};

// ── Category chip nav ────────────────────────────────────────────
const CAT_TABS = [
  { label: 'AI & ML', key: 'artificial-intelligence', param: 'category', color: 'var(--color-primary)' },
  { label: 'Cybersecurity', key: 'cybersecurity', param: 'category', color: 'var(--color-primary)' },
  { label: 'Cloud', key: 'cloud-computing', param: 'category', color: 'var(--color-primary)' },
  { label: 'DevOps', key: 'devops', param: 'category', color: 'var(--color-primary)' },
  { label: 'Data Analytics', key: 'data-analytics', param: 'category', color: 'var(--color-primary)' },
  { label: 'FinTech', key: 'fintech', param: 'category', color: 'var(--color-primary)' },
  { label: 'Healthcare IT', key: 'healthcare', param: 'category', color: 'var(--color-primary)' },
  { label: 'Interviews', key: 'interview', param: 'content_type', color: 'var(--color-primary)' },
];

const CategoryNav = ({ activeTab, setActiveTab, dynamicCategories = [] }) => {
  // Only use dynamic categories (top viewed categories from API)
  const allTabs = dynamicCategories.map(cat => ({
    label: cat.name,
    key: cat.slug,
    param: 'category',
    color: 'var(--color-primary)',
    count: cat.content_count || 0
  }));

  return (
    <div className="category-nav" style={{ margin: '32px 0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ width: 4, height: 20, background: 'var(--color-primary)', borderRadius: 4, display: 'inline-block' }} />
        <span style={{ fontWeight: 700, fontSize: 'clamp(14px, 1.2vw, 16px)', color: 'var(--color-heading)' }}>Browse by Category</span>
      </div>
      <div className="category-tabs" style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'nowrap',
        overflowX: 'auto',
        overflowY: 'visible',
        paddingBottom: 8,
        paddingTop: 4,
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--color-primary) transparent',
        WebkitOverflowScrolling: 'touch'
      }}
        css={{
          '&::-webkit-scrollbar': {
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'var(--color-primary)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'var(--color-accent)',
          }
        }}>
        {allTabs.map(c => {
          const isActive = activeTab === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setActiveTab(c.key)}
              className="category-tab"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: 'clamp(8px, 0.8vw, 12px) clamp(16px, 1.5vw, 22px)',
                borderRadius: 8,
                fontSize: 'clamp(12px, 0.8vw, 13px)',
                fontWeight: 600,
                background: isActive ? c.color : 'var(--color-surface)',
                color: isActive ? '#fff' : 'var(--color-heading)',
                border: isActive ? `1.5px solid ${c.color}` : '1.5px solid var(--color-border)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? `0 4px 16px ${c.color}40` : '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'all .2s ease',
                transform: isActive ? 'translateY(-2px)' : 'translateY(0)'
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = c.color;
                  e.currentTarget.style.color = c.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${c.color}25`;
                  const countSpan = e.currentTarget.querySelector('span');
                  if (countSpan) {
                    countSpan.style.background = `${c.color}20`;
                    countSpan.style.color = c.color;
                  }
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.color = 'var(--color-heading)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
                  const countSpan = e.currentTarget.querySelector('span');
                  if (countSpan) {
                    countSpan.style.background = 'var(--color-primary-light)';
                    countSpan.style.color = 'var(--color-primary)';
                  }
                }
              }}
            >
              {c.label}
              {c.count > 0 && (
                <span style={{
                  fontSize: 'clamp(10px, 0.7vw, 11px)',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--color-primary-light)',
                  color: isActive ? '#fff' : 'var(--color-primary)',
                  transition: 'all .2s ease'
                }}>
                  {c.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Case Studies Section ─────────────────────────────────────────
const CaseStudiesSection = ({ navigate, darkMode = false }) => {
  const [ref, visible] = useReveal();
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setCsLoading] = useState(true);
  const [gateVisible, setGateVisible] = useState(false);
  const [selectedCs, setSelectedCs] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({ name: '', email: '', contact: '' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    axios.get('/api/public/case-studies?limit=2')
      .then(r => setCaseStudies(r.data?.data || []))
      .catch(() => setCaseStudies([]))
      .finally(() => setCsLoading(false));
  }, []);

  if (!loading && caseStudies.length === 0) return null;

  const openGate = (cs) => {
    try {
      if (localStorage.getItem(`cs_gated_${cs.slug}`) === 'true') {
        navigate(`/case-study/${cs.slug}`);
        return;
      }
    } catch (e) {
      console.error(e);
    }
    setSelectedCs(cs);
    setFormValues({ name: '', email: '', contact: '' });
    setFormErrors({});
    setGateVisible(true);
  };

  const validate = () => {
    const errs = {};
    if (!formValues.name.trim()) errs.name = 'Name is required';
    if (!formValues.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) errs.email = 'Invalid email';
    if (!formValues.contact.trim()) errs.contact = 'Contact is required';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    try {
      const res = await axios.post('/api/public/case-study-gate', {
        slug: selectedCs.slug,
        ...formValues,
      });
      try {
        localStorage.setItem(`cs_gated_${selectedCs.slug}`, 'true');
      } catch (e) {
        console.error(e);
      }
      setGateVisible(false);
      navigate(`/case-study/${selectedCs.slug}`);
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div ref={ref} className="case-studies-section" style={{
        margin: '56px 0',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: 'opacity .6s ease, transform .6s ease'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 4, height: 24, background: 'var(--color-primary)', borderRadius: 4, display: 'inline-block' }} />
            <span style={{ fontSize: 'clamp(18px, 1.5vw, 20px)', color: 'var(--color-primary)', lineHeight: 1 }}></span>
            <span style={{ fontWeight: 800, fontSize: 'clamp(18px, 1.5vw, 20px)', color: darkMode ? '#f1f5f9' : 'var(--color-heading)' }}>Case Studies</span>
          </div>
          <a href="/case-studies" style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '5px 16px', borderRadius: 20, border: darkMode ? '1px solid #334155' : '1px solid var(--color-border)', background: darkMode ? '#1e293b' : 'var(--color-primary-light)' }}>
            View All <ArrowRightOutlined style={{ fontSize: 11 }} />
          </a>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="case-studies-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {[1, 2].map(i => (
              <div key={i} style={{ height: 260, background: darkMode ? '#1e293b' : 'var(--color-surface)', borderRadius: 16, border: darkMode ? '1px solid #334155' : '1px solid var(--color-border)', padding: 28 }}>
                <div style={{ height: 20, background: '#f0f0f0', borderRadius: 6, marginBottom: 14, width: '60%' }} />
                <div style={{ height: 14, background: '#f0f0f0', borderRadius: 4, marginBottom: 8, width: '90%' }} />
                <div style={{ height: 14, background: '#f0f0f0', borderRadius: 4, width: '75%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="case-studies-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24
          }}>
            {caseStudies.map((cs, idx) => (
              <div
                key={cs.id}
                onClick={() => openGate(cs)}
                className="case-study-card"
                style={{
                  background: darkMode ? '#1e293b' : 'var(--color-surface)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: darkMode ? '1.5px solid #334155' : '1.5px solid var(--color-border)',
                  boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all .3s cubic-bezier(0.4,0,0.2,1)',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(28px)',
                  transitionDelay: `${idx * 120}ms`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.015)';
                  e.currentTarget.style.boxShadow = darkMode ? '0 24px 48px rgba(0,0,0,0.4)' : '0 24px 48px rgba(11,31,77,0.10)';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = darkMode ? '#334155' : 'var(--color-border)';
                }}
              >
                {/* Banner */}
                <div style={{ position: 'relative', overflow: 'hidden', height: 'clamp(140px, 15vw, 180px)', background: 'linear-gradient(135deg, #0b2a5e 0%, #0AAEEF 100%)' }}>
                  {cs.banner_image ? (
                    <img src={`/uploads/${cs.banner_image}`} alt={cs.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 48, opacity: 0.4 }}>📋</span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: 'clamp(16px, 1.5vw, 22px) clamp(16px, 1.5vw, 24px) clamp(18px, 1.5vw, 24px)', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <h3 style={{ fontWeight: 800, fontSize: 'clamp(15px, 1.2vw, 18px)', lineHeight: 1.4, color: darkMode ? '#f1f5f9' : 'var(--color-heading)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {cs.case_study_headline || cs.title}
                  </h3>
                  <p style={{ fontSize: 'clamp(13px, 0.9vw, 14px)', color: darkMode ? '#94a3b8' : 'var(--color-muted)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {cs.case_study_summary || cs.short_description}
                  </p>
                  <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: darkMode ? '1px solid #334155' : '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: 12, color: darkMode ? '#94a3b8' : 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CalendarOutlined style={{ fontSize: 11 }} />
                      {moment(cs.scheduled_publish_date || cs.published_date || cs.created_at).format('MMM D, YYYY')}
                    </span>
                    <button className="download-btn" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 18px',
                      background: 'var(--color-primary)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 'clamp(12px, 0.8vw, 13px)',
                      border: 'none',
                      borderRadius: 20,
                      cursor: 'pointer',
                      transition: 'opacity .2s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      View <ArrowRightOutlined style={{ fontSize: 11 }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gate Modal - Rendered outside section to avoid transform issues */}
      {gateVisible && selectedCs && (
        <div
          onClick={() => setGateVisible(false)}
          className="gate-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="gate-modal"
            style={{
              background: darkMode ? '#1e293b' : '#fff',
              borderRadius: 20,
              width: '100%',
              maxWidth: 460,
              padding: 'clamp(24px, 3vw, 36px)',
              position: 'relative',
              boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <button onClick={() => setGateVisible(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: darkMode ? '#94a3b8' : '#8c8c8c', lineHeight: 1 }}>✕</button>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, background: 'var(--color-primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26 }}>📋</div>
              <h3 style={{ fontWeight: 800, fontSize: 'clamp(18px, 1.5vw, 20px)', color: darkMode ? '#f1f5f9' : 'var(--color-heading)', margin: '0 0 6px' }}>Download Case Study</h3>
              <p style={{ fontSize: 'clamp(13px, 0.9vw, 14px)', color: darkMode ? '#94a3b8' : 'var(--color-muted)', margin: 0, lineHeight: 1.5 }}>
                {selectedCs.case_study_headline || selectedCs.title}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: darkMode ? '#f1f5f9' : 'var(--color-heading)', display: 'block', marginBottom: 5 }}>Full Name *</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={formValues.name}
                  onChange={e => { setFormValues(p => ({ ...p, name: e.target.value })); setFormErrors(p => ({ ...p, name: '' })); }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${formErrors.name ? '#ff4d4f' : darkMode ? '#475569' : '#d9d9d9'}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#f1f5f9' : '#000' }}
                />
                {formErrors.name && <span style={{ fontSize: 11, color: '#ff4d4f', marginTop: 3, display: 'block' }}>{formErrors.name}</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: darkMode ? '#f1f5f9' : 'var(--color-heading)', display: 'block', marginBottom: 5 }}>Work Email *</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={formValues.email}
                  onChange={e => { setFormValues(p => ({ ...p, email: e.target.value })); setFormErrors(p => ({ ...p, email: '' })); }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${formErrors.email ? '#ff4d4f' : darkMode ? '#475569' : '#d9d9d9'}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#f1f5f9' : '#000' }}
                />
                {formErrors.email && <span style={{ fontSize: 11, color: '#ff4d4f', marginTop: 3, display: 'block' }}>{formErrors.email}</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: darkMode ? '#f1f5f9' : 'var(--color-heading)', display: 'block', marginBottom: 5 }}>Phone / Contact *</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formValues.contact}
                  onChange={e => { setFormValues(p => ({ ...p, contact: e.target.value })); setFormErrors(p => ({ ...p, contact: '' })); }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${formErrors.contact ? '#ff4d4f' : darkMode ? '#475569' : '#d9d9d9'}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#f1f5f9' : '#000' }}
                />
                {formErrors.contact && <span style={{ fontSize: 11, color: '#ff4d4f', marginTop: 3, display: 'block' }}>{formErrors.contact}</span>}
              </div>

              {formErrors.submit && (
                <div style={{ padding: '10px 14px', background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 8, fontSize: 13, color: '#cf1322' }}>{formErrors.submit}</div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ width: '100%', padding: '12px', background: submitting ? '#bfbfbf' : 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 10, cursor: submitting ? 'not-allowed' : 'pointer', marginTop: 4, transition: 'opacity .2s' }}
              >
                {submitting ? 'Submitting…' : 'Get Free Access →'}
              </button>

              <p style={{ textAlign: 'center', fontSize: 11, color: darkMode ? '#94a3b8' : 'var(--color-muted)', margin: 0 }}>
                By submitting, you agree to our Privacy Policy. No spam, ever.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── Why Publish With Us ─────────────────────────────────────────
const WHY_ITEMS = [
  { title: 'Targeted B2B Audience', desc: 'Reach 200,000+ verified IT decision-makers, CXOs, and tech buyers across industries.' },
  { title: 'Measurable ROI', desc: 'Real-time analytics dashboard: track impressions, leads, downloads and engagement.' },
  { title: 'Thought Leadership', desc: 'Position your brand as an industry authority with expert-curated editorial placement.' },
  { title: 'Multi-Channel Distribution', desc: 'Your content amplified via newsletter, social, SEO and partner syndication networks.' },
  { title: 'Fast-Track Publishing', desc: 'Dedicated editorial team ensures your content goes live within 48 hours of approval.' },
  { title: 'Dedicated Account Manager', desc: 'White-glove support from strategy to execution, with a single point of contact for your team.' },
];

const WhyPublishSection = ({ darkMode = false }) => {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className="why-publish-section" style={{
      margin: '56px 0',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: 'opacity .6s ease, transform .6s ease'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 2 }}>Why Choose Us</span>
        <h2 style={{ fontSize: 'clamp(22px, 2.5vw, 28px)', fontWeight: 900, color: darkMode ? '#f1f5f9' : 'var(--color-heading)', margin: '8px 0 12px', lineHeight: 1.2 }}>The Smartest Way to Publish in B2B Tech</h2>
        <p style={{ color: darkMode ? '#94a3b8' : 'var(--color-muted)', fontSize: 'clamp(14px, 1vw, 15px)', maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>From whitepapers to webinars, we give your content the reach, credibility and conversions it deserves.</p>
      </div>
      <div className="why-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20
      }}>
        {WHY_ITEMS.map((item, i) => (
          <div key={i} className="why-item" style={{
            background: darkMode ? '#1e293b' : 'var(--color-surface)',
            borderRadius: 16,
            padding: 'clamp(20px, 2vw, 28px) clamp(18px, 1.5vw, 24px)',
            border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
            boxShadow: darkMode ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(74,124,255,0.06)',
            transition: 'transform .22s, box-shadow .22s',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: `${i * 80}ms`
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = darkMode ? '0 12px 32px rgba(0,0,0,0.4)' : '0 12px 32px rgba(74,124,255,0.14)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = darkMode ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(74,124,255,0.06)'; }}
          >
            <div style={{ fontWeight: 700, fontSize: 'clamp(15px, 1.1vw, 16px)', color: darkMode ? '#f1f5f9' : 'var(--color-heading)', marginBottom: 8 }}>{item.title}</div>
            <div style={{ fontSize: 'clamp(13px, 0.9vw, 13.5px)', color: darkMode ? '#94a3b8' : 'var(--color-muted)', lineHeight: 1.65 }}>{item.desc}</div>
            <div style={{ marginTop: 18, height: 3, borderRadius: 2, background: 'var(--color-primary)', width: '40%' }} />
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 36 }}>
        <Link to="/register" className="publish-cta" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--color-accent)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 'clamp(14px, 1vw, 15px)',
          padding: 'clamp(11px, 1vw, 13px) clamp(24px, 2.5vw, 32px)',
          borderRadius: 12,
          textDecoration: 'none',
          boxShadow: '0 6px 20px rgba(74,124,255,0.35)',
          transition: 'transform .2s, box-shadow .2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(74,124,255,0.45)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(74,124,255,0.35)'; }}
        >
          Start Publishing Today <ArrowRightOutlined style={{ fontSize: 13 }} />
        </Link>
      </div>
    </div>
  );
};

// ── Publishing Solutions ─────────────────────────────────────────
const SOLUTIONS = [
  { accent: 'var(--color-primary)', bg: 'var(--color-primary-light)', label: 'Articles & Blogs', desc: 'Long-form thought leadership, how-tos and opinion pieces that rank on Google and drive organic traffic.', tags: ['SEO Optimised', 'Editorial Review', 'Author Profile'] },
  { accent: 'var(--color-success)', bg: 'var(--color-primary-light)', label: 'Whitepapers & Reports', desc: 'Gated research assets that generate qualified leads. We handle design, hosting and lead capture forms.', tags: ['Lead Gen', 'Branded Design', 'CRM Integration'] },
  { accent: 'var(--color-accent)', bg: 'var(--color-primary-light)', label: 'Webinars & Events', desc: 'Live and on-demand virtual events promoted to our engaged audience of IT professionals.', tags: ['Registration Page', 'Email Promotion', 'Recording Hosting'] },
  { accent: 'var(--color-primary)', bg: 'var(--color-primary-light)', label: 'Sponsored News', desc: 'Get your product launches, partnerships and announcements in front of the right audience instantly.', tags: ['Instant Publish', 'Homepage Feature', 'Newsletter Blast'] },
];

const PublishingSolutions = ({ darkMode = false }) => {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className="solutions-section" style={{
      margin: '56px 0',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: 'opacity .6s ease, transform .6s ease'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6c5ce7', textTransform: 'uppercase', letterSpacing: 2 }}>Publishing Solutions</span>
        <h2 style={{ fontSize: 'clamp(22px, 2.2vw, 26px)', fontWeight: 900, color: darkMode ? '#f1f5f9' : 'var(--color-heading)', margin: '8px 0 10px' }}>Content Formats Built for B2B Impact</h2>
        <p style={{ color: darkMode ? '#94a3b8' : 'var(--color-muted)', fontSize: 'clamp(14px, 1vw, 14.5px)', maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>Choose the format that fits your marketing goals. We handle the rest.</p>
      </div>
      <div className="solutions-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 18
      }}>
        {SOLUTIONS.map((s, i) => (
          <div key={i} className="solution-card" style={{
            background: darkMode ? '#1e293b' : 'var(--color-surface)',
            borderRadius: 18,
            overflow: 'hidden',
            border: `1px solid ${s.accent}22`,
            boxShadow: darkMode ? `0 4px 18px ${s.accent}15` : `0 4px 18px ${s.accent}0d`,
            transition: 'transform .22s, box-shadow .22s',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transitionDelay: `${i * 90}ms`
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = darkMode ? `0 16px 36px ${s.accent}33` : `0 16px 36px ${s.accent}22`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = darkMode ? `0 4px 18px ${s.accent}15` : `0 4px 18px ${s.accent}0d`; }}
          >
            <div style={{ height: 5, background: s.accent }} />
            <div style={{ padding: 'clamp(18px, 1.8vw, 24px) clamp(16px, 1.5vw, 22px) clamp(20px, 1.8vw, 26px)' }}>
              <div style={{ fontWeight: 800, fontSize: 'clamp(15px, 1.2vw, 16px)', color: darkMode ? '#f1f5f9' : 'var(--color-heading)', marginBottom: 10 }}>{s.label}</div>
              <div style={{ fontSize: 'clamp(13px, 0.85vw, 13.5px)', color: darkMode ? '#94a3b8' : 'var(--color-muted)', lineHeight: 1.65, marginBottom: 18 }}>{s.desc}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {s.tags.map(t => (
                  <span key={t} style={{ fontSize: 11, fontWeight: 600, color: s.accent, background: s.bg, borderRadius: 20, padding: '3px 10px', border: `1px solid ${s.accent}33` }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Newsletter box ───────────────────────────────────────────────
const NewsletterBox = () => {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className="newsletter-box" style={{
      background: 'var(--color-primary)',
      borderRadius: 20,
      padding: 'clamp(32px, 4vw, 48px) clamp(20px, 3vw, 40px)',
      textAlign: 'center',
      margin: '48px 0',
      opacity: visible ? 1 : 0,
      transform: visible ? 'scale(1)' : 'scale(.97)',
      transition: 'opacity .6s ease, transform .6s ease'
    }}>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Stay Ahead of the Curve</div>
      <h2 style={{ color: '#fff', fontSize: 'clamp(22px, 2.5vw, 28px)', fontWeight: 800, margin: '0 0 10px' }}>Get the Latest Tech Insights</h2>
      <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 'clamp(14px, 1vw, 15px)', margin: '0 0 28px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
        Join 50,000+ tech professionals. Weekly digest of AI, cloud, cybersecurity & more.
      </p>
      <NewsletterSubscribeForm darkMode={true} />
    </div>
  );
};

// ── Hero slides ──────────────────────────────────────────────────
const HERO_SLIDES = [
  { img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80', tag: 'Artificial Intelligence', title: 'How AI is Reshaping the Future of Enterprise Technology' },
  { img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80', tag: 'Cybersecurity', title: 'Zero Trust Architecture: The New Standard for Enterprise Security' },
  { img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', tag: 'Cloud Computing', title: 'Multi-Cloud Strategies Driving Digital Transformation in 2026' },
  { img: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80', tag: 'Data Analytics', title: 'Real-Time Data Processing: The Shift Every Business Must Make' },
];

// ── Hero quotes with shimmer words ─────────────────────────────────
const HERO_QUOTES = [
  {
    text: 'Your Gateway to',
    shimmerWord: 'Tech Insights',
    afterText: ' & Innovation',
    fullText: 'Your Gateway to Tech Insights & Innovation'
  },
  {
    text: 'Where',
    shimmerWord: 'Technology',
    afterText: ' Meets Business Growth',
    fullText: 'Where Technology Meets Business Growth'
  },
  {
    text: 'The',
    shimmerWord: 'Knowledge Hub',
    afterText: ' for Modern Businesses',
    fullText: 'The Knowledge Hub for Modern Businesses'
  },
  {
    text: 'Turning Industry Knowledge into',
    shimmerWord: 'Business Value',
    afterText: '',
    fullText: 'Turning Industry Knowledge into Business Value'
  },
];

// ── Hero Section (ONLY HEIGHT REDUCED - CONTENT UNCHANGED) ──
const HeroSection = () => {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setActive(prev => (prev + 1) % HERO_SLIDES.length), 4200);
  };
  useEffect(() => { startTimer(); return () => clearInterval(timerRef.current); }, []);
  const goTo = i => { setActive(i); startTimer(); };

  return (
    <div className="hero-section" style={{
      background: 'linear-gradient(135deg, #0B1F4D 0%, #0A1229 60%, #070D1E 100%)',
      position: 'relative',
      overflow: 'hidden',
      padding: '40px 0 48px'
    }}>
      {/* Animated Floating Ambient Background Mesh Blobs */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: 500,
        height: 500,
        background: 'radial-gradient(circle, rgba(247,148,29,0.18) 0%, rgba(247,148,29,0) 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        animation: 'heroBlobFloat 12s infinite alternate ease-in-out'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '-20%',
        right: '-10%',
        width: 550,
        height: 550,
        background: 'radial-gradient(circle, rgba(10,174,239,0.2) 0%, rgba(10,174,239,0) 70%)',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        animation: 'heroBlobFloat 15s infinite alternate-reverse ease-in-out'
      }} />

      {/* Modern Tech Grid Pattern Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.05,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
        pointerEvents: 'none'
      }} />

      <div className="hero-grid" style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'clamp(32px, 4vw, 56px)',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2
      }}>
        {/* LEFT COLUMN - Messaging & CTAs */}
        <div className="hero-left" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          textAlign: 'left'
        }}>
          {/* Top Status Pill Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 30,
            padding: '7px 18px',
            marginBottom: 20,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#5BBD2B',
              display: 'inline-block',
              boxShadow: '0 0 10px #5BBD2B',
              animation: 'pulseDot 2s infinite'
            }} />
            <span style={{
              fontSize: 12,
              color: '#FFFFFF',
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: 'uppercase'
            }}>
              Live B2B Intelligence
            </span>
          </div>

          {/* Main Dynamic Headline */}
          <h1 style={{
            color: '#FFFFFF',
            fontWeight: 900,
            lineHeight: 1.15,
            fontSize: 'clamp(30px, 3.8vw, 52px)',
            margin: '0 0 20px',
            letterSpacing: '-1px',
            position: 'relative',
            minHeight: 'clamp(70px, 8vw, 110px)'
          }}>
            {HERO_QUOTES.map((quote, i) => (
              <div key={i} style={{
                position: active === i ? 'relative' : 'absolute',
                left: 0,
                top: 0,
                opacity: active === i ? 1 : 0,
                transform: active === i ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                width: '100%',
                pointerEvents: active === i ? 'auto' : 'none'
              }}>
                {quote.text}<br />
                <span className="orange-shimmer-text" style={{
                  background: 'linear-gradient(120deg, #F7941D 20%, #FFE0B2 50%, #0AAEEF 80%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'shimmerGrad 4s linear infinite'
                }}>{quote.shimmerWord}</span>
                {quote.afterText && <>{quote.afterText}</>}
              </div>
            ))}
          </h1>

          {/* Subtitle */}
          <p style={{
            color: 'rgba(241, 245, 249, 0.82)',
            fontSize: 'clamp(15px, 1.1vw, 17.5px)',
            lineHeight: 1.7,
            margin: '0 0 28px',
            maxWidth: 540,
            fontWeight: 400
          }}>
            In-depth articles, expert CXO interviews, and whitepapers across AI, Cybersecurity, Cloud Computing, and DevOps — driving enterprise growth.
          </p>

          {/* Dual Action CTA Buttons */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
            {/* Primary CTA: Explore Insights */}
            <button
              onClick={() => navigate('/articles')}
              style={{
                padding: '12px 28px',
                borderRadius: 24,
                border: 'none',
                background: 'linear-gradient(135deg, #F7941D 0%, #E67E00 100%)',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 6px 24px rgba(247, 148, 29, 0.45)',
                transition: 'all .25s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(247, 148, 29, 0.6)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(247, 148, 29, 0.45)';
              }}
            >
              Explore Insights <ArrowRightOutlined style={{ fontSize: 13 }} />
            </button>

            {/* Secondary CTA: Publish Content */}
            <button
              onClick={() => navigate('/register')}
              style={{
                padding: '12px 26px',
                borderRadius: 24,
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all .25s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#0AAEEF';
                e.currentTarget.style.background = 'rgba(10, 174, 239, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Publish Content
            </button>
          </div>

          {/* Topic Pills Row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Top Topics:</span>
            {[
              { label: 'AI & ML', slug: 'artificial-intelligence' },
              { label: 'Cybersecurity', slug: 'cybersecurity' },
              { label: 'Cloud', slug: 'cloud-computing' },
              { label: 'DevOps', slug: 'devops' }
            ].map(t => (
              <span
                key={t.label}
                onClick={() => navigate(`/category/${t.slug}`)}
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.85)',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 16,
                  padding: '4px 14px',
                  cursor: 'pointer',
                  transition: 'all .2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(10, 174, 239, 0.2)';
                  e.currentTarget.style.borderColor = '#0AAEEF';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN - 3D Glassmorphic Featured Slide Showcase */}
        <div className="hero-right" style={{ position: 'relative' }}>
          <div style={{
            position: 'relative',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.15)',
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(20px)'
          }}>
            {HERO_SLIDES.map((slide, i) => (
              <div key={i} style={{
                position: i === 0 ? 'relative' : 'absolute',
                inset: 0,
                opacity: active === i ? 1 : 0,
                transform: active === i ? 'scale(1)' : 'scale(1.04)',
                transition: 'opacity 1.2s ease, transform 1.2s ease',
                pointerEvents: active === i ? 'auto' : 'none'
              }}>
                <img src={slide.img} alt={slide.tag} style={{
                  width: '100%',
                  height: 'clamp(240px, 24vw, 340px)',
                  objectFit: 'cover',
                  display: 'block'
                }} />

                {/* Overlay Vignette Gradient */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(11,31,77,0.95) 0%, rgba(11,31,77,0.3) 60%, transparent 100%)'
                }} />

                {/* Article Info Content */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '24px 28px',
                  background: 'linear-gradient(to top, rgba(11,31,77,0.98), transparent)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#F7941D',
                      textTransform: 'uppercase',
                      letterSpacing: 1.2,
                      background: 'rgba(247, 148, 29, 0.15)',
                      border: '1px solid rgba(247, 148, 29, 0.3)',
                      borderRadius: 14,
                      padding: '3px 12px'
                    }}>
                      {slide.tag}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                      ⚡ 5 min read
                    </span>
                  </div>

                  <div style={{
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: 'clamp(16px, 1.4vw, 22px)',
                    lineHeight: 1.35,
                    letterSpacing: '-0.3px'
                  }}>
                    {slide.title}
                  </div>
                </div>
              </div>
            ))}

            {/* Slide Pagination Dots */}
            <div style={{ position: 'absolute', bottom: 18, right: 20, display: 'flex', gap: 8, zIndex: 10 }}>
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  style={{
                    width: active === i ? 26 : 8,
                    height: 8,
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    background: active === i ? '#F7941D' : 'rgba(255,255,255,0.4)',
                    transition: 'all .3s ease',
                    padding: 0
                  }}
                />
              ))}
            </div>

            {/* Slide Progress Line */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.15)' }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #F7941D, #0AAEEF)',
                animation: 'heroProgress 4.2s linear infinite',
                boxShadow: '0 0 12px rgba(247,148,29,0.5)'
              }} />
            </div>
          </div>

          {/* Slide counter indicator */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10, gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', background: 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: 8 }}>
              {String(active + 1).padStart(2, '0')}
            </span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              / {String(HERO_SLIDES.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroProgress { 0% { width: 0%; } 100% { width: 100%; } }
        @keyframes heroBlobFloat {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, -20px) scale(1.08); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes shimmerGrad {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .orange-shimmer-text {
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shimmerGrad 4s linear infinite;
          display: inline-block;
        }

        /* Desktop & Large Screens */
        @media (min-width: 1025px) {
          .hero-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 44px !important;
            min-height: 220px !important;
          }
          .hero-left {
            order: 0 !important;
          }
          .hero-right {
            order: 1 !important;
          }
          .hero-section {
            min-height: 220px !important;
          }
          .hero-right img {
            height: 280px !important;
          }
          .hero-left h1 {
            font-size: 52px !important;
          }
          .hero-left p {
            font-size: 18px !important;
            max-width: 520px !important;
          }
          .hero-left .hero-tag {
            font-size: 14px !important;
            padding: 6px 18px !important;
          }
          .hero-left .hero-badge {
            font-size: 13px !important;
            padding: 6px 18px !important;
          }
        }

        /* Tablet/Laptop */
        @media (min-width: 769px) and (max-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 32px !important;
            min-height: 200px !important;
          }
          .hero-left {
            order: 0 !important;
          }
          .hero-right {
            order: 1 !important;
          }
          .hero-section {
            min-height: 200px !important;
          }
          .hero-right img {
            height: 240px !important;
          }
          .hero-left h1 {
            font-size: 38px !important;
          }
          .hero-left p {
            font-size: 16px !important;
            max-width: 480px !important;
          }
          .hero-left .hero-tag {
            font-size: 13px !important;
            padding: 5px 16px !important;
          }
        }

        /* Mobile Styles - Left on top, Right below with LARGER images */
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            min-height: auto !important;
            padding: 16px 16px !important;
          }
          
          .hero-left {
            order: 0 !important;
            padding: 4px 0 2px 0 !important;
          }
          
          .hero-right {
            order: 1 !important;
            padding: 2px 0 4px 0 !important;
          }
          
          .hero-section {
            min-height: auto !important;
          }
          
          .hero-tag-pills {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 6px !important;
          }

          .hero-left h1 {
            font-size: clamp(24px, 5vw, 30px) !important;
          }
          
          .hero-left p {
            font-size: clamp(13px, 2.8vw, 14px) !important;
            max-width: 100% !important;
          }

          .hero-left .hero-tag {
            font-size: 10px !important;
            padding: 3px 10px !important;
          }

          .hero-left .hero-badge {
            font-size: 10px !important;
            padding: 3px 10px !important;
          }

          /* LARGER IMAGES ON MOBILE */
          .hero-right img {
            height: clamp(220px, 50vw, 320px) !important;
          }

          .hero-right .hero-slide-title {
            font-size: clamp(14px, 3vw, 17px) !important;
          }
          
          .hero-right .hero-slide-tag {
            font-size: 10px !important;
            padding: 3px 10px !important;
          }
        }

        /* Small Mobile */
        @media (max-width: 480px) {
          .hero-grid {
            padding: 12px 12px !important;
            gap: 12px !important;
          }
          
          .hero-left h1 {
            font-size: clamp(20px, 4.5vw, 24px) !important;
          }
          
          .hero-left p {
            font-size: clamp(12px, 2.5vw, 13px) !important;
            line-height: 1.5 !important;
          }
          
          .hero-left .hero-tag {
            font-size: 9px !important;
            padding: 2px 8px !important;
          }
          
          .hero-left .hero-badge {
            font-size: 9px !important;
            padding: 3px 10px !important;
          }

          /* EVEN LARGER IMAGES ON SMALL MOBILE */
          .hero-right img {
            height: clamp(200px, 55vw, 280px) !important;
          }

          .hero-right .hero-slide-title {
            font-size: clamp(13px, 3.5vw, 15px) !important;
          }

          .hero-right .hero-slide-tag {
            font-size: 9px !important;
            padding: 2px 8px !important;
          }
        }

        /* Extra Small Mobile */
        @media (max-width: 380px) {
          .hero-grid {
            padding: 10px 8px !important;
          }
          
          .hero-left h1 {
            font-size: 18px !important;
          }
          
          .hero-left p {
            font-size: 11px !important;
          }
          
          .hero-right img {
            height: clamp(180px, 50vw, 240px) !important;
          }
        }
      `}</style>
    </div>
  );
};

// ── Ticker strip ─────────────────────────────────────────────────
const TickerStrip = ({ items }) => {
  const doubled = [...items, ...items];
  return (
    <div className="ticker-strip" style={{ background: 'var(--color-primary)', overflow: 'hidden', padding: '9px 0' }}>
      <div style={{ display: 'flex', animation: 'ticker 28s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ fontSize: 'clamp(12px, 0.9vw, 13px)', color: '#fff', fontWeight: 500, padding: '0 clamp(16px, 2vw, 32px)', opacity: .92 }}>
            <FireOutlined style={{ marginRight: 6, color: 'var(--color-accent)' }} />{item.title}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
};

// ── Section wrapper with reveal ──────────────────────────────────
const RevealSection = ({ children, delay = 0 }) => {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity .55s ease ${delay}ms, transform .55s ease ${delay}ms`
    }}>
      {children}
    </div>
  );
};

// ── Section header ───────────────────────────────────────────────
const SectionHead = ({ icon, label, viewAllTo, accent = 'var(--color-primary)' }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
    flexWrap: 'wrap',
    gap: 12
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 4, height: 22, background: accent, borderRadius: 4, display: 'inline-block' }} />
      <span style={{ fontSize: 'clamp(16px, 1.3vw, 18px)', color: accent, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: 'clamp(16px, 1.3vw, 18px)', color: 'var(--color-heading)' }}>{label}</span>
    </div>
    <Link to={viewAllTo} style={{
      fontSize: 'clamp(12px, 0.9vw, 13px)',
      color: accent,
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      textDecoration: 'none',
      padding: '5px 14px',
      borderRadius: 20,
      border: '1px solid var(--color-border)',
      background: 'var(--color-primary-light)',
      transition: 'background .2s'
    }}>
      View All <ArrowRightOutlined style={{ fontSize: 11 }} />
    </Link>
  </div>
);

// ── Helper function to determine route based on content type ─────────
const getArticleRoute = (article) => {
  try {
    const layout = typeof article.builder_layout === 'string' ? JSON.parse(article.builder_layout) : article.builder_layout;
    const isHtmlBuilder = Array.isArray(layout) && layout[0] === 'html';
    const isLandingPageType = ['landing-page', 'landing page'].includes(
      (article.content_type || article.content_type_name || '').toLowerCase().trim()
    );
    const isStandalone = isHtmlBuilder || isLandingPageType;
    return { url: isStandalone ? `/content/${article.slug}` : `/article/${article.slug}`, newTab: isStandalone };
  } catch {
    return { url: `/article/${article.slug}`, newTab: false };
  }
};

// ── Helper to navigate or open new tab ──────────────────────────
const navigateArticle = (article, navigate) => {
  const { url, newTab } = getArticleRoute(article);
  if (newTab) {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    navigate(url);
  }
};

// ── Magazine HeroCard ────────────────────────────────────────────
const HeroCard = ({ article, navigate, onImgClick, accent = 'var(--color-primary)' }) => (
  <div onClick={() => navigateArticle(article, navigate)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 14, overflow: 'hidden', background: 'var(--color-surface)', boxShadow: '0 2px 16px rgba(0,0,0,0.10)', border: '1px solid var(--color-border)', transition: 'transform .22s, box-shadow .22s' }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.15)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.10)'; }}
  >
    <div style={{ position: 'relative', lineHeight: 0, overflow: 'hidden' }}
      onClick={e => { e.stopPropagation(); if (article.banner_image) onImgClick(`/uploads/${article.banner_image}`, article.title); }}>
      {article.banner_image
        ? <img src={`/uploads/${article.banner_image}`} alt={article.title} style={{ width: '100%', height: 'auto', display: 'block', transition: 'transform .4s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
        : <div style={{ height: 'clamp(140px, 15vw, 180px)', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ReadOutlined style={{ fontSize: 32, color: 'var(--color-primary)' }} /></div>
      }
      {article.content_type_name && <span style={{ position: 'absolute', top: 10, left: 10, background: accent, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: .6, textTransform: 'uppercase' }}>{article.content_type_name}</span>}
    </div>
    <div style={{ padding: 'clamp(14px, 1.2vw, 16px) clamp(14px, 1.2vw, 18px) clamp(14px, 1.2vw, 18px)', flex: 1, display: 'flex', flexDirection: 'column' }}>
      {article.category_name && <span style={{ fontSize: 'clamp(10px, 0.7vw, 11px)', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8, display: 'block' }}>{article.category_name}</span>}
      <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 1vw, 15px)', lineHeight: 1.45, color: 'var(--color-heading)', marginBottom: 8, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</div>
      <div style={{ fontSize: 'clamp(12px, 0.8vw, 12.5px)', color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.short_description}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--color-border)', fontSize: 'clamp(11px, 0.7vw, 11.5px)', color: 'var(--color-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><EyeOutlined />{article.view_count || 0}</span>
      </div>
    </div>
  </div>
);

// ── Compact list card ────────────────────────────────────────────
const ListCard = ({ article, navigate, onImgClick, isLast }) => (
  <div
    style={{
      display: 'flex',
      gap: 12,
      padding: '12px 0',
      flex: 1,
      borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
      cursor: 'pointer',
      borderRadius: 8,
      transition: 'padding-left .18s',
      alignItems: 'center'
    }}
    onMouseEnter={e => e.currentTarget.style.paddingLeft = '6px'}
    onMouseLeave={e => e.currentTarget.style.paddingLeft = '0'}
    onClick={() => navigateArticle(article, navigate)}
  >
    <div style={{ width: 76, height: 56, flexShrink: 0, borderRadius: 8, overflow: 'hidden', lineHeight: 0 }}
      onClick={e => { e.stopPropagation(); if (article.banner_image) onImgClick(`/uploads/${article.banner_image}`, article.title); }}>
      {article.banner_image
        ? <img src={`/uploads/${article.banner_image}`} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: 76, height: 56, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ReadOutlined style={{ color: 'var(--color-primary)', fontSize: 16 }} /></div>
      }
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      {article.category_name && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: .6 }}>{article.category_name} · </span>}
      <div style={{ fontWeight: 600, fontSize: 'clamp(13px, 0.9vw, 14px)', color: 'var(--color-heading)', lineHeight: 1.4, margin: '2px 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</div>
      <span style={{ fontSize: 'clamp(11px, 0.7vw, 12px)', color: 'var(--color-muted)' }}><CalendarOutlined style={{ marginRight: 3 }} />{moment(article.scheduled_publish_date || article.published_date || article.created_at).format('MMM D, YYYY')}</span>
    </div>
  </div>
);

// ── Latest Posts Section ─────────────────────────────────────────
const LatestArticlesSection = ({ articles, blogs, navigate }) => {
  const combined = [...(articles || []), ...(blogs || [])]
    .sort((a, b) => new Date(b.scheduled_publish_date || b.published_date || b.created_at) - new Date(a.scheduled_publish_date || a.published_date || a.created_at))
    .slice(0, 4);
  const [ref, visible] = useReveal();
  if (!combined.length) return null;
  return (
    <div ref={ref} className="latest-articles-section" style={{
      margin: '48px 0',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: 'opacity .6s ease, transform .6s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 4, height: 24, background: 'var(--color-primary)', borderRadius: 4, display: 'inline-block' }} />
          <span style={{ fontSize: 'clamp(18px, 1.5vw, 20px)', color: 'var(--color-primary)', lineHeight: 1 }}><ReadOutlined /></span>
          <span style={{ fontWeight: 800, fontSize: 'clamp(18px, 1.5vw, 20px)', color: 'var(--color-heading)' }}>Latest Posts</span>
          <span style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, marginLeft: 4 }}>NEW</span>
        </div>
        <Link to="/articles" style={{
          fontSize: 'clamp(12px, 0.9vw, 13px)',
          color: 'var(--color-primary)',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          textDecoration: 'none',
          padding: '5px 16px',
          borderRadius: 20,
          border: '1px solid var(--color-border)',
          background: 'var(--color-primary-light)'
        }}>
          View All <ArrowRightOutlined style={{ fontSize: 11 }} />
        </Link>
      </div>
      <div className="latest-articles-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 20
      }}>
        {combined.map((article, idx) => (
          <div key={article.id || idx} onClick={() => navigateArticle(article, navigate)}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(28px)',
              transition: `opacity .55s ease ${idx * 100}ms, transform .55s ease ${idx * 100}ms`,
              cursor: 'pointer'
            }}>
            <Card className="latest-article-card" style={{
              height: '100%',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
              transition: 'transform .25s ease, box-shadow .25s ease, border-color .25s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-7px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(11,31,77,0.16)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
            >
              <div style={{ position: 'relative', overflow: 'hidden', lineHeight: 0, height: 'clamp(140px, 12vw, 160px)', background: '#f3f4f6' }}>
                {article.banner_image
                  ? <img src={`/uploads/${article.banner_image}`} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', transition: 'transform .45s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--color-primary-light) 0%, #e8edff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ReadOutlined style={{ fontSize: 36, color: 'var(--color-primary)', opacity: 0.5 }} /></div>
                }
              </div>
              <CardContent style={{ padding: 'clamp(14px, 1.2vw, 16px) clamp(14px, 1.2vw, 18px) clamp(14px, 1.2vw, 18px)' }}>
                {article.category_name && <span style={{ fontSize: 'clamp(10px, 0.7vw, 10.5px)', fontWeight: 700, color: article.content_type_name?.toLowerCase() === 'blog' ? '#6c5ce7' : 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8, display: 'block' }}>{article.category_name}</span>}
                <h3 style={{ fontWeight: 700, fontSize: 'clamp(14px, 1vw, 14.5px)', lineHeight: 1.5, color: 'var(--color-heading)', margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--color-border)', fontSize: 'clamp(11px, 0.7vw, 11.5px)', color: 'var(--color-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><EyeOutlined />{article.view_count || 0} views</span>
                  <span style={{ color: article.content_type_name?.toLowerCase() === 'blog' ? '#6c5ce7' : 'var(--color-primary)', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>Read more <ArrowRightOutlined style={{ fontSize: 9 }} /></span>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Trending Topics Section ─────────────────────────────────────
const TrendingTopicsSection = ({ items, navigate, darkMode = false }) => {
  const [ref, visible] = useReveal();
  if (!items.length) return null;
  return (
    <div ref={ref} className="trending-section" style={{
      margin: '80px 0 64px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: 'opacity .6s ease, transform .6s ease'
    }}>
      <div style={{ marginBottom: 36, textAlign: 'left' }}>
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--color-primary)',
          background: 'var(--color-primary-light)',
          padding: '4px 12px',
          borderRadius: 20,
          textTransform: 'uppercase',
          letterSpacing: 1,
          display: 'inline-block',
          marginBottom: 12
        }}>Trending</span>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 800, color: darkMode ? '#f1f5f9' : 'var(--color-heading)', margin: '0 0 10px', letterSpacing: '-0.5px' }}>Related Post</h2>
        <p style={{ color: darkMode ? '#94a3b8' : 'var(--color-muted)', fontSize: 'clamp(14px, 1vw, 16px)', margin: 0 }}>Expand your knowledge with these hand-picked posts.</p>
      </div>

      <div className="trending-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 28
      }}>
        {items.map((item, idx) => (
          <div key={item.id || idx} onClick={() => navigateArticle(item, navigate)} style={{
            background: darkMode ? '#1e293b' : 'var(--color-surface)',
            borderRadius: 20,
            border: darkMode ? '1px solid #334155' : '1px solid var(--color-border)',
            boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            transition: 'transform .3s ease, box-shadow .3s ease, border-color .3s ease',
            overflow: 'hidden'
          }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = darkMode ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(11,31,77,0.08)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.04)';
              e.currentTarget.style.borderColor = darkMode ? '#334155' : 'var(--color-border)';
            }}
          >
            <div style={{ position: 'relative', overflow: 'hidden', paddingTop: '56.25%', background: darkMode ? '#1e293b' : '#f3f4f6' }}>
              {item.banner_image ? (
                <img src={`/uploads/${item.banner_image}`} alt={item.title} style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover'
                }} />
              ) : (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: darkMode ? '#1e293b' : 'var(--color-primary-light)' }}>
                  <ReadOutlined style={{ fontSize: 32, color: 'var(--color-primary)', opacity: 0.5 }} />
                </div>
              )}
            </div>

            <div style={{ padding: 'clamp(18px, 1.8vw, 24px)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontSize: 'clamp(12px, 0.8vw, 13px)', color: darkMode ? '#94a3b8' : 'var(--color-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <CalendarOutlined style={{ color: 'var(--color-primary)', fontSize: 13 }} />
                    {moment(item.scheduled_publish_date || item.published_date || item.created_at).format('MMM D, YYYY')}
                  </span>
                  {item.category_name && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      background: 'var(--color-primary-light)',
                      padding: '3px 10px',
                      borderRadius: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}>{item.category_name}</span>
                  )}
                </div>

                <h3 style={{ fontWeight: 800, fontSize: 'clamp(16px, 1.3vw, 18px)', lineHeight: 1.4, color: darkMode ? '#f1f5f9' : 'var(--color-heading)', margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 'clamp(13px, 0.85vw, 14px)', color: darkMode ? '#94a3b8' : 'var(--color-muted)', lineHeight: 1.6, margin: '0 0 20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.short_description || 'Explore this trending post to learn more about the latest developments and industry best practices.'}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: darkMode ? '1px solid #334155' : '1px solid var(--color-border)' }}>
                <span style={{ fontWeight: 700, fontSize: 'clamp(13px, 0.9vw, 14px)', color: darkMode ? '#f1f5f9' : 'var(--color-heading)' }}>
                  {item.author_name || 'Staff Writer'}
                </span>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: darkMode ? '#1e293b' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  color: darkMode ? '#94a3b8' : '#334155',
                  fontWeight: 'bold',
                  transition: 'background .2s, color .2s'
                }}
                  className="arrow-redir"
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = darkMode ? '#1e293b' : '#f1f5f9'; e.currentTarget.style.color = darkMode ? '#94a3b8' : '#334155'; }}
                >
                  ↗
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Home ────────────────────────────────────────────────────
const Home = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [data, setData] = useState({ articles: [], blogs: [], news: [], interviews: [] });
  const [stats, setStats] = useState({ totalPublished: 0, totalViews: 0, totalAuthors: 0, totalCategories: 0 });
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [tabData, setTabData] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const catSectionRef = useRef(null);

  const trendingTopics = React.useMemo(() => {
    const combined = [...data.articles, ...data.blogs, ...data.news];
    if (!combined.length) return [];
    return combined
      .map(item => ({ item, sort: Math.sin((item.id || 0) + 7) }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, 3)
      .map(x => x.item);
  }, [data]);

  useEffect(() => { fetchHomeData(); }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Fetch top viewed categories from API (limit to 6)
    axios.get('/api/public/top-categories?limit=6')
      .then(res => {
        const categories = res.data || [];
        setDynamicCategories(categories);
        // Set first category as active tab if no tab is selected
        if (categories.length > 0 && !activeTab) {
          setActiveTab(categories[0].slug);
        }
      })
      .catch(err => {
        console.error('Failed to fetch top categories:', err);
      });
  }, []);

  useEffect(() => {
    if (!activeTab) { setTabData([]); return; }
    setTabLoading(true);
    // Only check dynamic categories
    const dynamicTab = dynamicCategories.find(c => c.slug === activeTab);
    const tab = dynamicTab ? { key: dynamicTab.slug, param: 'category' } : null;

    if (!tab) {
      setTabData([]);
      setTabLoading(false);
      return;
    }

    const qs = tab.param === 'content_type' ? `content_type=${tab.key}` : `category=${tab.key}`;
    axios.get(`/api/public/content?status=published&${qs}&limit=3`)
      .then(r => setTabData(r.data?.data || []))
      .catch(() => setTabData([]))
      .finally(() => setTabLoading(false));
  }, [activeTab, dynamicCategories]);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const [aR, bR, nR, iR, sR] = await Promise.all([
        axios.get('/api/public/content?status=published&content_type=article&limit=6'),
        axios.get('/api/public/content?status=published&content_type=blog&limit=4'),
        axios.get('/api/public/content?status=published&content_type=news&limit=4'),
        axios.get('/api/public/content?status=published&content_type=interview&limit=4'),
        axios.get('/api/public/stats'),
      ]);
      setData({ articles: aR.data?.data || [], blogs: bR.data?.data || [], news: nR.data?.data || [], interviews: iR.data?.data || [] });
      setStats(sR.data || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ padding: '40px 0' }}>
      <Skeleton active paragraph={{ rows: 3 }} style={{ marginBottom: 32 }} />
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );

  return (
    <div className="home-page" style={{
      paddingBottom: 60,
      background: darkMode ? '#0f172a' : 'var(--color-bg-alt)',
      minHeight: '100vh',
      overflowX: 'hidden'
    }}>
      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}

      <HeroSection />
      {data.news.length > 0 && <TickerStrip items={data.news} />}

      <div className="container" style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 clamp(12px, 2vw, 20px)'
      }}>

        {/* Latest Posts */}
        <LatestArticlesSection articles={data.articles} blogs={data.blogs} navigate={navigate} />

        {/* Category chips */}
        <CategoryNav activeTab={activeTab} setActiveTab={setActiveTab} dynamicCategories={dynamicCategories} />

        {/* Category filtered content */}
        <div ref={catSectionRef}>
          {activeTab && (() => {
            const activeCat = CAT_TABS.find(c => c.key === activeTab) || dynamicCategories.find(c => c.slug === activeTab);
            return (
              <div style={{ margin: '0 0 40px', minHeight: 120 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                  flexWrap: 'wrap',
                  gap: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 'clamp(16px, 1.3vw, 18px)', color: 'var(--color-heading)' }}>{activeCat?.label || activeCat?.name}</span>
                  </div>
                  <Link to={`/category/${activeTab}`} style={{
                    fontSize: 'clamp(12px, 0.8vw, 13px)',
                    color: activeCat?.color || 'var(--color-primary)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    textDecoration: 'none',
                    padding: '5px 14px',
                    borderRadius: 8,
                    border: `1px solid ${activeCat?.color || 'var(--color-primary)'}33`,
                    background: `${activeCat?.color || 'var(--color-primary)'}0d`
                  }}>
                    View All <ArrowRightOutlined style={{ fontSize: 10 }} />
                  </Link>
                </div>

                {tabLoading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                    {[1, 2, 3].map(i => <Skeleton key={i} active />)}
                  </div>
                ) : tabData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-muted)', fontSize: 14, background: 'var(--color-surface)', borderRadius: 12, border: '1px dashed var(--color-border)' }}>
                    No content found for this category yet.
                  </div>
                ) : (
                  <div className="cat-cards-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 20
                  }}>
                    {tabData.slice(0, 3).map((a, idx) => (
                      <div key={a.id} style={{ animation: `catCardIn .4s ease ${idx * 80}ms both` }}>
                        <div style={{
                          background: 'var(--color-surface)',
                          borderRadius: 14,
                          overflow: 'hidden',
                          border: `1.5px solid ${activeCat?.color || 'var(--color-primary)'}22`,
                          boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer'
                        }}
                          onClick={() => navigateArticle(a, navigate)}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.015)'; e.currentTarget.style.boxShadow = `0 24px 48px ${activeCat?.color || 'var(--color-primary)'}33, 0 12px 24px rgba(0,0,0,0.1)`; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.06)'; }}
                        >
                          <div style={{ position: 'relative', overflow: 'hidden', height: 'clamp(160px, 14vw, 200px)', lineHeight: 0 }}>
                            {a.banner_image
                              ? <img src={`/uploads/${a.banner_image}`} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .4s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${activeCat?.color || 'var(--color-primary)'}22 0%, #e8edff 100%)` }}><ReadOutlined style={{ fontSize: 40, color: activeCat?.color || 'var(--color-primary)', opacity: 0.4 }} /></div>
                            }
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: activeCat?.color || 'var(--color-primary)' }} />
                            {isHtmlBuilderContent(a) && (
                              <span style={{ position: 'absolute', top: 10, right: 10, background: '#6c5ce7', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, letterSpacing: .5, textTransform: 'uppercase' }}>
                                Landing Page
                              </span>
                            )}
                            {!isHtmlBuilderContent(a) && a.content_type_name && (
                              <span style={{ position: 'absolute', top: 10, right: 10, background: activeCat?.color || 'var(--color-primary)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, letterSpacing: .5, textTransform: 'uppercase' }}>
                                {a.content_type_name}
                              </span>
                            )}
                          </div>
                          <div style={{ padding: 'clamp(16px, 1.5vw, 18px) clamp(16px, 1.5vw, 20px) clamp(16px, 1.5vw, 20px)', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <h3 style={{ fontWeight: 700, fontSize: 'clamp(15px, 1.1vw, 16px)', lineHeight: 1.45, color: 'var(--color-heading)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.title}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 'clamp(11px, 0.8vw, 12px)', color: 'var(--color-muted)', flexWrap: 'wrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${activeCat?.color || 'var(--color-primary)'}22`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: activeCat?.color || 'var(--color-primary)', fontWeight: 700 }}>
                                  {(a.author_name || a.author || 'A').charAt(0).toUpperCase()}
                                </span>
                                <span style={{ fontWeight: 500 }}>{a.author_name || a.author || 'TgsTechInfo'}</span>
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><CalendarOutlined />{moment(a.scheduled_publish_date || a.published_date || a.created_at).format('MMM D, YYYY')}</span>
                            </div>
                            <div style={{ marginTop: 'auto', paddingTop: 4 }}>
                              <button onClick={(e) => { e.stopPropagation(); navigateArticle(a, navigate); }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '8px 0',
                                  background: 'transparent',
                                  color: activeCat?.color || 'var(--color-primary)',
                                  fontWeight: 700,
                                  fontSize: 'clamp(12px, 0.8vw, 13px)',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'transform .2s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(5px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; }}
                              >
                                {isHtmlBuilderContent(a) ? 'View Landing Page' : 'Read More'} <ArrowRightOutlined style={{ fontSize: 11 }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Featured Articles */}
        {data.articles.length > 0 && (
          <RevealSection>
            <SectionHead icon={<FireOutlined />} label="Featured Articles" viewAllTo="/articles" accent="var(--color-primary)" />
            <div className="featured-articles-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 24
            }}>
              {data.articles.slice(0, 2).map((a, idx) => (
                <div key={a.id || idx} className="featured-article-card" style={{
                  background: 'var(--color-surface)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1.5px solid var(--color-border)',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }}
                  onClick={() => navigateArticle(a, navigate)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.015)'; e.currentTarget.style.boxShadow = `0 24px 48px rgba(0,0,0,0.1), 0 12px 24px rgba(0,0,0,0.08)`; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                >
                  <div style={{ position: 'relative', overflow: 'hidden', height: 'clamp(180px, 18vw, 240px)', lineHeight: 0 }}>
                    {a.banner_image
                      ? <img src={`/uploads/${a.banner_image}`} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .4s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                      : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--color-primary-light) 0%, #e8edff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ReadOutlined style={{ fontSize: 40, color: 'var(--color-primary)', opacity: 0.4 }} /></div>
                    }
                  </div>
                  <div style={{ padding: 'clamp(18px, 1.8vw, 24px)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontWeight: 800, fontSize: 'clamp(17px, 1.5vw, 20px)', lineHeight: 1.4, color: 'var(--color-heading)', margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.title}</h3>
                    <div style={{ marginTop: 'auto' }}>
                      <button onClick={(e) => { e.stopPropagation(); navigateArticle(a, navigate); }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 0',
                          background: 'transparent',
                          color: 'var(--color-primary)',
                          fontWeight: 700,
                          fontSize: 'clamp(13px, 0.9vw, 14px)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'transform .2s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(5px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; }}
                      >
                        Explore <ArrowRightOutlined style={{ fontSize: 12 }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </RevealSection>
        )}

        <StatsBar stats={stats} darkMode={darkMode} />

        <TrendingTopicsSection items={trendingTopics} navigate={navigate} darkMode={darkMode} />

        <CaseStudiesSection navigate={navigate} darkMode={darkMode} />

        <WhyPublishSection darkMode={darkMode} />
        <PublishingSolutions darkMode={darkMode} />
        <NewsletterBox darkMode={darkMode} />

        {data.interviews.length > 0 && (
          <RevealSection delay={80}>
            <SectionHead icon={<TeamOutlined />} label="Expert Interviews" viewAllTo="/interviews" accent="#e17055" />
            <Row gutter={[20, 20]}>
              {data.interviews.map(a => (
                <Col xs={24} sm={12} lg={6} key={a.id}>
                  <HeroCard article={a} navigate={navigate} onImgClick={(src, alt) => setLightbox({ src, alt })} accent="#e17055" />
                </Col>
              ))}
            </Row>
          </RevealSection>
        )}

      </div>

      <style>{`
        @keyframes catCardIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        /* Responsive Grids */
        @media (max-width: 1024px) {
          .latest-articles-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .glass-stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 20px !important; }
          .trending-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .solutions-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 16px !important; min-height: auto !important; }
          .featured-articles-grid { grid-template-columns: 1fr !important; }
          .why-grid { grid-template-columns: 1fr 1fr !important; }
          .case-studies-grid { grid-template-columns: 1fr !important; }
          .cat-cards-grid { grid-template-columns: 1fr !important; }
          .container { padding: 0 16px !important; }
        }

        @media (max-width: 640px) {
          .latest-articles-grid { grid-template-columns: 1fr !important; }
          .solutions-grid { grid-template-columns: 1fr !important; }
          .why-grid { grid-template-columns: 1fr !important; }
          .trending-grid { grid-template-columns: 1fr !important; }
          .glass-stats-grid { grid-template-columns: 1fr !important; }
          .category-tabs { flex-wrap: nowrap !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch; padding-bottom: 8px; }
          .category-tabs::-webkit-scrollbar { height: 4px; }
          .category-tabs::-webkit-scrollbar-thumb { background: var(--color-primary); border-radius: 4px; }
          .category-tab { flex-shrink: 0 !important; }
          .hero-tag-pills { display: none !important; }
          .hero-section { min-height: auto !important; }
          .newsletter-form { flex-direction: column !important; max-width: 100% !important; }
          .newsletter-input { width: 100% !important; border-radius: 10px !important; }
          .newsletter-btn { width: 100% !important; border-radius: 10px !important; }
          .gate-modal { padding: 24px !important; margin: 12px !important; }
        }

        @media (max-width: 480px) {
          .hero-grid h1 { font-size: 26px !important; }
          .hero-grid p { font-size: 14px !important; }
          .latest-article-card > div:first-child { height: 140px !important; }
          .case-study-card > div:first-child { height: 130px !important; }
          .featured-article-card > div:first-child { height: 160px !important; }
          .trending-card > div:first-child { padding-top: 40% !important; }
        }
      `}</style>
    </div>
  );
};

export default Home;