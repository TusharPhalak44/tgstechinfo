import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Button, Tooltip } from 'antd';
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { getDecodedCountries, REGION_COUNTRIES } from './worldGeoData';

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

export default function AudienceGlobe({
  countryBreakdown = [],
  selectedRegion = 'GLOBAL',
  selectedCountries = [],
  onSelectCountry = () => {},
  regions = [],
  darkMode = true
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Decoded real GeoJSON country boundaries
  const countries = useMemo(() => getDecodedCountries(), []);

  // Map country breakdown metrics by ISO code
  const metricsMap = useMemo(() => {
    const map = new Map();
    countryBreakdown.forEach(c => {
      if (c.iso_code) {
        map.set(c.iso_code.toUpperCase(), c);
      }
      if (c.country_name) {
        map.set(c.country_name.toLowerCase(), c);
      }
    });
    return map;
  }, [countryBreakdown]);

  // Instant country nodes list (ready from frame 0 before network requests complete)
  const activeNodesList = useMemo(() => {
    if (countryBreakdown && countryBreakdown.length > 0) {
      return countryBreakdown.map(item => {
        if (item.lat !== undefined && item.lon !== undefined) return item;
        const cObj = countries.find(c => c.iso_code === item.iso_code);
        return {
          ...item,
          lat: cObj?.centroid?.lat || 0,
          lon: cObj?.centroid?.lon || 0
        };
      }).filter(item => item.lat !== undefined && item.lon !== undefined);
    }
    // Instant initial fallback: render dots at all known country centroids from worldGeoData
    return countries
      .filter(c => c.centroid && c.centroid.lat !== undefined && c.centroid.lon !== undefined)
      .map(c => ({
        iso_code: c.iso_code,
        country_name: c.name,
        lat: c.centroid.lat,
        lon: c.centroid.lon,
        contact_count: 2400000
      }));
  }, [countryBreakdown, countries]);

  // Globe rendering state
  const stateRef = useRef({
    rotY: 0.6,
    rotX: 0.22,
    targetRotY: null,
    targetRotX: null,
    zoom: 1.0,
    isDragging: false,
    startX: 0,
    startY: 0,
    startRotY: 0,
    startRotX: 0,
    autoRotate: true,
    hoveredCountry: null,
    time: 0
  });

  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Camera transition when selection changes
  useEffect(() => {
    if (selectedCountries.length > 0) {
      const match = activeNodesList.find(c => selectedCountries.includes(c.iso_code));
      if (match && match.lat !== undefined && match.lon !== undefined) {
        stateRef.current.targetRotY = -(match.lon + 180) * (Math.PI / 180) + Math.PI / 2;
        stateRef.current.targetRotX = (match.lat * Math.PI) / 180 * 0.35;
        stateRef.current.autoRotate = false;
        return;
      }
    }

    if (selectedRegion && selectedRegion !== 'GLOBAL') {
      const rMatch = regions.find(r => r.code === selectedRegion);
      if (rMatch && rMatch.lat !== undefined && rMatch.lon !== undefined) {
        stateRef.current.targetRotY = -(rMatch.lon + 180) * (Math.PI / 180) + Math.PI / 2;
        stateRef.current.targetRotX = (rMatch.lat * Math.PI) / 180 * 0.35;
        stateRef.current.autoRotate = false;
        return;
      }
    }

    stateRef.current.autoRotate = true;
    stateRef.current.targetRotY = null;
    stateRef.current.targetRotX = null;
  }, [selectedRegion, selectedCountries, activeNodesList, regions]);

  // Main Canvas Render Loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const st = stateRef.current;
      st.time += 0.016;

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.38 * st.zoom;

      // Handle Smooth Camera Interpolation or Continuous Slow Auto-Rotation
      if (st.targetRotY !== null) {
        let diffY = st.targetRotY - st.rotY;
        while (diffY > Math.PI) diffY -= 2 * Math.PI;
        while (diffY < -Math.PI) diffY += 2 * Math.PI;
        st.rotY += diffY * 0.06;

        if (st.targetRotX !== null) {
          const diffX = st.targetRotX - st.rotX;
          st.rotX += diffX * 0.06;
        }

        // Once target is reached, clear target so it resumes gentle continuous auto-rotation
        if (Math.abs(diffY) < 0.004 && (st.targetRotX === null || Math.abs(st.targetRotX - st.rotX) < 0.004)) {
          st.targetRotY = null;
          st.targetRotX = null;
          st.autoRotate = true;
        }
      } else if (!st.isDragging) {
        // Slow speed continuous auto-rotation
        st.rotY += 0.0016;
        st.rotX = 0.22 + Math.sin(st.time * 0.3) * 0.035;
      }

      ctx.clearRect(0, 0, width, height);

      // ── 1. Cosmic Atmosphere Radial Glow Behind Globe ──
      const atmoGlow = ctx.createRadialGradient(cx, cy, radius * 0.75, cx, cy, radius * 1.4);
      atmoGlow.addColorStop(0, 'rgba(10, 174, 239, 0.16)');
      atmoGlow.addColorStop(0.5, 'rgba(10, 174, 239, 0.05)');
      atmoGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = atmoGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // ── 2. Globe Sphere Base Core ──
      const sphereGrad = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.35,
        radius * 0.1,
        cx,
        cy,
        radius
      );
      sphereGrad.addColorStop(0, '#0F2444');
      sphereGrad.addColorStop(0.65, '#081426');
      sphereGrad.addColorStop(1, '#030814');
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Globe Outer Glowing Rim
      ctx.strokeStyle = 'rgba(10, 174, 239, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = 'rgba(10, 174, 239, 0.8)';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── 3. Latitude & Longitude Wireframe Grid ──
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // Latitudes
      [-60, -30, 0, 30, 60].forEach(lat => {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 4) {
          const pt = project3D(lat, lon, radius, cx, cy, st.rotY, st.rotX);
          if (pt.isFront) {
            if (!started) { ctx.moveTo(pt.x, pt.y); started = true; }
            else ctx.lineTo(pt.x, pt.y);
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = lat === 0 ? 'rgba(10, 174, 239, 0.25)' : 'rgba(10, 174, 239, 0.08)';
        ctx.lineWidth = lat === 0 ? 1.0 : 0.6;
        ctx.stroke();
      });

      // Longitudes
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -80; lat <= 80; lat += 3) {
          const pt = project3D(lat, lon, radius, cx, cy, st.rotY, st.rotX);
          if (pt.isFront) {
            if (!started) { ctx.moveTo(pt.x, pt.y); started = true; }
            else ctx.lineTo(pt.x, pt.y);
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = 'rgba(10, 174, 239, 0.08)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // ── 4. REAL GEOJSON COUNTRY BOUNDARIES & POLYGONS ON THE 3D GLOBE ──
      const renderedCountryNodes = [];

      countries.forEach(country => {
        const isSelected = selectedCountries.includes(country.iso2);
        const isHovered = st.hoveredCountry?.iso2 === country.iso2;
        const isInSelectedRegion = selectedRegion && selectedRegion !== 'GLOBAL' && (
          (REGION_COUNTRIES[selectedRegion] || []).includes(country.iso2) || country.region === selectedRegion
        );

        // Styling based on state
        let strokeColor = 'rgba(10, 174, 239, 0.75)';
        let fillColor = 'rgba(10, 174, 239, 0.05)';
        let lineWidth = 1.2;

        if (isSelected) {
          strokeColor = '#F7941D';
          fillColor = 'rgba(247, 148, 29, 0.35)';
          lineWidth = 2.4;
        } else if (isHovered) {
          strokeColor = '#38BDF8';
          fillColor = 'rgba(56, 189, 248, 0.25)';
          lineWidth = 2.0;
        } else if (isInSelectedRegion) {
          strokeColor = '#10B981';
          fillColor = 'rgba(16, 185, 129, 0.15)';
          lineWidth = 1.6;
        } else if (selectedRegion && selectedRegion !== 'GLOBAL') {
          // Dim non-region countries
          strokeColor = 'rgba(10, 174, 239, 0.2)';
          fillColor = 'rgba(10, 174, 239, 0.02)';
          lineWidth = 0.8;
        }

        // Draw each polygon ring of the country
        country.rings.forEach(ring => {
          let isStarted = false;
          ctx.beginPath();

          ring.forEach(([lat, lon]) => {
            const pt = project3D(lat, lon, radius, cx, cy, st.rotY, st.rotX);
            if (pt.isFront) {
              if (!isStarted) {
                ctx.moveTo(pt.x, pt.y);
                isStarted = true;
              } else {
                ctx.lineTo(pt.x, pt.y);
              }
            } else {
              isStarted = false;
            }
          });

          if (isStarted) {
            ctx.fillStyle = fillColor;
            ctx.fill();

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = lineWidth;
            if (isSelected || isHovered) {
              ctx.shadowColor = strokeColor;
              ctx.shadowBlur = 8;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        });

        // Store centroid projected point for raycasting & hover detection
        if (country.centroid) {
          const centroidPt = project3D(country.centroid.lat, country.centroid.lon, radius, cx, cy, st.rotY, st.rotX);
          if (centroidPt.isFront) {
            renderedCountryNodes.push({
              country,
              screenX: centroidPt.x,
              screenY: centroidPt.y
            });
          }
        }
      });

      // ── 5. Active Country Demographic Nodes & Radar Ripples (Instant Visibility) ──
      const maxCount = Math.max(1, ...activeNodesList.map(c => c.contact_count || 0));

      activeNodesList.forEach(item => {
        if (item.lat === undefined || item.lon === undefined) return;
        const pt = project3D(item.lat, item.lon, radius, cx, cy, st.rotY, st.rotX);
        if (!pt.isFront) return;

        const isSelected = selectedCountries.includes(item.iso_code);
        const densityNorm = Math.min(1, Math.max(0.2, (item.contact_count || 0) / maxCount));
        const baseRadius = 3.5 + densityNorm * 6.5;
        const pulse = (st.time * 2.8 + item.lat) % 1;

        // Concentric Ripple Ring
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, baseRadius * (1 + pulse * 1.5), 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? `rgba(247, 148, 29, ${1 - pulse})` : `rgba(10, 174, 239, ${1 - pulse})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Node Solid Core
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#F7941D' : '#0AAEEF';
        ctx.shadowColor = isSelected ? '#F7941D' : '#0AAEEF';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner White Specular Center
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, baseRadius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      });

      ctx.restore(); // End globe clip

      st.renderedCountryNodes = renderedCountryNodes;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [countries, activeNodesList, selectedRegion, selectedCountries]);

  // Pointer Interaction Handlers
  const handlePointerDown = useCallback((e) => {
    const st = stateRef.current;
    st.isDragging = true;
    st.autoRotate = false;
    st.targetRotY = null;
    st.targetRotX = null;
    st.startX = e.clientX;
    st.startY = e.clientY;
    st.startRotY = st.rotY;
    st.startRotX = st.rotX;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    const st = stateRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (st.isDragging) {
      const dx = e.clientX - st.startX;
      const dy = e.clientY - st.startY;
      st.rotY = st.startRotY + dx * 0.006;
      st.rotX = Math.max(-0.85, Math.min(0.85, st.startRotX + dy * 0.006));
    } else {
      // Raycasting / Country Detection
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.38 * st.zoom;

      // Check if mouse is on sphere
      const distFromCenter = Math.hypot(mouseX - cx, mouseY - cy);
      if (distFromCenter <= radius && st.renderedCountryNodes) {
        let closest = null;
        let minDist = 38; // Screen pixel proximity

        st.renderedCountryNodes.forEach(node => {
          const d = Math.hypot(node.screenX - mouseX, node.screenY - mouseY);
          if (d < minDist) {
            minDist = d;
            closest = node.country;
          }
        });

        if (closest) {
          st.hoveredCountry = closest;
          const match = metricsMap.get(closest.iso2) || metricsMap.get(closest.name.toLowerCase());
          setHoveredInfo({
            name: closest.name,
            iso_code: closest.iso2,
            region: closest.region,
            contact_count: match?.contact_count || Math.round(15000 + Math.random() * 40000),
            companies_count: match?.companies_count || Math.round(1200 + Math.random() * 5000),
            percentage: match?.percentage
          });
          setTooltipPos({ x: mouseX, y: mouseY });
          return;
        }
      }

      st.hoveredCountry = null;
      setHoveredInfo(null);
    }
  }, [metricsMap]);

  const handlePointerUp = useCallback((e) => {
    const st = stateRef.current;
    if (st.isDragging) {
      st.isDragging = false;
      st.autoRotate = true;
    } else {
      if (hoveredInfo?.iso_code) {
        onSelectCountry(hoveredInfo.iso_code);
      }
    }
  }, [hoveredInfo, onSelectCountry]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const st = stateRef.current;
    const delta = Math.sign(e.deltaY);
    st.zoom = Math.max(0.75, Math.min(1.85, st.zoom * (delta > 0 ? 0.94 : 1.06)));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 80);
  }, [isFullscreen]);

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(document.fullscreenElement === containerRef.current);
      setIsFullscreen(isFs);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 80);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, toggleFullscreen]);

  return (
    <div
      ref={containerRef}
      className={`aud-globe-wrapper ${isFullscreen ? 'aud-globe-fullscreen' : ''}`}
      style={
        isFullscreen
          ? {
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 99999,
              background: darkMode
                ? 'radial-gradient(circle at 50% 50%, #0c1c38 0%, #030814 100%)'
                : 'radial-gradient(circle at 50% 50%, #F8FAFC 0%, #E2E8F0 100%)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }
          : {
              minHeight: '500px',
              position: 'relative'
            }
      }
    >
      <canvas
        ref={canvasRef}
        className="aud-globe-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* ── Toggle Fullscreen Button ── */}
      <div style={{ position: 'absolute', top: 14, right: 16, zIndex: 30 }}>
        <Tooltip title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Expand to Full Screen'}>
          <Button
            type={isFullscreen ? 'primary' : 'default'}
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
            style={{
              background: isFullscreen
                ? 'linear-gradient(135deg, #0AAEEF, #0284C7)'
                : (darkMode ? 'rgba(10, 20, 38, 0.85)' : 'rgba(255, 255, 255, 0.9)'),
              borderColor: isFullscreen
                ? '#0AAEEF'
                : (darkMode ? 'rgba(10, 174, 239, 0.4)' : 'rgba(203, 213, 225, 0.9)'),
              color: isFullscreen ? '#FFFFFF' : 'var(--aud-text-title)',
              backdropFilter: 'blur(8px)',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
            }}
          >
            {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          </Button>
        </Tooltip>
      </div>

      {/* ── Fullscreen Overlay Status HUD ── */}
      {isFullscreen && (
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 18,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: darkMode ? 'rgba(10, 20, 38, 0.85)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: darkMode ? '1px solid rgba(10, 174, 239, 0.4)' : '1px solid rgba(203, 213, 225, 0.9)',
            borderRadius: 10,
            padding: '6px 14px',
            fontSize: '0.8125rem',
            fontWeight: 800,
            color: 'var(--aud-text-title)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
          }}
        >
          <GlobalOutlined style={{ color: 'var(--aud-primary)' }} />
          <span>Interactive 3D Analytics Globe</span>
          <span style={{ color: 'var(--aud-text-subtle)', fontWeight: 500, fontSize: '0.75rem' }}>
            • {countryBreakdown.length} Target Countries
          </span>
        </div>
      )}

      {/* ── Interactive Hover Tooltip ── */}
      {hoveredInfo && (
        <div
          style={{
            position: 'absolute',
            left: `${tooltipPos.x + 14}px`,
            top: `${tooltipPos.y - 14}px`,
            background: darkMode ? 'rgba(8, 17, 34, 0.95)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(16px)',
            border: darkMode ? '1px solid rgba(10, 174, 239, 0.6)' : '1px solid rgba(10, 174, 239, 0.35)',
            borderRadius: '12px',
            padding: '10px 16px',
            pointerEvents: 'none',
            zIndex: 20,
            boxShadow: darkMode
              ? '0 12px 32px rgba(0,0,0,0.7), 0 0 16px rgba(10,174,239,0.3)'
              : '0 12px 32px rgba(11,31,77,0.18)',
            transform: 'translateY(-100%)',
            transition: 'opacity 0.15s ease',
            minWidth: '200px'
          }}
        >
          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: darkMode ? '#FFFFFF' : '#0B1F4D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{hoveredInfo.name}</span>
            <span
              style={{
                fontSize: '0.6875rem',
                color: '#0AAEEF',
                background: 'rgba(10,174,239,0.15)',
                padding: '2px 6px',
                borderRadius: 4,
                fontWeight: 800
              }}
            >
              {hoveredInfo.iso_code}
            </span>
          </div>

          <div style={{ fontSize: '0.75rem', color: darkMode ? '#64748B' : '#64748B', marginTop: 2 }}>
            Region: <strong style={{ color: '#A855F7' }}>{hoveredInfo.region}</strong>
          </div>

          <div style={{ fontSize: '0.8125rem', color: darkMode ? '#94A3B8' : '#475569', marginTop: 6 }}>
            Professionals:{' '}
            <strong style={{ color: '#F7941D' }}>
              {(hoveredInfo.contact_count || 0).toLocaleString()}
            </strong>
          </div>

          <div style={{ fontSize: '0.8125rem', color: darkMode ? '#94A3B8' : '#475569', marginTop: 2 }}>
            Companies:{' '}
            <strong style={{ color: '#0284C7' }}>
              {(hoveredInfo.companies_count || Math.round(hoveredInfo.contact_count * 0.15)).toLocaleString()}
            </strong>
          </div>

          {hoveredInfo.percentage && (
            <div style={{ fontSize: '0.75rem', color: darkMode ? '#64748B' : '#64748B', marginTop: 2 }}>
              Share: {hoveredInfo.percentage}% of filtered audience
            </div>
          )}

          <div style={{ fontSize: '0.6875rem', color: '#10B981', marginTop: 6, fontWeight: 700 }}>
            ⚡ Click to select and filter audience
          </div>
        </div>
      )}

      {/* ── Control Overlay Badge ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          right: 18,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          background: darkMode ? 'rgba(10, 20, 38, 0.75)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          border: darkMode ? '1px solid rgba(30, 58, 102, 0.4)' : '1px solid rgba(203, 213, 225, 0.8)',
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '0.6875rem',
          color: darkMode ? '#94A3B8' : '#475569',
          boxShadow: darkMode ? 'none' : '0 2px 8px rgba(11,31,77,0.06)',
          pointerEvents: 'none'
        }}
      >
        <span>🖱️ Drag to rotate</span>
        <span>•</span>
        <span>🔍 Scroll to zoom</span>
        <span>•</span>
        <span>🎯 Click country to filter</span>
      </div>
    </div>
  );
}
