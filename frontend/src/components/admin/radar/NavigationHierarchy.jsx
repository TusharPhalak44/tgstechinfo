/**
 * Navigation Hierarchy Manager
 * Handles World → Region → Continent → Country → City navigation
 * Manages zoom levels, camera positioning, and data transitions
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  CONTINENTS,
  BUSINESS_REGIONS,
  COUNTRIES,
  CITIES,
  getCountriesByBusinessRegion,
  getCountriesByContinent,
  getCitiesByCountry,
  latLonTo3D,
} from '../../../services/geographicDataService';

/**
 * Navigation state levels
 */
const NAVIGATION_LEVELS = {
  WORLD: 0,
  BUSINESS_REGION: 1,
  CONTINENT: 2,
  COUNTRY: 3,
  CITY: 4,
};

/**
 * Navigation Hierarchy Manager Class
 */
class NavigationHierarchyManager {
  constructor(camera, globe, onNavigationChange = null) {
    this.camera = camera;
    this.globe = globe;
    this.onNavigationChange = onNavigationChange;

    // Current navigation state
    this.currentLevel = NAVIGATION_LEVELS.WORLD;
    this.navigationStack = [
      {
        level: 'WORLD',
        id: 'WORLD',
        name: 'World',
        data: null,
        cameraPosition: { z: 3 },
        globeRotation: { x: 0.6, y: 0 },
      },
    ];

    // Target states for smooth transitions
    this.targetCameraPosition = { z: 3 };
    this.targetGlobeRotation = { x: 0.6, y: 0 };
  }

  /**
   * Navigate to a business region
   */
  navigateToBusinessRegion(regionId) {
    const region = BUSINESS_REGIONS[regionId];
    if (!region) return false;

    const regionData = {
      level: 'BUSINESS_REGION',
      id: regionId,
      name: region.name,
      label: region.label,
      description: region.description,
      data: region,
    };

    // Calculate center of region (average of continents)
    let centerLat = 0, centerLon = 0;
    region.continents.forEach(contId => {
      const continent = CONTINENTS[contId];
      if (continent && continent.center) {
        centerLat += continent.center.lat;
        centerLon += continent.center.lon;
      }
    });
    centerLat /= region.continents.length;
    centerLon /= region.continents.length;

    regionData.center = { lat: centerLat, lon: centerLon };

    // Calculate new camera position and globe rotation
    this.calculateNavigationTransition(regionData, NAVIGATION_LEVELS.BUSINESS_REGION);

    this.navigationStack.push(regionData);
    this.currentLevel = NAVIGATION_LEVELS.BUSINESS_REGION;

    if (this.onNavigationChange) {
      this.onNavigationChange({
        stack: this.navigationStack,
        current: regionData,
        level: this.currentLevel,
      });
    }

    return true;
  }

  /**
   * Navigate to a continent
   */
  navigateToContinent(continentId) {
    const continent = CONTINENTS[continentId];
    if (!continent) return false;

    const continentData = {
      level: 'CONTINENT',
      id: continentId,
      name: continent.name,
      label: continent.label,
      data: continent,
      center: continent.center,
    };

    this.calculateNavigationTransition(continentData, NAVIGATION_LEVELS.CONTINENT);

    this.navigationStack.push(continentData);
    this.currentLevel = NAVIGATION_LEVELS.CONTINENT;

    if (this.onNavigationChange) {
      this.onNavigationChange({
        stack: this.navigationStack,
        current: continentData,
        level: this.currentLevel,
        countries: getCountriesByContinent(continentId),
      });
    }

    return true;
  }

  /**
   * Navigate to a country
   */
  navigateToCountry(countryCode) {
    const country = COUNTRIES[countryCode];
    if (!country) return false;

    const countryData = {
      level: 'COUNTRY',
      id: countryCode,
      name: country.name,
      code: countryCode,
      data: country,
      center: country.center,
    };

    this.calculateNavigationTransition(countryData, NAVIGATION_LEVELS.COUNTRY);

    this.navigationStack.push(countryData);
    this.currentLevel = NAVIGATION_LEVELS.COUNTRY;

    if (this.onNavigationChange) {
      this.onNavigationChange({
        stack: this.navigationStack,
        current: countryData,
        level: this.currentLevel,
        cities: getCitiesByCountry(countryCode),
      });
    }

    return true;
  }

