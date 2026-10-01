import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { message, Spin, Button, Tabs, Tooltip } from 'antd';
import {
  GlobalOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  ArrowLeftOutlined,
  SunOutlined,
  MoonOutlined,
  BarChartOutlined,
  BankOutlined,
  TeamOutlined,
  CompassOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { audienceService } from '../services/audienceService';
import { useTheme } from '../context/ThemeContext';
import AudienceGlobe from '../components/audience/AudienceGlobe';
import AnimatedAudienceCounter from '../components/audience/AnimatedAudienceCounter';
import AudienceFilterPanel from '../components/audience/AudienceFilterPanel';
import AudienceChartBreakdown from '../components/audience/AudienceChartBreakdown';
import AudienceSummaryBreadcrumb from '../components/audience/AudienceSummaryBreadcrumb';
import AudienceShareModal from '../components/audience/AudienceShareModal';
import '../components/audience/AudienceStyles.css';

export default function AudienceIntelligence() {
  const { darkMode, toggleTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active View Tab: 'globe' | 'charts' | 'insights'
  const [activeTab, setActiveTab] = useState('globe');

  // Metadata & Taxonomy state
  const [metadata, setMetadata] = useState({
    regions: [],
    countries: [],
    industries: [],
    employee_sizes: [],
    departments: [],
    job_levels: [],
    settings: {}
  });

  // Active Filter State (initialized from URL if present)
  const [filters, setFilters] = useState(() => {
    const parseParam = (key) => {
      const val = searchParams.get(key);
      if (!val) return [];
      return val.split(',').map(s => s.trim()).filter(Boolean);
    };

    return {
      region: searchParams.get('region') || 'GLOBAL',
      geo_group: searchParams.get('geo_group') || '',
      country: parseParam('country'),
      industry: parseParam('industry'),
      employee_size: parseParam('employee_size'),
      function: parseParam('function'),
      department: parseParam('department'),
      job_level: parseParam('job_level'),
      job_title: searchParams.get('job_title') || '',
      seniority_preset: searchParams.get('seniority_preset') || '',
      exact_industry: searchParams.get('exact_industry') === 'true'
    };
  });

  // Audience Calculation Result State (Initialized with instant baseline defaults or session cache)
  const [statsData, setStatsData] = useState(() => {
    try {
      const cached = sessionStorage.getItem('tgs_audience_stats');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.matching_contacts) return parsed;
      }
    } catch {}
    return {
      matching_contacts: 80198440,
      matching_companies: 2450000,
      matching_countries_count: 195,
      matching_industries_count: 85,
      is_limited_audience: false,
      privacy_threshold: 25,
      country_breakdown: [],
      industry_breakdown: [],
      employee_size_breakdown: [],
      department_breakdown: [],
      job_level_breakdown: []
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const debounceTimerRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  // 1. Initial Load: Fetch Metadata in parallel
  useEffect(() => {
    let isMounted = true;
    async function loadMeta() {
      try {
        const meta = await audienceService.getMetadata();
        if (isMounted) {
          setMetadata(meta);
        }
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    }
    loadMeta();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch Calculated Statistics on Filter Change
  const fetchAudienceStats = useCallback(async (activeFilters) => {
    setIsLoading(true);
    try {
      const res = await audienceService.getAudienceStats(activeFilters);
      if (res?.data) {
        setStatsData(res.data);
        try {
          sessionStorage.setItem('tgs_audience_stats', JSON.stringify(res.data));
        } catch {}
      }
    } catch (err) {
      console.error('Error calculating audience:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      fetchAudienceStats(filters);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchAudienceStats(filters);
      // Sync URL search params
      const params = {};
      if (filters.region && filters.region !== 'GLOBAL') params.region = filters.region;
      if (filters.geo_group) params.geo_group = filters.geo_group;
      if (filters.country?.length) params.country = filters.country.join(',');
      if (filters.industry?.length) params.industry = filters.industry.join(',');
      if (filters.employee_size?.length) params.employee_size = filters.employee_size.join(',');
      if (filters.function?.length) params.function = filters.function.join(',');
      if (filters.department?.length) params.department = filters.department.join(',');
      if (filters.job_level?.length) params.job_level = filters.job_level.join(',');
      if (filters.job_title) params.job_title = filters.job_title;
      if (filters.seniority_preset) params.seniority_preset = filters.seniority_preset;
      setSearchParams(params, { replace: true });
    }, 180);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [filters, fetchAudienceStats, setSearchParams]);

  // Filter Update Helpers
  const handleFilterChange = (updates) => {
    setFilters(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleToggleFilter = (dimension, code) => {
    setFilters(prev => {
      const current = prev[dimension] || [];
      const updated = current.includes(code)
        ? current.filter(item => item !== code)
        : [...current, code];
      return { ...prev, [dimension]: updated };
    });
  };

  const handleRemoveFilter = (dimension, value) => {
    if (dimension === 'region') {
      setFilters(prev => ({ ...prev, region: 'GLOBAL', geo_group: '' }));
    } else if (dimension === 'seniority_preset') {
      setFilters(prev => ({ ...prev, seniority_preset: '' }));
    } else if (dimension === 'job_title') {
      setFilters(prev => ({ ...prev, job_title: '' }));
    } else {
      setFilters(prev => ({
        ...prev,
        [dimension]: (prev[dimension] || []).filter(item => item !== value)
      }));
    }
  };

  const handleReset = () => {
    setFilters({
      region: 'GLOBAL',
      geo_group: '',
      country: [],
      industry: [],
      employee_size: [],
      function: [],
      department: [],
      job_level: [],
      job_title: '',
      seniority_preset: '',
      exact_industry: false
    });
    message.info('Audience reset to Global Database');
  };

  // Header Title & Brand from database configuration
  const brandName = metadata.settings?.brand_name || 'TGS TECH INFO';
  const moduleTitle = metadata.settings?.module_title || 'B2B Audience Intelligence';
  const lastUpdated = metadata.settings?.last_updated_display || 'August 2026';

  const activeFiltersCount = (
    (filters.region && filters.region !== 'GLOBAL' ? 1 : 0) +
    (filters.country || []).length +
    (filters.industry || []).length +
    (filters.employee_size || []).length +
    (filters.function || []).length +
    (filters.job_level || []).length +
    (filters.job_title ? 1 : 0) +
    (filters.seniority_preset ? 1 : 0)
  );

  if (isInitialLoading) {
    return (
      <div className="audience-intel-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Spin size="large" description="Connecting to Live B2B Audience Intelligence Engine..." />
      </div>
    );
  }

  return (
    <div className="audience-intel-root">
      <div className="aud-main-container" style={{ maxWidth: '1520px', margin: '0 auto' }}>
        
        {/* ── Top Header Navigation Bar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--aud-card-border)', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/audience" style={{ textDecoration: 'none' }}>
              <Button
                icon={<ArrowLeftOutlined />}
                style={{
                  background: darkMode ? 'rgba(15, 26, 48, 0.8)' : '#FFFFFF',
                  borderColor: 'var(--aud-card-border)',
                  color: 'var(--aud-text-title)',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                Back to Overview
              </Button>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, letterSpacing: '0.12em', color: '#0AAEEF', textTransform: 'uppercase' }}>
                {brandName}
              </span>
              <span style={{ color: 'var(--aud-text-subtle)' }}>•</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--aud-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <SafetyOutlined style={{ color: '#10B981' }} /> Verified Enterprise ICP Engine
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className="aud-live-pulse" style={{ display: 'none', md: 'inline-flex' }}>
              <span className="aud-live-dot" />
              <span>Data Updated: {lastUpdated}</span>
            </div>

            <Button
              icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              style={{
                background: darkMode ? 'rgba(15, 26, 48, 0.8)' : '#FFFFFF',
                borderColor: 'var(--aud-card-border)',
                color: 'var(--aud-text-title)',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.8125rem'
              }}
            >
              {darkMode ? 'Light View' : 'Dark View'}
            </Button>
          </div>
        </div>

        {/* ── Page Title & Hero Subtitle ── */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.75rem, 3.2vw, 2.35rem)', fontWeight: 800, color: 'var(--aud-text-title)', letterSpacing: '-0.02em' }}>
            {moduleTitle}
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--aud-text-muted)', fontSize: '0.9375rem' }}>
            Interactive demographic discovery & precision ICP audience sizing for global enterprise campaigns.
          </p>
        </div>

        {/* ── Executive KPI Grid Cards (4 Metrics) ── */}
        <AnimatedAudienceCounter
          count={statsData.matching_contacts}
          companiesCount={statsData.matching_companies}
          countriesCount={statsData.matching_countries_count}
          activeFiltersCount={activeFiltersCount}
          isLoading={isLoading}
          isLimitedAudience={statsData.is_limited_audience}
          privacyThreshold={statsData.privacy_threshold}
          darkMode={darkMode}
        />

        {/* ── Active ICP Summary Tag Bar ── */}
        <AudienceSummaryBreadcrumb
          metadata={metadata}
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onReset={handleReset}
          darkMode={darkMode}
        />

        {/* ── 2-Column Main Interactive Workspace ── */}
        <div className="aud-workspace-grid">
          
          {/* Left Column: Sticky ICP Control Console */}
          <AudienceFilterPanel
            metadata={metadata}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            onShare={() => setIsShareModalOpen(true)}
            isLoading={isLoading}
            darkMode={darkMode}
          />

          {/* Right Column: Visualization Studio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* View Mode Switcher Header */}
            <div className="aud-glass-panel" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CompassOutlined style={{ color: 'var(--aud-primary)', fontSize: 18 }} />
                <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
                  Audience Intelligence Studio
                </span>
              </div>

              <div className="aud-tab-switcher">
                <button
                  className={`aud-tab-btn ${activeTab === 'globe' ? 'active' : ''}`}
                  onClick={() => setActiveTab('globe')}
                >
                  <GlobalOutlined /> 3D Globe Studio
                </button>

                <button
                  className={`aud-tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('charts')}
                >
                  <BarChartOutlined /> Demographic Breakdowns
                </button>

                <button
                  className={`aud-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
                  onClick={() => setActiveTab('insights')}
                >
                  <BankOutlined /> ICP Account Insights
                </button>
              </div>
            </div>

            {/* TAB 1: 3D Interactive Globe */}
            {activeTab === 'globe' && (
              <div className="aud-glass-panel" style={{ padding: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px 12px 12px', borderBottom: '1px solid var(--aud-card-border)', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
                      Spatial Market Distribution
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', marginLeft: 8 }}>
                      (Click any glowing country dot to filter by location)
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircleOutlined /> Live Geo Projection
                  </span>
                </div>

                <AudienceGlobe
                  countryBreakdown={statsData.country_breakdown}
                  selectedRegion={filters.region}
                  selectedCountries={filters.country}
                  regions={metadata.regions}
                  onSelectCountry={(iso) => handleToggleFilter('country', iso)}
                  darkMode={darkMode}
                />
              </div>
            )}

            {/* TAB 2: Synchronized Analytical Demographic Breakdown Charts */}
            {activeTab === 'charts' && (
              <div>
                <AudienceChartBreakdown
                  breakdowns={statsData}
                  selectedFilters={filters}
                  onToggleFilter={handleToggleFilter}
                  darkMode={darkMode}
                />
              </div>
            )}

            {/* TAB 3: ICP Segment & Target Account Insights */}
            {activeTab === 'insights' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Account Sizing Summary Card */}
                <div className="aud-glass-panel" style={{ padding: '24px 28px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--aud-text-title)', marginBottom: 12 }}>
                    Target Market Penetration & Opportunity Breakdown
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <div style={{ background: darkMode ? 'rgba(15, 30, 56, 0.6)' : 'rgba(241, 245, 249, 0.8)', padding: '16px', borderRadius: 12, border: '1px solid var(--aud-card-border)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Available Account Density</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0AAEEF', margin: '4px 0 2px 0', fontFamily: 'JetBrains Mono, monospace' }}>
                        {(statsData.matching_companies || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-subtle)' }}>Verified Corporate HQ & Subs</div>
                    </div>

                    <div style={{ background: darkMode ? 'rgba(15, 30, 56, 0.6)' : 'rgba(241, 245, 249, 0.8)', padding: '16px', borderRadius: 12, border: '1px solid var(--aud-card-border)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Buying Group Size</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F7941D', margin: '4px 0 2px 0', fontFamily: 'JetBrains Mono, monospace' }}>
                        {statsData.matching_companies > 0 ? (statsData.matching_contacts / statsData.matching_companies).toFixed(1) : 0}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-subtle)' }}>Decision Makers per Account</div>
                    </div>

                    <div style={{ background: darkMode ? 'rgba(15, 30, 56, 0.6)' : 'rgba(241, 245, 249, 0.8)', padding: '16px', borderRadius: 12, border: '1px solid var(--aud-card-border)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Market Reach Score</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981', margin: '4px 0 2px 0', fontFamily: 'JetBrains Mono, monospace' }}>
                        98.4%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-subtle)' }}>Direct Syndication Coverage</div>
                    </div>
                  </div>
                </div>

                {/* Sample Buyer Personas Card */}
                <div className="aud-glass-panel" style={{ padding: '24px 28px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--aud-text-title)', marginBottom: 14 }}>
                    Sample Verified Buyer Personas in Target Segment
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                    {[
                      { title: 'Chief Technology Officer (CTO)', function: 'Engineering / IT', seniority: 'C-Level / Executive', country: 'North America / EMEA' },
                      { title: 'VP of Enterprise Sales & Revenue', function: 'Sales & Business Dev', seniority: 'VP Tier', country: 'Global APAC / US' },
                      { title: 'Head of Global Data & Analytics', function: 'Information Technology', seniority: 'Director Tier', country: 'Global Enterprise' },
                      { title: 'Director of Content & Demand Gen', function: 'Marketing', seniority: 'Director Tier', country: 'Europe / UK' }
                    ].map((persona, i) => (
                      <div key={i} style={{ background: darkMode ? 'rgba(15, 30, 56, 0.5)' : 'rgba(248, 250, 252, 0.9)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--aud-card-border)' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--aud-text-title)' }}>{persona.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--aud-primary)', marginTop: 4, fontWeight: 600 }}>{persona.function} • {persona.seniority}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--aud-text-muted)', marginTop: 2 }}>Region: {persona.country}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Enterprise CTA Banner */}
            <div className="aud-glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
                  Ready to activate this verified B2B audience?
                </h4>
                <p style={{ margin: '3px 0 0 0', color: 'var(--aud-text-muted)', fontSize: '0.8125rem' }}>
                  TGS Tech Info delivers direct B2B content syndication, MQL/SQL lead generation, and executive outreach.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Button
                  type="primary"
                  icon={<ShareAltOutlined />}
                  onClick={() => setIsShareModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #0AAEEF, #0284C7)',
                    borderColor: '#0AAEEF',
                    borderRadius: 8,
                    fontWeight: 700,
                    height: 38,
                    fontSize: '0.8125rem',
                    boxShadow: '0 4px 14px rgba(10, 174, 239, 0.35)'
                  }}
                >
                  Generate Prospect Sizing Link
                </Button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Share Modal */}
      <AudienceShareModal
        visible={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        filters={filters}
        totalContacts={statsData.matching_contacts}
        totalCompanies={statsData.matching_companies}
      />
    </div>
  );
}
