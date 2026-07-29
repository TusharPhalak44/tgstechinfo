import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const UPDATED = 'July 8, 2026';

const getInputStyle = (darkMode) => ({
  width: '100%', padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 14px)', border: darkMode ? '1px solid #334155' : '1px solid #dde2ee', borderRadius: 8,
  fontSize: 'clamp(13px, 1.5vw, 14px)', color: darkMode ? '#f1f5f9' : '#1a1a2e', outline: 'none', background: darkMode ? '#0f172a' : '#fff', boxSizing: 'border-box',
});

const Field = ({ label, required, children, darkMode }) => (
  <div style={{ marginBottom: 'clamp(16px, 2.5vw, 20px)' }}>
    <label style={{ display: 'block', fontWeight: 600, fontSize: 'clamp(12px, 1.4vw, 13.5px)', color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 6 }}>
      {label} {required && <span style={{ color: '#e17055' }}>*</span>}
    </label>
    {children}
  </div>
);

const ContactPrivacyOfficer = () => {
  const { darkMode } = useTheme();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', company: '', country: '', subject: '', message: '', consent: false });
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.consent) return alert('Please confirm your consent to proceed.');
    setSubmitted(true);
  };

  const inputStyle = getInputStyle(darkMode);

  return (
    <div style={{ background: darkMode ? '#0f172a' : '#f8f9fa', minHeight: '100vh', padding: 'clamp(16px, 3vw, 24px) clamp(12px, 2vw, 24px)' }}>
      {/* Hero */}
      <div style={{ maxWidth: 1200, margin: '0 auto clamp(16px, 3vw, 24px)', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', borderRadius: 16, padding: 'clamp(24px, 5vw, 40px) clamp(20px, 4vw, 32px)', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(11px, 1.3vw, 12px)', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>Contact Privacy Officer</h1>
        <p style={{ fontSize: 'clamp(13px, 1.5vw, 14px)', color: '#94a3b8', margin: 0 }}>Privacy inquiries, data requests &amp; DPO contact | Last updated: {UPDATED}</p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'clamp(1fr, 2fr, 1fr 1.6fr)', gap: 28, alignItems: 'start' }}>

        {/* Left — Contact Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* DPO Card */}
          <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 16, padding: 'clamp(20px, 4vw, 28px) clamp(18px, 3vw, 24px)', boxShadow: darkMode ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 'clamp(10px, 1.2vw, 11px)', fontWeight: 700, color: '#4a7cff', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>Privacy Officer</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 'clamp(44px, 6vw, 52px)', height: 'clamp(44px, 6vw, 52px)', borderRadius: 14, background: 'linear-gradient(135deg,#4a7cff,#6c5ce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(18px, 2.5vw, 22px)', flexShrink: 0 }}>🔐</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 1.8vw, 15px)', color: darkMode ? '#f1f5f9' : '#1a1a2e' }}>Data Protection Officer</div>
                <div style={{ fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#94a3b8' : '#6b7280' }}>TGS Tech Info</div>
              </div>
            </div>
            {[
              { icon: '📧', label: 'Privacy Email', value: 'privacy@tgstechinfo.com', href: 'mailto:privacy@tgstechinfo.com' },
              { icon: '🛡️', label: 'DPO Email', value: 'sagar.machale@tgstechinfo.com', href: 'mailto:sagar.machale@tgstechinfo.com' },
              { icon: '⚖️', label: 'Legal Email', value: 'legal@tgstechinfo.com', href: 'mailto:legal@tgstechinfo.com' },
              { icon: '🌐', label: 'Website', value: 'tgstechinfo.com', href: 'https://tgstechinfo.com' },
            ].map(({ icon, label, value, href }) => (
              <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 'clamp(14px, 2vw, 16px)', flexShrink: 0, marginTop: 1 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 'clamp(10px, 1.2vw, 11px)', fontWeight: 600, color: darkMode ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                  <a href={href} style={{ fontSize: 'clamp(12px, 1.4vw, 13.5px)', color: '#4a7cff', textDecoration: 'none', fontWeight: 500 }}>{value}</a>
                </div>
              </div>
            ))}
          </div>

          {/* Response Times */}
          <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 16, padding: 'clamp(18px, 3vw, 24px)', boxShadow: darkMode ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 'clamp(10px, 1.2vw, 11px)', fontWeight: 700, color: '#00b894', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Response Timelines</div>
            {[
              { label: 'General Privacy Inquiries', time: '3–5 business days' },
              { label: 'GDPR / UK GDPR Requests', time: '30 days' },
              { label: 'CCPA / CPRA Requests', time: '45 days' },
              { label: 'Do Not Sell Opt-Out', time: '15 business days' },
              { label: 'Security Incidents', time: '72 hours (GDPR)' },
              { label: 'Accessibility Feedback', time: '5 business days' },
            ].map(({ label, time }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(6px, 1vw, 8px) 0', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f4ff', gap: 8 }}>
                <span style={{ fontSize: 'clamp(11px, 1.4vw, 12.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>{label}</span>
                <span style={{ fontSize: 'clamp(11px, 1.3vw, 12px)', fontWeight: 700, color: '#00b894', background: darkMode ? 'rgba(0, 184, 148, 0.15)' : '#e8faf5', padding: 'clamp(2px, 0.4vw, 3px) clamp(8px, 1.5vw, 10px)', borderRadius: 20, whiteSpace: 'nowrap' }}>{time}</span>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 16, padding: 'clamp(18px, 3vw, 24px)', boxShadow: darkMode ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 'clamp(10px, 1.2vw, 11px)', fontWeight: 700, color: '#6c5ce7', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Related Pages</div>
            {[
              { label: '📋 Submit a Data Request (DSAR)', to: '/data-requests' },
              { label: '🚫 Do Not Sell My Information', to: '/data-requests' },
              { label: '🔒 Privacy Policy', to: '/privacy-policy' },
              { label: '🍪 Cookie Policy', to: '/cookie-policy' },
              { label: '🇪🇺 GDPR / CCPA Notice', to: '/data-privacy-notice' },
              { label: '🏢 Vendor / Sub-Processor List', to: '/vendor-list' },
            ].map(({ label, to }) => (
              <Link key={to + label} to={to} style={{ display: 'block', fontSize: 'clamp(12px, 1.4vw, 13px)', color: '#4a7cff', textDecoration: 'none', padding: 'clamp(5px, 0.8vw, 7px) 0', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f4ff' }}
                onMouseEnter={e => e.currentTarget.style.paddingLeft = '6px'}
                onMouseLeave={e => e.currentTarget.style.paddingLeft = '0'}
              >{label}</Link>
            ))}
          </div>
        </div>

        {/* Right — Contact Form */}
        <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 16, padding: 'clamp(28px, 4vw, 36px)', boxShadow: darkMode ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.07)' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 8 }}>Message Sent</div>
              <div style={{ fontSize: 14.5, color: darkMode ? '#cbd5e1' : '#374151', lineHeight: 1.8 }}>
                Thank you for contacting our Privacy Officer. We have received your message and will respond within the applicable timeframe.
              </div>
              <div style={{ marginTop: 16, fontSize: 13, color: darkMode ? '#94a3b8' : '#6b7280' }}>A confirmation has been sent to your email address.</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 'clamp(20px, 3vw, 28px)' }}>
                <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 20px)', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', margin: '0 0 8px' }}>Send a Privacy Inquiry</h2>
                <p style={{ fontSize: 'clamp(12px, 1.4vw, 13.5px)', color: darkMode ? '#94a3b8' : '#6b7280', margin: 0 }}>
                  Use this form for privacy questions, data requests, consent withdrawals, or any other privacy-related matter. For formal data subject requests, please use our <Link to="/data-requests" style={{ color: '#4a7cff' }}>Data Request Form</Link>.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'clamp(1fr, 2fr, 1fr 1fr)', gap: '0 16px' }}>
                  <Field label="First Name" required darkMode={darkMode}><input style={inputStyle} value={form.firstName} onChange={e => set('firstName', e.target.value)} required /></Field>
                  <Field label="Last Name" required darkMode={darkMode}><input style={inputStyle} value={form.lastName} onChange={e => set('lastName', e.target.value)} required /></Field>
                </div>
                <Field label="Business Email" required darkMode={darkMode}><input type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} required /></Field>
                <div style={{ display: 'grid', gridTemplateColumns: 'clamp(1fr, 2fr, 1fr 1fr)', gap: '0 16px' }}>
                  <Field label="Company" darkMode={darkMode}><input style={inputStyle} value={form.company} onChange={e => set('company', e.target.value)} /></Field>
                  <Field label="Country" required darkMode={darkMode}><input style={inputStyle} value={form.country} onChange={e => set('country', e.target.value)} required /></Field>
                </div>
                <Field label="Subject" required darkMode={darkMode}>
                  <select style={inputStyle} value={form.subject} onChange={e => set('subject', e.target.value)} required>
                    <option value="">Select a subject...</option>
                    <option value="general">General Privacy Inquiry</option>
                    <option value="data_request">Data Subject Request (DSAR)</option>
                    <option value="consent">Consent Withdrawal</option>
                    <option value="marketing_opt_out">Marketing Opt-Out</option>
                    <option value="do_not_sell">Do Not Sell / Share (CCPA)</option>
                    <option value="data_breach">Data Breach Notification</option>
                    <option value="cookie">Cookie Inquiry</option>
                    <option value="complaint">Privacy Complaint</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Message" required darkMode={darkMode}>
                  <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={form.message} onChange={e => set('message', e.target.value)} required placeholder="Describe your privacy inquiry in detail..." />
                </Field>
                <div style={{ background: darkMode ? '#0f172a' : '#f8faff', borderRadius: 10, padding: 'clamp(12px, 2vw, 14px) clamp(14px, 2.5vw, 16px)', marginBottom: 20 }}>
                  <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.consent} onChange={e => set('consent', e.target.checked)} style={{ marginTop: 3, flexShrink: 0 }} />
                    <span style={{ fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
                      I consent to TGS Tech Info processing my personal data to respond to this inquiry. I have read the <Link to="/privacy-policy" style={{ color: '#4a7cff' }}>Privacy Policy</Link>.
                    </span>
                  </label>
                </div>
                <button type="submit" style={{ width: '100%', padding: 'clamp(11px, 1.5vw, 13px)', background: 'linear-gradient(135deg,#4a7cff,#6c5ce7)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 'clamp(14px, 1.8vw, 15px)', cursor: 'pointer' }}>
                  Send to Privacy Officer
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactPrivacyOfficer;
