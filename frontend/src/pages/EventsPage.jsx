import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarOutlined, 
  EnvironmentOutlined, 
  VideoCameraOutlined, 
  UserOutlined, 
  SearchOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  FireOutlined,
  PlusOutlined,
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { 
  Input, 
  Select, 
  Tag, 
  Button, 
  Spin, 
  Empty, 
  Pagination, 
  Modal, 
  Form, 
  DatePicker, 
  InputNumber, 
  Switch, 
  message 
} from 'antd';
import dayjs from 'dayjs';
import eventService from '../services/eventService';
import { useTheme } from '../context/ThemeContext';

const { Option } = Select;
const { TextArea } = Input;

const TYPE_OPTIONS = [
  { label: 'All Formats', value: 'all' },
  { label: 'Webinars', value: 'webinar' },
  { label: 'Workshops', value: 'workshop' },
  { label: 'Conferences', value: 'conference' },
  { label: 'Hackathons', value: 'hackathon' },
  { label: 'Meetups', value: 'meetup' },
  { label: 'Panel Discussions', value: 'panel' },
];

const MODE_OPTIONS = [
  { label: 'All Locations', value: 'all' },
  { label: 'Virtual (Online)', value: 'online' },
  { label: 'In-Person (Offline)', value: 'offline' },
  { label: 'Hybrid', value: 'hybrid' },
];

