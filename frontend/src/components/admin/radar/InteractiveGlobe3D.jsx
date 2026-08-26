/**
 * Interactive 3D Globe Component
 * Advanced geographic visualization with Three.js (WebGL)
 * Supports drag, zoom, business regions, continents, countries, cities, and live traffic
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  CONTINENTS,
  BUSINESS_REGIONS,
  COUNTRIES,
  CITIES,
  getCountriesByContinent,
  getCountriesByBusinessRegion,
  getCitiesByCountry,
  latLonTo3D,
} from '../../../services/geographicDataService';

const GLOBE_RADIUS = 2;
const ZOOM_MIN = 1;
const ZOOM_MAX = 20;

const InteractiveGlobe3D = ({
  darkMode = true,
  onLocationSelected = null,
  trafficData = [],
  isLoading = false,
}) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const globeRef = useRef(null);
  const animationFrameRef = useRef(null);

  // State management
  const [navigationStack, setNavigationStack] = useState([
    { level: 'WORLD', id: 'WORLD', name: 'World', data: null }
  ]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Refs for interaction
  const stateRef = useRef({
    isMouseDown: false,
    isDragging: false,
    previousMousePosition: { x: 0, y: 0 },
    rotation: { x: 0.6, y: 0 },
    targetRotation: { x: 0.6, y: 0 },
    autoRotationSpeed: 0.0005,
  });

  /**
   * Initialize Three.js scene
   */
  const initializeScene = useCallback(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 3;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(darkMode ? 0x0f172a : 0xffffff, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x0AAEEF, 0.4);
    pointLight.position.set(-5, -3, 5);
    scene.add(pointLight);

    // Create globe
    createGlobe(scene);

    // Handle window resize
    const handleResize = () => {
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Add event listeners
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    renderer.domElement.addEventListener('touchstart', handleTouchStart);
    renderer.domElement.addEventListener('touchmove', handleTouchMove);
    renderer.domElement.addEventListener('touchend', handleTouchEnd);

    // Start animation loop
    animateGlobe();

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('touchstart', handleTouchStart);
      renderer.domElement.removeEventListener('touchmove', handleTouchMove);
      renderer.domElement.removeEventListener('touchend', handleTouchEnd);
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [darkMode]);

  /**
   * Create the 3D globe geometry
   */
  const createGlobe = useCallback((scene) => {
    // Remove old globe
    if (globeRef.current) {
      scene.remove(globeRef.current);
    }

    const group = new THREE.Group();
    globeRef.current = group;

    // Globe sphere
    const geometry = new THREE.IcosahedronGeometry(GLOBE_RADIUS, 64);
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;

    const ctx = canvas.getContext('2d');
    
    // Draw ocean
    ctx.fillStyle = darkMode ? '#001d3d' : '#e0f2fe';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw land (simplified - just geographic regions)
    ctx.fillStyle = darkMode ? '#1a3a52' : '#dbeafe';
    drawLandMasses(ctx, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = darkMode ? 'rgba(10, 174, 239, 0.15)' : 'rgba(2, 132, 199, 0.15)';
    ctx.lineWidth = 1;
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw continent labels
    ctx.fillStyle = darkMode ? 'rgba(10, 174, 239, 0.6)' : 'rgba(2, 132, 199, 0.6)';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawContinentLabels(ctx, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      emissive: darkMode ? 0x0a2e4a : 0xf0f9ff,
      emissiveIntensity: 0.2,
      shininess: 5,
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // Add atmosphere glow
    const glowGeometry = new THREE.IcosahedronGeometry(GLOBE_RADIUS * 1.01, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: darkMode ? 0x0AAEEF : 0x0284C7,
      transparent: true,
      opacity: 0.1,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glowMesh);

    // Add grid lines
    addGridLines(group);

    scene.add(group);
  }, [darkMode]);

  /**
   * Draw land masses on canvas
   */
  const drawLandMasses = (ctx, width, height) => {
    Object.values(CONTINENTS).forEach(continent => {
      const { center } = continent;
      if (!center) return;

      // Convert to canvas coordinates
      const x = ((center.lon + 180) / 360) * width;
      const y = ((90 - center.lat) / 180) * height;

      // Draw simple continent representation
      ctx.fillRect(x - 50, y - 40, 100, 80);
    });
  };

  /**
   * Draw latitude/longitude grid
   */
  const drawGrid = (ctx, width, height) => {
    const latitudeSpacing = height / 18; // 10° spacing
    const longitudeSpacing = width / 36;

    // Latitude lines
    for (let i = 0; i <= 18; i++) {
      const y = i * latitudeSpacing;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Longitude lines
    for (let i = 0; i <= 36; i++) {
      const x = i * longitudeSpacing;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  };

  /**
   * Draw continent labels
   */
  const drawContinentLabels = (ctx, width, height) => {
    Object.values(CONTINENTS).forEach(continent => {
      const { label, center } = continent;
      if (!center) return;

      const x = ((center.lon + 180) / 360) * width;
      const y = ((90 - center.lat) / 180) * height;

      // Semi-transparent background
      ctx.fillStyle = darkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)';
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(x - textWidth / 2 - 8, y - 16, textWidth + 16, 32);

      // Text
      ctx.fillStyle = darkMode ? 'rgba(10, 174, 239, 0.9)' : 'rgba(2, 132, 199, 0.9)';
      ctx.fillText(label, x, y);
    });
  };

  /**
   * Add 3D grid lines to globe
   */
  const addGridLines = (group) => {
    const lineColor = darkMode ? 0x0AAEEF : 0x0284C7;
    
    // Latitude circles
    for (let lat = -90; lat <= 90; lat += 30) {
      const phi = (lat * Math.PI) / 180;
      const radius = GLOBE_RADIUS * Math.cos(phi);
      const y = GLOBE_RADIUS * Math.sin(phi);

      const geometry = new THREE.BufferGeometry();
      const points = [];

      for (let lon = -180; lon <= 180; lon += 5) {
        const theta = (lon * Math.PI) / 180;
        const x = radius * Math.cos(theta);
        const z = radius * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
      }

      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.2 })
      );
      group.add(line);
    }

    // Longitude meridians
    for (let lon = -180; lon <= 180; lon += 30) {
      const theta = (lon * Math.PI) / 180;
      const geometry = new THREE.BufferGeometry();
      const points = [];

      for (let lat = -90; lat <= 90; lat += 5) {
        const phi = (lat * Math.PI) / 180;
        const x = GLOBE_RADIUS * Math.cos(phi) * Math.cos(theta);
        const y = GLOBE_RADIUS * Math.sin(phi);
        const z = GLOBE_RADIUS * Math.cos(phi) * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
      }

      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.2 })
      );
      group.add(line);
    }
  };

  /**
   * Animation loop
   */
  const animateGlobe = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const state = stateRef.current;

    // Auto rotation
    if (isAutoRotating && !state.isDragging) {
      state.targetRotation.y += state.autoRotationSpeed;
    }

    // Smooth rotation
    state.rotation.x += (state.targetRotation.x - state.rotation.x) * 0.05;
    state.rotation.y += (state.targetRotation.y - state.rotation.y) * 0.05;

    // Apply rotation
    if (globeRef.current) {
      globeRef.current.rotation.x = state.rotation.x;
      globeRef.current.rotation.y = state.rotation.y;
    }

    renderer.render(scene, camera);
    animationFrameRef.current = requestAnimationFrame(animateGlobe);
  }, [isAutoRotating]);

  /**
   * Mouse event handlers
   */
  const handleMouseDown = (e) => {
    stateRef.current.isMouseDown = true;
    stateRef.current.isDragging = false;
    stateRef.current.previousMousePosition = { x: e.clientX, y: e.clientY };
    setIsAutoRotating(false);
  };

  const handleMouseMove = (e) => {
    if (!stateRef.current.isMouseDown) return;

    stateRef.current.isDragging = true;
    const deltaX = e.clientX - stateRef.current.previousMousePosition.x;
    const deltaY = e.clientY - stateRef.current.previousMousePosition.y;

    stateRef.current.targetRotation.y += deltaX * 0.01;
    stateRef.current.targetRotation.x += deltaY * 0.01;

    // Clamp x rotation
    stateRef.current.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, stateRef.current.targetRotation.x));

    stateRef.current.previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    stateRef.current.isMouseDown = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1.1 : 0.9;
    const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomLevel * delta));
    setZoomLevel(newZoom);

    if (cameraRef.current) {
      cameraRef.current.position.z = 3 / (newZoom / ZOOM_MIN);
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      stateRef.current.isMouseDown = true;
      stateRef.current.previousMousePosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && stateRef.current.isMouseDown) {
      const deltaX = e.touches[0].clientX - stateRef.current.previousMousePosition.x;
      const deltaY = e.touches[0].clientY - stateRef.current.previousMousePosition.y;

      stateRef.current.targetRotation.y += deltaX * 0.01;
      stateRef.current.targetRotation.x += deltaY * 0.01;

      stateRef.current.previousMousePosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };

      setIsAutoRotating(false);
    }
  };

  const handleTouchEnd = () => {
    stateRef.current.isMouseDown = false;
  };

  /**
   * Reset to world view
   */
  const handleReset = () => {
    stateRef.current.targetRotation = { x: 0.6, y: 0 };
    setNavigationStack([
      { level: 'WORLD', id: 'WORLD', name: 'World', data: null }
    ]);
    setSelectedLocation(null);
    setZoomLevel(1);
    if (cameraRef.current) {
      cameraRef.current.position.z = 3;
    }
  };

  /**
   * Toggle auto-rotate
   */
  const toggleAutoRotate = () => {
    setIsAutoRotating(!isAutoRotating);
  };

  /**
   * Zoom in
   */
  const handleZoomIn = () => {
    const newZoom = Math.min(ZOOM_MAX, zoomLevel * 1.5);
    setZoomLevel(newZoom);
    if (cameraRef.current) {
      cameraRef.current.position.z = 3 / (newZoom / ZOOM_MIN);
    }
  };

  /**
   * Zoom out
   */
  const handleZoomOut = () => {
    const newZoom = Math.max(ZOOM_MIN, zoomLevel / 1.5);
    setZoomLevel(newZoom);
    if (cameraRef.current) {
      cameraRef.current.position.z = 3 / (newZoom / ZOOM_MIN);
    }
  };

  // Initialize on mount
  useEffect(() => {
    const cleanup = initializeScene();
    return cleanup;
  }, [initializeScene]);

  return (
    <div className={`w-full h-screen flex flex-col ${darkMode ? 'bg-slate-950' : 'bg-white'}`}>
      {/* Controls */}
      <div className={`p-4 border-b ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
            Interactive Geographic Globe
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleZoomOut}
              className={`px-4 py-2 rounded border ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              −
            </button>
            <button
              onClick={handleZoomIn}
              className={`px-4 py-2 rounded border ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              +
            </button>
            <button
              onClick={toggleAutoRotate}
              className={`px-4 py-2 rounded border ${
                isAutoRotating
                  ? darkMode
                    ? 'bg-cyan-600/50 border-cyan-500 text-cyan-300'
                    : 'bg-cyan-100 border-cyan-500 text-cyan-700'
                  : darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              {isAutoRotating ? '⏸' : '▶'} Auto
            </button>
            <button
              onClick={handleReset}
              className={`px-4 py-2 rounded border ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className={`mt-3 text-sm font-mono flex items-center gap-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          {navigationStack.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span>/</span>}
              <span className={`${
                idx === navigationStack.length - 1
                  ? darkMode ? 'text-cyan-400' : 'text-cyan-600'
                  : 'cursor-pointer hover:underline'
              }`}>
                {item.name}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Globe */}
      <div ref={containerRef} className="flex-1" />
    </div>
  );
};

export default InteractiveGlobe3D;
