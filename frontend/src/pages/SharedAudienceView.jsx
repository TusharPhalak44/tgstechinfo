import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Spin, Alert, Button, Tag } from 'antd';
import {
  GlobalOutlined,
  SafetyOutlined,
  ArrowLeftOutlined,
  ThunderboltOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  BankOutlined,
  TeamOutlined,
  SolutionOutlined,
  PhoneOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  SunOutlined,
  MoonOutlined,
  CompassOutlined
} from '@ant-design/icons';
import { audienceService } from '../services/audienceService';
import { useTheme } from '../context/ThemeContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useAuth } from '../context/AuthContext';
import AudienceGlobe from '../components/audience/AudienceGlobe';
import AnimatedAudienceCounter from '../components/audience/AnimatedAudienceCounter';
import AudienceChartBreakdown from '../components/audience/AudienceChartBreakdown';
import AudienceSummaryBreadcrumb from '../components/audience/AudienceSummaryBreadcrumb';
import '../components/audience/AudienceStyles.css';

export default function SharedAudienceView() {
  const { token } = useParams();
  const { darkMode, toggleTheme } = useTheme();
  const { mainLogo, navbarLogo, settings: cmsSettings } = useSiteSettings() || {};
  const { user } = useAuth() || {};

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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="audience-intel-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Spin size="large" tip="Loading Verified Client Audience Presentation Deck..." />
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
            description={error || 'This client audience presentation token has expired or is invalid.'}
            showIcon
          />
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/audience-intelligence">
              <Button type="primary" icon={<ArrowLeftOutlined />}>
                Explore Audience Intelligence
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { title, client_name, filters = {}, created_at, created_by_name } = shareData;
  const rawAuthor = created_by_name ||
    filters.created_by_name ||
    (user ? ([user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.username || user.name || user.role) : null) ||
    'admin';
  const formattedAuthor = rawAuthor.toLowerCase().startsWith('by ') ? rawAuthor : `by ${rawAuthor}`;

  const brandName = metadata?.settings?.brand_name || cmsSettings?.siteTitle || 'TGS TECH INFO';
  const issueDate = created_at ? new Date(created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'September 2026';
  const proposalId = `TGS-PRO-${(token || 'DECK').substring(0, 6).toUpperCase()}`;

  // CMS Logo URL fallback chain
  const cmsLogoUrl = mainLogo || navbarLogo || cmsSettings?.website_main_logo || cmsSettings?.website_navbar_logo || cmsSettings?.website_logo;

  // Custom proposal description passed from share modal
  const proposalDescription = filters.proposal_description || shareData?.description || '';

  // Helper taxonomy lookups
  const getRegionName = (code) => metadata?.regions?.find(r => r.code === code)?.name || code;
  const getCountryName = (iso) => metadata?.countries?.find(c => c.iso_code === iso)?.name || iso;
  const getIndustryName = (code) => metadata?.industries?.find(i => i.code === code)?.name || code;
  const getSizeName = (code) => metadata?.employee_sizes?.find(s => s.code === code)?.name || code;
  const getLevelName = (code) => metadata?.job_levels?.find(l => l.code === code)?.name || code;

  const targetCountries = (filters.country || []).map(getCountryName);
  const targetIndustries = (filters.industry || []).map(getIndustryName);
  const targetSizes = (filters.employee_size || []).map(getSizeName);
  const targetLevels = (filters.job_level || []).map(getLevelName);

  return (
    <div className="audience-intel-root">
      <div style={{ maxWidth: '1520px', margin: '0 auto', padding: '28px 24px 60px 24px' }}>
        
        {/* ── Top Navigation & Brand Header Bar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--aud-card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* CMS Main Website Logo */}
            {cmsLogoUrl ? (
              <img
                src={cmsLogoUrl}
                alt={brandName}
                style={{ height: 80, maxWidth: 260, objectFit: 'contain', display: 'block' }}
              />
            ) : (
              <span style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.12em', color: '#0AAEEF', textTransform: 'uppercase' }}>
                {brandName}
              </span>
            )}

            <Tag color="cyan" style={{ borderRadius: 10, fontWeight: 700, fontSize: '0.72rem', padding: '2px 10px' }}>
              CLIENT PROPOSAL DECK
            </Tag>

            <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)' }}>
              Ref: <strong style={{ color: 'var(--aud-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{proposalId}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              style={{
                background: darkMode ? 'rgba(15, 26, 48, 0.8)' : '#FFFFFF',
                borderColor: 'var(--aud-card-border)',
                color: 'var(--aud-text-title)',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.8125rem'
              }}
            >
              Export Proposal PDF
            </Button>

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

        {/* ── Client Proposal Cover Banner with CMS Logo ── */}
        <div className="aud-glass-panel" style={{ padding: '32px 38px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: '0.8125rem', color: '#F7941D', fontWeight: 800 }}>
                  Prepared Exclusively for: {client_name || 'Valued Client Partner'}
                </span>
              </div>

              <h1 style={{ margin: 0, fontSize: 'clamp(1.85rem, 3.5vw, 2.6rem)', fontWeight: 800, color: 'var(--aud-text-title)', letterSpacing: '-0.02em' }}>
                {title || 'Target B2B Audience Sizing & Market Intelligence Proposal'}
              </h1>
              
              <p style={{ margin: '8px 0 0 0', color: 'var(--aud-text-muted)', fontSize: '0.95rem', maxWidth: 880, lineHeight: 1.5 }}>
                Verified business-decision maker demographic coverage, firmographic scale analysis, and multichannel campaign reach for targeted B2B content syndication and sales pipeline growth.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <div className="aud-live-pulse">
                <span className="aud-live-dot" />
                <span>Verified Client Proposal</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-subtle)' }}>
                Date Issued: {issueDate} • Generated {formattedAuthor}
              </span>
            </div>
          </div>
        </div>

        {/* ── Custom Proposal Executive Summary Note (from Share Modal) ── */}
        {proposalDescription && (
          <div className="aud-glass-panel" style={{ padding: '22px 28px', marginBottom: 28, borderLeft: '4px solid #0AAEEF', background: darkMode ? 'rgba(10, 174, 239, 0.08)' : 'rgba(10, 174, 239, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <FileTextOutlined style={{ color: '#0AAEEF', fontSize: 16 }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0AAEEF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Executive Proposal Summary & Notes
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--aud-text-title)', fontSize: '0.9375rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {proposalDescription}
            </p>
          </div>
        )}

        {/* ── Executive Summary KPI Metrics Header ── */}
        <AnimatedAudienceCounter
          count={statsData?.matching_contacts || 0}
          companiesCount={statsData?.matching_companies || 0}
          countriesCount={statsData?.matching_countries_count || 195}
          activeFiltersCount={Object.keys(filters || {}).filter(k => k !== 'proposal_description').length}
          isLimitedAudience={statsData?.is_limited_audience}
          privacyThreshold={statsData?.privacy_threshold}
          darkMode={darkMode}
        />

        {/* ── 2-COLUMN SIDE-BY-SIDE SECTION: Targeted ICP Scope (Left 2x2) + 3D Globe (Right) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 24, marginBottom: 28, alignItems: 'stretch' }}>
          
          {/* Column 1 (Left): Targeted Ideal Customer Profile (ICP) Scope Parameters */}
          <div className="aud-glass-panel" style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--aud-card-border)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(10, 174, 239, 0.15)', border: '1px solid rgba(10, 174, 239, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--aud-primary)' }}>
                <ThunderboltOutlined style={{ fontSize: 18 }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
                  Targeted Ideal Customer Profile (ICP) Scope
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)' }}>
                  Firmographic & Demographic Campaign Boundaries
                </div>
              </div>
            </div>

            {/* 2 by 2 Strict Grid for ICP Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, flex: 1 }}>
              
              {/* Geo Scope Card */}
              <div style={{ background: darkMode ? 'rgba(15, 30, 56, 0.65)' : 'rgba(241, 245, 249, 0.85)', padding: '16px 18px', borderRadius: 12, border: '1px solid var(--aud-card-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--aud-primary)', fontWeight: 800, fontSize: '0.8125rem', marginBottom: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(10, 174, 239, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GlobalOutlined style={{ fontSize: 14 }} />
                    </div>
                    Target Geographies
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
                    {filters.region && filters.region !== 'GLOBAL' ? getRegionName(filters.region) : 'Global Market'}
                  </div>
                </div>

                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {targetCountries.length > 0 ? (
                    targetCountries.map((c, i) => (
                      <Tag key={i} color="blue" style={{ borderRadius: 10, fontSize: '0.72rem', fontWeight: 600 }}>{c}</Tag>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-subtle)' }}>All 195+ Countries Included</span>
                  )}
                </div>
              </div>

              {/* Industry Verticals Card */}
              <div style={{ background: darkMode ? 'rgba(15, 30, 56, 0.65)' : 'rgba(241, 245, 249, 0.85)', padding: '16px 18px', borderRadius: 12, border: '1px solid var(--aud-card-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F7941D', fontWeight: 800, fontSize: '0.8125rem', marginBottom: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(247, 148, 29, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BankOutlined style={{ fontSize: 14 }} />
                    </div>
                    Target Industry Sectors
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
                    {targetIndustries.length > 0 ? `${targetIndustries.length} Selected Sectors` : 'All Industry Verticals'}
                  </div>
                </div>

                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {targetIndustries.length > 0 ? (
                    targetIndustries.map((ind, i) => (
                      <Tag key={i} color="orange" style={{ borderRadius: 10, fontSize: '0.72rem', fontWeight: 600 }}>{ind}</Tag>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-subtle)' }}>Full Commercial Sector Universe</span>
                  )}
                </div>
              </div>

              {/* Company Headcount Scale Card */}
              <div style={{ background: darkMode ? 'rgba(15, 30, 56, 0.65)' : 'rgba(241, 245, 249, 0.85)', padding: '16px 18px', borderRadius: 12, border: '1px solid var(--aud-card-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10B981', fontWeight: 800, fontSize: '0.8125rem', marginBottom: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TeamOutlined style={{ fontSize: 14 }} />
                    </div>
                    Company Headcount (FTE)
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
                    {targetSizes.length > 0 ? `${targetSizes.length} Headcount Tiers` : 'All Corporate Scale Tiers'}
                  </div>
                </div>

                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {targetSizes.length > 0 ? (
                    targetSizes.map((sz, i) => (
                      <Tag key={i} color="green" style={{ borderRadius: 10, fontSize: '0.72rem', fontWeight: 600 }}>{sz}</Tag>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-subtle)' }}>SMB to Enterprise (1 - 10k+ FTE)</span>
                  )}
                </div>
              </div>

              {/* Seniority & Roles Card */}
              <div style={{ background: darkMode ? 'rgba(15, 30, 56, 0.65)' : 'rgba(241, 245, 249, 0.85)', padding: '16px 18px', borderRadius: 12, border: '1px solid var(--aud-card-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#A855F7', fontWeight: 800, fontSize: '0.8125rem', marginBottom: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <SolutionOutlined style={{ fontSize: 14 }} />
                    </div>
                    Seniority & Job Titles
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
                    {filters.seniority_preset ? `Tier: ${filters.seniority_preset}` : targetLevels.length > 0 ? `${targetLevels.length} Seniority Tiers` : 'All Management Levels'}
                  </div>
                </div>

                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {targetLevels.map((lvl, i) => (
                    <Tag key={i} color="purple" style={{ borderRadius: 10, fontSize: '0.72rem', fontWeight: 600 }}>{lvl}</Tag>
                  ))}
                  {filters.job_title && (
                    <Tag color="magenta" style={{ borderRadius: 10, fontSize: '0.72rem', fontWeight: 600 }}>Keyword: "{filters.job_title}"</Tag>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Column 2 (Right): Interactive 3D Spatial Globe */}
          <div className="aud-glass-panel" style={{ padding: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '4px 8px 14px 8px', borderBottom: '1px solid var(--aud-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
                  Interactive 3D Spatial Market Distribution
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', marginTop: 2 }}>
                  Global node density map for saved target segment
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircleOutlined /> Live 3D Geo Projection
              </span>
            </div>

            <div style={{ flex: 1, minHeight: 460 }}>
              <AudienceGlobe
                countryBreakdown={statsData?.country_breakdown || []}
                selectedRegion={filters.region}
                selectedCountries={filters.country}
                regions={metadata?.regions || []}
                darkMode={darkMode}
              />
            </div>
          </div>

        </div>

        {/* ── Demographic & Sector Distribution Breakdowns ── */}
        <div className="aud-glass-panel" style={{ padding: '24px 28px', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <CompassOutlined style={{ color: 'var(--aud-primary)', fontSize: 18 }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
              Audience Demographic & Firmographic Distribution
            </h3>
          </div>

          {statsData && (
            <AudienceChartBreakdown
              breakdowns={statsData}
              selectedFilters={filters}
              onToggleFilter={() => {}}
              darkMode={darkMode}
            />
          )}
        </div>

        {/* ── Sample Verified Buyer Personas in Target Segment ── */}
        <div className="aud-glass-panel" style={{ padding: '24px 28px', marginBottom: 28 }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
            Sample Target Buyer Personas & Decision-Makers
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { role: 'Chief Information Officer (CIO) / CTO', dept: 'IT & Digital Transformation', level: 'C-Suite Executive', scope: 'North America / EMEA Enterprise' },
              { role: 'VP of Enterprise Sales & Revenue Operations', dept: 'Sales & Business Dev', level: 'VP Tier', scope: 'Global Enterprise Scale' },
              { role: 'Global Head of Data & Infrastructure', dept: 'Engineering & Operations', level: 'Director Tier', scope: 'APAC & US Markets' },
              { role: 'Director of Demand Generation & ABM', dept: 'Marketing & Growth', level: 'Director Tier', scope: 'Mid-Market & Enterprise' }
            ].map((p, idx) => (
              <div key={idx} style={{ background: darkMode ? 'rgba(15, 30, 56, 0.5)' : 'rgba(248, 250, 252, 0.9)', padding: '16px', borderRadius: 12, border: '1px solid var(--aud-card-border)' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>{p.role}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--aud-primary)', marginTop: 4, fontWeight: 700 }}>{p.dept} • {p.level}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--aud-text-muted)', marginTop: 4 }}>Coverage: {p.scope}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Commercial Deliverables Deck & Data Compliance Guarantees ── */}
        <div className="aud-glass-panel" style={{ padding: '28px 32px', marginBottom: 32 }}>
          <h3 style={{ margin: '0 0 18px 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
            Commercial Campaign Activation Options & Data Guarantees
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ background: darkMode ? 'rgba(15, 30, 56, 0.6)' : 'rgba(241, 245, 249, 0.8)', padding: '20px', borderRadius: 12, border: '1px solid var(--aud-card-border)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0AAEEF', display: 'flex', alignItems: 'center', gap: 8 }}>
                <RocketOutlined /> B2B Content Syndication
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--aud-text-muted)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
                Directly syndicate whitepapers, eBooks, and research reports to target decision-makers with guaranteed MQL lead delivery.
              </p>
            </div>

            <div style={{ background: darkMode ? 'rgba(15, 30, 56, 0.6)' : 'rgba(241, 245, 249, 0.8)', padding: '20px', borderRadius: 12, border: '1px solid var(--aud-card-border)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F7941D', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileTextOutlined /> Account-Based Marketing (ABM)
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--aud-text-muted)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
                Target account-level decision buyers across corporate email, direct messaging, and programmatic displays.
              </p>
            </div>

            <div style={{ background: darkMode ? 'rgba(15, 30, 56, 0.6)' : 'rgba(241, 245, 249, 0.8)', padding: '20px', borderRadius: 12, border: '1px solid var(--aud-card-border)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafetyCertificateOutlined /> 100% Data Compliance
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--aud-text-muted)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
                Fully compliant with GDPR, CCPA, and CAN-SPAM regulations. Zero PII exposure aggregated query layer.
              </p>
            </div>
          </div>
        </div>

        {/* ── Client Strategy Action Bar ── */}
        <div className="aud-glass-panel" style={{ padding: '28px 36px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(10, 174, 239, 0.12), rgba(2, 132, 199, 0.18))', border: '1px solid rgba(10, 174, 239, 0.4)' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.35rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
            Initiate Campaign Strategy & Reserve Target Capacity
          </h3>
          <p style={{ margin: '0 auto 22px auto', maxWidth: 680, color: 'var(--aud-text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Schedule an executive campaign strategy call with your dedicated Account Director to review lead volume quotas, content assets, and deployment timelines.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/contact">
              <Button
                type="primary"
                icon={<PhoneOutlined />}
                size="large"
                style={{
                  background: 'linear-gradient(135deg, #0AAEEF, #0284C7)',
                  borderColor: '#0AAEEF',
                  borderRadius: 10,
                  fontWeight: 700,
                  height: 44,
                  padding: '0 28px',
                  boxShadow: '0 4px 18px rgba(10, 174, 239, 0.4)'
                }}
              >
                Schedule Strategy Session
              </Button>
            </Link>

            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              size="large"
              style={{
                background: darkMode ? 'rgba(15, 26, 48, 0.8)' : '#FFFFFF',
                borderColor: 'var(--aud-card-border)',
                color: 'var(--aud-text-title)',
                borderRadius: 10,
                fontWeight: 700,
                height: 44,
                padding: '0 24px'
              }}
            >
              Export Proposal PDF
            </Button>
          </div>
        </div>

        {/* ── Proposal Deck Author & Attribution Footer Panel at End of Page ── */}
        <div className="aud-glass-panel" style={{
          padding: '18px 28px',
          marginTop: 24,
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          border: '1px solid var(--aud-card-border)',
          borderRadius: 12,
          background: darkMode ? 'rgba(15, 26, 48, 0.6)' : 'rgba(255, 255, 255, 0.8)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SafetyCertificateOutlined style={{ color: '#0AAEEF', fontSize: 18 }} />
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
                Verified B2B Client Proposal & Deck Scope
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', marginTop: 2 }}>
                Proposal Deck Reference ID: <strong style={{ color: '#0AAEEF', fontFamily: 'JetBrains Mono, monospace' }}>{proposalId}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--aud-text-muted)' }}>Proposal Created:</span>
            <Tag color="cyan" style={{ borderRadius: 8, fontWeight: 800, padding: '4px 12px', fontSize: '0.8125rem', margin: 0 }}>
              {formattedAuthor}
            </Tag>
          </div>
        </div>

      </div>
    </div>
  );
}
