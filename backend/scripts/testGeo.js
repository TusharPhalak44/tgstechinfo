const worldTopology = require('../frontend/src/components/ui/world-110m.json');

function latLonToVector3(lat, lon, radius = 100) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return { x, y, z };
}

function decodeTopology(topology) {
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

const decoded = decodeTopology(worldTopology);
console.log('Total arcs:', decoded.length);
console.log('Sample decoded arc 0 point 0:', decoded[0][0]);

let lineVertices = [];
const objects = worldTopology.objects?.countries?.geometries || [];
console.log('Total country geometries:', objects.length);

objects.forEach(geom => {
  const polygons = geom.type === 'MultiPolygon' ? geom.arcs : [geom.arcs];
  polygons.forEach(polygon => {
    polygon.forEach(ring => {
      ring.forEach(arcIndex => {
        const isReversed = arcIndex < 0;
        const actualIndex = isReversed ? ~arcIndex : arcIndex;
        const arc = decoded[actualIndex];
        if (!arc) return;
        const points = isReversed ? [...arc].reverse() : arc;
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];
          const v1 = latLonToVector3(p1[1], p1[0], 100);
          const v2 = latLonToVector3(p2[1], p2[0], 100);
          lineVertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
        }
      });
    });
  });
});

console.log('Total line vertex numbers:', lineVertices.length);
console.log('Total line segments:', lineVertices.length / 6);
