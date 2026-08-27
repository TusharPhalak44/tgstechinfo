import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { message, Spin, Button } from 'antd';
import {
  GlobalOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  SunOutlined,
  MoonOutlined
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
      country: parseParam('country'),
      industry: parseParam('industry'),
      employee_size: parseParam('employee_size'),
      department: parseParam('department'),
      job_level: parseParam('job_level')
    };
  });

  // Audience Calculation Result State
  const [statsData, setStatsData] = useState({
    matching_contacts: 78000000,
    matching_companies: 4200000,
    matching_countries_count: 195,
    matching_industries_count: 12,
    is_limited_audience: false,
    privacy_threshold: 25,
    country_breakdown: [],
    industry_breakdown: [],
    employee_size_breakdown: [],
    department_breakdown: [],
    job_level_breakdown: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const debounceTimerRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  // 1. Initial Load: Fetch Metadata
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
        message.error('Failed to connect to audience database');
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
      if (filters.country?.length) params.country = filters.country.join(',');
      if (filters.industry?.length) params.industry = filters.industry.join(',');
      if (filters.employee_size?.length) params.employee_size = filters.employee_size.join(',');
      if (filters.department?.length) params.department = filters.department.join(',');
      if (filters.job_level?.length) params.job_level = filters.job_level.join(',');
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
      setFilters(prev => ({ ...prev, region: 'GLOBAL' }));
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
      country: [],
      industry: [],
      employee_size: [],
      department: [],
      job_level: []
    });
    message.info('Audience reset to Global Database');
  };

  // Header Title & Brand from database configuration
  const brandName = metadata.settings?.brand_name || 'TARAJ GLOBAL';
  const moduleTitle = metadata.settings?.module_title || 'B2B Audience Intelligence';
  const lastUpdated = metadata.settings?.last_updated_display || 'August 2026';

  if (isInitialLoading) {
    return (
      <div className="audience-intel-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Spin size="large" tip="Connecting to Live B2B Audience Intelligence Engine..." />
      </div>
    );
  }

  return (
    <div className="audience-intel-root">
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 24px 60px 24px' }}>
        
        {/* ── Standalone Navigation Bar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--aud-card-border)' }}>
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
              Back to Audience Overview
            </Button>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

        {/* ── Top Header Bar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, letterSpacing: '0.15em', color: '#0AAEEF', textTransform: 'uppercase' }}>
                {brandName}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
              <span style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <SafetyOutlined style={{ color: '#10B981' }} /> Verified Enterprise ICP Engine
              </span>
            </div>

            <h1 style={{ margin: 0, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: 'var(--aud-text-title)', letterSpacing: '-0.02em' }}>
              {moduleTitle}
            </h1>
            <p style={{ margin: '6px 0 0 0', color: 'var(--aud-text-muted)', fontSize: '0.9375rem' }}>
              Live interactive demographic exploration & precision ICP audience sizing for global enterprise campaigns.
            </p>
          </div>

          {/* Status & Freshness Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div className="aud-live-pulse">
              <span className="aud-live-dot" />
              <span>Commercial Data: {lastUpdated}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-subtle)' }}>
              Zero PII Aggregated Query Layer
            </span>
          </div>
        </div>

        {/* ── Breadcrumb ICP Summary Path ── */}
        <AudienceSummaryBreadcrumb
          metadata={metadata}
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          darkMode={darkMode}
        />

        {/* ── Hero Showcase Section: Animated Counter + 3D Interactive Globe ── */}
        <div className="aud-hero-container">
          {/* Left Hero: Animated Counter */}
          <AnimatedAudienceCounter
            count={statsData.matching_contacts}
            companiesCount={statsData.matching_companies}
            isLoading={isLoading}
            isLimitedAudience={statsData.is_limited_audience}
            privacyThreshold={statsData.privacy_threshold}
            label="MATCHING BUSINESS PROFESSIONALS"
            sublabel={`Covering ${statsData.matching_countries_count} Countries across ${statsData.matching_industries_count} Key Industry Sectors`}
            darkMode={darkMode}
          />

          {/* Right Hero: 3D Interactive Globe */}
          <div className="aud-glass-panel" style={{ padding: '8px', overflow: 'hidden' }}>
            <AudienceGlobe
              countryBreakdown={statsData.country_breakdown}
              selectedRegion={filters.region}
              selectedCountries={filters.country}
              regions={metadata.regions}
              onSelectCountry={(iso) => handleToggleFilter('country', iso)}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* ── "Build Your Audience" Interactive Filter System ── */}
        <AudienceFilterPanel
          metadata={metadata}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          onShare={() => setIsShareModalOpen(true)}
          isLoading={isLoading}
          darkMode={darkMode}
        />

        {/* ── Synchronized Analytical Demographic Breakdown Charts ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <ThunderboltOutlined style={{ color: 'var(--aud-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
              Audience Distribution Breakdowns
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--aud-text-subtle)' }}>
              (Click any bar to instantly refine target audience)
            </span>
          </div>

          <AudienceChartBreakdown
            breakdowns={statsData}
            selectedFilters={filters}
            onToggleFilter={handleToggleFilter}
            darkMode={darkMode}
          />
        </div>

        {/* ── Sales Call Value Proposition Footer ── */}
        <div className="aud-glass-panel" style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
              Ready to activate this verified audience?
            </h4>
            <p style={{ margin: '4px 0 0 0', color: 'var(--aud-text-muted)', fontSize: '0.8125rem' }}>
              Taraj Global delivers direct B2B content syndication, MQL/SQL lead generation, and CXO roundtables.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setIsShareModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #0AAEEF, #0284C7)',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(10, 174, 239, 0.4)'
              }}
            >
              Generate Prospect Sizing Link
            </button>
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
