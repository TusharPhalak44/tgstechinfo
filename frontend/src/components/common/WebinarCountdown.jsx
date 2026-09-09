import React, { useState, useEffect } from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';
import moment from 'moment';

const WebinarCountdown = ({ webinarDate, darkMode }) => {
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

  return (
    <div style={{
      background: darkMode ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #4a7cff 0%, #6c5ce7 100%)',
      borderRadius: 12,
      padding: '24px 32px',
      margin: '24px 0 16px',
      border: darkMode ? '2px solid #334155' : 'none',
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(74, 124, 255, 0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <ClockCircleOutlined style={{ fontSize: 24, color: darkMode ? '#4a7cff' : '#fff' }} />
        <div>
          <div style={{ 
            fontSize: 18, 
            fontWeight: 700, 
            color: darkMode ? '#f1f5f9' : '#fff',
            marginBottom: 4
          }}>
            Webinar Starting Soon
          </div>
          <div style={{ 
            fontSize: 13, 
            color: darkMode ? '#94a3b8' : 'rgba(255,255,255,0.8)' 
          }}>
            {moment(webinarDate).format('MMMM D, YYYY [at] h:mm A')}
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: 16, 
        justifyContent: 'center',
        marginTop: 8
      }}>
        {[
          { label: 'Days', value: timeLeft.days },
          { label: 'Hours', value: timeLeft.hours },
          { label: 'Minutes', value: timeLeft.minutes },
          { label: 'Seconds', value: timeLeft.seconds }
        ].map((item, index) => (
          <div 
            key={index}
            style={{
              background: darkMode ? 'rgba(74, 124, 255, 0.1)' : 'rgba(255,255,255,0.2)',
              borderRadius: 8,
              padding: '16px 20px',
              minWidth: 80,
              textAlign: 'center',
              border: darkMode ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.3)'
            }}
          >
            <div style={{ 
              fontSize: 32, 
              fontWeight: 700, 
              color: darkMode ? '#4a7cff' : '#fff',
              lineHeight: 1,
              marginBottom: 4
            }}>
              {formatTime(item.value)}
            </div>
            <div style={{ 
              fontSize: 11, 
              fontWeight: 600, 
              color: darkMode ? '#94a3b8' : 'rgba(255,255,255,0.8)',
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WebinarCountdown;