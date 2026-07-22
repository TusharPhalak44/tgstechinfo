import React from 'react';
import { Clock, X } from 'lucide-react';
import { useChat } from '../../../context/ChatContext';

const RecentSearches = () => {
  const { recentSearches, search, removeRecentSearch } = useChat();

  if (recentSearches.length === 0) {
    return null;
  }

  const handleSearchClick = (searchQuery) => {
    search(searchQuery);
  };

  const handleClearRecent = (e, searchQuery) => {
    e.stopPropagation();
    removeRecentSearch(searchQuery);
  };

  return (
    <div style={{
      marginBottom: 20
    }}>
      <h3 style={{
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--color-heading)',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        <Clock size={16} />
        Recent Searches
      </h3>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8
      }}>
        {recentSearches.map((searchQuery, index) => (
          <div
            key={index}
            onClick={() => handleSearchClick(searchQuery)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 16,
              background: 'var(--color-bg-alt)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              transition: 'all 0.2s'
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
            <span style={{
              fontSize: 12,
              color: 'var(--color-body)',
              maxWidth: 150,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {searchQuery}
            </span>
            <button
              onClick={(e) => handleClearRecent(e, searchQuery)}
              style={{
                border: 'none',
                background: 'none',
                padding: 2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--color-muted)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-error)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-muted)';
              }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentSearches;
