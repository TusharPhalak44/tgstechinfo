import React from 'react';
import { useTheme } from '../context/ThemeContext';

const UPDATED = 'July 8, 2026';

const Section = ({ title, children, darkMode }) => (
  <div style={{ marginBottom: 'clamp(24px, 4vw, 32px)' }}>
    <h2 style={{ fontSize: 'clamp(16px, 2.2vw, 19px)', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 10, paddingBottom: 8, borderBottom: darkMode ? '2px solid #334155' : '2px solid #e8f0ff' }}>{title}</h2>
    <div style={{ fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151', lineHeight: 1.85 }}>{children}</div>
  </div>
);

const Li = ({ children }) => <li style={{ marginBottom: 6, paddingLeft: 4 }}>{children}</li>;

const StatusBadge = ({ status, darkMode }) => {
  const colors = { 'Fully Compliant': '#00b894', 'Partially Compliant': '#fdcb6e', 'Non-Compliant': '#e17055' };
  const color = colors[status] || '#6b7280';
  return (
    <span style={{ background: darkMode ? `${color}33` : `${color}18`, color, fontSize: 'clamp(11px, 1.3vw, 12px)', fontWeight: 700, padding: 'clamp(3px, 0.5vw, 4px) clamp(10px, 2vw, 12px)', borderRadius: 20, border: `1px solid ${color}33` }}>{status}</span>
  );
};

const AccessibilityStatement = () => {
  const { darkMode } = useTheme();

  return (
    <div style={{ background: darkMode ? '#0f172a' : '#f8f9fa', minHeight: '100vh', padding: 'clamp(16px, 3vw, 24px) clamp(12px, 2vw, 24px)' }}>
      {/* Hero */}
      <div style={{ maxWidth: 1200, margin: '0 auto clamp(16px, 3vw, 24px)', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', borderRadius: 16, padding: 'clamp(24px, 5vw, 40px) clamp(20px, 4vw, 32px)', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(11px, 1.3vw, 12px)', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>Accessibility Statement</h1>
        <p style={{ fontSize: 'clamp(13px, 1.5vw, 14px)', color: '#94a3b8', margin: '0 0 16px' }}>Last updated: {UPDATED}</p>
        <StatusBadge status="Partially Compliant" darkMode={darkMode} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', background: darkMode ? '#1e293b' : '#fff', borderRadius: 16, padding: 'clamp(20px, 4vw, 32px)', boxShadow: darkMode ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.07)' }}>

      <p style={{ fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151', lineHeight: 1.85, marginBottom: 'clamp(24px, 4vw, 32px)' }}>
        TGS Tech Info is committed to ensuring that <strong>tgstechinfo.com</strong> is accessible to all users, including people with disabilities. We are actively working to improve the accessibility of our platform in accordance with the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong> and applicable accessibility laws.
      </p>

      <Section title="1. Our Commitment" darkMode={darkMode}>
        <p style={{ marginBottom: 12, color: darkMode ? '#cbd5e1' : '#374151' }}>We believe that everyone deserves equal access to information. Our accessibility efforts include:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Designing and developing our platform with accessibility in mind</Li>
          <Li>Conducting periodic accessibility audits and testing</Li>
          <Li>Training our team on accessible content creation</Li>
          <Li>Responding promptly to accessibility feedback and complaints</Li>
          <Li>Continuously improving our platform based on user feedback</Li>
        </ul>
      </Section>

      <Section title="2. Conformance Status" darkMode={darkMode}>
        <p style={{ marginBottom: 16, fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>TGS Tech Info is <strong>partially conformant</strong> with WCAG 2.1 Level AA. Partial conformance means that some parts of the content do not fully conform to the accessibility standard.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(12px, 1.4vw, 13px)' }}>
            <thead>
              <tr style={{ background: darkMode ? '#1e293b' : '#f0f4ff' }}>
                {['Feature', 'Status', 'Notes'].map(h => (
                  <th key={h} style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px)', textAlign: 'left', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', borderBottom: darkMode ? '2px solid #334155' : '2px solid #dde2ee', fontSize: 'clamp(12px, 1.4vw, 13px)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Keyboard Navigation', 'Fully Compliant', 'All interactive elements are keyboard accessible'],
                ['Screen Reader Support', 'Partially Compliant', 'ARIA labels in progress for all components'],
                ['Color Contrast', 'Fully Compliant', 'Meets WCAG 2.1 AA contrast ratios'],
                ['Alt Text for Images', 'Partially Compliant', 'Being added to all images progressively'],
                ['Form Labels', 'Fully Compliant', 'All form fields have associated labels'],
                ['Video Captions', 'Partially Compliant', 'Captions being added to webinar recordings'],
                ['Responsive Design', 'Fully Compliant', 'Accessible on all screen sizes and devices'],
                ['Focus Indicators', 'Fully Compliant', 'Visible focus indicators on all interactive elements'],
                ['Skip Navigation', 'Partially Compliant', 'Skip links being implemented'],
                ['PDF Accessibility', 'Partially Compliant', 'Downloadable PDFs being updated for accessibility'],
              ].map(([feature, status, notes], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? (darkMode ? '#0f172a' : '#fff') : (darkMode ? '#1e293b' : '#fafbff') }}>
                  <td style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px)', fontWeight: 600, borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#f1f5f9' : '#1a1a2e' }}>{feature}</td>
                  <td style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px)', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0' }}><StatusBadge status={status} darkMode={darkMode} /></td>
                  <td style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px)', color: darkMode ? '#94a3b8' : '#6b7280', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', fontSize: 'clamp(11px, 1.3vw, 12px)' }}>{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="3. Known Limitations" darkMode={darkMode}>
        <p style={{ marginBottom: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>We are aware of the following accessibility limitations and are actively working to address them:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Some older PDF documents may not be fully accessible to screen readers - we are updating these progressively</Li>
          <Li>Some third-party embedded content (webinar players, social media widgets) may not meet full WCAG 2.1 AA compliance</Li>
          <Li>Some complex data tables may require additional ARIA markup</Li>
          <Li>Some video content may lack full captions or audio descriptions</Li>
        </ul>
      </Section>

      <Section title="4. Assistive Technologies Supported" darkMode={darkMode}>
        <p style={{ marginBottom: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>Our website has been tested with the following assistive technologies:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>NVDA (NonVisual Desktop Access) with Chrome and Firefox</Li>
          <Li>JAWS (Job Access With Speech) with Chrome</Li>
          <Li>VoiceOver on macOS and iOS with Safari</Li>
          <Li>TalkBack on Android with Chrome</Li>
          <Li>Windows High Contrast Mode</Li>
          <Li>Zoom and browser text scaling up to 200%</Li>
        </ul>
      </Section>

      <Section title="5. Applicable Standards and Laws" darkMode={darkMode}>
        <p style={{ marginBottom: 12, fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>We aim to comply with the following accessibility standards and regulations:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li><strong>WCAG 2.1 Level AA</strong> - Web Content Accessibility Guidelines</Li>
          <Li><strong>ADA</strong> - Americans with Disabilities Act (Title III)</Li>
          <Li><strong>Section 508</strong> - Rehabilitation Act (US Federal)</Li>
          <Li><strong>EN 301 549</strong> - European accessibility standard</Li>
          <Li><strong>Equality Act 2010</strong> - United Kingdom</Li>
        </ul>
      </Section>

      <Section title="6. Feedback and Contact" darkMode={darkMode}>
        <p style={{ marginBottom: 16, fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>We welcome your feedback on the accessibility of tgstechinfo.com. If you experience any accessibility barriers or have suggestions for improvement, please contact us:</p>
        <div style={{ padding: 'clamp(16px, 3vw, 20px) clamp(18px, 3vw, 24px)', background: darkMode ? 'rgba(74, 124, 255, 0.1)' : '#f0f4ff', borderRadius: 12, borderLeft: '4px solid #4a7cff', marginBottom: 16 }}>
          <p style={{ margin: '0 0 6px', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>TGS Tech Info - Accessibility Team</p>
          <p style={{ margin: '0 0 4px', color: darkMode ? '#cbd5e1' : '#374151', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>Email: <a href="mailto:accessibility@tgstechinfo.com" style={{ color: '#4a7cff' }}>accessibility@tgstechinfo.com</a></p>
          <p style={{ margin: 0, color: darkMode ? '#cbd5e1' : '#374151', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>Website: <a href="https://tgstechinfo.com" style={{ color: '#4a7cff' }}>https://tgstechinfo.com</a></p>
        </div>
        <p style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>We aim to respond to accessibility feedback within <strong>5 business days</strong>.</p>
      </Section>

      <Section title="7. Enforcement Procedure" darkMode={darkMode}>
        <p style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>If you are not satisfied with our response to your accessibility complaint, you may contact the relevant enforcement body in your jurisdiction:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li><strong>US:</strong> US Department of Justice - ADA National Network</Li>
          <Li><strong>UK:</strong> Equality and Human Rights Commission (EHRC)</Li>
          <Li><strong>EU:</strong> Your national accessibility enforcement authority</Li>
        </ul>
      </Section>

    </div>
  </div>
  );
};

export default AccessibilityStatement;
