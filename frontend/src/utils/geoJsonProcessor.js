import * as THREE from 'three';
import worldTopology from '../components/ui/world-110m.json';

/**
 * Converts Latitude & Longitude to 3D Cartesian coordinates on a sphere of radius R
 */
export function latLonToVector3(lat, lon, radius = 100) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Decodes TopoJSON arcs into coordinate arrays [lon, lat]
 */
export function decodeTopology(topology) {
  const { transform, arcs } = topology;
  const { scale, translate } = transform || { scale: [1, 1], translate: [0, 0] };

  const decodedArcs = arcs.map(arc => {
    let x = 0;
    let y = 0;
    return arc.map(point => {
      x += point[0];
      y += point[1];
      return [
        x * scale[0] + translate[0],
        y * scale[1] + translate[1]
      ];
    });
  });

  return decodedArcs;
}

/**
 * Generates high-resolution 2D Canvas texture of Earth with country landmasses & borders
 */
export function createWorldTexture(decodedArcs = null) {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Deep Ocean Background
  ctx.fillStyle = '#061124';
  ctx.fillRect(0, 0, width, height);

  // 2. Latitude / Longitude Grid
  ctx.strokeStyle = 'rgba(10, 174, 239, 0.08)';
  ctx.lineWidth = 1;
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // 3. Draw All Country & Continent Polygons from TopoJSON
  const arcs = decodedArcs || decodeTopology(worldTopology);
  const objects = worldTopology.objects?.countries?.geometries || [];

  // Fill Country Landmasses
  ctx.fillStyle = '#0E2442';
  objects.forEach(geom => {
    const polygons = geom.type === 'MultiPolygon' ? geom.arcs : [geom.arcs];
    polygons.forEach(polygon => {
      ctx.beginPath();
      polygon.forEach(ring => {
        let first = true;
        ring.forEach(arcIndex => {
          const isReversed = arcIndex < 0;
          const actualIndex = isReversed ? ~arcIndex : arcIndex;
          const arc = arcs[actualIndex];
          if (!arc) return;

          const points = isReversed ? [...arc].reverse() : arc;
          points.forEach(([lon, lat]) => {
            const x = ((lon + 180) / 360) * width;
            const y = ((90 - lat) / 180) * height;
            if (first) {
              ctx.moveTo(x, y);
              first = false;
            } else {
              ctx.lineTo(x, y);
            }
          });
        });
      });
      ctx.closePath();
      ctx.fill();
    });
  });

  // Stroke Country Outlines in Glowing Cyan
  ctx.strokeStyle = '#0AAEEF';
  ctx.lineWidth = 1.4;
  ctx.shadowColor = '#0AAEEF';
  ctx.shadowBlur = 4;

  arcs.forEach(arc => {
    ctx.beginPath();
    arc.forEach(([lon, lat], i) => {
      const x = ((lon + 180) / 360) * width;
      const y = ((90 - lat) / 180) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
  ctx.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Extracts 3D vector line geometry of all country boundaries from TopoJSON
 */
export function extractWorldBoundaries(radius = 100) {
  try {
    const decodedArcs = decodeTopology(worldTopology);
    const lineVertices = [];

    decodedArcs.forEach(arc => {
      for (let i = 0; i < arc.length - 1; i++) {
        const p1 = arc[i];     // [lon, lat]
        const p2 = arc[i + 1]; // [lon, lat]

        // Interpolate along the spherical edge
        const steps = 3;
        for (let s = 0; s < steps; s++) {
          const t1 = s / steps;
          const t2 = (s + 1) / steps;
          const lon1 = p1[0] + (p2[0] - p1[0]) * t1;
          const lat1 = p1[1] + (p2[1] - p1[1]) * t1;
          const lon2 = p1[0] + (p2[0] - p1[0]) * t2;
          const lat2 = p1[1] + (p2[1] - p1[1]) * t2;

          const v1 = latLonToVector3(lat1, lon1, radius * 1.008);
          const v2 = latLonToVector3(lat2, lon2, radius * 1.008);

          lineVertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
        }
      }
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(lineVertices, 3)
    );

    return {
      bordersGeometry: geometry,
      decodedArcs
    };
  } catch (err) {
    console.error('Error processing GeoJSON topology:', err);
    return {
      bordersGeometry: new THREE.BufferGeometry(),
      decodedArcs: []
    };
  }
}
