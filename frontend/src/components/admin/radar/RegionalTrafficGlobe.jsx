import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { getDecodedCountries } from '../../audience/worldGeoData';

// ── Spherical 3D Projection Engine ──────────────────────────────────────
function project3D(lat, lon, radius, cx, cy, rotY, rotX = 0) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180) + rotY;

  // 3D Cartesian coordinates on sphere
  let x = -radius * Math.sin(phi) * Math.cos(theta);
  let z =  radius * Math.sin(phi) * Math.sin(theta);
  let y =  radius * Math.cos(phi);

  // Pitch rotation around X-axis
  if (rotX !== 0) {
    const y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
    const z1 = y * Math.sin(rotX) + z * Math.cos(rotX);
    y = y1;
    z = z1;
  }

  // Horizon threshold (smooth edge fade)
  const isFront = z > -radius * 0.12;

  return {
    x: cx + x,
    y: cy - y,
    z,
    isFront,
    depthRatio: Math.max(0, Math.min(1, (z + radius) / (2 * radius)))
  };
}

// Regional data with lat/lon anchors
const REGIONS = [
  { id: 'apac',     label: 'APAC',     lat: 15,   lon: 100,  color: '#0AAEEF', glow: 'rgba(10,174,239,0.7)',   share: 38 },
  { id: 'emea',     label: 'EMEA',     lat: 50,   lon: 15,   color: '#A855F7', glow: 'rgba(168,85,247,0.7)',   share: 28 },
  { id: 'americas', label: 'Americas', lat: 35,   lon: -95,  color: '#10B981', glow: 'rgba(16,185,129,0.7)',   share: 24 },
  { id: 'latam',    label: 'LatAm',    lat: -15,  lon: -60,  color: '#F59E0B', glow: 'rgba(245,158,11,0.7)',   share: 7  },
  { id: 'mena',     label: 'MENA',     lat: 25,   lon: 45,   color: '#EF4444', glow: 'rgba(239,68,68,0.7)',    share: 3  },
];

// Arc routes (pairs of region ids)
const ARCS = [
  ['apac', 'emea'],
  ['apac', 'americas'],
  ['emea', 'americas'],
  ['latam', 'emea'],
  ['mena', 'apac'],
];

// Priority countries to render crisp name tags on globe surface
const PRIORITY_LABELS = new Set([
  'US', 'IN', 'GB', 'DE', 'FR', 'BR', 'CA', 'AU', 'JP', 'CN', 'AE', 'SG', 'ID', 'KR', 'ZA', 'MX', 'EG', 'RU'
]);

