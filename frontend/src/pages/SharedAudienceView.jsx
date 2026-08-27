import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Spin, Alert, Button } from 'antd';
import { GlobalOutlined, SafetyOutlined, ArrowLeftOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { audienceService } from '../services/audienceService';
import AudienceGlobe from '../components/audience/AudienceGlobe';
import AnimatedAudienceCounter from '../components/audience/AnimatedAudienceCounter';
import AudienceChartBreakdown from '../components/audience/AudienceChartBreakdown';
import AudienceSummaryBreadcrumb from '../components/audience/AudienceSummaryBreadcrumb';
import '../components/audience/AudienceStyles.css';

export default function SharedAudienceView() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [statsData, setStatsData] = useState(null);

  useEffect(() => {
    async function loadShared() {
      try {
        setLoading(true);
        const [meta, shared] = await Promise.all([
          audienceService.getMetadata(),
          audienceService.getSharedAudience(token)
        ]);

        setMetadata(meta);
        setShareData(shared);

        // Fetch live stats for saved filters
        const stats = await audienceService.getAudienceStats(shared.filters || {});
        setStatsData(stats.data);
      } catch (err) {
        setError(err.message || 'Unable to load shared audience proposal.');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadShared();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="audience-intel-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Spin size="large" tip="Loading Verified Audience Intelligence..." />
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="audience-intel-root" style={{ padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: 540, width: '100%' }}>
          <Alert
            type="error"
            message="Invalid or Expired Proposal Link"
            description={error || 'This audience presentation token has expired or is invalid.'}
            showIcon
          />
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/audience-intelligence">
              <Button type="primary" icon={<ArrowLeftOutlined />}>
                Explore Live Audience Intelligence
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { title, client_name, filters = {} } = shareData;

  return (
    <div className="audience-intel-root">
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '36px 24px 60px 24px' }}>
        
        {/* ── Client View Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, letterSpacing: '0.15em', color: '#0AAEEF', textTransform: 'uppercase' }}>
                TARAJ GLOBAL
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
              <span style={{ fontSize: '0.8125rem', color: '#F7941D', fontWeight: 700 }}>
                Tailored for: {client_name || 'Valued Client'}
              </span>
            </div>

            <h1 style={{ margin: 0, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#FFFFFF' }}>
              {title || 'Target B2B Audience Intelligence Proposal'}
            </h1>
            <p style={{ margin: '6px 0 0 0', color: '#94A3B8', fontSize: '0.9375rem' }}>
              Verified business-decision maker demographic coverage & firmographic analysis.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div className="aud-live-pulse">
              <span className="aud-live-dot" />
              <span>Verified Audience View</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Read-Only Presentation Mode
            </span>
          </div>
        </div>

        {/* ── Breadcrumb Summary Path ── */}
        <AudienceSummaryBreadcrumb
          metadata={metadata || {}}
          filters={filters}
          onRemoveFilter={() => {}}
        />

        {/* ── Hero Showcase Section: Counter + Globe ── */}
        <div className="aud-hero-container">
          <AnimatedAudienceCounter
            count={statsData?.matching_contacts || 0}
            companiesCount={statsData?.matching_companies || 0}
            isLimitedAudience={statsData?.is_limited_audience}
            privacyThreshold={statsData?.privacy_threshold}
            label="VERIFIED TARGET CONTACTS"
            sublabel="Ready for Multichannel B2B Campaign Activation"
          />

          <div className="aud-glass-panel" style={{ padding: '8px', overflow: 'hidden' }}>
            <AudienceGlobe
              countryBreakdown={statsData?.country_breakdown || []}
              selectedRegion={filters.region}
              selectedCountries={filters.country}
              regions={metadata?.regions || []}
            />
          </div>
        </div>

        {/* ── Demographic Visualizations ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <ThunderboltOutlined style={{ color: '#0AAEEF' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#FFFFFF' }}>
              Audience Composition & Demographic Breakdown
            </h3>
          </div>

          {statsData && (
            <AudienceChartBreakdown
              breakdowns={statsData}
              selectedFilters={filters}
              onToggleFilter={() => {}}
            />
          )}
        </div>

        {/* ── Call To Action ── */}
        <div className="aud-glass-panel" style={{ padding: '28px 36px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
            Ready to Launch Your High-Impact B2B Campaign?
          </h3>
          <p style={{ margin: '0 auto 20px auto', maxWidth: 640, color: '#94A3B8', fontSize: '0.875rem' }}>
            Speak directly with your Taraj Global Account Director to initiate content syndication, email nurture streams, or qualified B2B lead generation with this verified audience.
          </p>
          <Link to="/contact">
            <button
              style={{
                background: 'linear-gradient(135deg, #0AAEEF, #0284C7)',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9375rem',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(10, 174, 239, 0.4)'
              }}
            >
              Contact Taraj Global Sales Desk
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
