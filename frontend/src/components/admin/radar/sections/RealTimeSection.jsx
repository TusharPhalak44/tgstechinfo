import React, { useState, useEffect, useCallback } from 'react';
import AnalyticsGlobe from '../globe/AnalyticsGlobe';
import GeographicAnalyticsSummary from '../globe/GeographicAnalyticsSummary';
import LiveSignalsFeed from '../LiveSignalsFeed';
import WebsitePulseBar from '../WebsitePulseBar';
import { geographicAnalyticsService } from '../../../../services/geographicAnalyticsService';

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
}) => {
  // Geographic Selection Hierarchy State
  const [selectedRegion, setSelectedRegion] = useState(null); // 'AMER' | 'EMEA' | 'APAC' | null
  const [selectedCountry, setSelectedCountry] = useState(null); // ISO-2 country code e.g. 'IN', 'US'
  const [selectedCity, setSelectedCity] = useState(null); // City name e.g. 'Mumbai'
  
  // Dynamic metrics state for active hierarchy level
  const [hierarchyMetrics, setHierarchyMetrics] = useState({});
  const [isHierarchyLoading, setIsHierarchyLoading] = useState(false);

  // Determine current active geographic level
  const activeLevel = selectedCity ? 'city' : (selectedCountry ? 'country' : (selectedRegion ? 'region' : 'world'));

  // Global consolidated dataset for the globe
  const globalData = {
    totals: {
      totalVisitors: activeVisitors,
      totalSessions: totalSessions,
      totalPageviews: totalPageViews,
      totalConversions: totalConversions,
      bounceRate: bounceRate,
      avgDuration: 185
    },
    countries: countryAnalytics
  };

  // Fetch contextual metrics when hierarchy selection changes
  const loadHierarchyData = useCallback(async () => {
    setIsHierarchyLoading(true);
    try {
      if (selectedCity && selectedCountry) {
        const res = await geographicAnalyticsService.getCityAnalytics(selectedCity, selectedCountry);
        setHierarchyMetrics(res.metrics || res || {});
      } else if (selectedCountry) {
        const res = await geographicAnalyticsService.getCountryAnalytics(selectedCountry);
        const match = countryAnalytics.find(c => (c.country || '').toUpperCase() === selectedCountry.toUpperCase());
        setHierarchyMetrics({
          ...res,
          uniqueVisitors: match?.unique_visitors || 140,
          trafficCount: match?.traffic_count || 210,
          conversions: match?.conversion_count || 12
        });
      } else if (selectedRegion) {
        const res = await geographicAnalyticsService.getRegionalAnalytics(selectedRegion);
        setHierarchyMetrics(res.totals || res || {});
      } else {
        setHierarchyMetrics(globalData.totals);
      }
    } catch (err) {
      console.error('Error updating hierarchy metrics:', err);
    } finally {
      setIsHierarchyLoading(false);
    }
  }, [selectedRegion, selectedCountry, selectedCity, countryAnalytics, activeVisitors, totalSessions, totalPageViews, totalConversions, bounceRate]);

  useEffect(() => {
    loadHierarchyData();
  }, [loadHierarchyData]);

  // Selection Handlers
  const handleSelectRegion = (regionCode) => {
    if (selectedRegion === regionCode && !selectedCountry && !selectedCity) {
      setSelectedRegion(null);
    } else {
      setSelectedRegion(regionCode);
      setSelectedCountry(null);
      setSelectedCity(null);
    }
  };

  const handleSelectCountry = (countryCode) => {
    setSelectedCountry(countryCode);
    setSelectedCity(null);
  };

  const handleSelectCity = (cityName) => {
    setSelectedCity(cityName);
  };

  const handleClearSelection = () => {
    setSelectedRegion(null);
    setSelectedCountry(null);
    setSelectedCity(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Dynamic Summary KPI Panel */}
      <GeographicAnalyticsSummary
        level={activeLevel}
        selectedRegion={selectedRegion}
        selectedCountry={selectedCountry}
        selectedCity={selectedCity}
        data={hierarchyMetrics}
        darkMode={darkMode}
        onSelectCity={handleSelectCity}
      />

      {/* Main hero row: 3D WebGL Globe + Real-Time Live Signals Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <AnalyticsGlobe
            globalData={globalData}
            selectedRegion={selectedRegion}
            selectedCountry={selectedCountry}
            selectedCity={selectedCity}
            onSelectRegion={handleSelectRegion}
            onSelectCountry={handleSelectCountry}
            onSelectCity={handleSelectCity}
            onClearSelection={handleClearSelection}
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
      </div>

      {/* Real-time Website Pulse Bar */}
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
};

export default RealTimeSection;
