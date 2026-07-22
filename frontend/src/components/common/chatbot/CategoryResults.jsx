import React from 'react';
import { Card, Tag } from 'antd';
import { Folder, ChevronRight } from 'lucide-react';
import { useChat } from '../../../context/ChatContext';

const CategoryResults = () => {
  const { categories, search } = useChat();

  if (categories.length === 0) {
    return null;
  }

  const handleCategoryClick = (category) => {
    search(category.name, 'category');
  };

  return (
    <div>
      <h3 style={{
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--color-heading)',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        <Folder size={16} />
        Browse by Category
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 8
      }}>
        {categories.map((category) => (
          <Card
            key={category.id}
            hoverable
            onClick={() => handleCategoryClick(category)}
            style={{
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              textAlign: 'center',
              padding: '12px 8px',
              transition: 'all 0.2s'
            }}
            styles={{
              body: {
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6
              }
            }}
          >
            <span style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--color-heading)',
              textAlign: 'center',
              lineHeight: 1.3
            }}>
              {category.name}
            </span>
            <ChevronRight size={14} style={{ color: 'var(--color-muted)' }} />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CategoryResults;
