/**
 * Business Region Layer
 * Interactive overlay for business regions (AMER, LATAM, EMEA, APAC)
 * Renders as a visual layer over the geographic globe without distorting real boundaries
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  BUSINESS_REGIONS,
  CONTINENTS,
  getCountriesByBusinessRegion,
  latLonTo3D,
} from '../../../services/geographicDataService';

/**
 * Business Region Layer Manager
 * Adds clickable region overlays and highlighting to the globe
 */
class BusinessRegionLayerManager {
  constructor(scene, globeRadius = 2, onRegionSelected = null) {
    this.scene = scene;
    this.globeRadius = globeRadius;
    this.onRegionSelected = onRegionSelected;
    this.regionMeshes = {};
    this.regionLabels = {};
    this.selectedRegion = null;
    this.regionGroup = new THREE.Group();
    this.scene.add(this.regionGroup);
  }

  /**
   * Create visual representation for each business region
   */
  createRegionVisuals() {
    Object.entries(BUSINESS_REGIONS).forEach(([regionId, regionData]) => {
      this.createRegionHighlight(regionId, regionData);
    });
  }

  /**
   * Create highlight overlay for a region
   * Shows as semi-transparent zones over the globe
   */
  createRegionHighlight(regionId, regionData) {
    const countries = getCountriesByBusinessRegion(regionId);
    
    if (countries.length === 0) return;

    // Create group for this region
    const regionContainer = new THREE.Group();
    regionContainer.name = `region_${regionId}`;

    // Calculate region center
    let centerLat = 0, centerLon = 0;
    countries.forEach(country => {
      centerLat += country.center.lat;
      centerLon += country.center.lon;
    });
    centerLat /= countries.length;
    centerLon /= countries.length;

    // Create region label positioned at center
    this.createRegionLabel(regionId, regionData, centerLat, centerLon, regionContainer);

    // Add dots representing countries in this region
    this.addCountryMarkers(countries, regionData.color, regionContainer);

    this.regionGroup.add(regionContainer);
    this.regionMeshes[regionId] = regionContainer;
  }

  /**
   * Create clickable label for region
   */
  createRegionLabel(regionId, regionData, lat, lon, container) {
    // Convert to 3D position
    const coords = latLonTo3D(lat, lon, this.globeRadius * 1.15);
    
    // Create a simple visual marker that will be rendered as a mesh
    const geometry = new THREE.SphereGeometry(0.15, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(regionData.color),
      transparent: true,
      opacity: 0.6,
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(coords.x, coords.y, coords.z);
    marker.userData = {
      type: 'region_marker',
      regionId: regionId,
      label: regionData.label,
    };
    
    container.add(marker);
    this.regionLabels[regionId] = marker;
  }

  /**
   * Add markers for countries within a region
   */
  addCountryMarkers(countries, color, container) {
    countries.forEach(country => {
      const coords = latLonTo3D(
        country.center.lat,
        country.center.lon,
        this.globeRadius * 1.02
      );

      // Create tiny marker
      const geometry = new THREE.SphereGeometry(0.05, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.4,
      });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.set(coords.x, coords.y, coords.z);
      marker.userData = {
        type: 'country_marker',
        countryCode: country.code,
        countryName: country.name,
      };

      container.add(marker);
    });
  }

  /**
   * Highlight a specific region
   */
  highlightRegion(regionId) {
    // Fade out other regions
    Object.entries(this.regionMeshes).forEach(([rId, mesh]) => {
      if (rId === regionId) {
        // Highlight selected region
        mesh.traverse(child => {
          if (child.material) {
            child.material.opacity = 1;
            child.material.emissive = new THREE.Color(0xffffff);
            child.material.emissiveIntensity = 0.5;
          }
        });
      } else {
        // Dim unselected regions
        mesh.traverse(child => {
          if (child.material) {
            child.material.opacity = 0.1;
            child.material.emissive = new THREE.Color(0x000000);
            child.material.emissiveIntensity = 0;
          }
        });
      }
    });

    this.selectedRegion = regionId;
  }

  /**
   * Reset highlighting to show all regions
   */
  resetHighlighting() {
    Object.values(this.regionMeshes).forEach(mesh => {
      mesh.traverse(child => {
        if (child.material) {
          child.material.opacity = 0.6;
          child.material.emissive = new THREE.Color(0x000000);
          child.material.emissiveIntensity = 0;
        }
      });
    });

    this.selectedRegion = null;
  }

  /**
   * Get intersected region from raycaster
   */
  getIntersectedRegion(intersects) {
    for (let intersection of intersects) {
      if (intersection.object.userData.type === 'region_marker') {
        return intersection.object.userData.regionId;
      }
    }
    return null;
  }

  /**
   * Show/hide all region visuals
   */
  setVisibility(visible) {
    this.regionGroup.visible = visible;
  }
}

/**
 * Business Region Layer Component
 */
