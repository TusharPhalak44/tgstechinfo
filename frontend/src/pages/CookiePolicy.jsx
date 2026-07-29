import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const UPDATED = 'July 8, 2026';

const Hero = ({ title, subtitle, darkMode }) => (
  <div style={{ maxWidth: 1200, margin: '0 auto clamp(16px, 3vw, 24px)', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', borderRadius: 16, padding: 'clamp(24px, 5vw, 40px) clamp(20px, 4vw, 32px)', color: '#fff', textAlign: 'center' }}>
    <div style={{ fontSize: 'clamp(11px, 1.3vw, 12px)', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Legal</div>
    <h1 style={{ fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>{title}</h1>
    <p style={{ fontSize: 'clamp(13px, 1.5vw, 14px)', color: '#94a3b8', margin: 0 }}>{subtitle} | Last updated: {UPDATED}</p>
  </div>
);

const Section = ({ title, children, darkMode }) => (
  <div style={{ marginBottom: 'clamp(24px, 4vw, 32px)' }}>
    <h2 style={{ fontSize: 'clamp(16px, 2.2vw, 19px)', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 10, paddingBottom: 8, borderBottom: darkMode ? '2px solid #334155' : '2px solid #e8f0ff' }}>{title}</h2>
    <div style={{ fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151', lineHeight: 1.85 }}>{children}</div>
  </div>
);

const Li = ({ children }) => <li style={{ marginBottom: 6, paddingLeft: 4 }}>{children}</li>;

const COOKIES = [
  { name: '_ga', provider: 'Google Analytics', purpose: 'Distinguishes unique users by assigning a randomly generated number as a client identifier', duration: '2 years', type: 'Analytics' },
  { name: '_gid', provider: 'Google Analytics', purpose: 'Stores and updates a unique value for each page visited', duration: '24 hours', type: 'Analytics' },
  { name: '_gat', provider: 'Google Analytics', purpose: 'Used to throttle request rate', duration: '1 minute', type: 'Analytics' },
  { name: '_gtm_*', provider: 'Google Tag Manager', purpose: 'Manages tag firing and tracking scripts', duration: 'Session', type: 'Analytics' },
  { name: 'li_sugr', provider: 'LinkedIn Insight Tag', purpose: 'Collects data for B2B audience analytics and ad targeting', duration: '90 days', type: 'Marketing' },
  { name: 'UserMatchHistory', provider: 'LinkedIn', purpose: 'LinkedIn ad conversion and retargeting', duration: '30 days', type: 'Marketing' },
  { name: '_fbp', provider: 'Meta Pixel', purpose: 'Used by Facebook to deliver advertisements', duration: '3 months', type: 'Marketing' },
  { name: '_clck', provider: 'Microsoft Clarity', purpose: 'Persists the Clarity User ID and preferences', duration: '1 year', type: 'Analytics' },
  { name: '_clsk', provider: 'Microsoft Clarity', purpose: 'Connects multiple page views by a user into a single Clarity session recording', duration: '1 day', type: 'Analytics' },
  { name: 'hubspotutk', provider: 'HubSpot', purpose: 'Tracks visitor identity for CRM and marketing automation', duration: '13 months', type: 'Marketing' },
  { name: '__hstc', provider: 'HubSpot', purpose: 'Main cookie for tracking visitors', duration: '13 months', type: 'Marketing' },
  { name: '__hssc', provider: 'HubSpot', purpose: 'Tracks sessions for HubSpot analytics', duration: '30 minutes', type: 'Analytics' },
  { name: 'tgs_session', provider: 'TGS Tech Info', purpose: 'Maintains authenticated user session', duration: 'Session', type: 'Essential' },
  { name: 'tgs_auth', provider: 'TGS Tech Info', purpose: 'Stores JWT authentication token', duration: '7 days', type: 'Essential' },
  { name: 'tgs_prefs', provider: 'TGS Tech Info', purpose: 'Stores user content and display preferences', duration: '1 year', type: 'Functional' },
  { name: 'cookie_consent', provider: 'TGS Tech Info', purpose: 'Records cookie consent status', duration: '1 year', type: 'Essential' },
];

const typeColor = { Essential: '#00b894', Analytics: '#4a7cff', Marketing: '#e17055', Functional: '#6c5ce7' };

const CookieTable = ({ darkMode }) => (
  <div style={{ overflowX: 'auto', marginTop: 16 }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(12px, 1.4vw, 13px)' }}>
      <thead>
        <tr style={{ background: darkMode ? '#1e293b' : '#f0f4ff' }}>
          {['Cookie', 'Provider', 'Purpose', 'Duration', 'Type'].map(h => (
            <th key={h} style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(10px, 1.5vw, 12px)', textAlign: 'left', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', borderBottom: darkMode ? '2px solid #334155' : '2px solid #dde2ee', whiteSpace: 'nowrap', fontSize: 'clamp(12px, 1.4vw, 13px)' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {COOKIES.map((c, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? (darkMode ? '#0f172a' : '#fff') : (darkMode ? '#1e293b' : '#fafbff') }}>
            <td style={{ padding: 'clamp(7px, 1.5vw, 9px) clamp(10px, 1.5vw, 12px)', fontFamily: 'monospace', fontSize: 'clamp(11px, 1.3vw, 12px)', color: darkMode ? '#f1f5f9' : '#1a1a2e', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0' }}>{c.name}</td>
            <td style={{ padding: 'clamp(7px, 1.5vw, 9px) clamp(10px, 1.5vw, 12px)', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', whiteSpace: 'nowrap', fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#cbd5e1' : '#374151' }}>{c.provider}</td>
            <td style={{ padding: 'clamp(7px, 1.5vw, 9px) clamp(10px, 1.5vw, 12px)', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', color: darkMode ? '#94a3b8' : '#6b7280', fontSize: 'clamp(12px, 1.4vw, 13px)' }}>{c.purpose}</td>
            <td style={{ padding: 'clamp(7px, 1.5vw, 9px) clamp(10px, 1.5vw, 12px)', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', whiteSpace: 'nowrap', fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#cbd5e1' : '#374151' }}>{c.duration}</td>
            <td style={{ padding: 'clamp(7px, 1.5vw, 9px) clamp(10px, 1.5vw, 12px)', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0' }}>
              <span style={{ background: darkMode ? `${typeColor[c.type]}33` : `${typeColor[c.type]}18`, color: typeColor[c.type], fontSize: 'clamp(10px, 1.2vw, 11px)', fontWeight: 700, padding: '2px clamp(8px, 1.5vw, 10px)', borderRadius: 20, border: `1px solid ${typeColor[c.type]}33` }}>{c.type}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PREFS = [
  { key: 'essential', label: 'Essential Cookies', desc: 'Required for the website to function. Cannot be disabled.', locked: true },
  { key: 'analytics', label: 'Analytics Cookies', desc: 'Help us understand how visitors interact with our website by collecting anonymous data.' },
  { key: 'marketing', label: 'Marketing Cookies', desc: 'Used to deliver relevant advertisements and track campaign performance across platforms.' },
  { key: 'functional', label: 'Functional Cookies', desc: 'Enable enhanced functionality and personalisation such as remembering your preferences.' },
];

const CookiePreferences = ({ darkMode }) => {
  const [prefs, setPrefs] = useState({ essential: true, analytics: false, marketing: false, functional: false });
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem('cookie_consent', JSON.stringify({ ...prefs, timestamp: new Date().toISOString() }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ background: darkMode ? '#0f172a' : '#f8faff', border: darkMode ? '1px solid #334155' : '1px solid #dde2ee', borderRadius: 14, padding: 'clamp(20px, 4vw, 28px)', marginTop: 16 }}>
      <h3 style={{ fontSize: 'clamp(15px, 2vw, 16px)', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 20 }}>Manage Your Cookie Preferences</h3>
      {PREFS.map(p => (
        <div key={p.key} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 'clamp(10px, 2vw, 14px) 0', borderBottom: darkMode ? '1px solid #334155' : '1px solid #eef0f5', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 'clamp(13px, 1.5vw, 14px)', color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 4 }}>{p.label}</div>
            <div style={{ fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#94a3b8' : '#6b7280' }}>{p.desc}</div>
          </div>
          <div style={{ flexShrink: 0, marginTop: 4 }}>
            {p.locked ? (
              <span style={{ fontSize: 12, color: '#00b894', fontWeight: 600, background: darkMode ? 'rgba(0, 184, 148, 0.15)' : '#e8faf5', padding: '4px 12px', borderRadius: 20 }}>Always On</span>
            ) : (
              <button onClick={() => setPrefs(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', background: prefs[p.key] ? '#4a7cff' : (darkMode ? '#4b5563' : '#d1d5db') }}>
                <span style={{ position: 'absolute', top: 3, left: prefs[p.key] ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
              </button>
            )}
          </div>
        </div>
      ))}
      <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={save} style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(20px, 3vw, 28px)', background: '#4a7cff', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 'clamp(13px, 1.5vw, 14px)', cursor: 'pointer' }}>
          Save Preferences
        </button>
        <button onClick={() => { setPrefs({ essential: true, analytics: true, marketing: true, functional: true }); }} style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(20px, 3vw, 28px)', background: darkMode ? '#0f172a' : '#f0f4ff', color: '#4a7cff', border: darkMode ? '1px solid #334155' : '1px solid #dce6ff', borderRadius: 10, fontWeight: 600, fontSize: 'clamp(13px, 1.5vw, 14px)', cursor: 'pointer' }}>
          Accept All
        </button>
        <button onClick={() => { setPrefs({ essential: true, analytics: false, marketing: false, functional: false }); }} style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(20px, 3vw, 28px)', background: darkMode ? '#0f172a' : '#f9fafb', color: darkMode ? '#94a3b8' : '#6b7280', border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb', borderRadius: 10, fontWeight: 600, fontSize: 'clamp(13px, 1.5vw, 14px)', cursor: 'pointer' }}>
          Reject Non-Essential
        </button>
      </div>
      {saved && <div style={{ marginTop: 14, color: '#00b894', fontWeight: 600, fontSize: 'clamp(13px, 1.5vw, 14px)' }}>Preferences saved successfully.</div>}
    </div>
  );
};

const CookiePolicy = () => {
  const { darkMode } = useTheme();

  return (
    <div style={{ background: darkMode ? '#0f172a' : '#f8f9fa', minHeight: '100vh', padding: 'clamp(16px, 3vw, 24px) clamp(12px, 2vw, 24px)' }}>
      <Hero title="Cookie Policy & Preferences" subtitle="How we use cookies and how you can control them" darkMode={darkMode} />
      <div style={{ maxWidth: 1200, margin: '0 auto', background: darkMode ? '#1e293b' : '#fff', borderRadius: 16, padding: 'clamp(20px, 4vw, 32px)', boxShadow: darkMode ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.07)' }}>

        <Section title="1. What Are Cookies" darkMode={darkMode}>
          <p style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work efficiently, improve user experience, and provide information to website owners. Cookies may be set by TGS Tech Info ("first-party cookies") or by third-party services we use ("third-party cookies").</p>
        </Section>

        <Section title="2. Why We Use Cookies" darkMode={darkMode}>
          <p style={{ marginBottom: 10, fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>TGS Tech Info uses cookies and similar tracking technologies (including pixels, web beacons, and local storage) for the following purposes:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>To keep you securely logged in to your account</Li>
          <Li>To remember your preferences and settings</Li>
          <Li>To measure website traffic and content engagement</Li>
          <Li>To understand how visitors navigate our platform</Li>
          <Li>To improve website performance and functionality</Li>
          <Li>To deliver relevant B2B marketing communications</Li>
          <Li>To support lead generation and demand generation activities</Li>
          <Li>To integrate with CRM and marketing automation platforms</Li>
          <Li>To prevent fraud and ensure platform security</Li>
          <Li>To comply with legal and regulatory obligations</Li>
        </ul>
      </Section>

      <Section title="3. Types of Cookies We Use" darkMode={darkMode}>
        <p style={{ fontWeight: 700, marginBottom: 6, color: '#00b894', fontSize: 'clamp(14px, 1.6vw, 15px)' }}>Essential Cookies</p>
        <p style={{ marginBottom: 14, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>These cookies are strictly necessary for the website to function. They enable core features such as user authentication, session management, and security. You cannot opt out of essential cookies as the website cannot function without them.</p>

        <p style={{ fontWeight: 700, marginBottom: 6, color: '#6c5ce7', fontSize: 'clamp(14px, 1.6vw, 15px)' }}>Functional Cookies</p>
        <p style={{ marginBottom: 14, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>These cookies enable enhanced functionality and personalisation, such as remembering your language preference, display settings, and previously viewed content. Disabling these cookies may affect your experience.</p>

        <p style={{ fontWeight: 700, marginBottom: 6, color: '#4a7cff', fontSize: 'clamp(14px, 1.6vw, 15px)' }}>Analytics Cookies</p>
        <p style={{ marginBottom: 14, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>We use analytics cookies to collect anonymous information about how visitors use our website, including pages visited, time spent, referral sources, and content engagement. This data helps us improve our platform. Providers include Google Analytics and Microsoft Clarity.</p>

        <p style={{ fontWeight: 700, marginBottom: 6, color: '#e17055', fontSize: 'clamp(14px, 1.6vw, 15px)' }}>Marketing Cookies</p>
        <p style={{ marginBottom: 14, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>Marketing cookies are used to track visitors across websites and deliver targeted B2B advertising and content. They are placed by advertising networks including LinkedIn, Meta, and Google. These cookies build a profile of your interests and may be used to show relevant advertisements on other websites.</p>

        <p style={{ fontWeight: 700, marginBottom: 6, color: '#fdcb6e', fontSize: 'clamp(14px, 1.6vw, 15px)' }}>Performance Cookies</p>
        <p style={{ fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>Performance cookies collect information about how you use our website to help us improve its speed, reliability, and overall performance. Data collected is aggregated and anonymous.</p>
      </Section>

      <Section title="4. Third-Party Cookie Providers" darkMode={darkMode}>
        <p style={{ marginBottom: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>The following third-party services may set cookies on our website:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li><strong>Google Analytics</strong> - Website traffic and behaviour analysis</Li>
          <Li><strong>Google Tag Manager</strong> - Tag and tracking script management</Li>
          <Li><strong>LinkedIn Insight Tag</strong> - B2B audience analytics and ad conversion tracking</Li>
          <Li><strong>Meta Pixel (Facebook)</strong> - Advertising and retargeting</Li>
          <Li><strong>Microsoft Clarity</strong> - Session recording and heatmap analytics</Li>
          <Li><strong>HubSpot</strong> - CRM, marketing automation, and lead tracking</Li>
          <Li><strong>Hotjar</strong> - User behaviour analytics and feedback</Li>
        </ul>
        <p style={{ marginTop: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>Each provider operates under its own privacy policy. We encourage you to review their respective policies for further information.</p>
      </Section>

      <Section title="5. Cookie Retention Periods" darkMode={darkMode}>
        <p style={{ marginBottom: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>Cookie retention periods vary depending on their purpose:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Session cookies: deleted when you close your browser</Li>
          <Li>Authentication cookies: up to 7 days</Li>
          <Li>Preference cookies: up to 1 year</Li>
          <Li>Analytics cookies: up to 2 years</Li>
          <Li>Marketing cookies: up to 90 days to 2 years depending on provider</Li>
          <Li>Consent record cookies: 1 year</Li>
        </ul>
      </Section>

      <Section title="6. Cookie Table" darkMode={darkMode}>
        <p style={{ marginBottom: 8, fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>The following table lists the specific cookies used on our platform:</p>
        <CookieTable darkMode={darkMode} />
      </Section>

      <Section title="7. Your Cookie Preferences" darkMode={darkMode}>
        <p style={{ marginBottom: 16, fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>You can manage your cookie preferences at any time using the preference centre below. Please note that disabling certain cookies may affect the functionality of our website.</p>
        <CookiePreferences darkMode={darkMode} />
      </Section>

      <Section title="8. Browser Controls" darkMode={darkMode}>
        <p style={{ marginBottom: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>In addition to our preference centre, you can control cookies through your browser settings:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li><strong>Google Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies and other site data</Li>
          <Li><strong>Mozilla Firefox:</strong> Options &gt; Privacy and Security &gt; Cookies and Site Data</Li>
          <Li><strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</Li>
          <Li><strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions</Li>
        </ul>
        <p style={{ marginTop: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>You may also opt out of interest-based advertising through the Network Advertising Initiative or Your Online Choices.</p>
      </Section>

      <Section title="9. Consent and Withdrawal" darkMode={darkMode}>
        <p style={{ marginBottom: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>Where required by applicable law (including GDPR and ePrivacy Directive), we will request your consent before placing non-essential cookies on your device.</p>
        <p style={{ marginBottom: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>You may withdraw your consent at any time by:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Using the preference centre above</Li>
          <Li>Adjusting your browser settings</Li>
          <Li>Contacting us at <a href="mailto:privacy@tgstechinfo.com" style={{ color: '#4a7cff' }}>privacy@tgstechinfo.com</a></Li>
        </ul>
        <p style={{ marginTop: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>Withdrawal of consent does not affect the lawfulness of processing based on consent before its withdrawal.</p>
      </Section>

      <Section title="10. Updates to This Cookie Policy" darkMode={darkMode}>
        <p style={{ fontSize: 'clamp(14px, 1.5vw, 15.5px)' }}>We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our business practices. The "Last Updated" date at the top of this page indicates when the policy was last revised. We encourage you to review this page periodically.</p>
      </Section>

      <Section title="11. Contact Us" darkMode={darkMode}>
        <p style={{ marginBottom: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>For questions about our use of cookies, please contact:</p>
        <div style={{ padding: 'clamp(14px, 2.5vw, 20px) clamp(16px, 3vw, 24px)', background: darkMode ? 'rgba(74, 124, 255, 0.1)' : '#f0f4ff', borderRadius: 12, borderLeft: '4px solid #4a7cff' }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', fontSize: 'clamp(14px, 1.6vw, 15px)' }}>TGS Tech Info - Privacy Team</p>
          <p style={{ margin: '0 0 4px', color: darkMode ? '#cbd5e1' : '#374151', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>Email: <a href="mailto:privacy@tgstechinfo.com" style={{ color: '#4a7cff' }}>privacy@tgstechinfo.com</a></p>
          <p style={{ margin: 0, color: darkMode ? '#cbd5e1' : '#374151', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>Website: <a href="https://tgstechinfo.com" style={{ color: '#4a7cff' }}>https://tgstechinfo.com</a></p>
        </div>
      </Section>

    </div>
  </div>
  );
};

export default CookiePolicy;
