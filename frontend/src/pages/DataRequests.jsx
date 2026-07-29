import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Select, ConfigProvider } from 'antd';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const UPDATED = 'July 8, 2026';

const Section = ({ title, children, darkMode }) => (
  <div style={{ marginBottom: 'clamp(24px, 4vw, 32px)' }}>
    <h2 style={{ fontSize: 'clamp(16px, 2.2vw, 19px)', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 10, paddingBottom: 8, borderBottom: darkMode ? '2px solid #334155' : '2px solid #e8f0ff' }}>{title}</h2>
    <div style={{ fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151', lineHeight: 1.85 }}>{children}</div>
  </div>
);

const Li = ({ children }) => <li style={{ marginBottom: 6, paddingLeft: 4 }}>{children}</li>;

const Field = ({ label, required, children, hint, darkMode }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontWeight: 600, fontSize: 'clamp(13px, 1.5vw, 13.5px)', color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 6 }}>
      {label} {required && <span style={{ color: '#e17055' }}>*</span>}
    </label>
    {hint && <div style={{ fontSize: 'clamp(11px, 1.3vw, 12px)', color: darkMode ? '#94a3b8' : '#6b7280', marginBottom: 6 }}>{hint}</div>}
    {children}
  </div>
);

const inputStyle = {
  width: '100%', padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 1.5vw, 14px)', border: '1px solid #dde2ee', borderRadius: 8,
  fontSize: 'clamp(13px, 1.5vw, 14px)', color: '#1a1a2e', outline: 'none', background: '#fff', boxSizing: 'border-box',
};

const TabBtn = ({ active, onClick, children, darkMode }) => (
  <button onClick={onClick} style={{
    padding: 'clamp(8px, 1.5vw, 10px) clamp(18px, 3vw, 24px)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 'clamp(13px, 1.5vw, 14px)',
    borderRadius: '10px 10px 0 0', transition: 'all .2s',
    background: active ? (darkMode ? '#1e293b' : '#fff') : (darkMode ? '#0f172a' : '#f0f4ff'),
    color: active ? (darkMode ? '#f1f5f9' : '#1a1a2e') : (darkMode ? '#94a3b8' : '#6b7280'),
    borderBottom: active ? '3px solid #e17055' : '3px solid transparent',
  }}>{children}</button>
);

