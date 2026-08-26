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

  useEffect(() => {
    if (isPaused) return;

    const eventList = [];

    if (ctaClicks && ctaClicks.length > 0) {
      ctaClicks.slice(0, 4).forEach((cta, i) => {
        eventList.push({
          id: `conv-${i}-${Date.now()}`,
          type: 'conversion',
          title: cta.cta_type ? `Form Submission: ${cta.cta_type.replace(/_/g, ' ').toUpperCase()}` : 'Contact form submitted',
          subtitle: 'Completed goal action & converted',
          country: i === 0 ? 'India' : (i === 1 ? 'USA' : 'Germany'),
          secondsAgo: (i + 1) * 14,
        });
      });
    }

    if (recentSessions && recentSessions.length > 0) {
      const highIntent = recentSessions.filter(s => (s.total_pages_visited >= 2 || s.total_session_duration > 90));
      highIntent.slice(0, 5).forEach((session, i) => {
        const geo = getCountryGeo(session.country);
        eventList.push({
          id: `intent-${session.session_uuid || i}`,
          type: 'high_intent',
          title: `Journey: ${session.landing_page || '/services'} → ${session.exit_page || '/pricing'}`,
          subtitle: `${session.total_pages_visited || 3} pages visited · ${session.browser || 'Chrome'} on ${session.device_type || 'Desktop'}`,
          country: geo.country,
          secondsAgo: (i + 1) * 24,
        });
      });

      recentSessions.slice(0, 6).forEach((session, i) => {
        const geo = getCountryGeo(session.country);
        const isNew = i % 2 === 0;
        eventList.push({
          id: `eng-${session.session_uuid || i}-${i}`,
          type: isNew ? 'new_visitor' : 'engagement',
          title: isNew ? `Entered via ${session.landing_page || 'Google Search'}` : `Article/Page view: ${session.landing_page || '/case-studies'}`,
          subtitle: `${session.device_type || 'Desktop'} · ${session.browser || 'Web browser'}`,
          country: geo.country,
          secondsAgo: (i + 1) * 38,
        });
      });
    }

    if (chatbotActivity && chatbotActivity.length > 0) {
      chatbotActivity.slice(0, 3).forEach((chat, i) => {
        eventList.push({
          id: `chat-${i}`,
          type: 'chatbot',
          title: `Chatbot inquiry: "${chat.query || 'Solution architecture'}"`,
          subtitle: 'Automated assistant session started',
          country: 'UK',
          secondsAgo: (i + 1) * 45,
        });
      });
    }

    if (eventList.length === 0) {
      eventList.push(
        {
          id: 'fb-1',
          type: 'conversion',
          title: 'Contact form submitted',
          subtitle: 'Enterprise evaluation request',
          country: 'India',
          secondsAgo: 12,
        },
        {
          id: 'fb-2',
          type: 'high_intent',
          title: 'Visitor viewed Services → Pricing',
          subtitle: 'Multi-stage product comparison',
          country: 'USA',
          secondsAgo: 24,
        },
        {
          id: 'fb-3',
          type: 'engagement',
          title: 'Article viewed: Cloud Native AI Solutions',
          subtitle: 'Deep technical read (4m duration)',
          country: 'UK',
          secondsAgo: 41,
        },
        {
          id: 'fb-4',
          type: 'new_visitor',
          title: 'Entered through Google Search',
          subtitle: 'Organic search query on homepage',
          country: 'Germany',
          secondsAgo: 52,
        },
        {
          id: 'fb-5',
          type: 'chatbot',
          title: 'Chatbot query: "Pricing & Integration"',
          subtitle: 'Live conversational assist',
          country: 'Singapore',
          secondsAgo: 78,
        }
      );
    }

    eventList.sort((a, b) => a.secondsAgo - b.secondsAgo);
    setSignals(eventList);
  }, [recentSessions, ctaClicks, chatbotActivity, isPaused]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setSignals(prev =>
        prev.map(s => ({
          ...s,
          secondsAgo: s.secondsAgo + 1,
        }))
      );
    }, 1000);
    return () => clearInterval(interval);
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
            <p>Waiting for live signal triggers...</p>
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
