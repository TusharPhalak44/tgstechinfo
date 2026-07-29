import React from 'react';

const CategoryCards = ({ categories, onCategoryClick }) => {
  const categoryList = [
    'Articles',
    'News',
    'Blogs',
    'Whitepapers',
    'Reports',
    'Webinars',
    'Events',
    'Resources',
    'Other'
  ];

  const displayCategories = categories || categoryList;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 8,
      marginTop: 12
    }}>
      {displayCategories.map((category, idx) => (
        <button
          key={idx}
          onClick={() => onCategoryClick?.(category)}
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'var(--color-bg-alt)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-body)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.background = 'var(--color-primary-light)';
            e.currentTarget.style.color = 'var(--color-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.background = 'var(--color-bg-alt)';
            e.currentTarget.style.color = 'var(--color-body)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryCards;
