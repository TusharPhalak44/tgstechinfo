import React, { useRef, useEffect, useState, useCallback } from 'react';
import { project3D, CONTINENT_POINTS } from './countryCoordinates';

// ── Regional data with lat/lon anchors ──────────────────────────────────────
const REGIONS = [
  { id: 'apac',     label: 'APAC',         lat: 15,   lon: 100,  color: '#0AAEEF', glow: 'rgba(10,174,239,0.7)',   share: 38 },
  { id: 'emea',     label: 'EMEA',         lat: 50,   lon: 15,   color: '#A855F7', glow: 'rgba(168,85,247,0.7)',   share: 28 },
  { id: 'americas', label: 'Americas',     lat: 35,   lon: -95,  color: '#10B981', glow: 'rgba(16,185,129,0.7)',   share: 24 },
  { id: 'latam',    label: 'LatAm',        lat: -15,  lon: -60,  color: '#F59E0B', glow: 'rgba(245,158,11,0.7)',   share: 7  },
  { id: 'mena',     label: 'MENA',         lat: 25,   lon: 45,   color: '#EF4444', glow: 'rgba(239,68,68,0.7)',    share: 3  },
];

// Arc routes (pairs of region ids)
const ARCS = [
  ['apac', 'emea'],
  ['apac', 'americas'],
  ['emea', 'americas'],
  ['latam', 'emea'],
  ['mena', 'apac'],
];

