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
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
