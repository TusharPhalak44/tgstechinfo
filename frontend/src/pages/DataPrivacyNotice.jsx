import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const UPDATED = 'July 8, 2026';

const Section = ({ title, children, darkMode }) => (
  <div style={{ marginBottom: 'clamp(24px, 4vw, 32px)' }}>
    <h2 style={{ fontSize: 'clamp(16px, 2.2vw, 19px)', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 10, paddingBottom: 8, borderBottom: darkMode ? '2px solid #334155' : '2px solid #e8f0ff' }}>{title}</h2>
    <div style={{ fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151', lineHeight: 1.85 }}>{children}</div>
  </div>
);

const Li = ({ children }) => <li style={{ marginBottom: 6, paddingLeft: 4 }}>{children}</li>;

const Badge = ({ children, color }) => (
  <span style={{ display: 'inline-block', background: `${color}18`, color, fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20, border: `1px solid ${color}33`, marginRight: 8, marginBottom: 6 }}>{children}</span>
);

const TabBtn = ({ active, onClick, children, darkMode }) => (
  <button onClick={onClick} style={{
    padding: 'clamp(8px, 1.5vw, 10px) clamp(18px, 3vw, 24px)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 'clamp(13px, 1.5vw, 14px)',
    borderRadius: '10px 10px 0 0', transition: 'all .2s',
    background: active ? (darkMode ? '#1e293b' : '#fff') : (darkMode ? '#0f172a' : '#f0f4ff'),
    color: active ? (darkMode ? '#f1f5f9' : '#1a1a2e') : (darkMode ? '#94a3b8' : '#6b7280'),
    borderBottom: active ? '3px solid #4a7cff' : '3px solid transparent',
  }}>{children}</button>
);

const DataPrivacyNotice = () => {
  const { darkMode } = useTheme();
  const [tab, setTab] = useState('gdpr');

  return (
    <div style={{ background: darkMode ? '#0f172a' : '#f8f9fa', minHeight: '100vh', padding: 'clamp(16px, 3vw, 24px) clamp(12px, 2vw, 24px)' }}>
      {/* Hero */}
      <div style={{ maxWidth: 1200, margin: '0 auto clamp(16px, 3vw, 24px)', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', borderRadius: 16, padding: 'clamp(24px, 5vw, 40px) clamp(20px, 4vw, 32px)', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(11px, 1.3vw, 12px)', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>Data Privacy Notice</h1>
        <p style={{ fontSize: 'clamp(13px, 1.5vw, 14px)', color: '#94a3b8', margin: '0 0 20px' }}>GDPR &amp; CCPA/CPRA Combined Notice | Last updated: {UPDATED}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          {['GDPR', 'UK GDPR', 'CCPA/CPRA', 'CAN-SPAM', 'CASL'].map(b => (
            <span key={b} style={{ background: 'rgba(96,165,250,.15)', color: '#93c5fd', fontSize: 'clamp(10px, 1.2vw, 11px)', fontWeight: 700, padding: 'clamp(3px, 0.5vw, 4px) clamp(12px, 2vw, 14px)', borderRadius: 20, border: '1px solid rgba(96,165,250,.3)' }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 0, paddingLeft: 4, flexWrap: 'wrap' }}>
          <TabBtn active={tab === 'gdpr'} onClick={() => setTab('gdpr')} darkMode={darkMode}>🇪🇺 GDPR / UK GDPR Notice</TabBtn>
          <TabBtn active={tab === 'ccpa'} onClick={() => setTab('ccpa')} darkMode={darkMode}>🇺🇸 CCPA / CPRA Notice</TabBtn>
        </div>

        <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: '0 16px 16px 16px', padding: 'clamp(20px, 4vw, 32px)', boxShadow: darkMode ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.07)' }}>

          {tab === 'gdpr' && (
            <>
              <p style={{ fontSize: 'clamp(14px, 1.5vw, 15px)', color: darkMode ? '#cbd5e1' : '#374151', lineHeight: 1.85, marginBottom: 24 }}>
                This GDPR Notice applies to individuals located in the <strong>European Economic Area (EEA)</strong>, <strong>United Kingdom</strong>, and <strong>Switzerland</strong>. It supplements our <Link to="/privacy-policy" style={{ color: '#4a7cff' }}>Privacy Policy</Link> and explains your rights under the General Data Protection Regulation (GDPR) and UK GDPR.
              </p>

              <Section title="1. Data Controller" darkMode={darkMode}>
                <p style={{ fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>TGS Tech Info acts as the <strong>Data Controller</strong> for personal data collected through tgstechinfo.com.</p>
                <div style={{ marginTop: 16, padding: 'clamp(14px, 2.5vw, 16px) clamp(16px, 3vw, 20px)', background: darkMode ? 'rgba(74, 124, 255, 0.1)' : '#f0f4ff', borderRadius: 12, borderLeft: '4px solid #4a7cff' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', fontSize: 'clamp(14px, 1.6vw, 15px)' }}>TGS Tech Info</p>
                  <p style={{ margin: '0 0 4px', color: darkMode ? '#cbd5e1' : '#374151', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>Email: <a href="mailto:privacy@tgstechinfo.com" style={{ color: '#4a7cff' }}>privacy@tgstechinfo.com</a></p>
                  <p style={{ margin: 0, color: darkMode ? '#cbd5e1' : '#374151', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>DPO Contact: <a href="mailto:sagar.machale@tgstechinfo.com" style={{ color: '#4a7cff' }}>sagar.machale@tgstechinfo.com</a></p>
                </div>
              </Section>

              <Section title="2. Legal Bases for Processing" darkMode={darkMode}>
                <p style={{ marginBottom: 14, fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>We process personal data under the following legal bases:</p>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    { base: 'Consent (Art. 6(1)(a))', desc: 'Newsletter subscriptions, marketing cookies, gated content downloads, and promotional communications where you have given explicit consent.', color: '#00b894' },
                    { base: 'Contract (Art. 6(1)(b))', desc: 'Account registration, content submission, and service delivery where processing is necessary to perform a contract with you.', color: '#4a7cff' },
                    { base: 'Legitimate Interest (Art. 6(1)(f))', desc: 'B2B lead generation, demand generation, content syndication, analytics, fraud prevention, and platform security where our interests do not override your rights.', color: '#e17055' },
                    { base: 'Legal Obligation (Art. 6(1)(c))', desc: 'Compliance with applicable laws, tax obligations, and regulatory requirements.', color: '#6c5ce7' },
                  ].map(({ base, desc, color }) => (
                    <div key={base} style={{ padding: 'clamp(12px, 2vw, 14px) clamp(14px, 2vw, 16px)', background: darkMode ? '#0f172a' : '#fafbff', borderRadius: 10, borderLeft: `3px solid ${color}` }}>
                      <div style={{ fontWeight: 700, color, fontSize: 'clamp(12px, 1.4vw, 13px)', marginBottom: 4 }}>{base}</div>
                      <div style={{ fontSize: 'clamp(13px, 1.5vw, 13.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="3. B2B Legitimate Interest Processing" darkMode={darkMode}>
                <p style={{ marginBottom: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>For B2B marketing activities, we rely on <strong>legitimate interest</strong> as our legal basis where:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>We process business contact information (name, business email, job title, company) for B2B prospecting and demand generation</Li>
                  <Li>We conduct lead qualification, lead scoring, and account-based marketing (ABM)</Li>
                  <Li>We use intent data to identify businesses actively researching relevant solutions</Li>
                  <Li>We track email engagement (opens, clicks, downloads) for marketing optimization</Li>
                  <Li>We synchronize data with CRM and marketing automation platforms</Li>
                </ul>
                <p style={{ marginTop: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>We have conducted Legitimate Interest Assessments (LIAs) and determined that our B2B marketing activities do not override the rights and freedoms of business professionals. You may object to this processing at any time.</p>
              </Section>

              <Section title="4. Your GDPR Rights" darkMode={darkMode}>
                <p style={{ marginBottom: 14, fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>Under GDPR and UK GDPR, you have the following rights:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                  {[
                    { right: 'Right of Access', desc: 'Request a copy of your personal data we hold', icon: '📋' },
                    { right: 'Right to Rectification', desc: 'Correct inaccurate or incomplete personal data', icon: '✏️' },
                    { right: 'Right to Erasure', desc: 'Request deletion of your personal data ("right to be forgotten")', icon: '🗑️' },
                    { right: 'Right to Restriction', desc: 'Restrict how we process your personal data', icon: '🔒' },
                    { right: 'Right to Portability', desc: 'Receive your data in a structured, machine-readable format', icon: '📦' },
                    { right: 'Right to Object', desc: 'Object to processing based on legitimate interest or direct marketing', icon: '🚫' },
                    { right: 'Withdraw Consent', desc: 'Withdraw consent at any time without affecting prior processing', icon: '↩️' },
                    { right: 'Lodge a Complaint', desc: 'File a complaint with your national supervisory authority', icon: '⚖️' },
                  ].map(({ right, desc, icon }) => (
                    <div key={right} style={{ padding: 'clamp(12px, 2vw, 14px) clamp(14px, 2vw, 16px)', background: darkMode ? '#0f172a' : '#f8faff', borderRadius: 10, border: darkMode ? '1px solid #334155' : '1px solid #e8f0ff' }}>
                      <div style={{ fontSize: 'clamp(18px, 2.5vw, 20px)', marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 4 }}>{right}</div>
                      <div style={{ fontSize: 'clamp(12px, 1.4vw, 12.5px)', color: darkMode ? '#94a3b8' : '#6b7280' }}>{desc}</div>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: 16, fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>To exercise your rights, submit a <Link to="/data-requests" style={{ color: '#4a7cff' }}>Data Subject Request</Link> or email <a href="mailto:privacy@tgstechinfo.com" style={{ color: '#4a7cff' }}>privacy@tgstechinfo.com</a>. We will respond within <strong>30 days</strong>.</p>
              </Section>

              <Section title="5. International Data Transfers" darkMode={darkMode}>
                <p style={{ marginBottom: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>Where personal data is transferred outside the EEA or UK, we ensure appropriate safeguards are in place including:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>Standard Contractual Clauses (SCCs) approved by the European Commission</Li>
                  <Li>UK International Data Transfer Agreements (IDTAs)</Li>
                  <Li>Adequacy decisions where applicable</Li>
                  <Li>Binding Corporate Rules where relevant</Li>
                </ul>
              </Section>

              <Section title="6. Automated Decision-Making and Profiling" darkMode={darkMode}>
                <p style={{ marginBottom: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>We use automated processing for:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li><strong>Lead Scoring:</strong> Automated scoring based on engagement signals, firmographic data, and behavioral patterns</Li>
                  <Li><strong>Content Personalization:</strong> Automated recommendations based on browsing history and preferences</Li>
                  <Li><strong>Intent Data Analysis:</strong> AI-assisted identification of in-market buyers</Li>
                </ul>
                <p style={{ marginTop: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>These processes do not produce legally significant decisions without human oversight. You may object to profiling at any time.</p>
              </Section>

              <Section title="7. Supervisory Authorities" darkMode={darkMode}>
                <p style={{ marginBottom: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>You have the right to lodge a complaint with the relevant supervisory authority:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li><strong>India:</strong> Data Protection Board of India (DPBI) under the Digital Personal Data Protection Act, 2023 — <a href="https://www.meity.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#4a7cff' }}>meity.gov.in</a></Li>
                </ul>
              </Section>
            </>
          )}

          {tab === 'ccpa' && (
            <>
              <p style={{ fontSize: 'clamp(14px, 1.5vw, 15px)', color: darkMode ? '#cbd5e1' : '#374151', lineHeight: 1.85, marginBottom: 24 }}>
                This California Privacy Notice applies to <strong>California residents</strong> and supplements our <Link to="/privacy-policy" style={{ color: '#4a7cff' }}>Privacy Policy</Link>. It is provided pursuant to the <strong>California Consumer Privacy Act (CCPA)</strong> as amended by the <strong>California Privacy Rights Act (CPRA)</strong>.
              </p>

              <Section title="1. Categories of Personal Information Collected" darkMode={darkMode}>
                <p style={{ marginBottom: 14, fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>In the past 12 months, we have collected the following categories of personal information:</p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(12px, 1.4vw, 13px)' }}>
                    <thead>
                      <tr style={{ background: darkMode ? '#1e293b' : '#f0f4ff' }}>
                        {['Category', 'Examples', 'Collected'].map(h => (
                          <th key={h} style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(10px, 1.5vw, 12px)', textAlign: 'left', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', borderBottom: darkMode ? '2px solid #334155' : '2px solid #dde2ee', fontSize: 'clamp(12px, 1.4vw, 13px)' }}>{h}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Identifiers', 'Name, email, IP address, device ID', '✅'],
                        ['Professional Information', 'Job title, company, industry, department', '✅'],
                        ['Internet Activity', 'Browsing history, search queries, page interactions', '✅'],
                        ['Geolocation Data', 'Country, state, city (derived from IP)', '✅'],
                        ['Inferences', 'Lead scores, engagement scores, interest profiles', '✅'],
                        ['Sensitive Personal Info', 'Not intentionally collected', '❌'],
                      ].map(([cat, ex, col], i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? (darkMode ? '#0f172a' : '#fff') : (darkMode ? '#1e293b' : '#fafbff') }}>
                          <td style={{ padding: 'clamp(7px, 1.5vw, 9px) clamp(10px, 1.5vw, 12px)', fontWeight: 600, borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#f1f5f9' : '#1a1a2e' }}>{cat}</td>
                          <td style={{ padding: 'clamp(7px, 1.5vw, 9px) clamp(10px, 1.5vw, 12px)', color: darkMode ? '#94a3b8' : '#6b7280', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', fontSize: 'clamp(12px, 1.4vw, 13px)' }}>{ex}</td>
                          <td style={{ padding: 'clamp(7px, 1.5vw, 9px) clamp(10px, 1.5vw, 12px)', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', fontSize: 'clamp(15px, 2vw, 16px)' }}>{col}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="2. Purposes for Collection" darkMode={darkMode}>
                <p style={{ marginBottom: 10, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>We collect personal information for the following business purposes:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>Providing and improving our B2B publishing platform</Li>
                  <Li>B2B lead generation, demand generation, and content syndication</Li>
                  <Li>Account-based marketing (ABM) and intent marketing</Li>
                  <Li>Email marketing, newsletters, and promotional communications</Li>
                  <Li>Analytics, research, and platform optimization</Li>
                  <Li>Security, fraud prevention, and legal compliance</Li>
                </ul>
              </Section>

              <Section title="3. Sale or Sharing of Personal Information" darkMode={darkMode}>
                <div style={{ padding: 'clamp(14px, 2.5vw, 16px) clamp(16px, 3vw, 20px)', background: darkMode ? 'rgba(225, 112, 85, 0.15)' : '#fff8f0', borderRadius: 12, borderLeft: '4px solid #e17055', marginBottom: 16 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#1a1a2e', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>
                    TGS Tech Info may share personal information with third-party advertising and marketing partners in ways that may constitute a "sale" or "sharing" under CCPA/CPRA, including for cross-context behavioral advertising.
                  </p>
                </div>
                <p style={{ marginBottom: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>Categories of third parties with whom we may share information:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>CRM and marketing automation platforms (HubSpot, Salesforce, Marketo)</Li>
                  <Li>Analytics providers (Google Analytics, Microsoft Clarity)</Li>
                  <Li>Advertising networks (LinkedIn, Meta, Google)</Li>
                  <Li>Content syndication partners</Li>
                  <Li>Business data enrichment providers</Li>
                </ul>
                <p style={{ marginTop: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
                  To opt out of the sale or sharing of your personal information, visit our{' '}
                  <Link to="/do-not-sell" style={{ color: '#4a7cff', fontWeight: 600 }}>Do Not Sell or Share My Personal Information</Link> page.
                </p>
              </Section>

              <Section title="4. Your California Privacy Rights" darkMode={darkMode}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
                  {[
                    { right: 'Right to Know', desc: 'Know what personal information we collect, use, disclose, and sell', icon: '🔍' },
                    { right: 'Right to Delete', desc: 'Request deletion of personal information we have collected', icon: '🗑️' },
                    { right: 'Right to Correct', desc: 'Correct inaccurate personal information we maintain', icon: '✏️' },
                    { right: 'Right to Opt-Out', desc: 'Opt out of the sale or sharing of your personal information', icon: '🚫' },
                    { right: 'Right to Limit', desc: 'Limit use of sensitive personal information', icon: '🔒' },
                    { right: 'Non-Discrimination', desc: 'Not be discriminated against for exercising your privacy rights', icon: '⚖️' },
                  ].map(({ right, desc, icon }) => (
                    <div key={right} style={{ padding: 'clamp(12px, 2vw, 14px) clamp(14px, 2vw, 16px)', background: darkMode ? '#0f172a' : '#f8faff', borderRadius: 10, border: darkMode ? '1px solid #334155' : '1px solid #e8f0ff' }}>
                      <div style={{ fontSize: 'clamp(18px, 2.5vw, 20px)', marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 4 }}>{right}</div>
                      <div style={{ fontSize: 'clamp(12px, 1.4vw, 12.5px)', color: darkMode ? '#94a3b8' : '#6b7280' }}>{desc}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>To exercise your rights, submit a <Link to="/data-requests" style={{ color: '#4a7cff' }}>Data Subject Request</Link>. We will respond within <strong>45 days</strong> (extendable by an additional 45 days with notice).</p>
              </Section>

              <Section title="5. Shine the Light" darkMode={darkMode}>
                <p style={{ fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>California Civil Code Section 1798.83 permits California residents to request information about personal information disclosed to third parties for direct marketing purposes. To make such a request, contact us at <a href="mailto:privacy@tgstechinfo.com" style={{ color: '#4a7cff' }}>privacy@tgstechinfo.com</a>.</p>
              </Section>

              <Section title="6. Authorized Agent Requests" darkMode={darkMode}>
                <p style={{ fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>You may designate an authorized agent to submit requests on your behalf. We will require written proof of authorization and may verify your identity directly before processing the request.</p>
              </Section>
            </>
          )}

          {/* Contact box always visible */}
          <div style={{ marginTop: 40, padding: 'clamp(14px, 2.5vw, 20px) clamp(16px, 3vw, 24px)', background: darkMode ? 'rgba(74, 124, 255, 0.1)' : '#f0f4ff', borderRadius: 12, borderLeft: '4px solid #4a7cff' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', fontSize: 'clamp(14px, 1.6vw, 15px)' }}>Privacy Officer — TGS Tech Info</p>
            <p style={{ margin: '0 0 4px', color: darkMode ? '#cbd5e1' : '#374151', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>Email: <a href="mailto:privacy@tgstechinfo.com" style={{ color: '#4a7cff' }}>privacy@tgstechinfo.com</a></p>
            <p style={{ margin: '0 0 4px', color: darkMode ? '#cbd5e1' : '#374151', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>DPO: <a href="mailto:sagar.machale@tgstechinfo.com" style={{ color: '#4a7cff' }}>sagar.machale@tgstechinfo.com</a></p>
            <p style={{ margin: 0, color: darkMode ? '#cbd5e1' : '#374151', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>
              Submit a request: <Link to="/data-requests" style={{ color: '#4a7cff' }}>Data Subject Request Form</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPrivacyNotice;
