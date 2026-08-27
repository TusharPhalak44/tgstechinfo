import React, { useEffect, useState, useRef } from 'react';
import CountUp from 'react-countup';

export default function AnimatedAudienceCounter({
  count = 0,
  companiesCount = 0,
  isLoading = false,
  isLimitedAudience = false,
  privacyThreshold = 25,
  label = 'MATCHING BUSINESS PROFESSIONALS',
  sublabel = 'Across 195+ Countries & Multi-Tier Firmographics'
}) {
  const [prevCount, setPrevCount] = useState(count);
  const isZero = count === 0 && !isLoading;

  useEffect(() => {
    setPrevCount(count);
  }, [count]);

  return (
    <div className="aud-glass-panel aud-odometer-box">
      {/* Top Tag & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', color: '#0AAEEF', textTransform: 'uppercase' }}>
            Live ICP Calculation
          </span>
          {isLoading && (
            <span style={{ fontSize: '0.75rem', color: '#F7941D', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="aud-live-dot" style={{ background: '#F7941D', boxShadow: '0 0 8px #F7941D' }} />
              Recalculating...
            </span>
          )}
        </div>
        <div className="aud-live-pulse">
          <span className="aud-live-dot" />
          <span>Real-Time DB</span>
        </div>
      </div>

      {/* Main Counter Display */}
      {isLimitedAudience ? (
        <div style={{ margin: '16px 0' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#F7941D', fontFamily: 'JetBrains Mono, monospace' }}>
            &lt; {privacyThreshold} Contacts
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
            Limited audience threshold applied for precision targeting.
          </p>
        </div>
      ) : isZero ? (
        <div style={{ margin: '16px 0' }}>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#EF4444', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            No Matching Audience Found
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
            Try broadening your industry, seniority, or company size filters.
          </p>
        </div>
      ) : (
        <div className={`aud-counter-number ${isLoading ? 'is-updating' : ''}`}>
          <CountUp
            start={prevCount}
            end={count}
            duration={1.2}
            separator=","
            useEasing={true}
          />
        </div>
      )}

      {/* Label and Secondary Metric */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, borderTop: '1px solid var(--aud-card-border)', paddingTop: 14 }}>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--aud-text-title)', letterSpacing: '0.05em' }}>
            {label}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', marginTop: 2 }}>
            {sublabel}
          </div>
        </div>

        {companiesCount > 0 && !isLimitedAudience && !isZero && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Target Accounts
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--aud-accent)', fontFamily: 'JetBrains Mono, monospace' }}>
              <CountUp
                start={Math.round(prevCount / 3.4)}
                end={companiesCount}
                duration={1.2}
                separator=","
              />
              <span style={{ fontSize: '0.8125rem', color: 'var(--aud-text-muted)', marginLeft: 4 }}>Companies</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
