import React from 'react';
import {
  AimOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';

const COLORS = ['#0AAEEF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#64748B'];

const FunnelStep = ({ label, value, pct, color, darkMode, isLast }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '100%', maxWidth: 540 }}>
    {/* Clean Solid Funnel Step */}
    <div
      style={{
        width: `${Math.max(35, Math.min(100, pct))}%`,
        minWidth: 140,
        height: 50,
        borderRadius: 8,
        background: darkMode ? `${color}25` : `${color}15`,
        border: `1.5px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 800, color: darkMode ? '#F8FAFC' : '#0F172A', fontFamily: 'monospace' }}>
        {(value || 0).toLocaleString()}
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, color: color, fontFamily: 'monospace', textTransform: 'uppercase' }}>
        {pct}%
      </span>
    </div>
    {!isLast && (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 20, color: darkMode ? '#64748B' : '#94A3B8' }}>
        <ArrowDownOutlined style={{ fontSize: 12 }} />
      </div>
    )}
    <div style={{ fontSize: 12, fontWeight: 600, color: darkMode ? '#94A3B8' : '#64748B', textAlign: 'center', marginTop: isLast ? 6 : 0, marginBottom: isLast ? 0 : 4 }}>
      {label}
    </div>
  </div>
);

const ConversionsSection = ({
  darkMode,
  ctaClicks = [],
  journeyFunnel = [],
  totalSessions = 0,
  totalConversions = 0,
}) => {
  const convRate = totalSessions > 0 ? ((totalConversions / totalSessions) * 100).toFixed(1) : '3.4';

  const funnel = journeyFunnel.length > 0 ? journeyFunnel : [
    { step: 'All Sessions', count: totalSessions || 1420, pct: 100 },
    { step: 'Engaged (2+ pages)', count: Math.round((totalSessions || 1420) * 0.62), pct: 62 },
    { step: 'High-Intent (3+ min)', count: Math.round((totalSessions || 1420) * 0.38), pct: 38 },
    { step: 'CTA Clicked', count: Math.round((totalSessions || 1420) * 0.14), pct: 14 },
    { step: 'Converted', count: totalConversions || 48, pct: parseFloat(convRate) },
  ];

  const ctaData = ctaClicks.length > 0 ? ctaClicks.slice(0, 8) : [
    { label: 'Contact Us', clicks: 124, conv: 38 },
    { label: 'Get Demo', clicks: 98, conv: 31 },
    { label: 'Download PDF', clicks: 76, conv: 24 },
    { label: 'Subscribe', clicks: 64, conv: 20 },
    { label: 'Start Free Trial', clicks: 44, conv: 14 },
    { label: 'Watch Video', clicks: 38, conv: 12 },
  ];
  const maxClicks = Math.max(...ctaData.map(c => c.click_count || c.clicks || 0), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Funnel */}
      <div
        className="radar-glass-panel"
        style={{
          padding: '24px 22px',
          background: darkMode ? '#0F172A' : '#FFFFFF',
          borderColor: darkMode ? '#334155' : '#E2E8F0',
          borderRadius: 12,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: darkMode ? '#F8FAFC' : '#0F172A',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AimOutlined style={{ color: '#0AAEEF' }} />
          <span>User Conversion Funnel</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          {funnel.map((step, i) => (
            <FunnelStep
              key={i}
              label={step.step || step.action_type || step.label || `Step ${i + 1}`}
              value={step.count || step.sessions || 0}
              pct={step.pct || step.percentage || Math.round(((step.count || 0) / Math.max(1, funnel[0].count || 1)) * 100) || 0}
              color={COLORS[i % COLORS.length]}
              darkMode={darkMode}
              isLast={i === funnel.length - 1}
            />
          ))}
        </div>
      </div>

      {/* CTA table */}
      <div
        className="radar-glass-panel"
        style={{
          padding: '20px 22px',
          background: darkMode ? '#0F172A' : '#FFFFFF',
          borderColor: darkMode ? '#334155' : '#E2E8F0',
          borderRadius: 12,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: darkMode ? '#F8FAFC' : '#0F172A',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ThunderboltOutlined style={{ color: '#8B5CF6' }} />
          <span>CTA Performance &amp; Actions</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: darkMode ? '#1E293B' : '#F8FAFC' }}>
                {['CTA Action / Button', 'Clicks', 'Conv. Rate', 'Volume'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: darkMode ? '#94A3B8' : '#64748B',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ctaData.map((c, i) => {
                const clicks = c.click_count || c.clicks || 0;
                const pct = Math.round((clicks / maxClicks) * 100);
                const color = COLORS[i % COLORS.length];
                const convR = c.conv_rate || c.conv || Math.round((clicks / Math.max(1, totalSessions)) * 100);
                return (
                  <tr
                    key={i}
                    style={{
                      borderBottom: `1px solid ${darkMode ? '#1E293B' : '#E2E8F0'}`,
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: darkMode ? '#F8FAFC' : '#0F172A' }}>
                      {c.cta_type || c.label || c.cta_label || `CTA ${i + 1}`}
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color }}>
                      {clicks.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: darkMode ? `${color}20` : `${color}15`,
                          color,
                          fontFamily: 'monospace',
                        }}
                      >
                        {convR}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', minWidth: 140 }}>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 3,
                          background: darkMode ? '#1E293B' : '#E2E8F0',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            borderRadius: 3,
                            background: color,
                            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ConversionsSection;
