import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CONTINENT_LABELS, CONTINENT_POINTS, project3D, getCountryGeo } from './countryCoordinates';
import { 
  CompassOutlined, 
  GlobalOutlined, 
  EyeOutlined, 
  ThunderboltOutlined,
  LaptopOutlined,
  ChromeOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  DragOutlined,
  AimOutlined
} from '@ant-design/icons';

const STATE_COLORS = {
  active: { primary: '#0AAEEF', glow: 'rgba(10, 174, 239, 0.8)', label: 'Active Visitor' },
  returning: { primary: '#06B6D4', glow: 'rgba(6, 182, 212, 0.8)', label: 'Returning Visitor' },
  high_intent: { primary: '#EAB308', glow: 'rgba(234, 179, 8, 0.85)', label: 'High-Intent Lead' },
  conversion: { primary: '#EF4444', glow: 'rgba(239, 68, 68, 0.9)', label: 'Conversion / Lead' },
  chatbot: { primary: '#A855F7', glow: 'rgba(168, 85, 247, 0.85)', label: 'Chatbot Session' },
};

const GlobeRadarCanvas = ({
  activeVisitorsCount = 0,
  recentSessions = [],
  countryAnalytics = [],
  lastUpdatedText = 'Just now',
  isLoading = false,
  darkMode = true,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const stateRef = useRef({
    rotation: 0.8,
    zoom: 1,
    sweepAngle: 0,
    mouse: { x: -1000, y: -1000, isHovering: false },
    activeMarker: null,
    particles: [],
    markers: [],
    drag: { isDragging: false, pointerId: null, startX: 0, startRotation: 0, startY: 0, startZoom: 1 },
    selectedContinent: null, // NEW: Track selected continent
  });

  const [hoveredVisitor, setHoveredVisitor] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedContinent, setSelectedContinent] = useState(null); // NEW: UI state for selected continent

  // Transform raw sessions and country statistics into active marker objects
  useEffect(() => {
    const markers = [];
    const usedLocs = new Set();

    if (recentSessions && recentSessions.length > 0) {
      recentSessions.slice(0, 45).forEach((session, idx) => {
        const geo = getCountryGeo(session.country || 'India');
        const jitterLat = geo.lat + ((idx % 5) - 2) * 1.8;
        const jitterLon = geo.lon + (((idx * 3) % 7) - 3) * 2.2;

        let state = 'active';
        const pages = session.total_pages_visited || 1;
        const duration = session.total_session_duration || 30;

        if (session.exit_page && session.exit_page.includes('contact')) {
          state = 'conversion';
        } else if (pages >= 3 || duration > 180) {
          state = 'high_intent';
        } else if (idx % 4 === 1) {
          state = 'returning';
        } else if (idx % 7 === 0) {
          state = 'chatbot';
        }

        const durationMinutes = Math.floor(duration / 60);
        const durationSeconds = duration % 60;
        const durationFormatted = `${String(durationMinutes).padStart(2, '0')}:${String(durationSeconds).padStart(2, '0')}`;

        markers.push({
          id: session.session_uuid ? session.session_uuid.substring(0, 8) : `V-${1000 + idx}`,
          country: geo.country,
          city: geo.city,
          region: geo.region,
          lat: jitterLat,
          lon: jitterLon,
          state,
          page: session.landing_page || session.exit_page || '/services',
          device: session.device_type ? (session.device_type.charAt(0).toUpperCase() + session.device_type.slice(1)) : 'Desktop',
          browser: session.browser || 'Chrome',
          source: session.landing_page && session.landing_page.includes('utm') ? 'Campaign' : (idx % 2 === 0 ? 'Google Search' : 'Direct Traffic'),
          duration: durationFormatted,
          pagesVisited: pages,
          pulseOffset: (idx * 0.35) % (Math.PI * 2),
        });
        usedLocs.add(geo.country);
      });
    }

    if (markers.length < 6 && countryAnalytics && countryAnalytics.length > 0) {
      countryAnalytics.forEach((c, idx) => {
        const geo = getCountryGeo(c.country || 'India');
        const state = idx === 0 ? 'high_intent' : (idx === 1 ? 'conversion' : 'active');

        markers.push({
          id: `NODE-${idx + 1}`,
          country: geo.country,
          city: geo.city,
          region: geo.region,
          lat: geo.lat,
          lon: geo.lon,
          state,
          page: idx === 0 ? '/services' : (idx === 1 ? '/pricing' : '/case-studies'),
          device: c.device_type ? (c.device_type.charAt(0).toUpperCase() + c.device_type.slice(1)) : 'Desktop',
          browser: 'Chrome / Safari',
          source: 'Organic Search',
          duration: '03:45',
          pagesVisited: Math.max(2, Math.round(c.avg_pages_per_session || 3)),
          pulseOffset: (idx * 0.6) % (Math.PI * 2),
        });
      });
    }

    stateRef.current.markers = markers;
  }, [recentSessions, countryAnalytics]);

  // Canvas Animation & Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (stateRef.current.particles.length === 0) {
      const particles = [];
      for (let i = 0; i < 45; i++) {
        particles.push({
          x: Math.random(),
          y: Math.random(),
          size: Math.random() * 1.6 + 0.6,
          speed: Math.random() * 0.0003 + 0.0001,
          alpha: Math.random() * 0.5 + 0.2,
        });
      }
      stateRef.current.particles = particles;
    }

    let isSubscribed = true;

    const render = () => {
      if (!isSubscribed) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const radarRadius = Math.min(width, height) * 0.44;
      const globeRadius = radarRadius * 0.68 * stateRef.current.zoom;

      if (!stateRef.current.drag.isDragging) stateRef.current.rotation += 0.0022;
      stateRef.current.sweepAngle += 0.018;
      if (stateRef.current.sweepAngle > Math.PI * 2) {
        stateRef.current.sweepAngle -= Math.PI * 2;
      }

      const rot = stateRef.current.rotation;
      const sweep = stateRef.current.sweepAngle;

      // ─── 1. DRAW RADAR BACKGROUND PARTICLES ───
      stateRef.current.particles.forEach(p => {
        p.y -= p.speed;
        if (p.y < 0) p.y = 1;
        const px = p.x * width;
        const py = p.y * height;
        ctx.fillStyle = darkMode 
          ? `rgba(10, 174, 239, ${p.alpha * 0.4})` 
          : `rgba(2, 132, 199, ${p.alpha * 0.25})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // ─── 2. RADAR CONCENTRIC RINGS & CROSSHAIRS ───
      const rings = [0.28, 0.52, 0.76, 1.0];
      rings.forEach((ringRatio, rIdx) => {
        const r = radarRadius * ringRatio;
        ctx.strokeStyle = darkMode
          ? (rIdx === 3 ? 'rgba(10, 174, 239, 0.35)' : 'rgba(10, 174, 239, 0.12)')
          : (rIdx === 3 ? 'rgba(14, 165, 233, 0.45)' : 'rgba(14, 165, 233, 0.18)');
        ctx.lineWidth = rIdx === 3 ? 1.5 : 1;
        ctx.setLineDash(rIdx === 3 ? [] : [4, 6]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();

        if (rIdx > 0 && width > 420) {
          ctx.fillStyle = darkMode ? 'rgba(10, 174, 239, 0.45)' : 'rgba(2, 132, 199, 0.6)';
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          const distLabels = ['2,500 KM', '5,000 KM', '10,000 KM', '15,000 KM'];
          ctx.fillText(distLabels[rIdx], centerX + r + 3, centerY - 2);
        }
      });
      ctx.setLineDash([]);

      // Radial grid lines
      const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
      angles.forEach((angle, idx) => {
        ctx.strokeStyle = darkMode ? 'rgba(10, 174, 239, 0.09)' : 'rgba(14, 165, 233, 0.14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle) * radarRadius, centerY + Math.sin(angle) * radarRadius);
        ctx.stroke();

        const tickX = centerX + Math.cos(angle) * radarRadius;
        const tickY = centerY + Math.sin(angle) * radarRadius;
        ctx.fillStyle = darkMode ? 'rgba(10, 174, 239, 0.6)' : 'rgba(2, 132, 199, 0.7)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const degText = `${idx * 45}°`;
        const offset = 14;
        ctx.fillText(degText, tickX + Math.cos(angle) * offset, tickY + Math.sin(angle) * offset);
      });

      // ─── 3. RADAR ROTATING SWEEP BEAM ───
      const sweepGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radarRadius);
      if (darkMode) {
        sweepGradient.addColorStop(0, 'rgba(10, 174, 239, 0.25)');
        sweepGradient.addColorStop(0.7, 'rgba(10, 174, 239, 0.12)');
        sweepGradient.addColorStop(1, 'rgba(10, 174, 239, 0)');
      } else {
        sweepGradient.addColorStop(0, 'rgba(14, 165, 233, 0.22)');
        sweepGradient.addColorStop(0.7, 'rgba(14, 165, 233, 0.08)');
        sweepGradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radarRadius, sweep - 0.45, sweep, false);
      ctx.closePath();
      ctx.fillStyle = sweepGradient;
      ctx.fill();

      // Sharp leading sweep line
      ctx.strokeStyle = darkMode ? 'rgba(56, 189, 248, 0.85)' : 'rgba(2, 132, 199, 0.9)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(sweep) * radarRadius, centerY + Math.sin(sweep) * radarRadius);
      ctx.stroke();
      ctx.restore();

      // ─── 4. 3D DIGITAL WIREFRAME GLOBE SPHERE ───
      const globeGrad = ctx.createRadialGradient(
        centerX - globeRadius * 0.25,
        centerY - globeRadius * 0.25,
        globeRadius * 0.1,
        centerX,
        centerY,
        globeRadius
      );
      if (darkMode) {
        globeGrad.addColorStop(0, 'rgba(14, 30, 60, 0.85)');
        globeGrad.addColorStop(0.7, 'rgba(7, 16, 34, 0.92)');
        globeGrad.addColorStop(1, 'rgba(3, 8, 20, 0.98)');
      } else {
        globeGrad.addColorStop(0, 'rgba(238, 248, 255, 0.92)');
        globeGrad.addColorStop(0.7, 'rgba(215, 239, 255, 0.95)');
        globeGrad.addColorStop(1, 'rgba(186, 230, 253, 0.98)');
      }

      ctx.fillStyle = globeGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric glowing rim
      ctx.strokeStyle = darkMode ? 'rgba(10, 174, 239, 0.55)' : 'rgba(14, 165, 233, 0.7)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(10, 174, 239, 0.6)';
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Outer soft halo
      const haloGrad = ctx.createRadialGradient(centerX, centerY, globeRadius * 0.95, centerX, centerY, globeRadius * 1.18);
      haloGrad.addColorStop(0, darkMode ? 'rgba(10, 174, 239, 0.25)' : 'rgba(14, 165, 233, 0.15)');
      haloGrad.addColorStop(1, 'rgba(10, 174, 239, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius * 1.18, 0, Math.PI * 2);
      ctx.fill();

      // ─── 5. GLOBE WIREFRAME LATITUDE & LONGITUDE ───
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius, 0, Math.PI * 2);
      ctx.clip();

      const lats = [-60, -30, 0, 30, 60];
      lats.forEach(lat => {
        const phi = (lat * Math.PI) / 180;
        const yOffset = -globeRadius * Math.sin(phi);
        const radiusAtLat = globeRadius * Math.cos(phi);

        ctx.strokeStyle = darkMode
          ? (lat === 0 ? 'rgba(10, 174, 239, 0.35)' : 'rgba(10, 174, 239, 0.12)')
          : (lat === 0 ? 'rgba(2, 132, 199, 0.35)' : 'rgba(2, 132, 199, 0.18)');
        ctx.lineWidth = lat === 0 ? 1.2 : 0.8;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + yOffset, radiusAtLat, radiusAtLat * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Longitude meridians
      for (let lon = 0; lon < 360; lon += 30) {
        ctx.beginPath();
        let first = true;
        for (let lat = -85; lat <= 85; lat += 5) {
          const pt = project3D(lat, lon, globeRadius, rot, centerX, centerY);
          if (pt.isFront) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            first = true;
          }
        }
        ctx.strokeStyle = darkMode ? 'rgba(10, 174, 239, 0.15)' : 'rgba(2, 132, 199, 0.2)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Digital Continents Point Cloud
      CONTINENT_POINTS.forEach(([cLat, cLon]) => {
        const pt = project3D(cLat, cLon, globeRadius, rot, centerX, centerY);
        if (pt.visible) {
          const alpha = pt.isFront ? 0.65 + pt.depthRatio * 0.35 : 0.15;
          const size = pt.isFront ? 1.4 : 0.9;
          ctx.fillStyle = darkMode 
            ? `rgba(56, 189, 248, ${alpha})`
            : `rgba(2, 132, 199, ${alpha * 0.9})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const zoom = stateRef.current.zoom;
      const selectedCont = stateRef.current.selectedContinent;
      
      if (zoom >= 0.9) {
        const labelItems = [];

        if (zoom < 1.25) {
          CONTINENT_LABELS.forEach((c) => {
            const pt = project3D(c.lat, c.lon, globeRadius, rot, centerX, centerY);
            if (!pt.isFront) return;
            
            // NEW: Highlight selected continent
            const isSelected = selectedCont === c.region;
            const baseAlpha = isSelected ? 0.8 : (0.32 + pt.depthRatio * 0.4);
            const baseSize = isSelected ? 3.5 : 0;
            
            labelItems.push({
              z: pt.z,
              x: pt.x,
              y: pt.y,
              text: `${c.label} • ${c.region}`,
              color: c.color,
              alpha: baseAlpha,
              font: zoom < 1.05 ? 9 : 10,
              isSelected,
              region: c.region,
              glowSize: baseSize,
              lat: c.lat,
              lon: c.lon,
            });
          });
        } else if (zoom < 1.55) {
          const byCountry = new Map();
          stateRef.current.markers.forEach((m) => {
            byCountry.set(m.country, (byCountry.get(m.country) || 0) + 1);
          });

          const topCountries = [...byCountry.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([country, count]) => ({ country, count }));

          topCountries.forEach(({ country, count }) => {
            const geo = getCountryGeo(country);
            const pt = project3D(geo.lat, geo.lon, globeRadius, rot, centerX, centerY);
            if (!pt.isFront) return;
            labelItems.push({
              z: pt.z,
              x: pt.x,
              y: pt.y,
              text: `${country.toUpperCase()}  ${count}`,
              color: darkMode ? '#38BDF8' : '#0284C7',
              alpha: 0.35 + pt.depthRatio * 0.45,
              font: zoom < 1.35 ? 9 : 10,
              isCountry: true,
            });
          });
        } else {
          const cityCandidates = stateRef.current.markers
            .slice()
            .sort((a, b) => (b.pagesVisited || 0) - (a.pagesVisited || 0))
            .slice(0, 14);

          cityCandidates.forEach((m) => {
            const pt = project3D(m.lat, m.lon, globeRadius, rot, centerX, centerY);
            if (!pt.isFront) return;
            labelItems.push({
              z: pt.z,
              x: pt.x,
              y: pt.y,
              text: m.city ? `${m.city.toUpperCase()}` : `${m.country.toUpperCase()}`,
              color: STATE_COLORS[m.state]?.primary || (darkMode ? '#38BDF8' : '#0284C7'),
              alpha: 0.4 + pt.depthRatio * 0.5,
              font: zoom < 1.75 ? 9 : 10,
              isCity: true,
            });
          });
        }

        labelItems
          .sort((a, b) => a.z - b.z)
          .forEach((l) => {
            ctx.save();
            ctx.globalAlpha = l.alpha;
            
            // NEW: Enhanced glow effect for selected continents
            if (l.isSelected) {
              ctx.shadowColor = l.color;
              ctx.shadowBlur = 24;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
              
              // Draw highlight ring around continent
              ctx.strokeStyle = l.color;
              ctx.lineWidth = 3.5;
              ctx.globalAlpha = l.alpha * 0.6;
              ctx.beginPath();
              ctx.arc(l.x, l.y, 24, 0, Math.PI * 2);
              ctx.stroke();
              
              ctx.globalAlpha = l.alpha;
            }
            
            ctx.fillStyle = darkMode ? 'rgba(2, 6, 23, 0.65)' : 'rgba(248, 250, 252, 0.8)';
            ctx.strokeStyle = l.isSelected 
              ? l.color 
              : (darkMode ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.35)');
            ctx.lineWidth = l.isSelected ? 1.8 : 1;
            ctx.font = `${l.font}px "JetBrains Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const padX = 6;
            const padY = 4;
            const w = ctx.measureText(l.text).width + padX * 2;
            const h = l.font + padY * 2;
            const x = l.x;
            const y = l.y - 18;
            const r = 7;
            ctx.beginPath();
            ctx.moveTo(x - w / 2 + r, y - h / 2);
            ctx.lineTo(x + w / 2 - r, y - h / 2);
            ctx.quadraticCurveTo(x + w / 2, y - h / 2, x + w / 2, y - h / 2 + r);
            ctx.lineTo(x + w / 2, y + h / 2 - r);
            ctx.quadraticCurveTo(x + w / 2, y + h / 2, x + w / 2 - r, y + h / 2);
            ctx.lineTo(x - w / 2 + r, y + h / 2);
            ctx.quadraticCurveTo(x - w / 2, y + h / 2, x - w / 2, y + h / 2 - r);
            ctx.lineTo(x - w / 2, y - h / 2 + r);
            ctx.quadraticCurveTo(x - w / 2, y - h / 2, x - w / 2 + r, y - h / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = l.color;
            ctx.fillText(l.text, x, y);
            ctx.shadowBlur = 0;
            ctx.restore();
          });
      }

      ctx.restore();

      // ─── 6. LIVE VISITOR MARKERS & TRAJECTORIES ───
      const mouse = stateRef.current.mouse;
      let closestMarker = null;
      let minDistance = 22;

      stateRef.current.markers.forEach(m => {
        const pt = project3D(m.lat, m.lon, globeRadius, rot, centerX, centerY);
        m.screenX = pt.x;
        m.screenY = pt.y;
        m.isFront = pt.isFront;

        if (pt.visible) {
          const colorDef = STATE_COLORS[m.state] || STATE_COLORS.active;
          const depthAlpha = pt.isFront ? Math.max(0.4, pt.depthRatio) : 0.15;
          const time = Date.now() / 1000;
          const pulse = (Math.sin(time * 3 + m.pulseOffset) + 1) / 2;

          if (pt.isFront) {
            if (m.state === 'conversion' || m.state === 'high_intent') {
              ctx.strokeStyle = colorDef.glow;
              ctx.lineWidth = 0.8;
              ctx.setLineDash([2, 4]);
              ctx.beginPath();
              ctx.moveTo(pt.x, pt.y);
              const edgeAngle = Math.atan2(pt.y - centerY, pt.x - centerX);
              ctx.lineTo(centerX + Math.cos(edgeAngle) * radarRadius, centerY + Math.sin(edgeAngle) * radarRadius);
              ctx.stroke();
              ctx.setLineDash([]);
            }

            ctx.strokeStyle = colorDef.glow;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4 + pulse * 7, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = colorDef.primary;
            ctx.shadowColor = colorDef.primary;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = darkMode 
              ? `rgba(10, 174, 239, ${depthAlpha * 0.3})`
              : `rgba(2, 132, 199, ${depthAlpha * 0.25})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
            ctx.fill();
          }

          if (pt.isFront && mouse.isHovering) {
            const dist = Math.hypot(mouse.x - pt.x, mouse.y - pt.y);
            if (dist < minDistance) {
              minDistance = dist;
              closestMarker = m;
            }
          }
        }
      });

      if (closestMarker) {
        setHoveredVisitor(closestMarker);
        setTooltipPos({ x: closestMarker.screenX, y: closestMarker.screenY });
      } else {
        setHoveredVisitor(null);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [darkMode]);

  const handlePointerMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (stateRef.current.drag.isDragging && e.pointerId === stateRef.current.drag.pointerId) {
      const dx = e.clientX - stateRef.current.drag.startX;
      const dy = e.clientY - stateRef.current.drag.startY;
      stateRef.current.rotation = stateRef.current.drag.startRotation + dx * 0.007;
      // Optional: vertical drag for different orbital view
      stateRef.current.zoom = Math.max(0.85, Math.min(1.9, stateRef.current.drag.startZoom + dy * 0.002));
      stateRef.current.mouse.isHovering = false;
      return;
    }
    stateRef.current.mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top, isHovering: true };
  }, []);

  const handlePointerLeave = useCallback(() => {
    stateRef.current.mouse.isHovering = false;
    setHoveredVisitor(null);
  }, []);

  const handlePointerDown = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture?.(e.pointerId);
    stateRef.current.drag = {
      isDragging: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startRotation: stateRef.current.rotation,
      startZoom: stateRef.current.zoom,
    };
    setIsDragging(true);
    stateRef.current.mouse.isHovering = false;
  }, []);

  const handlePointerUp = useCallback((e) => {
    if (stateRef.current.drag.pointerId !== e.pointerId) return;
    stateRef.current.drag = { 
      isDragging: false, 
      pointerId: null, 
      startX: 0, 
      startY: 0,
      startRotation: stateRef.current.rotation,
      startZoom: stateRef.current.zoom,
    };
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const next = stateRef.current.zoom * (delta > 0 ? 0.92 : 1.08);
    stateRef.current.zoom = Math.max(0.85, Math.min(1.9, next));
  }, []);

  // NEW: Handle continent click for highlighting and rotation
  const handleContinentClick = useCallback((continent) => {
    setSelectedContinent(continent);
    stateRef.current.selectedContinent = continent;
    // Optionally, auto-rotate to continent
    const contData = CONTINENT_LABELS.find(c => c.region === continent);
    if (contData) {
      stateRef.current.rotation = -((contData.lon * Math.PI) / 180);
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="radar-glass-panel relative w-full h-[540px] md:h-[620px] lg:h-[680px] flex flex-col items-center justify-between p-4 overflow-hidden"
    >
      <style>{`
        @media (max-width: 600px) {
          .radar-glass-panel {
            height: 400px !important;
            padding: 12px !important;
          }
        }
        @media (max-width: 480px) {
          .radar-glass-panel {
            height: 350px !important;
            padding: 10px !important;
          }
        }
      `}</style>
      {/* Top Overlay HUD Bar */}
      <div className={`w-full flex justify-between items-center z-10 px-2 py-1 border-b ${darkMode ? 'border-sky-500/10' : 'border-sky-500/20'}`}>
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="pulse-beacon absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className={`text-[11px] font-mono tracking-widest font-semibold uppercase ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
            ORBITAL INTELLIGENCE RADAR v4.2
          </span>
        </div>
        <div className={`flex items-center gap-3 text-[11px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          <span className="hidden sm:inline-flex items-center gap-1">
            <GlobalOutlined className="text-cyan-500" /> 360° SATELLITE SCAN
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] tracking-wider border ${
            darkMode 
              ? 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30' 
              : 'text-cyan-700 bg-cyan-100/80 border-cyan-300'
          }`}>
            REALTIME
          </span>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div className="relative w-full flex-1 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onWheel={handleWheel}
          style={{ touchAction: 'none' }}
          className={`w-full h-full block ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        />

        {/* Hover Tooltip (Zero PII) */}
        {hoveredVisitor && (
          <div
            className="radar-tooltip transition-all transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
            }}
          >
            <div className={`flex items-center justify-between gap-3 border-b pb-1 mb-2 ${darkMode ? 'border-cyan-500/20' : 'border-cyan-500/30'}`}>
              <span className={`font-mono font-bold text-xs flex items-center gap-1 ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                <EnvironmentOutlined className="text-cyan-500" />
                {hoveredVisitor.city}, {hoveredVisitor.country}
              </span>
              <span 
                className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded uppercase"
                style={{
                  backgroundColor: STATE_COLORS[hoveredVisitor.state]?.glow || 'rgba(10, 174, 239, 0.2)',
                  color: STATE_COLORS[hoveredVisitor.state]?.primary || '#0AAEEF',
                }}
              >
                {STATE_COLORS[hoveredVisitor.state]?.label || 'Active'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
              <div className={`flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <EyeOutlined /> Page:
              </div>
              <div className={`truncate font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{hoveredVisitor.page}</div>

              <div className={`flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <LaptopOutlined /> Device:
              </div>
              <div className={darkMode ? 'text-slate-200' : 'text-slate-800'}>{hoveredVisitor.device}</div>

              <div className={`flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <ChromeOutlined /> Browser:
              </div>
              <div className={darkMode ? 'text-slate-200' : 'text-slate-800'}>{hoveredVisitor.browser}</div>

              <div className={`flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <ThunderboltOutlined /> Source:
              </div>
              <div className={darkMode ? 'text-slate-200' : 'text-slate-800'}>{hoveredVisitor.source}</div>

              <div className={`flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <ClockCircleOutlined /> Duration:
              </div>
              <div className="text-cyan-500 font-bold">{hoveredVisitor.duration}</div>
            </div>
          </div>
        )}
      </div>

      {/* Center Live Metric Overlay */}
      <div className={`globe-metric-overlay z-10 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-2xl flex items-center gap-3 sm:gap-5 -mt-8 mb-2 border ${
        darkMode 
          ? 'bg-slate-950/85 border-cyan-500/25' 
          : 'bg-white/95 border-cyan-500/35 shadow-cyan-500/10'
      }`}>
        <style>{`
          @media (max-width: 600px) {
            .globe-metric-overlay {
              padding: 8px 12px !important;
              gap: 8px !important;
            }
            .globe-metric-overlay .visitor-count {
              font-size: 24px !important;
            }
            .globe-metric-overlay .visitor-label {
              font-size: 9px !important;
            }
          }
          @media (max-width: 480px) {
            .globe-metric-overlay {
              padding: 6px 10px !important;
              gap: 6px !important;
            }
            .globe-metric-overlay .visitor-count {
              font-size: 20px !important;
            }
            .globe-metric-overlay .visitor-label {
              font-size: 8px !important;
            }
          }
        `}</style>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className={`visitor-count text-2xl sm:text-3xl md:text-4xl font-extrabold font-mono tracking-tight ${
            darkMode ? 'text-cyan-400 drop-shadow-[0_0_12px_rgba(10,174,239,0.5)]' : 'text-cyan-600'
          }`}>
            {isLoading ? '...' : (activeVisitorsCount || stateRef.current.markers.length || 0)}
          </span>
          <div className="text-left leading-tight">
            <div className={`visitor-label text-[10px] sm:text-[11px] font-bold tracking-widest uppercase ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              ACTIVE VISITORS
            </div>
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-emerald-500 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE NOW
            </div>
          </div>
        </div>

        <div className={`h-7 w-[1px] hidden sm:block ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

        <div className="text-[10px] sm:text-[11px] font-mono hidden sm:block">
          <div className={`text-[9px] sm:text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>SYNC FREQUENCY</div>
          <div className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{lastUpdatedText}</div>
        </div>
      </div>

      {/* Marker State Legend */}
      <div className={`w-full flex flex-wrap items-center justify-center gap-3 md:gap-6 pt-2 border-t text-[11px] font-mono ${
        darkMode ? 'border-sky-500/10 text-slate-300' : 'border-sky-500/20 text-slate-600'
      }`}>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#0AAEEF] shadow-[0_0_8px_#0AAEEF]"></span>
          <span>Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#06B6D4] shadow-[0_0_8px_#06B6D4]"></span>
          <span>Returning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#EAB308] shadow-[0_0_8px_#EAB308]"></span>
          <span>High-Intent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]"></span>
          <span>Conversion/Lead</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#A855F7] shadow-[0_0_8px_#A855F7]"></span>
          <span>Chatbot</span>
        </div>
      </div>

      {/* NEW: Interactive Continent Selector */}
      <div className={`w-full mt-3 p-3 rounded-lg border ${
        darkMode 
          ? 'bg-slate-950/50 border-cyan-500/20' 
          : 'bg-white/50 border-cyan-500/30'
      }`}>
        <div className={`text-[10px] font-mono font-bold uppercase mb-2 tracking-widest flex items-center gap-1.5 ${
          darkMode ? 'text-cyan-400' : 'text-cyan-700'
        }`}>
          <EnvironmentOutlined /> INTERACTIVE GLOBE CONTROLS
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {['EMEA', 'APAC', 'Americas', 'Global'].map((region) => (
            <button
              key={region}
              onClick={() => handleContinentClick(region)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-mono font-bold transition-all duration-300 ${
                selectedContinent === region
                  ? darkMode
                    ? 'bg-cyan-500/40 text-cyan-200 border border-cyan-500/80'
                    : 'bg-cyan-200/60 text-cyan-900 border border-cyan-500'
                  : darkMode
                    ? 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:border-cyan-500/50 hover:text-cyan-300'
                    : 'bg-slate-100/60 text-slate-600 border border-slate-300/50 hover:border-cyan-500/50 hover:text-cyan-700'
              }`}
            >
              {region}
            </button>
          ))}
          {selectedContinent && (
            <button
              onClick={() => {
                setSelectedContinent(null);
                stateRef.current.selectedContinent = null;
              }}
              className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                darkMode
                  ? 'bg-red-500/30 text-red-300 border border-red-500/50 hover:bg-red-500/50'
                  : 'bg-red-200/50 text-red-700 border border-red-500/50 hover:bg-red-200/70'
              }`}
            >
              CLEAR
            </button>
          )}
        </div>
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono ${
          darkMode ? 'text-slate-500' : 'text-slate-600'
        }`}>
          <div className="flex items-center gap-1.5">
            <DragOutlined className="text-cyan-400" />
            <span><strong>Drag</strong> to rotate globe manually</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SearchOutlined className="text-cyan-400" />
            <span><strong>Scroll</strong> to zoom in/out</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GlobalOutlined className="text-cyan-400" />
            <span><strong>Zoom Levels:</strong> Continents → Countries → Cities</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AimOutlined className="text-cyan-400" />
            <span><strong>Click Region</strong> to auto-rotate & highlight</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobeRadarCanvas;
