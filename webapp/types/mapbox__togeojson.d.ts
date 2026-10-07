// @mapbox/togeojson ships no types and no @types package exists on npm.
// The DOM Document parameter is typed as unknown because togeojson accepts any
// document-like object, including the one @xmldom/xmldom builds on the server.
declare module '@mapbox/togeojson' {
  export interface GeoJsonPolygon {
    type: 'Polygon';
    coordinates: number[][][];
  }

  export interface GeoJsonMultiPolygon {
    type: 'MultiPolygon';
    coordinates: number[][][][];
  }

  export interface GeoJsonLineString {
    type: 'LineString';
    coordinates: number[][];
  }

  export interface GeoJsonPoint {
    type: 'Point';
    coordinates: number[];
  }

  export interface GeoJsonGeometryCollection {
    type: 'GeometryCollection';
    geometries: GeoJsonGeometry[];
  }

  export type GeoJsonGeometry =
    | GeoJsonPolygon
    | GeoJsonMultiPolygon
    | GeoJsonLineString
    | GeoJsonPoint
    | GeoJsonGeometryCollection;

  export interface GeoJsonFeature {
    type: 'Feature';
    id?: string;
    properties: Record<string, unknown>;
    geometry: GeoJsonGeometry | null;
  }

  export interface GeoJsonFeatureCollection {
    type: 'FeatureCollection';
    features: GeoJsonFeature[];
  }

  const toGeoJSON: {
    kml(document: unknown): GeoJsonFeatureCollection;
    gpx(document: unknown): GeoJsonFeatureCollection;
  };

  export default toGeoJSON;
}
