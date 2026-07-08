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
const CategoryNav = () => {
  const cats = [
    { label: 'AI & ML', to: '/category/artificial-intelligence' },
    { label: 'Cybersecurity', to: '/category/cybersecurity' },
    { label: 'Cloud', to: '/category/cloud-computing' },
    { label: 'DevOps', to: '/category/devops' },
    { label: 'Data Analytics', to: '/category/data-analytics' },
    { label: 'FinTech', to: '/category/fintech' },
    { label: 'Healthcare IT', to: '/category/healthcare' },
    { label: 'Interviews', to: '/interviews' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '28px 0 36px' }}>
      {cats.map(c => (
        <Link key={c.label} to={c.to} style={{
          padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
          background: '#f4f6ff', color: '#4a7cff', border: '1px solid #dce6ff',
          textDecoration: 'none', transition: 'all .2s',
          whiteSpace: 'nowrap'
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#4a7cff'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f4f6ff'; e.currentTarget.style.color = '#4a7cff'; }}
        >
          {c.label}
        </Link>
      ))}
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
            In-depth articles, expert interviews, breaking news and research across AI, Cloud, Cybersecurity, DevOps and more — curated for technology leaders.
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

// ── Main Home ────────────────────────────────────────────────────
const Home = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ articles: [], blogs: [], news: [], interviews: [] });
  const [stats, setStats] = useState({ totalPublished: 0, totalViews: 0, totalAuthors: 0, totalCategories: 0 });
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [searchVal, setSearchVal] = useState('');

  useEffect(() => { fetchHomeData(); }, []);

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

        {/* Category pills */}
        <CategoryNav />

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
                  {restArticles.slice(0, 4).map((a, i, arr) => (
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
    </div>
  );
};

export default Home;
