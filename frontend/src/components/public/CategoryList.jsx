import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton, Pagination, Tag } from 'antd';
import { CalendarOutlined, EyeOutlined, UserOutlined, SearchOutlined, CompassOutlined, ReadOutlined, FireOutlined, PlayCircleOutlined, VideoCameraOutlined, ClockCircleOutlined, LinkOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useTheme } from '../../context/ThemeContext';
import { navigateContentItem } from '../../lib/contentRoute';
import WebinarCountdown from '../common/WebinarCountdown';
import { formatContentPublishDate, formatWebinarDate } from '../../utils/dateHelper';

// Detect HTML builder (landing page) content by builder_layout OR content type
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

const PAGE_SIZE = 15;
const INITIAL_SHOW = 9;
const SEE_MORE_STEP = 3;

const navigateContent = (item, navigate) => {
  navigateContentItem(item, navigate);
};

const TYPE_MAP = {
  articles:       { type: 'article',      title: 'Articles',      accent: '#0AAEEF' },
  blogs:          { type: 'blog',         title: 'Blogs',         accent: '#6c5ce7' },
  news:           { type: 'news',         title: 'News',          accent: '#00b894' },
  interviews:     { type: 'interview',    title: 'Interviews',    accent: '#e17055' },
  webinars:       { type: 'webinar',      title: 'Webinars',      accent: '#fd79a8' },
  events:         { type: 'event',        title: 'Events',        accent: '#fdcb6e' },
  ebooks:         { type: 'ebook',        title: 'eBooks',        accent: '#00cec9' },
  whitepapers:    { type: 'whitepaper',   title: 'Whitepapers',   accent: '#e84393' },
  'case-studies': { type: 'case-study',   title: 'Case Studies',  accent: '#0AAEEF' },
  'case-study':   { type: 'case-study',   title: 'Case Studies',  accent: '#0AAEEF' },
  'landing-pages': { type: 'landing-page', title: 'Landing Pages', accent: '#6c5ce7' },
};

const CATEGORY_ACCENT_MAP = {
  'technology': '#6c5ce7',
  'artificial-intelligence': '#6c5ce7',
  'cybersecurity': '#e17055',
  'cloud-computing': '#00b894',
  'data-analytics': '#0AAEEF',
  'devops': '#fd79a8',
  'machine-learning': '#a29bfe',
  'software-development': '#00cec9',
  'healthcare': '#00b894',
  'fintech': '#fdcb6e',
  'hr-tech': '#e17055',
  'edtech': '#6c5ce7',
  'whitepaper': '#0AAEEF'
};

