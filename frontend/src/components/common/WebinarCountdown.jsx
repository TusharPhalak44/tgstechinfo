import React, { useState, useEffect } from 'react';
import { ClockCircleOutlined, CalendarOutlined, BellOutlined, GoogleOutlined, ThunderboltFilled } from '@ant-design/icons';
import { Dropdown, Button, Tag, Space, Tooltip } from 'antd';
import moment from 'moment';

const WebinarCountdown = ({ webinarDate, darkMode, title = 'Live Technical Webinar', variant = 'hero' }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = moment();
      const webinarTime = moment(webinarDate);
      const diff = webinarTime.diff(now);

      if (diff <= 0) {
        return null; // Webinar time has passed
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      if (newTimeLeft === null) {
        clearInterval(timer);
      }
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [webinarDate]);

  if (!timeLeft) {
    return null; // Don't show countdown if time has passed
  }

  const formatTime = (value) => value.toString().padStart(2, '0');

  // Calendar Links Generator
  const getGoogleCalendarUrl = () => {
    const start = moment(webinarDate).utc().format('YYYYMMDDTHHmmss[Z]');
    const end = moment(webinarDate).add(1, 'hour').utc().format('YYYYMMDDTHHmmss[Z]');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent('Join our live technical webinar session on TGS Tech Info!')}`;
  };

  const downloadIcsFile = () => {
    const start = moment(webinarDate).utc().format('YYYYMMDDTHHmmss[Z]');
    const end = moment(webinarDate).add(1, 'hour').utc().format('YYYYMMDDTHHmmss[Z]');
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TGS Tech Info//Webinar Calendar//EN
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:Join our live technical webinar session on TGS Tech Info!
DTSTART:${start}
DTEND:${end}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calendarMenuItems = [
    {
      key: 'google',
      label: (
        <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GoogleOutlined style={{ color: '#ea4335' }} /> Add to Google Calendar
        </a>
      ),
    },
    {
      key: 'ics',
      label: (
        <div onClick={downloadIcsFile} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <CalendarOutlined style={{ color: '#0284c7' }} /> Download iCal / Outlook (.ics)
        </div>
      ),
    },
  ];

  // Compact Variant (used in small cards)
  if (variant === 'compact') {
    return (
      <div style={{
        background: darkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(241, 245, 249, 0.95)',
        backdropFilter: 'blur(10px)',
        border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
        borderRadius: 10,
        padding: '10px 14px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <ClockCircleOutlined style={{ fontSize: 16, color: '#38bdf8' }} />
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: darkMode ? '#f8fafc' : '#0f172a' }}>
          {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}{formatTime(timeLeft.hours)}h {formatTime(timeLeft.minutes)}m {formatTime(timeLeft.seconds)}s
        </span>
      </div>
    );
  }

  // Hero Variant (Modern & Unique HUD aesthetic)
  return (
    <div style={{
      position: 'relative',
      background: darkMode
        ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #090d16 100%)'
        : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #030712 100%)', // Rich dark high-tech background for both modes for premium HUD feel
      borderRadius: 20,
      padding: '28px 32px',
      margin: '24px 0 20px',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.15)',
      overflow: 'hidden',
      color: '#fff'
    }}>
      {/* Background Ambient Radial Lights */}
      <div style={{
        position: 'absolute',
        top: '-40%',
        right: '-10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-40%',
        left: '-10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
        borderRadius: '50%'
      }} />

      {/* Top Header Row */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 24,
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Animated Pulsing Dot Tag */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '6px 14px',
            borderRadius: 20
          }}>
            <span style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              boxShadow: '0 0 10px #ef4444',
              display: 'inline-block',
              animation: 'pulseGlow 1.5s infinite ease-in-out'
            }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Live Event Countdown
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13 }}>
            <ClockCircleOutlined style={{ color: '#38bdf8' }} />
            <span>Starts {moment(webinarDate).format('dddd, MMMM D, YYYY [at] h:mm A')}</span>
          </div>
        </div>

        {/* Add to Calendar Button */}
        <Dropdown menu={{ items: calendarMenuItems }} trigger={['click']} placement="bottomRight">
          <Button
            type="primary"
            icon={<CalendarOutlined />}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              height: 38,
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
            }}
          >
            Add to Calendar
          </Button>
        </Dropdown>
      </div>

      {/* Modern Digital HUD Countdown Display */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 2,
        margin: '12px 0'
      }}>
        {[
          { label: 'DAYS', value: timeLeft.days, color: '#38bdf8', key: 'days' },
          { label: 'HOURS', value: timeLeft.hours, color: '#818cf8', key: 'hours' },
          { label: 'MINUTES', value: timeLeft.minutes, color: '#c084fc', key: 'minutes' },
          { label: 'SECONDS', value: timeLeft.seconds, color: '#f472b6', key: 'seconds' }
        ].map((item, idx, array) => (
          <React.Fragment key={item.key}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}>
              {/* Modern 3D Flip/HUD Tile */}
              <div style={{
                position: 'relative',
                width: 96,
                height: 94,
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
                backdropFilter: 'blur(12px)',
                borderRadius: 16,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderTop: `3px solid ${item.color}`,
                boxShadow: `0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 15px ${item.color}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {/* Horizontal Center Line divider for flip card look */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: 1,
                  background: 'rgba(0, 0, 0, 0.5)',
                  boxShadow: '0 1px 0 rgba(255, 255, 255, 0.08)'
                }} />

                {/* Digital Digit */}
                <span style={{
                  fontSize: 42,
                  fontWeight: 900,
                  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
                  fontVariantNumeric: 'tabular-nums',
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  textShadow: `0 0 12px ${item.color}80`,
                  lineHeight: 1,
                  zIndex: 2
                }}>
                  {formatTime(item.value)}
                </span>
              </div>

              {/* Label Tag */}
              <div style={{
                marginTop: 10,
                fontSize: 11,
                fontWeight: 800,
                color: item.color,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '3px 10px',
                borderRadius: 12,
                border: `1px solid ${item.color}35`
              }}>
                {item.label}
              </div>
            </div>

            {/* Separator Colons */}
            {idx < array.length - 1 && (
              <div style={{
                fontSize: 32,
                fontWeight: 900,
                color: 'rgba(255, 255, 255, 0.3)',
                marginBottom: 26,
                userSelect: 'none'
              }}>
                :
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Footer Info Bar */}
      <div style={{
        marginTop: 20,
        paddingTop: 16,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: 12,
        color: '#94a3b8',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ThunderboltFilled style={{ color: '#fbbf24' }} />
          <span>Interactive Q&A Session Included</span>
        </div>
        <div style={{ fontSize: 11, opacity: 0.8 }}>
          Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Standard Time'}
        </div>
      </div>

      {/* Keyframe Animations */}
      <style>{`
        @keyframes pulseGlow {
          0% { transform: scale(0.95); opacity: 0.8; boxShadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.1); opacity: 1; boxShadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); opacity: 0.8; boxShadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
};

export default WebinarCountdown;