  /**
   * Navigate to a city
   */
  navigateToCity(cityName) {
    const city = CITIES[cityName];
    if (!city) return false;

    const cityData = {
      level: 'CITY',
      id: cityName,
      name: cityName,
      data: city,
      center: { lat: city.lat, lon: city.lon },
      country: city.country,
      region: city.region,
    };

    this.calculateNavigationTransition(cityData, NAVIGATION_LEVELS.CITY);

    this.navigationStack.push(cityData);
    this.currentLevel = NAVIGATION_LEVELS.CITY;

    if (this.onNavigationChange) {
      this.onNavigationChange({
        stack: this.navigationStack,
        current: cityData,
        level: this.currentLevel,
      });
    }

    return true;
  }

  /**
   * Navigate back to previous level
   */
  navigateBack() {
    if (this.navigationStack.length <= 1) return false;

    this.navigationStack.pop();
    const previousData = this.navigationStack[this.navigationStack.length - 1];

    this.currentLevel = NAVIGATION_LEVELS[previousData.level] || NAVIGATION_LEVELS.WORLD;
    this.targetCameraPosition = previousData.cameraPosition || { z: 3 };
    this.targetGlobeRotation = previousData.globeRotation || { x: 0.6, y: 0 };

    if (this.onNavigationChange) {
      this.onNavigationChange({
        stack: this.navigationStack,
        current: previousData,
        level: this.currentLevel,
      });
    }

    return true;
  }

  /**
   * Navigate to specific breadcrumb level
   */
  navigateToBreadcrumb(index) {
    if (index < 0 || index >= this.navigationStack.length) return false;

    // Remove everything after the target index
    this.navigationStack = this.navigationStack.slice(0, index + 1);

    const targetData = this.navigationStack[index];
    this.currentLevel = NAVIGATION_LEVELS[targetData.level] || NAVIGATION_LEVELS.WORLD;
    this.targetCameraPosition = targetData.cameraPosition || { z: 3 };
    this.targetGlobeRotation = targetData.globeRotation || { x: 0.6, y: 0 };

    if (this.onNavigationChange) {
      this.onNavigationChange({
        stack: this.navigationStack,
        current: targetData,
        level: this.currentLevel,
      });
    }

    return true;
  }

  /**
   * Calculate smooth transition parameters
   */
  calculateNavigationTransition(locationData, level) {
    if (!locationData.center) return;

    const { lat, lon } = locationData.center;

    // Calculate zoom level based on navigation level
    const zoomLevels = {
      [NAVIGATION_LEVELS.WORLD]: 3,
      [NAVIGATION_LEVELS.BUSINESS_REGION]: 1.5,
      [NAVIGATION_LEVELS.CONTINENT]: 0.8,
      [NAVIGATION_LEVELS.COUNTRY]: 0.4,
      [NAVIGATION_LEVELS.CITY]: 0.2,
    };

    // Calculate globe rotation to face the location
    const theta = (lon * Math.PI) / 180;
    const phi = (lat * Math.PI) / 180;

    // Store original position and rotation for this breadcrumb
    locationData.cameraPosition = { z: zoomLevels[level] };
    locationData.globeRotation = { x: -phi, y: -theta };

    // Set targets for animation
    this.targetCameraPosition = locationData.cameraPosition;
    this.targetGlobeRotation = locationData.globeRotation;
  }

  /**
   * Get countries for current level
   */
  getCountriesForCurrentLevel() {
    if (this.currentLevel === NAVIGATION_LEVELS.BUSINESS_REGION) {
      const current = this.navigationStack[this.navigationStack.length - 1];
      return getCountriesByBusinessRegion(current.id);
    } else if (this.currentLevel === NAVIGATION_LEVELS.CONTINENT) {
      const current = this.navigationStack[this.navigationStack.length - 1];
      return getCountriesByContinent(current.id);
    }
    return [];
  }

