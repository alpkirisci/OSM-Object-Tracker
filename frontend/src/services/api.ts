import { 
  TrackedObject, SensorData, DataSource, DataSourceCreate, DataSourceUpdate, Filter,
  Sensor, SensorCreate, SensorUpdate, DataValidationLog,
  CustomObjectType, CustomObjectTypeCreate, CustomObjectTypeUpdate, IconOption, ColorOption
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Base fetch API helper - use for all API calls
 */
async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Fetching API: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.error('API Error Details:', errorData);
        
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            const errorMessages = errorData.detail.map((err: { loc: string[]; msg: string; }) => 
              `${err.loc.join('.')}: ${err.msg}`
            ).join('; ');
            throw new Error(errorMessages);
          } else {
            throw new Error(errorData.detail);
          }
        } else if (errorData.message) {
          throw new Error(errorData.message);
        } else {
          throw new Error(JSON.stringify(errorData));
        }
      } catch (parseError) {
        throw new Error(`API Error (${response.status}): ${response.statusText}`);
      }
    }

    // For successful DELETE requests (204 No Content), don't try to parse JSON
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (error) {
    console.error('Network or API error:', error);
    throw error;
  }
}

// Tracked Objects API
const trackedObjects = {
  getObjects: (filters?: Filter): Promise<TrackedObject[]> => {
    let query = '';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.source_id) params.append('source_id', filters.source_id);
      if (filters.name) params.append('name', filters.name);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.sort_direction) params.append('sort_direction', filters.sort_direction);
      
      // For last_updated filter, convert to date range
      if (filters.last_updated && filters.last_updated !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.last_updated) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case '3days':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 3);
            break;
          case 'week':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          default:
            startDate = new Date(0); // beginning of time
        }
        
        params.append('updated_after', startDate.toISOString());
      }
      
      query = `?${params.toString()}`;
    }
    return fetchApi<TrackedObject[]>(`/objects${query}`);
  },
  
  getObjectById: (id: string): Promise<TrackedObject> => 
    fetchApi<TrackedObject>(`/objects/${id}`),
    
  getObjectByExternalId: (externalId: string): Promise<TrackedObject> => 
    fetchApi<TrackedObject>(`/objects/by-object-id/${externalId}`),
    
  createObject: (data: any): Promise<TrackedObject> => 
    fetchApi<TrackedObject>('/objects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  updateObject: (id: string, data: any): Promise<TrackedObject> => 
    fetchApi<TrackedObject>(`/objects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  deleteObject: (id: string): Promise<void> => 
    fetchApi<void>(`/objects/${id}`, {
      method: 'DELETE',
    }),
    
  getObjectSensorData: (objectId: string): Promise<SensorData[]> => 
    fetchApi<SensorData[]>(`/objects/${objectId}/sensor-data`),
    
  getObjectTypes: async (): Promise<string[]> => {
    // Get types from the backend rather than using hardcoded enum values
    const types = await fetchApi<CustomObjectType[]>('/object-types');
    return types.filter(type => type.is_active).map(type => type.name);
  }
};

// Sensors API
const sensors = {
  getSensors: (params?: { is_active?: boolean, type?: string }): Promise<Sensor[]> => {
    let query = '';
    if (params) {
      const urlParams = new URLSearchParams();
      if (params.is_active !== undefined) urlParams.append('is_active', params.is_active.toString());
      if (params.type) urlParams.append('type', params.type);
      query = `?${urlParams.toString()}`;
    }
    return fetchApi<Sensor[]>(`/sensors${query}`);
  },
    
  getSensorById: (id: string): Promise<Sensor> => 
    fetchApi<Sensor>(`/sensors/${id}`),
    
  getSensorByExternalId: (externalId: string): Promise<Sensor> => 
    fetchApi<Sensor>(`/sensors/by-sensor-id/${externalId}`),
    
  createSensor: (data: SensorCreate): Promise<Sensor> => 
    fetchApi<Sensor>('/sensors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  updateSensor: (id: string, data: SensorUpdate): Promise<Sensor> => 
    fetchApi<Sensor>(`/sensors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  deleteSensor: (id: string): Promise<void> => 
    fetchApi<void>(`/sensors/${id}`, {
      method: 'DELETE',
    })
};

// Data Sources API
const dataSources = {
  getSources: (): Promise<DataSource[]> => 
    fetchApi<DataSource[]>('/api/data-sources'),
    
  getSourceById: (id: string): Promise<DataSource> => 
    fetchApi<DataSource>(`/api/data-sources/${id}`),
    
  createSource: (data: DataSourceCreate): Promise<DataSource> => 
    fetchApi<DataSource>('/api/data-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  updateSource: (id: string, data: DataSourceUpdate): Promise<DataSource> => 
    fetchApi<DataSource>(`/api/data-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  deleteSource: (id: string): Promise<void> => 
    fetchApi<void>(`/api/data-sources/${id}`, {
      method: 'DELETE',
    })
};

// Logs API
const logs = {
  getLogs: (params?: { log_type?: string, object_id?: string, sensor_id?: string, resolved?: boolean }): Promise<DataValidationLog[]> => {
    let query = '';
    if (params) {
      const urlParams = new URLSearchParams();
      if (params.log_type) urlParams.append('log_type', params.log_type);
      if (params.object_id) urlParams.append('object_id', params.object_id);
      if (params.sensor_id) urlParams.append('sensor_id', params.sensor_id);
      if (params.resolved !== undefined) urlParams.append('resolved', params.resolved.toString());
      query = `?${urlParams.toString()}`;
    }
    return fetchApi<DataValidationLog[]>(`/logs${query}`);
  },
    
  getLogById: (id: string): Promise<DataValidationLog> => 
    fetchApi<DataValidationLog>(`/logs/${id}`),
    
  updateLog: (id: string, data: { resolved: boolean }): Promise<DataValidationLog> => 
    fetchApi<DataValidationLog>(`/logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
};

// Export the API endpoints
const api = {
  trackedObjects,
  sensors,
  dataSources,
  logs,
  objectTypes: {
    getTypes: (): Promise<CustomObjectType[]> => 
      fetchApi<CustomObjectType[]>('/object-types'),
      
    getTypeById: (id: string): Promise<CustomObjectType> => 
      fetchApi<CustomObjectType>(`/object-types/${id}`),
      
    createType: (data: CustomObjectTypeCreate): Promise<CustomObjectType> => 
      fetchApi<CustomObjectType>('/object-types', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      
    updateType: (id: string, data: CustomObjectTypeUpdate): Promise<CustomObjectType> => 
      fetchApi<CustomObjectType>(`/object-types/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
      
    deleteType: (id: string): Promise<void> => 
      fetchApi<void>(`/object-types/${id}`, {
        method: 'DELETE',
      }),
      
    getAvailableIcons: (): Promise<IconOption[]> => 
      fetchApi<IconOption[]>('/object-types/icons'),
      
    getAvailableColors: (): Promise<ColorOption[]> => 
      fetchApi<ColorOption[]>('/object-types/colors'),
      
    initializeDefaultTypes: (): Promise<CustomObjectType[]> => 
      fetchApi<CustomObjectType[]>('/object-types/initialize', {
        method: 'POST'
      })
  }
};

export default api;