import React, { useState } from 'react';
import { Select, Button, Input, Tooltip } from 'antd';
import {
  GlobalOutlined,
  BankOutlined,
  TeamOutlined,
  IdcardOutlined,
  SolutionOutlined,
  ReloadOutlined,
  ShareAltOutlined,
  FilterOutlined,
  SearchOutlined
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
    geo_groups = [],
    countries = [],
    industries = [],
    employee_sizes = [],
    functions = [],
    job_levels = []
  } = metadata;

  // Active Geography
  const activeRegionCode = filters.region || 'GLOBAL';
  const activeGeoGroupCode = filters.geo_group || '';
  const activeRegionObj = regions.find(r => r.code === activeRegionCode);
  const activeGroupObj = geo_groups.find(g => g.code === activeGeoGroupCode);

  const availableCountries = activeGeoGroupCode
    ? countries.filter(c => activeGroupObj?.country_ids?.includes(c.id))
    : activeRegionCode === 'GLOBAL'
      ? countries
      : countries.filter(c => activeRegionObj?.country_ids?.includes(c.id));

  // Handlers for Geography
  const handleRegionSelect = (code) => {
    onFilterChange({
      region: code,
      geo_group: '',
      country: []
    });
  };

  const handleSelectAllCountries = () => {
    onFilterChange({ country: availableCountries.map(c => c.iso_code) });
  };

  const handleClearCountries = () => {
    onFilterChange({ country: [], region: 'GLOBAL', geo_group: '' });
  };

  // Handlers for Industry
  const handleIndustryChange = (values) => {
    onFilterChange({ industry: values });
  };

  const handleSelectAllIndustries = () => {
    onFilterChange({ industry: industries.map(i => i.code) });
  };

  const handleClearIndustries = () => {
    onFilterChange({ industry: [] });
  };

  // Handlers for Employee Size
  const handleSizeToggle = (code) => {
    const current = filters.employee_size || [];
    const updated = current.includes(code)
      ? current.filter(s => s !== code)
      : [...current, code];
    onFilterChange({ employee_size: updated });
  };

  const handleSizeSelectChange = (values) => {
    onFilterChange({ employee_size: values });
  };

  const handleSelectAllSizes = () => {
    onFilterChange({ employee_size: employee_sizes.map(s => s.code) });
  };

  const handleClearSizes = () => {
    onFilterChange({ employee_size: [] });
  };

  // Handlers for Job Functions & Levels
  const handleFunctionChange = (values) => {
    onFilterChange({ function: values });
  };

  const handleLevelToggle = (code) => {
    const current = filters.job_level || [];
    const updated = current.includes(code)
      ? current.filter(l => l !== code)
      : [...current, code];
    onFilterChange({ job_level: updated, seniority_preset: '' });
  };

  const handleLevelSelectChange = (values) => {
    onFilterChange({ job_level: values, seniority_preset: '' });
  };

  const handleSelectAllLevels = () => {
    onFilterChange({ job_level: job_levels.map(l => l.code), seniority_preset: '' });
  };

  const handleClearLevels = () => {
    onFilterChange({ job_level: [], seniority_preset: '', job_title: '', function: [] });
  };

  const handleSeniorityPreset = (presetName) => {
    onFilterChange({ seniority_preset: presetName });
  };

  const hasActiveFilters = Boolean(
    (filters.region && filters.region !== 'GLOBAL') ||
    filters.geo_group ||
    (filters.country && filters.country.length > 0) ||
    (filters.industry && filters.industry.length > 0) ||
    (filters.employee_size && filters.employee_size.length > 0) ||
    (filters.function && filters.function.length > 0) ||
    (filters.department && filters.department.length > 0) ||
    (filters.job_level && filters.job_level.length > 0) ||
    filters.job_title ||
    filters.seniority_preset
  );

  // Active Count Indicators per dimension
  const geoCount = (filters.country || []).length + (filters.region && filters.region !== 'GLOBAL' ? 1 : 0);
  const indCount = (filters.industry || []).length;
  const sizeCount = (filters.employee_size || []).length;
  const roleCount = (filters.job_level || []).length + (filters.function || []).length + (filters.job_title ? 1 : 0);

  const dimBoxBg = darkMode ? 'rgba(9, 18, 34, 0.65)' : 'rgba(241, 245, 249, 0.75)';
  const dimBoxBorder = darkMode ? '1px solid rgba(30, 58, 102, 0.45)' : '1px solid rgba(226, 232, 240, 0.95)';

  return (
    <div className="aud-glass-panel aud-sidebar-console" style={{ padding: '20px 22px' }}>
      {/* Console Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, pb: 14, borderBottom: '1px solid var(--aud-card-border)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(10, 174, 239, 0.15)', border: '1px solid rgba(10, 174, 239, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--aud-primary)' }}>
            <FilterOutlined style={{ fontSize: 16 }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
              ICP Target Builder
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--aud-text-muted)' }}>
              Precision Firmographics & Roles
            </p>
          </div>
        </div>

        <Button
          icon={<ReloadOutlined />}
          onClick={onReset}
          disabled={!hasActiveFilters || isLoading}
          size="small"
          style={{
            background: darkMode ? 'rgba(15, 26, 48, 0.8)' : '#FFFFFF',
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(203, 213, 225, 0.9)',
            color: hasActiveFilters ? 'var(--aud-text-title)' : 'var(--aud-text-subtle)',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: '0.75rem'
          }}
        >
          Reset
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* ── Section 1: Geography & Markets ── */}
        <div style={{ background: dimBoxBg, padding: '16px', borderRadius: 12, border: dimBoxBorder }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GlobalOutlined style={{ color: 'var(--aud-primary)' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--aud-text-title)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Geography & Markets
              </span>
              {geoCount > 0 && (
                <span style={{ background: '#0AAEEF', color: '#FFF', borderRadius: 10, padding: '1px 7px', fontSize: '0.6875rem', fontWeight: 700 }}>
                  {geoCount}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--aud-primary)', cursor: 'pointer', fontWeight: 700 }} onClick={handleSelectAllCountries}>Select All</span>
              <span style={{ color: 'var(--aud-text-muted)', cursor: 'pointer' }} onClick={handleClearCountries}>Clear</span>
            </div>
          </div>

          {/* Macro Region Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {regions.map(r => (
              <span
                key={r.code}
                className={`aud-filter-pill ${activeRegionCode === r.code && !activeGeoGroupCode ? 'active' : ''}`}
                onClick={() => handleRegionSelect(r.code)}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                {r.name}
              </span>
            ))}
          </div>

          {/* Country Search Multi-Select Dropdown */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', marginBottom: 4 }}>
              Select Countries ({availableCountries.length}):
            </div>
            <Select
              mode="multiple"
              showSearch
              placeholder="Search countries..."
              value={filters.country || []}
              onChange={(values) => onFilterChange({ country: values })}
              style={{ width: '100%' }}
              maxTagCount={2}
              allowClear
              optionFilterProp="label"
              size="middle"
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

        {/* ── Section 2: Industry Sectors ── */}
        <div style={{ background: dimBoxBg, padding: '16px', borderRadius: 12, border: dimBoxBorder }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BankOutlined style={{ color: 'var(--aud-accent)' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--aud-text-title)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Industry Sectors
              </span>
              {indCount > 0 && (
                <span style={{ background: '#F7941D', color: '#FFF', borderRadius: 10, padding: '1px 7px', fontSize: '0.6875rem', fontWeight: 700 }}>
                  {indCount}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--aud-primary)', cursor: 'pointer', fontWeight: 700 }} onClick={handleSelectAllIndustries}>Select All</span>
              <span style={{ color: 'var(--aud-text-muted)', cursor: 'pointer' }} onClick={handleClearIndustries}>Clear</span>
            </div>
          </div>

          <Select
            mode="multiple"
            showSearch
            placeholder="Search industries (e.g. Tech, Finance)..."
            value={filters.industry || []}
            onChange={handleIndustryChange}
            style={{ width: '100%' }}
            maxTagCount={2}
            allowClear
            optionFilterProp="label"
            size="middle"
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
        </div>

        {/* ── Section 3: Company Headcount (FTE) ── */}
        <div style={{ background: dimBoxBg, padding: '16px', borderRadius: 12, border: dimBoxBorder }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TeamOutlined style={{ color: '#10B981' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--aud-text-title)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Company Headcount (FTE)
              </span>
              {sizeCount > 0 && (
                <span style={{ background: '#10B981', color: '#FFF', borderRadius: 10, padding: '1px 7px', fontSize: '0.6875rem', fontWeight: 700 }}>
                  {sizeCount}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--aud-primary)', cursor: 'pointer', fontWeight: 700 }} onClick={handleSelectAllSizes}>Select All</span>
              <span style={{ color: 'var(--aud-text-muted)', cursor: 'pointer' }} onClick={handleClearSizes}>Clear</span>
            </div>
          </div>

          {/* Company Headcount Dropdown */}
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', marginBottom: 4 }}>
              Select Headcount Tiers ({employee_sizes.length} ranges):
            </div>
            <Select
              mode="multiple"
              showSearch
              placeholder="Select company FTE ranges..."
              value={filters.employee_size || []}
              onChange={handleSizeSelectChange}
              style={{ width: '100%' }}
              maxTagCount={2}
              allowClear
              optionFilterProp="label"
              size="middle"
              filterOption={(input, option) => {
                const q = input.toLowerCase().trim();
                const label = (option?.label || option?.children || '').toString().toLowerCase();
                return label.includes(q);
              }}
            >
              {employee_sizes.map(size => (
                <Option key={size.code} value={size.code} label={size.name}>
                  {size.name} Employees
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {/* ── Section 4: Seniority & Job Titles ── */}
        <div style={{ background: dimBoxBg, padding: '16px', borderRadius: 12, border: dimBoxBorder }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SolutionOutlined style={{ color: '#A855F7' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--aud-text-title)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Seniority & Job Titles
              </span>
              {roleCount > 0 && (
                <span style={{ background: '#A855F7', color: '#FFF', borderRadius: 10, padding: '1px 7px', fontSize: '0.6875rem', fontWeight: 700 }}>
                  {roleCount}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--aud-primary)', cursor: 'pointer', fontWeight: 700 }} onClick={handleSelectAllLevels}>Select All</span>
              <span style={{ color: 'var(--aud-text-muted)', cursor: 'pointer' }} onClick={handleClearLevels}>Clear</span>
            </div>
          </div>

          {/* Quick Seniority Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--aud-text-muted)' }}>Presets:</span>
            {['Director+', 'VP+', 'Executive'].map(preset => (
              <span
                key={preset}
                onClick={() => handleSeniorityPreset(preset)}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: filters.seniority_preset === preset ? '#A855F7' : 'rgba(168, 85, 247, 0.15)',
                  color: filters.seniority_preset === preset ? '#FFFFFF' : '#A855F7',
                  cursor: 'pointer'
                }}
              >
                {preset}
              </span>
            ))}
          </div>

          {/* Seniority Level Dropdown */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', marginBottom: 4 }}>
              Select Seniority Levels:
            </div>
            <Select
              mode="multiple"
              showSearch
              placeholder="Select seniority levels (e.g. CXO, VP, Director)..."
              value={filters.job_level || []}
              onChange={handleLevelSelectChange}
              style={{ width: '100%' }}
              maxTagCount={2}
              allowClear
              optionFilterProp="label"
              size="middle"
              filterOption={(input, option) => {
                const q = input.toLowerCase().trim();
                const label = (option?.label || option?.children || '').toString().toLowerCase();
                return label.includes(q);
              }}
            >
              {job_levels.map(lvl => (
                <Option key={lvl.code} value={lvl.code} label={lvl.name}>
                  {lvl.name}
                </Option>
              ))}
            </Select>
          </div>

          {/* Job Functions / Departments Dropdown */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', marginBottom: 4 }}>
              Select Departments / Job Functions:
            </div>
            <Select
              mode="multiple"
              showSearch
              placeholder="Select functions (e.g. IT, Sales, Marketing)..."
              value={filters.function || []}
              onChange={handleFunctionChange}
              style={{ width: '100%' }}
              maxTagCount={2}
              allowClear
              optionFilterProp="label"
              size="middle"
              filterOption={(input, option) => {
                const q = input.toLowerCase().trim();
                const label = (option?.label || option?.children || '').toString().toLowerCase();
                return label.includes(q);
              }}
            >
              {functions.map(fn => (
                <Option key={fn.code} value={fn.code} label={fn.name}>
                  {fn.name}
                </Option>
              ))}
            </Select>
          </div>

          {/* Job Title Keyword Search */}
          <div style={{ borderTop: dimBoxBorder, paddingTop: 10 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--aud-text-muted)', marginBottom: 4 }}>
              Title Search (e.g. CIO, CTO, Head of Sales):
            </div>
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--aud-text-muted)' }} />}
              placeholder="Search title keyword..."
              value={filters.job_title || ''}
              onChange={e => onFilterChange({ job_title: e.target.value })}
              allowClear
              size="small"
              style={{ borderRadius: 6, fontSize: '0.78rem' }}
            />
          </div>
        </div>

        {/* Share Proposal CTA */}
        <Button
          type="primary"
          icon={<ShareAltOutlined />}
          onClick={onShare}
          block
          style={{
            background: 'linear-gradient(135deg, #0AAEEF, #0284C7)',
            borderColor: '#0AAEEF',
            borderRadius: 8,
            fontWeight: 700,
            height: 40,
            fontSize: '0.85rem',
            marginTop: 4,
            boxShadow: '0 4px 14px rgba(10, 174, 239, 0.35)'
          }}
        >
          Share Prospecting Link
        </Button>
      </div>
    </div>
  );
}