  /**
   * Get cities for current level
   */
  getCitiesForCurrentLevel() {
    if (this.currentLevel === NAVIGATION_LEVELS.COUNTRY) {
      const current = this.navigationStack[this.navigationStack.length - 1];
      return getCitiesByCountry(current.id);
    }
    return [];
  }

  /**
   * Reset to world view
   */
  resetToWorld() {
    this.navigationStack = [this.navigationStack[0]];
    this.currentLevel = NAVIGATION_LEVELS.WORLD;
    this.targetCameraPosition = { z: 3 };
    this.targetGlobeRotation = { x: 0.6, y: 0 };

    if (this.onNavigationChange) {
      this.onNavigationChange({
        stack: this.navigationStack,
        current: this.navigationStack[0],
        level: this.currentLevel,
      });
    }
  }

  /**
   * Update camera and globe smoothly
   */
  updateAnimation(cameraRef, globeRef) {
    if (!cameraRef || !globeRef) return;

    // Smooth camera zoom
    if (cameraRef.position.z !== this.targetCameraPosition.z) {
      const diff = this.targetCameraPosition.z - cameraRef.position.z;
      cameraRef.position.z += diff * 0.1; // Smooth interpolation
    }

    // Smooth globe rotation
    if (globeRef.rotation.x !== this.targetGlobeRotation.x) {
      const diffX = this.targetGlobeRotation.x - globeRef.rotation.x;
      globeRef.rotation.x += diffX * 0.1;
    }

    if (globeRef.rotation.y !== this.targetGlobeRotation.y) {
      const diffY = this.targetGlobeRotation.y - globeRef.rotation.y;
      globeRef.rotation.y += diffY * 0.1;
    }
  }

  /**
   * Get current breadcrumb trail
   */
  getBreadcrumbs() {
    return this.navigationStack.map(item => ({
      level: item.level,
      name: item.name,
      id: item.id,
    }));
  }

  /**
   * Check if can navigate back
   */
  canNavigateBack() {
    return this.navigationStack.length > 1;
  }

  /**
   * Get available options for current level
   */
  getAvailableOptions() {
    switch (this.currentLevel) {
      case NAVIGATION_LEVELS.WORLD:
        return {
          type: 'business_regions',
          items: Object.values(BUSINESS_REGIONS),
        };
      case NAVIGATION_LEVELS.BUSINESS_REGION:
        return {
          type: 'continents',
          items: this.navigationStack[this.navigationStack.length - 1].data.continents
            .map(id => CONTINENTS[id])
            .filter(Boolean),
        };
      case NAVIGATION_LEVELS.CONTINENT:
        return {
          type: 'countries',
          items: getCountriesByContinent(this.navigationStack[this.navigationStack.length - 1].id),
        };
      case NAVIGATION_LEVELS.COUNTRY:
        return {
          type: 'cities',
          items: getCitiesByCountry(this.navigationStack[this.navigationStack.length - 1].id),
        };
      default:
        return { type: 'none', items: [] };
    }
  }
}

/**
 * Navigation Controls Component
 */
