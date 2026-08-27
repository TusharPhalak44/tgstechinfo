import React from 'react';
import { Select, Button } from 'antd';
import {
  GlobalOutlined,
  BankOutlined,
  TeamOutlined,
  IdcardOutlined,
  ReloadOutlined,
  ShareAltOutlined,
  FilterOutlined
} from '@ant-design/icons';

const { Option } = Select;

export default function AudienceFilterPanel({
  metadata = {},
  filters = {},
  onFilterChange = () => {},
  onReset = () => {},
  onShare = () => {},
  isLoading = false,
  darkMode = true
}) {
  const {
    regions = [],
    countries = [],
    industries = [],
    employee_sizes = [],
    departments = [],
    job_levels = []
  } = metadata;

  // Derive available countries based on selected region
  const activeRegionCode = filters.region || 'GLOBAL';
  const activeRegionObj = regions.find(r => r.code === activeRegionCode);

  const availableCountries = activeRegionCode === 'GLOBAL'
    ? countries
    : countries.filter(c => activeRegionObj?.country_ids?.includes(c.id));

  // Handler helpers
  const handleRegionSelect = (code) => {
    onFilterChange({
      region: code,
      country: []
    });
  };

  const handleCountryToggle = (iso) => {
    const current = filters.country || [];
    const updated = current.includes(iso)
      ? current.filter(c => c !== iso)
      : [...current, iso];
    onFilterChange({ country: updated });
  };

  const handleIndustryChange = (values) => {
    onFilterChange({ industry: values });
  };

  const handleSizeToggle = (code) => {
    const current = filters.employee_size || [];
    const updated = current.includes(code)
      ? current.filter(s => s !== code)
      : [...current, code];
    onFilterChange({ employee_size: updated });
  };

  const handleDeptToggle = (code) => {
    const current = filters.department || [];
    const updated = current.includes(code)
      ? current.filter(d => d !== code)
      : [...current, code];
    onFilterChange({ department: updated });
  };

  const handleLevelToggle = (code) => {
    const current = filters.job_level || [];
    const updated = current.includes(code)
      ? current.filter(l => l !== code)
      : [...current, code];
    onFilterChange({ job_level: updated });
  };

  const hasActiveFilters = Boolean(
    (filters.region && filters.region !== 'GLOBAL') ||
    (filters.country && filters.country.length > 0) ||
    (filters.industry && filters.industry.length > 0) ||
    (filters.employee_size && filters.employee_size.length > 0) ||
    (filters.department && filters.department.length > 0) ||
    (filters.job_level && filters.job_level.length > 0)
  );

  const dimBoxBg = darkMode ? 'rgba(9, 18, 34, 0.55)' : 'rgba(241, 245, 249, 0.65)';
  const dimBoxBorder = darkMode ? '1px solid rgba(30, 58, 102, 0.35)' : '1px solid rgba(226, 232, 240, 0.9)';

  return (
    <div className="aud-glass-panel" style={{ padding: '24px 28px', marginBottom: '32px' }}>
      {/* Panel Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(10, 174, 239, 0.15)', border: '1px solid rgba(10, 174, 239, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--aud-primary)' }}>
            <FilterOutlined style={{ fontSize: 16 }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
              Build Your Audience
            </h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--aud-text-muted)' }}>
              Select target firmographic & persona dimensions for live ICP demographic sizing
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={onReset}
            disabled={!hasActiveFilters || isLoading}
            style={{
              background: darkMode ? 'rgba(15, 26, 48, 0.8)' : '#FFFFFF',
              borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(203, 213, 225, 0.9)',
              color: hasActiveFilters ? 'var(--aud-text-title)' : 'var(--aud-text-subtle)',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.8125rem'
            }}
          >
            Reset Audience
          </Button>

          <Button
            type="primary"
            icon={<ShareAltOutlined />}
            onClick={onShare}
            style={{
              background: 'linear-gradient(135deg, #0AAEEF, #0284C7)',
              borderColor: '#0AAEEF',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '0.8125rem',
              boxShadow: '0 0 16px rgba(10, 174, 239, 0.3)'
            }}
          >
            Share Client View
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* ── Dimension 1: Geography ── */}
        <div style={{ background: dimBoxBg, padding: '18px', borderRadius: 14, border: dimBoxBorder }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <GlobalOutlined style={{ color: 'var(--aud-primary)' }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--aud-text-title)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              1. Geographic Region
            </span>
          </div>

          {/* Region Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {regions.map(r => (
              <span
                key={r.code}
                className={`aud-filter-pill ${activeRegionCode === r.code ? 'active' : ''}`}
                onClick={() => handleRegionSelect(r.code)}
              >
                {r.name}
              </span>
            ))}
          </div>

          {/* Dependent Country Multi-Select */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', marginBottom: 6 }}>
              Select Specific Countries ({availableCountries.length} available):
            </div>
            <Select
              mode="multiple"
              showSearch
              placeholder="Search by country name (e.g. India, Japan) or code..."
              value={filters.country || []}
              onChange={(values) => onFilterChange({ country: values })}
              style={{ width: '100%' }}
              maxTagCount={3}
              allowClear
              optionFilterProp="label"
              filterOption={(input, option) => {
                const q = input.toLowerCase().trim();
                const label = (option?.label || option?.children || '').toString().toLowerCase();
                const val = (option?.value || '').toString().toLowerCase();
                return label.includes(q) || val.includes(q);
              }}
            >
              {availableCountries.map(c => (
                <Option key={c.iso_code} value={c.iso_code} label={`${c.name} (${c.iso_code})`}>
                  {c.name} ({c.iso_code})
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {/* ── Dimension 2: Industry Verticals ── */}
        <div style={{ background: dimBoxBg, padding: '18px', borderRadius: 14, border: dimBoxBorder }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BankOutlined style={{ color: 'var(--aud-accent)' }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--aud-text-title)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              2. Industry Verticals ({industries.length})
            </span>
          </div>

          <Select
            mode="multiple"
            showSearch
            placeholder="Search and select target industries..."
            value={filters.industry || []}
            onChange={handleIndustryChange}
            style={{ width: '100%', marginBottom: 12 }}
            maxTagCount={3}
            allowClear
            optionFilterProp="label"
            filterOption={(input, option) => {
              const q = input.toLowerCase().trim();
              const label = (option?.label || option?.children || '').toString().toLowerCase();
              const val = (option?.value || '').toString().toLowerCase();
              return label.includes(q) || val.includes(q);
            }}
          >
            {industries.map(ind => (
              <Option key={ind.code} value={ind.code} label={ind.name}>
                {ind.name}
              </Option>
            ))}
          </Select>

          {/* Popular Industry Quick Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {industries.slice(0, 5).map(ind => {
              const isSelected = (filters.industry || []).includes(ind.code);
              return (
                <span
                  key={ind.code}
                  className={`aud-filter-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    const current = filters.industry || [];
                    const updated = isSelected
                      ? current.filter(i => i !== ind.code)
                      : [...current, ind.code];
                    onFilterChange({ industry: updated });
                  }}
                >
                  {ind.name}
                </span>
              );
            })}
          </div>
        </div>

        {/* ── Dimension 3: Company Scale / Employee Size ── */}
        <div style={{ background: dimBoxBg, padding: '18px', borderRadius: 14, border: dimBoxBorder }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TeamOutlined style={{ color: '#10B981' }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--aud-text-title)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              3. Company Scale (Employee FTE)
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {employee_sizes.map(size => {
              const isSelected = (filters.employee_size || []).includes(size.code);
              return (
                <span
                  key={size.code}
                  className={`aud-filter-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSizeToggle(size.code)}
                >
                  {size.name}
                </span>
              );
            })}
          </div>
        </div>

        {/* ── Dimension 4: Job Department & Seniority ── */}
        <div style={{ background: dimBoxBg, padding: '18px', borderRadius: 14, border: dimBoxBorder }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <IdcardOutlined style={{ color: '#A855F7' }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--aud-text-title)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              4. Department & Decision Makers
            </span>
          </div>

          {/* Department Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {departments.map(dept => {
              const isSelected = (filters.department || []).includes(dept.code);
              return (
                <span
                  key={dept.code}
                  className={`aud-filter-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => handleDeptToggle(dept.code)}
                >
                  {dept.name}
                </span>
              );
            })}
          </div>

          {/* Seniority / Job Levels */}
          <div style={{ borderTop: dimBoxBorder, paddingTop: 10 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', marginBottom: 6 }}>
              Job Seniority Level:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {job_levels.map(lvl => {
                const isSelected = (filters.job_level || []).includes(lvl.code);
                return (
                  <span
                    key={lvl.code}
                    className={`aud-filter-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => handleLevelToggle(lvl.code)}
                  >
                    {lvl.name}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
