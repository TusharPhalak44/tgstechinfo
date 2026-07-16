import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const UPDATED = 'July 8, 2026';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid #e8f0ff' }}>{title}</h2>
    <div style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.85 }}>{children}</div>
  </div>
);

const Li = ({ children }) => <li style={{ marginBottom: 6, paddingLeft: 4 }}>{children}</li>;

const Field = ({ label, required, children, hint }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: 'block', fontWeight: 600, fontSize: 13.5, color: '#1a1a2e', marginBottom: 6 }}>
      {label} {required && <span style={{ color: '#e17055' }}>*</span>}
    </label>
    {hint && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{hint}</div>}
    {children}
  </div>
);

const inputStyle = {
  width: '100%', padding: '10px 14px', border: '1px solid #dde2ee', borderRadius: 8,
  fontSize: 14, color: '#1a1a2e', outline: 'none', background: '#fff', boxSizing: 'border-box',
};

const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    padding: '10px 24px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
    borderRadius: '10px 10px 0 0', transition: 'all .2s',
    background: active ? '#fff' : '#f0f4ff',
    color: active ? '#1a1a2e' : '#6b7280',
    borderBottom: active ? '3px solid #e17055' : '3px solid transparent',
  }}>{children}</button>
);

const SUCCESS_MSG = ({ type }) => (
  <div style={{ padding: '20px 24px', background: '#e8faf5', borderRadius: 12, border: '1px solid #00b89433', textAlign: 'center' }}>
    <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
    <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 16, marginBottom: 6 }}>Request Submitted Successfully</div>
    <div style={{ color: '#374151', fontSize: 14 }}>
      {type === 'dns' ? 'Your opt-out request has been received. We will process it within 15 business days.' : 'Your data request has been received. We will respond within 30 days (GDPR) or 45 days (CCPA).'}
    </div>
    <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>A confirmation email has been sent to the address you provided.</div>
  </div>
);

