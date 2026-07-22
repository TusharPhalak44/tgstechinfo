import React from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const KnowledgeBaseAnswer = ({ answer }) => {
  const navigate = useNavigate();

  if (!answer) return null;

  const handleLinkClick = () => {
    if (answer.link) {
      navigate(answer.link);
    }
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 20,
      border: '1px solid #e8e8e8',
      borderLeft: '4px solid #F7941D'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12
      }}>
        <Info size={20} style={{ color: '#F7941D' }} />
        <h4 style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--color-heading)',
          margin: 0
        }}>
          {answer.title}
        </h4>
      </div>

      <p style={{
        fontSize: 14,
        color: 'var(--color-body)',
        lineHeight: 1.6,
        margin: '0 0 16px 0'
      }}>
        {answer.content}
      </p>

      {answer.link && (
        <button
          onClick={handleLinkClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #F7941D 0%, #E67E00 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(247, 148, 29, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Learn More
          <ExternalLink size={14} />
        </button>
      )}
    </div>
  );
};

export default KnowledgeBaseAnswer;
