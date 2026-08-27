import React, { useRef, useEffect } from 'react';
import {
  DashboardOutlined,
  DotChartOutlined,
  GlobalOutlined,
  NodeIndexOutlined,
  FileTextOutlined,
  InteractionOutlined,
  AimOutlined,
  DesktopOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const TABS = [
  { key: 'overview',     label: 'Overview',             icon: <DashboardOutlined /> },
  { key: 'realtime',     label: 'Real-Time',            icon: <DotChartOutlined /> },
  { key: 'global',       label: 'Global Traffic',       icon: <GlobalOutlined /> },
  { key: 'sources',      label: 'Traffic Sources',      icon: <NodeIndexOutlined /> },
  { key: 'content',      label: 'Content Performance',  icon: <FileTextOutlined /> },
  { key: 'engagement',   label: 'Engagement',           icon: <InteractionOutlined /> },
  { key: 'conversions',  label: 'Conversions',          icon: <AimOutlined /> },
  { key: 'technology',   label: 'Technology',           icon: <DesktopOutlined /> },
  { key: 'seo',          label: 'SEO',                  icon: <SearchOutlined /> },
  { key: 'performance',  label: 'Performance',          icon: <ThunderboltOutlined /> },
];

const AnalyticsTabs = ({ activeTab, onChange, darkMode }) => {
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeTab]);

  return (
    <div
      className="radar-glass-panel analytics-tabs-container"
      style={{
        padding: '4px 6px',
        overflowX: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: darkMode ? '#475569 #1E293B' : '#94A3B8 #F1F5F9',
        position: 'sticky', top: 0, zIndex: 30,
        background: darkMode ? '#0F172A' : '#FFFFFF',
        borderColor: darkMode ? '#334155' : '#E2E8F0',
      }}
    >
      <style>{`
        .analytics-tabs-container::-webkit-scrollbar {
          height: 4px;
        }
        .analytics-tabs-container::-webkit-scrollbar-track {
          background: ${darkMode ? '#1E293B' : '#F1F5F9'};
          border-radius: 2px;
        }
        .analytics-tabs-container::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#475569' : '#94A3B8'};
          border-radius: 2px;
        }
        .analytics-tabs-container::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#64748B' : '#64748B'};
        }
        @keyframes tabSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .analytics-section-enter {
          animation: tabSlideIn 0.3s ease-out both;
        }
      `}</style>
      <div
        className="analytics-tab-bar"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          minWidth: 'max-content',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              ref={isActive ? activeRef : null}
              onClick={() => onChange(tab.key)}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = darkMode ? '#1E293B' : '#F1F5F9';
                  e.currentTarget.style.color = darkMode ? '#F1F5F9' : '#0F172A';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = darkMode ? '#94A3B8' : '#64748B';
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 10px', borderRadius: 6,
                border: isActive
                  ? `1px solid ${darkMode ? '#0AAEEF' : '#0284C7'}`
                  : '1px solid transparent',
                background: isActive
                  ? (darkMode ? '#0E2A47' : '#E0F2FE')
                  : 'transparent',
                color: isActive
                  ? (darkMode ? '#38BDF8' : '#0284C7')
                  : (darkMode ? '#94A3B8' : '#64748B'),
                cursor: 'pointer', whiteSpace: 'nowrap',
                fontSize: 11, fontWeight: isActive ? 700 : 500,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'all 0.2s ease',
              }}
              className="analytics-tab-button"
            >
              <span style={{ fontSize: 14, display: 'inline-flex', alignItems: 'center' }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {isActive && (
                <span className="active-indicator-dot" style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#0AAEEF',
                  marginLeft: 2,
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { TABS };
export default AnalyticsTabs;
