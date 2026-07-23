import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Spin } from 'antd';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // If not authenticated after loading, open login in new tab
    // and show a message on the current page
    if (!loading && !isAuthenticated) {
      window.open('/login', '_blank', 'noopener,noreferrer');
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 16, color: 'var(--color-muted)' }}>Please login to access this page.</p>
        <button
          onClick={() => window.open('/login', '_blank', 'noopener,noreferrer')}
          style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Open Login
        </button>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
