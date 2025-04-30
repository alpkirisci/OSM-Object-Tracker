import { 
  OSMObject, ObjectLocation, DataSource, DataSourceCreate, DataSourceUpdate, Filter
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
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
}

// OSM Objects API
const osmObjects = {
  getObjects: (filters?: Filter): Promise<OSMObject[]> => {
    let query = '';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.tag) params.append('tag', filters.tag);
      if (filters.source_id) params.append('source_id', filters.source_id);
      query = `?${params.toString()}`;
    }
    return fetchApi<OSMObject[]>(`/objects${query}`);
  },
  
  getObjectById: (id: string): Promise<OSMObject> => 
    fetchApi<OSMObject>(`/objects/${id}`),
    
  getObjectLocations: (objectId: string): Promise<ObjectLocation[]> => 
    fetchApi<ObjectLocation[]>(`/objects/${objectId}/locations`),
    
  getObjectTypes: (): Promise<string[]> => 
    fetchApi<string[]>('/objects/types'),
    
  getObjectTags: (): Promise<Record<string, string[]>> => 
    fetchApi<Record<string, string[]>>('/objects/tags')
};

// Data Sources API
const dataSources = {
  getSources: (): Promise<DataSource[]> => 
    fetchApi<DataSource[]>('/data-sources'),
    
  getSourceById: (id: string): Promise<DataSource> => 
    fetchApi<DataSource>(`/data-sources/${id}`),
    
  createSource: (data: DataSourceCreate): Promise<DataSource> => 
    fetchApi<DataSource>('/data-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  updateSource: (id: string, data: DataSourceUpdate): Promise<DataSource> => 
    fetchApi<DataSource>(`/data-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  deleteSource: (id: string): Promise<void> => 
    fetchApi<void>(`/data-sources/${id}`, {
      method: 'DELETE',
    }),
    
  activateSource: (id: string): Promise<DataSource> => 
    fetchApi<DataSource>(`/data-sources/${id}/activate`, {
      method: 'POST',
    }),
    
  deactivateSource: (id: string): Promise<DataSource> => 
    fetchApi<DataSource>(`/data-sources/${id}/deactivate`, {
      method: 'POST',
    })
};

// Export the API endpoints
const api = {
  osmObjects,
  dataSources
};

export default api;