const RegionalTrafficGlobe = ({ countryData = [], darkMode = true }) => {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1.0);
  const [isDragging, setIsDrag] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Decoded real GeoJSON country boundaries (from TopoJSON world-110m)
  const countries = useMemo(() => getDecodedCountries(), []);

  // Map country traffic metrics
  const metricsMap = useMemo(() => {
    const map = new Map();
    (countryData || []).forEach((c) => {
      const name = (c.country || c.country_name || '').trim();
      const code = (c.countryCode || c.code || c.iso_code || c.iso2 || '').toUpperCase();
      const count = Number(c.session_count || c.trafficCount || c.sessions || c.total_sessions || 0);
      const payload = { ...c, name, code, count };
      if (code) map.set(code, payload);
      if (name) map.set(name.toLowerCase(), payload);
    });
    return map;
  }, [countryData]);

  // Main interaction state
  const stateRef = useRef({
    rotY: 0.4,
    rotX: 0.2,
    zoom: 1.0,
    sweep: 0,
    drag: { active: false, startX: 0, startY: 0, startRotY: 0, startRotX: 0 },
    particles: [],
    arcProgresses: ARCS.map(() => Math.random()),
    time: 0,
    renderedNodes: [],
    hovered: null,
  });

  // Zoom helpers
  const clampZoom = (z) => Math.max(0.6, Math.min(2.5, z));

  const handleZoomIn = useCallback(() => {
    const nz = clampZoom(stateRef.current.zoom * 1.18);
    stateRef.current.zoom = nz;
    setZoom(nz);
  }, []);

  const handleZoomOut = useCallback(() => {
    const nz = clampZoom(stateRef.current.zoom * 0.85);
    stateRef.current.zoom = nz;
    setZoom(nz);
  }, []);

  const handleWheel = useCallback((e) => {
    if (e.cancelable) e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const nz = clampZoom(stateRef.current.zoom * (delta > 0 ? 0.91 : 1.09));
    stateRef.current.zoom = nz;
    setZoom(nz);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => handleWheel(e);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [handleWheel]);

  // Drag interaction
  const handlePointerDown = useCallback((e) => {
    canvasRef.current?.setPointerCapture?.(e.pointerId);
    stateRef.current.drag = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startRotY: stateRef.current.rotY,
      startRotX: stateRef.current.rotX,
    };
    setIsDrag(true);
  }, []);

  const handlePointerMove = useCallback((e) => {
    const st = stateRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (st.drag.active) {
      const dx = e.clientX - st.drag.startX;
      const dy = e.clientY - st.drag.startY;
      st.rotY = st.drag.startRotY + dx * 0.006;
      st.rotX = Math.max(-0.85, Math.min(0.85, st.drag.startRotX + dy * 0.006));
    } else {
      // Raycasting hit test for closest country under cursor
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const baseR = Math.min(rect.width, rect.height) * 0.38;
      const globeR = baseR * st.zoom;
      const distFromCenter = Math.hypot(mouseX - cx, mouseY - cy);

      if (distFromCenter <= globeR * 1.05 && st.renderedNodes.length > 0) {
        let closest = null;
        let minDist = 35; // Pixel threshold

        st.renderedNodes.forEach((node) => {
          const d = Math.hypot(node.screenX - mouseX, node.screenY - mouseY);
          if (d < minDist) {
            minDist = d;
            closest = node;
          }
        });

        if (closest) {
          st.hovered = closest;
          setHoveredCountry(closest);
          setTooltipPos({ x: mouseX, y: mouseY });
          return;
        }
      }

      st.hovered = null;
      setHoveredCountry(null);
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    stateRef.current.drag.active = false;
    setIsDrag(false);
  }, []);

  // Arc drawing helper
  const drawArc = useCallback((ctx, p1, p2, progress, color, globeRadius, cx, cy) => {
    if (!p1.isFront || !p2.isFront) return;
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const cpx = cx + (mx - cx) * 0.3;
    const cpy = cy + (my - cy) * 0.3 - globeRadius * 0.25;
    const totalLen = 180;
    const endIdx = Math.floor(progress * totalLen);

    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= endIdx; i++) {
      const t = i / totalLen;
      const bx = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * cpx + t * t * p2.x;
      const by = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * cpy + t * t * p2.y;
      if (!started) {
        ctx.moveTo(bx, by);
        started = true;
      } else ctx.lineTo(bx, by);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.55;
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    if (endIdx > 0 && endIdx < totalLen) {
      const t = endIdx / totalLen;
      const hx = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * cpx + t * t * p2.x;
      const hy = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * cpy + t * t * p2.y;
      ctx.beginPath();
      ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!stateRef.current.particles.length) {
      stateRef.current.particles = Array.from({ length: 40 }, () => ({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.0003 + 0.0001,
        alpha: Math.random() * 0.4 + 0.15,
      }));
    }

    let isActive = true;

    const render = () => {
      if (!isActive) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const W = rect.width;
      const H = rect.height;

      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const s = stateRef.current;

      if (!s.drag.active) s.rotY += 0.0015;
      s.sweep = (s.sweep + 0.012) % (Math.PI * 2);
      s.time += 0.016;

      s.arcProgresses = s.arcProgresses.map((p) => {
        const next = p + 0.004;
        return next > 1 ? 0 : next;
      });

      const baseR = Math.min(W, H) * 0.38;
      const globeR = baseR * s.zoom;

      // ── 1. Background Particles ──
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

      // ── 2. Globe Base Sphere ──
      const grad = ctx.createRadialGradient(cx - globeR * 0.2, cy - globeR * 0.2, globeR * 0.05, cx, cy, globeR);
      if (darkMode) {
        grad.addColorStop(0, 'rgba(14,30,60,0.92)');
        grad.addColorStop(0.65, 'rgba(7,16,36,0.96)');
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
      ctx.strokeStyle = darkMode ? 'rgba(10,174,239,0.55)' : 'rgba(14,165,233,0.6)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(10,174,239,0.6)';
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Outer Halo
      const halo = ctx.createRadialGradient(cx, cy, globeR * 0.9, cx, cy, globeR * 1.25);
      halo.addColorStop(0, darkMode ? 'rgba(10,174,239,0.2)' : 'rgba(14,165,233,0.12)');
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, globeR * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // Clip canvas to globe sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, globeR, 0, Math.PI * 2);
      ctx.clip();

      // ── 3. Wireframe Lat / Lon Grid ──
      [-60, -30, 0, 30, 60].forEach((lat) => {
        const phi = (lat * Math.PI) / 180;
        const yOff = -globeR * Math.sin(phi);
        const r2 = globeR * Math.cos(phi);
        ctx.strokeStyle = darkMode
          ? lat === 0 ? 'rgba(10,174,239,0.25)' : 'rgba(10,174,239,0.08)'
          : lat === 0 ? 'rgba(2,132,199,0.25)' : 'rgba(2,132,199,0.1)';
        ctx.lineWidth = lat === 0 ? 1.1 : 0.6;
        ctx.beginPath();
        ctx.ellipse(cx, cy + yOff, r2, r2 * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -80; lat <= 80; lat += 4) {
          const pt = project3D(lat, lon, globeR, cx, cy, s.rotY, s.rotX);
          if (pt.isFront) {
            if (!started) { ctx.moveTo(pt.x, pt.y); started = true; }
            else ctx.lineTo(pt.x, pt.y);
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = darkMode ? 'rgba(10,174,239,0.08)' : 'rgba(2,132,199,0.1)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // ── 4. REAL GEOJSON COUNTRY BOUNDARIES & POLYGONS ──
      const currentNodes = [];

      countries.forEach((country) => {
        const isHovered = s.hovered?.iso2 === country.iso2;
        const metrics = metricsMap.get(country.iso2) || metricsMap.get(country.name.toLowerCase());
        const hasTraffic = !!metrics;

        let strokeColor = darkMode ? 'rgba(56, 189, 248, 0.75)' : 'rgba(2, 132, 199, 0.75)';
        let fillColor = darkMode ? 'rgba(14, 165, 233, 0.16)' : 'rgba(186, 230, 253, 0.28)';
        let lineWidth = 1.2;

        if (isHovered) {
          strokeColor = '#F7941D';
          fillColor = darkMode ? 'rgba(247, 148, 29, 0.42)' : 'rgba(247, 148, 29, 0.35)';
          lineWidth = 2.4;
        } else if (hasTraffic) {
          strokeColor = '#10B981';
          fillColor = darkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.3)';
          lineWidth = 1.7;
        }

        // Draw country polygon rings
        country.rings.forEach((ring) => {
          let started = false;
          ctx.beginPath();

          ring.forEach(([lat, lon]) => {
            const pt = project3D(lat, lon, globeR, cx, cy, s.rotY, s.rotX);
            if (pt.isFront) {
              if (!started) {
                ctx.moveTo(pt.x, pt.y);
                started = true;
              } else {
                ctx.lineTo(pt.x, pt.y);
              }
            } else {
              started = false;
            }
          });

          if (started) {
            ctx.fillStyle = fillColor;
            ctx.fill();

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = lineWidth;
            if (isHovered || hasTraffic) {
              ctx.shadowColor = strokeColor;
              ctx.shadowBlur = 8;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        });

        // Compute centroid projected location
        if (country.centroid) {
          const cpt = project3D(country.centroid.lat, country.centroid.lon, globeR, cx, cy, s.rotY, s.rotX);
          if (cpt.isFront) {
            currentNodes.push({
              country,
              iso2: country.iso2,
              name: country.name,
              metrics,
              hasTraffic,
              screenX: cpt.x,
              screenY: cpt.y,
              isFront: cpt.isFront,
              depthRatio: cpt.depthRatio,
            });
          }
        }
      });

      s.renderedNodes = currentNodes;

      // ── 5. TRAFFIC ARCS BETWEEN REGIONS ──
      const regionPts = REGIONS.map((r) => ({
        ...r,
        pt: project3D(r.lat, r.lon, globeR, s.rotY, s.rotX, cx, cy),
      }));

      ARCS.forEach(([fromId, toId], i) => {
        const from = regionPts.find((r) => r.id === fromId);
        const to = regionPts.find((r) => r.id === toId);
        if (from && to && from.pt.isFront && to.pt.isFront) {
          const arcColor = from.color + 'DD';
          drawArc(ctx, from.pt, to.pt, s.arcProgresses[i], arcColor, globeR, cx, cy);
        }
      });

      // ── 6. COUNTRY NAME LABELS & CENTROID BEACONS ON GLOBE ──
      currentNodes.forEach((node) => {
        const { country, name, iso2, metrics, hasTraffic, screenX, screenY, isFront, depthRatio } = node;
        if (!isFront) return;

        const isHovered = s.hovered?.iso2 === iso2;
        const isPriority = PRIORITY_LABELS.has(iso2);
        const shouldShowLabel = isHovered || (hasTraffic && depthRatio > 0.4) || (isPriority && s.zoom > 0.85 && depthRatio > 0.5);

        // Draw glowing centroid marker dot for traffic countries / priority countries
        if (hasTraffic || isPriority || isHovered) {
          const pulse = (Math.sin(s.time * 3 + (iso2.charCodeAt(0) || 0)) + 1) / 2;
          const dotColor = isHovered ? '#F7941D' : hasTraffic ? '#10B981' : '#0AAEEF';
          const r = isHovered ? 5.5 : hasTraffic ? 4.5 : 3.0;

          // Pulse ring
          ctx.beginPath();
          ctx.arc(screenX, screenY, r + pulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = dotColor + '88';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Filled dot
          ctx.beginPath();
          ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
          ctx.fillStyle = dotColor;
          ctx.shadowColor = dotColor;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Draw Country Name Pill Label directly on globe surface
        if (shouldShowLabel) {
          const labelText = name.length > 14 ? iso2 : name;
          ctx.font = isHovered ? '700 11px "Plus Jakarta Sans", sans-serif' : '600 10px "Plus Jakarta Sans", sans-serif';
          
          const textWidth = ctx.measureText(labelText).width;
          const padX = 7;
          const padY = 3;
          const boxW = textWidth + padX * 2;
          const boxH = 16;
          const boxX = screenX - boxW / 2;
          const boxY = screenY - 18;

          // Badge Background
          const badgeBg = isHovered
            ? (darkMode ? 'rgba(247, 148, 29, 0.95)' : 'rgba(247, 148, 29, 0.9)')
            : hasTraffic
            ? (darkMode ? 'rgba(6, 78, 59, 0.88)' : 'rgba(209, 250, 229, 0.92)')
            : (darkMode ? 'rgba(15, 23, 42, 0.82)' : 'rgba(241, 245, 249, 0.92)');

          const badgeBorder = isHovered
            ? '#F7941D'
            : hasTraffic
            ? '#10B981'
            : (darkMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.3)');

          const badgeText = isHovered
            ? '#FFFFFF'
            : hasTraffic
            ? (darkMode ? '#6EE7B7' : '#047857')
            : (darkMode ? '#94A3B8' : '#334155');

          // Rounded rectangle pill
          ctx.beginPath();
          const cr = 4;
          ctx.moveTo(boxX + cr, boxY);
          ctx.lineTo(boxX + boxW - cr, boxY);
          ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + cr);
          ctx.lineTo(boxX + boxW, boxY + boxH - cr);
          ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - cr, boxY + boxH);
          ctx.lineTo(boxX + cr, boxY + boxH);
          ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - cr);
          ctx.lineTo(boxX, boxY + cr);
          ctx.quadraticCurveTo(boxX, boxY, boxX + cr, boxY);
          ctx.closePath();

          ctx.fillStyle = badgeBg;
          ctx.fill();

          ctx.strokeStyle = badgeBorder;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Country Name Text
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = badgeText;
          ctx.fillText(labelText, screenX, boxY + boxH / 2);
        }
      });

      ctx.restore(); // End globe clip

      // ── 7. Radar Sweep Line ──
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

      ctx.restore();
      requestAnimationFrame(render);
    };

    const raf = requestAnimationFrame(render);
    return () => {
      isActive = false;
      cancelAnimationFrame(raf);
    };
  }, [darkMode, drawArc, countries, metricsMap]);

  // Compute top traffic countries for sidebar/list
  const topCountries = [...(countryData || [])]
    .sort((a, b) => (b.session_count || b.trafficCount || 0) - (a.session_count || a.trafficCount || 0))
    .slice(0, 8);
  const maxSessions = topCountries[0]?.session_count || topCountries[0]?.trafficCount || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Globe Panel */}
      <div
        className="radar-glass-panel regional-globe-panel"
        style={{ position: 'relative', width: '100%', overflow: 'hidden' }}
      >
        <style>{`
          @media (max-width: 600px) {
            .regional-globe-panel { min-height: 350px !important; }
            .regional-globe-panel .globe-canvas { min-height: 300px !important; }
          }
          @media (max-width: 480px) {
            .regional-globe-panel { min-height: 300px !important; }
            .regional-globe-panel .globe-canvas { min-height: 250px !important; }
          }
        `}</style>

        {/* Header Bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: darkMode ? '1px solid rgba(10,174,239,0.12)' : '1px solid rgba(14,165,233,0.15)',
          backdropFilter: 'blur(8px)',
          background: darkMode ? 'rgba(7,16,36,0.65)' : 'rgba(248,250,252,0.8)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0AAEEF', boxShadow: '0 0 8px #0AAEEF', display: 'inline-block' }} />
            <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: darkMode ? '#67E8F9' : '#0369A1' }}>
              GLOBAL TRAFFIC OUTLINE GLOBE
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              background: darkMode ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
              color: darkMode ? '#34D399' : '#059669',
              border: darkMode ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(16,185,129,0.25)',
              fontFamily: 'monospace',
            }}>
              LIVE OUTLINES
            </span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: darkMode ? '#94A3B8' : '#64748B' }}>
            HOVER COUNTRY FOR NAME · DRAG TO ROTATE
          </div>
        </div>

        {/* Interactive Floating Hover Card / Tooltip */}
        {hoveredCountry && (
          <div style={{
            position: 'absolute',
            left: Math.min(window.innerWidth - 200, Math.max(10, tooltipPos.x + 15)),
            top: Math.max(50, tooltipPos.y - 45),
            zIndex: 30,
            pointerEvents: 'none',
            backdropFilter: 'blur(10px)',
            background: darkMode ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)',
            border: darkMode ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(2, 132, 199, 0.3)',
            borderRadius: 10,
            padding: '8px 14px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 140,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: darkMode ? '#F8FAFC' : '#0F172A' }}>
                {hoveredCountry.name}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#0AAEEF', color: '#FFF' }}>
                {hoveredCountry.iso2}
              </span>
            </div>
            <div style={{ fontSize: 11, color: darkMode ? '#94A3B8' : '#64748B', display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span>Traffic Sessions:</span>
              <span style={{ fontWeight: 700, color: '#10B981' }}>
                {(hoveredCountry.metrics?.session_count || hoveredCountry.metrics?.count || 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
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
          <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 9, color: darkMode ? '#64748B' : '#94A3B8', marginTop: 2 }}>
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Region Legend */}
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

      {/* Country Breakdown Bar */}
      {topCountries.length > 0 && (
        <div className="radar-glass-panel" style={{ padding: '18px 20px', marginTop: 16 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: darkMode ? '#38BDF8' : '#0284C7', marginBottom: 14 }}>
            TOP COUNTRIES BY SESSIONS
          </div>
          <div className="country-breakdown-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topCountries.map((c, i) => {
              const sessions = c.session_count || c.trafficCount || 0;
              const pct = Math.round((sessions / maxSessions) * 100);
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
                    {sessions.toLocaleString()}
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
