import React from 'react';
import { Tag, Button } from 'antd';
import { CloseOutlined, FilterOutlined } from '@ant-design/icons';

export default function AudienceSummaryBreadcrumb({
  metadata = {},
  filters = {},
  onRemoveFilter = () => {},
  onReset = () => {},
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

  const getRegionName = (code) => regions.find(r => r.code === code)?.name || code;
  const getCountryName = (iso) => countries.find(c => c.iso_code === iso)?.name || iso;
  const getIndustryName = (code) => industries.find(i => i.code === code)?.name || code;
  const getSizeName = (code) => employee_sizes.find(s => s.code === code)?.name || code;
  const getDeptName = (code) => departments.find(d => d.code === code)?.name || code;
  const getLevelName = (code) => job_levels.find(l => l.code === code)?.name || code;

  const crumbs = [];

  // Region
  if (filters.region && filters.region !== 'GLOBAL') {
    crumbs.push({ type: 'region', label: getRegionName(filters.region), value: filters.region, color: '#0AAEEF' });
  }

  // Countries
  (filters.country || []).forEach(iso => {
    crumbs.push({ type: 'country', label: getCountryName(iso), value: iso, color: '#0AAEEF' });
  });

  // Industries
  (filters.industry || []).forEach(code => {
    crumbs.push({ type: 'industry', label: getIndustryName(code), value: code, color: '#F7941D' });
  });

  // Employee Sizes
  (filters.employee_size || []).forEach(code => {
    crumbs.push({ type: 'employee_size', label: `${getSizeName(code)} FTE`, value: code, color: '#10B981' });
  });

  // Departments
  (filters.department || []).forEach(code => {
    crumbs.push({ type: 'department', label: `Dept: ${getDeptName(code)}`, value: code, color: '#3B82F6' });
  });

  // Job Levels
  (filters.job_level || []).forEach(code => {
    crumbs.push({ type: 'job_level', label: `Level: ${getLevelName(code)}`, value: code, color: '#A855F7' });
  });

  // Seniority Preset
  if (filters.seniority_preset) {
    crumbs.push({ type: 'seniority_preset', label: `Tier: ${filters.seniority_preset}`, value: filters.seniority_preset, color: '#EC4899' });
  }

  // Job Title search
  if (filters.job_title) {
    crumbs.push({ type: 'job_title', label: `Title: "${filters.job_title}"`, value: filters.job_title, color: '#8B5CF6' });
  }

  return (
    <div className="aud-breadcrumb-bar" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ color: 'var(--aud-text-muted)', fontWeight: 700, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
          <FilterOutlined style={{ color: 'var(--aud-primary)' }} /> ICP Target Filters:
        </span>

        <Tag
          style={{
            background: 'rgba(10, 174, 239, 0.12)',
            borderColor: '#0AAEEF',
            color: 'var(--aud-primary)',
            borderRadius: 12,
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '2px 8px'
          }}
        >
          Global Base
        </Tag>

        {crumbs.map((crumb, idx) => (
          <React.Fragment key={`${crumb.type}-${crumb.value}-${idx}`}>
            <span className="aud-breadcrumb-sep">/</span>
            <Tag
              closable
              onClose={(e) => {
                e.preventDefault();
                onRemoveFilter(crumb.type, crumb.value);
              }}
              style={{
                background: darkMode ? 'rgba(15, 30, 56, 0.85)' : '#FFFFFF',
                borderColor: crumb.color,
                color: darkMode ? '#FFFFFF' : '#0B1F4D',
                borderRadius: 14,
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '2px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                boxShadow: darkMode ? 'none' : '0 1px 4px rgba(11,31,77,0.08)'
              }}
            >
              {crumb.label}
            </Tag>
          </React.Fragment>
        ))}

        {crumbs.length === 0 && (
          <span style={{ color: 'var(--aud-text-subtle)', fontStyle: 'italic', fontSize: '0.75rem' }}>
            (Full Global Database — No filters active)
          </span>
        )}
      </div>

      {crumbs.length > 0 && (
        <Button
          type="link"
          size="small"
          onClick={onReset}
          style={{ color: '#EF4444', fontWeight: 600, fontSize: '0.75rem', padding: 0 }}
        >
          Clear All
        </Button>
      )}
    </div>
  );
}
