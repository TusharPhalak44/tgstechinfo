import React from 'react';

const UPDATED = 'July 8, 2026';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid #e8f0ff' }}>{title}</h2>
    <div style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.85 }}>{children}</div>
  </div>
);

const Li = ({ children }) => <li style={{ marginBottom: 6, paddingLeft: 4 }}>{children}</li>;

const StatusBadge = ({ status }) => {
  const colors = { 'Fully Compliant': '#00b894', 'Partially Compliant': '#fdcb6e', 'Non-Compliant': '#e17055' };
  const color = colors[status] || '#6b7280';
  return (
    <span style={{ background: `${color}18`, color, fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20, border: `1px solid ${color}33` }}>{status}</span>
  );
};

const AccessibilityStatement = () => (
  <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '40px 16px' }}>
    {/* Hero */}
    <div style={{ maxWidth: 860, margin: '0 auto 40px', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', borderRadius: 16, padding: '48px 40px', color: '#fff', textAlign: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Legal</div>
      <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>Accessibility Statement</h1>
      <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 16px' }}>Last updated: {UPDATED}</p>
      <StatusBadge status="Partially Compliant" />
    </div>

    <div style={{ maxWidth: 860, margin: '0 auto', background: '#fff', borderRadius: 16, padding: '48px 48px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>

      <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.85, marginBottom: 36 }}>
        TGS Tech Info is committed to ensuring that <strong>tgstechinfo.com</strong> is accessible to all users, including people with disabilities. We are actively working to improve the accessibility of our platform in accordance with the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong> and applicable accessibility laws.
      </p>

      <Section title="1. Our Commitment">
        <p style={{ marginBottom: 12 }}>We believe that everyone deserves equal access to information. Our accessibility efforts include:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Designing and developing our platform with accessibility in mind</Li>
          <Li>Conducting periodic accessibility audits and testing</Li>
          <Li>Training our team on accessible content creation</Li>
          <Li>Responding promptly to accessibility feedback and complaints</Li>
          <Li>Continuously improving our platform based on user feedback</Li>
        </ul>
      </Section>

      <Section title="2. Conformance Status">
        <p style={{ marginBottom: 16 }}>TGS Tech Info is <strong>partially conformant</strong> with WCAG 2.1 Level AA. Partial conformance means that some parts of the content do not fully conform to the accessibility standard.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f0f4ff' }}>
                {['Feature', 'Status', 'Notes'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#1a1a2e', borderBottom: '2px solid #dde2ee' }}>{h}</th>
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
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbff' }}>
                  <td style={{ padding: '9px 12px', fontWeight: 600, borderBottom: '1px solid #f0f0f0' }}>{feature}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid #f0f0f0' }}><StatusBadge status={status} /></td>
                  <td style={{ padding: '9px 12px', color: '#6b7280', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="3. Known Limitations">
        <p style={{ marginBottom: 12 }}>We are aware of the following accessibility limitations and are actively working to address them:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Some older PDF documents may not be fully accessible to screen readers — we are updating these progressively</Li>
          <Li>Some third-party embedded content (webinar players, social media widgets) may not meet full WCAG 2.1 AA compliance</Li>
          <Li>Some complex data tables may require additional ARIA markup</Li>
          <Li>Some video content may lack full captions or audio descriptions</Li>
        </ul>
      </Section>

      <Section title="4. Assistive Technologies Supported">
        <p style={{ marginBottom: 12 }}>Our website has been tested with the following assistive technologies:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>NVDA (NonVisual Desktop Access) with Chrome and Firefox</Li>
          <Li>JAWS (Job Access With Speech) with Chrome</Li>
          <Li>VoiceOver on macOS and iOS with Safari</Li>
          <Li>TalkBack on Android with Chrome</Li>
          <Li>Windows High Contrast Mode</Li>
          <Li>Zoom and browser text scaling up to 200%</Li>
        </ul>
      </Section>

      <Section title="5. Applicable Standards and Laws">
        <p style={{ marginBottom: 12 }}>We aim to comply with the following accessibility standards and regulations:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li><strong>WCAG 2.1 Level AA</strong> — Web Content Accessibility Guidelines</Li>
          <Li><strong>ADA</strong> — Americans with Disabilities Act (Title III)</Li>
          <Li><strong>Section 508</strong> — Rehabilitation Act (US Federal)</Li>
          <Li><strong>EN 301 549</strong> — European accessibility standard</Li>
          <Li><strong>Equality Act 2010</strong> — United Kingdom</Li>
        </ul>
      </Section>

      <Section title="6. Feedback and Contact">
        <p style={{ marginBottom: 16 }}>We welcome your feedback on the accessibility of tgstechinfo.com. If you experience any accessibility barriers or have suggestions for improvement, please contact us:</p>
        <div style={{ padding: '20px 24px', background: '#f0f4ff', borderRadius: 12, borderLeft: '4px solid #4a7cff', marginBottom: 16 }}>
          <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#1a1a2e' }}>TGS Tech Info — Accessibility Team</p>
          <p style={{ margin: '0 0 4px', color: '#374151' }}>Email: <a href="mailto:accessibility@tgstechinfo.com" style={{ color: '#4a7cff' }}>accessibility@tgstechinfo.com</a></p>
          <p style={{ margin: 0, color: '#374151' }}>Website: <a href="https://tgstechinfo.com" style={{ color: '#4a7cff' }}>https://tgstechinfo.com</a></p>
        </div>
        <p>We aim to respond to accessibility feedback within <strong>5 business days</strong>.</p>
      </Section>

      <Section title="7. Enforcement Procedure">
        <p>If you are not satisfied with our response to your accessibility complaint, you may contact the relevant enforcement body in your jurisdiction:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li><strong>US:</strong> US Department of Justice — ADA National Network</Li>
          <Li><strong>UK:</strong> Equality and Human Rights Commission (EHRC)</Li>
          <Li><strong>EU:</strong> Your national accessibility enforcement authority</Li>
        </ul>
      </Section>

    </div>
  </div>
);

export default AccessibilityStatement;
