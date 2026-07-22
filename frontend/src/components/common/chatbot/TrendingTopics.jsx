import React from 'react';
import { Card, Tag } from 'antd';
import { TrendingUp, Flame } from 'lucide-react';
import { useChat } from '../../../context/ChatContext';

const TrendingTopics = () => {
  const { trending, search } = useChat();

  if (trending.length === 0) {
    return null;
  }

  const handleTrendingClick = (item) => {
    search(item.title, 'keyword');
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
        <TrendingUp size={16} />
        Trending Now
      </h3>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}>
        {trending.slice(0, 5).map((item, index) => (
          <Card
            key={item.id}
            hoverable
            onClick={() => handleTrendingClick(item)}
            style={{
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              padding: '10px 12px',
              transition: 'all 0.2s'
            }}
            styles={{
              body: {
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }
            }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: index < 3 ? 'linear-gradient(135deg, #F7941D 0%, #E67E00 100%)' : 'var(--color-bg-alt)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: index < 3 ? '#fff' : 'var(--color-muted)',
              flexShrink: 0
            }}>
              {index + 1}
            </div>
            <div style={{
              flex: 1,
              minWidth: 0
            }}>
              <span style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--color-heading)',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {item.title}
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 2
              }}>
                <span style={{
                  fontSize: 10,
                  color: 'var(--color-muted)'
                }}>
                  {item.category}
                </span>
                {item.chatbot_click_count > 0 && (
                  <span style={{
                    fontSize: 10,
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <Flame size={10} />
                    {item.chatbot_click_count}
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TrendingTopics;
