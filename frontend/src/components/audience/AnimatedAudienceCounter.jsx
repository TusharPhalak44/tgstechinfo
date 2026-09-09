import React, { useEffect, useState } from 'react';
import CountUp from 'react-countup';
import { UserOutlined, BankOutlined, GlobalOutlined, FilterOutlined } from '@ant-design/icons';

export default function AnimatedAudienceCounter({
  count = 0,
  companiesCount = 0,
  countriesCount = 195,
  activeFiltersCount = 0,
  isLoading = false,
  isLimitedAudience = false,
  privacyThreshold = 25,
  darkMode = true
}) {
  const [prevCount, setPrevCount] = useState(0);
  const [prevCompanies, setPrevCompanies] = useState(0);

  useEffect(() => {
    if (count !== null && count !== undefined) {
      setPrevCount(count);
    }
  }, [count]);

  useEffect(() => {
    if (companiesCount !== null && companiesCount !== undefined) {
      setPrevCompanies(companiesCount);
    }
  }, [companiesCount]);

  const isZero = count === 0 && !isLoading;
  const isNilCount = count === null || count === undefined;
  const isNilCompanies = companiesCount === null || companiesCount === undefined;
  const isNilCountries = countriesCount === null || countriesCount === undefined;

  return (
    <div className="aud-kpi-grid">
      {/* KPI 1: Total Business Professionals */}
      <div className="aud-glass-panel aud-kpi-card">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: '#0AAEEF', textTransform: 'uppercase' }}>
              Matching Professionals
            </span>
            <UserOutlined style={{ color: '#0AAEEF', fontSize: 16 }} />
          </div>

          {isLimitedAudience ? (
            <div className="aud-kpi-value" style={{ color: '#F7941D' }}>
              &lt; {privacyThreshold}
            </div>
          ) : isZero ? (
            <div className="aud-kpi-value" style={{ color: '#EF4444', fontSize: '1.5rem' }}>
              0 Matches
            </div>
          ) : isNilCount ? (
            <div className="aud-kpi-value is-updating" style={{ color: 'var(--aud-text-title)', opacity: 0.5 }}>
              Calculated...
            </div>
          ) : (
            <div className={`aud-kpi-value ${isLoading ? 'is-updating' : ''}`} style={{ color: 'var(--aud-text-title)' }}>
              <CountUp
                start={prevCount}
                end={count || 0}
                duration={1.2}
                separator=","
                useEasing={true}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--aud-card-border)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)' }}>
            {isLoading ? 'Recalculating...' : 'Verified Active Contacts'}
          </span>
          <div className="aud-live-pulse" style={{ padding: '2px 8px', fontSize: '0.6875rem' }}>
            <span className="aud-live-dot" /> Live
          </div>
        </div>
      </div>

      {/* KPI 2: Target Companies / Accounts */}
      <div className="aud-glass-panel aud-kpi-card">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: '#F7941D', textTransform: 'uppercase' }}>
              Target Accounts
            </span>
            <BankOutlined style={{ color: '#F7941D', fontSize: 16 }} />
          </div>

          {isNilCompanies ? (
            <div className="aud-kpi-value is-updating" style={{ color: 'var(--aud-text-title)', opacity: 0.5 }}>
              Calculated...
            </div>
          ) : (
            <div className={`aud-kpi-value ${isLoading ? 'is-updating' : ''}`} style={{ color: 'var(--aud-text-title)' }}>
              <CountUp
                start={prevCompanies}
                end={companiesCount || 0}
                duration={1.2}
                separator=","
                useEasing={true}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--aud-card-border)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)' }}>
            Corporate Entities
          </span>
          <span style={{ fontSize: '0.75rem', color: '#F7941D', fontWeight: 700 }}>
            Firmographics
          </span>
        </div>
      </div>

      {/* KPI 3: Global Geo Reach */}
      <div className="aud-glass-panel aud-kpi-card">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: '#10B981', textTransform: 'uppercase' }}>
              Global Coverage
            </span>
            <GlobalOutlined style={{ color: '#10B981', fontSize: 16 }} />
          </div>

          {isNilCountries ? (
            <div className="aud-kpi-value is-updating" style={{ color: 'var(--aud-text-title)', opacity: 0.5 }}>
              Calculated...
            </div>
          ) : (
            <div className={`aud-kpi-value ${isLoading ? 'is-updating' : ''}`} style={{ color: 'var(--aud-text-title)' }}>
              {countriesCount || 0} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--aud-text-muted)' }}>Countries</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--aud-card-border)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)' }}>
            Geographic Footprint
          </span>
          <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
            Worldwide
          </span>
        </div>
      </div>

      {/* KPI 4: Active ICP Criteria */}
      <div className="aud-glass-panel aud-kpi-card">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: '#A855F7', textTransform: 'uppercase' }}>
              ICP Criteria Applied
            </span>
            <FilterOutlined style={{ color: '#A855F7', fontSize: 16 }} />
          </div>

          <div className="aud-kpi-value" style={{ color: 'var(--aud-text-title)' }}>
            {activeFiltersCount} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--aud-text-muted)' }}>Filters</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--aud-card-border)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)' }}>
            {activeFiltersCount === 0 ? 'Full Market Universe' : 'Target Segment Active'}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#A855F7', fontWeight: 700 }}>
            Segmented
          </span>
        </div>
      </div>
    </div>
  );
}
