// Home.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Tag, Skeleton, Input } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarOutlined, EyeOutlined, ArrowRightOutlined,
  SearchOutlined, CloseOutlined, FireOutlined,
  ReadOutlined, GlobalOutlined, TeamOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const parseTags = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
    return value.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
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

// ── Content card — magazine style ───────────────────────────────
const HeroCard = ({ article, navigate, onImgClick, accent = '#4a7cff' }) => (
  <div
    onClick={() => navigate(`/article/${article.slug}`)}
    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%',
      borderRadius: 14, overflow: 'hidden', background: '#fff',
      boxShadow: '0 2px 16px rgba(0,0,0,0.10)', border: '1px solid #dde2ee',
      transition: 'transform .22s, box-shadow .22s' }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.15)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.10)'; }}
  >
    {/* Image */}
    <div style={{ position: 'relative', lineHeight: 0, overflow: 'hidden' }}
      onClick={e => { e.stopPropagation(); if (article.banner_image) onImgClick(`/uploads/${article.banner_image}`, article.title); }}>
      {article.banner_image
        ? <img src={`/uploads/${article.banner_image}`} alt={article.title}
            style={{ width: '100%', height: 'auto', display: 'block', transition: 'transform .4s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
        : <div style={{ height: 180, background: `linear-gradient(135deg,${accent}18,${accent}08)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ReadOutlined style={{ fontSize: 32, color: `${accent}60` }} />
          </div>
      }
      {/* type badge */}
      {article.content_type_name && (
        <span style={{ position: 'absolute', top: 10, left: 10,
          background: accent, color: '#fff', fontSize: 10, fontWeight: 700,
          padding: '3px 10px', borderRadius: 20, letterSpacing: .6, textTransform: 'uppercase' }}>
          {article.content_type_name}
        </span>
      )}
    </div>
    {/* Body */}
    <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
      {article.category_name && (
        <span style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase',
          letterSpacing: .8, marginBottom: 8, display: 'block' }}>
          {article.category_name}
        </span>
      )}
      <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.45, color: '#111827', marginBottom: 8, flex: 1,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {article.title}
      </div>
      <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.6, marginBottom: 12,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {article.short_description}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 10, borderTop: '1px solid #f3f4f6', fontSize: 11.5, color: '#9ca3af' }}>
        <span><CalendarOutlined style={{ marginRight: 4 }} />{moment(article.published_date || article.created_at).format('MMM D, YYYY')}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <EyeOutlined />{article.view_count || 0}
        </span>
      </div>
    </div>
  </div>
);

// ── Compact list card ────────────────────────────────────────────
const ListCard = ({ article, navigate, onImgClick, isLast }) => (
  <div style={{ display: 'flex', gap: 12, padding: '12px 0', flex: 1,
    borderBottom: isLast ? 'none' : '1px solid #f3f4f6', cursor: 'pointer', borderRadius: 8,
    transition: 'padding-left .18s', alignItems: 'center' }}
    onMouseEnter={e => e.currentTarget.style.paddingLeft = '6px'}
    onMouseLeave={e => e.currentTarget.style.paddingLeft = '0'}
    onClick={() => navigate(`/article/${article.slug}`)}
  >
    <div style={{ width: 76, height: 56, flexShrink: 0, borderRadius: 8, overflow: 'hidden', lineHeight: 0 }}
      onClick={e => { e.stopPropagation(); if (article.banner_image) onImgClick(`/uploads/${article.banner_image}`, article.title); }}>
      {article.banner_image
        ? <img src={`/uploads/${article.banner_image}`} alt={article.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: 76, height: 56, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ReadOutlined style={{ color: '#c0cfe8', fontSize: 16 }} />
          </div>
      }
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      {article.category_name && <span style={{ fontSize: 10, fontWeight: 700, color: '#4a7cff', textTransform: 'uppercase', letterSpacing: .6 }}>{article.category_name} · </span>}
      <div style={{ fontWeight: 600, fontSize: 13, color: '#111827', lineHeight: 1.4, margin: '2px 0 4px',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {article.title}
      </div>
      <span style={{ fontSize: 11, color: '#9ca3af' }}>
        <CalendarOutlined style={{ marginRight: 3 }} />{moment(article.published_date || article.created_at).format('MMM D, YYYY')}
      </span>
    </div>
  </div>
);

// ── Section wrapper with scroll reveal ──────────────────────────
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
const SectionHead = ({ icon, label, viewAllTo, accent = '#4a7cff' }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 4, height: 22, background: accent, borderRadius: 4, display: 'inline-block' }} />
      <span style={{ fontSize: 18, color: accent, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: 18, color: '#1a1a2e' }}>{label}</span>
    </div>
    <Link to={viewAllTo} style={{
      fontSize: 13, color: accent, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4,
      textDecoration: 'none', padding: '5px 14px', borderRadius: 20,
      border: `1px solid ${accent}22`, background: `${accent}08`,
      transition: 'background .2s'
    }}>
      View All <ArrowRightOutlined style={{ fontSize: 11 }} />
    </Link>
  </div>
);

// ── Ticker strip ─────────────────────────────────────────────────
const TickerStrip = ({ items }) => {
  const doubled = [...items, ...items];
  return (
    <div style={{ background: '#4a7cff', overflow: 'hidden', padding: '9px 0', position: 'relative' }}>
      <div style={{ display: 'flex', gap: 0, animation: 'ticker 28s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ fontSize: 13, color: '#fff', fontWeight: 500, padding: '0 32px', opacity: .92 }}>
            <FireOutlined style={{ marginRight: 6, color: '#ffd700' }} />
            {item.title}
          </span>
        ))}
      </div>
    </div>
  );
};

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

// ── Stats bar — real data + animated ─────────────────────────────
const StatsBar = ({ stats }) => {
  const [ref, visible] = useReveal();
  const ITEMS = [
    { icon: '📄', label: 'Articles Published', value: stats.totalPublished, color: '#4a7cff', bg: '#eef2ff' },
    { icon: '👁️', label: 'Total Views',         value: stats.totalViews,     color: '#00b894', bg: '#e8faf5' },
    { icon: '✍️', label: 'Contributors',        value: stats.totalAuthors,   color: '#6c5ce7', bg: '#f3f0ff' },
    { icon: '🗂️', label: 'Tech Categories',     value: stats.totalCategories,color: '#e17055', bg: '#fff4f0' },
  ];
  return (
    <div ref={ref} style={{ margin: '48px 0' }}>
      {/* heading */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#4a7cff', textTransform: 'uppercase', letterSpacing: 2 }}>By The Numbers</span>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '6px 0 0' }}>Trusted by Tech Professionals</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }} className="stats-grid">
        {ITEMS.map((s, i) => {
          const num = useCountUp(Number(s.value) || 0, visible);
          return (
            <div key={i} style={{
              background: '#fff', borderRadius: 16, padding: '28px 20px', textAlign: 'center',
              border: `1px solid ${s.color}22`, boxShadow: `0 4px 20px ${s.color}10`,
              opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
              transition: `opacity .5s ease ${i*110}ms, transform .5s ease ${i*110}ms`
            }}>
              <div style={{ fontSize: 32, marginBottom: 10, lineHeight: 1 }}>{s.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {num.toLocaleString()}
              </div>
              <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 6, fontWeight: 500 }}>{s.label}</div>
              <div style={{ height: 3, background: s.bg, borderRadius: 2, marginTop: 14, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: s.color, borderRadius: 2, width: visible ? '100%' : '0%', transition: `width 1.2s ease ${i*110+200}ms` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Category pill nav ────────────────────────────────────────────
const CAT_TABS = [
  { label: 'AI & ML',        key: 'artificial-intelligence', param: 'category' },
  { label: 'Cybersecurity',  key: 'cybersecurity',           param: 'category' },
  { label: 'Cloud',          key: 'cloud-computing',         param: 'category' },
  { label: 'DevOps',         key: 'devops',                  param: 'category' },
  { label: 'Data Analytics', key: 'data-analytics',          param: 'category' },
  { label: 'FinTech',        key: 'fintech',                 param: 'category' },
  { label: 'Healthcare IT',  key: 'healthcare',              param: 'category' },
  { label: 'Interviews',     key: 'interview',               param: 'content_type' },
];

const CategoryNav = ({ activeTab, setActiveTab }) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '28px 0 20px' }}>
    {CAT_TABS.map(c => {
      const isActive = activeTab === c.key;
      return (
        <button key={c.key} onClick={() => setActiveTab(isActive ? null : c.key)}
          style={{
            padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: isActive ? '#4a7cff' : '#f4f6ff',
            color: isActive ? '#fff' : '#4a7cff',
            border: isActive ? '1px solid #4a7cff' : '1px solid #dce6ff',
            cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap',
            boxShadow: isActive ? '0 4px 14px rgba(74,124,255,0.3)' : 'none'
          }}
        >
          {c.label}
        </button>
      );
    })}
  </div>
);

// ── Why Publish With Us ─────────────────────────────────────────
const WHY_ITEMS = [
  { icon: '🎯', title: 'Targeted B2B Audience', desc: 'Reach 200,000+ verified IT decision-makers, CXOs, and tech buyers across industries.' },
  { icon: '📊', title: 'Measurable ROI', desc: 'Real-time analytics dashboard: track impressions, leads, downloads and engagement.' },
  { icon: '🏆', title: 'Thought Leadership', desc: 'Position your brand as an industry authority with expert-curated editorial placement.' },
  { icon: '🔗', title: 'Multi-Channel Distribution', desc: 'Your content amplified via newsletter, social, SEO and partner syndication networks.' },
  { icon: '⚡', title: 'Fast-Track Publishing', desc: 'Dedicated editorial team ensures your content goes live within 48 hours of approval.' },
  { icon: '🤝', title: 'Dedicated Account Manager', desc: 'White-glove support from strategy to execution, with a single point of contact for your team.' },
];

const WhyPublishSection = () => {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{
      margin: '56px 0',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: 'opacity .6s ease, transform .6s ease'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#4a7cff', textTransform: 'uppercase', letterSpacing: 2 }}>Why Choose Us</span>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#111827', margin: '8px 0 12px', lineHeight: 1.2 }}>
          The Smartest Way to Publish in B2B Tech
        </h2>
        <p style={{ color: '#6b7280', fontSize: 15, maxWidth: 520, margin: '0 auto' }}>
          From whitepapers to webinars, we give your content the reach, credibility and conversions it deserves.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="why-grid">
        {WHY_ITEMS.map((item, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 16, padding: '28px 24px',
            border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(74,124,255,0.06)',
            transition: 'transform .22s, box-shadow .22s',
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: `${i * 80}ms`
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(74,124,255,0.14)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(74,124,255,0.06)'; }}
          >
            <div style={{ fontSize: 36, marginBottom: 14, lineHeight: 1 }}>{item.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 8 }}>{item.title}</div>
            <div style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.65 }}>{item.desc}</div>
            <div style={{ marginTop: 18, height: 3, borderRadius: 2, background: 'linear-gradient(90deg,#4a7cff,#6c5ce7)', width: '40%' }} />
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 36 }}>
        <Link to="/register" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg,#4a7cff,#6c5ce7)',
          color: '#fff', fontWeight: 700, fontSize: 15,
          padding: '13px 32px', borderRadius: 12, textDecoration: 'none',
          boxShadow: '0 6px 20px rgba(74,124,255,0.35)', transition: 'transform .2s, box-shadow .2s'
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

// ── Publishing Solutions (B2B) ────────────────────────────────────
const SOLUTIONS = [
  {
    accent: '#4a7cff', bg: '#eef2ff', icon: '📝', label: 'Articles & Blogs',
    desc: 'Long-form thought leadership, how-tos and opinion pieces that rank on Google and drive organic traffic.',
    tags: ['SEO Optimised', 'Editorial Review', 'Author Profile'],
  },
  {
    accent: '#00b894', bg: '#e8faf5', icon: '📄', label: 'Whitepapers & Reports',
    desc: 'Gated research assets that generate qualified leads. We handle design, hosting and lead capture forms.',
    tags: ['Lead Gen', 'Branded Design', 'CRM Integration'],
  },
  {
    accent: '#6c5ce7', bg: '#f3f0ff', icon: '🎙️', label: 'Webinars & Events',
    desc: 'Live and on-demand virtual events promoted to our engaged audience of IT professionals.',
    tags: ['Registration Page', 'Email Promotion', 'Recording Hosting'],
  },
  {
    accent: '#e17055', bg: '#fff4f0', icon: '🗞️', label: 'Sponsored News',
    desc: 'Get your product launches, partnerships and announcements in front of the right audience instantly.',
    tags: ['Instant Publish', 'Homepage Feature', 'Newsletter Blast'],
  },
];

const PublishingSolutions = () => {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{
      margin: '56px 0',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: 'opacity .6s ease, transform .6s ease'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6c5ce7', textTransform: 'uppercase', letterSpacing: 2 }}>Publishing Solutions</span>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#111827', margin: '8px 0 10px' }}>
          Content Formats Built for B2B Impact
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14.5, maxWidth: 480, margin: '0 auto' }}>
          Choose the format that fits your marketing goals. We handle the rest.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }} className="solutions-grid">
        {SOLUTIONS.map((s, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 18, overflow: 'hidden',
            border: `1px solid ${s.accent}22`, boxShadow: `0 4px 18px ${s.accent}0d`,
            transition: 'transform .22s, box-shadow .22s',
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transitionDelay: `${i * 90}ms`
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 16px 36px ${s.accent}22`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 18px ${s.accent}0d`; }}
          >
            <div style={{ height: 5, background: `linear-gradient(90deg,${s.accent},${s.accent}88)` }} />
            <div style={{ padding: '24px 22px 26px' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, background: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, marginBottom: 16
              }}>{s.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', marginBottom: 10 }}>{s.label}</div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.65, marginBottom: 18 }}>{s.desc}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {s.tags.map(t => (
                  <span key={t} style={{
                    fontSize: 11, fontWeight: 600, color: s.accent,
                    background: s.bg, borderRadius: 20, padding: '3px 10px',
                    border: `1px solid ${s.accent}33`
                  }}>{t}</span>
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
    <div ref={ref} style={{
      background: 'linear-gradient(135deg, #4a7cff 0%, #6c5ce7 100%)',
      borderRadius: 20, padding: '48px 40px', textAlign: 'center', margin: '48px 0',
      opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(.97)',
      transition: 'opacity .6s ease, transform .6s ease'
    }}>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
        Stay Ahead of the Curve
      </div>
      <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: '0 0 10px' }}>
        Get the Latest Tech Insights
      </h2>
      <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 15, margin: '0 0 28px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
        Join 50,000+ tech professionals. Weekly digest of AI, cloud, cybersecurity & more.
      </p>
      <div style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
        <input placeholder="Enter your email address"
          style={{
            flex: 1, minWidth: 220, padding: '12px 18px', borderRadius: 10, border: 'none',
            fontSize: 14, outline: 'none', background: 'rgba(255,255,255,.95)'
          }} />
        <button style={{
          padding: '12px 24px', borderRadius: 10, border: 'none',
          background: '#1a1a2e', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}>
          Subscribe Free
        </button>
      </div>
    </div>
  );
};

// ── Hero Slide Images (Unsplash free) ──────────────────────────
const HERO_SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
    tag: 'Artificial Intelligence',
    title: 'How AI is Reshaping the Future of Enterprise Technology',
  },
  {
    img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
    tag: 'Cybersecurity',
    title: 'Zero Trust Architecture: The New Standard for Enterprise Security',
  },
  {
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    tag: 'Cloud Computing',
    title: 'Multi-Cloud Strategies Driving Digital Transformation in 2026',
  },
  {
    img: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80',
    tag: 'Data Analytics',
    title: 'Real-Time Data Processing: The Shift Every Business Must Make',
  },
];

const HeroSection = ({ searchVal, setSearchVal, handleSearch }) => {
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % HERO_SLIDES.length);
    }, 3800);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const goTo = (i) => { setActive(i); startTimer(); };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a1628 0%, #0f2044 60%, #1a3a6e 100%)',
      position: 'relative', overflow: 'hidden', minHeight: 480
    }}>
      {/* bg grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: .04,
        backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 24px',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 40, alignItems: 'center', minHeight: 480
      }} className="hero-grid">

        {/* ── LEFT: Text ── */}
        <div style={{ padding: '56px 0', position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(74,124,255,.18)', border: '1px solid rgba(74,124,255,.35)',
            borderRadius: 24, padding: '5px 14px', marginBottom: 24
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 0 3px rgba(74,222,128,.25)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase' }}>Live Tech Intelligence</span>
          </div>

          <h1 style={{
            color: '#fff', fontWeight: 900, lineHeight: 1.12,
            fontSize: 'clamp(26px, 3.5vw, 46px)',
            margin: '0 0 18px', letterSpacing: -.5
          }}>
            Your Gateway to<br />
            <span style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Tech Insights
            </span>
            {' '}& Innovation
          </h1>

          <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 15, lineHeight: 1.75, margin: '0 0 32px', maxWidth: 440 }}>
            In-depth articles, expert interviews, breaking news and research across AI, Cloud, Cybersecurity, DevOps and more, curated for technology leaders.
          </p>

          {/* Search */}
          <div style={{ display: 'flex', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.3)', maxWidth: 440 }}>
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search articles, news, resources..."
              style={{ flex: 1, padding: '13px 18px', border: 'none', fontSize: 14, outline: 'none', background: '#fff', color: '#1a1a2e' }}
            />
            <button onClick={handleSearch} style={{
              padding: '13px 20px', background: '#4a7cff', border: 'none',
              color: '#fff', fontSize: 16, cursor: 'pointer', flexShrink: 0
            }}>
              <SearchOutlined />
            </button>
          </div>

          {/* Quick links */}
          <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
            {['AI & ML', 'Cybersecurity', 'Cloud', 'DevOps'].map(t => (
              <span key={t} style={{
                fontSize: 12, color: 'rgba(255,255,255,.6)', background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.12)', borderRadius: 20, padding: '4px 12px', cursor: 'pointer'
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Auto-sliding images ── */}
        <div style={{ padding: '40px 0', position: 'relative', zIndex: 2 }}>
          <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.45)' }}>

            {/* Slides */}
            {HERO_SLIDES.map((slide, i) => (
              <div key={i} style={{
                position: i === 0 ? 'relative' : 'absolute',
                inset: 0,
                opacity: active === i ? 1 : 0,
                transform: active === i ? 'scale(1)' : 'scale(1.03)',
                transition: 'opacity .7s ease, transform .7s ease',
                pointerEvents: active === i ? 'auto' : 'none'
              }}>
                <img
                  src={slide.img}
                  alt={slide.tag}
                  style={{ width: '100%', height: 340, objectFit: 'cover', display: 'block' }}
                />
                {/* overlay gradient */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.1) 55%, transparent 100%)'
                }} />
                {/* caption */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 22px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#60a5fa',
                    textTransform: 'uppercase', letterSpacing: 1.2,
                    background: 'rgba(74,124,255,.2)', border: '1px solid rgba(96,165,250,.3)',
                    borderRadius: 20, padding: '3px 10px', display: 'inline-block', marginBottom: 8
                  }}>{slide.tag}</span>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>
                    {slide.title}
                  </div>
                </div>
              </div>
            ))}

            {/* Dot indicators */}
            <div style={{
              position: 'absolute', bottom: 14, right: 16,
              display: 'flex', gap: 6, zIndex: 10
            }}>
              {HERO_SLIDES.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} style={{
                  width: active === i ? 22 : 7, height: 7,
                  borderRadius: 4, border: 'none', cursor: 'pointer',
                  background: active === i ? '#4a7cff' : 'rgba(255,255,255,.45)',
                  transition: 'all .35s ease', padding: 0
                }} />
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,.15)' }}>
              <div style={{
                height: '100%', background: '#4a7cff',
                animation: 'heroProgress 3.8s linear infinite',
                key: active
              }} />
            </div>
          </div>

          {/* Slide counter */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{String(active + 1).padStart(2, '0')}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.35)' }}>/ {String(HERO_SLIDES.length).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* bottom fade */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to bottom, transparent, #e8ecf4)', pointerEvents: 'none' }} />
    </div>
  );
};

// ── Widget Section ──────────────────────────────────────────────
const WIDGET_TYPES = [
  { key: 'trending', label: '🔥 Trending Now', icon: <FireOutlined />, color: '#4a7cff' },
  { key: 'popular', label: '📈 Most Popular', icon: <EyeOutlined />, color: '#00b894' },
  { key: 'quicklinks', label: '🎯 Quick Links', icon: <GlobalOutlined />, color: '#6c5ce7' },
  { key: 'editorspick', label: '⭐ Editor\'s Picks', icon: <ReadOutlined />, color: '#e17055' },
];

const WidgetSection = ({ articles, onWidgetClick, navigate }) => {
  const [activeWidget, setActiveWidget] = useState('trending');
  const [scrollPosition, setScrollPosition] = useState(0);
  const widgetRef = useRef(null);
  const [showArrows, setShowArrows] = useState({ left: false, right: true });

  // Widget data mapping
  const getWidgetData = (type) => {
    const baseArticles = articles?.slice(0, 8) || [];
    switch(type) {
      case 'trending':
        return baseArticles.filter(a => a.view_count > 100).slice(0, 6);
      case 'popular':
        return [...baseArticles].sort((a,b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 6);
      case 'quicklinks':
        return [
          { id: 'ql1', title: 'Submit Your Article', icon: '📝', link: '/submit-article' },
          { id: 'ql2', title: 'Become a Contributor', icon: '✍️', link: '/contributor' },
          { id: 'ql3', title: 'Advertise With Us', icon: '📢', link: '/advertise' },
          { id: 'ql4', title: 'Newsletter Archive', icon: '📧', link: '/newsletter' },
          { id: 'ql5', title: 'Editorial Calendar', icon: '📅', link: '/editorial-calendar' },
          { id: 'ql6', title: 'Media Kit', icon: '📋', link: '/media-kit' },
        ];
      case 'editorspick':
        return baseArticles.filter((_, i) => i % 3 === 0).slice(0, 5);
      default:
        return baseArticles.slice(0, 6);
    }
  };

  const widgetData = getWidgetData(activeWidget);
  const currentWidget = WIDGET_TYPES.find(w => w.key === activeWidget);

  // Scroll handlers
  const handleScroll = (direction) => {
    const container = widgetRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.8;
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;
    container.scrollTo({ left: targetScroll, behavior: 'smooth' });
  };

  const handleScrollUpdate = () => {
    const container = widgetRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setScrollPosition(scrollLeft);
    setShowArrows({
      left: scrollLeft > 20,
      right: scrollLeft < scrollWidth - clientWidth - 20
    });
  };

  useEffect(() => {
    const container = widgetRef.current;
    if (container) {
      container.addEventListener('scroll', handleScrollUpdate);
      handleScrollUpdate();
      return () => container.removeEventListener('scroll', handleScrollUpdate);
    }
  }, [activeWidget]);

  return (
    <div style={{ margin: '40px 0', position: 'relative' }}>
      {/* Widget Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 4, height: 22, background: currentWidget?.color || '#4a7cff', borderRadius: 4 }} />
          <span style={{ fontSize: 20, color: currentWidget?.color || '#4a7cff' }}>{currentWidget?.icon}</span>
          <span style={{ fontWeight: 700, fontSize: 20, color: '#1a1a2e' }}>{currentWidget?.label}</span>
          <span style={{
            background: `${currentWidget?.color || '#4a7cff'}15`, 
            color: currentWidget?.color || '#4a7cff',
            fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 12,
            marginLeft: 4
          }}>
            {widgetData.length} items
          </span>
        </div>
        
        {/* Widget Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {WIDGET_TYPES.map(w => (
            <button
              key={w.key}
              onClick={() => setActiveWidget(w.key)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: activeWidget === w.key ? w.color : '#f4f6ff',
                color: activeWidget === w.key ? '#fff' : w.color,
                border: activeWidget === w.key ? `1px solid ${w.color}` : '1px solid #dce6ff',
                cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap',
                boxShadow: activeWidget === w.key ? `0 2px 12px ${w.color}40` : 'none'
              }}
            >
              {w.icon} {w.label.split(' ').slice(1).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Widget Carousel Container */}
      <div style={{ position: 'relative' }}>
        {/* Navigation Arrows */}
        {showArrows.left && (
          <button
            onClick={() => handleScroll('left')}
            style={{
              position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)',
              zIndex: 5, width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#1a1a2e', transition: 'all .2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
          >
            ❮
          </button>
        )}
        {showArrows.right && (
          <button
            onClick={() => handleScroll('right')}
            style={{
              position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
              zIndex: 5, width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#1a1a2e', transition: 'all .2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
          >
            ❯
          </button>
        )}

        {/* Widget Items */}
        <div
          ref={widgetRef}
          style={{
            display: 'flex', gap: 16, overflowX: 'auto', scrollSnapType: 'x mandatory',
            padding: '8px 4px 16px', scrollBehavior: 'smooth',
            scrollbarWidth: 'none', msOverflowStyle: 'none'
          }}
          className="widget-scroll"
        >
          {widgetData.map((item, index) => (
            <div
              key={item.id || index}
              onClick={() => {
                if (item.link) {
                  navigate(item.link);
                } else if (item.slug) {
                  navigate(`/article/${item.slug}`);
                }
                if (onWidgetClick) onWidgetClick(item);
              }}
              style={{
                flex: '0 0 180px', scrollSnapAlign: 'start',
                background: '#fff', borderRadius: 14, padding: '18px 16px',
                border: `1px solid ${currentWidget?.color || '#4a7cff'}22`,
                boxShadow: `0 2px 12px ${currentWidget?.color || '#4a7cff'}0d`,
                cursor: 'pointer', transition: 'all .25s ease',
                display: 'flex', flexDirection: 'column',
                minHeight: 140, position: 'relative'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = `0 12px 32px ${currentWidget?.color || '#4a7cff'}25`;
                e.currentTarget.style.borderColor = currentWidget?.color || '#4a7cff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 2px 12px ${currentWidget?.color || '#4a7cff'}0d`;
                e.currentTarget.style.borderColor = `${currentWidget?.color || '#4a7cff'}22`;
              }}
            >
              {/* Item number badge */}
              <span style={{
                position: 'absolute', top: 8, right: 10,
                fontSize: 10, fontWeight: 700, color: `${currentWidget?.color || '#4a7cff'}40`
              }}>#{index + 1}</span>

              {/* Quick links special rendering */}
              {item.icon && item.link ? (
                <>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e', flex: 1 }}>
                    {item.title}
                  </div>
                  <span style={{
                    fontSize: 11, color: currentWidget?.color || '#4a7cff',
                    marginTop: 8, display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    Explore <ArrowRightOutlined style={{ fontSize: 10 }} />
                  </span>
                </>
              ) : (
                <>
                  {/* Category tag */}
                  {item.category_name && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: currentWidget?.color || '#4a7cff',
                      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6
                    }}>
                      {item.category_name}
                    </span>
                  )}
                  <div style={{
                    fontWeight: 600, fontSize: 14, lineHeight: 1.4, color: '#1a1a2e',
                    flex: 1, display: '-webkit-box', WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    marginTop: 10, fontSize: 11, color: '#9ca3af',
                    borderTop: '1px solid #f3f4f6', paddingTop: 8
                  }}>
                    <span><EyeOutlined style={{ marginRight: 3 }} />{item.view_count || 0}</span>
                    {item.published_date && (
                      <span><CalendarOutlined style={{ marginRight: 3 }} />
                        {moment(item.published_date).format('MMM D')}
                      </span>
                    )}
                  </div>
                  {/* Progress bar */}
                  {item.view_count && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: 3, background: `${currentWidget?.color || '#4a7cff'}15`,
                      borderRadius: '0 0 14px 14px', overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%', background: currentWidget?.color || '#4a7cff',
                        width: `${Math.min((item.view_count / 500) * 100, 100)}%`,
                        borderRadius: '0 0 14px 14px'
                      }} />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8
      }}>
        {widgetData.slice(0, 5).map((_, i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: i === Math.round(scrollPosition / 200) % 5 
              ? currentWidget?.color || '#4a7cff' 
              : '#dce6ff',
            transition: 'all .3s'
          }} />
        ))}
      </div>
    </div>
  );
};

