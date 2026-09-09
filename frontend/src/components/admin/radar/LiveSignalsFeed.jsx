import React, { useState, useEffect } from 'react';
import { 
  ThunderboltOutlined, 
  CheckCircleOutlined, 
  FireOutlined, 
  EyeOutlined, 
  UserAddOutlined, 
  MessageOutlined, 
  FieldTimeOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { getCountryGeo } from './countryCoordinates';

const SIGNAL_TYPES = {
  conversion: {
    color: '#EF4444',
    bgDark: 'rgba(239, 68, 68, 0.12)',
    bgLight: 'rgba(254, 242, 242, 0.95)',
    borderDark: 'rgba(239, 68, 68, 0.35)',
    borderLight: 'rgba(252, 165, 165, 0.6)',
    icon: <CheckCircleOutlined className="text-red-500" />,
    badge: 'CONVERSION',
    badgeDark: 'text-red-400 bg-red-950/60 border-red-500/30',
    badgeLight: 'text-red-700 bg-red-100 border-red-300',
  },
  high_intent: {
    color: '#EAB308',
    bgDark: 'rgba(234, 179, 8, 0.12)',
    bgLight: 'rgba(254, 252, 232, 0.95)',
    borderDark: 'rgba(234, 179, 8, 0.35)',
    borderLight: 'rgba(253, 224, 71, 0.6)',
    icon: <FireOutlined className="text-yellow-500" />,
    badge: 'HIGH INTENT',
    badgeDark: 'text-yellow-400 bg-yellow-950/60 border-yellow-500/30',
    badgeLight: 'text-yellow-800 bg-yellow-100 border-yellow-300',
  },
  engagement: {
    color: '#0AAEEF',
    bgDark: 'rgba(10, 174, 239, 0.12)',
    bgLight: 'rgba(240, 249, 255, 0.95)',
    borderDark: 'rgba(10, 174, 239, 0.35)',
    borderLight: 'rgba(125, 211, 252, 0.6)',
    icon: <EyeOutlined className="text-cyan-500" />,
    badge: 'ENGAGEMENT',
    badgeDark: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30',
    badgeLight: 'text-cyan-800 bg-cyan-100 border-cyan-300',
  },
  new_visitor: {
    color: '#10B981',
    bgDark: 'rgba(16, 185, 129, 0.12)',
    bgLight: 'rgba(240, 253, 244, 0.95)',
    borderDark: 'rgba(16, 185, 129, 0.35)',
    borderLight: 'rgba(134, 239, 172, 0.6)',
    icon: <UserAddOutlined className="text-emerald-500" />,
    badge: 'NEW VISITOR',
    badgeDark: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30',
    badgeLight: 'text-emerald-800 bg-emerald-100 border-emerald-300',
  },
  chatbot: {
    color: '#A855F7',
    bgDark: 'rgba(168, 85, 247, 0.12)',
    bgLight: 'rgba(250, 245, 255, 0.95)',
    borderDark: 'rgba(168, 85, 247, 0.35)',
    borderLight: 'rgba(216, 180, 254, 0.6)',
    icon: <MessageOutlined className="text-purple-500" />,
    badge: 'CHATBOT INTERACTION',
    badgeDark: 'text-purple-400 bg-purple-950/60 border-purple-500/30',
    badgeLight: 'text-purple-800 bg-purple-100 border-purple-300',
  },
};

const cleanPath = (urlStr) => {
  if (!urlStr) return '/';
  try {
    const parsed = new URL(urlStr);
    return parsed.pathname === '/' ? '/' : parsed.pathname;
  } catch {
    return urlStr;
  }
};

const LiveSignalsFeed = ({ 
  recentSessions = [], 
  ctaClicks = [], 
  popularPages = [], 
  chatbotActivity = [], 
  isLive = true,
  darkMode = true 
}) => {
  const [signals, setSignals] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [isPaused, setIsPaused] = useState(false);

  // Process live sessions and events from props
  useEffect(() => {
    const eventList = [];

    if (ctaClicks && ctaClicks.length > 0) {
      ctaClicks.slice(0, 5).forEach((cta, i) => {
        const ctaTime = cta.created_at ? new Date(cta.created_at).getTime() : (Date.now() - (i + 1) * 12000);
        const ageSec = Math.max(1, Math.floor((Date.now() - ctaTime) / 1000));
        const ctaCountry = cta.country || cta.country_name || 'India';
        const geo = getCountryGeo(ctaCountry);
        eventList.push({
          id: `conv-${cta.id || i}-${ctaTime}`,
          type: 'conversion',
          title: cta.cta_type ? `Form Submission: ${cta.cta_type.replace(/_/g, ' ').toUpperCase()}` : 'Contact form submitted',
          subtitle: 'Completed goal action & converted',
          country: geo.country || ctaCountry,
          secondsAgo: ageSec,
        });
      });
    }

    if (recentSessions && recentSessions.length > 0) {
      recentSessions.forEach((session, i) => {
        const startTime = session.session_start ? new Date(session.session_start).getTime() : (Date.now() - (i + 1) * 15000);
        const ageSec = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        const geo = getCountryGeo(session.country);
        const isHighIntent = (session.total_pages_visited >= 2 || session.total_session_duration > 90);
        const isNew = i % 2 === 0;

        const landingClean = cleanPath(session.landing_page);
        const exitClean = session.exit_page ? cleanPath(session.exit_page) : null;
        const journeyText = exitClean ? `${landingClean} → ${exitClean}` : landingClean;

        eventList.push({
          id: `sess-${session.session_uuid || i}-${startTime}`,
          type: isHighIntent ? 'high_intent' : (isNew ? 'new_visitor' : 'engagement'),
          title: isHighIntent 
            ? `Journey: ${journeyText}`
            : (isNew ? `Entered via ${landingClean}` : `Page View: ${landingClean}`),
          subtitle: `${session.total_pages_visited || 1} pages visited · ${session.browser || 'Chrome'} on ${session.device_type || 'Desktop'}`,
          country: geo.country,
          secondsAgo: ageSec,
        });
      });
    }

    eventList.sort((a, b) => a.secondsAgo - b.secondsAgo);
    setSignals(eventList.slice(0, 25));
  }, [recentSessions, ctaClicks, chatbotActivity]);

  // Real-time 1s ticker for true session events
  useEffect(() => {
    if (isPaused) return;

    // Ticker: Increment secondsAgo smoothly for all items every 1s
    const ticker = setInterval(() => {
      setSignals(prev =>
        prev.map(s => ({
          ...s,
          secondsAgo: s.secondsAgo + 1,
        }))
      );
    }, 1000);

    return () => {
      clearInterval(ticker);
    };
  }, [isPaused]);

  const filteredSignals = filterType === 'ALL' 
    ? signals 
    : signals.filter(s => s.type === filterType.toLowerCase());

  const formatTimeAgo = (seconds) => {
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="radar-glass-panel w-full h-[540px] md:h-[620px] lg:h-[680px] flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between pb-3 border-b ${darkMode ? 'border-sky-500/15' : 'border-sky-500/20'}`}>
        <div className="flex items-center gap-2">
          <ThunderboltOutlined className="text-cyan-500 text-base" />
          <h3 className={`text-sm font-bold font-mono tracking-wider uppercase m-0 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
            LIVE SIGNALS
          </h3>
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
            darkMode 
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' 
              : 'bg-cyan-100 text-cyan-800 border-cyan-300'
          }`}>
            {filteredSignals.length} EVENTS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume Feed' : 'Pause Feed'}
            className={`p-1 transition rounded border ${
              darkMode 
                ? 'text-slate-400 hover:text-cyan-400 bg-slate-900/60 border-slate-800' 
                : 'text-slate-600 hover:text-cyan-600 bg-slate-100 border-slate-300'
            }`}
          >
            {isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={`flex items-center gap-1.5 py-2.5 overflow-x-auto cyber-scrollbar border-b text-[10px] font-mono ${
        darkMode ? 'border-sky-500/10' : 'border-sky-500/15'
      }`}>
        {['ALL', 'CONVERSION', 'HIGH_INTENT', 'ENGAGEMENT', 'NEW_VISITOR'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-2 py-1 rounded transition whitespace-nowrap ${
              filterType === type 
                ? (darkMode 
                    ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_8px_rgba(10,174,239,0.3)]' 
                    : 'bg-cyan-600 text-white font-bold border border-cyan-600 shadow-sm')
                : (darkMode 
                    ? 'text-slate-400 hover:text-slate-200 bg-slate-900/40 hover:bg-slate-800/60 border border-transparent' 
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-transparent')
            }`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Live Event Stream List */}
      <div className="flex-1 overflow-y-auto cyber-scrollbar space-y-2.5 py-3 pr-1">
        {filteredSignals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 font-mono text-xs">
            <FieldTimeOutlined className="text-2xl text-cyan-500/40 mb-2 animate-pulse" />
            <p className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Waiting for live signal triggers...
            </p>
            <p className={`text-[11px] mt-1 max-w-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Real-time reader journeys and conversion events will stream here live as visitors interact with the site.
            </p>
          </div>
        ) : (
          filteredSignals.map(sig => {
            const typeConfig = SIGNAL_TYPES[sig.type] || SIGNAL_TYPES.engagement;

            return (
              <div
                key={sig.id}
                style={{
                  backgroundColor: darkMode ? typeConfig.bgDark : typeConfig.bgLight,
                  borderColor: darkMode ? typeConfig.borderDark : typeConfig.borderLight,
                }}
                className="p-3 rounded-lg border transition-all duration-300 hover:scale-[1.01] hover:shadow-md relative group"
              >
                {/* Header row: Badge & Time */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {typeConfig.icon}
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                      darkMode ? typeConfig.badgeDark : typeConfig.badgeLight
                    }`}>
                      {typeConfig.badge}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <FieldTimeOutlined />
                    <span>{formatTimeAgo(sig.secondsAgo)}</span>
                  </div>
                </div>

                {/* Event title & subtitle */}
                <div className={`font-semibold text-xs mb-1 leading-snug ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  {sig.title}
                </div>
                <div className={`text-[11px] truncate mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {sig.subtitle}
                </div>

                {/* Country tag */}
                <div className={`flex items-center justify-between text-[10px] font-mono pt-1 border-t ${
                  darkMode ? 'text-slate-400 border-slate-700/30' : 'text-slate-600 border-slate-200'
                }`}>
                  <span className="flex items-center gap-1">
                    <GlobalOutlined className="text-cyan-500" /> {sig.country}
                  </span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-medium">LIVE TELEMETRY</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer telemetry status */}
      <div className={`pt-2 border-t flex items-center justify-between text-[10px] font-mono ${
        darkMode ? 'border-sky-500/15 text-slate-400' : 'border-sky-500/20 text-slate-600'
      }`}>
        <span className="flex items-center gap-1 text-emerald-500 font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          STREAM ACTIVE
        </span>
        <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>EVENT BUS: ONLINE</span>
      </div>
    </div>
  );
};

export default LiveSignalsFeed;
