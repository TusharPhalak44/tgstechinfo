import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../../context/ChatContext';

const ChatMessage = ({ message }) => {
  const navigate = useNavigate();
  const { logClick, handleSearchWithIntent, endChat } = useChat();
  const [querySuccessDone, setQuerySuccessDone] = useState(false);
  const { role, text, type, data, timestamp } = message;
  const isUser = role === 'user';

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 16,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        maxWidth: isUser ? '80%' : '95%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start'
      }}>
        {/* Message Bubble */}
        <div style={{
          background: isUser 
            ? 'linear-gradient(135deg, #0B1F4D 0%, #123A8C 100%)'
            : 'var(--color-bg-alt)',
          color: isUser ? '#fff' : 'var(--color-body)',
          padding: '12px 16px',
          borderRadius: isUser 
            ? '18px 18px 4px 18px'
            : '18px 18px 18px 4px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          wordBreak: 'break-word',
          fontSize: 14,
          lineHeight: 1.5
        }}>
          {type === 'text' && text}
          {type === 'category_cards' && data && (
            <div style={{ marginTop: 8 }}>
              {data.categories?.filter(cat => cat && typeof cat === 'string').map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (data.onCategoryClick) data.onCategoryClick(cat);
                    else handleSearchWithIntent(cat);
                  }}
                  style={{
                    display: 'inline-block',
                    margin: '4px',
                    padding: '8px 16px',
                    borderRadius: 20,
                    background: 'var(--color-primary-light)',
                    border: '1px solid var(--color-primary)',
                    color: 'var(--color-primary)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-primary)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--color-primary-light)';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
          {type === 'content_cards' && data && (
            <div style={{ marginTop: 8, width: '100%' }}>
              {data.results?.map((item, idx) => {
                const bannerSrc = item.banner_image
                  ? (item.banner_image.startsWith('http') ? item.banner_image : `/uploads/${item.banner_image}`)
                  : null;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      logClick(item.id);
                      navigate(item.url || `/article/${item.slug}`);
                    }}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: 10,
                      marginBottom: 10,
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 10,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      alignItems: 'flex-start',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Banner Image */}
                    <div style={{
                      width: 72,
                      height: 56,
                      flexShrink: 0,
                      borderRadius: 6,
                      overflow: 'hidden',
                      background: 'var(--color-bg-alt)'
                    }}>
                      {bannerSrc ? (
                        <img
                          src={bannerSrc}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 20
                        }}>📄</div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: 'var(--color-heading)',
                        marginBottom: 4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4
                      }}>
                        {item.title}
                      </div>

                      {item.short_description && (
                        <div style={{
                          fontSize: 11,
                          color: 'var(--color-body)',
                          marginBottom: 6,
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {item.short_description}
                        </div>
                      )}

                      <div style={{
                        fontSize: 11,
                        color: 'var(--color-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexWrap: 'wrap'
                      }}>
                        {item.category && <span>{item.category}</span>}
                        {item.category && item.published_date && <span>•</span>}
                        {item.published_date && (
                          <span>{new Date(item.published_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {type === 'page_info' && data && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-heading)', marginBottom: 8 }}>
                {data.title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-body)', marginBottom: 12, lineHeight: 1.5 }}>
                {data.summary}
              </div>
              {data.link && (
                <button
                  onClick={() => navigate(data.link)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Visit Page
                </button>
              )}
            </div>
          )}
          {type === 'query_success' && !querySuccessDone && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                  Thank you for your query
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-body)', marginBottom: 16, lineHeight: 1.5 }}>
                Your query has been submitted successfully. Our administrator has received your request. You will receive a response on your registered email address shortly.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setQuerySuccessDone(true)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 8,
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Continue Chat
                </button>
                <button
                  onClick={() => { setQuerySuccessDone(true); endChat(); }}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 8,
                    background: 'var(--color-bg-alt)',
                    color: 'var(--color-body)',
                    border: '1px solid var(--color-border)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Stop Chat
                </button>
              </div>
            </div>
          )}
          {type === 'query_success' && querySuccessDone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>Thank you for your query</span>
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <div style={{
          fontSize: 10,
          color: 'var(--color-muted)',
          marginTop: 4,
          opacity: 0.7
        }}>
          {formatTime(timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
