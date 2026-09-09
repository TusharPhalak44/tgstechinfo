import React from 'react';
import {
  GlobalOutlined,
  BarChartOutlined,
  PieChartOutlined,
  TeamOutlined,
  RightOutlined
} from '@ant-design/icons';

export default function AudienceChartBreakdown({
  breakdowns = {},
  selectedFilters = {},
  onToggleFilter = () => {},
  darkMode = true
}) {
  const {
    country_breakdown = [],
    industry_breakdown = [],
    employee_size_breakdown = [],
    department_breakdown = [],
    job_level_breakdown = []
  } = breakdowns;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      
      {/* ── 1. Top Country Coverage ── */}
      <div className="aud-glass-panel" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(10, 174, 239, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GlobalOutlined style={{ color: 'var(--aud-primary)', fontSize: 14 }} />
            </div>
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
              Geographic Concentration
            </h4>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', fontWeight: 600 }}>
            {country_breakdown.length} Markets
          </span>
        </div>

        <div className="aud-chart-bar-container" style={{ maxHeight: 290, overflowY: 'auto', paddingRight: 4 }}>
          {country_breakdown.slice(0, 8).map((c, idx) => {
            const isSelected = (selectedFilters.country || []).includes(c.iso_code);
            return (
              <div
                key={c.iso_code}
                className={`aud-bar-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleFilter('country', c.iso_code)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                  <span style={{ color: isSelected ? 'var(--aud-primary)' : 'var(--aud-text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--aud-text-subtle)', fontWeight: 700, width: 14 }}>#{idx + 1}</span>
                    {c.country_name} ({c.iso_code})
                  </span>
                  <span style={{ color: 'var(--aud-text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                    {(c.contact_count || 0).toLocaleString()} <span style={{ color: 'var(--aud-primary)', fontSize: '0.75rem', fontWeight: 700 }}>({c.percentage}%)</span>
                  </span>
                </div>
                <div className="aud-bar-track">
                  <div className="aud-bar-fill" style={{ width: `${Math.min(100, Math.max(4, c.percentage * 1.5))}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. Top Industry Verticals ── */}
      <div className="aud-glass-panel" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(247, 148, 29, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChartOutlined style={{ color: 'var(--aud-accent)', fontSize: 14 }} />
            </div>
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
              Industry Verticals
            </h4>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', fontWeight: 600 }}>
            {industry_breakdown.length} Sectors
          </span>
        </div>

        <div className="aud-chart-bar-container" style={{ maxHeight: 290, overflowY: 'auto', paddingRight: 4 }}>
          {industry_breakdown.slice(0, 8).map((i, idx) => {
            const isSelected = (selectedFilters.industry || []).includes(i.industry_code);
            return (
              <div
                key={i.industry_code}
                className={`aud-bar-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleFilter('industry', i.industry_code)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                  <span style={{ color: isSelected ? 'var(--aud-accent)' : 'var(--aud-text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--aud-text-subtle)', fontWeight: 700, width: 14 }}>#{idx + 1}</span>
                    {i.industry_name}
                  </span>
                  <span style={{ color: 'var(--aud-text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                    {(i.contact_count || 0).toLocaleString()} <span style={{ color: 'var(--aud-accent)', fontSize: '0.75rem', fontWeight: 700 }}>({i.percentage}%)</span>
                  </span>
                </div>
                <div className="aud-bar-track">
                  <div className="aud-bar-fill accent" style={{ width: `${Math.min(100, Math.max(4, i.percentage * 1.5))}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Company Employee Scale ── */}
      <div className="aud-glass-panel" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PieChartOutlined style={{ color: '#10B981', fontSize: 14 }} />
            </div>
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
              Headcount Scale (FTE)
            </h4>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', fontWeight: 600 }}>
            Enterprise Tiers
          </span>
        </div>

        <div className="aud-chart-bar-container" style={{ maxHeight: 290, overflowY: 'auto', paddingRight: 4 }}>
          {employee_size_breakdown.map((s, idx) => {
            const code = s.size_code || s.code;
            const name = s.size_name || s.name || s.size_label || code;
            const isSelected = (selectedFilters.employee_size || []).includes(code);
            return (
              <div
                key={code}
                className={`aud-bar-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleFilter('employee_size', code)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                  <span style={{ color: isSelected ? '#10B981' : 'var(--aud-text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--aud-text-subtle)', fontWeight: 700, width: 14 }}>#{idx + 1}</span>
                    {name} Employees
                  </span>
                  <span style={{ color: 'var(--aud-text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                    {(s.contact_count || 0).toLocaleString()} <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 700 }}>({s.percentage}%)</span>
                  </span>
                </div>
                <div className="aud-bar-track">
                  <div className="aud-bar-fill" style={{ width: `${Math.min(100, Math.max(4, s.percentage * 1.5))}%`, background: 'linear-gradient(90deg, #10B981, #34D399)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. Seniority & Decision Makers ── */}
      <div className="aud-glass-panel" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TeamOutlined style={{ color: '#A855F7', fontSize: 14 }} />
            </div>
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
              Seniority Distribution
            </h4>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)', fontWeight: 600 }}>
            Decision Makers
          </span>
        </div>

        <div className="aud-chart-bar-container" style={{ maxHeight: 290, overflowY: 'auto', paddingRight: 4 }}>
          {job_level_breakdown.map((l, idx) => {
            const code = l.job_level_code || l.level_code || l.code;
            const name = l.job_level_name || l.level_name || l.name || code;
            const isSelected = (selectedFilters.job_level || []).includes(code);
            return (
              <div
                key={code}
                className={`aud-bar-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleFilter('job_level', code)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                  <span style={{ color: isSelected ? '#A855F7' : 'var(--aud-text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--aud-text-subtle)', fontWeight: 700, width: 14 }}>#{idx + 1}</span>
                    {name}
                  </span>
                  <span style={{ color: 'var(--aud-text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                    {(l.contact_count || 0).toLocaleString()} <span style={{ color: '#A855F7', fontSize: '0.75rem', fontWeight: 700 }}>({l.percentage}%)</span>
                  </span>
                </div>
                <div className="aud-bar-track">
                  <div className="aud-bar-fill" style={{ width: `${Math.min(100, Math.max(4, l.percentage * 1.5))}%`, background: 'linear-gradient(90deg, #A855F7, #C084FC)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
