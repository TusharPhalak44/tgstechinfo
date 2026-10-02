import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AimOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';

const COLORS = ['#0AAEEF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#64748B'];

const FunnelStep = ({ label, value, pct, color, darkMode, isLast }) => (
  <div className="funnel-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '100%', maxWidth: 540 }}>
    {/* Clean Solid Funnel Step */}
    <div
      className="funnel-box"
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
      <span className="funnel-value" style={{ fontSize: 16, fontWeight: 800, color: darkMode ? '#F8FAFC' : '#0F172A', fontFamily: 'monospace' }}>
        {(value || 0).toLocaleString()}
      </span>
      <span className="funnel-pct" style={{ fontSize: 10, fontWeight: 700, color: color, fontFamily: 'monospace', textTransform: 'uppercase' }}>
        {pct}%
      </span>
    </div>
    {!isLast && (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 20, color: darkMode ? '#64748B' : '#94A3B8' }}>
        <ArrowDownOutlined style={{ fontSize: 12 }} />
      </div>
    )}
    <div className="funnel-label" style={{ fontSize: 12, fontWeight: 600, color: darkMode ? '#94A3B8' : '#64748B', textAlign: 'center', marginTop: isLast ? 6 : 0, marginBottom: isLast ? 0 : 4 }}>
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
  timeRange = '7d',
}) => {
  const [conversionData, setConversionData] = useState({
    totalSessions: 0,
    totalConversions: 0,
    funnel: [],
    ctaData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Calculate date range based on timeRange
    let dateParams = '';

    if (timeRange !== 'all') {
      const endDate = new Date();
      const startDate = new Date();
      if (timeRange === '7d') startDate.setDate(startDate.getDate() - 7);
      if (timeRange === '30d') startDate.setDate(startDate.getDate() - 30);
      if (timeRange === '90d') startDate.setDate(startDate.getDate() - 90);

      const s = startDate.toISOString().split('T')[0];
      const e = endDate.toISOString().split('T')[0];
      dateParams = `?start_date=${s}&end_date=${e}`;
    }
    // For 'all' time range, don't send date parameters - let backend use default (90 days)

    // Fetch real conversion data using existing APIs
    console.log('ConversionsSection - Fetching data with timeRange:', timeRange, 'dateParams:', dateParams);

    Promise.allSettled([
      axios.get(`/api/analytics/cta${dateParams}`),
      axios.get(`/api/analytics/journey${dateParams}`),
    ]).then(([ctaRes, journeyRes]) => {
      console.log('ConversionsSection - CTA API response:', ctaRes.status, ctaRes.value?.data);
      console.log('ConversionsSection - Journey API response:', journeyRes.status, journeyRes.value?.data);

      const data = {
        totalSessions: 0,
        totalConversions: 0,
        funnel: [],
        ctaData: [],
      };

      // Get CTA data
      if (ctaRes.status === 'fulfilled' && ctaRes.value?.data) {
        data.ctaData = ctaRes.value.data.ctaClicks || ctaRes.value.data || [];
        data.totalConversions = ctaRes.value.data.totalConversions || 0;

        if (data.ctaData.length === 0) {
          // No dummy data, just use empty array
        }

        console.log('ConversionsSection - CTA data parsed:', data.ctaData.length, 'items');
        console.log('ConversionsSection - CTA data structure:', JSON.stringify(data.ctaData, null, 2));
      } else {
        console.log('ConversionsSection - CTA API failed or returned no data:', ctaRes.status, ctaRes.reason?.message);
        if (ctaRes.status === 'rejected') {
          console.error('CTA API Error:', ctaRes.reason);
        }
      }

      // Get journey/funnel data
      if (journeyRes.status === 'fulfilled' && journeyRes.value?.data) {
        const rawFunnel = journeyRes.value.data.funnel || journeyRes.value.data.journey || [];
        data.totalSessions = journeyRes.value.data.totalSessions || 0;

        // Transform backend funnel data to frontend format
        data.funnel = rawFunnel.map(item => ({
          step: item.action_type || item.step || 'Unknown',
          label: item.action_type || item.step || 'Unknown',
          count: item.count || 0,
          sessions: item.unique_sessions || item.sessions || item.count || 0,
          pct: parseFloat(item.percentage) || parseFloat(item.pct) || 0,
          percentage: parseFloat(item.percentage) || parseFloat(item.pct) || 0
        }));

        if (data.funnel.length === 0) {
          // No dummy data
        }

        console.log('ConversionsSection - Funnel data parsed:', data.funnel.length, 'items, totalSessions:', data.totalSessions);
        console.log('ConversionsSection - Funnel data structure:', JSON.stringify(data.funnel, null, 2));
      } else {
        console.log('ConversionsSection - Journey API failed or returned no data:', journeyRes.status, journeyRes.reason?.message);
        if (journeyRes.status === 'rejected') {
          console.error('Journey API Error:', journeyRes.reason);
        }
      }

      setConversionData(data);
      setLoading(false);
    }).catch((error) => {
      console.error('Conversion data fetch error:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Set empty data on error
      setConversionData({
        totalSessions: 0,
        totalConversions: 0,
        funnel: [],
        ctaData: [],
      });
      setLoading(false);
    });
  }, [timeRange]);

  const { totalSessions: realSessions, totalConversions: realConversions, funnel, ctaData } = conversionData;
  const convRate = realSessions > 0 ? ((realConversions / realSessions) * 100).toFixed(1) : '0.0';

  // Use real data only - no fallbacks
  const funnelData = funnel.length > 0 ? funnel : [];

  // Filter and prioritize meaningful conversion data
  const meaningfulCtaData = ctaData.filter(c => c.cta_type !== 'Other Interaction');

  // If we have meaningful data, use it; otherwise show all data but prioritize meaningful items
  let ctaDisplayData = [];
  if (meaningfulCtaData.length > 0) {
    ctaDisplayData = meaningfulCtaData.slice(0, 8);
  } else if (ctaData.length > 0) {
    // If no meaningful data, show top items by conversion rate
    ctaDisplayData = ctaData
      .sort((a, b) => (parseFloat(b.conv_rate || b.conv || 0) - parseFloat(a.conv_rate || a.conv || 0)))
      .slice(0, 8);
  }

  const maxClicks = ctaDisplayData.length > 0 ? Math.max(...ctaDisplayData.map(c => c.click_count || c.clicks || 0), 1) : 1;

  console.log('ConversionsSection - Final ctaDisplayData:', ctaDisplayData);
  console.log('ConversionsSection - ctaDisplayData.length:', ctaDisplayData.length);
  console.log('ConversionsSection - maxClicks:', maxClicks);

  console.log('ConversionsSection - Final funnelData:', funnelData);
  console.log('ConversionsSection - funnelData.length:', funnelData.length);
  console.log('ConversionsSection - funnelData.length > 0:', funnelData.length > 0);

  // Empty state component
  const EmptyState = ({ message }) => (
    <div style={{
      padding: '40px 20px',
      textAlign: 'center',
      color: darkMode ? '#64748B' : '#94A3B8',
      fontSize: 14,
    }}>
      <CheckCircleOutlined style={{ fontSize: 32, marginBottom: 12, color: darkMode ? '#334155' : '#CBD5E1' }} />
      <div>{message}</div>
    </div>
  );

  return (
    <div className="conversions-section" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @media (max-width: 1024px) {
          .conversions-section {
            gap: 16px !important;
          }
        }
        @media (max-width: 768px) {
          .conversions-section {
            gap: 14px !important;
          }
        }
        @media (max-width: 480px) {
          .conversions-section {
            gap: 12px !important;
          }
        }
      `}</style>

      {loading ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: darkMode ? '#64748B' : '#94A3B8' }}>
          Loading conversion data...
        </div>
      ) : (
        <>
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
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 4,
                background: '#10B98120',
                color: '#10B981',
                marginLeft: 'auto'
              }}>
                Real Data
              </span>
            </div>
            {funnelData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                {funnelData.map((step, i) => (
                  <FunnelStep
                    key={i}
                    label={step.step || step.action_type || step.label || `Step ${i + 1}`}
                    value={step.count || step.sessions || 0}
                    pct={step.pct || step.percentage || Math.round(((step.count || 0) / Math.max(1, funnelData[0].count || 1)) * 100) || 0}
                    color={COLORS[i % COLORS.length]}
                    darkMode={darkMode}
                    isLast={i === funnelData.length - 1}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No funnel data available for selected time range" />
            )}
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
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 4,
                background: '#10B98120',
                color: '#10B981',
                marginLeft: 'auto'
              }}>
                Real Data
              </span>
            </div>
            {ctaDisplayData.length > 0 ? (
              <div className="cta-table-container" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: darkMode ? '#1E293B' : '#F8FAFC' }}>
                      {['Action Type', 'Interactions', 'Unique Users', 'Conv. Rate', 'Volume'].map(h => (
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
                    {ctaDisplayData.map((c, i) => {
                      const clicks = c.click_count || c.clicks || 0;
                      const uniqueClicks = c.unique_clicks || 0;
                      const pct = Math.round((clicks / maxClicks) * 100);
                      const color = COLORS[i % COLORS.length];
                      const convR = c.conv_rate || c.conv || 0;

                      return (
                        <tr
                          key={i}
                          style={{
                            borderBottom: `1px solid ${darkMode ? '#1E293B' : '#E2E8F0'}`,
                            transition: 'background 0.15s',
                          }}
                        >
                          <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: darkMode ? '#F8FAFC' : '#0F172A' }}>
                            {c.cta_type || c.label || c.cta_label || `Action ${i + 1}`}
                          </td>
                          <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color }}>
                            {clicks.toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: darkMode ? '#94A3B8' : '#64748B' }}>
                            {uniqueClicks.toLocaleString()}
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
            ) : (
              <EmptyState message="No CTA data available for selected time range" />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ConversionsSection;