const BusinessRegionLayer = ({
  scene,
  camera,
  renderer,
  onRegionSelected = null,
  darkMode = true,
}) => {
  const managerRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Initialize business region layer
  useEffect(() => {
    if (!scene) return;

    // Create manager
    const manager = new BusinessRegionLayerManager(scene, 2, (regionId) => {
      setSelectedRegion(regionId);
      if (onRegionSelected) {
        onRegionSelected(regionId);
      }
    });

    // Create visual representations
    manager.createRegionVisuals();
    managerRef.current = manager;

    return () => {
      // Cleanup
      if (manager.regionGroup.parent) {
        manager.regionGroup.parent.remove(manager.regionGroup);
      }
    };
  }, [scene, onRegionSelected]);

  // Handle region selection
  useEffect(() => {
    if (!managerRef.current) return;

    if (selectedRegion) {
      managerRef.current.highlightRegion(selectedRegion);
    } else {
      managerRef.current.resetHighlighting();
    }
  }, [selectedRegion]);

  // Setup click handler
  useEffect(() => {
    if (!renderer || !camera) return;

    const handleClick = (event) => {
      if (!managerRef.current) return;

      // Calculate mouse position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      raycasterRef.current.setFromCamera({ x, y }, camera);

      // Get all region meshes
      const regionMeshes = Object.values(managerRef.current.regionMeshes);
      const allObjects = [];
      regionMeshes.forEach(mesh => {
        mesh.traverse(child => {
          if (child.userData && child.userData.type === 'region_marker') {
            allObjects.push(child);
          }
        });
      });

      // Check for intersections
      const intersects = raycasterRef.current.intersectObjects(allObjects);

      if (intersects.length > 0) {
        const regionId = managerRef.current.getIntersectedRegion(intersects);
        if (regionId) {
          setSelectedRegion(regionId === selectedRegion ? null : regionId);
        }
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    return () => {
      renderer.domElement.removeEventListener('click', handleClick);
    };
  }, [renderer, camera, selectedRegion]);

  return null; // This component manages 3D objects via refs
};

/**
 * Business Region Selector UI
 * Shows clickable buttons for each business region
 */
const BusinessRegionSelector = ({
  onRegionSelected = null,
  selectedRegion = null,
  darkMode = true,
}) => {
  const regions = Object.values(BUSINESS_REGIONS);

  const handleRegionClick = (regionId) => {
    if (onRegionSelected) {
      onRegionSelected(regionId === selectedRegion ? null : regionId);
    }
  };

  return (
    <div className={`p-4 border-b ${
      darkMode 
        ? 'bg-slate-900/50 border-slate-800' 
        : 'bg-slate-50 border-slate-200'
    }`}>
      <div className={`text-xs font-mono font-semibold tracking-wider mb-3 ${
        darkMode ? 'text-slate-500' : 'text-slate-400'
      }`}>
        BUSINESS REGIONS
      </div>

      <div className="flex flex-wrap gap-2">
        {regions.map(region => (
          <button
            key={region.id}
            onClick={() => handleRegionClick(region.id)}
            className={`px-4 py-2 rounded-lg font-mono text-sm font-semibold transition-all ${
              selectedRegion === region.id
                ? darkMode
                  ? 'bg-cyan-600/60 text-cyan-100 border-2 border-cyan-500 shadow-lg shadow-cyan-500/50'
                  : 'bg-cyan-200/80 text-cyan-900 border-2 border-cyan-500 shadow-lg shadow-cyan-500/30'
                : darkMode
                  ? 'bg-slate-800/50 text-slate-300 border border-slate-700 hover:border-slate-600'
                  : 'bg-white/50 text-slate-600 border border-slate-300 hover:border-slate-400'
            }`}
            title={region.description}
          >
            {region.label}
          </button>
        ))}

        {selectedRegion && (
          <button
            onClick={() => handleRegionClick(null)}
            className={`px-4 py-2 rounded-lg font-mono text-sm font-semibold transition-all ${
              darkMode
                ? 'bg-red-900/30 text-red-300 border border-red-700 hover:bg-red-900/50'
                : 'bg-red-100/50 text-red-700 border border-red-300 hover:bg-red-100/70'
            }`}
          >
            Clear
          </button>
        )}
      </div>

      {selectedRegion && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${
          darkMode
            ? 'bg-slate-800/50 text-slate-300'
            : 'bg-slate-100/50 text-slate-700'
        }`}>
          <div className="font-semibold mb-1">
            {BUSINESS_REGIONS[selectedRegion]?.name}
          </div>
          <div className="text-xs opacity-75">
            {BUSINESS_REGIONS[selectedRegion]?.description}
          </div>
          <div className="text-xs mt-2 opacity-60">
            Countries: {getCountriesByBusinessRegion(selectedRegion).length}
          </div>
        </div>
      )}
    </div>
  );
};

export { BusinessRegionLayer, BusinessRegionLayerManager, BusinessRegionSelector };
export default BusinessRegionLayer;
