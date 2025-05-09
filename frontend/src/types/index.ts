// Legacy enum kept for backward compatibility 
// with existing code, but new code should use strings directly
export enum ObjectType {
  SHIP = "ship",
  CAR = "car",
  AIRPLANE = "airplane",
  DRONE = "drone",
  OTHER = "other"
}

export interface TrackedObject {
  id: string;
  object_id: string;
  name?: string;
  type: string;  // String type identifier
  additional_info?: Record<string, any>;
  source_id: string;
  created_at: string;
  updated_at: string;
  custom_type?: CustomObjectType;  // Optional associated styling
}

export interface SensorData {
  id: string;
  tracked_object_id: string;
  sensor_id?: string;
  raw_sensor_id: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  additional_data?: Record<string, any>;
  timestamp: string;
}

export interface Sensor {
  id: string;
  sensor_id: string;
  name: string;
  description?: string;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SensorCreate {
  sensor_id: string;
  name: string;
  description?: string;
  type: string;
  is_active?: boolean;
}

export interface SensorUpdate {
  name?: string;
  description?: string;
  type?: string;
  is_active?: boolean;
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

export interface DataValidationLog {
  id: string;
  log_type: 'error' | 'warning' | 'info';
  message: string;
  raw_data?: Record<string, any>;
  object_id?: string;
  sensor_id?: string;
  resolved: boolean;
  created_at: string;
}

export interface IncomingSensorData {
  object_id: string;
  object_name?: string;
  object_type: string;
  sensor_id: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  additional_data?: Record<string, any>;
  timestamp?: string;
}

export type Filter = {
  type?: string;
  source_id?: string;
  last_updated?: 'today' | '3days' | 'week' | 'month' | 'all';
  name?: string;
  sort_by?: 'name' | 'type' | 'updated' | 'created';
  sort_direction?: 'asc' | 'desc';
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

export interface CustomObjectType {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomObjectTypeCreate {
  name: string;
  display_name: string;
  description?: string;
  icon: string;
  color: string;
  is_active?: boolean;
}

export interface CustomObjectTypeUpdate {
  display_name?: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
}

export interface IconOption {
  name: string;
  displayName: string;
  value: string;
}

export interface ColorOption {
  name: string;
  displayName: string;
  value: string;
}