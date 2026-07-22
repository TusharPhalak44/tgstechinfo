import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { ArrowLeftOutlined } from '@ant-design/icons';

const CaseStudyPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [caseStudy, setCaseStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    if (!slug) { setError('Invalid case study.'); setLoading(false); return; }

    axios.get(`/api/public/case-study/${slug}`)
      .then(r => {
        setCaseStudy(r.data?.data || null);
        if (!r.data?.data) setError('Case study not found.');
      })
      .catch(() => setError('Case study not found or has been removed.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const pdfUrl = caseStudy?.pdf_file ? `/uploads/${caseStudy.pdf_file}` : null;

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.fullPage}>
        <div style={styles.spinnerWrap}>
          <div style={styles.spinner} />
          <p style={styles.spinnerText}>Loading case study…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────
  if (error || !caseStudy) {
    return (
      <div style={styles.fullPage}>
        <div style={styles.errorBox}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h2 style={styles.errorTitle}>Oops!</h2>
          <p style={styles.errorMsg}>{error || 'Case study not found.'}</p>
          <button style={styles.backBtn} onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── No PDF ───────────────────────────────────────────────────────
  if (!pdfUrl) {
    return (
      <div style={styles.fullPage}>
        <div style={styles.errorBox}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <h2 style={styles.errorTitle}>PDF Not Available</h2>
          <p style={styles.errorMsg}>
            The PDF for <strong>{caseStudy.case_study_headline || caseStudy.title}</strong> hasn't been attached yet.
            Please check back soon.
          </p>
          <button style={styles.backBtn} onClick={() => navigate('/')}>
            ← Back to Home
          </button>
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
const styles = {
  page: {
    minHeight: '100vh',
    background: '#f0f2f5',
    display: 'flex',
    flexDirection: 'column',
  },
  fullPage: {
    minHeight: '100vh',
    background: '#f0f2f5',
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
    border: '4px solid #e8e8e8',
    borderTop: '4px solid #0AAEEF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 16px',
  },
  spinnerText: {
    color: '#8c8c8c',
    fontSize: 15,
  },
  errorBox: {
    background: '#fff',
    borderRadius: 16,
    padding: '48px 40px',
    textAlign: 'center',
    maxWidth: 420,
    width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#0D2B4E',
    margin: '0 0 10px',
  },
  errorMsg: {
    fontSize: 15,
    color: '#6b7280',
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
    background: '#fff',
    borderBottom: '1px solid #e8e8e8',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
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
    border: '1px solid #e8e8e8',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 13,
    color: '#595959',
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
    background: '#e8f4fd',
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
    color: '#0D2B4E',
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
    background: '#fff',
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
  },
  pdfFallback: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  pdfFallbackText: {
    fontSize: 15,
    color: '#6b7280',
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
};

// Inject spinner keyframe once
if (typeof document !== 'undefined' && !document.getElementById('cs-spin-style')) {
  const s = document.createElement('style');
  s.id = 'cs-spin-style';
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
}

export default CaseStudyPage;
