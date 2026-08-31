import React from 'react';
import RegionalTrafficGlobe from '../RegionalTrafficGlobe';
import GlobalActivitySection from '../GlobalActivitySection';

const GlobalTrafficSection = ({
  darkMode,
  countryData = [],
  recentSessions = [],
  totalSessions = 0,
  isLoading = false,
}) => (
  <div className="global-traffic-section" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <style>{`
      @media (max-width: 1024px) {
        .global-traffic-section {
          gap: 16px !important;
        }
      }
      @media (max-width: 768px) {
        .global-traffic-section {
          gap: 14px !important;
        }
      }
      @media (max-width: 480px) {
        .global-traffic-section {
          gap: 12px !important;
        }
      }
    `}</style>
    {/* Regional Traffic Globe — interactive 3D globe */}
    <RegionalTrafficGlobe
      countryData={countryData}
      darkMode={darkMode}
    />

    {/* Country-level breakdown table */}
    <GlobalActivitySection
      countryData={countryData}
      totalSessions={totalSessions}
      isLoading={isLoading}
      darkMode={darkMode}
    />
  </div>
);

export default GlobalTrafficSection;
