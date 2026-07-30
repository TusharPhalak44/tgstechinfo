import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const UPDATED = 'July 8, 2026';

const Section = ({ title, children, darkMode }) => (
  <div style={{ marginBottom: 'clamp(24px, 4vw, 32px)' }}>
    <h2 style={{ fontSize: 'clamp(16px, 2.2vw, 19px)', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 10, paddingBottom: 8, borderBottom: darkMode ? '2px solid #334155' : '2px solid #e8f0ff' }}>{title}</h2>
    <div style={{ fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151', lineHeight: 1.85 }}>{children}</div>
  </div>
);

const Li = ({ children }) => <li style={{ marginBottom: 6, paddingLeft: 4 }}>{children}</li>;

const TabBtn = ({ active, onClick, children, darkMode }) => (
  <button onClick={onClick} style={{
    padding: 'clamp(8px, 1.5vw, 10px) clamp(18px, 3vw, 24px)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 'clamp(13px, 1.5vw, 14px)',
    borderRadius: '10px 10px 0 0', transition: 'all .2s',
    background: active ? (darkMode ? '#1e293b' : '#fff') : (darkMode ? '#0f172a' : '#f0f4ff'),
    color: active ? (darkMode ? '#f1f5f9' : '#1a1a2e') : (darkMode ? '#94a3b8' : '#6b7280'),
    borderBottom: active ? '3px solid #00b894' : '3px solid transparent',
  }}>{children}</button>
);

const SecurityStatement = () => {
  const { darkMode } = useTheme();
  const [tab, setTab] = useState('security');

  return (
    <div style={{ background: darkMode ? '#0f172a' : '#f8f9fa', minHeight: '100vh', padding: 'clamp(16px, 3vw, 24px) clamp(12px, 2vw, 24px)' }}>
      {/* Hero */}
      <div style={{ maxWidth: 1200, margin: '0 auto clamp(16px, 3vw, 24px)', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', borderRadius: 16, padding: 'clamp(24px, 5vw, 40px) clamp(20px, 4vw, 32px)', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(11px, 1.3vw, 12px)', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>Security &amp; Data Retention</h1>
        <p style={{ fontSize: 'clamp(13px, 1.5vw, 14px)', color: '#94a3b8', margin: 0 }}>Security Statement &amp; Data Retention Policy | Last updated: {UPDATED}</p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 0, paddingLeft: 4 }}>
          <TabBtn active={tab === 'security'} onClick={() => setTab('security')} darkMode={darkMode}>🔒 Security Statement</TabBtn>
          <TabBtn active={tab === 'retention'} onClick={() => setTab('retention')} darkMode={darkMode}>📅 Data Retention Policy</TabBtn>
        </div>

        <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: '0 16px 16px 16px', padding: 'clamp(20px, 4vw, 32px)', boxShadow: darkMode ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.07)' }}>

          {tab === 'security' && (
            <>
              <p style={{ fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151', lineHeight: 1.85, marginBottom: 'clamp(24px, 4vw, 32px)' }}>
                TGS Tech Info takes the security of your personal information and our platform infrastructure seriously. This Security Statement describes the technical and organizational measures we implement to protect data against unauthorized access, disclosure, alteration, and destruction.
              </p>

              <Section title="1. Infrastructure Security" darkMode={darkMode}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
                  {[
                    { icon: '🔐', title: 'HTTPS / TLS Encryption', desc: 'All data in transit is encrypted using TLS 1.2+ protocols' },
                    { icon: '🛡️', title: 'Firewall Protection', desc: 'Web application firewalls (WAF) protect against common attack vectors' },
                    { icon: '☁️', title: 'Secure Cloud Hosting', desc: 'Hosted on enterprise-grade cloud infrastructure with physical security controls' },
                    { icon: '🔄', title: 'Regular Backups', desc: 'Automated encrypted backups with tested recovery procedures' },
                    { icon: '📊', title: 'Security Monitoring', desc: '24/7 monitoring for suspicious activity, intrusion attempts, and anomalies' },
                    { icon: '🌐', title: 'DDoS Protection', desc: 'Distributed denial-of-service mitigation at network and application layers' },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} style={{ padding: 'clamp(12px, 2vw, 14px) clamp(14px, 2vw, 16px)', background: darkMode ? '#0f172a' : '#f8faff', borderRadius: 10, border: darkMode ? '1px solid #334155' : '1px solid #e8f0ff' }}>
                      <div style={{ fontSize: 'clamp(18px, 2.5vw, 20px)', marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 4 }}>{title}</div>
                      <div style={{ fontSize: 'clamp(12px, 1.4vw, 12.5px)', color: darkMode ? '#94a3b8' : '#6b7280' }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="2. Application Security" darkMode={darkMode}>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li><strong>Authentication:</strong> JWT (JSON Web Token) based authentication with secure token expiry and rotation</Li>
                  <Li><strong>Password Security:</strong> Passwords are hashed using bcrypt with appropriate salt rounds - plaintext passwords are never stored</Li>
                  <Li><strong>Role-Based Access Control (RBAC):</strong> Least-privilege access model - users only access data and functions required for their role</Li>
                  <Li><strong>Input Validation:</strong> All user inputs are validated and sanitized server-side to prevent injection attacks</Li>
                  <Li><strong>API Rate Limiting:</strong> Rate limiting applied to all API endpoints to prevent abuse and brute-force attacks</Li>
                  <Li><strong>CSRF Protection:</strong> Cross-Site Request Forgery protection on all state-changing operations</Li>
                  <Li><strong>XSS Prevention:</strong> Content Security Policy (CSP) headers and output encoding to prevent cross-site scripting</Li>
                  <Li><strong>SQL Injection Prevention:</strong> Parameterized queries and ORM-based database access</Li>
                  <Li><strong>File Upload Security:</strong> Uploaded files are scanned and validated for type, size, and malicious content</Li>
                  <Li><strong>Audit Logging:</strong> Comprehensive audit logs of administrative actions and security events</Li>
                </ul>
              </Section>

              <Section title="3. Data Encryption" darkMode={darkMode}>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li><strong>In Transit:</strong> All data transmitted between your browser and our servers is encrypted using TLS 1.2 or higher</Li>
                  <Li><strong>At Rest:</strong> Sensitive data stored in our databases is encrypted at rest using AES-256 encryption</Li>
                  <Li><strong>Passwords:</strong> Hashed using bcrypt - never stored in plaintext</Li>
                  <Li><strong>API Keys:</strong> Stored as hashed values - never exposed in logs or responses</Li>
                </ul>
              </Section>

              <Section title="4. Access Controls" darkMode={darkMode}>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>Access to production systems is restricted to authorized personnel only</Li>
                  <Li>Multi-factor authentication (MFA) required for administrative access</Li>
                  <Li>Regular access reviews and privilege audits</Li>
                  <Li>Immediate access revocation upon employee departure</Li>
                  <Li>Vendor and third-party access governed by contractual security requirements</Li>
                </ul>
              </Section>

              <Section title="5. Employee and Organizational Security" darkMode={darkMode}>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>Security awareness training for all employees handling personal data</Li>
                  <Li>Background checks for employees with access to sensitive systems</Li>
                  <Li>Confidentiality agreements and data handling policies</Li>
                  <Li>Documented security policies and procedures</Li>
                  <Li>Regular security reviews and risk assessments</Li>
                </ul>
              </Section>

              <Section title="6. Incident Response" darkMode={darkMode}>
                <p style={{ marginBottom: 12, color: darkMode ? '#cbd5e1' : '#374151' }}>In the event of a security incident or data breach, TGS Tech Info will:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>Contain and investigate the incident promptly</Li>
                  <Li>Notify affected users without undue delay where required by law</Li>
                  <Li>Report to relevant supervisory authorities within 72 hours where required under GDPR</Li>
                  <Li>Take remedial action to prevent recurrence</Li>
                  <Li>Maintain an incident log for compliance and audit purposes</Li>
                </ul>
              </Section>

              <Section title="7. Third-Party Security" darkMode={darkMode}>
                <p style={{ marginBottom: 12, color: darkMode ? '#cbd5e1' : '#374151' }}>All third-party service providers and sub-processors are required to:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>Maintain appropriate technical and organizational security measures</Li>
                  <Li>Process data only as instructed and for authorized purposes</Li>
                  <Li>Notify us promptly of any security incidents affecting our data</Li>
                  <Li>Comply with applicable data protection laws</Li>
                </ul>
              </Section>

              <Section title="8. Vulnerability Disclosure" darkMode={darkMode}>
                <p style={{ marginBottom: 12, color: darkMode ? '#cbd5e1' : '#374151' }}>If you discover a security vulnerability in our platform, please report it responsibly:</p>
                <div style={{ padding: 'clamp(14px, 2.5vw, 16px) clamp(16px, 3vw, 20px)', background: darkMode ? 'rgba(0, 184, 148, 0.1)' : '#e8faf5', borderRadius: 12, borderLeft: '4px solid #00b894' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>Security Team - TGS Tech Info</p>
                  <p style={{ margin: '0 0 4px', color: darkMode ? '#cbd5e1' : '#374151', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>Email: <a href="mailto:security@tgstechinfo.com" style={{ color: '#00b894' }}>security@tgstechinfo.com</a></p>
                  <p style={{ margin: 0, fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#94a3b8' : '#6b7280' }}>Please do not publicly disclose vulnerabilities before we have had the opportunity to investigate and remediate.</p>
                </div>
              </Section>

              <Section title="9. Limitations" darkMode={darkMode}>
                <p style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>While we implement industry-standard security measures, no system is completely immune to security threats. We cannot guarantee absolute security of data transmitted over the internet. We encourage users to use strong, unique passwords and to report any suspicious activity immediately.</p>
              </Section>
            </>
          )}

          {tab === 'retention' && (
            <>
              <p style={{ fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151', lineHeight: 1.85, marginBottom: 'clamp(24px, 4vw, 32px)' }}>
                TGS Tech Info retains personal data only for as long as necessary to fulfill the purposes for which it was collected, comply with legal obligations, resolve disputes, and enforce our agreements. This Data Retention Policy describes our retention practices for different categories of data.
              </p>

              <Section title="1. Retention Principles" darkMode={darkMode}>
                <p style={{ marginBottom: 12, color: darkMode ? '#cbd5e1' : '#374151' }}>Our data retention practices are guided by the following principles:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li><strong>Purpose Limitation:</strong> Data is retained only as long as needed for its original purpose</Li>
                  <Li><strong>Minimization:</strong> We do not retain more data than necessary</Li>
                  <Li><strong>Legal Compliance:</strong> Retention periods comply with applicable laws and regulations</Li>
                  <Li><strong>Security:</strong> Data is securely deleted or anonymized when no longer needed</Li>
                </ul>
              </Section>

              <Section title="2. Retention Schedule" darkMode={darkMode}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(12px, 1.4vw, 13px)' }}>
                    <thead>
                      <tr style={{ background: darkMode ? '#1e293b' : '#f0f4ff' }}>
                        {['Data Category', 'Retention Period', 'Basis'].map(h => (
                          <th key={h} style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px)', textAlign: 'left', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', borderBottom: darkMode ? '2px solid #334155' : '2px solid #dde2ee', fontSize: 'clamp(12px, 1.4vw, 13px)' }}>{h}</th>
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
                        <tr key={i} style={{ background: i % 2 === 0 ? (darkMode ? '#0f172a' : '#fff') : (darkMode ? '#1e293b' : '#fafbff') }}>
                          <td style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px)', fontWeight: 600, borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#f1f5f9' : '#1a1a2e' }}>{cat}</td>
                          <td style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px)', color: darkMode ? '#cbd5e1' : '#374151', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', fontSize: 'clamp(12px, 1.4vw, 13px)' }}>{period}</td>
                          <td style={{ padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px)', color: darkMode ? '#94a3b8' : '#6b7280', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', fontSize: 'clamp(11px, 1.3vw, 12px)' }}>{basis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="3. Deletion and Anonymization" darkMode={darkMode}>
                <p style={{ marginBottom: 12, color: darkMode ? '#cbd5e1' : '#374151' }}>When data reaches the end of its retention period, we will:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>Securely delete personal data from active systems and backups</Li>
                  <Li>Anonymize data where deletion is not technically feasible (e.g., aggregated analytics)</Li>
                  <Li>Ensure third-party processors delete data in accordance with their contractual obligations</Li>
                </ul>
              </Section>

              <Section title="4. Legal Hold" darkMode={darkMode}>
                <p style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>Where data is subject to a legal hold, litigation, regulatory investigation, or audit, we may retain data beyond the standard retention period until the matter is resolved.</p>
              </Section>

              <Section title="5. User-Initiated Deletion" darkMode={darkMode}>
                <p style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>You may request deletion of your personal data at any time by submitting a <a href="/data-requests" style={{ color: '#4a7cff' }}>Data Subject Request</a>. We will process deletion requests within the legally required timeframe, subject to any legal hold or statutory retention obligations.</p>
              </Section>

              <Section title="6. Contact" darkMode={darkMode}>
                <div style={{ padding: 'clamp(14px, 2.5vw, 16px) clamp(16px, 3vw, 20px)', background: darkMode ? 'rgba(74, 124, 255, 0.1)' : '#f0f4ff', borderRadius: 12, borderLeft: '4px solid #4a7cff' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>TGS Tech Info - Privacy Team</p>
                  <p style={{ margin: '0 0 4px', color: darkMode ? '#cbd5e1' : '#374151', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>Email: <a href="mailto:privacy@tgstechinfo.com" style={{ color: '#4a7cff' }}>privacy@tgstechinfo.com</a></p>
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
