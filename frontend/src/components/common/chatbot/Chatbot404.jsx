import React from 'react';
import { Search, FileText, Calendar, Tag } from 'lucide-react';

const Chatbot404 = ({ query }) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 20px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
      borderRadius: 16,
      border: '1px solid #e1e8ed'
    }}>
      {/* 404 Icon */}
      <div style={{
        width: 120,
        height: 120,
        margin: '0 auto 24px',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)'
      }}>
        <Search size={48} color="#fff" strokeWidth={2} />
      </div>

      {/* 404 Text */}
      <div style={{
        fontSize: 64,
        fontWeight: 700,
        color: '#ff6b6b',
        marginBottom: 8,
        lineHeight: 1
      }}>
        404
      </div>

      {/* Message */}
      <h2 style={{
        fontSize: 20,
        fontWeight: 600,
        color: '#2c3e50',
        marginBottom: 12
      }}>
        Content Not Found
      </h2>

      <p style={{
        fontSize: 14,
        color: '#64748b',
        marginBottom: 24,
        maxWidth: 400,
        margin: '0 auto 24px'
      }}>
        We couldn't find any content matching "<strong>{query}</strong>" in our database.
      </p>

      {/* Suggestions */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 20,
        maxWidth: 380,
        margin: '0 auto',
        border: '1px solid #e1e8ed'
      }}>
        <h3 style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#2c3e50',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}>
          <FileText size={16} />
          Try These Tips
        </h3>

        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          textAlign: 'left',
          fontSize: 13,
          color: '#64748b'
        }}>
          <li style={{
            marginBottom: 12,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8
          }}>
            <span style={{ color: '#ff6b6b', fontWeight: 600 }}>•</span>
            <span>Check your spelling and try different keywords</span>
          </li>
          <li style={{
            marginBottom: 12,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8
          }}>
            <span style={{ color: '#ff6b6b', fontWeight: 600 }}>•</span>
            <span>Try more general terms or fewer words</span>
          </li>
          <li style={{
            marginBottom: 12,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8
          }}>
            <span style={{ color: '#ff6b6b', fontWeight: 600 }}>•</span>
            <span>Browse trending topics or categories</span>
          </li>
          <li style={{
            marginBottom: 0,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8
          }}>
            <span style={{ color: '#ff6b6b', fontWeight: 600 }}>•</span>
            <span>Use category filters for better results</span>
          </li>
        </ul>
      </div>

      {/* Bottom Note */}
      <div style={{
        marginTop: 24,
        fontSize: 12,
        color: '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6
      }}>
        <Calendar size={14} />
        <span>Our content is regularly updated. Check back later!</span>
      </div>
    </div>
  );
};

export default Chatbot404;
