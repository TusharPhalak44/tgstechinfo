import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { extractWorldBoundaries, latLonToVector3, createWorldTexture } from '../../../../utils/geoJsonProcessor';
import { 
  BUSINESS_REGIONS, 
  COUNTRY_REGISTRY, 
  getCountryInfo, 
  formatMetric 
} from '../../../../config/geographicHierarchy';
import GlobeBreadcrumb from './GlobeBreadcrumb';
import GlobeControls from './GlobeControls';
import GlobeTooltip from './GlobeTooltip';

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
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const globeGroupRef = useRef(null);
  const bordersMeshRef = useRef(null);
  const citiesGroupRef = useRef(null);
  const arcsGroupRef = useRef(null);

  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Camera & Interaction State
  const stateRef = useRef({
    radius: 100,
    rotY: 0.5,
    rotX: 0.2,
    targetRotY: null,
    targetRotX: null,
    targetDistance: 280,
    currentDistance: 280,
    isDragging: false,
    startX: 0,
    startY: 0,
    startRotY: 0,
    startRotX: 0,
    autoRotate: true,
    hoveredCountry: null,
    time: 0
  });

  // Calculate dynamic metrics dictionary by country code/name
  const countryMetricsMap = useMemo(() => {
    const map = new Map();
    const list = globalData?.countries || [];
    list.forEach(item => {
      const info = getCountryInfo(item.country);
      if (info?.iso2) {
        map.set(info.iso2, item);
      }
      map.set(item.country.toLowerCase(), item);
    });
    return map;
  }, [globalData]);

  // Top active cities to render as 3D beacons
  const cityPoints = useMemo(() => {
    const points = [];
    // If a country is selected, show that country's cities
    if (selectedCountry && COUNTRY_REGISTRY[selectedCountry]?.cities) {
      const reg = COUNTRY_REGISTRY[selectedCountry];
      reg.cities.forEach(city => {
        points.push({
          ...city,
          country: reg.name,
          iso: selectedCountry,
          flag: reg.flag,
          trafficCount: Math.round((countryMetricsMap.get(selectedCountry)?.trafficCount || 100) * 0.35)
        });
      });
    } else {
      // Global top hubs
      Object.entries(COUNTRY_REGISTRY).forEach(([iso, reg]) => {
        if (reg.cities && reg.cities.length > 0) {
          const topCity = reg.cities[0];
          const countryData = countryMetricsMap.get(iso);
          points.push({
            ...topCity,
            country: reg.name,
            iso,
            flag: reg.flag,
            trafficCount: countryData?.trafficCount || 120
          });
        }
      });
    }
    return points;
  }, [selectedCountry, countryMetricsMap]);

  // Smooth camera orientation transition when selection changes
  useEffect(() => {
    const st = stateRef.current;
    if (selectedCity && selectedCountry) {
      const city = COUNTRY_REGISTRY[selectedCountry]?.cities?.find(c => c.name === selectedCity);
      if (city) {
        st.targetRotY = -(city.lon + 180) * (Math.PI / 180) + Math.PI / 2;
        st.targetRotX = (city.lat * Math.PI) / 180 * 0.45;
        st.targetDistance = 160; // Deep zoom into city
        st.autoRotate = false;
        setIsAutoRotating(false);
        return;
      }
    }

    if (selectedCountry) {
      const cInfo = COUNTRY_REGISTRY[selectedCountry];
      if (cInfo?.center) {
        st.targetRotY = -(cInfo.center.lon + 180) * (Math.PI / 180) + Math.PI / 2;
        st.targetRotX = (cInfo.center.lat * Math.PI) / 180 * 0.4;
        st.targetDistance = 190; // Zoom into country
        st.autoRotate = false;
        setIsAutoRotating(false);
        return;
      }
    }

    if (selectedRegion && BUSINESS_REGIONS[selectedRegion]?.center) {
      const rCenter = BUSINESS_REGIONS[selectedRegion].center;
      st.targetRotY = -(rCenter.lon + 180) * (Math.PI / 180) + Math.PI / 2;
      st.targetRotX = (rCenter.lat * Math.PI) / 180 * 0.35;
      st.targetDistance = 230; // Medium regional zoom
      st.autoRotate = false;
      setIsAutoRotating(false);
      return;
    }

    // Reset to global view
    st.targetRotY = null;
    st.targetRotX = null;
    st.targetDistance = 280;
    st.autoRotate = true;
    setIsAutoRotating(true);
  }, [selectedRegion, selectedCountry, selectedCity]);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 520;
    const radius = 100;
    stateRef.current.radius = radius;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1500);
    camera.position.z = 280;
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // 3. Globe Parent Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // ── Sphere Base Core with Mapped GeoJSON Country Texture ──
    const worldTexture = createWorldTexture();
    const sphereGeometry = new THREE.SphereGeometry(radius, 64, 64);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      map: worldTexture,
      roughness: 0.75,
      metalness: 0.15
    });
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    globeGroup.add(sphereMesh);

    // ── Atmospheric Glow Halo ──
    const atmoGeometry = new THREE.SphereGeometry(radius * 1.14, 48, 48);
    const atmoMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
          gl_FragColor = vec4(0.039, 0.682, 0.937, 1.0) * intensity * 0.45;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmoMesh = new THREE.Mesh(atmoGeometry, atmoMaterial);
    scene.add(atmoMesh);

    // ── Latitude & Longitude Wireframe Grid ──
    const gridGroup = new THREE.Group();
    const gridMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(0x0AAEEF),
      transparent: true,
      opacity: 0.15
    });

    [-60, -30, 0, 30, 60].forEach(lat => {
      const points = [];
      for (let lon = -180; lon <= 180; lon += 3) {
        points.push(latLonToVector3(lat, lon, radius * 1.004));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      gridGroup.add(new THREE.Line(geom, gridMaterial));
    });

    for (let lon = -180; lon < 180; lon += 30) {
      const points = [];
      for (let lat = -85; lat <= 85; lat += 3) {
        points.push(latLonToVector3(lat, lon, radius * 1.004));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      gridGroup.add(new THREE.Line(geom, gridMaterial));
    }
    globeGroup.add(gridGroup);

    // ── GeoJSON 3D Glowing Country Vector Outlines directly on the Sphere ──
    const { bordersGeometry } = extractWorldBoundaries(radius * 1.008);
    const borderMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(0x00F0FF),
      transparent: true,
      opacity: 0.95,
      depthTest: true,
      depthWrite: false
    });
    const bordersMesh = new THREE.LineSegments(bordersGeometry, borderMaterial);
    bordersMesh.renderOrder = 5;
    globeGroup.add(bordersMesh);
    bordersMeshRef.current = bordersMesh;

    // ── City Beacons & Pulse Group ──
    const citiesGroup = new THREE.Group();
    globeGroup.add(citiesGroup);
    citiesGroupRef.current = citiesGroup;

    // ── Flight & Connection Arcs Group ──
    const arcsGroup = new THREE.Group();
    globeGroup.add(arcsGroup);
    arcsGroupRef.current = arcsGroup;

    // ── Lighting ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x0AAEEF, 1.4);
    dirLight1.position.set(200, 150, 300);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xF7941D, 0.6);
    dirLight2.position.set(-200, -100, -200);
    scene.add(dirLight2);

    // ── Render & Animation Loop ──
    let animId;
    const render = () => {
      const st = stateRef.current;
      st.time += 0.015;

      // Handle Smooth Rotation Lerp or Auto-Rotation
      if (st.targetRotY !== null) {
        let diffY = st.targetRotY - st.rotY;
        while (diffY > Math.PI) diffY -= 2 * Math.PI;
        while (diffY < -Math.PI) diffY += 2 * Math.PI;
        st.rotY += diffY * 0.06;

        if (st.targetRotX !== null) {
          const diffX = st.targetRotX - st.rotX;
          st.rotX += diffX * 0.06;
        }
      } else if (st.autoRotate && !st.isDragging) {
        st.rotY += 0.003;
      }

      // Smooth Camera Distance Zoom Lerp
      st.currentDistance += (st.targetDistance - st.currentDistance) * 0.08;
      camera.position.z = st.currentDistance;

      // Apply rotations to Globe Group
      globeGroup.rotation.y = st.rotY;
      globeGroup.rotation.x = st.rotX;

      // Animate pulsing city beacons
      if (citiesGroupRef.current) {
        citiesGroupRef.current.children.forEach(child => {
          if (child.userData?.isPulseRing) {
            const scale = 1 + ((st.time * 2 + child.userData.offset) % 1) * 1.5;
            child.scale.set(scale, scale, scale);
            if (child.material) {
              child.material.opacity = Math.max(0, 1 - (scale - 1) / 1.5) * 0.7;
            }
          }
        });
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.clear();
    };
  }, [darkMode]);

  // Update 3D City Beacons on Data or Selection Change
  useEffect(() => {
    const citiesGroup = citiesGroupRef.current;
    if (!citiesGroup) return;

    // Clear old city beacons
    while (citiesGroup.children.length > 0) {
      const child = citiesGroup.children[0];
      citiesGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    const radius = stateRef.current.radius;

    cityPoints.forEach((city, idx) => {
      const isSelected = selectedCity === city.name;
      const isCountrySelected = selectedCountry === city.iso;

      const pos = latLonToVector3(city.lat, city.lon, radius * 1.008);
      const color = isSelected ? 0x10B981 : (isCountrySelected ? 0xF7941D : 0x0AAEEF);

      // 1. Core Pin Dot
      const pinGeom = new THREE.SphereGeometry(isSelected ? 3.0 : 2.2, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      pinMesh.position.copy(pos);
      pinMesh.userData = { city, isCityNode: true };
      citiesGroup.add(pinMesh);

      // 2. Holographic Stem Line
      const stemTop = latLonToVector3(city.lat, city.lon, radius * (isSelected ? 1.14 : 1.08));
      const stemGeom = new THREE.BufferGeometry().setFromPoints([pos, stemTop]);
      const stemMat = new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.85 });
      const stem = new THREE.Line(stemGeom, stemMat);
      citiesGroup.add(stem);

      // 3. Top Floating Beacon Head
      const headGeom = new THREE.SphereGeometry(1.6, 12, 12);
      const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const headMesh = new THREE.Mesh(headGeom, headMat);
      headMesh.position.copy(stemTop);
      citiesGroup.add(headMesh);

      // 4. Pulsing Wave Ring on Surface
      const ringGeom = new THREE.RingGeometry(2.5, 4.5, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      ringMesh.userData = { isPulseRing: true, offset: idx * 0.3 };
      citiesGroup.add(ringMesh);
    });
  }, [cityPoints, selectedCountry, selectedCity]);

  // Pointer Drag & Interaction Handlers
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
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (st.isDragging) {
      const dx = e.clientX - st.startX;
      const dy = e.clientY - st.startY;
      st.rotY = st.startRotY + dx * 0.006;
      st.rotX = Math.max(-0.9, Math.min(0.9, st.startRotX + dy * 0.006));
    } else {
      // 3D Raycasting for Hover Detection
      if (!cameraRef.current || !globeGroupRef.current) return;
      const raycaster = new THREE.Raycaster();
      const mouseVec = new THREE.Vector2(
        (mouseX / rect.width) * 2 - 1,
        -(mouseY / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouseVec, cameraRef.current);
      const intersects = raycaster.intersectObjects(globeGroupRef.current.children, true);

      const hitCity = intersects.find(hit => hit.object.userData?.isCityNode);
      if (hitCity) {
        const cityData = hitCity.object.userData.city;
        setTooltipData({
          name: cityData.name,
          flag: cityData.flag,
          region: cityData.state,
          type: 'city',
          trafficCount: cityData.trafficCount,
          uniqueVisitors: Math.round(cityData.trafficCount * 0.7)
        });
        setTooltipPos({ x: mouseX, y: mouseY });
        return;
      }

      // Check Country Centroid Proximity
      const hitSphere = intersects.find(hit => hit.object.type === 'Mesh');
      if (hitSphere && hitSphere.point) {
        const p = hitSphere.point.clone().applyMatrix4(globeGroupRef.current.matrixWorld.clone().invert());
        const norm = p.normalize();
        const lat = 90 - Math.acos(norm.y) * (180 / Math.PI);
        const lon = (Math.atan2(norm.z, -norm.x) * (180 / Math.PI)) - 180;

        let closestCountry = null;
        let minDist = 18; // Degrees threshold

        Object.entries(COUNTRY_REGISTRY).forEach(([iso, c]) => {
          const d = Math.hypot(lat - c.center.lat, lon - c.center.lon);
          if (d < minDist) {
            minDist = d;
            const metrics = countryMetricsMap.get(iso) || countryMetricsMap.get(c.name.toLowerCase()) || {};
            closestCountry = {
              name: c.name,
              iso: c.iso2,
              flag: c.flag,
              region: c.region,
              type: 'country',
              trafficCount: metrics.trafficCount || metrics.total_sessions || 120,
              uniqueVisitors: metrics.uniqueVisitors || metrics.unique_visitors || 85,
              pageviews: metrics.pageviews || 310,
              conversions: metrics.conversions || 12
            };
          }
        });

        if (closestCountry) {
          st.hoveredCountry = closestCountry;
          setTooltipData(closestCountry);
          setTooltipPos({ x: mouseX, y: mouseY });
          return;
        }
      }

      st.hoveredCountry = null;
      setTooltipData(null);
    }
  }, [countryMetricsMap]);

  const handlePointerUp = useCallback((e) => {
    const st = stateRef.current;
    if (st.isDragging) {
      st.isDragging = false;
    } else {
      // Click selection
      if (tooltipData) {
        if (tooltipData.type === 'city') {
          onSelectCity(tooltipData.name);
        } else if (tooltipData.type === 'country' && tooltipData.iso) {
          onSelectCountry(tooltipData.iso);
        }
      } else {
        onClearSelection();
      }
    }
  }, [tooltipData, onSelectCountry, onSelectCity, onClearSelection]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const st = stateRef.current;
    const delta = Math.sign(e.deltaY);
    st.targetDistance = Math.max(140, Math.min(380, st.targetDistance + delta * 20));
  }, []);

  const handleZoomIn = () => {
    const st = stateRef.current;
    st.targetDistance = Math.max(140, st.targetDistance - 35);
  };

  const handleZoomOut = () => {
    const st = stateRef.current;
    st.targetDistance = Math.min(380, st.targetDistance + 35);
  };

  const handleReset = () => {
    onClearSelection();
    const st = stateRef.current;
    st.rotY = 0.5;
    st.rotX = 0.2;
    st.targetRotY = null;
    st.targetRotX = null;
    st.targetDistance = 280;
    st.autoRotate = true;
    setIsAutoRotating(true);
  };

  const handleToggleAutoRotate = () => {
    const next = !isAutoRotating;
    setIsAutoRotating(next);
    stateRef.current.autoRotate = next;
  };

  return (
    <div
      ref={containerRef}
      className="radar-glass-panel relative w-full h-[520px] md:h-[580px] lg:h-[640px] flex flex-col justify-between p-4 overflow-hidden rounded-2xl"
      style={{
        background: darkMode ? 'radial-gradient(circle at center, #0B1E3B 0%, #050D1A 100%)' : '#F8FAFC',
        border: darkMode ? '1px solid rgba(30, 58, 102, 0.6)' : '1px solid rgba(226, 232, 240, 0.9)'
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

      {/* ── Top Bar: Hierarchy Breadcrumb & Region Quick Tabs ── */}
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

        {/* Region Filter Buttons */}
        <div
          className="flex items-center gap-1.5 p-1 rounded-xl backdrop-blur-md pointer-events-auto"
          style={{
            background: darkMode ? 'rgba(8, 17, 34, 0.85)' : 'rgba(255, 255, 255, 0.9)',
            border: darkMode ? '1px solid rgba(30, 58, 102, 0.6)' : '1px solid rgba(226, 232, 240, 0.9)'
          }}
        >
          {Object.entries(BUSINESS_REGIONS).map(([code, reg]) => {
            const isSelected = selectedRegion === code;
            return (
              <button
                key={code}
                onClick={() => onSelectRegion(code)}
                style={{
                  background: isSelected ? reg.color : 'transparent',
                  color: isSelected ? '#FFFFFF' : (darkMode ? '#94A3B8' : '#64748B'),
                  border: 'none',
                  borderRadius: 8,
                  padding: '4px 10px',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 2px 10px ${reg.glowColor}` : 'none'
                }}
              >
                {code}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Interactive Raycaster Tooltip ── */}
      <GlobeTooltip data={tooltipData} position={tooltipPos} darkMode={darkMode} />

      {/* ── Floating Globe Controls ── */}
      <GlobeControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        isAutoRotating={isAutoRotating}
        onToggleAutoRotate={handleToggleAutoRotate}
        darkMode={darkMode}
      />

      {/* ── Bottom Left Legend ── */}
      <div
        className="relative z-10 flex items-center gap-4 text-[11px] font-semibold pointer-events-none px-3 py-1.5 rounded-full w-fit backdrop-blur-md"
        style={{
          background: darkMode ? 'rgba(8, 17, 34, 0.75)' : 'rgba(255, 255, 255, 0.8)',
          border: darkMode ? '1px solid rgba(30, 58, 102, 0.4)' : '1px solid rgba(226, 232, 240, 0.8)',
          color: darkMode ? '#94A3B8' : '#64748B'
        }}
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0AAEEF]" /> AMER
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#A855F7]" /> EMEA
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" /> APAC
        </span>
        <span className="flex items-center gap-1.5 text-[#F7941D]">
          <span className="w-2 h-2 rounded-full bg-[#F7941D]" /> Selected
        </span>
      </div>
    </div>
  );
}
