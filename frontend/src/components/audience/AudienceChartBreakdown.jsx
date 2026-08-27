import React from 'react';
import {
  GlobalOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ApartmentOutlined,
  TeamOutlined
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '32px' }}>
      
      {/* ── 1. Top Country Coverage ── */}
      <div className="aud-glass-panel" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GlobalOutlined style={{ color: 'var(--aud-primary)', fontSize: 16 }} />
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
              Country Coverage
            </h4>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)' }}>
            {country_breakdown.length} Countries
          </span>
        </div>

        <div className="aud-chart-bar-container" style={{ maxHeight: 310, overflowY: 'auto', paddingRight: 4 }}>
          {country_breakdown.slice(0, 8).map(c => {
            const isSelected = (selectedFilters.country || []).includes(c.iso_code);
            return (
              <div
                key={c.iso_code}
                className={`aud-bar-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleFilter('country', c.iso_code)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: isSelected ? 'var(--aud-primary)' : 'var(--aud-text-main)', fontWeight: 600 }}>
                    {c.country_name} ({c.iso_code})
                  </span>
                  <span style={{ color: 'var(--aud-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {(c.contact_count || 0).toLocaleString()} <span style={{ color: 'var(--aud-primary)', fontSize: '0.75rem' }}>({c.percentage}%)</span>
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
      <div className="aud-glass-panel" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChartOutlined style={{ color: 'var(--aud-accent)', fontSize: 16 }} />
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
              Industry Sectors
            </h4>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)' }}>
            {industry_breakdown.length} Verticals
          </span>
        </div>

        <div className="aud-chart-bar-container" style={{ maxHeight: 310, overflowY: 'auto', paddingRight: 4 }}>
          {industry_breakdown.slice(0, 8).map(i => {
            const isSelected = (selectedFilters.industry || []).includes(i.industry_code);
            return (
              <div
                key={i.industry_code}
                className={`aud-bar-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleFilter('industry', i.industry_code)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: isSelected ? 'var(--aud-accent)' : 'var(--aud-text-main)', fontWeight: 600 }}>
                    {i.industry_name}
                  </span>
                  <span style={{ color: 'var(--aud-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {(i.contact_count || 0).toLocaleString()} <span style={{ color: 'var(--aud-accent)', fontSize: '0.75rem' }}>({i.percentage}%)</span>
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

      {/* ── 3. Company Employee Size ── */}
      <div className="aud-glass-panel" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieChartOutlined style={{ color: '#10B981', fontSize: 16 }} />
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
              Company Scale (FTE)
            </h4>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)' }}>
            Enterprise & Mid-Market
          </span>
        </div>

        <div className="aud-chart-bar-container" style={{ maxHeight: 310, overflowY: 'auto', paddingRight: 4 }}>
          {employee_size_breakdown.map(s => {
            const isSelected = (selectedFilters.employee_size || []).includes(s.size_code);
            return (
              <div
                key={s.size_code}
                className={`aud-bar-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleFilter('employee_size', s.size_code)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: isSelected ? '#10B981' : 'var(--aud-text-main)', fontWeight: 600 }}>
                    {s.size_label}
                  </span>
                  <span style={{ color: 'var(--aud-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {(s.contact_count || 0).toLocaleString()} <span style={{ color: '#10B981', fontSize: '0.75rem' }}>({s.percentage}%)</span>
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

      {/* ── 4. Job Level / Seniority ── */}
      <div className="aud-glass-panel" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TeamOutlined style={{ color: '#A855F7', fontSize: 16 }} />
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--aud-text-title)' }}>
              Seniority & Decision Makers
            </h4>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)' }}>
            CXO & Leadership
          </span>
        </div>

        <div className="aud-chart-bar-container" style={{ maxHeight: 310, overflowY: 'auto', paddingRight: 4 }}>
          {job_level_breakdown.map(l => {
            const isSelected = (selectedFilters.job_level || []).includes(l.level_code);
            return (
              <div
                key={l.level_code}
                className={`aud-bar-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleFilter('job_level', l.level_code)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: isSelected ? '#A855F7' : 'var(--aud-text-main)', fontWeight: 600 }}>
                    {l.level_name}
                  </span>
                  <span style={{ color: 'var(--aud-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {(l.contact_count || 0).toLocaleString()} <span style={{ color: '#A855F7', fontSize: '0.75rem' }}>({l.percentage}%)</span>
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