const SUCCESS_MSG = ({ type, darkMode }) => (
  <div style={{ padding: 'clamp(16px, 3vw, 20px) clamp(20px, 3vw, 24px)', background: darkMode ? 'rgba(0, 184, 148, 0.1)' : '#e8faf5', borderRadius: 12, border: darkMode ? '1px solid #00b89433' : '1px solid #00b89433', textAlign: 'center' }}>
    <div style={{ fontSize: 'clamp(28px, 4vw, 32px)', marginBottom: 8 }}>✅</div>
    <div style={{ fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', fontSize: 'clamp(15px, 2vw, 16px)', marginBottom: 6 }}>Request Submitted Successfully</div>
    <div style={{ color: darkMode ? '#cbd5e1' : '#374151', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>
      {type === 'dns' ? 'Your opt-out request has been received. We will process it within 15 business days.' : 'Your data request has been received. We will respond within 30 days (GDPR) or 45 days (CCPA).'}
    </div>
    <div style={{ marginTop: 12, fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#94a3b8' : '#6b7280' }}>A confirmation email has been sent to the address you provided.</div>
  </div>
);

const DoNotSellForm = ({ darkMode }) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', altEmail: '', phone: '', company: '', jobTitle: '', state: '', requestType: 'both', description: '', certified: false, consent: false });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.certified || !form.consent) return setError('Please check both declaration checkboxes.');
    setError('');
    setLoading(true);
    try {
      await api.post('/api/public/data-request/do-not-sell', form);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return <SUCCESS_MSG type="dns" darkMode={darkMode} />;

  const getInputStyle = () => ({
    width: '100%', padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 1.5vw, 14px)', border: darkMode ? '1px solid #475569' : '1px solid #dde2ee', borderRadius: 8,
    fontSize: 'clamp(13px, 1.5vw, 14px)', color: darkMode ? '#f1f5f9' : '#1a1a2e', outline: 'none', background: darkMode ? '#0f172a' : '#fff', boxSizing: 'border-box',
  });

  const selectTheme = {
    token: {
      colorBgContainer: darkMode ? '#0f172a' : '#fff',
      colorText: darkMode ? '#cbd5e1' : '#374151',
      colorBorder: darkMode ? '#475569' : '#d9d9d9',
      colorBgElevated: darkMode ? '#0f172a' : '#fff',
      colorTextPlaceholder: darkMode ? '#64748b' : '#bfbfbf',
    },
  };

  return (
    <ConfigProvider theme={selectTheme}>
      <form onSubmit={handleSubmit} style={{ overflow: 'visible' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'clamp(1fr, 2fr, 1fr 1fr)', gap: '0 16px' }}>
          <Field label="First Name" required darkMode={darkMode}><input style={getInputStyle()} value={form.firstName} onChange={e => set('firstName', e.target.value)} required /></Field>
          <Field label="Last Name" required darkMode={darkMode}><input style={getInputStyle()} value={form.lastName} onChange={e => set('lastName', e.target.value)} required /></Field>
        </div>
        <Field label="Business Email Address" required darkMode={darkMode}><input type="email" style={getInputStyle()} value={form.email} onChange={e => set('email', e.target.value)} required /></Field>
        <Field label="Alternate Email Address" darkMode={darkMode}><input type="email" style={getInputStyle()} value={form.altEmail} onChange={e => set('altEmail', e.target.value)} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: 'clamp(1fr, 2fr, 1fr 1fr)', gap: '0 16px' }}>
          <Field label="Phone Number" darkMode={darkMode}><input type="tel" style={getInputStyle()} value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
          <Field label="State / Country of Residence" required darkMode={darkMode}><input style={getInputStyle()} value={form.state} onChange={e => set('state', e.target.value)} required /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'clamp(1fr, 2fr, 1fr 1fr)', gap: '0 16px' }}>
          <Field label="Company Name" darkMode={darkMode}><input style={getInputStyle()} value={form.company} onChange={e => set('company', e.target.value)} /></Field>
          <Field label="Job Title" darkMode={darkMode}><input style={getInputStyle()} value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} /></Field>
        </div>
        <Field label="Request Type" required darkMode={darkMode}>
          <Select
            value={form.requestType}
            onChange={value => set('requestType', value)}
            style={{ width: '100%' }}
            options={[
              { value: 'do_not_sell', label: 'Do Not Sell My Personal Information' },
              { value: 'do_not_share', label: 'Do Not Share My Personal Information' },
              { value: 'both', label: 'Both — Do Not Sell or Share' },
            ]}
          />
        </Field>
        <Field label="Additional Details (optional)" darkMode={darkMode}>
          <textarea style={{ ...getInputStyle(), minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Any additional context about your request..." />
        </Field>
        <div style={{ background: darkMode ? '#1e293b' : '#f8faff', borderRadius: 10, padding: 'clamp(14px, 2.5vw, 16px) clamp(16px, 3vw, 20px)', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 12 }}>Declaration</div>
          {[
            { key: 'certified', text: 'I certify that the information provided is accurate and I am the individual (or authorized agent) making this request.' },
            { key: 'consent', text: 'I understand that identity verification may be required before my request is processed, and I acknowledge the Privacy Notice.' },
          ].map(({ key, text }) => (
            <label key={key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} style={{ marginTop: 3, flexShrink: 0 }} />
              <span style={{ fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#cbd5e1' : '#374151' }}>{text}</span>
            </label>
          ))}
        </div>
        {error && <div style={{ marginBottom: 12, padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 1.5vw, 14px)', background: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fff0f0', border: darkMode ? '1px solid #ef4444' : '1px solid #fca5a5', borderRadius: 8, color: darkMode ? '#fca5a5' : '#dc2626', fontSize: 'clamp(12px, 1.4vw, 13.5px)' }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ padding: 'clamp(10px, 1.5vw, 12px) clamp(28px, 4vw, 32px)', background: loading ? '#94a3b8' : '#e17055', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 'clamp(14px, 1.6vw, 15px)', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Submitting...' : 'Submit Opt-Out Request'}
        </button>
      </form>
    </ConfigProvider>
  );
};

const DSARForm = ({ darkMode }) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '', country: '', state: '', requestType: 'access', details: '', declaration: false });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.declaration) return setError('Please check the declaration checkbox.');
    setError('');
    setLoading(true);
    try {
      await api.post('/api/public/data-request/dsar', {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone,
        company: form.company,
        country: form.country,
        state: form.state,
        request_type: form.requestType,
        details: form.details,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return <SUCCESS_MSG type="dsar" darkMode={darkMode} />;

  const getInputStyle = () => ({
    width: '100%', padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 1.5vw, 14px)', border: darkMode ? '1px solid #475569' : '1px solid #dde2ee', borderRadius: 8,
    fontSize: 'clamp(13px, 1.5vw, 14px)', color: darkMode ? '#f1f5f9' : '#1a1a2e', outline: 'none', background: darkMode ? '#0f172a' : '#fff', boxSizing: 'border-box',
  });

  const selectTheme = {
    token: {
      colorBgContainer: darkMode ? '#0f172a' : '#fff',
      colorText: darkMode ? '#cbd5e1' : '#374151',
      colorBorder: darkMode ? '#475569' : '#d9d9d9',
      colorBgElevated: darkMode ? '#0f172a' : '#fff',
      colorTextPlaceholder: darkMode ? '#64748b' : '#bfbfbf',
    },
  };

  return (
    <ConfigProvider theme={selectTheme}>
      <form onSubmit={handleSubmit} style={{ overflow: 'visible' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'clamp(1fr, 2fr, 1fr 1fr)', gap: '0 16px' }}>
          <Field label="First Name" required darkMode={darkMode}><input style={getInputStyle()} value={form.firstName} onChange={e => set('firstName', e.target.value)} required /></Field>
          <Field label="Last Name" required darkMode={darkMode}><input style={getInputStyle()} value={form.lastName} onChange={e => set('lastName', e.target.value)} required /></Field>
        </div>
        <Field label="Business Email Address" required darkMode={darkMode}><input type="email" style={getInputStyle()} value={form.email} onChange={e => set('email', e.target.value)} required /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: 'clamp(1fr, 2fr, 1fr 1fr)', gap: '0 16px' }}>
          <Field label="Phone Number" darkMode={darkMode}><input type="tel" style={getInputStyle()} value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
          <Field label="Company Name" darkMode={darkMode}><input style={getInputStyle()} value={form.company} onChange={e => set('company', e.target.value)} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'clamp(1fr, 2fr, 1fr 1fr)', gap: '0 16px' }}>
          <Field label="Country" required darkMode={darkMode}><input style={getInputStyle()} value={form.country} onChange={e => set('country', e.target.value)} required /></Field>
          <Field label="State / Province" darkMode={darkMode}><input style={getInputStyle()} value={form.state} onChange={e => set('state', e.target.value)} /></Field>
        </div>
        <Field label="Request Type" required hint="Select the type of data request you wish to submit." darkMode={darkMode}>
          <Select
            value={form.requestType}
            onChange={value => set('requestType', value)}
            style={{ width: '100%' }}
            options={[
              { value: 'access', label: 'Access My Data — Receive a copy of my personal data' },
              { value: 'correct', label: 'Correct My Data — Fix inaccurate personal data' },
              { value: 'delete', label: 'Delete My Data — Request erasure of my personal data' },
              { value: 'restrict', label: 'Restrict Processing — Limit how my data is used' },
              { value: 'portability', label: 'Data Portability — Receive data in machine-readable format' },
              { value: 'object', label: 'Object to Processing — Object to legitimate interest processing' },
              { value: 'withdraw', label: 'Withdraw Consent — Withdraw previously given consent' },
              { value: 'other', label: 'Other — Describe below' },
            ]}
          />
        </Field>
        <Field label="Request Details" required hint="Please describe your request in detail to help us process it accurately." darkMode={darkMode}>
          <textarea style={{ ...getInputStyle(), minHeight: 100, resize: 'vertical' }} value={form.details} onChange={e => set('details', e.target.value)} required placeholder="Describe your request..." />
        </Field>
        <div style={{ background: darkMode ? '#1e293b' : '#f8faff', borderRadius: 10, padding: 'clamp(14px, 2.5vw, 16px) clamp(16px, 3vw, 20px)', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 10 }}>Declaration</div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.declaration} onChange={e => set('declaration', e.target.checked)} style={{ marginTop: 3, flexShrink: 0 }} />
            <span style={{ fontSize: 'clamp(12px, 1.4vw, 13px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              I declare that the information provided is accurate. I understand that identity verification may be required. I have read and understood the <Link to="/privacy-policy" style={{ color: '#4a7cff' }}>Privacy Policy</Link>.
            </span>
          </label>
        </div>
        {error && <div style={{ marginBottom: 12, padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 1.5vw, 14px)', background: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fff0f0', border: darkMode ? '1px solid #ef4444' : '1px solid #fca5a5', borderRadius: 8, color: darkMode ? '#fca5a5' : '#dc2626', fontSize: 'clamp(12px, 1.4vw, 13.5px)' }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ padding: 'clamp(10px, 1.5vw, 12px) clamp(28px, 4vw, 32px)', background: loading ? '#94a3b8' : '#4a7cff', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 'clamp(14px, 1.6vw, 15px)', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Submitting...' : 'Submit Data Request'}
        </button>
      </form>
    </ConfigProvider>
  );
};

const DataRequests = () => {
  const { darkMode } = useTheme();
  const [tab, setTab] = useState('dsar');

  return (
    <div style={{ background: darkMode ? '#0f172a' : '#f8f9fa', minHeight: '100vh', padding: 'clamp(16px, 3vw, 24px) clamp(12px, 2vw, 24px)' }}>
      {/* Hero */}
      <div style={{ maxWidth: 1200, margin: '0 auto clamp(16px, 3vw, 24px)', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', borderRadius: 16, padding: 'clamp(24px, 5vw, 40px) clamp(20px, 4vw, 32px)', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(11px, 1.3vw, 12px)', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>Data Requests</h1>
        <p style={{ fontSize: 'clamp(13px, 1.5vw, 14px)', color: '#94a3b8', margin: 0 }}>Do Not Sell / Share &amp; Data Subject Access Requests | Last updated: {UPDATED}</p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 0, paddingLeft: 4, flexWrap: 'wrap' }}>
          <TabBtn active={tab === 'dsar'} onClick={() => setTab('dsar')} darkMode={darkMode}>📋 Data Subject Request (DSAR)</TabBtn>
          <TabBtn active={tab === 'dns'} onClick={() => setTab('dns')} darkMode={darkMode}>🚫 Do Not Sell or Share (CCPA)</TabBtn>
          <TabBtn active={tab === 'info'} onClick={() => setTab('info')} darkMode={darkMode}>ℹ️ About Your Rights</TabBtn>
        </div>

        <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: '0 16px 16px 16px', padding: 'clamp(20px, 4vw, 32px)', boxShadow: darkMode ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.07)', overflow: 'visible' }}>

          {tab === 'dsar' && (
            <>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 20px)', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 8 }}>Data Subject Access Request</h2>
                <p style={{ fontSize: 'clamp(13.5px, 1.5vw, 14.5px)', color: darkMode ? '#cbd5e1' : '#374151', lineHeight: 1.8 }}>
                  Use this form to exercise your data rights under GDPR, UK GDPR, CCPA/CPRA, or other applicable privacy laws. We will verify your identity and respond within the legally required timeframe.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  {['GDPR: 30 days', 'CCPA: 45 days', 'UK GDPR: 30 days'].map(b => (
                    <span key={b} style={{ background: darkMode ? '#0f172a' : '#f0f4ff', color: '#4a7cff', fontSize: 'clamp(11px, 1.3vw, 12px)', fontWeight: 600, padding: 'clamp(3px, 0.5vw, 4px) clamp(10px, 2vw, 12px)', borderRadius: 20, border: darkMode ? '1px solid #334155' : '1px solid #dce6ff' }}>{b}</span>
                  ))}
                </div>
              </div>
              <DSARForm darkMode={darkMode} />
            </>
          )}

          {tab === 'dns' && (
            <>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 20px)', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', marginBottom: 8 }}>Do Not Sell or Share My Personal Information</h2>
                <p style={{ fontSize: 'clamp(13.5px, 1.5vw, 14.5px)', color: darkMode ? '#cbd5e1' : '#374151', lineHeight: 1.8 }}>
                  California residents have the right under CCPA/CPRA to opt out of the sale or sharing of their personal information. Complete this form to submit your opt-out request. We will process it within <strong>15 business days</strong>.
                </p>
                <div style={{ padding: 'clamp(12px, 2vw, 14px) clamp(16px, 3vw, 18px)', background: darkMode ? 'rgba(225, 112, 85, 0.15)' : '#fff8f0', borderRadius: 10, border: darkMode ? '1px solid #e17055' : '1px solid #e1705533', marginTop: 16, fontSize: 'clamp(12.5px, 1.5vw, 13.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
                  <strong>What does "sell" or "share" mean?</strong> Under CCPA/CPRA, "selling" means disclosing personal information for monetary or other valuable consideration. "Sharing" means disclosing personal information for cross-context behavioral advertising, even without payment.
                </div>
              </div>
              <DoNotSellForm darkMode={darkMode} />
            </>
          )}

          {tab === 'info' && (
            <>
              <Section title="Your Privacy Rights" darkMode={darkMode}>
                <p style={{ marginBottom: 16, fontSize: 'clamp(14px, 1.5vw, 15.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>Depending on your location, you may have the following rights regarding your personal information:</p>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    { law: 'GDPR / UK GDPR', rights: 'Access, Rectification, Erasure, Restriction, Portability, Objection, Withdraw Consent', color: '#4a7cff' },
                    { law: 'CCPA / CPRA (California)', rights: 'Know, Delete, Correct, Opt-Out of Sale/Sharing, Limit Sensitive Info, Non-Discrimination', color: '#e17055' },
                    { law: 'CAN-SPAM / CASL', rights: 'Unsubscribe from commercial emails at any time', color: '#00b894' },
                  ].map(({ law, rights, color }) => (
                    <div key={law} style={{ padding: 'clamp(12px, 2vw, 14px) clamp(14px, 2vw, 16px)', background: darkMode ? '#0f172a' : '#fafbff', borderRadius: 10, borderLeft: `3px solid ${color}` }}>
                      <div style={{ fontWeight: 700, color, fontSize: 'clamp(12px, 1.4vw, 13px)', marginBottom: 4 }}>{law}</div>
                      <div style={{ fontSize: 'clamp(13px, 1.5vw, 13.5px)', color: darkMode ? '#cbd5e1' : '#374151' }}>{rights}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Identity Verification" darkMode={darkMode}>
                <p style={{ marginBottom: 10, color: darkMode ? '#cbd5e1' : '#374151' }}>To protect your privacy, we verify your identity before processing requests. We may ask you to:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>Confirm your email address via a verification link</Li>
                  <Li>Provide additional identifying information matching our records</Li>
                  <Li>For authorized agents: provide written authorization and proof of identity</Li>
                </ul>
              </Section>

              <Section title="Response Timelines" darkMode={darkMode}>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li><strong>GDPR / UK GDPR:</strong> 30 days (extendable by 2 months for complex requests)</Li>
                  <Li><strong>CCPA / CPRA:</strong> 45 days (extendable by additional 45 days with notice)</Li>
                  <Li><strong>Do Not Sell / Share opt-out:</strong> 15 business days</Li>
                </ul>
              </Section>

              <Section title="Contact Privacy Officer" darkMode={darkMode}>
                <div style={{ padding: 'clamp(14px, 2.5vw, 20px) clamp(16px, 3vw, 24px)', background: darkMode ? 'rgba(74, 124, 255, 0.1)' : '#f0f4ff', borderRadius: 12, borderLeft: '4px solid #4a7cff' }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a2e', fontSize: 'clamp(14px, 1.6vw, 15px)' }}>TGS Tech Info — Privacy Officer</p>
                  <p style={{ margin: '0 0 4px', color: darkMode ? '#cbd5e1' : '#374151', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>Email: <a href="mailto:privacy@tgstechinfo.com" style={{ color: '#4a7cff' }}>privacy@tgstechinfo.com</a></p>
                  <p style={{ margin: 0, color: darkMode ? '#cbd5e1' : '#374151', fontSize: 'clamp(13px, 1.5vw, 14px)' }}>DPO: <a href="mailto:sagar.machale@tgstechinfo.com" style={{ color: '#4a7cff' }}>sagar.machale@tgstechinfo.com</a></p>
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataRequests;