export default function EventsPage() {
  const { darkMode } = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState('upcoming'); // 'upcoming' | 'past'
  const [selectedType, setSelectedType] = useState('all');
  const [selectedMode, setSelectedMode] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Add Event Modal State (Directly on UI!)
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [addEventMode, setAddEventMode] = useState('online');
  const [addRegType, setAddRegType] = useState('tgs');
  const [addForm] = Form.useForm();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventService.getPublicEvents({
        search: searchTerm,
        type: selectedType,
        mode: selectedMode,
        timeline,
        page,
        limit: 9
      });
      if (res && res.success) {
        setEvents(res.events || []);
        setTotal(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [timeline, selectedType, selectedMode, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  // Open Add Event Modal
  const handleOpenAddEventModal = () => {
    addForm.resetFields();
    addForm.setFieldsValue({
      event_type: 'webinar',
      event_mode: 'online',
      registration_type: 'tgs',
      ticket_type: 'free',
      ticket_price: 0,
      max_capacity: 0,
      status: 'published',
      featured: true,
      timezone: 'IST (UTC+5:30)',
      online_platform: 'Zoom'
    });
    setAddEventMode('online');
    setAddRegType('tgs');
    setIsAddEventOpen(true);
  };

  // Handle Event Creation Submit
  const handleCreateEventSubmit = async (values) => {
    setCreatingEvent(true);
    try {
      const joinUrlValue = values.virtual_join_url || values.online_join_url || null;
      const payload = {
        ...values,
        online_join_url: joinUrlValue,
        virtual_join_url: joinUrlValue,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD HH:mm:ss') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD HH:mm:ss') : null,
        featured: values.featured ? 1 : 0
      };

      const res = await eventService.createEvent(payload);
      if (res && res.success) {
        message.success('🎉 Event published successfully! It is now live on the website.');
        setIsAddEventOpen(false);
        fetchEvents();
      }
    } catch (err) {
      console.error('Error creating event:', err);
      message.error(err?.response?.data?.message || 'Failed to create event.');
    } finally {
      setCreatingEvent(false);
    }
  };

  // Helper to format date
  const formatEventDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatEventTime = (dateStr, tz) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${time} ${tz ? `(${tz})` : 'IST'}`;
  };

  // Helper for countdown
  const getCountdownText = (startDate) => {
    const diffMs = new Date(startDate) - new Date();
    if (diffMs < 0) return 'Concluded';
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (diffDays === 0) {
      if (diffHours <= 1) return 'Starting Soon';
      return `Today (${diffHours}h left)`;
    }
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: darkMode ? '#090D16' : '#F8FAFC',
      color: darkMode ? '#E2E8F0' : '#1E293B',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      {/* ── HERO BANNER ────────────────────────────────────────── */}
      <div style={{
        background: darkMode 
          ? 'linear-gradient(135deg, #0B1F4D 0%, #152754 50%, #0F172A 100%)' 
          : 'linear-gradient(135deg, #0B1F4D 0%, #1E3A8A 60%, #1D4ED8 100%)',
        color: '#FFFFFF',
        padding: '70px 24px 60px',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: darkMode ? '1px solid #1E293B' : 'none'
      }}>
        {/* Subtle decorative circles */}
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 340, height: 340,
          background: 'radial-gradient(circle, rgba(247,148,29,0.2) 0%, rgba(247,148,29,0) 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: -50, left: '20%', width: 280, height: 280,
          background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(56,189,248,0) 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '6px 16px', borderRadius: 30, border: '1px solid rgba(255,255,255,0.18)' }}>
              <FireOutlined style={{ color: '#F7941D' }} />
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#FDBA74' }}>
                TGS Tech Info Events Hub
              </span>
            </div>

            {/* DIRECT ACTION BUTTONS: Add Event & Admin Dashboard */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={handleOpenAddEventModal}
                style={{
                  background: 'linear-gradient(135deg, #F7941D 0%, #EA580C 100%)',
                  borderColor: '#F7941D',
                  fontWeight: 800,
                  borderRadius: 10,
                  height: 44,
                  boxShadow: '0 4px 15px rgba(247,148,29,0.45)'
                }}
              >
                + Add / Host New Event
              </Button>

              <Link to="/dashboard/events">
                <Button
                  size="large"
                  icon={<SettingOutlined />}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    borderRadius: 10,
                    height: 44,
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  Admin Panel & RSVPs
                </Button>
              </Link>
            </div>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3.2rem)',
            fontWeight: 800,
            margin: '0 0 16px',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: '#FFFFFF'
          }}>
            Explore Tech Summits, Masterclasses & Workshops
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
            color: 'rgba(255,255,255,0.85)',
            maxWidth: 720,
            margin: '0 0 32px',
            lineHeight: 1.6
          }}>
            Join visionary architects, engineering leaders, and technology pioneers in immersive live webinars, deep-dive technical workshops, and global summits.
          </p>

          {/* Search bar inside Hero */}
          <form onSubmit={handleSearch} style={{ maxWidth: 650, display: 'flex', gap: 10 }}>
            <Input
              size="large"
              placeholder="Search by topic, speaker, or keyword..."
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                borderRadius: 12,
                height: 52,
                fontSize: 15,
                background: '#FFFFFF',
                boxShadow: '0 10px 25px rgba(0,0,0,0.12)'
              }}
              allowClear
            />
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              style={{
                height: 52,
                padding: '0 28px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #F7941D 0%, #EA580C 100%)',
                borderColor: '#F7941D',
                fontWeight: 700,
                fontSize: 15,
                boxShadow: '0 4px 15px rgba(247, 148, 29, 0.4)'
              }}
            >
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* ── FILTER & TAB BAR ─────────────────────────────────────── */}
      <div style={{
        background: darkMode ? '#0F172A' : '#FFFFFF',
        borderBottom: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}>
          {/* Upcoming vs Past Tabs */}
          <div style={{
            display: 'inline-flex',
            background: darkMode ? '#1E293B' : '#F1F5F9',
            padding: 4,
            borderRadius: 10
          }}>
            <button
              onClick={() => { setTimeline('upcoming'); setPage(1); }}
              style={{
                border: 'none',
                background: timeline === 'upcoming' ? (darkMode ? '#0B1F4D' : '#FFFFFF') : 'transparent',
                color: timeline === 'upcoming' ? (darkMode ? '#38BDF8' : '#0B1F4D') : (darkMode ? '#94A3B8' : '#64748B'),
                padding: '8px 18px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: timeline === 'upcoming' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              🚀 Upcoming Events
            </button>
            <button
              onClick={() => { setTimeline('past'); setPage(1); }}
              style={{
                border: 'none',
                background: timeline === 'past' ? (darkMode ? '#0B1F4D' : '#FFFFFF') : 'transparent',
                color: timeline === 'past' ? (darkMode ? '#38BDF8' : '#0B1F4D') : (darkMode ? '#94A3B8' : '#64748B'),
                padding: '8px 18px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: timeline === 'past' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              📼 Past Sessions & Recordings
            </button>
          </div>

          {/* Format & Mode Selects + Quick Add Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Select
              value={selectedType}
              onChange={(val) => { setSelectedType(val); setPage(1); }}
              options={TYPE_OPTIONS}
              style={{ width: 160 }}
              popupMatchSelectWidth={false}
            />

            <Select
              value={selectedMode}
              onChange={(val) => { setSelectedMode(val); setPage(1); }}
              options={MODE_OPTIONS}
              style={{ width: 160 }}
              popupMatchSelectWidth={false}
            />

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAddEventModal}
              style={{
                background: '#0B1F4D',
                borderColor: '#0B1F4D',
                fontWeight: 700,
                borderRadius: 8
              }}
            >
              + Host Event
            </Button>
          </div>
        </div>
      </div>

      {/* ── EVENTS LISTING GRID ──────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#94A3B8', fontWeight: 600 }}>Loading curated events...</div>
          </div>
        ) : events.length === 0 ? (
          <div style={{
            background: darkMode ? '#0F172A' : '#FFFFFF',
            borderRadius: 16,
            padding: '60px 20px',
            textAlign: 'center',
            border: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0'
          }}>
            <Empty
              description={
                <span style={{ color: darkMode ? '#94A3B8' : '#64748B', fontSize: 16 }}>
                  No {timeline} events found matching your criteria.
                </span>
              }
            />
            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Button 
                type="default" 
                onClick={() => { setSelectedType('all'); setSelectedMode('all'); setSearchTerm(''); }}
              >
                Reset Filters
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenAddEventModal}
                style={{ background: '#F7941D', borderColor: '#F7941D', fontWeight: 700 }}
              >
                Create First Event
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 28
            }}>
              {events.map((event) => {
                const countdown = getCountdownText(event.start_date);
                const isOnline = event.event_mode === 'online';
                const isOffline = event.event_mode === 'offline';

                return (
                  <div
                    key={event.id}
                    style={{
                      background: darkMode ? '#0F172A' : '#FFFFFF',
                      borderRadius: 16,
                      overflow: 'hidden',
                      border: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0',
                      boxShadow: darkMode ? '0 10px 25px rgba(0,0,0,0.3)' : '0 8px 24px rgba(11,31,77,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = darkMode 
                        ? '0 16px 36px rgba(0,0,0,0.45)' 
                        : '0 16px 36px rgba(11,31,77,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = darkMode 
                        ? '0 10px 25px rgba(0,0,0,0.3)' 
                        : '0 8px 24px rgba(11,31,77,0.06)';
                    }}
                  >
                    {/* Event Banner */}
                    <Link 
                      to={`/events/${event.slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ display: 'block', position: 'relative', height: 190, overflow: 'hidden', background: '#0B1F4D' }}
                    >
                      <img
                        src={event.banner_image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
                        alt={event.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.4s ease'
                        }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
                        }}
                      />

                      {/* Top Badges overlay */}
                      <div style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        display: 'flex',
                        gap: 6,
                        flexWrap: 'wrap'
                      }}>
                        <Tag color={isOnline ? 'cyan' : isOffline ? 'purple' : 'geekblue'} style={{ borderRadius: 6, fontWeight: 700, margin: 0, padding: '2px 8px' }}>
                          {isOnline ? <VideoCameraOutlined /> : <EnvironmentOutlined />} {event.event_mode?.toUpperCase()}
                        </Tag>
                        <Tag color="orange" style={{ borderRadius: 6, fontWeight: 700, margin: 0, padding: '2px 8px', textTransform: 'uppercase' }}>
                          {event.event_type}
                        </Tag>
                        {event.ticket_type === 'free' && (
                          <Tag color="green" style={{ borderRadius: 6, fontWeight: 700, margin: 0, padding: '2px 8px' }}>
                            FREE TICKET
                          </Tag>
                        )}
                        {event.registration_type === 'external' && (
                          <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, margin: 0, padding: '2px 8px' }}>
                            EXTERNAL
                          </Tag>
                        )}
                      </div>

                      {/* Countdown badge on bottom right of banner */}
                      {timeline === 'upcoming' && (
                        <div style={{
                          position: 'absolute',
                          bottom: 10,
                          right: 12,
                          background: 'rgba(11, 31, 77, 0.85)',
                          backdropFilter: 'blur(8px)',
                          color: '#FDBA74',
                          padding: '4px 10px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}>
                          <ClockCircleOutlined /> {countdown}
                        </div>
                      )}
                    </Link>

                    {/* Card Content */}
                    <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      {/* Date & Time info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F7941D', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                        <CalendarOutlined />
                        <span>{formatEventDate(event.start_date)}</span>
                        <span style={{ color: darkMode ? '#64748B' : '#CBD5E1' }}>•</span>
                        <span>{formatEventTime(event.start_date, event.timezone)}</span>
                      </div>

                      {/* Title */}
                      <Link to={`/events/${event.slug}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <h3 style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: darkMode ? '#F1F5F9' : '#0B1F4D',
                          margin: '0 0 10px',
                          lineHeight: 1.35,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {event.title}
                        </h3>
                      </Link>

                      {/* Short Description */}
                      <p style={{
                        fontSize: 14,
                        color: darkMode ? '#94A3B8' : '#64748B',
                        lineHeight: 1.5,
                        margin: '0 0 16px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1
                      }}>
                        {event.short_description || 'Join this insightful technology session to gain industry perspective and connect with peers.'}
                      </p>

                      {/* Speaker highlight */}
                      {event.speaker_name && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          background: darkMode ? '#152033' : '#F8FAFC',
                          borderRadius: 10,
                          marginBottom: 16,
                          border: darkMode ? '1px solid #1E293B' : '1px solid #F1F5F9'
                        }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#0B1F4D',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 14,
                            overflow: 'hidden'
                          }}>
                            {event.speaker_image ? (
                              <img src={event.speaker_image} alt={event.speaker_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <UserOutlined />
                            )}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: darkMode ? '#E2E8F0' : '#1E293B', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {event.speaker_name}
                            </div>
                            <div style={{ fontSize: 11, color: darkMode ? '#94A3B8' : '#64748B', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {event.speaker_role || 'Keynote Speaker'}{event.speaker_company ? ` • ${event.speaker_company}` : ''}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bottom Action Footer */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: darkMode ? '1px solid #1E293B' : '1px solid #F1F5F9',
                        paddingTop: 16,
                        marginTop: 'auto'
                      }}>
                        <div>
                          {event.seats_left !== null && (
                            <span style={{ fontSize: 12, fontWeight: 600, color: event.is_full ? '#EF4444' : '#10B981' }}>
                              {event.is_full ? '❌ Full Capacity' : `🔥 ${event.seats_left} seats left`}
                            </span>
                          )}
                        </div>

                        <Link to={`/events/${event.slug}`} target="_blank" rel="noopener noreferrer">
                          <Button
                            type="primary"
                            style={{
                              background: timeline === 'upcoming' 
                                ? 'linear-gradient(135deg, #0B1F4D 0%, #1E3A8A 100%)' 
                                : '#64748B',
                              borderColor: 'transparent',
                              borderRadius: 8,
                              fontWeight: 700,
                              height: 38,
                              padding: '0 16px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            {timeline === 'upcoming' ? 'Register Now' : 'View Session'}
                            <ArrowRightOutlined style={{ fontSize: 12 }} />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {total > 9 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
                <Pagination
                  current={page}
                  total={total}
                  pageSize={9}
                  onChange={(p) => setPage(p)}
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── CREATE / HOST EVENT MODAL (VISIBLE DIRECTLY ON UI) ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
            <CalendarOutlined style={{ color: '#F7941D', fontSize: 22 }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0B1F4D' }}>Host / Publish a New Tech Event</div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Create and publish webinars, workshops, summits, or hackathons directly</div>
            </div>
          </div>
        }
        open={isAddEventOpen}
        onCancel={() => setIsAddEventOpen(false)}
        footer={null}
        width={720}
        centered
        destroyOnClose
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleCreateEventSubmit}
          requiredMark={false}
          style={{ marginTop: 12 }}
        >
          <Form.Item
            name="title"
            label={<span style={{ fontWeight: 600 }}>Event Title</span>}
            rules={[{ required: true, message: 'Please enter event title' }]}
          >
            <Input placeholder="e.g. Next-Gen Cloud Architecture & AI Summit 2026" size="large" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="event_type"
              label={<span style={{ fontWeight: 600 }}>Format</span>}
              rules={[{ required: true }]}
            >
              <Select size="large">
                <Option value="webinar">Webinar</Option>
                <Option value="workshop">Workshop</Option>
                <Option value="conference">Conference / Summit</Option>
                <Option value="hackathon">Hackathon</Option>
                <Option value="meetup">Meetup</Option>
                <Option value="panel">Panel Discussion</Option>
                <Option value="ama">Ask Me Anything (AMA)</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="event_mode"
              label={<span style={{ fontWeight: 600 }}>Location Mode</span>}
              rules={[{ required: true }]}
            >
              <Select size="large" onChange={(val) => setAddEventMode(val)}>
                <Option value="online">Virtual (Online)</Option>
                <Option value="offline">In-Person (Offline)</Option>
                <Option value="hybrid">Hybrid</Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="start_date"
              label={<span style={{ fontWeight: 600 }}>Start Date & Time</span>}
              rules={[{ required: true, message: 'Start date and time are required' }]}
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm" size="large" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="end_date"
              label={<span style={{ fontWeight: 600 }}>End Date & Time</span>}
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm" size="large" style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            name="source_url"
            label={<span style={{ fontWeight: 600 }}>Event Source URL</span>}
            tooltip="Official webpage or source page containing information about this event. Never used as join link."
            rules={[{ type: 'url', message: 'Must be a valid HTTP or HTTPS URL' }]}
          >
            <Input size="large" placeholder="https://example.com/event-page (Official event source page)" />
          </Form.Item>

          {/* Registration Section */}
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#10B981', marginBottom: 10 }}>
              📋 Registration Configuration
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: addRegType === 'external' ? '1fr 1.5fr' : '1fr', gap: 12 }}>
              <Form.Item
                name="registration_type"
                label={<span style={{ fontWeight: 600 }}>Registration Type</span>}
                rules={[{ required: true }]}
                initialValue="tgs"
              >
                <Select size="large" onChange={(val) => setAddRegType(val)}>
                  <Option value="tgs">TGS Registration (Built-in Form, Code & Emails)</Option>
                  <Option value="external">External Registration (Organizer Website)</Option>
                </Select>
              </Form.Item>

              {addRegType === 'external' && (
                <Form.Item
                  name="registration_url"
                  label={<span style={{ fontWeight: 600 }}>Registration URL</span>}
                  tooltip="External page where visitors can register for this event."
                  rules={[
                    { required: true, message: 'Please provide external registration URL' },
                    { type: 'url', message: 'Must be a valid HTTP or HTTPS URL' }
                  ]}
                >
                  <Input size="large" placeholder="https://organizer.com/register" />
                </Form.Item>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              {addRegType === 'tgs' 
                ? '✓ Visitors register on TGS platform. Confirmation email and calendar invite (.ics) sent automatically upon registration.'
                : '✓ Visitors register directly on organizer website. TGS will not send registration emails.'}
            </div>
          </div>

          {/* Conditional Online vs Offline fields */}
          {(addEventMode === 'online' || addEventMode === 'hybrid') && (
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0284c7' }}>
                  💻 Virtual Attendance & Join Link <span style={{ fontWeight: 'normal', color: '#64748B' }}>(Optional)</span>
                </span>
                <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>
                  🔒 Kept Private Until Registration
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <Form.Item name="online_platform" label="Platform">
                  <Select size="large">
                    <Option value="Zoom">Zoom</Option>
                    <Option value="Google Meet">Google Meet</Option>
                    <Option value="Microsoft Teams">Microsoft Teams</Option>
                    <Option value="YouTube Live">YouTube Live</Option>
                  </Select>
                </Form.Item>
                <Form.Item 
                  name="virtual_join_url" 
                  label="Virtual Join URL (Optional)"
                  tooltip="Actual Zoom, Google Meet, Microsoft Teams, Webex, or other meeting URL used to attend the event. Can be added later."
                  rules={[{ type: 'url', message: 'Must be a valid HTTP or HTTPS URL' }]}
                >
                  <Input size="large" placeholder="https://zoom.us/j/... or https://meet.google.com/ (Optional)" />
                </Form.Item>
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                🛡️ Sensitive: Protected join URL. Never exposed publicly on event detail page. Attendees receive it securely via confirmation email.
              </div>
            </div>
          )}

          {(addEventMode === 'offline' || addEventMode === 'hybrid') && (
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#8B5CF6', marginBottom: 10 }}>
                🏢 Physical Venue Details
              </div>
              <Form.Item name="venue_name" label="Venue Name">
                <Input placeholder="e.g. Cyber City IT Park, Convention Hall A" />
              </Form.Item>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <Form.Item name="venue_address" label="Street Address">
                  <Input placeholder="Sector 5, MIDC..." />
                </Form.Item>
                <Form.Item name="venue_city" label="City">
                  <Input placeholder="Pune / Mumbai" />
                </Form.Item>
              </div>
            </div>
          )}

          {/* Speaker Details */}
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#F7941D', marginBottom: 10 }}>
              🎤 Keynote Speaker Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="speaker_name" label="Speaker Name">
                <Input placeholder="e.g. Dr. Rajesh Sharma" />
              </Form.Item>
              <Form.Item name="speaker_role" label="Role / Title">
                <Input placeholder="e.g. Principal Cloud Architect" />
              </Form.Item>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="speaker_company" label="Company / Organization">
                <Input placeholder="e.g. TechGlobal Systems" />
              </Form.Item>
              <Form.Item name="speaker_image" label="Speaker Photo URL">
                <Input placeholder="https://..." />
              </Form.Item>
            </div>
          </div>

          <Form.Item
            name="short_description"
            label={<span style={{ fontWeight: 600 }}>Short Summary</span>}
            rules={[{ required: true, message: 'Please provide a short summary' }]}
          >
            <TextArea rows={2} placeholder="Join leading architects as we explore cloud modernization, enterprise generative AI workloads..." />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ fontWeight: 600 }}>Full Agenda / Description</span>}
          >
            <TextArea rows={4} placeholder="<p>Full event details, session timings, and key takeaways...</p>" />
          </Form.Item>

          <Form.Item
            name="banner_image"
            label={<span style={{ fontWeight: 600 }}>Banner Image URL (optional)</span>}
          >
            <Input placeholder="https://images.unsplash.com/... (Leave empty for default)" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="max_capacity"
              label={<span style={{ fontWeight: 600 }}>Seating Capacity (0 = Unlimited)</span>}
            >
              <InputNumber min={0} style={{ width: '100%' }} size="large" />
            </Form.Item>

            <Form.Item
              name="timezone"
              label={<span style={{ fontWeight: 600 }}>Timezone</span>}
            >
              <Input placeholder="IST (UTC+5:30)" size="large" />
            </Form.Item>
          </div>

          <Form.Item name="featured" valuePropName="checked">
            <Switch /> <span style={{ marginLeft: 8, fontWeight: 600 }}>Pin as Featured Event</span>
          </Form.Item>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <Button size="large" onClick={() => setIsAddEventOpen(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={creatingEvent}
              style={{
                background: 'linear-gradient(135deg, #0B1F4D 0%, #1E3A8A 100%)',
                fontWeight: 700,
                borderRadius: 8,
                padding: '0 28px'
              }}
            >
              Publish Event Now
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
