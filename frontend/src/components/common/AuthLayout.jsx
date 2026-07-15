import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[var(--color-bg-alt)]">
      {children}
    </div>
  );
};

export default AuthLayout;
