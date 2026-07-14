// Home.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Tag, Skeleton } from 'antd';
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

// ── Stats bar (Premium Floating Glassmorphism) ───────────────────
const StatsBar = ({ stats }) => {
  const [ref, visible] = useReveal();
  
  const items = [
    { label: 'Articles Published', value: stats.totalPublished, icon: <FileTextOutlined />, color: '#3b82f6', bgGlow: 'rgba(59, 130, 246, 0.15)', offset: 0, info: 'Updated Today' },
    { label: 'Total Views', value: stats.totalViews, icon: <EyeOutlined />, color: '#10b981', bgGlow: 'rgba(16, 185, 129, 0.15)', offset: 12, info: 'Live Statistics' },
    { label: 'Contributors', value: stats.totalAuthors, icon: <TeamOutlined />, color: '#f97316', bgGlow: 'rgba(249, 115, 22, 0.15)', offset: -8, info: 'Active writers' },
    { label: 'Tech Categories', value: stats.totalCategories, icon: <FolderOpenOutlined />, color: '#8b5cf6', bgGlow: 'rgba(139, 92, 246, 0.15)', offset: 6, info: 'Live Catalog' },
  ];

  return (
    <div ref={ref} style={{
      margin: '64px -20px', padding: '80px 20px 96px',
      background: 'linear-gradient(180deg, #F8FBFF 0%, #EEF5FF 55%, #EAF2FF 100%)',
      borderRadius: 32, position: 'relative', overflow: 'hidden'
    }}>
      {/* Background ambient glowing blobs */}
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: 250, height: 250, background: 'rgba(59, 130, 246, 0.12)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 300, height: 300, background: 'rgba(139, 92, 246, 0.1)', filter: 'blur(90px)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{ textAlign: 'center', marginBottom: 54, position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 3 }}>By The Numbers</span>
        <h2 style={{ fontSize: 'clamp(28px, 3.2vw, 44px)', fontWeight: 850, color: '#0b1f4d', margin: '10px 0 12px', letterSpacing: '-1px', lineHeight: 1.15 }}>Trusted by Tech Professionals</h2>
        <p style={{ color: '#4a5568', fontSize: 16, margin: 0, fontWeight: 500 }}>Insights into our growing developer community.</p>
      </div>

      <div className="glass-stats-grid" style={{
        maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, position: 'relative', zIndex: 1
      }}>
        {items.map((s, i) => {
          const num = useCountUp(Number(s.value) || 0, visible);
          return (
            <div key={i} className="glass-stat-card" style={{
              background: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: 24, padding: '32px 28px',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 10px 30px rgba(11, 31, 77, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              transform: visible ? `translateY(${s.offset}px)` : 'translateY(40px)',
              opacity: visible ? 1 : 0,
              transition: `opacity .6s ease ${i * 100}ms, transform .6s cubic-bezier(0.25, 1, 0.5, 1) ${i * 100}ms, box-shadow .3s ease, border-color .3s ease`
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = `translateY(${s.offset - 12}px) scale(1.02)`;
              e.currentTarget.style.boxShadow = `0 20px 40px rgba(11, 31, 77, 0.08), 0 0 16px ${s.color}25, inset 0 1px 0 rgba(255, 255, 255, 0.9)`;
              e.currentTarget.style.borderColor = `${s.color}60`;
              e.currentTarget.querySelector('.glass-icon-wrapper').style.transform = 'rotate(5deg) scale(1.05)';
              e.currentTarget.querySelector('.glass-number').style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = `translateY(${s.offset}px) scale(1)`;
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(11, 31, 77, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
              e.currentTarget.querySelector('.glass-icon-wrapper').style.transform = 'rotate(0deg) scale(1)';
              e.currentTarget.querySelector('.glass-number').style.transform = 'scale(1)';
            }}
            >
              <div>
                <div className="glass-icon-wrapper" style={{
                  width: 52, height: 52, borderRadius: '50%', background: s.bgGlow, color: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                  marginBottom: 24, transition: 'transform .3s ease',
                  border: `1px solid ${s.color}22`
                }}>{s.icon}</div>
                
                <div className="glass-number" style={{
                  fontSize: 48, fontWeight: 800, color: '#0b1f4d', lineHeight: 1,
                  letterSpacing: '-1.5px', marginBottom: 10, transition: 'transform .3s ease',
                  transformOrigin: 'left bottom'
                }}>
                  {num.toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 6 }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                  {s.info}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
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

const CategoryNav = ({ activeTab, setActiveTab }) => (
  <div style={{ margin: '32px 0 24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <span style={{ width: 4, height: 20, background: 'var(--color-primary)', borderRadius: 4, display: 'inline-block' }} />
      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-heading)' }}>Browse by Category</span>
    </div>
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {CAT_TABS.map(c => {
        const isActive = activeTab === c.key;
        return (
          <button
            key={c.key}
            onClick={() => setActiveTab(c.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '12px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: isActive ? c.color : 'var(--color-surface)',
              color: isActive ? '#fff' : 'var(--color-heading)',
              border: isActive ? `1.5px solid ${c.color}` : '1.5px solid var(--color-border)',
              cursor: 'pointer', whiteSpace: 'nowrap',
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
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-heading)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
              }
            }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  </div>
);

// ── Why Publish With Us ─────────────────────────────────────────
const WHY_ITEMS = [
  { title: 'Targeted B2B Audience', desc: 'Reach 200,000+ verified IT decision-makers, CXOs, and tech buyers across industries.' },
  { title: 'Measurable ROI', desc: 'Real-time analytics dashboard: track impressions, leads, downloads and engagement.' },
  { title: 'Thought Leadership', desc: 'Position your brand as an industry authority with expert-curated editorial placement.' },
  { title: 'Multi-Channel Distribution', desc: 'Your content amplified via newsletter, social, SEO and partner syndication networks.' },
  { title: 'Fast-Track Publishing', desc: 'Dedicated editorial team ensures your content goes live within 48 hours of approval.' },
  { title: 'Dedicated Account Manager', desc: 'White-glove support from strategy to execution, with a single point of contact for your team.' },
];

const WhyPublishSection = () => {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{ margin: '56px 0', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity .6s ease, transform .6s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 2 }}>Why Choose Us</span>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-heading)', margin: '8px 0 12px', lineHeight: 1.2 }}>The Smartest Way to Publish in B2B Tech</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: 15, maxWidth: 520, margin: '0 auto' }}>From whitepapers to webinars, we give your content the reach, credibility and conversions it deserves.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="why-grid">
        {WHY_ITEMS.map((item, i) => (
          <div key={i} style={{
            background: 'var(--color-surface)', borderRadius: 16, padding: '28px 24px',
            border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(74,124,255,0.06)',
            transition: 'transform .22s, box-shadow .22s',
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transitionDelay: `${i * 80}ms`
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(74,124,255,0.14)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(74,124,255,0.06)'; }}
          >
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-heading)', marginBottom: 8 }}>{item.title}</div>
            <div style={{ fontSize: 13.5, color: 'var(--color-muted)', lineHeight: 1.65 }}>{item.desc}</div>
            <div style={{ marginTop: 18, height: 3, borderRadius: 2, background: 'var(--color-primary)', width: '40%' }} />
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 36 }}>
        <Link to="/register" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--color-accent)', color: '#fff', fontWeight: 700, fontSize: 15,
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

// ── Publishing Solutions ─────────────────────────────────────────
const SOLUTIONS = [
  { accent: 'var(--color-primary)', bg: 'var(--color-primary-light)', label: 'Articles & Blogs', desc: 'Long-form thought leadership, how-tos and opinion pieces that rank on Google and drive organic traffic.', tags: ['SEO Optimised', 'Editorial Review', 'Author Profile'] },
  { accent: 'var(--color-success)', bg: 'var(--color-primary-light)', label: 'Whitepapers & Reports', desc: 'Gated research assets that generate qualified leads. We handle design, hosting and lead capture forms.', tags: ['Lead Gen', 'Branded Design', 'CRM Integration'] },
  { accent: 'var(--color-accent)', bg: 'var(--color-primary-light)', label: 'Webinars & Events', desc: 'Live and on-demand virtual events promoted to our engaged audience of IT professionals.', tags: ['Registration Page', 'Email Promotion', 'Recording Hosting'] },
  { accent: 'var(--color-primary)', bg: 'var(--color-primary-light)', label: 'Sponsored News', desc: 'Get your product launches, partnerships and announcements in front of the right audience instantly.', tags: ['Instant Publish', 'Homepage Feature', 'Newsletter Blast'] },
];

const PublishingSolutions = () => {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{ margin: '56px 0', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity .6s ease, transform .6s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6c5ce7', textTransform: 'uppercase', letterSpacing: 2 }}>Publishing Solutions</span>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--color-heading)', margin: '8px 0 10px' }}>Content Formats Built for B2B Impact</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: 14.5, maxWidth: 480, margin: '0 auto' }}>Choose the format that fits your marketing goals. We handle the rest.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }} className="solutions-grid">
        {SOLUTIONS.map((s, i) => (
          <div key={i} style={{
            background: 'var(--color-surface)', borderRadius: 18, overflow: 'hidden',
            border: `1px solid ${s.accent}22`, boxShadow: `0 4px 18px ${s.accent}0d`,
            transition: 'transform .22s, box-shadow .22s',
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${i * 90}ms`
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 16px 36px ${s.accent}22`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 18px ${s.accent}0d`; }}
          >
            <div style={{ height: 5, background: s.accent }} />
            <div style={{ padding: '24px 22px 26px' }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-heading)', marginBottom: 10 }}>{s.label}</div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.65, marginBottom: 18 }}>{s.desc}</div>
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
    <div ref={ref} style={{
      background: 'var(--color-primary)', borderRadius: 20, padding: '48px 40px', textAlign: 'center', margin: '48px 0',
      opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(.97)', transition: 'opacity .6s ease, transform .6s ease'
    }}>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Stay Ahead of the Curve</div>
      <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: '0 0 10px' }}>Get the Latest Tech Insights</h2>
      <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 15, margin: '0 0 28px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
        Join 50,000+ tech professionals. Weekly digest of AI, cloud, cybersecurity & more.
      </p>
      <div style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
        <input placeholder="Enter your email address" style={{ flex: 1, minWidth: 220, padding: '12px 18px', borderRadius: 10, border: 'none', fontSize: 14, outline: 'none', background: 'rgba(255,255,255,.95)' }} />
        <button style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: 'var(--color-heading)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>Subscribe Free</button>
      </div>
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

const HeroSection = ({ searchVal, setSearchVal, handleSearch }) => {
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);
  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setActive(prev => (prev + 1) % HERO_SLIDES.length), 3800);
  };
  useEffect(() => { startTimer(); return () => clearInterval(timerRef.current); }, []);
  const goTo = i => { setActive(i); startTimer(); };

  return (
    <div style={{ background: 'var(--color-primary)', position: 'relative', overflow: 'hidden', minHeight: 520 }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 30%, rgba(247,148,29,0.15) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.12) 0%, transparent 40%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center', minHeight: 520 }} className="hero-grid">
        {/* LEFT */}
        <div style={{ padding: '60px 0', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 24, padding: '6px 16px', marginBottom: 24 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', display: 'inline-block', boxShadow: '0 0 0 4px rgba(247,148,29,0.2)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.9)', fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase' }}>Live Tech Intelligence</span>
          </div>
          <h1 style={{ color: '#fff', fontWeight: 900, lineHeight: 1.1, fontSize: 'clamp(28px, 3.7vw, 52px)', margin: '0 0 20px', letterSpacing: -0.8 }}>
            Your Gateway to<br />
            <span className="orange-shimmer-text">Tech Insights</span> & Innovation
          </h1>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 16, lineHeight: 1.8, margin: '0 0 36px', maxWidth: 480 }}>
            In-depth articles, expert interviews, breaking news and research across AI, Cloud, Cybersecurity, DevOps and more.
          </p>
          <div style={{ display: 'flex', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,.35)', maxWidth: 500 }}>
            <input value={searchVal} onChange={e => setSearchVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search articles, news, resources..."
              style={{ flex: 1, padding: '15px 20px', border: 'none', fontSize: 15, outline: 'none', background: 'rgba(255,255,255,.95)', color: 'var(--color-heading)' }} />
            <button onClick={handleSearch} style={{ padding: '0 22px', background: 'var(--color-accent)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.background = '#e67e00'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-accent)'}
            ><SearchOutlined /></button>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 26, flexWrap: 'wrap' }}>
            {['AI & ML', 'Cybersecurity', 'Cloud', 'DevOps'].map(t => (
              <span key={t} style={{ fontSize: 12.5, color: 'rgba(255,255,255,.85)', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 22, padding: '6px 16px', cursor: 'pointer', transition: 'all .25s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.18)'; }}
              >{t}</span>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ padding: '40px 0', position: 'relative', zIndex: 2 }}>
          <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.55)', border: '1px solid rgba(255,255,255,.1)' }}>
            {HERO_SLIDES.map((slide, i) => (
              <div key={i} style={{ position: i === 0 ? 'relative' : 'absolute', inset: 0, opacity: active === i ? 1 : 0, transform: active === i ? 'scale(1)' : 'scale(1.05)', transition: 'opacity 0.8s ease, transform 0.8s ease', pointerEvents: active === i ? 'auto' : 'none' }}>
                <img src={slide.img} alt={slide.tag} style={{ width: '100%', height: 360, objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,31,77,.85) 0%, rgba(11,31,77,.2) 50%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 26px', background: 'linear-gradient(to top, rgba(11,31,77,.95), transparent)' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: 1.3, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 20, padding: '4px 12px', display: 'inline-block', marginBottom: 10 }}>{slide.tag}</span>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, lineHeight: 1.4 }}>{slide.title}</div>
                </div>
              </div>
            ))}
            <div style={{ position: 'absolute', bottom: 18, right: 18, display: 'flex', gap: 8, zIndex: 10 }}>
              {HERO_SLIDES.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} style={{ width: active === i ? 28 : 8, height: 8, borderRadius: 10, border: 'none', cursor: 'pointer', background: active === i ? 'var(--color-accent)' : 'rgba(255,255,255,.4)', transition: 'all .3s', padding: 0 }} />
              ))}
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,.18)' }}>
              <div style={{ height: '100%', background: 'var(--color-accent)', animation: 'heroProgress 3.8s linear infinite', boxShadow: '0 0 12px rgba(247,148,29,.4)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12, gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', background: 'rgba(255,255,255,.1)', padding: '4px 10px', borderRadius: 8 }}>{String(active + 1).padStart(2, '0')}</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>/ {String(HERO_SLIDES.length).padStart(2, '0')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Ticker strip ─────────────────────────────────────────────────
const TickerStrip = ({ items }) => {
  const doubled = [...items, ...items];
  return (
    <div style={{ background: 'var(--color-primary)', overflow: 'hidden', padding: '9px 0' }}>
      <div style={{ display: 'flex', animation: 'ticker 28s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ fontSize: 13, color: '#fff', fontWeight: 500, padding: '0 32px', opacity: .92 }}>
            <FireOutlined style={{ marginRight: 6, color: 'var(--color-accent)' }} />{item.title}
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Section wrapper with reveal ──────────────────────────────────
const RevealSection = ({ children, delay = 0 }) => {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: `opacity .55s ease ${delay}ms, transform .55s ease ${delay}ms` }}>
      {children}
    </div>
  );
};

// ── Section header ───────────────────────────────────────────────
const SectionHead = ({ icon, label, viewAllTo, accent = 'var(--color-primary)' }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 4, height: 22, background: accent, borderRadius: 4, display: 'inline-block' }} />
      <span style={{ fontSize: 18, color: accent, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-heading)' }}>{label}</span>
    </div>
    <Link to={viewAllTo} style={{ fontSize: 13, color: accent, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '5px 14px', borderRadius: 20, border: '1px solid var(--color-border)', background: 'var(--color-primary-light)', transition: 'background .2s' }}>
      View All <ArrowRightOutlined style={{ fontSize: 11 }} />
    </Link>
  </div>
);

// ── Magazine HeroCard ────────────────────────────────────────────
const HeroCard = ({ article, navigate, onImgClick, accent = 'var(--color-primary)' }) => (
  <div onClick={() => navigate(`/article/${article.slug}`)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 14, overflow: 'hidden', background: 'var(--color-surface)', boxShadow: '0 2px 16px rgba(0,0,0,0.10)', border: '1px solid var(--color-border)', transition: 'transform .22s, box-shadow .22s' }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.15)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.10)'; }}
  >
    <div style={{ position: 'relative', lineHeight: 0, overflow: 'hidden' }} onClick={e => { e.stopPropagation(); if (article.banner_image) onImgClick(`/uploads/${article.banner_image}`, article.title); }}>
      {article.banner_image
        ? <img src={`/uploads/${article.banner_image}`} alt={article.title} style={{ width: '100%', height: 'auto', display: 'block', transition: 'transform .4s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
        : <div style={{ height: 180, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ReadOutlined style={{ fontSize: 32, color: 'var(--color-primary)' }} /></div>
      }
      {article.content_type_name && <span style={{ position: 'absolute', top: 10, left: 10, background: accent, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: .6, textTransform: 'uppercase' }}>{article.content_type_name}</span>}
    </div>
    <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
      {article.category_name && <span style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8, display: 'block' }}>{article.category_name}</span>}
      <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.45, color: 'var(--color-heading)', marginBottom: 8, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</div>
      <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.short_description}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--color-border)', fontSize: 11.5, color: 'var(--color-muted)' }}>
        <span><CalendarOutlined style={{ marginRight: 4 }} />{moment(article.published_date || article.created_at).format('MMM D, YYYY')}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><EyeOutlined />{article.view_count || 0}</span>
      </div>
    </div>
  </div>
);

// ── Compact list card ────────────────────────────────────────────
const ListCard = ({ article, navigate, onImgClick, isLast }) => (
  <div style={{ display: 'flex', gap: 12, padding: '12px 0', flex: 1, borderBottom: isLast ? 'none' : '1px solid var(--color-border)', cursor: 'pointer', borderRadius: 8, transition: 'padding-left .18s', alignItems: 'center' }}
    onMouseEnter={e => e.currentTarget.style.paddingLeft = '6px'}
    onMouseLeave={e => e.currentTarget.style.paddingLeft = '0'}
    onClick={() => navigate(`/article/${article.slug}`)}
  >
    <div style={{ width: 76, height: 56, flexShrink: 0, borderRadius: 8, overflow: 'hidden', lineHeight: 0 }} onClick={e => { e.stopPropagation(); if (article.banner_image) onImgClick(`/uploads/${article.banner_image}`, article.title); }}>
      {article.banner_image
        ? <img src={`/uploads/${article.banner_image}`} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: 76, height: 56, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ReadOutlined style={{ color: 'var(--color-primary)', fontSize: 16 }} /></div>
      }
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      {article.category_name && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: .6 }}>{article.category_name} · </span>}
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-heading)', lineHeight: 1.4, margin: '2px 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</div>
      <span style={{ fontSize: 11, color: 'var(--color-muted)' }}><CalendarOutlined style={{ marginRight: 3 }} />{moment(article.published_date || article.created_at).format('MMM D, YYYY')}</span>
    </div>
  </div>
);

// ── Latest Posts Section (shadcn Cards) ─────────────────────────
const LatestArticlesSection = ({ articles, blogs, navigate }) => {
  const combined = [...(articles || []), ...(blogs || [])]
    .sort((a, b) => new Date(b.published_date || b.created_at) - new Date(a.published_date || a.created_at))
    .slice(0, 4);
  const [ref, visible] = useReveal();
  if (!combined.length) return null;
  return (
    <div ref={ref} style={{ margin: '48px 0', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity .6s ease, transform .6s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 4, height: 24, background: 'var(--color-primary)', borderRadius: 4, display: 'inline-block' }} />
          <span style={{ fontSize: 20, color: 'var(--color-primary)', lineHeight: 1 }}><ReadOutlined /></span>
          <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--color-heading)' }}>Latest Posts</span>
          <span style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, marginLeft: 4 }}>NEW</span>
        </div>
        <Link to="/articles" style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '5px 16px', borderRadius: 20, border: '1px solid var(--color-border)', background: 'var(--color-primary-light)' }}>
          View All <ArrowRightOutlined style={{ fontSize: 11 }} />
        </Link>
      </div>
      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }} className="latest-articles-grid">
        {combined.map((article, idx) => (
          <div key={article.id || idx} onClick={() => navigate(`/article/${article.slug}`)}
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition: `opacity .55s ease ${idx * 100}ms, transform .55s ease ${idx * 100}ms`, cursor: 'pointer' }}>
            <Card className="latest-article-card" style={{ height: '100%', border: '1px solid var(--color-border)', background: 'var(--color-surface)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', transition: 'transform .25s ease, box-shadow .25s ease, border-color .25s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-7px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(11,31,77,0.16)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
            >
              {/* Image */}
              <div style={{ position: 'relative', overflow: 'hidden', lineHeight: 0, height: 180 }}>
                {article.banner_image
                  ? <img src={`/uploads/${article.banner_image}`} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .45s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--color-primary-light) 0%, #e8edff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ReadOutlined style={{ fontSize: 36, color: 'var(--color-primary)', opacity: 0.5 }} /></div>
                }
                {article.content_type_name && <span style={{ position: 'absolute', top: 10, left: 10, background: article.content_type_name?.toLowerCase() === 'blog' ? '#6c5ce7' : 'var(--color-primary)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: .6, textTransform: 'uppercase' }}>{article.content_type_name}</span>}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(11,31,77,0.72) 0%, transparent 100%)', padding: '24px 12px 8px' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', gap: 4 }}><CalendarOutlined />{moment(article.published_date || article.created_at).format('MMM D, YYYY')}</span>
                </div>
              </div>
              {/* Content */}
              <CardContent style={{ padding: '16px 18px 18px' }}>
                {article.category_name && <span style={{ fontSize: 10.5, fontWeight: 700, color: article.content_type_name?.toLowerCase() === 'blog' ? '#6c5ce7' : 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8, display: 'block' }}>{article.category_name}</span>}
                <h3 style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.5, color: 'var(--color-heading)', margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--color-border)', fontSize: 11.5, color: 'var(--color-muted)' }}>
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
const TrendingTopicsSection = ({ items, navigate }) => {
  const [ref, visible] = useReveal();
  if (!items.length) return null;
  return (
    <div ref={ref} style={{ margin: '80px 0 64px', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity .6s ease, transform .6s ease' }}>
      <div style={{ marginBottom: 36, textAlign: 'left' }}>
        <span style={{ 
          fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-primary-light)', 
          padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1, display: 'inline-block', marginBottom: 12
        }}>Trending</span>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-heading)', margin: '0 0 10px', letterSpacing: '-0.5px' }}>Related Post</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: 16, margin: 0 }}>Expand your knowledge with these hand-picked posts.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }} className="trending-grid">
        {items.map((item, idx) => (
          <div key={item.id || idx} onClick={() => navigate(`/article/${item.slug}`)} style={{
            background: 'var(--color-surface)', borderRadius: 20, border: '1px solid var(--color-border)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', cursor: 'pointer',
            transition: 'transform .3s ease, box-shadow .3s ease, border-color .3s ease', overflow: 'hidden'
          }}
            onMouseEnter={e => { 
              e.currentTarget.style.transform = 'translateY(-8px)'; 
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(11,31,77,0.08)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.transform = 'translateY(0)'; 
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          >
            {/* Image */}
            <div style={{ position: 'relative', overflow: 'hidden', paddingTop: '56.25%', background: '#f3f4f6' }}>
              {item.banner_image ? (
                <img src={`/uploads/${item.banner_image}`} alt={item.title} style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover'
                }} />
              ) : (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary-light)' }}>
                  <ReadOutlined style={{ fontSize: 32, color: 'var(--color-primary)', opacity: 0.5 }} />
                </div>
              )}
            </div>

            {/* Content body */}
            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Meta details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: 'var(--color-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <CalendarOutlined style={{ color: 'var(--color-primary)', fontSize: 13 }} />
                    {moment(item.published_date || item.created_at).format('MMM D, YYYY')}
                  </span>
                  {item.category_name && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-primary-light)',
                      padding: '3px 10px', borderRadius: 12, textTransform: 'uppercase', letterSpacing: 0.5
                    }}>{item.category_name}</span>
                  )}
                </div>

                {/* Title & Desc */}
                <h3 style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.4, color: 'var(--color-heading)', margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.6, margin: '0 0 20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.short_description || 'Explore this trending post to learn more about the latest developments and industry best practices.'}
                </p>
              </div>

              {/* Card Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-heading)' }}>
                  {item.author_name || 'Staff Writer'}
                </span>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, color: '#334155', fontWeight: 'bold', transition: 'background .2s, color .2s'
                }}
                  className="arrow-redir"
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#334155'; }}
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
  const [data, setData] = useState({ articles: [], blogs: [], news: [], interviews: [] });
  const [stats, setStats] = useState({ totalPublished: 0, totalViews: 0, totalAuthors: 0, totalCategories: 0 });
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [searchVal, setSearchVal] = useState('');
  const [activeTab, setActiveTab] = useState(CAT_TABS[0].key);
  const [tabData, setTabData] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
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
    if (!activeTab) { setTabData([]); return; }
    setTabLoading(true);
    const tab = CAT_TABS.find(c => c.key === activeTab);
    const qs = tab?.param === 'content_type' ? `content_type=${tab.key}` : `category=${tab?.key}`;
    axios.get(`/api/public/content?status=published&${qs}&limit=3`)
      .then(r => setTabData(r.data?.data || []))
      .catch(() => setTabData([]))
      .finally(() => setTabLoading(false));
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
      setData({ articles: aR.data?.data || [], blogs: bR.data?.data || [], news: nR.data?.data || [], interviews: iR.data?.data || [] });
      setStats(sR.data || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = () => {
    if (searchVal.trim().length >= 2) navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
  };

  if (loading) return (
    <div style={{ padding: '40px 0' }}>
      <Skeleton active paragraph={{ rows: 3 }} style={{ marginBottom: 32 }} />
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );

  const [featuredArticle, ...restArticles] = data.articles;

  return (
    <div style={{ paddingBottom: 60, background: 'var(--color-bg-alt)', minHeight: '100vh' }}>
      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}

      <HeroSection searchVal={searchVal} setSearchVal={setSearchVal} handleSearch={handleSearch} />
      {data.news.length > 0 && <TickerStrip items={data.news} />}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>

        {/* Latest Posts */}
        <LatestArticlesSection articles={data.articles} blogs={data.blogs} navigate={navigate} />

        {/* Category chips */}
        <CategoryNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Category filtered content */}
        <div ref={catSectionRef}>
          {activeTab && (() => {
            const activeCat = CAT_TABS.find(c => c.key === activeTab);
            return (
              <div style={{ margin: '0 0 40px', minHeight: 120 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-heading)' }}>{activeCat?.label}</span>

                  </div>
                  <Link to={`/category/${activeTab}`} style={{ fontSize: 12, color: activeCat?.color || 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '5px 14px', borderRadius: 8, border: `1px solid ${activeCat?.color || 'var(--color-primary)'}33`, background: `${activeCat?.color || 'var(--color-primary)'}0d` }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="cat-cards-grid">
                    {tabData.slice(0, 3).map((a, idx) => (
                      <div key={a.id} style={{ animation: `catCardIn .4s ease ${idx * 80}ms both` }}>
                        <div style={{ background: 'var(--color-surface)', borderRadius: 14, overflow: 'hidden', border: `1.5px solid ${activeCat?.color || 'var(--color-primary)'}22`, boxShadow: '0 6px 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.015)'; e.currentTarget.style.boxShadow = `0 24px 48px ${activeCat?.color || 'var(--color-primary)'}33, 0 12px 24px rgba(0,0,0,0.1)`; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.06)'; }}
                        >
                          {/* Image */}
                          <div style={{ position: 'relative', overflow: 'hidden', height: 200, lineHeight: 0 }}>
                            {a.banner_image
                              ? <img src={`/uploads/${a.banner_image}`} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .4s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${activeCat?.color || 'var(--color-primary)'}22 0%, #e8edff 100%)` }}><ReadOutlined style={{ fontSize: 40, color: activeCat?.color || 'var(--color-primary)', opacity: 0.4 }} /></div>
                            }
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: activeCat?.color || 'var(--color-primary)' }} />
                          </div>
                          {/* Body */}
                          <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <h3 style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.45, color: 'var(--color-heading)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.title}</h3>
                            {/* Author + Date */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--color-muted)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${activeCat?.color || 'var(--color-primary)'}22`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: activeCat?.color || 'var(--color-primary)', fontWeight: 700 }}>
                                  {(a.author_name || a.author || 'A').charAt(0).toUpperCase()}
                                </span>
                                <span style={{ fontWeight: 500 }}>{a.author_name || a.author || 'TgsTechInfo'}</span>
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><CalendarOutlined />{moment(a.published_date || a.created_at).format('MMM D, YYYY')}</span>
                            </div>
                            {/* Read More */}
                            <div style={{ marginTop: 'auto', paddingTop: 4 }}>
                              <button onClick={() => navigate(`/article/${a.slug}`)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 0', background: 'transparent', color: activeCat?.color || 'var(--color-primary)', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'transform .2s ease' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(5px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; }}
                              >
                                Read More <ArrowRightOutlined style={{ fontSize: 11 }} />
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }} className="featured-articles-grid">
              {data.articles.slice(0, 2).map((a, idx) => (
                <div key={a.id || idx} style={{
                  background: 'var(--color-surface)', borderRadius: 16, overflow: 'hidden',
                  border: '1.5px solid var(--color-border)', boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
                  display: 'flex', flexDirection: 'column', transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer'
                }}
                  onClick={() => navigate(`/article/${a.slug}`)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.015)'; e.currentTarget.style.boxShadow = `0 24px 48px rgba(0,0,0,0.1), 0 12px 24px rgba(0,0,0,0.08)`; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                >
                  <div style={{ position: 'relative', overflow: 'hidden', height: 240, lineHeight: 0 }}>
                    {a.banner_image
                      ? <img src={`/uploads/${a.banner_image}`} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .4s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                      : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--color-primary-light) 0%, #e8edff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ReadOutlined style={{ fontSize: 40, color: 'var(--color-primary)', opacity: 0.4 }} /></div>
                    }
                  </div>
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontWeight: 800, fontSize: 20, lineHeight: 1.4, color: 'var(--color-heading)', margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.title}</h3>
                    <div style={{ marginTop: 'auto' }}>
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/article/${a.slug}`); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 0', background: 'transparent', color: 'var(--color-primary)', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'transform .2s ease' }}
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

        <StatsBar stats={stats} />

        <TrendingTopicsSection items={trendingTopics} navigate={navigate} />

        <WhyPublishSection />
        <PublishingSolutions />
        <NewsletterBox />

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
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes heroProgress { 0% { width: 0%; } 100% { width: 100%; } }
        @keyframes catCardIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes orangeShimmerAnim {
          0% { background-position: 100% center; }
          100% { background-position: -100% center; }
        }
        .orange-shimmer-text {
          background: linear-gradient(120deg, #f79429 25%, #ffe3b3 50%, #f79429 75%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: orangeShimmerAnim 3s linear infinite;
          display: inline-block;
        }
        .latest-articles-grid { grid-template-columns: repeat(4, 1fr); }
        .featured-articles-grid { grid-template-columns: repeat(2, 1fr); }
        .cat-cards-grid { grid-template-columns: repeat(3, 1fr); }
        .glass-stats-grid { grid-template-columns: repeat(4, 1fr); }
        .trending-grid { grid-template-columns: repeat(3, 1fr); }
        .why-grid { grid-template-columns: repeat(3, 1fr); }
        .solutions-grid { grid-template-columns: repeat(4, 1fr); }
        .latest-article-card { will-change: transform, box-shadow; }
        @media (max-width: 900px) {
          .latest-articles-grid { grid-template-columns: repeat(2, 1fr); }
          .glass-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 28px; }
          .trending-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .featured-articles-grid { grid-template-columns: 1fr; }
          .solutions-grid { grid-template-columns: repeat(2, 1fr); }
          .why-grid { grid-template-columns: repeat(2, 1fr); }
          .hero-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) { .cat-cards-grid { grid-template-columns: 1fr; } }
        @media (max-width: 480px) { 
          .solutions-grid, .latest-articles-grid, .why-grid, .glass-stats-grid, .trending-grid { grid-template-columns: 1fr; } 
          .glass-stat-card { transform: translateY(0) !important; }
        }
      `}</style>
    </div>
  );
};

export default Home;
