import React from 'react';
import { Spin } from 'antd';
import { useTheme } from '../../context/ThemeContext';

const RouteLoadingFallback = () => {
  const { darkMode } = useTheme();
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '60vh',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: darkMode ? '#0F172A' : 'transparent',
        transition: 'background-color 0.3s ease',
      }}
    >
      <Spin size="large" />
    </div>
  );
};

export default RouteLoadingFallback;
