export interface OSMObject {
  id: string;
  osm_id: string;
  type: string;
  tags: Record<string, any>;
  geom: string;
  source_id: string;
  created_at: string;
  updated_at: string;
}

export interface ObjectLocation {
  id: string;
  object_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface DataSource {
  id: string;
  name: string;
  description?: string;
  type: 'websocket' | 'rest';
  connection_info: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DataSourceCreate {
  name: string;
  description?: string;
  type: 'websocket' | 'rest';
  connection_info: Record<string, any>;
  is_active?: boolean;
}

export interface DataSourceUpdate {
  name?: string;
  description?: string;
  type?: 'websocket' | 'rest';
  connection_info?: Record<string, any>;
  is_active?: boolean;
}

export type Filter = {
  type?: string;
  tag?: string;
  source_id?: string;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export type GeoJSONFeature = {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, any>;
};

export type GeoJSONCollection = {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
};