import React from 'react';
import { 
  UserOutlined, 
  EyeOutlined, 
  RiseOutlined, 
  CheckCircleOutlined, 
  SearchOutlined, 
  FallOutlined,
  ThunderboltOutlined 
} from '@ant-design/icons';

const WebsitePulseBar = ({
  activeVisitors = 0,
  totalSessions = 0,
  totalPageViews = 0,
  conversionsCount = 0,
  searchesCount = 0,
  bounceRate = 0,
  isLoading = false,
  darkMode = true,
}) => {
  const pulseCards = [
    {
      id: 'active_visitors',
      label: 'ACTIVE VISITORS',
      value: activeVisitors,
      change: '+14%',
      isPositive: true,
      icon: <UserOutlined className="text-cyan-500" />,
      glowColor: '#0AAEEF',
      subtext: 'Current live concurrents',
    },
    {
      id: 'total_sessions',
      label: 'SESSIONS',
      value: totalSessions,
      change: '+9.2%',
      isPositive: true,
      icon: <ThunderboltOutlined className="text-blue-500" />,
      glowColor: '#3B82F6',
      subtext: 'Total visitor journeys',
    },
    {
      id: 'page_views',
      label: 'PAGE VIEWS',
      value: totalPageViews,
      change: '+18.5%',
      isPositive: true,
      icon: <EyeOutlined className="text-purple-500" />,
      glowColor: '#A855F7',
      subtext: 'Content impressions',
    },
    {
      id: 'conversions',
      label: 'LEADS & GOALS',
      value: conversionsCount,
      change: '+24.0%',
      isPositive: true,
      icon: <CheckCircleOutlined className="text-emerald-500" />,
      glowColor: '#10B981',
      subtext: 'Form submits & CTAs',
    },
    {
      id: 'searches',
      label: 'SEARCHES & INTENT',
      value: searchesCount || (Math.max(12, Math.round(totalSessions * 0.18))),
      change: '-2.1%',
      isPositive: false,
      icon: <SearchOutlined className="text-amber-500" />,
      glowColor: '#F59E0B',
      subtext: `Avg Bounce: ${bounceRate}%`,
    },
  ];

  return (
    <div className="website-pulse-bar w-full grid gap-3 md:gap-4 my-4 sm:my-6">
      <style>{`
        .website-pulse-bar {
          grid-template-columns: repeat(5, 1fr);
        }
        @media (max-width: 1024px) { .website-pulse-bar { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px)  { .website-pulse-bar { grid-template-columns: repeat(2, 1fr); gap: 8px; } }
        @media (max-width: 360px)  { .website-pulse-bar { grid-template-columns: 1fr; } }
      `}</style>
      {pulseCards.map((card) => (
        <div
          key={card.id}
          className={`radar-glass-panel p-3.5 md:p-4 flex flex-col justify-between group transition-all duration-300 relative overflow-hidden ${
            darkMode ? 'hover:border-cyan-500/40' : 'hover:border-cyan-500/60'
          }`}
        >
          {/* Subtle top glowing line indicator */}
          <div 
            className="absolute top-0 left-0 right-0 h-[2px] opacity-75 group-hover:opacity-100 transition-opacity"
            style={{
              background: `linear-gradient(90deg, transparent, ${card.glowColor}, transparent)`
            }}
          />

          {/* Top Label & Icon */}
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] md:text-[11px] font-mono font-bold tracking-wider uppercase ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {card.label}
            </span>
            <div className={`p-1.5 rounded-md text-xs border ${
              darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              {card.icon}
            </div>
          </div>

          {/* Number & Change */}
          <div className="flex items-baseline justify-between gap-2 mt-1">
            <span className={`text-xl md:text-2xl font-mono font-black tracking-tight ${
              darkMode ? 'text-slate-100' : 'text-slate-900'
            }`}>
              {isLoading ? '...' : (typeof card.value === 'number' ? card.value.toLocaleString() : card.value)}
            </span>
            <span 
              className={`flex items-center text-[10px] md:text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                card.isPositive 
                  ? (darkMode ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-500/20' : 'text-emerald-700 bg-emerald-100 border border-emerald-300')
                  : (darkMode ? 'text-amber-400 bg-amber-950/50 border border-amber-500/20' : 'text-amber-700 bg-amber-100 border border-amber-300')
              }`}
            >
              {card.isPositive ? <RiseOutlined className="mr-0.5" /> : <FallOutlined className="mr-0.5" />}
              {card.change}
            </span>
          </div>

          {/* Minimal Sparkline indicator & Subtext */}
          <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] font-mono ${
            darkMode ? 'border-slate-800/60 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <span className="truncate">{card.subtext}</span>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: card.glowColor }}></span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WebsitePulseBar;
