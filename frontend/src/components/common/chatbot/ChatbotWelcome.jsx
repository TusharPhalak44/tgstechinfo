import React from 'react';
import { Bot } from 'lucide-react';
import { useChat } from '../../../context/ChatContext';

const ChatbotWelcome = () => {
  const { handleSearchWithIntent } = useChat();
  
  const topics = [
    'Articles',
    'Whitepapers',
    'Reports',
    'Company',
    'Services',
    'Contact',
    'Privacy Policy',
    'Cookies',
    'Lead Generation',
    'Demand Generation'
  ];

  const handleTopicClick = (topic) => {
    handleSearchWithIntent(topic);
  };

  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 20px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
      borderRadius: 16,
      border: '1px solid #e1e8ed'
    }}>
      {/* Robot Icon */}
      <div style={{
        width: 80,
        height: 80,
        margin: '0 auto 20px',
        background: 'linear-gradient(135deg, #F7941D 0%, #E67E00 100%)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(247, 148, 29, 0.3)'
      }}>
        <Bot size={40} color="#fff" strokeWidth={2} />
      </div>

      {/* Welcome Message */}
      <h3 style={{
        fontSize: 18,
        fontWeight: 600,
        color: 'var(--color-heading)',
        margin: '0 0 12px 0'
      }}>
        How may I help you?
      </h3>

      <p style={{
        fontSize: 13,
        color: 'var(--color-muted)',
        margin: '0 0 24px 0'
      }}>
        You can ask me about:
      </p>

      {/* Topics Grid */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
        maxWidth: 400,
        margin: '0 auto'
      }}>
        {topics.map((topic, index) => (
          <span
            key={index}
            onClick={() => handleTopicClick(topic)}
            style={{
              fontSize: 12,
              padding: '6px 12px',
              borderRadius: 16,
              background: 'var(--color-bg-alt)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-body)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.background = 'var(--color-primary-light)';
              e.currentTarget.style.color = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.background = 'var(--color-bg-alt)';
              e.currentTarget.style.color = 'var(--color-body)';
            }}
          >
            {topic}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ChatbotWelcome;
