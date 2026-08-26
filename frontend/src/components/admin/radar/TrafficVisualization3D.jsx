/**
 * Live Traffic Visualization Layer
 * Renders animated traffic markers, connection arcs, and particle effects
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { latLonTo3D, calculateDistance } from '../../../services/geographicDataService';

/**
 * Traffic Visualization Manager
 * Handles animated markers, connection arcs, and particles
 */
class TrafficVisualizationManager {
  constructor(scene, globeRadius = 2) {
    this.scene = scene;
    this.globeRadius = globeRadius;
    this.trafficGroup = new THREE.Group();
    this.markersGroup = new THREE.Group();
    this.arcsGroup = new THREE.Group();
    this.particlesGroup = new THREE.Group();
    
    this.trafficGroup.add(this.markersGroup);
    this.trafficGroup.add(this.arcsGroup);
    this.trafficGroup.add(this.particlesGroup);
    
    this.scene.add(this.trafficGroup);

    this.markers = [];
    this.arcs = [];
    this.particles = [];
    this.animationTime = 0;
  }

  /**
   * Add visitor marker at location
   */
  addVisitorMarker(lat, lon, intensity = 1, color = 0x0AAEEF) {
    const coords = latLonTo3D(lat, lon, this.globeRadius * 1.05);

    // Main marker sphere
    const geometry = new THREE.SphereGeometry(0.08 * intensity, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.8,
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(coords.x, coords.y, coords.z);

    // Pulsing halo
    const haloGeometry = new THREE.SphereGeometry(0.15 * intensity, 32, 32);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.3,
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.position.copy(marker.position);

    this.markersGroup.add(marker);
    this.markersGroup.add(halo);

    this.markers.push({
      marker,
      halo,
      intensity,
      color,
      time: 0,
    });

    return { marker, halo };
  }

  /**
   * Add connection arc between two locations (traffic route)
   */
  addTrafficArc(fromLat, fromLon, toLat, toLon, intensity = 1, color = 0x0AAEEF) {
    const startCoords = latLonTo3D(fromLat, fromLon, this.globeRadius * 1.02);
    const endCoords = latLonTo3D(toLat, toLon, this.globeRadius * 1.02);

    // Create curved path using quadratic bezier
    const start = new THREE.Vector3(startCoords.x, startCoords.y, startCoords.z);
    const end = new THREE.Vector3(endCoords.x, endCoords.y, endCoords.z);
    
    // Control point: towards center at mid-height
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const center = new THREE.Vector3(0, 0, 0);
    const controlPoint = midpoint.clone().sub(center).normalize().multiplyScalar(this.globeRadius * 1.3);

    // Create curve
    const curve = new THREE.QuadraticBezierCurve3(start, controlPoint, end);
    const points = curve.getPoints(50);

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.4 * intensity,
      linewidth: 2,
    });

    const arc = new THREE.Line(geometry, material);
    this.arcsGroup.add(arc);

    this.arcs.push({
      arc,
      geometry,
      material,
      intensity,
      color,
      progress: 0,
      distance: calculateDistance(fromLat, fromLon, toLat, toLon),
    });

    return arc;
  }

  /**
   * Add particle trail for traffic animation
   */
  addParticleTrail(fromLat, fromLon, toLat, toLon, color = 0x0AAEEF) {
    const startCoords = latLonTo3D(fromLat, fromLon, this.globeRadius * 1.02);
    const endCoords = latLonTo3D(toLat, toLon, this.globeRadius * 1.02);

    const start = new THREE.Vector3(startCoords.x, startCoords.y, startCoords.z);
    const end = new THREE.Vector3(endCoords.x, endCoords.y, endCoords.z);

    // Create 5 particles
    for (let i = 0; i < 5; i++) {
      const particle = {
        position: start.clone(),
        velocity: end.clone().sub(start).normalize().multiplyScalar(0.02),
        progress: i * 0.2,
        color,
        life: 1,
      };

      const geometry = new THREE.SphereGeometry(0.04, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.8,
      });
      const mesh = new THREE.Mesh(geometry, material);
      this.particlesGroup.add(mesh);

      this.particles.push({
        mesh,
        ...particle,
      });
    }
  }

  /**
   * Animate traffic visualization
   */
  animate() {
    this.animationTime += 0.016; // ~60 FPS

    // Animate markers
    this.markers.forEach(markerData => {
      markerData.time += 0.01;
      const pulse = Math.sin(markerData.time * 2) * 0.5 + 1;
      markerData.halo.scale.multiplyScalar(pulse / markerData.halo.scale.x);
      markerData.halo.material.opacity = 0.3 * pulse;
    });

    // Animate arcs (gradient flow effect)
    this.arcs.forEach(arcData => {
      arcData.progress += 0.003;
      if (arcData.progress > 1) {
        arcData.progress = 0;
      }
      // Could animate opacity or position along arc
    });

    // Animate particles
    this.particles = this.particles.filter(particle => {
      particle.progress += 0.02;
      particle.life -= 0.02;

      if (particle.life <= 0) {
        this.particlesGroup.remove(particle.mesh);
        return false;
      }

      particle.mesh.material.opacity = 0.8 * particle.life;
      return true;
    });
  }

  /**
   * Clear all traffic visualization
   */
  clear() {
    this.markersGroup.clear();
    this.arcsGroup.clear();
    this.particlesGroup.clear();
    this.markers = [];
    this.arcs = [];
    this.particles = [];
  }

  /**
   * Update traffic data
   */
  updateTrafficData(trafficDataArray) {
    this.clear();

    if (!trafficDataArray || trafficDataArray.length === 0) return;

    trafficDataArray.forEach(traffic => {
      // Add origin marker
      this.addVisitorMarker(
        traffic.fromLat,
        traffic.fromLon,
        traffic.intensity || 1,
        traffic.color || 0x0AAEEF
      );

      // Add destination marker
      this.addVisitorMarker(
        traffic.toLat,
        traffic.toLon,
        traffic.intensity || 1,
        traffic.color || 0x0AAEEF
      );

      // Add connection arc
      this.addTrafficArc(
        traffic.fromLat,
        traffic.fromLon,
        traffic.toLat,
        traffic.toLon,
        traffic.intensity || 1,
        traffic.color || 0x0AAEEF
      );

      // Add particle trail
      this.addParticleTrail(
        traffic.fromLat,
        traffic.fromLon,
        traffic.toLat,
        traffic.toLon,
        traffic.color || 0x0AAEEF
      );
    });
  }

  /**
   * Show/hide traffic layer
   */
  setVisibility(visible) {
    this.trafficGroup.visible = visible;
  }
}

/**
 * Traffic Visualization Component
 */
const TrafficVisualization3D = ({
  scene,
  trafficData = [],
  autoUpdate = true,
  darkMode = true,
}) => {
  const managerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize manager
  useEffect(() => {
    if (!scene) return;

    const manager = new TrafficVisualizationManager(scene, 2);
    managerRef.current = manager;

    // Start animation loop
    const animate = () => {
      manager.animate();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (manager.trafficGroup.parent) {
        manager.trafficGroup.parent.remove(manager.trafficGroup);
      }
    };
  }, [scene]);

  // Update traffic data
  useEffect(() => {
    if (managerRef.current && autoUpdate) {
      managerRef.current.updateTrafficData(trafficData);
    }
  }, [trafficData, autoUpdate]);

  return null; // This component manages 3D objects via refs
};

export { TrafficVisualization3D, TrafficVisualizationManager };
export default TrafficVisualization3D;