// ── Premium Executive Frosted Light Band Animation Background ──
const FrostedLightBandBackground = ({ accent = '#0AAEEF', darkMode = false }) => {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 0
    }}>
      <style>{`
        @keyframes lightSweep1 {
          0% { transform: translate3d(-18%, -12%, 0) rotate(18deg); opacity: 0.65; }
          50% { transform: translate3d(12%, 8%, 0) rotate(24deg); opacity: 0.95; }
          100% { transform: translate3d(-18%, -12%, 0) rotate(18deg); opacity: 0.65; }
        }
        @keyframes lightSweep2 {
          0% { transform: translate3d(14%, 10%, 0) rotate(-15deg); opacity: 0.55; }
          50% { transform: translate3d(-12%, -8%, 0) rotate(-22deg); opacity: 0.90; }
          100% { transform: translate3d(14%, 10%, 0) rotate(-15deg); opacity: 0.55; }
        }
        @keyframes sheenPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .frosted-light-band { animation: none !important; }
        }
      `}</style>

      {/* Base Gradient Canvas */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: darkMode
          ? 'linear-gradient(135deg, #070F1E 0%, #0F172A 50%, #172554 100%)'
          : 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 40%, #BAE6FD 80%, #7DD3FC 100%)',
        transition: 'background 0.3s ease'
      }} />

      {/* Light Band 1: Diagonal Primary Light Beam */}
      <div
        className="frosted-light-band"
        style={{
          position: 'absolute',
          top: '-40%',
          left: '-20%',
          width: '140%',
          height: '180%',
          background: darkMode
            ? 'linear-gradient(120deg, transparent 20%, rgba(14, 165, 233, 0.35) 45%, rgba(59, 130, 246, 0.25) 55%, transparent 80%)'
            : 'linear-gradient(120deg, transparent 20%, rgba(10, 174, 239, 0.45) 45%, rgba(255, 255, 255, 0.8) 55%, transparent 80%)',
          filter: 'blur(12px)',
          animation: 'lightSweep1 14s ease-in-out infinite'
        }}
      />

      {/* Light Band 2: Counter Diagonal Light Beam */}
      <div
        className="frosted-light-band"
        style={{
          position: 'absolute',
          bottom: '-35%',
          right: '-15%',
          width: '130%',
          height: '160%',
          background: darkMode
            ? 'linear-gradient(145deg, transparent 20%, rgba(99, 102, 241, 0.3) 50%, transparent 80%)'
            : 'linear-gradient(145deg, transparent 20%, rgba(141, 213, 238, 0.6) 50%, rgba(255, 255, 255, 0.9) 65%, transparent 85%)',
          filter: 'blur(10px)',
          animation: 'lightSweep2 18s ease-in-out infinite'
        }}
      />

      {/* Radiant Glowing Light Accent Behind Spotlight Card */}
      <div
        className="frosted-light-band"
        style={{
          position: 'absolute',
          top: '5%',
          right: '5%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: darkMode
            ? 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(14, 165, 233, 0.45) 0%, rgba(186, 230, 253, 0.3) 50%, transparent 75%)',
          filter: 'blur(20px)',
          animation: 'sheenPulse 10s ease-in-out infinite'
        }}
      />
    </div>
  );
};