const NavigationControls = ({
  navigationManager,
  onNavigationChange = null,
  darkMode = true,
}) => {
  const [state, setState] = useState({
    breadcrumbs: navigationManager.getBreadcrumbs(),
    level: navigationManager.currentLevel,
    options: navigationManager.getAvailableOptions(),
  });

  const handleNavigateToOption = useCallback((optionId, optionType) => {
    let success = false;

    switch (optionType) {
      case 'business_region':
        success = navigationManager.navigateToBusinessRegion(optionId);
        break;
      case 'continent':
        success = navigationManager.navigateToContinent(optionId);
        break;
      case 'country':
        success = navigationManager.navigateToCountry(optionId);
        break;
      case 'city':
        success = navigationManager.navigateToCity(optionId);
        break;
      default:
        break;
    }

    if (success) {
      setState({
        breadcrumbs: navigationManager.getBreadcrumbs(),
        level: navigationManager.currentLevel,
        options: navigationManager.getAvailableOptions(),
      });

      if (onNavigationChange) {
        onNavigationChange(navigationManager.navigationStack);
      }
    }
  }, [navigationManager, onNavigationChange]);

  const handleNavigateBack = useCallback(() => {
    if (navigationManager.navigateBack()) {
      setState({
        breadcrumbs: navigationManager.getBreadcrumbs(),
        level: navigationManager.currentLevel,
        options: navigationManager.getAvailableOptions(),
      });

      if (onNavigationChange) {
        onNavigationChange(navigationManager.navigationStack);
      }
    }
  }, [navigationManager, onNavigationChange]);

  const handleNavigateToBreadcrumb = useCallback((index) => {
    if (navigationManager.navigateToBreadcrumb(index)) {
      setState({
        breadcrumbs: navigationManager.getBreadcrumbs(),
        level: navigationManager.currentLevel,
        options: navigationManager.getAvailableOptions(),
      });

      if (onNavigationChange) {
        onNavigationChange(navigationManager.navigationStack);
      }
    }
  }, [navigationManager, onNavigationChange]);

  const getOptionsLabel = () => {
    const map = {
      business_regions: 'Business Regions',
      continents: 'Continents',
      countries: 'Countries',
      cities: 'Cities',
      none: 'No Options',
    };
    return map[state.options.type] || 'Options';
  };

  return (
    <div className={`p-4 space-y-3 border-b ${
      darkMode
        ? 'bg-slate-900/50 border-slate-800'
        : 'bg-slate-50 border-slate-200'
    }`}>
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center gap-2">
        {state.breadcrumbs.map((item, idx) => (
          <React.Fragment key={idx}>
            <button
              onClick={() => handleNavigateToBreadcrumb(idx)}
              className={`px-3 py-1 rounded text-sm font-mono transition-all ${
                idx === state.breadcrumbs.length - 1
                  ? darkMode
                    ? 'bg-cyan-600/50 text-cyan-300 border border-cyan-500/30'
                    : 'bg-cyan-100/50 text-cyan-700 border border-cyan-300'
                  : darkMode
                    ? 'text-slate-400 hover:text-cyan-400'
                    : 'text-slate-600 hover:text-cyan-600'
              }`}
            >
              {item.name}
            </button>

            {idx < state.breadcrumbs.length - 1 && (
              <span className={darkMode ? 'text-slate-600' : 'text-slate-400'}>/</span>
            )}
          </React.Fragment>
        ))}

        {state.breadcrumbs.length > 1 && (
          <button
            onClick={handleNavigateBack}
            className={`ml-auto px-3 py-1 rounded text-sm font-mono ${
              darkMode
                ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                : 'bg-white/50 text-slate-600 hover:bg-white'
            }`}
          >
            ← Back
          </button>
        )}
      </div>

      {/* Available Options */}
      {state.options.items.length > 0 && (
        <div>
          <div className={`text-xs font-mono font-semibold mb-2 tracking-wider ${
            darkMode ? 'text-slate-500' : 'text-slate-400'
          }`}>
            {getOptionsLabel()}
          </div>

          <div className="flex flex-wrap gap-2">
            {state.options.items.slice(0, 12).map(item => {
              const displayName = item.name || item.label || item;
              const itemId = item.id || item.code || item;
              const itemType = state.options.type.slice(0, -1); // Remove plural 's'

              return (
                <button
                  key={itemId}
                  onClick={() => handleNavigateToOption(itemId, itemType)}
                  className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                    darkMode
                      ? 'bg-slate-800/50 text-slate-300 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800'
                      : 'bg-white/50 text-slate-600 border border-slate-300 hover:border-cyan-500/50 hover:bg-white'
                  }`}
                >
                  {displayName}
                </button>
              );
            })}

            {state.options.items.length > 12 && (
              <div className={`px-3 py-1 text-xs font-mono ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
              }`}>
                +{state.options.items.length - 12} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { NavigationHierarchyManager, NavigationControls, NAVIGATION_LEVELS };
export default NavigationHierarchyManager;