// ── Main Home ────────────────────────────────────────────────────
const Home = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ articles: [], blogs: [], news: [], interviews: [] });
  const [stats, setStats] = useState({ totalPublished: 0, totalViews: 0, totalAuthors: 0, totalCategories: 0 });
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [searchVal, setSearchVal] = useState('');
  const [activeTab, setActiveTab] = useState(null);
  const [tabData, setTabData] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const catSectionRef = useRef(null);

  useEffect(() => { fetchHomeData(); }, []);

  useEffect(() => {
    if (!activeTab) { setTabData([]); return; }
    setTabLoading(true);
    const tab = CAT_TABS.find(c => c.key === activeTab);
    const qs = tab?.param === 'content_type'
      ? `content_type=${tab.key}`
      : `category=${tab?.key}`;
    axios.get(`/api/public/content?status=published&${qs}&limit=8`)
      .then(r => setTabData(r.data?.data || []))
      .catch(() => setTabData([]))
      .finally(() => {
        setTabLoading(false);
       });
  }, [activeTab]);

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
      setData({
        articles:   aR.data?.data || [],
        blogs:      bR.data?.data || [],
        news:       nR.data?.data || [],
        interviews: iR.data?.data || [],
      });
      setStats(sR.data || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchVal.trim().length >= 2)
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
  };

  if (loading) return (
    <div style={{ padding: '40px 0' }}>
      <Skeleton active paragraph={{ rows: 3 }} style={{ marginBottom: 32 }} />
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );

  const [featuredArticle, ...restArticles] = data.articles;

  return (
    <div style={{ paddingBottom: 60, background: '#e8ecf4', minHeight: '100vh' }}>
      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}

      {/* ── Hero ── */}
      <HeroSection searchVal={searchVal} setSearchVal={setSearchVal} handleSearch={handleSearch} />

      {/* ── Ticker ── */}
      {data.news.length > 0 && <TickerStrip items={data.news} />}

      {/* ── Main content ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>

        {/* ── Widget Section ── */}
        <WidgetSection 
          articles={data.articles} 
          navigate={navigate}
          onWidgetClick={(item) => {
            // Analytics tracking
            console.log('Widget clicked:', item);
            // You can add GA/GTM tracking here
          }} 
        />

        {/* Category pills */}
        <CategoryNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* ── Category filtered content ── */}
        <div ref={catSectionRef}>
          {activeTab && (
            <div style={{ margin: '24px 0 40px', minHeight: 120 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 4, height: 22, background: '#4a7cff', borderRadius: 4, display: 'inline-block' }} />
                  <span style={{ fontWeight: 700, fontSize: 18, color: '#1a1a2e' }}>
                    {CAT_TABS.find(c => c.key === activeTab)?.label}
                  </span>
                  {!tabLoading && <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>({tabData.length} results)</span>}
                </div>
                <button onClick={() => setActiveTab(null)} style={{
                  fontSize: 12, color: '#6b7280', background: '#f3f4f6', border: '1px solid #e5e7eb',
                  borderRadius: 20, padding: '4px 14px', cursor: 'pointer'
                }}>✕ Clear</button>
              </div>
              {tabLoading ? (
                <Row gutter={[20, 20]}>
                  {[1,2,3,4].map(i => <Col xs={24} sm={12} lg={6} key={i}><Skeleton active /></Col>)}
                </Row>
              ) : tabData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 14 }}>
                  No content found for this category yet.
                </div>
              ) : (
                <Row gutter={[20, 20]}>
                  {tabData.map(a => (
                    <Col xs={24} sm={12} lg={6} key={a.id}>
                      <HeroCard article={a} navigate={navigate} onImgClick={(src, alt) => setLightbox({ src, alt })} accent="#4a7cff" />
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          )}
        </div>

        {/* ── Featured Articles ── */}
        {data.articles.length > 0 && (
          <RevealSection>
            <SectionHead icon={<FireOutlined />} label="Featured Articles" viewAllTo="/articles" accent="#4a7cff" />
            <Row gutter={[20, 20]}>
              {/* Big featured card */}
              {featuredArticle && (
                <Col xs={24} lg={14}>
                  <div style={{
                    borderRadius: 16, overflow: 'hidden', background: '#fff',
                    boxShadow: '0 2px 20px rgba(0,0,0,0.11)', cursor: 'pointer', height: '100%',
                    transition: 'transform .25s, box-shadow .25s'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 36px rgba(74,124,255,.18)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 20px rgba(0,0,0,0.11)'; }}
                    onClick={() => navigate(`/article/${featuredArticle.slug}`)}
                  >
                    <div style={{ lineHeight: 0, cursor: 'zoom-in', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}
                      onClick={e => { e.stopPropagation(); if (featuredArticle.banner_image) setLightbox({ src: `/uploads/${featuredArticle.banner_image}`, alt: featuredArticle.title }); }}>
                      {featuredArticle.banner_image
                        ? <img src={`/uploads/${featuredArticle.banner_image}`} alt={featuredArticle.title}
                            style={{ width: '100%', height: 'auto', display: 'block' }} />
                        : <div style={{ height: 200, background: 'linear-gradient(135deg,#e8f0ff,#f0f4ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ReadOutlined style={{ fontSize: 32, color: '#c0cfe8' }} />
                          </div>
                      }
                      <div style={{ position: 'absolute', top: 12, left: 12 }}>
                        <span style={{ background: '#4a7cff', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, letterSpacing: .5 }}>
                          ⭐ FEATURED
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: '22px 24px 24px' }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                        {featuredArticle.category_name && <Tag color="blue" style={{ borderRadius: 20, fontSize: 11, border: 'none', background: '#e8f0ff', color: '#3b6fd4' }}>{featuredArticle.category_name}</Tag>}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1.4, color: '#1a1a2e', marginBottom: 10 }}>
                        {featuredArticle.title}
                      </div>
                      <div style={{ fontSize: 14, color: '#6c6c80', lineHeight: 1.7, marginBottom: 16,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {featuredArticle.short_description}
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#adb5bd', borderTop: '1px solid #f4f4f8', paddingTop: 14 }}>
                        <span><EyeOutlined style={{ marginRight: 4 }} />{featuredArticle.view_count || 0}</span>
                        <span><CalendarOutlined style={{ marginRight: 4 }} />{moment(featuredArticle.published_date || featuredArticle.created_at).format('MMM D, YYYY')}</span>
                      </div>
                    </div>
                  </div>
                </Col>
              )}
              {/* Side list */}
              <Col xs={24} lg={10} style={{ display: 'flex' }}>
                <div style={{ background: '#fff', borderRadius: 16, padding: '20px 20px 8px', boxShadow: '0 2px 20px rgba(0,0,0,0.11)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  {restArticles.slice(0, 5).map((a, i, arr) => (
                    <ListCard key={a.id} article={a} navigate={navigate} isLast={i === arr.length - 1} onImgClick={(src, alt) => setLightbox({ src, alt })} />
                  ))}
                </div>
              </Col>
            </Row>
          </RevealSection>
        )}

        {/* Stats */}
        <StatsBar stats={stats} />

        {/* ── Latest News ── */}
        {data.news.length > 0 && (
          <RevealSection delay={80}>
            <SectionHead icon={<GlobalOutlined />} label="Latest News" viewAllTo="/news" accent="#00b894" />
            <Row gutter={[20, 20]}>
              {data.news.map(a => (
                <Col xs={24} sm={12} lg={6} key={a.id}>
                  <HeroCard article={a} navigate={navigate} onImgClick={(src, alt) => setLightbox({ src, alt })} accent="#00b894" />
                </Col>
              ))}
            </Row>
          </RevealSection>
        )}

        {/* ── Latest Blogs ── */}
        {data.blogs.length > 0 && (
          <RevealSection delay={100}>
            <div style={{ marginTop: 48 }}>
              <SectionHead icon={<ReadOutlined />} label="Latest Blogs" viewAllTo="/blogs" accent="#6c5ce7" />
              <Row gutter={[20, 20]}>
                {data.blogs.map(a => (
                  <Col xs={24} sm={12} lg={6} key={a.id}>
                    <HeroCard article={a} navigate={navigate} onImgClick={(src, alt) => setLightbox({ src, alt })} accent="#6c5ce7" />
                  </Col>
                ))}
              </Row>
            </div>
          </RevealSection>
        )}

        {/* Why Publish With Us */}
        <WhyPublishSection />

        {/* Publishing Solutions */}
        <PublishingSolutions />

        {/* Newsletter */}
        <NewsletterBox />

        {/* ── Interviews ── */}
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

      {/* CSS for animations and responsive design */}
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes heroProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .widget-scroll::-webkit-scrollbar {
          display: none;
        }
        .stats-grid, .why-grid, .solutions-grid {
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 768px) {
          .stats-grid, .why-grid, .solutions-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .stats-grid, .why-grid, .solutions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;