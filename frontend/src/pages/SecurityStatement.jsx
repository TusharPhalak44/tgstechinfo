import React, { useState } from 'react';

const UPDATED = 'July 8, 2026';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid #e8f0ff' }}>{title}</h2>
    <div style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.85 }}>{children}</div>
  </div>
);

const Li = ({ children }) => <li style={{ marginBottom: 6, paddingLeft: 4 }}>{children}</li>;

const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    padding: '10px 24px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
    borderRadius: '10px 10px 0 0', transition: 'all .2s',
    background: active ? '#fff' : '#f0f4ff',
    color: active ? '#1a1a2e' : '#6b7280',
    borderBottom: active ? '3px solid #00b894' : '3px solid transparent',
  }}>{children}</button>
);

const SecurityStatement = () => {
  const [tab, setTab] = useState('security');

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '40px 16px' }}>
      {/* Hero */}
      <div style={{ maxWidth: 900, margin: '0 auto 40px', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', borderRadius: 16, padding: '48px 40px', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>Security &amp; Data Retention</h1>
        <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Security Statement &amp; Data Retention Policy | Last updated: {UPDATED}</p>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 0, paddingLeft: 4 }}>
          <TabBtn active={tab === 'security'} onClick={() => setTab('security')}>🔒 Security Statement</TabBtn>
          <TabBtn active={tab === 'retention'} onClick={() => setTab('retention')}>📅 Data Retention Policy</TabBtn>
        </div>

        <div style={{ background: '#fff', borderRadius: '0 16px 16px 16px', padding: '48px 48px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>

          {tab === 'security' && (
            <>
              <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.85, marginBottom: 36 }}>
                TGS Tech Info takes the security of your personal information and our platform infrastructure seriously. This Security Statement describes the technical and organizational measures we implement to protect data against unauthorized access, disclosure, alteration, and destruction.
              </p>

              <Section title="1. Infrastructure Security">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 16 }}>
                  {[
                    { icon: '🔐', title: 'HTTPS / TLS Encryption', desc: 'All data in transit is encrypted using TLS 1.2+ protocols' },
                    { icon: '🛡️', title: 'Firewall Protection', desc: 'Web application firewalls (WAF) protect against common attack vectors' },
                    { icon: '☁️', title: 'Secure Cloud Hosting', desc: 'Hosted on enterprise-grade cloud infrastructure with physical security controls' },
                    { icon: '🔄', title: 'Regular Backups', desc: 'Automated encrypted backups with tested recovery procedures' },
                    { icon: '📊', title: 'Security Monitoring', desc: '24/7 monitoring for suspicious activity, intrusion attempts, and anomalies' },
                    { icon: '🌐', title: 'DDoS Protection', desc: 'Distributed denial-of-service mitigation at network and application layers' },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} style={{ padding: '14px 16px', background: '#f8faff', borderRadius: 10, border: '1px solid #e8f0ff' }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e', marginBottom: 4 }}>{title}</div>
                      <div style={{ fontSize: 12.5, color: '#6b7280' }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="2. Application Security">
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li><strong>Authentication:</strong> JWT (JSON Web Token) based authentication with secure token expiry and rotation</Li>
                  <Li><strong>Password Security:</strong> Passwords are hashed using bcrypt with appropriate salt rounds — plaintext passwords are never stored</Li>
                  <Li><strong>Role-Based Access Control (RBAC):</strong> Least-privilege access model — users only access data and functions required for their role</Li>
                  <Li><strong>Input Validation:</strong> All user inputs are validated and sanitized server-side to prevent injection attacks</Li>
                  <Li><strong>API Rate Limiting:</strong> Rate limiting applied to all API endpoints to prevent abuse and brute-force attacks</Li>
                  <Li><strong>CSRF Protection:</strong> Cross-Site Request Forgery protection on all state-changing operations</Li>
                  <Li><strong>XSS Prevention:</strong> Content Security Policy (CSP) headers and output encoding to prevent cross-site scripting</Li>
                  <Li><strong>SQL Injection Prevention:</strong> Parameterized queries and ORM-based database access</Li>
                  <Li><strong>File Upload Security:</strong> Uploaded files are scanned and validated for type, size, and malicious content</Li>
                  <Li><strong>Audit Logging:</strong> Comprehensive audit logs of administrative actions and security events</Li>
                </ul>
              </Section>

              <Section title="3. Data Encryption">
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li><strong>In Transit:</strong> All data transmitted between your browser and our servers is encrypted using TLS 1.2 or higher</Li>
                  <Li><strong>At Rest:</strong> Sensitive data stored in our databases is encrypted at rest using AES-256 encryption</Li>
                  <Li><strong>Passwords:</strong> Hashed using bcrypt — never stored in plaintext</Li>
                  <Li><strong>API Keys:</strong> Stored as hashed values — never exposed in logs or responses</Li>
                </ul>
              </Section>

              <Section title="4. Access Controls">
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>Access to production systems is restricted to authorized personnel only</Li>
                  <Li>Multi-factor authentication (MFA) required for administrative access</Li>
                  <Li>Regular access reviews and privilege audits</Li>
                  <Li>Immediate access revocation upon employee departure</Li>
                  <Li>Vendor and third-party access governed by contractual security requirements</Li>
                </ul>
              </Section>

              <Section title="5. Employee and Organizational Security">
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>Security awareness training for all employees handling personal data</Li>
                  <Li>Background checks for employees with access to sensitive systems</Li>
                  <Li>Confidentiality agreements and data handling policies</Li>
                  <Li>Documented security policies and procedures</Li>
                  <Li>Regular security reviews and risk assessments</Li>
                </ul>
              </Section>

              <Section title="6. Incident Response">
                <p style={{ marginBottom: 12 }}>In the event of a security incident or data breach, TGS Tech Info will:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>Contain and investigate the incident promptly</Li>
                  <Li>Notify affected users without undue delay where required by law</Li>
                  <Li>Report to relevant supervisory authorities within 72 hours where required under GDPR</Li>
                  <Li>Take remedial action to prevent recurrence</Li>
                  <Li>Maintain an incident log for compliance and audit purposes</Li>
                </ul>
              </Section>

              <Section title="7. Third-Party Security">
                <p style={{ marginBottom: 12 }}>All third-party service providers and sub-processors are required to:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>Maintain appropriate technical and organizational security measures</Li>
                  <Li>Process data only as instructed and for authorized purposes</Li>
                  <Li>Notify us promptly of any security incidents affecting our data</Li>
                  <Li>Comply with applicable data protection laws</Li>
                </ul>
              </Section>

              <Section title="8. Vulnerability Disclosure">
                <p style={{ marginBottom: 12 }}>If you discover a security vulnerability in our platform, please report it responsibly:</p>
                <div style={{ padding: '16px 20px', background: '#e8faf5', borderRadius: 12, borderLeft: '4px solid #00b894' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#1a1a2e' }}>Security Team — TGS Tech Info</p>
                  <p style={{ margin: '0 0 4px', color: '#374151' }}>Email: <a href="mailto:security@tgstechinfo.com" style={{ color: '#00b894' }}>security@tgstechinfo.com</a></p>
                  <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Please do not publicly disclose vulnerabilities before we have had the opportunity to investigate and remediate.</p>
                </div>
              </Section>

              <Section title="9. Limitations">
                <p>While we implement industry-standard security measures, no system is completely immune to security threats. We cannot guarantee absolute security of data transmitted over the internet. We encourage users to use strong, unique passwords and to report any suspicious activity immediately.</p>
              </Section>
            </>
          )}

          {tab === 'retention' && (
            <>
              <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.85, marginBottom: 36 }}>
                TGS Tech Info retains personal data only for as long as necessary to fulfill the purposes for which it was collected, comply with legal obligations, resolve disputes, and enforce our agreements. This Data Retention Policy describes our retention practices for different categories of data.
              </p>

              <Section title="1. Retention Principles">
                <p style={{ marginBottom: 12 }}>Our data retention practices are guided by the following principles:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li><strong>Purpose Limitation:</strong> Data is retained only as long as needed for its original purpose</Li>
                  <Li><strong>Minimization:</strong> We do not retain more data than necessary</Li>
                  <Li><strong>Legal Compliance:</strong> Retention periods comply with applicable laws and regulations</Li>
                  <Li><strong>Security:</strong> Data is securely deleted or anonymized when no longer needed</Li>
                </ul>
              </Section>

              <Section title="2. Retention Schedule">
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f0f4ff' }}>
                        {['Data Category', 'Retention Period', 'Basis'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#1a1a2e', borderBottom: '2px solid #dde2ee' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['User Account Data', 'Until account deletion + 30 days', 'Contract / User Request'],
                        ['Published Content', 'Indefinitely (unless removal requested)', 'Legitimate Interest'],
                        ['Marketing Contacts', '24 months after last interaction', 'Consent / Legitimate Interest'],
                        ['Newsletter Subscriptions', 'Until unsubscribe + 30 days', 'Consent'],
                        ['Gated Content Form Data', '24 months after submission', 'Legitimate Interest'],
                        ['Lead Generation Data', '24 months after last engagement', 'Legitimate Interest'],
                        ['Contact Form Enquiries', '12 months after resolution', 'Legitimate Interest'],
                        ['Website Analytics Logs', '26 months', 'Legitimate Interest'],
                        ['Server / Access Logs', '12 months', 'Security / Legal Obligation'],
                        ['Security Audit Logs', '24 months', 'Legal Obligation / Security'],
                        ['Cookie Consent Records', '1 year from consent date', 'Legal Obligation (GDPR)'],
                        ['Job Applications', '6 months (unsuccessful) / 24 months (with consent)', 'Consent / Legal Obligation'],
                        ['Financial / Invoice Records', '7 years', 'Legal Obligation (Tax Law)'],
                        ['Customer Contracts', 'Contract duration + 7 years', 'Legal Obligation'],
                        ['DSAR / Privacy Requests', '3 years from request date', 'Legal Obligation'],
                        ['Incident Response Records', '5 years', 'Legal Obligation'],
                        ['Webinar Registrations', '24 months after event', 'Legitimate Interest'],
                        ['Download History', '24 months', 'Analytics / Legitimate Interest'],
                        ['Email Engagement Data', '24 months after last interaction', 'Legitimate Interest'],
                        ['Cookies (session)', 'Deleted on browser close', 'Essential'],
                        ['Cookies (persistent)', 'Per cookie lifespan (see Cookie Policy)', 'Consent / Legitimate Interest'],
                      ].map(([cat, period, basis], i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbff' }}>
                          <td style={{ padding: '9px 12px', fontWeight: 600, borderBottom: '1px solid #f0f0f0' }}>{cat}</td>
                          <td style={{ padding: '9px 12px', color: '#374151', borderBottom: '1px solid #f0f0f0' }}>{period}</td>
                          <td style={{ padding: '9px 12px', color: '#6b7280', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>{basis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="3. Deletion and Anonymization">
                <p style={{ marginBottom: 12 }}>When data reaches the end of its retention period, we will:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>Securely delete personal data from active systems and backups</Li>
                  <Li>Anonymize data where deletion is not technically feasible (e.g., aggregated analytics)</Li>
                  <Li>Ensure third-party processors delete data in accordance with their contractual obligations</Li>
                </ul>
              </Section>

              <Section title="4. Legal Hold">
                <p>Where data is subject to a legal hold, litigation, regulatory investigation, or audit, we may retain data beyond the standard retention period until the matter is resolved.</p>
              </Section>

              <Section title="5. User-Initiated Deletion">
                <p>You may request deletion of your personal data at any time by submitting a <a href="/data-requests" style={{ color: '#4a7cff' }}>Data Subject Request</a>. We will process deletion requests within the legally required timeframe, subject to any legal hold or statutory retention obligations.</p>
              </Section>

              <Section title="6. Contact">
                <div style={{ padding: '16px 20px', background: '#f0f4ff', borderRadius: 12, borderLeft: '4px solid #4a7cff' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#1a1a2e' }}>TGS Tech Info — Privacy Team</p>
                  <p style={{ margin: '0 0 4px', color: '#374151' }}>Email: <a href="mailto:privacy@tgstechinfo.com" style={{ color: '#4a7cff' }}>privacy@tgstechinfo.com</a></p>
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityStatement;
