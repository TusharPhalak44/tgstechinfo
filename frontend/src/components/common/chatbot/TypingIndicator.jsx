import React from 'react';

const TypingIndicator = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '12px 16px',
      background: 'var(--color-bg-alt)',
      borderRadius: 12,
      marginBottom: 16
    }}>
      <div style={{
        display: 'flex',
        gap: 4
      }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--color-primary)',
          animation: 'bounce 1.4s infinite ease-in-out both'
        }} />
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--color-primary)',
          animation: 'bounce 1.4s infinite ease-in-out both',
          animationDelay: '0.16s'
        }} />
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--color-primary)',
          animation: 'bounce 1.4s infinite ease-in-out both',
          animationDelay: '0.32s'
        }} />
      </div>
      <span style={{
        fontSize: 12,
        color: 'var(--color-muted)',
        marginLeft: 8
      }}>
        Searching...
      </span>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;
