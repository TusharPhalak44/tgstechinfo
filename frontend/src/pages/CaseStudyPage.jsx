import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';

const CaseStudyPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [caseStudy, setCaseStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfError, setPdfError] = useState(false);
  const [gateVisible, setGateVisible] = useState(true);
  const [gateSubmitted, setGateSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({ name: '', email: '', contact: '' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!slug) { setError('Invalid case study.'); setLoading(false); return; }

    try {
      if (localStorage.getItem(`cs_gated_${slug}`) === 'true') {
        setGateVisible(false);
        setGateSubmitted(true);
      }
    } catch (e) {
      console.error(e);
    }

    axios.get(`/api/public/case-study/${slug}`)
      .then(r => {
        setCaseStudy(r.data?.data || null);
        if (!r.data?.data) setError('Case study not found.');
      })
      .catch(() => setError('Case study not found or has been removed.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const pdfUrl = caseStudy?.pdf_file ? `/uploads/${caseStudy.pdf_file}` : null;

  const validate = () => {
    const errs = {};
    if (!formValues.name.trim()) errs.name = 'Name is required';
    if (!formValues.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) errs.email = 'Invalid email';
    if (!formValues.contact.trim()) errs.contact = 'Contact is required';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    try {
      await axios.post('/api/public/case-study-gate', {
        slug: slug,
        ...formValues,
      });
      try {
        localStorage.setItem(`cs_gated_${slug}`, 'true');
      } catch (e) {
        console.error(e);
      }
      setGateVisible(false);
      setGateSubmitted(true);
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={getStyles(darkMode).fullPage}>
        <div style={getStyles(darkMode).spinnerWrap}>
          <div style={getStyles(darkMode).spinner} />
          <p style={getStyles(darkMode).spinnerText}>Loading case study…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────
  if (error || !caseStudy) {
    return (
      <div style={getStyles(darkMode).fullPage}>
        <div style={getStyles(darkMode).errorBox}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h2 style={getStyles(darkMode).errorTitle}>Oops!</h2>
          <p style={getStyles(darkMode).errorMsg}>{error || 'Case study not found.'}</p>
          <button style={getStyles(darkMode).backBtn} onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── No PDF ───────────────────────────────────────────────────────
  if (!pdfUrl) {
    return (
      <div style={getStyles(darkMode).fullPage}>
        <div style={getStyles(darkMode).errorBox}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <h2 style={getStyles(darkMode).errorTitle}>PDF Not Available</h2>
          <p style={getStyles(darkMode).errorMsg}>
            The PDF for <strong>{caseStudy.case_study_headline || caseStudy.title}</strong> hasn't been attached yet.
            Please check back soon.
          </p>
          <button style={getStyles(darkMode).backBtn} onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const styles = getStyles(darkMode);

  // ── Gate Modal ─────────────────────────────────────────────────────
  if (gateVisible && caseStudy && !gateSubmitted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: darkMode ? '#0f172a' : '#f0f2f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div
          onClick={() => setGateVisible(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: darkMode ? '#1e293b' : '#fff',
              borderRadius: 20,
              width: '100%',
              maxWidth: 460,
              padding: 'clamp(24px, 3vw, 36px)',
              position: 'relative',
              boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: darkMode ? '#94a3b8' : '#8c8c8c', lineHeight: 1 }}>✕</button>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, background: 'var(--color-primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26 }}>📋</div>
              <h3 style={{ fontWeight: 800, fontSize: 'clamp(18px, 1.5vw, 20px)', color: darkMode ? '#f1f5f9' : '#0D2B4E', margin: '0 0 6px' }}>Download Case Study</h3>
              <p style={{ fontSize: 'clamp(13px, 0.9vw, 14px)', color: darkMode ? '#94a3b8' : '#6b7280', margin: 0, lineHeight: 1.5 }}>
                {caseStudy.case_study_headline || caseStudy.title}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#0D2B4E', display: 'block', marginBottom: 5 }}>Full Name *</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={formValues.name}
                  onChange={e => { setFormValues(p => ({ ...p, name: e.target.value })); setFormErrors(p => ({ ...p, name: '' })); }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${formErrors.name ? '#ff4d4f' : darkMode ? '#475569' : '#d9d9d9'}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#f1f5f9' : '#000' }}
                />
                {formErrors.name && <span style={{ fontSize: 11, color: '#ff4d4f', marginTop: 3, display: 'block' }}>{formErrors.name}</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#0D2B4E', display: 'block', marginBottom: 5 }}>Work Email *</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={formValues.email}
                  onChange={e => { setFormValues(p => ({ ...p, email: e.target.value })); setFormErrors(p => ({ ...p, email: '' })); }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${formErrors.email ? '#ff4d4f' : darkMode ? '#475569' : '#d9d9d9'}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#f1f5f9' : '#000' }}
                />
                {formErrors.email && <span style={{ fontSize: 11, color: '#ff4d4f', marginTop: 3, display: 'block' }}>{formErrors.email}</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#0D2B4E', display: 'block', marginBottom: 5 }}>Phone / Contact *</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formValues.contact}
                  onChange={e => { setFormValues(p => ({ ...p, contact: e.target.value })); setFormErrors(p => ({ ...p, contact: '' })); }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${formErrors.contact ? '#ff4d4f' : darkMode ? '#475569' : '#d9d9d9'}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#f1f5f9' : '#000' }}
                />
                {formErrors.contact && <span style={{ fontSize: 11, color: '#ff4d4f', marginTop: 3, display: 'block' }}>{formErrors.contact}</span>}
              </div>

              {formErrors.submit && <span style={{ fontSize: 12, color: '#ff4d4f', textAlign: 'center', display: 'block' }}>{formErrors.submit}</span>}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '12px 24px',
                  background: '#0AAEEF',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  transition: 'opacity .2s'
                }}
              >
                {submitting ? 'Submitting...' : 'Download Case Study'}
              </button>

              <p style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#8c8c8c', textAlign: 'center', margin: 0, lineHeight: 1.4 }}>
                By submitting, you agree to receive communications from TgsTechInfo.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PDF Viewer ───────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div style={styles.topBarInner}>
          <button style={styles.topBackBtn} onClick={() => navigate('/')}>
            <ArrowLeftOutlined style={{ marginRight: 6 }} />
            Home
          </button>

          <div style={styles.topMeta}>
            <span style={styles.typeBadge}>📋 Case Study</span>
            <span style={styles.topTitle}>
              {caseStudy.case_study_headline || caseStudy.title}
            </span>
          </div>

          <a
            href={pdfUrl}
            download={`${slug}.pdf`}
            style={styles.downloadBtn}
          >
            ⬇ Download PDF
          </a>
        </div>
      </div>

      {/* Summary strip */}
      {(caseStudy.case_study_summary || caseStudy.short_description) && (
        <div style={styles.summaryStrip}>
          <div style={styles.summaryInner}>
            <span style={styles.summaryText}>
              {caseStudy.case_study_summary || caseStudy.short_description}
            </span>
            <span style={styles.summaryDate}>
              {moment(caseStudy.published_date || caseStudy.created_at).format('MMMM D, YYYY')}
            </span>
          </div>
        </div>
      )}

      {/* PDF embed */}
      <div style={styles.pdfWrap}>
        {pdfError ? (
          /* Fallback: direct link when embed fails (mobile Safari etc.) */
          <div style={styles.pdfFallback}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📄</div>
            <p style={styles.pdfFallbackText}>
              Your browser cannot display the PDF inline.
            </p>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={styles.openPdfBtn}>
              Open PDF ↗
            </a>
          </div>
        ) : (
          <object
            data={pdfUrl}
            type="application/pdf"
            style={styles.pdfObject}
            onError={() => setPdfError(true)}
          >
            {/* <object> fallback for browsers that do not support PDF objects */}
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              style={styles.pdfObject}
              title={caseStudy.title}
              onError={() => setPdfError(true)}
            >
              <p style={{ padding: 24 }}>
                Your browser does not support inline PDFs.{' '}
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  Click here to open the PDF.
                </a>
              </p>
            </iframe>
          </object>
        )}
      </div>
    </div>
  );
};

// ── Styles ───────────────────────────────────────────────────────
const getStyles = (darkMode) => ({
  page: {
    minHeight: '100vh',
    background: darkMode ? '#0f172a' : '#f0f2f5',
    display: 'flex',
    flexDirection: 'column',
  },
  fullPage: {
    minHeight: '100vh',
    background: darkMode ? '#0f172a' : '#f0f2f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerWrap: {
    textAlign: 'center',
  },
  spinner: {
    width: 44,
    height: 44,
    border: `4px solid ${darkMode ? '#334155' : '#e8e8e8'}`,
    borderTop: '4px solid #0AAEEF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 16px',
  },
  spinnerText: {
    color: darkMode ? '#94a3b8' : '#8c8c8c',
    fontSize: 15,
  },
  errorBox: {
    background: darkMode ? '#1e293b' : '#fff',
    borderRadius: 16,
    padding: '48px 40px',
    textAlign: 'center',
    maxWidth: 420,
    width: '100%',
    boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.08)',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: darkMode ? '#f1f5f9' : '#0D2B4E',
    margin: '0 0 10px',
  },
  errorMsg: {
    fontSize: 15,
    color: darkMode ? '#cbd5e1' : '#6b7280',
    lineHeight: 1.6,
    margin: '0 0 24px',
  },
  backBtn: {
    padding: '10px 24px',
    background: '#0AAEEF',
    color: '#fff',
    border: 'none',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  topBar: {
    background: darkMode ? '#1e293b' : '#fff',
    borderBottom: darkMode ? '1px solid #334155' : '1px solid #e8e8e8',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
  },
  topBarInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 20px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  topBackBtn: {
    background: 'none',
    border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 13,
    color: darkMode ? '#cbd5e1' : '#595959',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  topMeta: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    overflow: 'hidden',
  },
  typeBadge: {
    background: darkMode ? 'rgba(10, 174, 239, 0.15)' : '#e8f4fd',
    color: '#0AAEEF',
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 12,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  topTitle: {
    fontWeight: 700,
    fontSize: 15,
    color: darkMode ? '#f1f5f9' : '#0D2B4E',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  downloadBtn: {
    padding: '8px 18px',
    background: '#0AAEEF',
    color: '#fff',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 700,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'opacity .2s',
  },
  summaryStrip: {
    background: 'linear-gradient(90deg, #0b2a5e 0%, #0AAEEF 100%)',
    padding: '12px 20px',
  },
  summaryInner: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  summaryText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 1.5,
  },
  summaryDate: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  pdfWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    maxWidth: 1200,
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  pdfObject: {
    width: '100%',
    height: 'calc(100vh - 140px)',
    minHeight: 600,
    border: 'none',
    borderRadius: 12,
    background: darkMode ? '#1e293b' : '#fff',
    boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.10)',
  },
  pdfFallback: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    background: darkMode ? '#1e293b' : '#fff',
    borderRadius: 12,
    boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  pdfFallbackText: {
    fontSize: 15,
    color: darkMode ? '#cbd5e1' : '#6b7280',
    marginBottom: 20,
  },
  openPdfBtn: {
    padding: '12px 28px',
    background: '#0AAEEF',
    color: '#fff',
    borderRadius: 20,
    fontSize: 15,
    fontWeight: 700,
    textDecoration: 'none',
  },
});

// Inject spinner keyframe once
if (typeof document !== 'undefined' && !document.getElementById('cs-spin-style')) {
  const s = document.createElement('style');
  s.id = 'cs-spin-style';
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
}

export default CaseStudyPage;
