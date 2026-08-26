import React, { useState, useEffect, useRef } from 'react';

/* ════════════════════════════════════════════════════════════════════
   TGS TECH INFO — PRECISION MECHANICAL PIPELINE ANIMATION
   Industrial Content-to-Lead Automation Engine & Workflow
════════════════════════════════════════════════════════════════════ */

const TOTAL_CYCLE_MS = 15000; // 15 seconds full loop

export default function SaaSLeadJourneyAnimation() {
  const [activeStep, setActiveStep] = useState(0); // 0 to 6 (7 nodes)
  const [packetProgress, setPacketProgress] = useState(0); // 0 to 100% across the pipeline
  const [isRevisionActive, setIsRevisionActive] = useState(false);
  const [isManualPause, setIsManualPause] = useState(false);
  const startTimeRef = useRef(Date.now());
  const reqAnimRef = useRef(null);

  // Synchronized continuous loop clock
  useEffect(() => {
    const loop = () => {
      if (!isManualPause) {
        const elapsed = (Date.now() - startTimeRef.current) % TOTAL_CYCLE_MS;
        const progress = elapsed / TOTAL_CYCLE_MS; // 0.0 to 1.0
        setPacketProgress(progress * 100);

        // 7 stages mapped across 15 seconds
        // Stage 0: 0.00 - 0.14 (Create Content)
        // Stage 1: 0.14 - 0.28 (Editorial Review + Revision check)
        // Stage 2: 0.28 - 0.42 (Approval & Publish Gate)
        // Stage 3: 0.42 - 0.57 (Reach Target Audience)
        // Stage 4: 0.57 - 0.71 (Engage & Capture Leads)
        // Stage 5: 0.71 - 0.85 (Track Performance)
        // Stage 6: 0.85 - 1.00 (Grow Your Business)
        const stepIdx = Math.min(6, Math.floor(progress * 7));
        setActiveStep(stepIdx);

        // Show brief revision branch pulse during Stage 1
        setIsRevisionActive(progress >= 0.20 && progress <= 0.25);
      }
      reqAnimRef.current = requestAnimationFrame(loop);
    };

    reqAnimRef.current = requestAnimationFrame(loop);
    return () => {
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
    };
  }, [isManualPause]);

  const handleSelectNode = (idx) => {
    setActiveStep(idx);
    setIsManualPause(true);
    setTimeout(() => setIsManualPause(false), 5000);
  };

  return (
    <>
      <style>{mechanicalStyles}</style>
      <div className="mech-stage-root" aria-label="TGS Mechanical Content Engine">
        {/* Technical Blueprint Grid & HUD Overlays */}
        <div className="mech-grid" />
        <div className="mech-scanline" />
        <div className="mech-vignette" />

        {/* Centered Animated Heading */}
        <div className="mech-top-hud">
          <div className="mech-brand-badge-center">
            <span className="mech-live-led" />
            <span className="mech-badge-txt-animated">TGS CONTENT-TO-LEAD PIPELINE</span>
            <span className="mech-live-led orange" />
          </div>
        </div>

        {/* ══ MAIN MECHANICAL PIPELINE CANVAS ══ */}
        <div className="mech-canvas">
          <svg className="mech-svg-conduits" viewBox="0 0 480 640" preserveAspectRatio="xMidYMid meet">
            <defs>
              {/* Glow Filters */}
              <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Linear Gradients */}
              <linearGradient id="pipe-grad-active" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#F7941D" stopOpacity="1" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.9" />
              </linearGradient>

              {/* Chevron Flow Marker Pattern */}
              <pattern id="chevron-flow" width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M4,2 L10,8 L4,14" fill="none" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1.5" />
              </pattern>
            </defs>

            {/* ── CONDUIT PATHS (Physical pipeline connecting the nodes) ── */}
            {/* Primary Mainline Path */}
            <path
              d="M 120,70 L 360,70 Q 390,70 390,105 L 390,135 Q 390,165 360,165 L 120,165 Q 90,165 90,195 L 90,230 Q 90,260 120,260 L 360,260 Q 390,260 390,290 L 390,325 Q 390,355 360,355 L 120,355 Q 90,355 90,385 L 90,420 Q 90,450 120,450 L 360,450 Q 390,450 390,480 L 390,515 Q 390,545 360,545 L 240,545"
              fill="none"
              stroke="#0f1f3d"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Pipe Track Interior */}
            <path
              d="M 120,70 L 360,70 Q 390,70 390,105 L 390,135 Q 390,165 360,165 L 120,165 Q 90,165 90,195 L 90,230 Q 90,260 120,260 L 360,260 Q 390,260 390,290 L 390,325 Q 390,355 360,355 L 120,355 Q 90,355 90,385 L 90,420 Q 90,450 120,450 L 360,450 Q 390,450 390,480 L 390,515 Q 390,545 360,545 L 240,545"
              fill="none"
              stroke="#1e3a6a"
              strokeWidth="3"
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* ── BRANCHING REVISION FEEDBACK LOOP (Node 2 to Node 1) ── */}
            <g opacity={isRevisionActive ? 1 : 0.25} style={{ transition: 'opacity 0.4s ease' }}>
              <path
                d="M 320,135 Q 240,115 160,95"
                fill="none"
                stroke={isRevisionActive ? '#F59E0B' : '#334155'}
                strokeWidth="2"
                strokeDasharray="3 3"
                filter={isRevisionActive ? 'url(#glow-orange)' : 'none'}
              />
              {isRevisionActive && (
                <g transform="translate(230, 108)">
                  <rect x="-42" y="-10" width="84" height="20" rx="4" fill="#0b1329" stroke="#F59E0B" strokeWidth="1" />
                  <text x="0" y="3" fill="#F59E0B" fontSize="8" fontWeight="700" textAnchor="middle" letterSpacing="0.5">
                    ↻ REVISION LOOP
                  </text>
                </g>
              )}
            </g>

            {/* ── PHYSICAL DATA PACKET TRAVELING THE CONDUIT ── */}
            <g>
              <circle
                r="6"
                fill="#ffffff"
                filter="url(#glow-orange)"
                style={{
                  offsetPath: `path('M 120,70 L 360,70 Q 390,70 390,105 L 390,135 Q 390,165 360,165 L 120,165 Q 90,165 90,195 L 90,230 Q 90,260 120,260 L 360,260 Q 390,260 390,290 L 390,325 Q 390,355 360,355 L 120,355 Q 90,355 90,385 L 90,420 Q 90,450 120,450 L 360,450 Q 390,450 390,480 L 390,515 Q 390,545 360,545 L 240,545')`,
                  offsetDistance: `${packetProgress}%`,
                }}
              />
              <rect
                x="-12"
                y="-7"
                width="24"
                height="14"
                rx="3"
                fill="#F7941D"
                stroke="#ffffff"
                strokeWidth="1.5"
                filter="url(#glow-orange)"
                style={{
                  offsetPath: `path('M 120,70 L 360,70 Q 390,70 390,105 L 390,135 Q 390,165 360,165 L 120,165 Q 90,165 90,195 L 90,230 Q 90,260 120,260 L 360,260 Q 390,260 390,290 L 390,325 Q 390,355 360,355 L 120,355 Q 90,355 90,385 L 90,420 Q 90,450 120,450 L 360,450 Q 390,450 390,480 L 390,515 Q 390,545 360,545 L 240,545')`,
                  offsetDistance: `${packetProgress}%`,
                  offsetRotate: 'auto',
                }}
              />
            </g>
          </svg>

          {/* ════ 7 PRECISION INDUSTRIAL NODES ════ */}

          {/* ── NODE 01: CREATE CONTENT ── */}
          <div
            className={`mech-node-module node-pos-1 ${activeStep === 0 ? 'active' : activeStep > 0 ? 'completed' : ''}`}
            onClick={() => handleSelectNode(0)}
          >
            <div className="mech-gear-box">
              <div className="mech-rot-gear gear-left gear-indigo" />
            </div>
            <div className="mech-node-inner">
              <div className="mech-node-top-bar">
                <span className="mech-tag">NODE 01</span>
                <span className="mech-status-pill">{activeStep === 0 ? 'PROCESSING' : activeStep > 0 ? 'READY' : 'STANDBY'}</span>
              </div>
              <div className="mech-title-row">
                <span className="mech-icon-wrap">✍️</span>
                <span className="mech-title">Create Content</span>
              </div>
              <div className="mech-desc">Blogs • Articles • Whitepapers • Case Studies</div>
              {/* Assembling text/document visual */}
              <div className="mech-doc-preview">
                <div className="mech-doc-line w-80" />
                <div className="mech-doc-line w-60" />
                <div className="mech-doc-line w-40" />
              </div>
            </div>
          </div>

          {/* ── NODE 02: EDITORIAL REVIEW (With Scanner & Quality Gate) ── */}
          <div
            className={`mech-node-module node-pos-2 ${activeStep === 1 ? 'active' : activeStep > 1 ? 'completed' : ''}`}
            onClick={() => handleSelectNode(1)}
          >
            {activeStep === 1 && <div className="mech-laser-scanner" />}
            <div className="mech-node-inner">
              <div className="mech-node-top-bar">
                <span className="mech-tag">NODE 02</span>
                <span className="mech-status-pill">{activeStep === 1 ? 'SCANNING' : activeStep > 1 ? 'REVIEWED' : 'STANDBY'}</span>
              </div>
              <div className="mech-title-row">
                <span className="mech-icon-wrap">🔍</span>
                <span className="mech-title">Editorial Review</span>
              </div>
              <div className="mech-desc">Quality • Relevance • Compliance Inspection</div>
              <div className="mech-badge-row">
                <span className="mech-mini-badge">Policy: PASS</span>
                <span className="mech-mini-badge">SEO: 98%</span>
              </div>
            </div>
          </div>

          {/* ── NODE 03: APPROVAL & PUBLISH (With Mechanical Gate Actuator) ── */}
          <div
            className={`mech-node-module node-pos-3 ${activeStep === 2 ? 'active' : activeStep > 2 ? 'completed' : ''}`}
            onClick={() => handleSelectNode(2)}
          >
            <div className="mech-gear-box">
              <div className="mech-rot-gear gear-right gear-green" />
            </div>
            <div className="mech-node-inner">
              <div className="mech-node-top-bar">
                <span className="mech-tag">NODE 03</span>
                <span className="mech-status-pill">{activeStep === 2 ? 'PUBLISHING' : activeStep > 2 ? 'LIVE' : 'LOCKED'}</span>
              </div>
              <div className="mech-title-row">
                <span className="mech-icon-wrap">🚀</span>
                <span className="mech-title">Approval & Publish</span>
              </div>
              <div className="mech-desc">Approved content goes live to global edge</div>
              <div className="mech-actuator-bar">
                <div className="mech-actuator-fill" style={{ width: activeStep >= 2 ? '100%' : '0%' }} />
              </div>
            </div>
          </div>

          {/* ── NODE 04: REACH TARGET AUDIENCE (Multi-Node Network Switch) ── */}
          <div
            className={`mech-node-module node-pos-4 ${activeStep === 3 ? 'active' : activeStep > 3 ? 'completed' : ''}`}
            onClick={() => handleSelectNode(3)}
          >
            <div className="mech-node-inner">
              <div className="mech-node-top-bar">
                <span className="mech-tag">NODE 04</span>
                <span className="mech-status-pill">{activeStep === 3 ? 'BROADCASTING' : activeStep > 3 ? 'CONNECTED' : 'STANDBY'}</span>
              </div>
              <div className="mech-title-row">
                <span className="mech-icon-wrap">🌐</span>
                <span className="mech-title">Reach Target Audience</span>
              </div>
              <div className="mech-desc">Connect with relevant tech audiences & B2B buyers</div>
              {/* Audience Multi-Node Array */}
              <div className="mech-audience-array">
                <span className={`mech-aud-dot ${activeStep >= 3 ? 'lit' : ''}`}>👥 Tech CIOs</span>
                <span className={`mech-aud-dot ${activeStep >= 3 ? 'lit' : ''}`}>💻 Engineers</span>
                <span className={`mech-aud-dot ${activeStep >= 3 ? 'lit' : ''}`}>📊 Founders</span>
              </div>
            </div>
          </div>

          {/* ── NODE 05: ENGAGE & CAPTURE LEADS (High-Intent Conversion Station) ── */}
          <div
            className={`mech-node-module node-pos-5 ${activeStep === 4 ? 'active' : activeStep > 4 ? 'completed' : ''}`}
            onClick={() => handleSelectNode(4)}
          >
            <div className="mech-node-inner">
              <div className="mech-node-top-bar">
                <span className="mech-tag">NODE 05</span>
                <span className="mech-status-pill highlight">{activeStep === 4 ? 'CAPTURING...' : activeStep > 4 ? 'LEAD CAPTURED' : 'ARMED'}</span>
              </div>
              <div className="mech-title-row">
                <span className="mech-icon-wrap">📋</span>
                <span className="mech-title">Engage & Capture Leads</span>
              </div>
              <div className="mech-desc">In-article Forms • Consultation Requests • Inquiries</div>
              <div className="mech-form-preview">
                <div className="mech-form-field"><span>Name:</span> <b>Sarah J. (CTO)</b></div>
                <div className="mech-form-field"><span>Intent:</span> <b style={{ color: '#F7941D' }}>Request Demo ✓</b></div>
              </div>
            </div>
          </div>

          {/* ── NODE 06: TRACK PERFORMANCE (Telemetry Control Hub) ── */}
          <div
            className={`mech-node-module node-pos-6 ${activeStep === 5 ? 'active' : activeStep > 5 ? 'completed' : ''}`}
            onClick={() => handleSelectNode(5)}
          >
            <div className="mech-node-inner">
              <div className="mech-node-top-bar">
                <span className="mech-tag">NODE 06</span>
                <span className="mech-status-pill">{activeStep === 5 ? 'METRICS LIVE' : activeStep > 5 ? 'SYNCED' : 'STANDBY'}</span>
              </div>
              <div className="mech-title-row">
                <span className="mech-icon-wrap">📈</span>
                <span className="mech-title">Track Performance</span>
              </div>
              <div className="mech-desc">Real-time Views • Engagement • Inbound Pipeline</div>
              {/* Dynamic Rising Bar Chart */}
              <div className="mech-chart-box">
                <div className="mech-chart-bar b1" style={{ height: activeStep >= 5 ? '75%' : '25%' }}><span>VIEWS ↑</span></div>
                <div className="mech-chart-bar b2" style={{ height: activeStep >= 5 ? '90%' : '35%' }}><span>ENGAGED ↑</span></div>
                <div className="mech-chart-bar b3" style={{ height: activeStep >= 5 ? '100%' : '45%' }}><span>LEADS ↑</span></div>
              </div>
            </div>
          </div>

          {/* ── NODE 07: GROW YOUR BUSINESS (Final Output / Revenue Acceleration) ── */}
          <div
            className={`mech-node-module node-pos-7 ${activeStep === 6 ? 'active' : ''}`}
            onClick={() => handleSelectNode(6)}
          >
            <div className="mech-gear-box">
              <div className="mech-rot-gear gear-center gear-orange" />
            </div>
            <div className="mech-node-inner final-glow">
              <div className="mech-node-top-bar">
                <span className="mech-tag final">OUTPUT ACCELERATOR</span>
                <span className="mech-status-pill final">ROI +450%</span>
              </div>
              <div className="mech-title-row">
                <span className="mech-icon-wrap">🏆</span>
                <span className="mech-title final-txt">Grow Your Business</span>
              </div>
              <div className="mech-desc">Turn qualified leads into high-value client contracts</div>
              <div className="mech-output-banner">
                <span>CONTENT</span>
                <span className="mech-arrow-pulse">➔➔</span>
                <b>BUSINESS OPPORTUNITY</b>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Control Center Footer */}
        <div className="mech-footer">
          <div className="mech-footer-left">
            <span className="mech-ctrl-icon">⚙️</span>
            <div>
              <div className="mech-ctrl-title">TGS AUTOMATION ENGINE</div>
              <div className="mech-ctrl-sub">Turn Content Into Qualified Inbound Leads</div>
            </div>
          </div>
          <div className="mech-timeline-bar">
            <div className="mech-timeline-fill" style={{ width: `${packetProgress}%` }} />
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PRECISION MECHANICAL CSS STYLES
════════════════════════════════════════════════════════════════════ */
const mechanicalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

  .mech-stage-root {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    background: linear-gradient(175deg, #030714 0%, #060e24 45%, #02050e 100%);
    position: relative;
    overflow: hidden;
    color: #ffffff;
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 14px 18px 12px;
    user-select: none;
  }

  /* Technical Blueprint Grid */
  .mech-grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
  }

  /* Moving Scanline */
  .mech-scanline {
    position: absolute;
    top: 0; left: 0; right: 0; height: 120px;
    background: linear-gradient(180deg, transparent 0%, rgba(56, 189, 248, 0.03) 50%, transparent 100%);
    animation: scanMove 10s linear infinite;
    pointer-events: none;
  }
  @keyframes scanMove {
    0% { transform: translateY(-120px); }
    100% { transform: translateY(100vh); }
  }

  .mech-vignette {
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 100px rgba(0,0,0,0.85);
    pointer-events: none;
  }

  /* ══ Centered Animated Heading ══ */
  .mech-top-hud {
    position: relative;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 0 10px;
    margin-bottom: 6px;
    flex-shrink: 0;
  }

  .mech-brand-badge-center {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(11, 20, 44, 0.95) 100%);
    border: 1.5px solid rgba(56, 189, 248, 0.3);
    backdrop-filter: blur(16px);
    padding: 6px 20px;
    border-radius: 100px;
    box-shadow: 
      0 0 24px rgba(56, 189, 248, 0.2),
      0 8px 24px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    animation: badgeBreathing 4s ease-in-out infinite alternate;
  }

  @keyframes badgeBreathing {
    0% {
      border-color: rgba(56, 189, 248, 0.3);
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.15), 0 8px 20px rgba(0, 0, 0, 0.4);
    }
    100% {
      border-color: rgba(247, 148, 29, 0.45);
      box-shadow: 0 0 30px rgba(247, 148, 29, 0.25), 0 10px 28px rgba(0, 0, 0, 0.6);
    }
  }

  .mech-live-led {
    width: 7px; height: 7px; border-radius: 50%;
    background: #38BDF8;
    box-shadow: 0 0 10px #38BDF8;
    animation: ledPulse 1.4s infinite;
  }
  .mech-live-led.orange {
    background: #F7941D;
    box-shadow: 0 0 10px #F7941D;
    animation: ledPulse 1.4s infinite reverse;
  }

  @keyframes ledPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(1.4); }
  }

  .mech-badge-txt-animated {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    background: linear-gradient(90deg, #38BDF8 0%, #ffffff 30%, #F7941D 70%, #38BDF8 100%);
    background-size: 200% auto;
    color: transparent;
    -webkit-background-clip: text;
    background-clip: text;
    animation: textShine 4s linear infinite;
  }

  @keyframes textShine {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }

  /* ══ Canvas Layout ══ */
  .mech-canvas {
    position: relative;
    flex: 1;
    min-height: 0;
    width: 100%;
    z-index: 10;
  }

  .mech-svg-conduits {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2;
  }

  /* ══ Industrial Node Modules ══ */
  .mech-node-module {
    position: absolute;
    width: 200px;
    border-radius: 12px;
    background: rgba(11, 20, 44, 0.85);
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(16px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
    z-index: 15;
  }

  /* Positions aligned along the S-curve pipeline */
  .node-pos-1 { top: 3%;  left: 2%; }
  .node-pos-2 { top: 17%; right: 2%; }
  .node-pos-3 { top: 32%; left: 2%; }
  .node-pos-4 { top: 46%; right: 2%; }
  .node-pos-5 { top: 60%; left: 2%; }
  .node-pos-6 { top: 74%; right: 2%; }
  .node-pos-7 { bottom: 2%; left: 22%; width: 260px; }

  /* Active Node State */
  .mech-node-module.active {
    border-color: #F7941D;
    background: rgba(16, 28, 62, 0.95);
    box-shadow: 0 0 25px rgba(247, 148, 29, 0.4), 0 12px 35px rgba(0, 0, 0, 0.8);
    transform: scale(1.04);
    z-index: 25;
  }

  .mech-node-module.completed {
    border-color: rgba(16, 185, 129, 0.4);
    background: rgba(10, 24, 42, 0.8);
  }

  .mech-node-inner {
    padding: 9px 12px;
    position: relative;
    overflow: hidden;
  }

  .mech-node-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  .mech-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.52rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 0.05em;
  }
  .mech-tag.final {
    color: #F7941D;
  }

  .mech-status-pill {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.5rem;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    color: #94A3B8;
  }
  .mech-node-module.active .mech-status-pill {
    background: rgba(247, 148, 29, 0.2);
    color: #F7941D;
    border: 1px solid rgba(247, 148, 29, 0.35);
  }
  .mech-node-module.completed .mech-status-pill {
    background: rgba(16, 185, 129, 0.15);
    color: #34D399;
  }

  .mech-title-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 2px;
  }
  .mech-icon-wrap {
    font-size: 0.85rem;
  }
  .mech-title {
    font-size: 0.78rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.01em;
  }
  .mech-title.final-txt {
    color: #F7941D;
  }

  .mech-desc {
    font-size: 0.58rem;
    color: rgba(255, 255, 255, 0.55);
    line-height: 1.25;
    margin-bottom: 5px;
  }

  /* Micro Visual Details inside nodes */
  .mech-doc-preview {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 4px;
  }
  .mech-doc-line {
    height: 2px;
    background: rgba(56, 189, 248, 0.3);
    border-radius: 2px;
  }
  .w-80 { width: 80%; }
  .w-60 { width: 60%; }
  .w-40 { width: 40%; }

  /* Laser scanner at review step */
  .mech-laser-scanner {
    position: absolute;
    top: 0; left: 0; right: 0; height: 2px;
    background: #F59E0B;
    box-shadow: 0 0 10px #F59E0B, 0 0 20px #F59E0B;
    animation: scanNode 1.2s ease-in-out infinite alternate;
    z-index: 20;
  }
  @keyframes scanNode {
    0% { top: 0; }
    100% { top: 100%; }
  }

  .mech-badge-row {
    display: flex; gap: 4px;
  }
  .mech-mini-badge {
    font-size: 0.5rem;
    font-family: 'JetBrains Mono', monospace;
    padding: 1px 5px;
    border-radius: 3px;
    background: rgba(16, 185, 129, 0.15);
    color: #34D399;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .mech-actuator-bar {
    width: 100%; height: 3px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 2px; overflow: hidden;
  }
  .mech-actuator-fill {
    height: 100%;
    background: linear-gradient(90deg, #10B981, #06B6D4);
    transition: width 0.4s ease;
  }

  .mech-audience-array {
    display: flex; gap: 4px; flex-wrap: wrap;
  }
  .mech-aud-dot {
    font-size: 0.5rem;
    padding: 1px 5px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.4);
    transition: all 0.3s ease;
  }
  .mech-aud-dot.lit {
    background: rgba(6, 182, 212, 0.2);
    color: #38BDF8;
    border: 1px solid rgba(6, 182, 212, 0.35);
  }

  .mech-form-preview {
    font-size: 0.55rem;
    background: rgba(0, 0, 0, 0.35);
    padding: 3px 6px;
    border-radius: 4px;
    border-left: 2px solid #F7941D;
  }
  .mech-form-field {
    display: flex; justify-content: space-between;
    line-height: 1.3;
  }

  .mech-chart-box {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 28px;
    background: rgba(0, 0, 0, 0.25);
    padding: 3px 6px;
    border-radius: 4px;
  }
  .mech-chart-bar {
    flex: 1;
    background: linear-gradient(180deg, #38BDF8 0%, #1e3a6a 100%);
    border-radius: 2px 2px 0 0;
    transition: height 0.5s ease;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }
  .mech-chart-bar.b2 { background: linear-gradient(180deg, #818CF8 0%, #1e3a6a 100%); }
  .mech-chart-bar.b3 { background: linear-gradient(180deg, #F7941D 0%, #1e3a6a 100%); }
  .mech-chart-bar span {
    font-size: 0.42rem;
    font-weight: 800;
    color: #ffffff;
    transform: scale(0.85);
    margin-top: 1px;
  }

  .mech-output-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.58rem;
    font-weight: 800;
    background: rgba(247, 148, 29, 0.12);
    border: 1px solid rgba(247, 148, 29, 0.35);
    padding: 4px 8px;
    border-radius: 6px;
    color: #F7941D;
  }
  .mech-arrow-pulse {
    animation: arrowGlider 1s infinite alternate;
  }
  @keyframes arrowGlider {
    0% { transform: translateX(-2px); }
    100% { transform: translateX(2px); }
  }

  /* ══ Mechanical Rotating Gears ══ */
  .mech-gear-box {
    position: absolute;
    pointer-events: none;
    z-index: -1;
  }
  .mech-rot-gear {
    width: 32px; height: 32px;
    border: 3px dashed rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    animation: spinGear 8s linear infinite;
  }
  .gear-left { top: -10px; left: -10px; }
  .gear-right { top: -10px; right: -10px; }
  .gear-center { top: -14px; left: 45%; }
  .gear-indigo { border-color: rgba(99, 102, 241, 0.3); }
  .gear-green  { border-color: rgba(16, 185, 129, 0.3); }
  .gear-orange { border-color: rgba(247, 148, 29, 0.4); }

  .mech-node-module.active .mech-rot-gear {
    animation-duration: 2.5s;
    border-color: #F7941D;
  }

  @keyframes spinGear {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* ══ Footer Control Center ══ */
  .mech-footer {
    position: relative;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    border-radius: 8px;
    flex-shrink: 0;
  }

  .mech-footer-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .mech-ctrl-icon {
    font-size: 1rem;
  }
  .mech-ctrl-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: #ffffff;
  }
  .mech-ctrl-sub {
    font-size: 0.55rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .mech-timeline-bar {
    width: 110px;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }
  .mech-timeline-fill {
    height: 100%;
    background: linear-gradient(90deg, #38BDF8, #F7941D);
    transition: width 0.1s linear;
  }

  @media (max-width: 1200px) {
    .mech-node-module { width: 170px; }
    .node-pos-7 { width: 220px; left: 16%; }
    .mech-title { font-size: 0.72rem; }
    .mech-desc { font-size: 0.52rem; }
  }
`;
