import React from 'react';
import { Card, Tag } from 'antd';
import { ExternalLink, Calendar, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../../context/ChatContext';

const SearchResults = ({ query }) => {
  const { searchResults, logClick } = useChat();
  const navigate = useNavigate();

  const handleContentClick = (content, index) => {
    logClick(content.id, index);
    navigate(content.url);
  };

  // If no results, return null - ChatContext handles showing suggestions/query form
  if (searchResults.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '0 0 4px 0' }}>
        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "<strong>{query}</strong>"
      </p>
      {searchResults.map((result, index) => (
        <Card
          key={result.id}
          hoverable
          onClick={() => handleContentClick(result, index)}
          style={{
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          styles={{ body: { padding: '16px' } }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {result.banner_image && (
              <img
                src={`/uploads/${result.banner_image}`}
                alt={result.title}
                style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <Tag style={{
                  margin: 0, background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)', border: 'none',
                  borderRadius: 4, fontSize: 11, padding: '2px 8px'
                }}>
                  {result.content_type}
                </Tag>
                <span style={{ fontSize: 11, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} />
                  {new Date(result.published_date).toLocaleDateString()}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Eye size={12} />
                  {result.view_count || 0}
                </span>
              </div>
              <h4 style={{
                fontSize: 14, fontWeight: 600, color: 'var(--color-heading)',
                margin: '0 0 6px 0', lineHeight: 1.4,
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
              }}>
                {result.title}
              </h4>
              <p style={{
                fontSize: 12, color: 'var(--color-body)', margin: 0, lineHeight: 1.5,
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
              }}>
                {result.short_description}
              </p>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{result.category}</span>
                <ExternalLink size={12} style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SearchResults;
