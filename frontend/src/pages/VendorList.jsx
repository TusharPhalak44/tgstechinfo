import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const UPDATED = 'July 8, 2026';

const VENDORS = [
  { name: 'Amazon Web Services (AWS)', category: 'Cloud Infrastructure', purpose: 'Cloud hosting, storage, compute, and CDN services', location: 'USA (Global)', transfer: 'SCCs', link: 'https://aws.amazon.com/privacy/' },
  { name: 'MongoDB Atlas', category: 'Database', purpose: 'Cloud database hosting and management', location: 'USA (Global)', transfer: 'SCCs', link: 'https://www.mongodb.com/legal/privacy-policy' },
  { name: 'Google Analytics', category: 'Analytics', purpose: 'Website traffic analysis and user behavior tracking', location: 'USA', transfer: 'SCCs', link: 'https://policies.google.com/privacy' },
  { name: 'Google Tag Manager', category: 'Tag Management', purpose: 'Managing and deploying marketing and analytics tags', location: 'USA', transfer: 'SCCs', link: 'https://policies.google.com/privacy' },
  { name: 'Microsoft Clarity', category: 'Analytics', purpose: 'Session recording, heatmaps, and user behavior analytics', location: 'USA', transfer: 'SCCs', link: 'https://privacy.microsoft.com/en-us/privacystatement' },
  { name: 'LinkedIn Insight Tag', category: 'Marketing / Analytics', purpose: 'B2B audience analytics, ad conversion tracking, and retargeting', location: 'USA', transfer: 'SCCs', link: 'https://www.linkedin.com/legal/privacy-policy' },
  { name: 'Meta Pixel (Facebook)', category: 'Advertising', purpose: 'Ad delivery, conversion tracking, and retargeting', location: 'USA', transfer: 'SCCs', link: 'https://www.facebook.com/privacy/policy/' },
  { name: 'HubSpot', category: 'CRM / Marketing Automation', purpose: 'CRM, lead management, email marketing, and marketing automation', location: 'USA', transfer: 'SCCs', link: 'https://legal.hubspot.com/privacy-policy' },
  { name: 'Salesforce', category: 'CRM', purpose: 'Customer relationship management and sales pipeline', location: 'USA (Global)', transfer: 'SCCs / BCRs', link: 'https://www.salesforce.com/company/privacy/' },
  { name: 'Marketo (Adobe)', category: 'Marketing Automation', purpose: 'Marketing automation, lead nurturing, and campaign management', location: 'USA', transfer: 'SCCs', link: 'https://www.adobe.com/privacy/policy.html' },
  { name: 'Hotjar', category: 'Analytics', purpose: 'User behavior analytics, heatmaps, and feedback collection', location: 'Malta (EU)', transfer: 'EU-based', link: 'https://www.hotjar.com/legal/policies/privacy/' },
  { name: 'Mailchimp (Intuit)', category: 'Email Marketing', purpose: 'Email newsletter delivery and subscriber management', location: 'USA', transfer: 'SCCs', link: 'https://mailchimp.com/legal/privacy/' },
  { name: 'SendGrid (Twilio)', category: 'Email Delivery', purpose: 'Transactional email delivery (notifications, confirmations)', location: 'USA', transfer: 'SCCs', link: 'https://www.twilio.com/en-us/legal/privacy' },
  { name: 'Cloudflare', category: 'CDN / Security', purpose: 'Content delivery network, DDoS protection, and WAF', location: 'USA (Global)', transfer: 'SCCs', link: 'https://www.cloudflare.com/privacypolicy/' },
  { name: 'Stripe', category: 'Payment Processing', purpose: 'Payment processing for subscriptions and transactions', location: 'USA', transfer: 'SCCs', link: 'https://stripe.com/privacy' },
  { name: 'Intercom', category: 'Live Chat / Support', purpose: 'Live chat, customer support, and in-app messaging', location: 'USA', transfer: 'SCCs', link: 'https://www.intercom.com/legal/privacy' },
  { name: 'ZoomInfo', category: 'Data Enrichment', purpose: 'Business contact data enrichment and firmographic data', location: 'USA', transfer: 'SCCs', link: 'https://www.zoominfo.com/about/privacy-policy' },
  { name: 'Bombora', category: 'Intent Data', purpose: 'B2B intent data and in-market buyer identification', location: 'USA', transfer: 'SCCs', link: 'https://bombora.com/privacy/' },
  { name: 'Clearbit (HubSpot)', category: 'Data Enrichment', purpose: 'Real-time company and contact data enrichment', location: 'USA', transfer: 'SCCs', link: 'https://clearbit.com/privacy' },
  { name: 'Sentry', category: 'Error Monitoring', purpose: 'Application error tracking and performance monitoring', location: 'USA', transfer: 'SCCs', link: 'https://sentry.io/privacy/' },
];

