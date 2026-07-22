import React from 'react';
import { useChat } from '../../../context/ChatContext';

const RelatedSuggestions = ({ suggestions }) => {
  const { handleSearchWithIntent } = useChat();

  if (!suggestions || suggestions.length === 0) return null;

  const handleSuggestionClick = (suggestion) => {
    const searchTerm = suggestion.name || suggestion.slug;
    handleSearchWithIntent(searchTerm);
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 20,
      border: '1px solid #e8e8e8'
    }}>
      <h4 style={{
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--color-heading)',
        margin: '0 0 16px 0'
      }}>
        You may also explore:
      </h4>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'var(--color-bg-alt)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.background = 'var(--color-primary-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.background = 'var(--color-bg-alt)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-body)'
              }}>
                {suggestion.name}
              </span>
              {suggestion.type && (
                <span style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  textTransform: 'capitalize'
                }}>
                  {suggestion.type}
                </span>
              )}
            </div>
            {suggestion.count && (
              <span style={{
                fontSize: 11,
                color: 'var(--color-muted)'
              }}>
                {suggestion.count} results
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RelatedSuggestions;
