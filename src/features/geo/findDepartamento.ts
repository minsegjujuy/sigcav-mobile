import type { GeoJsonFeatureCollection } from './jujuyGeoJson';

type LngLat = [number, number];

export function findDepartamento(
  lat: number,
  lng: number,
  departamentosGeoJson: GeoJsonFeatureCollection
): string | null {
  const point: LngLat = [lng, lat]; // GeoJSON uses [lng, lat]

  for (const feature of departamentosGeoJson.features) {
    if (feature.geometry.type === 'Polygon') {
      if (pointInPolygonOrMulti(point, [feature.geometry.coordinates])) {
        return getDepartamentoName(feature.properties);
      }
      continue;
    }

    if (feature.geometry.type === 'MultiPolygon') {
      if (pointInPolygonOrMulti(point, feature.geometry.coordinates)) {
        return getDepartamentoName(feature.properties);
      }
    }
  }

  return null;
}

function getDepartamentoName(properties: Record<string, unknown>): string | null {
  const departamento = properties['departamento'];
  return typeof departamento === 'string' ? departamento : null;
}

function pointInPolygonOrMulti(point: LngLat, multiPolygonCoords: number[][][][]): boolean {
  for (const polygonCoords of multiPolygonCoords) {
    if (pointInPolygonWithHoles(point, polygonCoords)) return true;
  }
  return false;
}

function pointInPolygonWithHoles(point: LngLat, polygonCoords: number[][][]): boolean {
  // polygonCoords: [outerRing, ...holes]
  const [outer, ...holes] = polygonCoords;
  if (!outer || outer.length < 3) return false;

  const outerBbox = bboxOfRing(outer);
  if (!bboxContainsPoint(outerBbox, point)) return false;

  if (!pointInRing(point, outer)) return false;

  for (const hole of holes) {
    if (!hole || hole.length < 3) continue;
    const holeBbox = bboxOfRing(hole);
    if (!bboxContainsPoint(holeBbox, point)) continue;
    if (pointInRing(point, hole)) return false;
  }

  return true;
}

type Bbox = { minX: number; minY: number; maxX: number; maxY: number };

function bboxOfRing(ring: number[][]): Bbox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const coord of ring) {
    const x = coord[0];
    const y = coord[1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  return { minX, minY, maxX, maxY };
}

function bboxContainsPoint(bbox: Bbox, point: LngLat): boolean {
  const [x, y] = point;
  return x >= bbox.minX && x <= bbox.maxX && y >= bbox.minY && y <= bbox.maxY;
}

// Ray casting algorithm
function pointInRing(point: LngLat, ring: number[][]): boolean {
  const x = point[0];
  const y = point[1];
  let inside = false;

  // ring entries are [x,y] = [lng,lat]
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]?.[0];
    const yi = ring[i]?.[1];
    const xj = ring[j]?.[0];
    const yj = ring[j]?.[1];
    if (xi === undefined || yi === undefined || xj === undefined || yj === undefined) continue;

    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