const CATEGORIES = ['All', ...Array.from(new Set(VENDORS.map(v => v.category.split(' / ')[0])))];

const catColor = {
  'Cloud Infrastructure': '#4a7cff', 'Database': '#6c5ce7', 'Analytics': '#00b894',
  'Tag Management': '#fdcb6e', 'Marketing': '#e17055', 'Advertising': '#e17055',
  'CRM': '#0984e3', 'Email': '#00cec9', 'CDN': '#a29bfe', 'Payment': '#55efc4',
  'Live Chat': '#fd79a8', 'Data Enrichment': '#fab1a0', 'Intent Data': '#e17055',
  'Error Monitoring': '#636e72',
};

const getCatColor = (cat) => {
  const key = Object.keys(catColor).find(k => cat.includes(k));
  return key ? catColor[key] : '#6b7280';
};

const VendorList = () => {
  const { darkMode } = useTheme();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = VENDORS.filter(v => {
    const matchCat = filter === 'All' || v.category.includes(filter);
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.purpose.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ background: darkMode ? '#0f172a' : '#f8f9fa', minHeight: '100vh', padding: 'clamp(16px, 3vw, 24px) clamp(12px, 2vw, 24px)' }}>
      {/* Hero */}
      <div style={{ maxWidth: 1200, margin: '0 auto clamp(16px, 3vw, 24px)', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', borderRadius: 16, padding: 'clamp(24px, 5vw, 40px) clamp(20px, 4vw, 32px)', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(11px, 1.3vw, 12px)', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>Vendor &amp; Sub-Processor List</h1>
        <p style={{ fontSize: 'clamp(13px, 1.5vw, 14px)', color: '#94a3b8', margin: '0 0 16px' }}>Third-party service providers and data processors | Last updated: {UPDATED}</p>
        <div style={{ display: 'inline-block', background: 'rgba(96,165,250,.15)', color: '#93c5fd', fontSize: 'clamp(11px, 1.3vw, 12px)', fontWeight: 700, padding: 'clamp(4px, 0.8vw, 6px) clamp(14px, 2.5vw, 18px)', borderRadius: 20, border: '1px solid rgba(96,165,250,.3)' }}>
          {VENDORS.length} Active Sub-Processors
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', background: darkMode ? '#1e293b' : '#fff', borderRadius: 16, padding: 'clamp(20px, 4vw, 32px)', boxShadow: darkMode ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.07)' }}>

        <p style={{ fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151', lineHeight: 1.85, marginBottom: 'clamp(24px, 4vw, 32px)' }}>
          TGS Tech Info uses the following third-party service providers and sub-processors to operate our platform and deliver our services. All sub-processors are contractually required to process data only as instructed, maintain appropriate security measures, and comply with applicable data protection laws including GDPR and CCPA/CPRA.
        </p>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Search vendors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px)', border: darkMode ? '1px solid #334155' : '1px solid #dde2ee', borderRadius: 8, fontSize: 'clamp(13px, 1.5vw, 14px)', outline: 'none', minWidth: 200, background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#f1f5f9' : '#1a1a2e' }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} style={{
                padding: 'clamp(4px, 0.8vw, 6px) clamp(12px, 2vw, 14px)', border: '1px solid', borderRadius: 20, fontSize: 'clamp(11px, 1.3vw, 12px)', fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
                background: filter === cat ? '#4a7cff' : (darkMode ? '#0f172a' : '#f0f4ff'),
                color: filter === cat ? '#fff' : (darkMode ? '#94a3b8' : '#4a7cff'),
                borderColor: filter === cat ? '#4a7cff' : (darkMode ? '#334155' : '#dce6ff'),
              }}>{cat}</button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#94a3b8' : '#6b7280', marginBottom: 16 }}>Showing {filtered.length} of {VENDORS.length} vendors</div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(12px, 1.4vw, 13px)' }}>
            <thead>
              <tr style={{ background: darkMode ? '#1e293b' : '#f0f4ff' }}>
                {['Vendor', 'Category', 'Purpose', 'Data Location', 'Transfer Mechanism'].map(h => (
                  <th key={h} style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px)', textAlign: 'left', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', borderBottom: darkMode ? '2px solid #334155' : '2px solid #dde2ee', whiteSpace: 'nowrap', fontSize: 'clamp(12px, 1.4vw, 13px)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? (darkMode ? '#0f172a' : '#fff') : (darkMode ? '#1e293b' : '#fafbff') }}>
                  <td style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px)', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0' }}>
                    <a href={v.link} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#4a7cff'}
                      onMouseLeave={e => e.currentTarget.style.color = darkMode ? '#f1f5f9' : '#1a1a2e'}
                    >{v.name}</a>
                  </td>
                  <td style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px)', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0' }}>
                    <span style={{ background: darkMode ? `${getCatColor(v.category)}33` : `${getCatColor(v.category)}18`, color: getCatColor(v.category), fontSize: 'clamp(10px, 1.2vw, 11px)', fontWeight: 700, padding: 'clamp(2px, 0.4vw, 3px) clamp(8px, 1.5vw, 10px)', borderRadius: 20, border: `1px solid ${getCatColor(v.category)}33`, whiteSpace: 'nowrap' }}>
                      {v.category}
                    </span>
                  </td>
                  <td style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px)', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', color: darkMode ? '#94a3b8' : '#6b7280', maxWidth: 280, fontSize: 'clamp(11px, 1.3vw, 12px)' }}>{v.purpose}</td>
                  <td style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px)', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', whiteSpace: 'nowrap', color: darkMode ? '#cbd5e1' : '#374151', fontSize: 'clamp(11px, 1.3vw, 12px)' }}>{v.location}</td>
                  <td style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px)', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0' }}>
                    <span style={{ background: darkMode ? 'rgba(0, 184, 148, 0.15)' : '#e8faf5', color: '#00b894', fontSize: 'clamp(10px, 1.2vw, 11px)', fontWeight: 700, padding: 'clamp(2px, 0.4vw, 3px) clamp(8px, 1.5vw, 10px)', borderRadius: 20, border: '1px solid #00b89433' }}>{v.transfer}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 'clamp(24px, 4vw, 32px)', padding: 'clamp(16px, 3vw, 20px) clamp(18px, 3vw, 24px)', background: darkMode ? '#0f172a' : '#f8faff', borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #e8f0ff' }}>
          <div style={{ fontWeight: 700, fontSize: 'clamp(13px, 1.5vw, 14px)', color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 8 }}>Transfer Mechanism Key</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
            <span><strong>SCCs</strong> — Standard Contractual Clauses (EU Commission approved)</span>
            <span><strong>BCRs</strong> — Binding Corporate Rules</span>
            <span><strong>EU-based</strong> — Data processed within the EU/EEA</span>
            <span><strong>Adequacy</strong> — Country with EU adequacy decision</span>
          </div>
        </div>

        <div style={{ marginTop: 'clamp(20px, 3vw, 24px)', padding: 'clamp(14px, 2.5vw, 16px) clamp(16px, 3vw, 20px)', background: darkMode ? 'rgba(74, 124, 255, 0.1)' : '#f0f4ff', borderRadius: 12, borderLeft: '4px solid #4a7cff', fontSize: 'clamp(13px, 1.5vw, 14px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
          <strong>Updates:</strong> This list is reviewed and updated quarterly. We will notify users of material changes to our sub-processor list in accordance with our contractual obligations. For questions, contact <a href="mailto:privacy@tgstechinfo.com" style={{ color: '#4a7cff' }}>privacy@tgstechinfo.com</a>.
        </div>

      </div>
    </div>
  );
};

export default VendorList;
