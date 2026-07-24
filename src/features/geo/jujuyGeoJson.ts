export type GeoJsonFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry:
      | { type: 'Polygon'; coordinates: number[][][] }
      | { type: 'MultiPolygon'; coordinates: number[][][][] };
  }>;
};

export const DEPARTAMENTOS_JUJUY = require('../../../assets/geo/DEPARTAMENTOS-JUJUY.json') as GeoJsonFeatureCollection;
export const JUJUY_BOUNDARY = require('../../../assets/geo/JUJUY.json') as GeoJsonFeatureCollection;

