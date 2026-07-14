import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const UPDATED = 'July 8, 2026';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid #e8f0ff' }}>{title}</h2>
    <div style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.85 }}>{children}</div>
  </div>
);

const Li = ({ children }) => <li style={{ marginBottom: 6, paddingLeft: 4 }}>{children}</li>;

const Badge = ({ children, color }) => (
  <span style={{ display: 'inline-block', background: `${color}18`, color, fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20, border: `1px solid ${color}33`, marginRight: 8, marginBottom: 6 }}>{children}</span>
);

const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    padding: '10px 24px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
    borderRadius: '10px 10px 0 0', transition: 'all .2s',
    background: active ? '#fff' : '#f0f4ff',
    color: active ? '#1a1a2e' : '#6b7280',
    borderBottom: active ? '3px solid #4a7cff' : '3px solid transparent',
  }}>{children}</button>
);

const DataPrivacyNotice = () => {
  const [tab, setTab] = useState('gdpr');

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '40px 16px' }}>
      {/* Hero */}
      <div style={{ maxWidth: 900, margin: '0 auto 40px', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', borderRadius: 16, padding: '48px 40px', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>Data Privacy Notice</h1>
        <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 20px' }}>GDPR &amp; CCPA/CPRA Combined Notice | Last updated: {UPDATED}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          {['GDPR', 'UK GDPR', 'CCPA/CPRA', 'CAN-SPAM', 'CASL'].map(b => (
            <span key={b} style={{ background: 'rgba(96,165,250,.15)', color: '#93c5fd', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, border: '1px solid rgba(96,165,250,.3)' }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 0, paddingLeft: 4 }}>
          <TabBtn active={tab === 'gdpr'} onClick={() => setTab('gdpr')}>🇪🇺 GDPR / UK GDPR Notice</TabBtn>
          <TabBtn active={tab === 'ccpa'} onClick={() => setTab('ccpa')}>🇺🇸 CCPA / CPRA Notice</TabBtn>
        </div>

        <div style={{ background: '#fff', borderRadius: '0 16px 16px 16px', padding: '48px 48px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>

          {tab === 'gdpr' && (
            <>
              <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.85, marginBottom: 32 }}>
                This GDPR Notice applies to individuals located in the <strong>European Economic Area (EEA)</strong>, <strong>United Kingdom</strong>, and <strong>Switzerland</strong>. It supplements our <Link to="/privacy-policy" style={{ color: '#4a7cff' }}>Privacy Policy</Link> and explains your rights under the General Data Protection Regulation (GDPR) and UK GDPR.
              </p>

              <Section title="1. Data Controller">
                <p>TGS Tech Info acts as the <strong>Data Controller</strong> for personal data collected through tgstechinfo.com.</p>
                <div style={{ marginTop: 16, padding: '16px 20px', background: '#f0f4ff', borderRadius: 12, borderLeft: '4px solid #4a7cff' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#1a1a2e' }}>TGS Tech Info</p>
                  <p style={{ margin: '0 0 4px', color: '#374151' }}>Email: <a href="mailto:privacy@tgstechinfo.com" style={{ color: '#4a7cff' }}>privacy@tgstechinfo.com</a></p>
                  <p style={{ margin: 0, color: '#374151' }}>DPO Contact: <a href="mailto:dpo@tgstechinfo.com" style={{ color: '#4a7cff' }}>dpo@tgstechinfo.com</a></p>
                </div>
              </Section>

              <Section title="2. Legal Bases for Processing">
                <p style={{ marginBottom: 14 }}>We process personal data under the following legal bases:</p>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    { base: 'Consent (Art. 6(1)(a))', desc: 'Newsletter subscriptions, marketing cookies, gated content downloads, and promotional communications where you have given explicit consent.', color: '#00b894' },
                    { base: 'Contract (Art. 6(1)(b))', desc: 'Account registration, content submission, and service delivery where processing is necessary to perform a contract with you.', color: '#4a7cff' },
                    { base: 'Legitimate Interest (Art. 6(1)(f))', desc: 'B2B lead generation, demand generation, content syndication, analytics, fraud prevention, and platform security where our interests do not override your rights.', color: '#e17055' },
                    { base: 'Legal Obligation (Art. 6(1)(c))', desc: 'Compliance with applicable laws, tax obligations, and regulatory requirements.', color: '#6c5ce7' },
                  ].map(({ base, desc, color }) => (
                    <div key={base} style={{ padding: '14px 16px', background: '#fafbff', borderRadius: 10, borderLeft: `3px solid ${color}` }}>
                      <div style={{ fontWeight: 700, color, fontSize: 13, marginBottom: 4 }}>{base}</div>
                      <div style={{ fontSize: 13.5, color: '#374151' }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="3. B2B Legitimate Interest Processing">
                <p style={{ marginBottom: 12 }}>For B2B marketing activities, we rely on <strong>legitimate interest</strong> as our legal basis where:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>We process business contact information (name, business email, job title, company) for B2B prospecting and demand generation</Li>
                  <Li>We conduct lead qualification, lead scoring, and account-based marketing (ABM)</Li>
                  <Li>We use intent data to identify businesses actively researching relevant solutions</Li>
                  <Li>We track email engagement (opens, clicks, downloads) for marketing optimization</Li>
                  <Li>We synchronize data with CRM and marketing automation platforms</Li>
                </ul>
                <p style={{ marginTop: 12 }}>We have conducted Legitimate Interest Assessments (LIAs) and determined that our B2B marketing activities do not override the rights and freedoms of business professionals. You may object to this processing at any time.</p>
              </Section>

              <Section title="4. Your GDPR Rights">
                <p style={{ marginBottom: 14 }}>Under GDPR and UK GDPR, you have the following rights:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
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
                    <div key={right} style={{ padding: '14px 16px', background: '#f8faff', borderRadius: 10, border: '1px solid #e8f0ff' }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e', marginBottom: 4 }}>{right}</div>
                      <div style={{ fontSize: 12.5, color: '#6b7280' }}>{desc}</div>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: 16 }}>To exercise your rights, submit a <Link to="/data-requests" style={{ color: '#4a7cff' }}>Data Subject Request</Link> or email <a href="mailto:privacy@tgstechinfo.com" style={{ color: '#4a7cff' }}>privacy@tgstechinfo.com</a>. We will respond within <strong>30 days</strong>.</p>
              </Section>

              <Section title="5. International Data Transfers">
                <p style={{ marginBottom: 12 }}>Where personal data is transferred outside the EEA or UK, we ensure appropriate safeguards are in place including:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>Standard Contractual Clauses (SCCs) approved by the European Commission</Li>
                  <Li>UK International Data Transfer Agreements (IDTAs)</Li>
                  <Li>Adequacy decisions where applicable</Li>
                  <Li>Binding Corporate Rules where relevant</Li>
                </ul>
              </Section>

              <Section title="6. Automated Decision-Making and Profiling">
                <p style={{ marginBottom: 12 }}>We use automated processing for:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li><strong>Lead Scoring:</strong> Automated scoring based on engagement signals, firmographic data, and behavioral patterns</Li>
                  <Li><strong>Content Personalization:</strong> Automated recommendations based on browsing history and preferences</Li>
                  <Li><strong>Intent Data Analysis:</strong> AI-assisted identification of in-market buyers</Li>
                </ul>
                <p style={{ marginTop: 12 }}>These processes do not produce legally significant decisions without human oversight. You may object to profiling at any time.</p>
              </Section>

              <Section title="7. Supervisory Authorities">
                <p style={{ marginBottom: 12 }}>You have the right to lodge a complaint with your local supervisory authority:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li><strong>EU:</strong> Your national Data Protection Authority (DPA)</Li>
                  <Li><strong>UK:</strong> Information Commissioner's Office (ICO) — <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: '#4a7cff' }}>ico.org.uk</a></Li>
                  <Li><strong>Switzerland:</strong> Federal Data Protection and Information Commissioner (FDPIC)</Li>
                </ul>
              </Section>
            </>
          )}

          {tab === 'ccpa' && (
            <>
              <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.85, marginBottom: 32 }}>
                This California Privacy Notice applies to <strong>California residents</strong> and supplements our <Link to="/privacy-policy" style={{ color: '#4a7cff' }}>Privacy Policy</Link>. It is provided pursuant to the <strong>California Consumer Privacy Act (CCPA)</strong> as amended by the <strong>California Privacy Rights Act (CPRA)</strong>.
              </p>

              <Section title="1. Categories of Personal Information Collected">
                <p style={{ marginBottom: 14 }}>In the past 12 months, we have collected the following categories of personal information:</p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f0f4ff' }}>
                        {['Category', 'Examples', 'Collected'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#1a1a2e', borderBottom: '2px solid #dde2ee' }}>{h}</th>
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
                        <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbff' }}>
                          <td style={{ padding: '9px 12px', fontWeight: 600, borderBottom: '1px solid #f0f0f0' }}>{cat}</td>
                          <td style={{ padding: '9px 12px', color: '#6b7280', borderBottom: '1px solid #f0f0f0' }}>{ex}</td>
                          <td style={{ padding: '9px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 16 }}>{col}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="2. Purposes for Collection">
                <p style={{ marginBottom: 10 }}>We collect personal information for the following business purposes:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>Providing and improving our B2B publishing platform</Li>
                  <Li>B2B lead generation, demand generation, and content syndication</Li>
                  <Li>Account-based marketing (ABM) and intent marketing</Li>
                  <Li>Email marketing, newsletters, and promotional communications</Li>
                  <Li>Analytics, research, and platform optimization</Li>
                  <Li>Security, fraud prevention, and legal compliance</Li>
                </ul>
              </Section>

              <Section title="3. Sale or Sharing of Personal Information">
                <div style={{ padding: '16px 20px', background: '#fff8f0', borderRadius: 12, borderLeft: '4px solid #e17055', marginBottom: 16 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#1a1a2e' }}>
                    TGS Tech Info may share personal information with third-party advertising and marketing partners in ways that may constitute a "sale" or "sharing" under CCPA/CPRA, including for cross-context behavioral advertising.
                  </p>
                </div>
                <p style={{ marginBottom: 12 }}>Categories of third parties with whom we may share information:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>CRM and marketing automation platforms (HubSpot, Salesforce, Marketo)</Li>
                  <Li>Analytics providers (Google Analytics, Microsoft Clarity)</Li>
                  <Li>Advertising networks (LinkedIn, Meta, Google)</Li>
                  <Li>Content syndication partners</Li>
                  <Li>Business data enrichment providers</Li>
                </ul>
                <p style={{ marginTop: 12 }}>
                  To opt out of the sale or sharing of your personal information, visit our{' '}
                  <Link to="/do-not-sell" style={{ color: '#4a7cff', fontWeight: 600 }}>Do Not Sell or Share My Personal Information</Link> page.
                </p>
              </Section>

              <Section title="4. Your California Privacy Rights">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 16 }}>
                  {[
                    { right: 'Right to Know', desc: 'Know what personal information we collect, use, disclose, and sell', icon: '🔍' },
                    { right: 'Right to Delete', desc: 'Request deletion of personal information we have collected', icon: '🗑️' },
                    { right: 'Right to Correct', desc: 'Correct inaccurate personal information we maintain', icon: '✏️' },
                    { right: 'Right to Opt-Out', desc: 'Opt out of the sale or sharing of your personal information', icon: '🚫' },
                    { right: 'Right to Limit', desc: 'Limit use of sensitive personal information', icon: '🔒' },
                    { right: 'Non-Discrimination', desc: 'Not be discriminated against for exercising your privacy rights', icon: '⚖️' },
                  ].map(({ right, desc, icon }) => (
                    <div key={right} style={{ padding: '14px 16px', background: '#f8faff', borderRadius: 10, border: '1px solid #e8f0ff' }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e', marginBottom: 4 }}>{right}</div>
                      <div style={{ fontSize: 12.5, color: '#6b7280' }}>{desc}</div>
                    </div>
                  ))}
                </div>
                <p>To exercise your rights, submit a <Link to="/data-requests" style={{ color: '#4a7cff' }}>Data Subject Request</Link>. We will respond within <strong>45 days</strong> (extendable by an additional 45 days with notice).</p>
              </Section>

              <Section title="5. Shine the Light">
                <p>California Civil Code Section 1798.83 permits California residents to request information about personal information disclosed to third parties for direct marketing purposes. To make such a request, contact us at <a href="mailto:privacy@tgstechinfo.com" style={{ color: '#4a7cff' }}>privacy@tgstechinfo.com</a>.</p>
              </Section>

              <Section title="6. Authorized Agent Requests">
                <p>You may designate an authorized agent to submit requests on your behalf. We will require written proof of authorization and may verify your identity directly before processing the request.</p>
              </Section>
            </>
          )}

          {/* Contact box always visible */}
          <div style={{ marginTop: 40, padding: '20px 24px', background: '#f0f4ff', borderRadius: 12, borderLeft: '4px solid #4a7cff' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#1a1a2e' }}>Privacy Officer — TGS Tech Info</p>
            <p style={{ margin: '0 0 4px', color: '#374151' }}>Email: <a href="mailto:privacy@tgstechinfo.com" style={{ color: '#4a7cff' }}>privacy@tgstechinfo.com</a></p>
            <p style={{ margin: '0 0 4px', color: '#374151' }}>DPO: <a href="mailto:dpo@tgstechinfo.com" style={{ color: '#4a7cff' }}>dpo@tgstechinfo.com</a></p>
            <p style={{ margin: 0, color: '#374151' }}>
              Submit a request: <Link to="/data-requests" style={{ color: '#4a7cff' }}>Data Subject Request Form</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPrivacyNotice;
