/**
 * Globe Analytics Panel
 * Displays statistics and metrics for selected geographic locations
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Globe, MapPin, Activity } from 'lucide-react';
import CountUp from 'react-countup';

const GlobeAnalyticsPanel = ({
  navigationStack = [],
  locationData = null,
  trafficStats = null,
  darkMode = true,
}) => {
  const [stats, setStats] = useState(null);
  const currentLocation = navigationStack[navigationStack.length - 1];

  useEffect(() => {
    // Generate stats based on current location
    if (!currentLocation) {
      setStats({
        activeVisitors: 12482,
        totalSessions: 10931,
        avgSessionDuration: 387,
        conversionRate: 3.2,
        trafficSources: [
          { name: 'Organic Search', value: 45 },
          { name: 'Direct', value: 25 },
          { name: 'Social Media', value: 18 },
          { name: 'Referral', value: 12 },
        ],
        topPages: [
          { path: '/services', views: 3421 },
          { path: '/pricing', views: 2156 },
          { path: '/about', views: 1843 },
        ],
      });
    } else {
      // Simulated stats based on location
      const baseMultiplier = currentLocation.level === 'WORLD' ? 1 : currentLocation.level === 'BUSINESS_REGION' ? 0.4 : currentLocation.level === 'CONTINENT' ? 0.25 : currentLocation.level === 'COUNTRY' ? 0.1 : 0.02;
      
      setStats({
        activeVisitors: Math.floor(12482 * baseMultiplier),
        totalSessions: Math.floor(10931 * baseMultiplier),
        avgSessionDuration: 387 + Math.random() * 200,
        conversionRate: (3.2 * (1 + (Math.random() - 0.5) * 0.5)).toFixed(2),
        trafficSources: [
          { name: 'Organic Search', value: Math.floor(45 * baseMultiplier) },
          { name: 'Direct', value: Math.floor(25 * baseMultiplier) },
          { name: 'Social Media', value: Math.floor(18 * baseMultiplier) },
          { name: 'Referral', value: Math.floor(12 * baseMultiplier) },
        ],
        topPages: [
          { path: '/services', views: Math.floor(3421 * baseMultiplier) },
          { path: '/pricing', views: Math.floor(2156 * baseMultiplier) },
          { path: '/about', views: Math.floor(1843 * baseMultiplier) },
        ],
      });
    }
  }, [currentLocation]);

  if (!stats) return null;

  const getLocationInfo = () => {
    if (!currentLocation) return 'Global';
    if (currentLocation.level === 'CITY') {
      return `${currentLocation.name} • ${currentLocation.country}`;
    }
    return currentLocation.name;
  };

  return (
    <div className={`p-6 space-y-6 ${
      darkMode ? 'bg-slate-950' : 'bg-white'
    }`}>
      {/* Header */}
      <div>
        <h2 className={`text-2xl font-bold mb-1 flex items-center gap-2 ${
          darkMode ? 'text-cyan-400' : 'text-cyan-700'
        }`}>
          <Globe size={24} />
          Geographic Analytics
        </h2>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Live metrics for {getLocationInfo()}
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Visitors */}
        <div className={`p-4 rounded-lg border ${
          darkMode
            ? 'bg-slate-900/50 border-slate-800 hover:border-cyan-500/50'
            : 'bg-slate-50/50 border-slate-200 hover:border-cyan-500/50'
        } transition-all`}>
          <div className="flex items-start justify-between mb-2">
            <div className={`text-sm font-mono tracking-wider ${
              darkMode ? 'text-slate-500' : 'text-slate-400'
            }`}>
              ACTIVE VISITORS
            </div>
            <Users size={16} className={darkMode ? 'text-cyan-500' : 'text-cyan-600'} />
          </div>
          <div className={`text-3xl font-bold ${
            darkMode ? 'text-cyan-400' : 'text-cyan-600'
          }`}>
            <CountUp end={stats.activeVisitors} duration={1} separator="," />
          </div>
          <div className={`text-xs mt-2 flex items-center gap-1 ${
            darkMode ? 'text-green-400' : 'text-green-600'
          }`}>
            <TrendingUp size={12} />
            +12.3% from last hour
          </div>
        </div>

        {/* Total Sessions */}
        <div className={`p-4 rounded-lg border ${
          darkMode
            ? 'bg-slate-900/50 border-slate-800 hover:border-cyan-500/50'
            : 'bg-slate-50/50 border-slate-200 hover:border-cyan-500/50'
        } transition-all`}>
          <div className="flex items-start justify-between mb-2">
            <div className={`text-sm font-mono tracking-wider ${
              darkMode ? 'text-slate-500' : 'text-slate-400'
            }`}>
              TOTAL SESSIONS
            </div>
            <Activity size={16} className={darkMode ? 'text-purple-500' : 'text-purple-600'} />
          </div>
          <div className={`text-3xl font-bold ${
            darkMode ? 'text-purple-400' : 'text-purple-600'
          }`}>
            <CountUp end={stats.totalSessions} duration={1} separator="," />
          </div>
          <div className={`text-xs mt-2 ${
            darkMode ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Last 24 hours
          </div>
        </div>

        {/* Avg Session Duration */}
        <div className={`p-4 rounded-lg border ${
          darkMode
            ? 'bg-slate-900/50 border-slate-800 hover:border-cyan-500/50'
            : 'bg-slate-50/50 border-slate-200 hover:border-cyan-500/50'
        } transition-all`}>
          <div className="flex items-start justify-between mb-2">
            <div className={`text-sm font-mono tracking-wider ${
              darkMode ? 'text-slate-500' : 'text-slate-400'
            }`}>
              AVG DURATION
            </div>
            <MapPin size={16} className={darkMode ? 'text-blue-500' : 'text-blue-600'} />
          </div>
          <div className={`text-3xl font-bold ${
            darkMode ? 'text-blue-400' : 'text-blue-600'
          }`}>
            <CountUp end={Math.floor(stats.avgSessionDuration)} duration={1} /> s
          </div>
          <div className={`text-xs mt-2 ${
            darkMode ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Minutes per session
          </div>
        </div>

        {/* Conversion Rate */}
        <div className={`p-4 rounded-lg border ${
          darkMode
            ? 'bg-slate-900/50 border-slate-800 hover:border-cyan-500/50'
            : 'bg-slate-50/50 border-slate-200 hover:border-cyan-500/50'
        } transition-all`}>
          <div className="flex items-start justify-between mb-2">
            <div className={`text-sm font-mono tracking-wider ${
              darkMode ? 'text-slate-500' : 'text-slate-400'
            }`}>
              CONVERSION
            </div>
            <TrendingUp size={16} className={darkMode ? 'text-green-500' : 'text-green-600'} />
          </div>
          <div className={`text-3xl font-bold ${
            darkMode ? 'text-green-400' : 'text-green-600'
          }`}>
            {stats.conversionRate}%
          </div>
          <div className={`text-xs mt-2 ${
            darkMode ? 'text-slate-500' : 'text-slate-400'
          }`}>
            CTA completion rate
          </div>
        </div>
      </div>

      {/* Traffic Sources */}
      <div className={`p-4 rounded-lg border ${
        darkMode
          ? 'bg-slate-900/50 border-slate-800'
          : 'bg-slate-50/50 border-slate-200'
      }`}>
        <h3 className={`text-sm font-mono font-semibold tracking-wider mb-4 ${
          darkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          TRAFFIC SOURCES
        </h3>

        <div className="space-y-3">
          {stats.trafficSources.map((source, idx) => (
            <div key={idx}>
              <div className="flex justify-between mb-1">
                <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {source.name}
                </span>
                <span className={`text-sm font-semibold ${
                  darkMode ? 'text-cyan-400' : 'text-cyan-600'
                }`}>
                  {source.value}%
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${
                darkMode ? 'bg-slate-800' : 'bg-slate-200'
              }`}>
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${source.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Pages */}
      <div className={`p-4 rounded-lg border ${
        darkMode
          ? 'bg-slate-900/50 border-slate-800'
          : 'bg-slate-50/50 border-slate-200'
      }`}>
        <h3 className={`text-sm font-mono font-semibold tracking-wider mb-4 ${
          darkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          TOP PAGES
        </h3>

        <div className="space-y-3">
          {stats.topPages.map((page, idx) => (
            <div key={idx} className={`p-3 rounded-lg ${
              darkMode
                ? 'bg-slate-800/50'
                : 'bg-white/50'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className={`font-mono text-sm font-semibold ${
                    darkMode ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {page.path}
                  </div>
                  <div className={`text-xs mt-1 ${
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    Page views
                  </div>
                </div>
                <div className={`text-lg font-bold ${
                  darkMode ? 'text-cyan-400' : 'text-cyan-600'
                }`}>
                  <CountUp end={page.views} duration={1} separator="," />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        Last updated: <span className={darkMode ? 'text-cyan-400' : 'text-cyan-600'}>just now</span>
      </div>
    </div>
  );
};

export default GlobeAnalyticsPanel;
