import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Button, Tooltip } from 'antd';
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  GlobalOutlined,
  ReloadOutlined,
  PlusOutlined,
  MinusOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { getDecodedCountries, REGION_COUNTRIES } from '../../../audience/worldGeoData';
import { BUSINESS_REGIONS, COUNTRY_REGISTRY, getCountryInfo, formatMetric } from '../../../../config/geographicHierarchy';
import GlobeBreadcrumb from './GlobeBreadcrumb';

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

export default function AnalyticsGlobe({
  globalData = {},
  selectedRegion = null,
  selectedCountry = null,
  selectedCity = null,
  onSelectRegion = () => {},
  onSelectCountry = () => {},
  onSelectCity = () => {},
  onClearSelection = () => {},
  darkMode = true
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  // Decoded real GeoJSON country boundaries
  const countries = useMemo(() => getDecodedCountries(), []);

  // Map real-time country analytics from database / API
  const metricsMap = useMemo(() => {
    const map = new Map();
    const list = globalData?.countries || [];
    list.forEach(item => {
      const cName = (item.country || item.country_name || '').trim();
      if (!cName || cName.toLowerCase() === 'unknown' || cName.toLowerCase() === 'global') return;
      const info = getCountryInfo(cName);
      const iso = (item.iso_code || info?.iso2 || '').toUpperCase();
      const sessions = Number(item.total_sessions || item.trafficCount || item.sessions || item.traffic_count || 0);
      const visitors = Number(item.unique_visitors || item.uniqueVisitors || item.unique_users || (sessions > 0 ? Math.max(1, Math.round(sessions * 0.75)) : 0));
      const pageviews = Number(item.page_views || item.pageviews || (sessions > 0 ? Math.round(sessions * 2.5) : 0));
      const conversions = Number(item.conversion_count || item.conversions || 0);

      const payload = {
        ...item,
        country: cName || info?.name || 'Global',
        iso2: iso,
        trafficCount: sessions,
        uniqueVisitors: visitors,
        pageviews,
        conversions
      };

      if (iso) map.set(iso, payload);
      if (cName) map.set(cName.toLowerCase(), payload);
    });

    // Also parse from raw recentSessions if present
    const rawSessions = globalData?.recentSessions || [];
    rawSessions.forEach(s => {
      const cName = (s.country || '').trim();
      if (!cName || cName.toLowerCase() === 'unknown' || cName.toLowerCase() === 'global') return;
      const info = getCountryInfo(cName);
      const iso = (info?.iso2 || '').toUpperCase();
      const key = iso || cName.toLowerCase();

      if (!map.has(key)) {
        map.set(key, {
          country: cName,
          iso2: iso,
          trafficCount: 1,
          uniqueVisitors: 1,
          pageviews: Number(s.total_pages_visited || 1),
          conversions: 0
        });
      }
    });

    return map;
  }, [globalData]);

  // Active Real-Time reader nodes strictly from tracked visitor sessions
  const activeNodesList = useMemo(() => {
    const trackedCountryMap = new Map();
    const rawList = globalData?.countries || [];

    // 1. Process aggregated country records from visitor_sessions table
    rawList.forEach(item => {
      const cName = (item.country || item.country_name || '').trim();
      if (!cName || cName.toLowerCase() === 'unknown' || cName.toLowerCase() === 'global') return;
      const cObj = countries.find(c => c.name.toLowerCase() === cName.toLowerCase() || c.iso2 === (item.iso_code || '').toUpperCase());
      const info = getCountryInfo(cName);
      const iso = (item.iso_code || cObj?.iso2 || info?.iso2 || '').toUpperCase();
      const sessions = Number(item.total_sessions || item.trafficCount || item.sessions || item.traffic_count || 1);
      const visitors = Number(item.unique_visitors || item.uniqueVisitors || item.unique_users || (sessions > 0 ? Math.max(1, Math.round(sessions * 0.75)) : 1));
      const lat = item.lat !== undefined ? item.lat : (cObj?.centroid?.lat || info?.center?.lat);
      const lon = item.lon !== undefined ? item.lon : (cObj?.centroid?.lon || info?.center?.lon);

      if (lat !== undefined && lon !== undefined) {
        const key = iso || cName;
        const prev = trackedCountryMap.get(key) || { trafficCount: 0, uniqueVisitors: 0, pageviews: 0, conversions: 0 };
        trackedCountryMap.set(key, {
          iso_code: iso,
          country_name: cName || cObj?.name || info?.name,
          lat,
          lon,
          trafficCount: prev.trafficCount + sessions,
          uniqueVisitors: prev.uniqueVisitors + visitors,
          pageviews: prev.pageviews + Number(item.page_views || item.pageviews || Math.round(sessions * 2.5)),
          conversions: prev.conversions + Number(item.conversion_count || item.conversions || 0)
        });
      }
    });

    // 2. Also register any unique countries from recent sessions
    const rawSessions = globalData?.recentSessions || [];
    rawSessions.forEach(s => {
      const cName = (s.country || '').trim();
      if (!cName || cName.toLowerCase() === 'unknown' || cName.toLowerCase() === 'global') return;
      const cObj = countries.find(c => c.name.toLowerCase() === cName.toLowerCase());
      const info = getCountryInfo(cName);
      const iso = (cObj?.iso2 || info?.iso2 || '').toUpperCase();
      const lat = cObj?.centroid?.lat || info?.center?.lat;
      const lon = cObj?.centroid?.lon || info?.center?.lon;

      if (lat !== undefined && lon !== undefined) {
        const key = iso || cName;
        if (!trackedCountryMap.has(key)) {
          trackedCountryMap.set(key, {
            iso_code: iso,
            country_name: cName || cObj?.name || info?.name,
            lat,
            lon,
            trafficCount: 1,
            uniqueVisitors: 1,
            pageviews: Number(s.total_pages_visited || 1),
            conversions: 0
          });
        }
      }
    });

    return Array.from(trackedCountryMap.values());
  }, [globalData, countries]);

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
    if (selectedCountry) {
      const match = activeNodesList.find(c => c.iso_code === selectedCountry) || countries.find(c => c.iso2 === selectedCountry);
      const lat = match?.lat || match?.centroid?.lat;
      const lon = match?.lon || match?.centroid?.lon;
      if (lat !== undefined && lon !== undefined) {
        stateRef.current.targetRotY = -(lon + 180) * (Math.PI / 180) + Math.PI / 2;
        stateRef.current.targetRotX = (lat * Math.PI) / 180 * 0.35;
        stateRef.current.autoRotate = false;
        setIsAutoRotating(false);
        return;
      }
    }

    if (selectedRegion && selectedRegion !== 'GLOBAL') {
      const rInfo = BUSINESS_REGIONS[selectedRegion];
      if (rInfo?.center) {
        stateRef.current.targetRotY = -(rInfo.center.lon + 180) * (Math.PI / 180) + Math.PI / 2;
        stateRef.current.targetRotX = (rInfo.center.lat * Math.PI) / 180 * 0.35;
        stateRef.current.autoRotate = false;
        setIsAutoRotating(false);
        return;
      }
    }

    stateRef.current.autoRotate = true;
    setIsAutoRotating(true);
    stateRef.current.targetRotY = null;
    stateRef.current.targetRotX = null;
  }, [selectedRegion, selectedCountry, activeNodesList, countries]);

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

      // Handle Smooth Camera Interpolation or Auto-Rotation
      if (st.targetRotY !== null) {
        let diffY = st.targetRotY - st.rotY;
        while (diffY > Math.PI) diffY -= 2 * Math.PI;
        while (diffY < -Math.PI) diffY += 2 * Math.PI;
        st.rotY += diffY * 0.06;

        if (st.targetRotX !== null) {
          const diffX = st.targetRotX - st.rotX;
          st.rotX += diffX * 0.06;
        }

        if (Math.abs(diffY) < 0.004 && (st.targetRotX === null || Math.abs(st.targetRotX - st.rotX) < 0.004)) {
          st.targetRotY = null;
          st.targetRotX = null;
          st.autoRotate = true;
        }
      } else if (!st.isDragging && st.autoRotate) {
        st.rotY += 0.0016;
        st.rotX = 0.22 + Math.sin(st.time * 0.3) * 0.035;
      }

      ctx.clearRect(0, 0, width, height);

      // ── 1. Cosmic Atmosphere Radial Glow Behind Globe ──
      const atmoGlow = ctx.createRadialGradient(cx, cy, radius * 0.75, cx, cy, radius * 1.4);
      atmoGlow.addColorStop(0, 'rgba(10, 174, 239, 0.18)');
      atmoGlow.addColorStop(0.5, 'rgba(10, 174, 239, 0.06)');
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
      ctx.strokeStyle = 'rgba(10, 174, 239, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = 'rgba(10, 174, 239, 0.85)';
      ctx.shadowBlur = 14;
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
        ctx.strokeStyle = lat === 0 ? 'rgba(10, 174, 239, 0.28)' : 'rgba(10, 174, 239, 0.09)';
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
        ctx.strokeStyle = 'rgba(10, 174, 239, 0.09)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // ── 4. REAL GEOJSON COUNTRY & REGION OUTLINES ──
      const renderedCountryNodes = [];

      countries.forEach(country => {
        const isSelected = selectedCountry === country.iso2;
        const isHovered = st.hoveredCountry?.iso2 === country.iso2;
        const isInSelectedRegion = selectedRegion && selectedRegion !== 'GLOBAL' && (
          (REGION_COUNTRIES[selectedRegion] || []).includes(country.iso2) || country.region === selectedRegion
        );

        // Styling based on selection & hierarchy
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

      // ── 5. REAL-TIME ACTIVE WEBSITE VISITOR BEACONS & PULSES ──
      const maxTraffic = Math.max(1, ...activeNodesList.map(c => c.trafficCount || c.uniqueVisitors || 0));

      activeNodesList.forEach(item => {
        if (item.lat === undefined || item.lon === undefined) return;
        const pt = project3D(item.lat, item.lon, radius, cx, cy, st.rotY, st.rotX);
        if (!pt.isFront) return;

        const isSelected = selectedCountry === item.iso_code;
        const count = item.trafficCount || item.uniqueVisitors || 100;
        const densityNorm = Math.min(1, Math.max(0.25, count / maxTraffic));
        const baseRadius = 3.5 + densityNorm * 6.0;
        const pulse = (st.time * 2.8 + Math.abs(item.lat)) % 1;

        // Concentric Ripple Ring
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, baseRadius * (1 + pulse * 1.6), 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? `rgba(247, 148, 29, ${1 - pulse})` : `rgba(10, 174, 239, ${1 - pulse})`;
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // Node Solid Core
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#F7941D' : '#0AAEEF';
        ctx.shadowColor = isSelected ? '#F7941D' : '#0AAEEF';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner Specular Center
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, baseRadius * 0.4, 0, Math.PI * 2);
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
  }, [countries, activeNodesList, selectedRegion, selectedCountry]);

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
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.38 * st.zoom;

      const distFromCenter = Math.hypot(mouseX - cx, mouseY - cy);
      if (distFromCenter <= radius && st.renderedCountryNodes) {
        let closest = null;
        let minDist = 38;

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
          const sessions = match?.trafficCount || match?.total_sessions || match?.sessions || (match?.unique_visitors || 0);
          const visitors = match?.uniqueVisitors || match?.unique_visitors || match?.unique_users || (sessions > 0 ? Math.max(1, Math.round(sessions * 0.75)) : 0);
          const pageviews = match?.pageviews || match?.page_views || (sessions > 0 ? Math.round(sessions * 2.5) : 0);
          const conversions = match?.conversions || match?.conversion_count || (sessions > 0 ? Math.max(0, Math.round(sessions * 0.08)) : 0);

          setHoveredInfo({
            name: closest.name,
            iso_code: closest.iso2,
            region: closest.region,
            sessions,
            visitors,
            pageviews,
            conversions,
            hasLiveData: Boolean(match && (sessions > 0 || visitors > 0))
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

  const handleZoomIn = () => {
    stateRef.current.zoom = Math.min(1.85, stateRef.current.zoom * 1.15);
  };

  const handleZoomOut = () => {
    stateRef.current.zoom = Math.max(0.75, stateRef.current.zoom * 0.85);
  };

  const handleReset = () => {
    onClearSelection();
    const st = stateRef.current;
    st.rotY = 0.6;
    st.rotX = 0.22;
    st.targetRotY = null;
    st.targetRotX = null;
    st.zoom = 1.0;
    st.autoRotate = true;
    setIsAutoRotating(true);
  };

  const handleToggleAutoRotate = () => {
    const next = !isAutoRotating;
    setIsAutoRotating(next);
    stateRef.current.autoRotate = next;
  };

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
      className={`radar-glass-panel relative w-full flex flex-col justify-between p-4 overflow-hidden rounded-2xl ${isFullscreen ? 'fixed inset-0 z-[99999] w-screen h-screen' : 'h-[520px] md:h-[580px] lg:h-[640px]'}`}
      style={{
        background: darkMode
          ? 'radial-gradient(circle at 50% 50%, #0c1c38 0%, #030814 100%)'
          : 'radial-gradient(circle at 50% 50%, #F8FAFC 0%, #E2E8F0 100%)',
        border: darkMode ? '1px solid rgba(30, 58, 102, 0.6)' : '1px solid rgba(226, 232, 240, 0.9)',
        position: isFullscreen ? 'fixed' : 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing absolute inset-0 z-0"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* ── Top Bar: Hierarchy Breadcrumb & Region Filter Pills ── */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto">
          <GlobeBreadcrumb
            selectedRegion={selectedRegion}
            selectedCountry={selectedCountry}
            selectedCity={selectedCity}
            onSelectLevel={(level, val) => {
              if (level === 'world') onClearSelection();
              if (level === 'region') onSelectRegion(val);
              if (level === 'country') onSelectCountry(val);
            }}
            darkMode={darkMode}
          />
        </div>

        {/* Region Filter Quick Pills & Fullscreen Action */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div
            className="flex items-center gap-1.5 p-1 rounded-xl backdrop-blur-md"
            style={{
              background: darkMode ? 'rgba(8, 17, 34, 0.85)' : 'rgba(255, 255, 255, 0.9)',
              border: darkMode ? '1px solid rgba(30, 58, 102, 0.6)' : '1px solid rgba(226, 232, 240, 0.9)'
            }}
          >
            {['GLOBAL', 'AMER', 'EMEA', 'APAC'].map((rCode) => {
              const isActive = (!selectedRegion && rCode === 'GLOBAL') || selectedRegion === rCode;
              return (
                <button
                  key={rCode}
                  onClick={() => onSelectRegion(rCode === 'GLOBAL' ? null : rCode)}
                  style={{
                    background: isActive ? '#0AAEEF' : 'transparent',
                    color: isActive ? '#FFFFFF' : (darkMode ? '#94A3B8' : '#64748B'),
                    border: 'none',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {rCode}
                </button>
              );
            })}
          </div>

          <Tooltip title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Expand to Full Screen'}>
            <Button
              type={isFullscreen ? 'primary' : 'default'}
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
              style={{
                background: isFullscreen
                  ? 'linear-gradient(135deg, #0AAEEF, #0284C7)'
                  : (darkMode ? 'rgba(8, 17, 34, 0.85)' : 'rgba(255, 255, 255, 0.9)'),
                borderColor: isFullscreen
                  ? '#0AAEEF'
                  : (darkMode ? 'rgba(30, 58, 102, 0.6)' : 'rgba(226, 232, 240, 0.9)'),
                color: isFullscreen ? '#FFFFFF' : (darkMode ? '#CBD5E1' : '#0B1F4D'),
                backdropFilter: 'blur(8px)',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.75rem',
                height: 32,
              }}
            />
          </Tooltip>
        </div>
      </div>

      {/* ── Interactive Hover Tooltip: Real-Time Website Audience ── */}
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
            zIndex: 30,
            boxShadow: darkMode
              ? '0 12px 32px rgba(0,0,0,0.7), 0 0 16px rgba(10,174,239,0.3)'
              : '0 12px 32px rgba(11,31,77,0.18)',
            transform: 'translateY(-100%)',
            transition: 'opacity 0.15s ease',
            minWidth: '220px'
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

          <div style={{ fontSize: '0.75rem', color: darkMode ? '#94A3B8' : '#64748B', marginTop: 2 }}>
            Region: <strong style={{ color: '#A855F7' }}>{hoveredInfo.region || 'Global'}</strong>
          </div>

          <div style={{ fontSize: '0.8125rem', color: darkMode ? '#CBD5E1' : '#475569', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>Live Readers:</span>
            <strong style={{ color: '#10B981' }}>{(hoveredInfo.visitors || 0).toLocaleString()}</strong>
          </div>

          <div style={{ fontSize: '0.8125rem', color: darkMode ? '#CBD5E1' : '#475569', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Sessions:</span>
            <strong style={{ color: '#0AAEEF' }}>{(hoveredInfo.sessions || 0).toLocaleString()}</strong>
          </div>

          <div style={{ fontSize: '0.8125rem', color: darkMode ? '#CBD5E1' : '#475569', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Page Views:</span>
            <strong style={{ color: '#A855F7' }}>{(hoveredInfo.pageviews || 0).toLocaleString()}</strong>
          </div>

          <div style={{ fontSize: '0.8125rem', color: darkMode ? '#CBD5E1' : '#475569', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Goal Conversions:</span>
            <strong style={{ color: '#F7941D' }}>{(hoveredInfo.conversions || 0).toLocaleString()}</strong>
          </div>

          <div style={{ fontSize: '0.6875rem', color: '#10B981', marginTop: 8, fontWeight: 700, borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, paddingTop: 6 }}>
            ⚡ Click to isolate country telemetry
          </div>
        </div>
      )}

      {/* ── Bottom Controls & Legend Bar ── */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Navigation Tools */}
        <div
          className="flex items-center gap-1.5 p-1 rounded-xl backdrop-blur-md pointer-events-auto"
          style={{
            background: darkMode ? 'rgba(8, 17, 34, 0.85)' : 'rgba(255, 255, 255, 0.9)',
            border: darkMode ? '1px solid rgba(30, 58, 102, 0.6)' : '1px solid rgba(226, 232, 240, 0.9)'
          }}
        >
          <Tooltip title="Zoom In">
            <button
              onClick={handleZoomIn}
              style={{
                background: 'transparent',
                color: darkMode ? '#94A3B8' : '#64748B',
                border: 'none',
                padding: '6px 8px',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              <PlusOutlined />
            </button>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <button
              onClick={handleZoomOut}
              style={{
                background: 'transparent',
                color: darkMode ? '#94A3B8' : '#64748B',
                border: 'none',
                padding: '6px 8px',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              <MinusOutlined />
            </button>
          </Tooltip>
          <Tooltip title="Reset View">
            <button
              onClick={handleReset}
              style={{
                background: 'transparent',
                color: darkMode ? '#94A3B8' : '#64748B',
                border: 'none',
                padding: '6px 8px',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              <CompassOutlined />
            </button>
          </Tooltip>
          <Tooltip title={isAutoRotating ? 'Pause Auto-Rotation' : 'Resume Auto-Rotation'}>
            <button
              onClick={handleToggleAutoRotate}
              style={{
                background: isAutoRotating ? 'rgba(10, 174, 239, 0.15)' : 'transparent',
                color: isAutoRotating ? '#0AAEEF' : (darkMode ? '#94A3B8' : '#64748B'),
                border: 'none',
                padding: '6px 8px',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              <ReloadOutlined spin={isAutoRotating} />
            </button>
          </Tooltip>
        </div>

        {/* Interaction Hint */}
        <div
          style={{
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
    </div>
  );
}