const RegionalTrafficGlobe = ({ countryData = [], darkMode = true }) => {
  const canvasRef  = useRef(null);
  const stateRef   = useRef({
    rotation : 0.4,
    zoom     : 1.0,
    sweep    : 0,
    drag     : { active: false, startX: 0, startRot: 0 },
    particles: [],
    arcProgresses: ARCS.map(() => Math.random()),
    time     : 0,
  });

  const [zoom, setZoom]         = useState(1.0);
  const [isDragging, setIsDrag] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState(null);

  // ── zoom helpers ──────────────────────────────────────────────────────────
  const clampZoom = (z) => Math.max(0.6, Math.min(2.2, z));

  const handleZoomIn  = useCallback(() => {
    const nz = clampZoom(stateRef.current.zoom * 1.15);
    stateRef.current.zoom = nz; setZoom(nz);
  }, []);

  const handleZoomOut = useCallback(() => {
    const nz = clampZoom(stateRef.current.zoom * 0.87);
    stateRef.current.zoom = nz; setZoom(nz);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const nz = clampZoom(stateRef.current.zoom * (delta > 0 ? 0.92 : 1.08));
    stateRef.current.zoom = nz; setZoom(nz);
  }, []);

  // ── drag ─────────────────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e) => {
    canvasRef.current?.setPointerCapture?.(e.pointerId);
    stateRef.current.drag = { active: true, startX: e.clientX, startRot: stateRef.current.rotation };
    setIsDrag(true);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!stateRef.current.drag.active) return;
    const dx = e.clientX - stateRef.current.drag.startX;
    stateRef.current.rotation = stateRef.current.drag.startRot + dx * 0.007;
  }, []);

  const handlePointerUp = useCallback(() => {
    stateRef.current.drag.active = false;
    setIsDrag(false);
  }, []);

  // ── arc drawing helper ────────────────────────────────────────────────────
  const drawArc = useCallback((ctx, p1, p2, progress, color, globeRadius, cx, cy) => {
    if (!p1.isFront || !p2.isFront) return;
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    // Pull control point toward center for a "great circle" feel
    const cpx = cx + (mx - cx) * 0.3;
    const cpy = cy + (my - cy) * 0.3 - globeRadius * 0.25;
    const totalLen = 200; // sample points
    const endIdx = Math.floor(progress * totalLen);

    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= endIdx; i++) {
      const t = i / totalLen;
      const bx = (1-t)*(1-t)*p1.x + 2*(1-t)*t*cpx + t*t*p2.x;
      const by = (1-t)*(1-t)*p1.y + 2*(1-t)*t*cpy + t*t*p2.y;
      if (!started) { ctx.moveTo(bx, by); started = true; }
      else ctx.lineTo(bx, by);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.globalAlpha = 0.55;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Dot at leading edge
    if (endIdx > 0 && endIdx < totalLen) {
      const t = endIdx / totalLen;
      const hx = (1-t)*(1-t)*p1.x + 2*(1-t)*t*cpx + t*t*p2.x;
      const hy = (1-t)*(1-t)*p1.y + 2*(1-t)*t*cpy + t*t*p2.y;
      ctx.beginPath();
      ctx.arc(hx, hy, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur  = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, []);

  // ── main render loop ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Init particles
    if (!stateRef.current.particles.length) {
      stateRef.current.particles = Array.from({ length: 35 }, () => ({
        x: Math.random(), y: Math.random(),
        size: Math.random() * 1.4 + 0.5,
        speed: Math.random() * 0.0003 + 0.0001,
        alpha: Math.random() * 0.4 + 0.15,
      }));
    }

    let isActive = true;
    let lastHovered = null;

    const render = () => {
      if (!isActive) return;

      const rect   = canvas.getBoundingClientRect();
      const dpr    = window.devicePixelRatio || 1;
      const W      = rect.width;
      const H      = rect.height;

      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width  = W * dpr;
        canvas.height = H * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const s  = stateRef.current;

      if (!s.drag.active) s.rotation += 0.0015;
      s.sweep  = (s.sweep + 0.014) % (Math.PI * 2);
      s.time  += 0.016;

      // Update arc progresses
      s.arcProgresses = s.arcProgresses.map((p) => {
        const next = p + 0.004;
        return next > 1 ? 0 : next;
      });

      const baseR     = Math.min(W, H) * 0.38;
      const globeR    = baseR * s.zoom;
      const rot       = s.rotation;

      // ── Particles ──────────────────────────────────────────────────────
      s.particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) p.y = 1;
        ctx.fillStyle = darkMode
          ? `rgba(10,174,239,${p.alpha * 0.35})`
          : `rgba(2,132,199,${p.alpha * 0.2})`;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── Globe base sphere ───────────────────────────────────────────────
      const grad = ctx.createRadialGradient(cx - globeR * 0.2, cy - globeR * 0.2, globeR * 0.05, cx, cy, globeR);
      if (darkMode) {
        grad.addColorStop(0, 'rgba(14,30,60,0.9)');
        grad.addColorStop(0.65, 'rgba(7,16,36,0.95)');
        grad.addColorStop(1, 'rgba(3,8,20,0.99)');
      } else {
        grad.addColorStop(0, 'rgba(232,246,255,0.95)');
        grad.addColorStop(0.65, 'rgba(210,236,255,0.97)');
        grad.addColorStop(1, 'rgba(186,226,253,0.99)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, globeR, 0, Math.PI * 2);
      ctx.fill();

      // Rim glow
      ctx.strokeStyle = darkMode ? 'rgba(10,174,239,0.5)' : 'rgba(14,165,233,0.6)';
      ctx.lineWidth   = 2;
      ctx.shadowColor = 'rgba(10,174,239,0.55)';
      ctx.shadowBlur  = 18;
      ctx.stroke();
      ctx.shadowBlur  = 0;

      // Halo
      const halo = ctx.createRadialGradient(cx, cy, globeR * 0.9, cx, cy, globeR * 1.22);
      halo.addColorStop(0, darkMode ? 'rgba(10,174,239,0.18)' : 'rgba(14,165,233,0.12)');
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, globeR * 1.22, 0, Math.PI * 2);
      ctx.fill();

      // ── Wireframe lat/lon ────────────────────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, globeR, 0, Math.PI * 2);
      ctx.clip();

      // Lat lines
      [-60, -30, 0, 30, 60].forEach((lat) => {
        const phi = (lat * Math.PI) / 180;
        const yOff = -globeR * Math.sin(phi);
        const r2   = globeR * Math.cos(phi);
        ctx.strokeStyle = darkMode
          ? lat === 0 ? 'rgba(10,174,239,0.28)' : 'rgba(10,174,239,0.1)'
          : lat === 0 ? 'rgba(2,132,199,0.28)'  : 'rgba(2,132,199,0.12)';
        ctx.lineWidth = lat === 0 ? 1.1 : 0.7;
        ctx.beginPath();
        ctx.ellipse(cx, cy + yOff, r2, r2 * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Lon meridians
      for (let lon = 0; lon < 360; lon += 30) {
        ctx.beginPath();
        let first = true;
        for (let lat = -85; lat <= 85; lat += 5) {
          const pt = project3D(lat, lon, globeR, rot, cx, cy);
          if (pt.isFront) {
            first ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
            first = false;
          } else first = true;
        }
        ctx.strokeStyle = darkMode ? 'rgba(10,174,239,0.1)' : 'rgba(2,132,199,0.13)';
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      // Continent point cloud
      CONTINENT_POINTS.forEach(([cLat, cLon]) => {
        const pt = project3D(cLat, cLon, globeR, rot, cx, cy);
        if (pt.visible) {
          const a = pt.isFront ? 0.55 + pt.depthRatio * 0.35 : 0.12;
          ctx.fillStyle = darkMode ? `rgba(56,189,248,${a})` : `rgba(2,132,199,${a * 0.85})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.isFront ? 1.3 : 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.restore(); // end globe clip

      // ── Radar sweep ──────────────────────────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, globeR, 0, Math.PI * 2);
      ctx.clip();
      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, globeR);
      sweepGrad.addColorStop(0, darkMode ? 'rgba(10,174,239,0.18)' : 'rgba(14,165,233,0.14)');
      sweepGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, globeR, s.sweep - 0.5, s.sweep, false);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // ── Project region positions ─────────────────────────────────────────
      const regionPts = REGIONS.map((r) => ({
        ...r,
        pt: project3D(r.lat, r.lon, globeR, rot, cx, cy),
      }));

      // ── Traffic arcs ─────────────────────────────────────────────────────
      ARCS.forEach(([fromId, toId], i) => {
        const from = regionPts.find((r) => r.id === fromId);
        const to   = regionPts.find((r) => r.id === toId);
        if (from && to) {
          const arcColor = from.color + 'CC';
          drawArc(ctx, from.pt, to.pt, s.arcProgresses[i], arcColor, globeR, cx, cy);
        }
      });

      // ── Region traffic bubbles ────────────────────────────────────────────
      let newHovered = null;
      regionPts.forEach(({ id, label, color, glow, share, pt }) => {
        if (!pt.isFront) return;
        const pulse   = (Math.sin(s.time * 2.2 + share) + 1) / 2;
        const bubbleR = (8 + share * 0.55) * (pt.isFront ? 1 : 0.5);
        const outerR  = bubbleR + 6 + pulse * 10;
        const isHov   = hoveredRegion === id;

        // Outer pulse ring
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, outerR, 0, Math.PI * 2);
        ctx.strokeStyle = color + (isHov ? 'AA' : '55');
        ctx.lineWidth   = isHov ? 2 : 1;
        ctx.stroke();

        // Main filled bubble
        const bGrad = ctx.createRadialGradient(pt.x - bubbleR * 0.3, pt.y - bubbleR * 0.3, 1, pt.x, pt.y, bubbleR);
        bGrad.addColorStop(0, color + 'FF');
        bGrad.addColorStop(0.5, color + 'CC');
        bGrad.addColorStop(1, color + '44');
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, bubbleR, 0, Math.PI * 2);
        ctx.fillStyle = bGrad;
        ctx.shadowColor = glow;
        ctx.shadowBlur  = isHov ? 28 : 14;
        ctx.fill();
        ctx.shadowBlur  = 0;

        // Label
        const fontSize = Math.max(9, Math.min(12, bubbleR * 0.75));
        ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign     = 'center';
        ctx.textBaseline  = 'middle';
        ctx.fillStyle     = '#fff';
        ctx.fillText(`${share}%`, pt.x, pt.y);

        // Floating label above bubble
        if (pt.isFront && (s.zoom > 0.75 || isHov)) {
          const lx = pt.x;
          const ly = pt.y - bubbleR - 14;
          const labelW  = ctx.measureText(label).width + 14;
          const labelH  = 16;

          ctx.fillStyle   = darkMode ? 'rgba(2,8,20,0.75)' : 'rgba(248,250,252,0.88)';
          ctx.strokeStyle = color + '88';
          ctx.lineWidth   = 1;
          ctx.beginPath();
          const r = 6;
          ctx.moveTo(lx - labelW/2 + r, ly - labelH/2);
          ctx.lineTo(lx + labelW/2 - r, ly - labelH/2);
          ctx.quadraticCurveTo(lx + labelW/2, ly - labelH/2, lx + labelW/2, ly - labelH/2 + r);
          ctx.lineTo(lx + labelW/2, ly + labelH/2 - r);
          ctx.quadraticCurveTo(lx + labelW/2, ly + labelH/2, lx + labelW/2 - r, ly + labelH/2);
          ctx.lineTo(lx - labelW/2 + r, ly + labelH/2);
          ctx.quadraticCurveTo(lx - labelW/2, ly + labelH/2, lx - labelW/2, ly + labelH/2 - r);
          ctx.lineTo(lx - labelW/2, ly - labelH/2 + r);
          ctx.quadraticCurveTo(lx - labelW/2, ly - labelH/2, lx - labelW/2 + r, ly - labelH/2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.font      = `700 10px "Plus Jakarta Sans", sans-serif`;
          ctx.fillStyle = color;
          ctx.fillText(label, lx, ly);
        }
      });

      if (newHovered !== lastHovered) {
        lastHovered = newHovered;
        setHoveredRegion(newHovered);
      }

      ctx.restore();
      requestAnimationFrame(render);
    };

    const raf = requestAnimationFrame(render);
    return () => {
      isActive = false;
      cancelAnimationFrame(raf);
    };
  }, [darkMode, drawArc]);

  // ── compute top countries from countryData for sidebar ───────────────────
  const topCountries = [...(countryData || [])]
    .sort((a, b) => (b.session_count || 0) - (a.session_count || 0))
    .slice(0, 8);
  const maxSessions = topCountries[0]?.session_count || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Globe panel */}
      <div
        className="radar-glass-panel regional-globe-panel"
        style={{ position: 'relative', width: '100%', overflow: 'hidden' }}
      >
        <style>{`
          @media (max-width: 600px) {
            .regional-globe-panel {
              min-height: 350px !important;
            }
            .regional-globe-panel .globe-canvas {
              min-height: 300px !important;
            }
          }
          @media (max-width: 480px) {
            .regional-globe-panel {
              min-height: 300px !important;
            }
            .regional-globe-panel .globe-canvas {
              min-height: 250px !important;
            }
          }
        `}</style>
        {/* Header */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: darkMode ? '1px solid rgba(10,174,239,0.12)' : '1px solid rgba(14,165,233,0.15)',
          backdropFilter: 'blur(8px)',
          background: darkMode ? 'rgba(7,16,36,0.55)' : 'rgba(248,250,252,0.75)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0AAEEF', boxShadow: '0 0 8px #0AAEEF', display: 'inline-block' }} />
            <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: darkMode ? '#67E8F9' : '#0369A1' }}>
              REGIONAL TRAFFIC GLOBE
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              background: darkMode ? 'rgba(10,174,239,0.15)' : 'rgba(10,174,239,0.1)',
              color: darkMode ? '#38BDF8' : '#0284C7',
              border: darkMode ? '1px solid rgba(10,174,239,0.3)' : '1px solid rgba(10,174,239,0.25)',
              fontFamily: 'monospace',
            }}>
              LIVE
            </span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: darkMode ? '#475569' : '#94A3B8' }}>
            DRAG TO ROTATE · SCROLL TO ZOOM
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className="globe-canvas"
          style={{ width: '100%', height: '100%', touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab', display: 'block' }}
        />

        {/* Zoom Controls */}
        <div style={{
          position: 'absolute', right: 16, bottom: 16, zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {[{ label: '+', action: handleZoomIn }, { label: '−', action: handleZoomOut }].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: darkMode ? 'rgba(10,174,239,0.15)' : 'rgba(10,174,239,0.1)',
                border: darkMode ? '1px solid rgba(10,174,239,0.35)' : '1px solid rgba(10,174,239,0.3)',
                color: darkMode ? '#38BDF8' : '#0284C7',
                fontSize: 18, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(10,174,239,0.28)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = darkMode ? 'rgba(10,174,239,0.15)' : 'rgba(10,174,239,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {label}
            </button>
          ))}
          {/* Zoom indicator */}
          <div style={{
            textAlign: 'center', fontFamily: 'monospace', fontSize: 9,
            color: darkMode ? '#475569' : '#94A3B8', marginTop: 2,
          }}>
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Region legend */}
        <div style={{
          position: 'absolute', left: 14, bottom: 14, zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: 5,
          backdropFilter: 'blur(8px)',
          background: darkMode ? 'rgba(2,8,20,0.65)' : 'rgba(248,250,252,0.85)',
          border: darkMode ? '1px solid rgba(10,174,239,0.15)' : '1px solid rgba(14,165,233,0.2)',
          borderRadius: 10, padding: '8px 12px',
        }}>
          {REGIONS.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, boxShadow: `0 0 6px ${r.glow}`, flexShrink: 0 }} />
              <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, color: darkMode ? '#94A3B8' : '#64748B' }}>
                {r.label}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: r.color, marginLeft: 'auto' }}>
                {r.share}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Country breakdown bar */}
      {topCountries.length > 0 && (
        <div className="radar-glass-panel" style={{ padding: '18px 20px', marginTop: 16 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: darkMode ? '#38BDF8' : '#0284C7', marginBottom: 14 }}>
            TOP COUNTRIES BY SESSIONS
          </div>
          <div className="country-breakdown-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <style>{`
              @media (max-width: 600px) {
                .country-breakdown-list .country-name {
                  width: 80px !important;
                  font-size: 10px !important;
                }
                .country-breakdown-list .country-sessions {
                  width: 36px !important;
                  font-size: 9px !important;
                }
              }
              @media (max-width: 480px) {
                .country-breakdown-list .country-name {
                  width: 60px !important;
                  font-size: 9px !important;
                }
                .country-breakdown-list .country-sessions {
                  width: 32px !important;
                  font-size: 8px !important;
                }
              }
            `}</style>
            {topCountries.map((c, i) => {
              const pct = Math.round(((c.session_count || 1) / maxSessions) * 100);
              const colors = ['#0AAEEF','#A855F7','#10B981','#F59E0B','#EF4444','#06B6D4','#F97316','#8B5CF6'];
              return (
                <div key={c.country || i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: darkMode ? '#94A3B8' : '#64748B', width: 24, textAlign: 'right' }}>
                    {i + 1}
                  </span>
                  <span className="country-name" style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: darkMode ? '#E2E8F0' : '#1E293B', width: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.country || 'Unknown'}
                  </span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: darkMode ? '#1E293B' : '#E2E8F0', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: 3,
                      background: colors[i % colors.length],
                      transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    }} />
                  </div>
                  <span className="country-sessions" style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: colors[i % colors.length], width: 48, textAlign: 'right' }}>
                    {(c.session_count || 0).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionalTrafficGlobe;
