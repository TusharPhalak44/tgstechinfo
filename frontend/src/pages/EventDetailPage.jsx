import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CalendarOutlined, 
  EnvironmentOutlined, 
  VideoCameraOutlined, 
  UserOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  ShareAltOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
  CopyOutlined,
  CheckOutlined,
  LinkedinOutlined,
  TwitterOutlined,
  WhatsAppOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  FireOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { Tag, Button, Modal, Form, Input, message, Spin, Alert } from 'antd';
import DOMPurify from 'dompurify';
import eventService from '../services/eventService';
import { useTheme } from '../context/ThemeContext';
import '../styles/event-detail.css';

export default function EventDetailPage() {
  const { slug } = useParams();
  const { darkMode } = useTheme();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal & Registration state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [form] = Form.useForm();

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchEventDetails();
  }, [slug]);

  const fetchEventDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await eventService.getPublicEventBySlug(slug);
      if (res && res.success) {
        setEvent(res.event);
      } else {
        setError(res?.message || 'Event not found');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  // Real-time countdown clock
  useEffect(() => {
    if (!event?.start_date) return;

    const targetDate = new Date(event.start_date).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [event?.start_date]);

  // Handle Form Submission
  const handleRegisterSubmit = async (values) => {
    setSubmitting(true);
    try {
      const res = await eventService.registerForEvent(event.id, values);
      if (res && res.success) {
        setRegistrationResult(res.registration);
        message.success('Registration successful! Confirmation sent to your email.');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.';
      if (err?.response?.data?.is_duplicate) {
        message.warning(msg);
        setRegistrationResult(err?.response?.data?.registration);
      } else {
        message.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text, type = 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
    message.success('Copied to clipboard!');
  };

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    if (!event) return '#';
    const title = encodeURIComponent(event.title || 'TGS Tech Info Event');
    const details = encodeURIComponent((event.short_description || '') + `\n\nTicket Code: ${registrationResult?.registration_code || ''}`);
    const location = encodeURIComponent(
      event.event_mode === 'online' 
        ? (registrationResult?.virtual_join_url || 'Online Virtual Meeting') 
        : (event.venue_name || '')
    );

    const start = new Date(event.start_date).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = event.end_date 
      ? new Date(event.end_date).toISOString().replace(/-|:|\.\d\d\d/g, '')
      : new Date(new Date(event.start_date).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={{ maxWidth: 800, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <Alert message="Event Not Found" description={error || 'This event could not be found.'} type="error" showIcon />
        <Link to="/events" style={{ marginTop: 24, display: 'inline-block' }}>
          <Button type="primary">← Back to All Events</Button>
        </Link>
      </div>
    );
  }

  const isOnline = event.event_mode === 'online' || event.event_mode === 'hybrid';
  const isOffline = event.event_mode === 'offline' || event.event_mode === 'hybrid';
  const isPast = event.is_past || new Date(event.start_date) < new Date();

  // JSON-LD Schema for Google Search Event snippet (Public SEO - NEVER expose private meeting join links)
  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    'name': event.title,
    'description': event.short_description || event.title,
    'image': [event.banner_image || 'https://tgstechinfo.com/logo.png'],
    'startDate': new Date(event.start_date).toISOString(),
    'endDate': event.end_date ? new Date(event.end_date).toISOString() : new Date(new Date(event.start_date).getTime() + 2 * 60 * 60 * 1000).toISOString(),
    'eventAttendanceMode': isOnline 
      ? 'https://schema.org/OnlineEventAttendanceMode' 
      : 'https://schema.org/OfflineEventAttendanceMode',
    'eventStatus': 'https://schema.org/EventScheduled',
    'location': isOnline ? {
      '@type': 'VirtualLocation',
      'url': event.source_url || window.location.href
    } : {
      '@type': 'Place',
      'name': event.venue_name || 'Venue',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': event.venue_address || '',
        'addressLocality': event.venue_city || ''
      }
    },
    'performer': event.speaker_name ? {
      '@type': 'Person',
      'name': event.speaker_name,
      'jobTitle': event.speaker_role || 'Speaker'
    } : undefined,
    'offers': {
      '@type': 'Offer',
      'url': window.location.href,
      'price': '0',
      'priceCurrency': 'INR',
      'availability': event.is_full ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      'validFrom': new Date(event.created_at).toISOString()
    },
    'organizer': {
      '@type': 'Organization',
      'name': 'TGS Tech Info',
      'url': 'https://tgstechinfo.com'
    }
  };

  const getBannerImageUrl = (img) => {
    if (!img) return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80';
    if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) return img;
    if (img.startsWith('/')) return img;
    return `/uploads/${img}`;
  };

  const getSpeakerImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) return img;
    if (img.startsWith('/')) return img;
    return `/uploads/${img}`;
  };

  return (
    <div style={{
      background: darkMode ? '#090D16' : '#F8FAFC',
      color: darkMode ? '#E2E8F0' : '#1E293B',
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      {/* Inject Structured Data JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      {/* ── TOP BREADCRUMB & BACK LINK ─────────────────────────── */}
      <div 
        className="event-top-bar"
        style={{
          background: darkMode ? '#0F172A' : '#FFFFFF',
          borderBottom: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0'
        }}
      >
        <div className="event-top-bar-inner">
          <Link to="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0284C7', fontWeight: 600, textDecoration: 'none' }}>
            <ArrowLeftOutlined /> Back to All Events
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button 
              size="small" 
              icon={<ShareAltOutlined />}
              onClick={() => copyToClipboard(window.location.href, 'link')}
            >
              {copiedLink ? 'Link Copied!' : 'Share Event'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ─────────────────────────────── */}
      <div className="event-detail-container">
        <div className="event-detail-grid">
          
          {/* ── LEFT COLUMN: MAIN EVENT DETAILS ─────────────────── */}
          <div className="event-main-content">
            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <Tag color={isOnline ? 'cyan' : 'purple'} style={{ borderRadius: 6, fontWeight: 700, padding: '4px 10px', fontSize: 13 }}>
                {isOnline ? <VideoCameraOutlined /> : <EnvironmentOutlined />} {event.event_mode?.toUpperCase()}
              </Tag>
              <Tag color="orange" style={{ borderRadius: 6, fontWeight: 700, padding: '4px 10px', fontSize: 13, textTransform: 'uppercase' }}>
                {event.event_type}
              </Tag>
              {event.ticket_type === 'free' && (
                <Tag color="green" style={{ borderRadius: 6, fontWeight: 700, padding: '4px 10px', fontSize: 13 }}>
                  FREE REGISTRATION
                </Tag>
              )}
              {event.featured === 1 && (
                <Tag color="gold" style={{ borderRadius: 6, fontWeight: 700, padding: '4px 10px', fontSize: 13 }}>
                  ★ FEATURED SUMMIT
                </Tag>
              )}
              {event.source_url && (
                <a
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Tag
                    icon={<GlobalOutlined />}
                    color="blue"
                    style={{
                      borderRadius: 6,
                      fontWeight: 700,
                      padding: '4px 10px',
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    Official Event Source ↗
                  </Tag>
                </a>
              )}
            </div>

            {/* Title */}
            <h1 
              className="event-title"
              style={{
                color: darkMode ? '#F1F5F9' : '#0B1F4D'
              }}
            >
              {event.title}
            </h1>

            {/* Subtitle / Short Description */}
            {event.short_description && (
              <p 
                className="event-subtitle"
                style={{
                  color: darkMode ? '#94A3B8' : '#475569'
                }}
              >
                {event.short_description}
              </p>
            )}

            {/* Hero Image */}
            <div 
              className="event-hero-banner"
              style={{
                boxShadow: darkMode ? '0 12px 30px rgba(0,0,0,0.5)' : '0 12px 30px rgba(11,31,77,0.1)'
              }}
            >
              <img
                src={getBannerImageUrl(event.banner_image)}
                alt={event.title}
                className="event-hero-img"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            {/* ── EVENT HIGHLIGHTS GRID ── */}
            <div 
              className="event-highlights-card"
              style={{
                background: darkMode ? '#0F172A' : '#FFFFFF',
                border: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0'
              }}
            >
              <div className="event-highlight-item">
                <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                  🗓️ Date & Schedule
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: darkMode ? '#F1F5F9' : '#0B1F4D' }}>
                  {new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div style={{ fontSize: 13, color: '#F7941D', fontWeight: 600 }}>
                  {new Date(event.start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ({event.timezone || 'IST'})
                </div>
              </div>

              <div className="event-highlight-item">
                <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                  📍 Access Mode
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: darkMode ? '#F1F5F9' : '#0B1F4D', textTransform: 'capitalize' }}>
                  {event.event_mode} ({event.online_platform || 'Virtual Meeting'})
                </div>
                <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>
                  Confirmed Link Sent via Email
                </div>
              </div>

              <div className="event-highlight-item">
                <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                  🎟️ Registration Cost
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#10B981' }}>
                  {event.ticket_type === 'free' ? 'FREE OF CHARGE' : `₹${event.ticket_price}`}
                </div>
                <div style={{ fontSize: 13, color: '#64748B' }}>
                  Open for IT Professionals & Students
                </div>
              </div>
            </div>

            {/* ── KEYNOTE SPEAKER BOX ── */}
            {event.speaker_name && (
              <div 
                className="event-speaker-card"
                style={{
                  background: darkMode ? '#0F172A' : '#FFFFFF',
                  border: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0',
                  borderLeft: '5px solid #F7941D'
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#F7941D', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Featured Keynote Speaker
                </div>
                <div className="event-speaker-flex">
                  <div className="event-speaker-avatar">
                    {event.speaker_image ? (
                      <img src={getSpeakerImageUrl(event.speaker_image)} alt={event.speaker_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <UserOutlined />
                    )}
                  </div>
                  <div className="event-speaker-info">
                    <h3 style={{ margin: '0 0 4px', fontSize: 19, fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0B1F4D' }}>
                      {event.speaker_name}
                    </h3>
                    <div style={{ fontSize: 14, color: '#64748B', fontWeight: 600, marginBottom: 6 }}>
                      {event.speaker_role}{event.speaker_company ? ` • ${event.speaker_company}` : ''}
                    </div>
                    {event.speaker_bio && (
                      <p style={{ margin: 0, fontSize: 13, color: darkMode ? '#94A3B8' : '#475569', lineHeight: 1.5 }}>
                        {event.speaker_bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── ABOUT THE EVENT & FULL AGENDA (HTML Content) ── */}
            <div 
              className="event-agenda-card"
              style={{
                background: darkMode ? '#0F172A' : '#FFFFFF',
                border: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0'
              }}
            >
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 18px', color: darkMode ? '#F1F5F9' : '#0B1F4D' }}>
                About This Event & Agenda
              </h2>

              <div 
                className="event-agenda-content"
                style={{
                  color: darkMode ? '#CBD5E1' : '#334155'
                }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(event.description || '<p>Detailed agenda will be shared with registered attendees.</p>')
                }}
              />
            </div>

            {/* ── VENUE / ONLINE PLATFORM DETAILS ── */}
            {isOffline && event.venue_name && (
              <div 
                className="event-venue-card"
                style={{
                  background: darkMode ? '#0F172A' : '#FFFFFF',
                  border: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0'
                }}
              >
                <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0B1F4D' }}>
                  <EnvironmentOutlined style={{ color: '#EF4444', marginRight: 8 }} /> Venue Location
                </h3>
                <div style={{ fontSize: 15, fontWeight: 600, color: darkMode ? '#E2E8F0' : '#1E293B', marginBottom: 4 }}>
                  {event.venue_name}
                </div>
                <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 12 }}>
                  {event.venue_address} {event.venue_city ? `• ${event.venue_city}` : ''}
                </div>
                {event.venue_map_url && (
                  <a href={event.venue_map_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0284C7', fontWeight: 600, fontSize: 13 }}>
                    📍 Open in Google Maps →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: STICKY REGISTRATION CTA WIDGET ─────── */}
          <div className="event-sidebar-col">
            <div 
              className="event-registration-card"
              style={{
                background: darkMode ? '#0F172A' : '#FFFFFF',
                border: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0',
                boxShadow: darkMode ? '0 16px 40px rgba(0,0,0,0.45)' : '0 16px 40px rgba(11,31,77,0.08)'
              }}
            >
              {/* Ticket Price & Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Ticket Price</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#10B981' }}>
                    {event.ticket_type === 'free' ? 'FREE' : `₹${event.ticket_price}`}
                  </div>
                </div>

                {event.seats_left !== null && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Availability</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: event.is_full ? '#EF4444' : '#F7941D' }}>
                      {event.is_full ? 'Sold Out' : `${event.seats_left} seats remaining`}
                    </div>
                  </div>
                )}
              </div>

              {/* Countdown Clock Box */}
              {!isPast && (
                <div style={{
                  background: darkMode ? '#152033' : '#F1F5F9',
                  borderRadius: 12,
                  padding: '16px 14px',
                  marginBottom: 24,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', marginBottom: 10 }}>
                    ⏳ Event Starts In
                  </div>
                  <div className="event-countdown-grid">
                    <div 
                      className="event-countdown-cell"
                      style={{ background: darkMode ? '#0B1F4D' : '#FFFFFF' }}
                    >
                      <div className="event-countdown-num">{timeLeft.days}</div>
                      <div className="event-countdown-label">DAYS</div>
                    </div>
                    <div 
                      className="event-countdown-cell"
                      style={{ background: darkMode ? '#0B1F4D' : '#FFFFFF' }}
                    >
                      <div className="event-countdown-num">{timeLeft.hours}</div>
                      <div className="event-countdown-label">HOURS</div>
                    </div>
                    <div 
                      className="event-countdown-cell"
                      style={{ background: darkMode ? '#0B1F4D' : '#FFFFFF' }}
                    >
                      <div className="event-countdown-num">{timeLeft.minutes}</div>
                      <div className="event-countdown-label">MINS</div>
                    </div>
                    <div 
                      className="event-countdown-cell"
                      style={{ background: darkMode ? '#0B1F4D' : '#FFFFFF' }}
                    >
                      <div className="event-countdown-num">{timeLeft.seconds}</div>
                      <div className="event-countdown-label">SECS</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Registration Button */}
              {isPast ? (
                <Button
                  disabled
                  block
                  size="large"
                  style={{ height: 50, borderRadius: 10, fontWeight: 700 }}
                >
                  This Event Has Ended
                </Button>
              ) : event.is_full ? (
                <Button
                  disabled
                  block
                  size="large"
                  style={{ height: 50, borderRadius: 10, fontWeight: 700 }}
                >
                  Registrations Closed (Full)
                </Button>
              ) : event.registration_type === 'external' ? (
                <a
                  href={event.registration_url || event.source_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <Button
                    type="primary"
                    block
                    size="large"
                    icon={<LinkOutlined />}
                    style={{
                      height: 52,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                      borderColor: '#0284C7',
                      fontSize: 16,
                      fontWeight: 800,
                      boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)'
                    }}
                  >
                    Register on Organizer Website ↗
                  </Button>
                </a>
              ) : (
                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    height: 52,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #F7941D 0%, #EA580C 100%)',
                    borderColor: '#F7941D',
                    fontSize: 16,
                    fontWeight: 800,
                    boxShadow: '0 6px 20px rgba(247, 148, 29, 0.4)'
                  }}
                >
                  Register for Event (Free)
                </Button>
              )}

              {/* Perks / Guarantees checklist */}
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, borderTop: darkMode ? '1px solid #1E293B' : '1px solid #F1F5F9', paddingTop: 20 }}>
                {event.registration_type === 'external' ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: darkMode ? '#CBD5E1' : '#475569' }}>
                      <GlobalOutlined style={{ color: '#0284C7', fontSize: 16 }} />
                      <span>Official registration hosted by organizer</span>
                    </div>
                    {event.source_url && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: darkMode ? '#CBD5E1' : '#475569' }}>
                        <CheckCircleOutlined style={{ color: '#10B981', fontSize: 16 }} />
                        <span>Event details & agenda verified</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: darkMode ? '#CBD5E1' : '#475569' }}>
                      <SafetyCertificateOutlined style={{ color: '#38BDF8', fontSize: 16 }} />
                      <span>Direct external registration portal link</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: darkMode ? '#CBD5E1' : '#475569' }}>
                      <CheckCircleOutlined style={{ color: '#10B981', fontSize: 16 }} />
                      <span>Instant email confirmation & calendar invite</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: darkMode ? '#CBD5E1' : '#475569' }}>
                      <CheckCircleOutlined style={{ color: '#10B981', fontSize: 16 }} />
                      <span>Direct interactive Q&A with tech leader</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: darkMode ? '#CBD5E1' : '#475569' }}>
                      <CheckCircleOutlined style={{ color: '#10B981', fontSize: 16 }} />
                      <span>Access to slides & recording after event</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: darkMode ? '#CBD5E1' : '#475569' }}>
                      <SafetyCertificateOutlined style={{ color: '#38BDF8', fontSize: 16 }} />
                      <span>Certificate of participation included</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── REGISTRATION POPUP MODAL ────────────────────────────── */}
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setRegistrationResult(null);
        }}
        footer={null}
        width={560}
        style={{ maxWidth: 'calc(100vw - 24px)', margin: '0 auto' }}
        centered
        destroyOnClose
      >
        {!registrationResult ? (
          /* FORM VIEW */
          <div style={{ padding: '10px 6px' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ display: 'inline-flex', padding: 8, background: '#e0f2fe', borderRadius: '50%', color: '#0284c7', fontSize: 24, marginBottom: 10 }}>
                <CalendarOutlined />
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#0B1F4D' }}>
                Register for {event.title}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                Fill in your details below to secure your seat. You will receive an immediate confirmation with calendar invite.
              </p>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleRegisterSubmit}
              requiredMark={false}
            >
              {/* Anti-spam honeypot (hidden) */}
              <div style={{ display: 'none' }}>
                <Form.Item name="website_url">
                  <Input tabIndex="-1" autoComplete="off" />
                </Form.Item>
              </div>

              <div className="event-modal-grid-2col">
                <Form.Item
                  name="first_name"
                  label={<span style={{ fontWeight: 600 }}>First Name</span>}
                  rules={[{ required: true, message: 'Please enter your first name' }]}
                >
                  <Input placeholder="e.g. Rahul" size="large" />
                </Form.Item>

                <Form.Item
                  name="last_name"
                  label={<span style={{ fontWeight: 600 }}>Last Name</span>}
                  rules={[{ required: true, message: 'Please enter your last name' }]}
                >
                  <Input placeholder="e.g. Sharma" size="large" />
                </Form.Item>
              </div>

              <Form.Item
                name="email"
                label={<span style={{ fontWeight: 600 }}>Work / Personal Email</span>}
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email address' }
                ]}
              >
                <Input placeholder="name@company.com" size="large" />
              </Form.Item>

              <div className="event-modal-grid-2col">
                <Form.Item
                  name="phone"
                  label={<span style={{ fontWeight: 600 }}>Phone / WhatsApp</span>}
                >
                  <Input placeholder="+91 9876543210" size="large" />
                </Form.Item>

                <Form.Item
                  name="job_title"
                  label={<span style={{ fontWeight: 600 }}>Job Role / Title</span>}
                >
                  <Input placeholder="e.g. DevOps Engineer" size="large" />
                </Form.Item>
              </div>

              <div className="event-modal-grid-2col">
                <Form.Item
                  name="company_name"
                  label={<span style={{ fontWeight: 600 }}>Company / University</span>}
                >
                  <Input placeholder="e.g. TCS / Infosys" size="large" />
                </Form.Item>

                <Form.Item
                  name="city_country"
                  label={<span style={{ fontWeight: 600 }}>City, Country</span>}
                >
                  <Input placeholder="e.g. Pune, India" size="large" />
                </Form.Item>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={submitting}
                style={{
                  height: 48,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #0B1F4D 0%, #1E3A8A 100%)',
                  fontWeight: 700,
                  fontSize: 15,
                  marginTop: 10
                }}
              >
                Complete Registration
              </Button>
            </Form>
          </div>
        ) : (
          /* SUCCESS CONFIRMATION VIEW */
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#16a34a',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              marginBottom: 16
            }}>
              <CheckOutlined />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0B1F4D', margin: '0 0 8px' }}>
              Registration Confirmed!
            </h2>

            <p style={{ fontSize: 14, color: '#64748B', maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.5 }}>
              A confirmation email with calendar invite (<code>.ics</code>) has been dispatched to <strong>{registrationResult.email}</strong>.
            </p>

            {/* Ticket Code Card */}
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 24,
              display: 'inline-block',
              width: '100%'
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em' }}>
                Your Unique Ticket Code
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: '#0284c7' }}>
                  {registrationResult.registration_code}
                </span>
                <Button
                  size="small"
                  icon={copiedCode ? <CheckOutlined /> : <CopyOutlined />}
                  onClick={() => copyToClipboard(registrationResult.registration_code, 'code')}
                >
                  {copiedCode ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            {/* Direct Join Button for Confirmed Attendee if Virtual */}
            {registrationResult.virtual_join_url && (
              <div style={{ marginBottom: 20 }}>
                <a href={registrationResult.virtual_join_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<VideoCameraOutlined />}
                    style={{
                      height: 48,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      borderColor: '#10B981',
                      fontWeight: 700,
                      fontSize: 15,
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                    }}
                  >
                    Join Virtual Meeting ↗
                  </Button>
                </a>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>
                  Meeting link is also available in your confirmation email & calendar invite.
                </div>
              </div>
            )}

            {/* Calendar Buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
              <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer">
                <Button type="primary" icon={<CalendarOutlined />} style={{ background: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }}>
                  Add to Google Calendar
                </Button>
              </a>

              <a href={eventService.getCalendarDownloadUrl(event.id)} download>
                <Button icon={<DownloadOutlined />} style={{ fontWeight: 600 }}>
                  Download .ICS File
                </Button>
              </a>
            </div>

            <Button
              type="default"
              block
              onClick={() => {
                setIsModalOpen(false);
                setRegistrationResult(null);
              }}
            >
              Done & Close
            </Button>
          </div>
        )}
      </Modal>

      {/* ── MOBILE BOTTOM STICKY REGISTRATION BAR (Visible only on screens < 768px) ── */}
      <div 
        className="event-mobile-bottom-bar"
        style={{
          background: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderTop: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0',
        }}
      >
        <div>
          <div className="event-mobile-bottom-price-label" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
            {isPast ? 'Status' : 'Ticket Price'}
          </div>
          <div className="event-mobile-bottom-price" style={{ color: isPast ? '#94A3B8' : '#10B981' }}>
            {isPast ? 'Ended' : (event.ticket_type === 'free' ? 'FREE' : `₹${event.ticket_price}`)}
          </div>
        </div>

        {isPast ? (
          <Button disabled className="event-mobile-bottom-btn">
            Event Ended
          </Button>
        ) : event.is_full ? (
          <Button disabled className="event-mobile-bottom-btn">
            Sold Out
          </Button>
        ) : event.registration_type === 'external' ? (
          <a
            href={event.registration_url || event.source_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', flex: 1, maxWidth: 220 }}
          >
            <Button
              type="primary"
              icon={<LinkOutlined />}
              block
              style={{
                height: 44,
                fontWeight: 700,
                fontSize: 14,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                borderColor: '#0284C7'
              }}
            >
              Register ↗
            </Button>
          </a>
        ) : (
          <Button
            type="primary"
            onClick={() => setIsModalOpen(true)}
            className="event-mobile-bottom-btn"
            style={{
              background: 'linear-gradient(135deg, #F7941D 0%, #EA580C 100%)',
              borderColor: '#F7941D'
            }}
          >
            Register Now
          </Button>
        )}
      </div>
    </div>
  );
}
