import React, { useState, useEffect } from 'react';
import { Card, Tag, Spin } from 'antd';
import { ExternalLink, Calendar, Link2, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../../context/ChatContext';

const RelatedContent = ({ contentId, title }) => {
  const { getRelatedContent, logClick } = useChat();
  const navigate = useNavigate();
  const [relatedContent, setRelatedContent] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contentId) {
      loadRelatedContent();
    }
  }, [contentId]);

  const loadRelatedContent = async () => {
    setLoading(true);
    const content = await getRelatedContent(contentId);
    setRelatedContent(content);
    setLoading(false);
  };

  const handleContentClick = (content, index) => {
    logClick(content.id, index);
    navigate(content.url);
  };

  if (!contentId) {
    return null;
  }

  const getReasonLabel = (reason) => {
    const labels = {
      'same_category': 'Same Category',
      'same_tags': 'Similar Tags',
      'same_author': 'Same Author',
      'most_viewed': 'Popular',
      'recently_published': 'Recently Published',
      'editors_choice': "Editor's Choice"
    };
    return labels[reason] || 'Recommended';
  };

  const getReasonIcon = (reason) => {
    switch (reason) {
      case 'same_category':
        return <Link2 size={12} />;
      case 'same_tags':
        return <Link2 size={12} />;
      case 'same_author':
        return <Star size={12} />;
      case 'most_viewed':
        return <Star size={12} />;
      case 'recently_published':
        return <Calendar size={12} />;
      case 'editors_choice':
        return <Star size={12} />;
      default:
        return <Link2 size={12} />;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '16px' }}>
        <Spin size="small" />
        <span style={{ fontSize: 12, color: 'var(--color-muted)', marginLeft: 8 }}>
          Loading related content...
        </span>
      </div>
    );
  }

  if (relatedContent.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--color-heading)',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        <Link2 size={16} />
        Related Content
      </h3>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        {relatedContent.map((result, index) => (
          <Card
            key={result.id}
            hoverable
            onClick={() => handleContentClick(result, index)}
            style={{
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              padding: '12px'
            }}
            bodyStyle={{
              padding: 0
            }}
          >
            <div style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start'
            }}>
              {result.banner_image && (
                <img
                  src={`/uploads/${result.banner_image}`}
                  alt={result.title}
                  style={{
                    width: 60,
                    height: 45,
                    objectFit: 'cover',
                    borderRadius: 6,
                    flexShrink: 0
                  }}
                />
              )}
              <div style={{
                flex: 1,
                minWidth: 0
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 4,
                  flexWrap: 'wrap'
                }}>
                  <Tag
                    style={{
                      margin: 0,
                      background: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 10,
                      padding: '1px 6px'
                    }}
                  >
                    {result.content_type}
                  </Tag>
                  {result.recommendation_reason && (
                    <span style={{
                      fontSize: 10,
                      color: 'var(--color-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      {getReasonIcon(result.recommendation_reason)}
                      {getReasonLabel(result.recommendation_reason)}
                    </span>
                  )}
                </div>
                <h4 style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-heading)',
                  margin: '0 0 4px 0',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {result.title}
                </h4>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <span style={{
                    fontSize: 10,
                    color: 'var(--color-muted)'
                  }}>
                    {result.category}
                  </span>
                  <ExternalLink size={10} style={{ color: 'var(--color-primary)' }} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RelatedContent;