// ── Modern Executive Publishing Hero Header ─────────────────────────
const PublishingHeroHeader = ({ title, accent, totalCount, featuredPost, navigate, darkMode, searchTerm, setSearchTerm }) => {
  const isMobile = window.innerWidth < 768;

  return (
    <div style={{
      position: 'relative',
      borderBottom: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #CBD5E1',
      padding: isMobile ? '36px 16px' : '52px 24px',
      overflow: 'hidden'
    }}>
      {/* Keyframe Badge Animation */}
      <style>{`
        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 0 0 ${accent}66; }
          50% { box-shadow: 0 0 0 6px ${accent}00; }
        }
      `}</style>

      {/* ── Frosted Glass Light Band Animation Background ── */}
      <FrostedLightBandBackground accent={accent} darkMode={darkMode} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 32 }}>
          
          {/* Left Column: Publication Title & Search */}
          <div style={{ flex: 1, maxWidth: featuredPost && !isMobile ? 620 : '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{
                background: darkMode ? 'rgba(10, 174, 239, 0.15)' : 'rgba(10, 174, 239, 0.1)',
                color: accent,
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '4px 14px',
                borderRadius: 20,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: `1px solid ${accent}40`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                animation: 'badgePulse 3s infinite'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />
                TGS EXECUTIVE JOURNAL
              </span>
              <span style={{ fontSize: '0.8125rem', color: darkMode ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
                • {totalCount} Verified {title} Published
              </span>
            </div>

            <h1 style={{
              margin: '0 0 12px 0',
              fontSize: 'clamp(2.2rem, 4.4vw, 3.3rem)',
              fontWeight: 900,
              color: darkMode ? '#F8FAFC' : '#0F172A',
              letterSpacing: '-0.035em',
              lineHeight: 1.15
            }}>
              {title} <span style={{ color: accent }}>& Perspectives</span>
            </h1>

            <p style={{
              margin: '0 0 26px 0',
              fontSize: 'clamp(0.95rem, 1.5vw, 1.08rem)',
              color: darkMode ? '#94A3B8' : '#475569',
              lineHeight: 1.65,
              maxWidth: 600
            }}>
              Curated enterprise intelligence, executive CXO thought leadership, emerging tech market trends, and high-impact strategy reports.
            </p>

            {/* Quick Filter Search Bar */}
            <div style={{ display: 'flex', alignItems: 'center', maxWidth: 480, position: 'relative' }}>
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()} by keyword...`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 18px 13px 44px',
                  borderRadius: 12,
                  border: darkMode ? '1px solid rgba(10, 174, 239, 0.4)' : '1px solid #CBD5E1',
                  background: darkMode ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                  backdropFilter: 'blur(8px)',
                  color: darkMode ? '#F8FAFC' : '#0F172A',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 14px rgba(0,0,0,0.06)',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}
              />
              <SearchOutlined style={{ position: 'absolute', left: 16, color: accent, fontSize: 17 }} />
            </div>
          </div>

          {/* Right Column: Featured Spotlight Article / Webinar Hero Story */}
          {featuredPost && !isMobile && (() => {
            const featuredType = (featuredPost.content_type || featuredPost.content_type_name || '').toLowerCase().trim();
            const isFeaturedWebinar = featuredType === 'webinar';
            const isFeaturedLiveWebinar = isFeaturedWebinar && (featuredPost.webinar_type === 'live' || (!featuredPost.webinar_type && featuredPost.webinar_date));
            const isFeaturedOnDemandWebinar = isFeaturedWebinar && (featuredPost.webinar_type === 'on_demand' || (!isFeaturedLiveWebinar && featuredPost.video_file));

            return (
              <div
                onClick={() => navigateContentItem(featuredPost, navigate)}
                style={{
                  width: 440,
                  flexShrink: 0,
                  background: darkMode ? 'rgba(15, 23, 42, 0.9)' : '#FFFFFF',
                  border: isFeaturedWebinar
                    ? (darkMode ? '2px solid #ef4444' : '2px solid #3b82f6')
                    : (darkMode ? '1px solid rgba(10, 174, 239, 0.3)' : '1px solid rgba(0, 0, 0, 0.08)'),
                  backdropFilter: 'blur(16px)',
                  borderRadius: 16,
                  padding: 18,
                  cursor: 'pointer',
                  transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: darkMode ? '0 12px 35px rgba(0,0,0,0.5)' : '0 12px 30px rgba(0,0,0,0.08)',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)';
                  e.currentTarget.style.boxShadow = `0 20px 40px ${accent}35`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = darkMode ? '0 12px 35px rgba(0,0,0,0.5)' : '0 12px 30px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ height: 185, borderRadius: 12, overflow: 'hidden', position: 'relative', marginBottom: 14, background: '#1E293B' }}>
                  {featuredPost.banner_image ? (
                    <img
                      src={`/uploads/${featuredPost.banner_image}`}
                      alt={featuredPost.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>⚡</div>
                  )}

                  {/* Hero Badge */}
                  {isFeaturedWebinar ? (
                    <span style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      background: isFeaturedOnDemandWebinar ? '#3b82f6' : '#ef4444',
                      color: '#FFF',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: 14,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      {isFeaturedOnDemandWebinar ? (
                        <><PlayCircleOutlined /> On-Demand Video</>
                      ) : (
                        <><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'badgePulse 1.5s infinite' }} /> Upcoming Live Webinar</>
                      )}
                    </span>
                  ) : (
                    <span style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      background: accent,
                      color: '#FFF',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: 12,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                      Spotlight Story
                    </span>
                  )}
                </div>

                {/* Host & Platform Info if Webinar */}
                {isFeaturedWebinar && featuredPost.hosted_by && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Hosted by {featuredPost.hosted_by}</span>
                    {featuredPost.platform && <Tag color="blue" style={{ fontSize: 10 }}>{featuredPost.platform}</Tag>}
                  </div>
                )}

                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '1.08rem',
                  fontWeight: 800,
                  color: darkMode ? '#F8FAFC' : '#0F172A',
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {featuredPost.title}
                </h3>

                {/* Countdown for Live Webinar in Hero */}
                {isFeaturedLiveWebinar && featuredPost.webinar_date && (
                  <div style={{ marginBottom: 12 }}>
                    <WebinarCountdown webinarDate={featuredPost.webinar_date} darkMode={darkMode} />
                  </div>
                )}

                <p style={{
                  margin: 0,
                  fontSize: '0.8125rem',
                  color: darkMode ? '#94A3B8' : '#64748B',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {featuredPost.short_description}
                </p>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
};

// ── Main List Article Item ───────────────────────────────────────────
const ListItem = ({ item, navigate, accent, darkMode }) => {
  const isMobile = window.innerWidth < 768;
  const isLandingPage = isHtmlBuilderContent(item);
  const isWebinar = (item.content_type_name || item.content_type || '').toLowerCase() === 'webinar';
  const isLive = isWebinar && (item.webinar_type === 'live' || (!item.webinar_type && item.webinar_date));
  const isOnDemand = isWebinar && (item.webinar_type === 'on_demand' || item.video_file);

  return (
    <div style={{
      display: 'flex', gap: isMobile ? 12 : 20, padding: isMobile ? '16px 0' : '20px 0',
      borderBottom: darkMode ? '1px solid #334155' : '1px solid #eef0f5', cursor: 'pointer',
      transition: 'background .15s', borderRadius: 6,
      flexDirection: isMobile ? 'column' : 'row'
    }}
      className="cat-list-item"
      onClick={() => navigateContent(item, navigate)}
      onMouseEnter={e => e.currentTarget.style.background = darkMode ? '#1e293b' : '#fafbff'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Thumbnail */}
      <div style={{ 
        width: isMobile ? '100%' : 240, 
        height: isMobile ? 180 : 155, 
        flexShrink: 0, 
        borderRadius: 10, 
        overflow: 'hidden', 
        background: darkMode ? '#1e293b' : '#f0f4ff', 
        position: 'relative',
        minHeight: isMobile ? 180 : 155,
        maxHeight: isMobile ? 180 : 155,
      }} className="cat-list-item-thumb">
        {item.banner_image
          ? <img src={`/uploads/${item.banner_image}`} alt={item.title} className="cat-list-item-thumb-img" style={{ transition: 'transform .4s ease', width: '100%', height: '100%', objectFit: 'cover' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 40 : 32 }}>📄</div>
        }

        {/* Play Icon Overlay for On-Demand Video Webinars */}
        {isOnDemand && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.4)' }}>
              <PlayCircleOutlined style={{ fontSize: 24, color: '#fff' }} />
            </div>
          </div>
        )}

        {/* Badge Overlay */}
        <span style={{
          position: 'absolute', top: 8, left: 8,
          background: isLive ? '#ef4444' : (isOnDemand ? '#3b82f6' : (isLandingPage ? '#6c5ce7' : accent)),
          color: '#fff', fontSize: isMobile ? 9 : 10, fontWeight: 800,
          padding: isMobile ? '2px 8px' : '3px 10px', borderRadius: 20, letterSpacing: .5, textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
        }}>
          {isLive ? (
            <><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} /> LIVE WEBINAR</>
          ) : isOnDemand ? (
            <><PlayCircleOutlined /> ON-DEMAND</>
          ) : isLandingPage ? (
            'Landing Page'
          ) : (
            item.content_type_name || item.content_type || ''
          )}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isMobile ? 6 : 8, flexWrap: 'wrap' }}>
          {item.category_name && (
            <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: .8 }}>
              {item.category_name}
            </span>
          )}
          {isWebinar && item.hosted_by && (
            <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: darkMode ? '#cbd5e1' : '#475569' }}>
              • Hosted by <strong style={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>{item.hosted_by}</strong>
            </span>
          )}
          {isWebinar && item.platform && (
            <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{item.platform}</Tag>
          )}
        </div>

        <h3 style={{
          fontWeight: 700, fontSize: isMobile ? 15 : 16, color: darkMode ? '#f1f5f9' : '#0f172a', margin: '0 0 8px', lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {item.title}
        </h3>

        <p style={{
          fontSize: isMobile ? 12 : 13, color: darkMode ? '#94a3b8' : '#64748b', lineHeight: 1.65, margin: '0 0 12px',
          display: '-webkit-box', WebkitLineClamp: isMobile ? 2 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {item.short_description}
        </p>

        {/* Live Webinar Countdown preview line */}
        {isLive && item.webinar_date && (
          <div style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClockCircleOutlined /> Live Event: {formatWebinarDate(item.webinar_date)}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16, fontSize: isMobile ? 11 : 12, color: darkMode ? '#94a3b8' : '#94a3b8', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <UserOutlined style={{ fontSize: isMobile ? 10 : 11 }} />
            {item.first_name || 'TGS'} {item.last_name || 'Editorial'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CalendarOutlined style={{ fontSize: isMobile ? 10 : 11 }} />
            {formatContentPublishDate(item)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <EyeOutlined style={{ fontSize: isMobile ? 10 : 11 }} />
            {item.view_count || 0}
          </span>
          <span style={{
            marginLeft: isMobile ? 0 : 'auto', fontSize: isMobile ? 11 : 12, fontWeight: 700,
            color: isLive ? '#ef4444' : (isOnDemand ? '#3b82f6' : (isLandingPage ? '#6c5ce7' : accent)),
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            {isLive ? '🔴 Register for Live Webinar →' : (isOnDemand ? '📹 Watch Video Recording →' : (isLandingPage ? '→ View Landing Page' : '→ Read Article'))}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Sidebar Recent Post Item ─────────────────────────────────────────
const SidebarPost = ({ item, navigate, accent, darkMode }) => {
  const isMobile = window.innerWidth < 768;
  const isLandingPage = isHtmlBuilderContent(item);
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: isMobile ? 12 : 10, padding: isMobile ? '10px 0' : '12px 0', borderBottom: darkMode ? '1px solid #334155' : '1px solid #eef0f5', cursor: 'pointer', alignItems: 'flex-start' }}
      onClick={() => navigateContent(item, navigate)}
    >
      <div style={{ width: isMobile ? 80 : 64, height: isMobile ? 60 : 52, flexShrink: 0, borderRadius: 7, overflow: 'hidden', background: darkMode ? '#1e293b' : '#f0f4ff', position: 'relative' }}>
        {item.banner_image
          ? <img src={`/uploads/${item.banner_image}`} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 24 : 20 }}>📄</div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          fontWeight: 700, fontSize: isMobile ? 14 : 13, color: darkMode ? '#f1f5f9' : '#0f172a', margin: '0 0 3px', lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          transition: 'color .2s'
        }}
          onMouseEnter={e => e.currentTarget.style.color = isLandingPage ? '#6c5ce7' : accent}
          onMouseLeave={e => e.currentTarget.style.color = darkMode ? '#f1f5f9' : '#0f172a'}
        >
          {item.title}
        </h4>
        <p style={{
          fontSize: isMobile ? 12 : 11.5, color: '#94a3b8', margin: 0, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {item.short_description}
        </p>
      </div>
    </div>
  );
};

// ── Main CategoryList Component ─────────────────────────────────────
const CategoryList = () => {
  const { slug: paramSlug } = useParams();
  const pathSlug = window.location.pathname.replace('/', '');
  const slug = paramSlug || pathSlug;
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [contents, setContents] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(INITIAL_SHOW);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const typeInfo = TYPE_MAP[slug];
  const accent = typeInfo?.accent || CATEGORY_ACCENT_MAP[slug] || '#0AAEEF';
  const pageTitle = typeInfo?.title || (slug?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())) || 'Articles';

  useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(INITIAL_SHOW);
    setSearchTerm('');
    fetchSidebar();
  }, [slug]);

  useEffect(() => {
    setVisibleCount(INITIAL_SHOW);
    fetchMainList();
  }, [slug, currentPage]);

  const fetchSidebar = async () => {
    try {
      const catCountParams = typeInfo ? { content_type: typeInfo.type } : {};
      const [recentRes, catRes] = await Promise.all([
        axios.get('/api/public/content', { params: { status: 'published', limit: 5, ...(typeInfo ? { content_type: typeInfo.type } : { category: slug }) } }),
        axios.get('/api/public/categories-with-count', { params: catCountParams }),
      ]);
      setRecentPosts(recentRes.data?.data || []);
      setCategoriesTree(catRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMainList = async () => {
    setLoading(true);
    try {
      const params = { status: 'published', limit: PAGE_SIZE, offset: (currentPage - 1) * PAGE_SIZE };
      if (typeInfo) params.content_type = typeInfo.type;
      else params.category = slug;
      const mainRes = await axios.get('/api/public/content', { params });
      setContents(mainRes.data?.data || []);
      setTotal(mainRes.data?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Filter contents by inline search term
  const safeContents = Array.isArray(contents) ? contents : [];
  const filteredContents = safeContents.filter(item => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.short_description && item.short_description.toLowerCase().includes(q)) ||
      (item.category_name && item.category_name.toLowerCase().includes(q))
    );
  });

  const featuredPost = safeContents[0];

  return (
    <div style={{ background: darkMode ? '#0f172a' : '#f8fafc', minHeight: '100vh' }}>

      {/* ── Redesigned Modern Executive Publishing Hero Header ── */}
      <PublishingHeroHeader
        title={pageTitle}
        accent={accent}
        totalCount={total}
        featuredPost={featuredPost}
        navigate={navigate}
        darkMode={darkMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* ── Content Area ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 24px' }}>
        <div style={{ display: 'flex', gap: isMobile ? 24 : 40, alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }} className="cat-layout">

          {/* ── Main List Column ── */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', width: isMobile ? '100%' : 'auto' }}>

            {/* Horizontal Categories */}
            <div style={{ marginBottom: isMobile ? 16 : 24 }}>
              <div style={{ fontWeight: 700, fontSize: isMobile ? 13 : 14, color: darkMode ? '#94a3b8' : '#64748b', marginBottom: isMobile ? 10 : 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Explore Topics & Categories
              </div>
              <div style={{ display: 'flex', gap: isMobile ? 8 : 10, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'thin' }}>
                {loading
                  ? <Skeleton active paragraph={{ rows: 1 }} />
                  : categoriesTree.filter(parent => parent.count > 0).length === 0
                    ? <div style={{ fontSize: isMobile ? 12 : 13, color: darkMode ? '#94a3b8' : '#94a3b8' }}>No categories found.</div>
                    : categoriesTree.filter(parent => parent.count > 0).map(parent => (
                      <button
                        key={parent.id}
                        onClick={() => navigate(`/category/${parent.slug}`)}
                        style={{
                          padding: isMobile ? '6px 12px' : '8px 16px',
                          background: darkMode ? '#1e293b' : '#fff',
                          border: `1.5px solid ${accent}33`,
                          borderRadius: 20,
                          fontSize: isMobile ? 12 : 13,
                          fontWeight: 600,
                          color: darkMode ? '#f1f5f9' : '#0f172a',
                          cursor: 'pointer',
                          transition: 'all .2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          flexShrink: 0
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = accent;
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.borderColor = accent;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = darkMode ? '#1e293b' : '#fff';
                          e.currentTarget.style.color = darkMode ? '#f1f5f9' : '#0f172a';
                          e.currentTarget.style.borderColor = `${accent}33`;
                        }}
                      >
                        {parent.name}
                        <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, background: `${accent}18`, color: accent, borderRadius: 12, padding: '1px 6px', minWidth: 20, textAlign: 'center' }}>
                          {parent.count}
                        </span>
                      </button>
                    ))
                }
              </div>
            </div>

            {/* Title & Count bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, paddingBottom: isMobile ? 12 : 16, borderBottom: `3px solid ${accent}`, flexShrink: 0 }}>
              <span style={{ fontWeight: 800, fontSize: isMobile ? 16 : 18, color: darkMode ? '#f1f5f9' : '#0f172a' }}>
                {searchTerm ? `Search Results for "${searchTerm}"` : `Latest ${pageTitle}`}
              </span>
              <span style={{ fontSize: isMobile ? 12 : 13, color: darkMode ? '#94a3b8' : '#94a3b8' }}>
                {filteredContents.length} articles found
              </span>
            </div>

            {/* Articles List */}
            <div>
              {loading
                ? <Skeleton active paragraph={{ rows: 6 }} />
                : filteredContents.length === 0
                  ? <div style={{ textAlign: 'center', padding: isMobile ? '40px 0' : '60px 0', color: darkMode ? '#94a3b8' : '#94a3b8', fontSize: isMobile ? 14 : 15 }}>No articles matched your search query.</div>
                  : filteredContents.slice(0, visibleCount).map(item => (
                    <ListItem key={item.id} item={item} navigate={navigate} accent={accent} darkMode={darkMode} />
                  ))
              }
            </div>

            {/* See More button */}
            {!loading && filteredContents.length > 0 && visibleCount < filteredContents.length && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: isMobile ? 20 : 24 }}>
                <button
                  onClick={() => setVisibleCount(v => Math.min(v + SEE_MORE_STEP, filteredContents.length))}
                  style={{ padding: isMobile ? '10px 28px' : '11px 36px', background: darkMode ? '#1e293b' : '#fff', color: accent, border: `2px solid ${accent}`, borderRadius: 30, fontWeight: 700, fontSize: isMobile ? 13 : 14, cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => { e.currentTarget.style.background = accent; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = darkMode ? '#1e293b' : '#fff'; e.currentTarget.style.color = accent; }}
                >
                  Load More Articles
                </button>
              </div>
            )}

            {/* Pagination */}
            {!loading && total > PAGE_SIZE && visibleCount >= filteredContents.length && (
              <div style={{ marginTop: isMobile ? 16 : 24, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  current={currentPage}
                  total={total}
                  pageSize={PAGE_SIZE}
                  onChange={page => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  showSizeChanger={false}
                  showTotal={isMobile ? false : t => `Total ${t} articles`}
                  simple={isMobile}
                  size={isMobile ? 'small' : 'default'}
                />
              </div>
            )}
          </div>

          {/* ── Sidebar (Desktop Only) ── */}
          {!isMobile && (
            <div style={{ width: 300, flexShrink: 0 }} className="cat-sidebar">
              {/* Newsletter Box */}
              <div style={{
                background: 'linear-gradient(135deg, #0AAEEF 0%, #0284C7 50%, #0369A1 100%)',
                borderRadius: 16,
                padding: '24px',
                boxShadow: '0 4px 20px rgba(10, 174, 239, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: 24
              }}>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <ReadOutlined style={{ color: '#fff', fontSize: 18 }} />
                  <span style={{ fontWeight: 800, fontSize: 13, color: '#fff', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    Executive Digest
                  </span>
                </div>

                <div style={{ position: 'relative', zIndex: 1, fontSize: 15, color: '#fff', fontWeight: 700, marginBottom: 16, lineHeight: 1.4 }}>
                  Subscribe to Weekly Tech Intelligence
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const email = e.target.email.value;
                  if (!email || !email.includes('@')) {
                    alert('Please enter a valid email address');
                    return;
                  }
                  try {
                    await axios.post('/api/public/newsletter', { email });
                    alert('Successfully subscribed!');
                    e.target.email.value = '';
                  } catch (error) {
                    alert('Failed to subscribe. Please try again.');
                  }
                }} style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 8 }}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter corporate email..."
                    required
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
                    style={{
                      padding: '10px 16px',
                      background: '#0F172A',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 12
                    }}
                  >
                    Join
                  </button>
                </form>
              </div>

              {/* Recent Posts Card */}
              <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 14, padding: '20px', boxShadow: darkMode ? '0 2px 16px rgba(0,0,0,.3)' : '0 2px 16px rgba(0,0,0,.06)', border: darkMode ? '1px solid #334155' : '1px solid #eef0f5' }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: accent, marginBottom: 4, paddingBottom: 12, borderBottom: `2px solid ${accent}22`, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FireOutlined /> Trending Articles
                </div>
                {loading
                  ? <Skeleton active paragraph={{ rows: 6 }} />
                  : recentPosts.map(item => (
                    <SidebarPost key={item.id} item={item} navigate={navigate} accent={accent} darkMode={darkMode} />
                  ))
                }
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default CategoryList;
