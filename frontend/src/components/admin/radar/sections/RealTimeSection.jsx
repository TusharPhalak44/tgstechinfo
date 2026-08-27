import React from 'react';
import GlobeRadarCanvas from '../GlobeRadarCanvas';
import LiveSignalsFeed from '../LiveSignalsFeed';
import WebsitePulseBar from '../WebsitePulseBar';

const RealTimeSection = ({
  darkMode,
  activeVisitors = 0,
  recentSessions = [],
  countryAnalytics = [],
  popularPages = [],
  ctaClicks = [],
  overviewData = {},
  lastUpdatedText = 'Just now',
  isLoading = false,
  totalSessions = 0,
  totalPageViews = 0,
  totalConversions = 0,
  searchesCount = 0,
  bounceRate = 28,
  refreshInterval = 10,
}) => (
  <div className="realtime-section-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    {/* Main hero row: globe + signals */}
    <div className="realtime-hero-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
      <GlobeRadarCanvas
        activeVisitorsCount={activeVisitors}
        recentSessions={recentSessions}
        countryAnalytics={countryAnalytics}
        lastUpdatedText={lastUpdatedText}
        isLoading={isLoading}
        darkMode={darkMode}
      />
      <LiveSignalsFeed
        recentSessions={recentSessions}
        ctaClicks={ctaClicks}
        popularPages={popularPages}
        chatbotActivity={[]}
        isLive={refreshInterval > 0}
        darkMode={darkMode}
      />
    </div>

    {/* Pulse bar */}
    <WebsitePulseBar
      activeVisitors={activeVisitors}
      totalSessions={totalSessions}
      totalPageViews={totalPageViews}
      conversionsCount={totalConversions}
      searchesCount={searchesCount}
      bounceRate={bounceRate}
      isLoading={isLoading}
      darkMode={darkMode}
    />
  </div>
);

export default RealTimeSection;