const DoNotSellForm = () => {
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

  if (submitted) return <SUCCESS_MSG type="dns" />;

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="First Name" required><input style={inputStyle} value={form.firstName} onChange={e => set('firstName', e.target.value)} required /></Field>
        <Field label="Last Name" required><input style={inputStyle} value={form.lastName} onChange={e => set('lastName', e.target.value)} required /></Field>
      </div>
      <Field label="Business Email Address" required><input type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} required /></Field>
      <Field label="Alternate Email Address"><input type="email" style={inputStyle} value={form.altEmail} onChange={e => set('altEmail', e.target.value)} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="Phone Number"><input type="tel" style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
        <Field label="State / Country of Residence" required><input style={inputStyle} value={form.state} onChange={e => set('state', e.target.value)} required /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="Company Name"><input style={inputStyle} value={form.company} onChange={e => set('company', e.target.value)} /></Field>
        <Field label="Job Title"><input style={inputStyle} value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} /></Field>
      </div>
      <Field label="Request Type" required>
        <select style={inputStyle} value={form.requestType} onChange={e => set('requestType', e.target.value)}>
          <option value="do_not_sell">Do Not Sell My Personal Information</option>
          <option value="do_not_share">Do Not Share My Personal Information</option>
          <option value="both">Both — Do Not Sell or Share</option>
        </select>
      </Field>
      <Field label="Additional Details (optional)">
        <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Any additional context about your request..." />
      </Field>
      <div style={{ background: '#f8faff', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e', marginBottom: 12 }}>Declaration</div>
        {[
          { key: 'certified', text: 'I certify that the information provided is accurate and I am the individual (or authorized agent) making this request.' },
          { key: 'consent', text: 'I understand that identity verification may be required before my request is processed, and I acknowledge the Privacy Notice.' },
        ].map(({ key, text }) => (
          <label key={key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} style={{ marginTop: 3, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#374151' }}>{text}</span>
          </label>
        ))}
      </div>
      {error && <div style={{ marginBottom: 12, padding: '10px 14px', background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 8, color: '#dc2626', fontSize: 13.5 }}>{error}</div>}
      <button type="submit" disabled={loading} style={{ padding: '12px 32px', background: loading ? '#94a3b8' : '#e17055', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Submitting...' : 'Submit Opt-Out Request'}
      </button>
    </form>
  );
};

const DSARForm = () => {
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

  if (submitted) return <SUCCESS_MSG type="dsar" />;

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="First Name" required><input style={inputStyle} value={form.firstName} onChange={e => set('firstName', e.target.value)} required /></Field>
        <Field label="Last Name" required><input style={inputStyle} value={form.lastName} onChange={e => set('lastName', e.target.value)} required /></Field>
      </div>
      <Field label="Business Email Address" required><input type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} required /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="Phone Number"><input type="tel" style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
        <Field label="Company Name"><input style={inputStyle} value={form.company} onChange={e => set('company', e.target.value)} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="Country" required><input style={inputStyle} value={form.country} onChange={e => set('country', e.target.value)} required /></Field>
        <Field label="State / Province"><input style={inputStyle} value={form.state} onChange={e => set('state', e.target.value)} /></Field>
      </div>
      <Field label="Request Type" required hint="Select the type of data request you wish to submit.">
        <select style={inputStyle} value={form.requestType} onChange={e => set('requestType', e.target.value)}>
          <option value="access">Access My Data — Receive a copy of my personal data</option>
          <option value="correct">Correct My Data — Fix inaccurate personal data</option>
          <option value="delete">Delete My Data — Request erasure of my personal data</option>
          <option value="restrict">Restrict Processing — Limit how my data is used</option>
          <option value="portability">Data Portability — Receive data in machine-readable format</option>
          <option value="object">Object to Processing — Object to legitimate interest processing</option>
          <option value="withdraw">Withdraw Consent — Withdraw previously given consent</option>
          <option value="other">Other — Describe below</option>
        </select>
      </Field>
      <Field label="Request Details" required hint="Please describe your request in detail to help us process it accurately.">
        <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={form.details} onChange={e => set('details', e.target.value)} required placeholder="Describe your request..." />
      </Field>
      <div style={{ background: '#f8faff', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e', marginBottom: 10 }}>Declaration</div>
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.declaration} onChange={e => set('declaration', e.target.checked)} style={{ marginTop: 3, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#374151' }}>
            I declare that the information provided is accurate. I understand that identity verification may be required. I have read and understood the <Link to="/privacy-policy" style={{ color: '#4a7cff' }}>Privacy Policy</Link>.
          </span>
        </label>
      </div>
      {error && <div style={{ marginBottom: 12, padding: '10px 14px', background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 8, color: '#dc2626', fontSize: 13.5 }}>{error}</div>}
      <button type="submit" disabled={loading} style={{ padding: '12px 32px', background: loading ? '#94a3b8' : '#4a7cff', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Submitting...' : 'Submit Data Request'}
      </button>
    </form>
  );
};

const DataRequests = () => {
  const [tab, setTab] = useState('dsar');

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '40px 16px' }}>
      {/* Hero */}
      <div style={{ maxWidth: 900, margin: '0 auto 40px', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', borderRadius: 16, padding: '48px 40px', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>Data Requests</h1>
        <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Do Not Sell / Share &amp; Data Subject Access Requests | Last updated: {UPDATED}</p>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 0, paddingLeft: 4, flexWrap: 'wrap' }}>
          <TabBtn active={tab === 'dsar'} onClick={() => setTab('dsar')}>📋 Data Subject Request (DSAR)</TabBtn>
          <TabBtn active={tab === 'dns'} onClick={() => setTab('dns')}>🚫 Do Not Sell or Share (CCPA)</TabBtn>
          <TabBtn active={tab === 'info'} onClick={() => setTab('info')}>ℹ️ About Your Rights</TabBtn>
        </div>

        <div style={{ background: '#fff', borderRadius: '0 16px 16px 16px', padding: '48px 48px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>

          {tab === 'dsar' && (
            <>
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>Data Subject Access Request</h2>
                <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.8 }}>
                  Use this form to exercise your data rights under GDPR, UK GDPR, CCPA/CPRA, or other applicable privacy laws. We will verify your identity and respond within the legally required timeframe.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  {['GDPR: 30 days', 'CCPA: 45 days', 'UK GDPR: 30 days'].map(b => (
                    <span key={b} style={{ background: '#f0f4ff', color: '#4a7cff', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1px solid #dce6ff' }}>{b}</span>
                  ))}
                </div>
              </div>
              <DSARForm />
            </>
          )}

          {tab === 'dns' && (
            <>
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>Do Not Sell or Share My Personal Information</h2>
                <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.8 }}>
                  California residents have the right under CCPA/CPRA to opt out of the sale or sharing of their personal information. Complete this form to submit your opt-out request. We will process it within <strong>15 business days</strong>.
                </p>
                <div style={{ padding: '14px 18px', background: '#fff8f0', borderRadius: 10, border: '1px solid #e1705533', marginTop: 16, fontSize: 13.5, color: '#374151' }}>
                  <strong>What does "sell" or "share" mean?</strong> Under CCPA/CPRA, "selling" means disclosing personal information for monetary or other valuable consideration. "Sharing" means disclosing personal information for cross-context behavioral advertising, even without payment.
                </div>
              </div>
              <DoNotSellForm />
            </>
          )}

          {tab === 'info' && (
            <>
              <Section title="Your Privacy Rights">
                <p style={{ marginBottom: 16 }}>Depending on your location, you may have the following rights regarding your personal information:</p>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    { law: 'GDPR / UK GDPR', rights: 'Access, Rectification, Erasure, Restriction, Portability, Objection, Withdraw Consent', color: '#4a7cff' },
                    { law: 'CCPA / CPRA (California)', rights: 'Know, Delete, Correct, Opt-Out of Sale/Sharing, Limit Sensitive Info, Non-Discrimination', color: '#e17055' },
                    { law: 'CAN-SPAM / CASL', rights: 'Unsubscribe from commercial emails at any time', color: '#00b894' },
                  ].map(({ law, rights, color }) => (
                    <div key={law} style={{ padding: '14px 16px', background: '#fafbff', borderRadius: 10, borderLeft: `3px solid ${color}` }}>
                      <div style={{ fontWeight: 700, color, fontSize: 13, marginBottom: 4 }}>{law}</div>
                      <div style={{ fontSize: 13.5, color: '#374151' }}>{rights}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Identity Verification">
                <p style={{ marginBottom: 10 }}>To protect your privacy, we verify your identity before processing requests. We may ask you to:</p>
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li>Confirm your email address via a verification link</Li>
                  <Li>Provide additional identifying information matching our records</Li>
                  <Li>For authorized agents: provide written authorization and proof of identity</Li>
                </ul>
              </Section>

              <Section title="Response Timelines">
                <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
                  <Li><strong>GDPR / UK GDPR:</strong> 30 days (extendable by 2 months for complex requests)</Li>
                  <Li><strong>CCPA / CPRA:</strong> 45 days (extendable by additional 45 days with notice)</Li>
                  <Li><strong>Do Not Sell / Share opt-out:</strong> 15 business days</Li>
                </ul>
              </Section>

              <Section title="Contact Privacy Officer">
                <div style={{ padding: '20px 24px', background: '#f0f4ff', borderRadius: 12, borderLeft: '4px solid #4a7cff' }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#1a1a2e' }}>TGS Tech Info — Privacy Officer</p>
                  <p style={{ margin: '0 0 4px', color: '#374151' }}>Email: <a href="mailto:privacy@tgstechinfo.com" style={{ color: '#4a7cff' }}>privacy@tgstechinfo.com</a></p>
                  <p style={{ margin: 0, color: '#374151' }}>DPO: <a href="mailto:sagar.machale@tgstechinfo.com" style={{ color: '#4a7cff' }}>sagar.machale@tgstechinfo.com</a></p>
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
