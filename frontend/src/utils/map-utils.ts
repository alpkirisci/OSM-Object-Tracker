import { OSMObject, GeoJSONFeature } from '@/types';

/**
 * Parses a GeoJSON string into a GeoJSON feature
 */
export function parseGeoJSON(geom: string): GeoJSONFeature | null {
  try {
    return JSON.parse(geom) as GeoJSONFeature;
  } catch (error) {
    console.error('Error parsing GeoJSON:', error);
    return null;
  }
}

/**
 * Extracts center coordinates from GeoJSON
 */
export function getFeatureCenter(feature: GeoJSONFeature): [number, number] | null {
  try {
    if (!feature || !feature.geometry) return null;

    switch (feature.geometry.type) {
      case 'Point':
        return [
          feature.geometry.coordinates[1] as number,
          feature.geometry.coordinates[0] as number
        ];
      case 'LineString':
        // For LineString, get the center point of the line
        const lineCoords = feature.geometry.coordinates as number[][];
        const midIndex = Math.floor(lineCoords.length / 2);
        return [lineCoords[midIndex][1], lineCoords[midIndex][0]];
      case 'Polygon':
        // For Polygon, calculate centroid
        const polygonCoords = (feature.geometry.coordinates as number[][][])[0]; // First ring
        let lat = 0;
        let lng = 0;
        polygonCoords.forEach(coord => {
          lat += coord[1];
          lng += coord[0];
        });
        return [lat / polygonCoords.length, lng / polygonCoords.length];
      default:
        return null;
    }
  } catch (error) {
    console.error('Error getting feature center:', error);
    return null;
  }
}

/**
 * Formats OSM tags into readable text
 */
export function formatTags(tags: Record<string, any>): string {
  return Object.entries(tags)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
}

/**
 * Generates a color based on object type
 */
export function getObjectColor(osmObject: OSMObject): string {
  // Base the color on the object type or tags
  const type = osmObject.type.toLowerCase();
  
  if (type.includes('node')) {
    return '#2563eb'; // blue
  } else if (type.includes('way')) {
    return '#16a34a'; // green
  } else if (type.includes('relation')) {
    return '#dc2626'; // red
  }
  
  // Fallback to checking tags
  const tags = osmObject.tags;
  
  if (tags.highway) {
    return '#9333ea'; // purple
  } else if (tags.building) {
    return '#ea580c'; // orange
  } else if (tags.natural) {
    return '#16a34a'; // green
  } else if (tags.water || tags.waterway) {
    return '#0891b2'; // cyan
  }
  
  // Default color
  return '#6b7280'; // gray
} 