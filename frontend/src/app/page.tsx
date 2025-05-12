'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './page.module.css';
import MainLayout from '@/components/common/MainLayout';
import dynamic from 'next/dynamic';
import ObjectDetails from '@/components/Map/ObjectDetails';
import ObjectList from '@/components/Map/ObjectList';
import TypeList from '@/components/Map/TypeList';
import { TrackedObject, Filter, ObjectType } from '@/types';
import api from '@/services/api';

const MapContainer = dynamic(() => import('@/components/Map/MapContainer'), {
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading map...</div>
});

export default function HomePage() {
  const [objects, setObjects] = useState<TrackedObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<TrackedObject | null>(null);
  const [detailsObject, setDetailsObject] = useState<TrackedObject | null>(null);
  const [filter, setFilter] = useState<Filter>({
    sort_by: 'updated',
    sort_direction: 'desc'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(Object.values(ObjectType)));
  const [objectTypes, setObjectTypes] = useState<string[]>([]);
  const [userInteracted, setUserInteracted] = useState(false);
  
  // Count objects by type
  const typeCounts = objects.reduce((acc, obj) => {
    const type = obj.type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  useEffect(() => {
    const fetchObjectTypes = async () => {
      try {
        const types = await api.trackedObjects.getObjectTypes();
        setObjectTypes(types);
        // Initialize all types as visible
        setVisibleTypes(new Set(types));
      } catch (err) {
        console.error('Failed to load object types:', err);
        // In case of error, use enum values as fallback
        const fallbackTypes = Object.values(ObjectType);
        setObjectTypes(fallbackTypes);
        setVisibleTypes(new Set(fallbackTypes));
      }
    };
    
    fetchObjectTypes();
  }, []);

  // Helper function for client-side sorting
  const sortObjects = useCallback((objectsToSort: TrackedObject[], currentFilter: Filter): TrackedObject[] => {
    if (!currentFilter.sort_by) return objectsToSort;
    
    const sorted = [...objectsToSort];
    const direction = currentFilter.sort_direction === 'desc' ? -1 : 1;
    
    return sorted.sort((a, b) => {
      switch (currentFilter.sort_by) {
        case 'name':
          return direction * ((a.name || '').localeCompare(b.name || ''));
        case 'type':
          return direction * (a.type.localeCompare(b.type));
        case 'created':
          return direction * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        case 'updated':
        default:
          return direction * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
      }
    });
  }, []);

  useEffect(() => {
    const fetchObjects = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await api.trackedObjects.getObjects(filter);
        // Sort the data client-side just in case the backend doesn't support sorting
        const sortedData = sortObjects(data, filter);
        setObjects(sortedData);
      } catch (err) {
        console.error('Failed to load objects:', err);
        setError('Failed to load objects. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchObjects();
  }, [filter]);

  // Set up a timer to refresh the data periodically
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        if (selectedObject) {
          // If we have a selected object, refresh just that one
          const updatedObject = await api.trackedObjects.getObjectById(selectedObject.id);
          setSelectedObject(updatedObject);
          
          // Also update the details object if it's the same
          if (detailsObject && detailsObject.id === updatedObject.id) {
            setDetailsObject(updatedObject);
          }
          
          // Also update the object in the full list
          setObjects(prevObjects => 
            sortObjects(
              prevObjects.map(obj => 
                obj.id === updatedObject.id ? updatedObject : obj
              ),
              filter
            )
          );
        } else {
          // Otherwise refresh all objects
          const data = await api.trackedObjects.getObjects(filter);
          const sortedData = sortObjects(data, filter);
          setObjects(sortedData);
          
          // Update details object if present
          if (detailsObject) {
            const updatedDetails = sortedData.find(obj => obj.id === detailsObject.id);
            if (updatedDetails) {
              setDetailsObject(updatedDetails);
            }
          }
        }
      } catch (err) {
        console.error('Failed to refresh objects:', err);
      }
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(refreshInterval);
  }, [filter, selectedObject, detailsObject, sortObjects]);

  const handleObjectClick = (object: TrackedObject) => {
    // Toggle following
    if (selectedObject && selectedObject.id === object.id) {
      setSelectedObject(null);
    } else {
      setSelectedObject(object);
    }
  };

  const handleViewObjectDetails = (object: TrackedObject) => {
    setDetailsObject(object);
  };

  const handleCloseDetails = () => {
    setDetailsObject(null);
  };

  const handleFilterChange = (newFilter: Filter) => {
    setFilter(newFilter);
  };
  
  const handleToggleType = (type: string) => {
    setVisibleTypes(prev => {
      const newVisibleTypes = new Set(prev);
      if (newVisibleTypes.has(type)) {
        newVisibleTypes.delete(type);
        
        // If the currently selected object is of this type, deselect it
        if (selectedObject && selectedObject.type === type) {
          setSelectedObject(null);
        }

        // If the details object is of this type, close the details panel
        if (detailsObject && detailsObject.type === type) {
          setDetailsObject(null);
        }
      } else {
        newVisibleTypes.add(type);
      }
      return newVisibleTypes;
    });
  };
  
  const handleMapInteraction = useCallback(() => {
    if (!userInteracted) {
      setUserInteracted(true);
    }
  }, [userInteracted]);

  return (
    <MainLayout>
      <div className={styles.mapPageContainer}>
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
        
        <div className={styles.contentLayout}>
          <div className={styles.leftSidebar}>
            <ObjectList 
              objects={objects.filter(obj => visibleTypes.has(obj.type))}
              totalObjectCount={objects.length}
              onSelectObject={handleObjectClick}
              onViewObjectDetails={handleViewObjectDetails}
              selectedObjectId={selectedObject?.id || null}
              isLoading={isLoading}
              objectTypes={objectTypes}
              filter={filter}
              onFilterChange={handleFilterChange}
            />
          </div>
          
          <div className={styles.mapContainer}>
            {isLoading && !objects.length && (
              <div className={styles.loadingOverlay}>
                <div className={styles.spinner}></div>
                <p>Loading objects...</p>
              </div>
            )}
            
            <MapContainer 
              objects={objects} 
              onObjectClick={handleObjectClick}
              selectedObject={selectedObject}
              visibleTypes={visibleTypes}
              shouldResetView={!userInteracted}
              onMapInteraction={handleMapInteraction}
            />
          </div>
          
          <div className={styles.rightSidebar}>
            <TypeList 
              objectTypes={objectTypes}
              visibleTypes={visibleTypes}
              onToggleType={handleToggleType}
              typeCounts={typeCounts}
            />
            
            {detailsObject && (
              <div className={styles.detailsPanel}>
                <ObjectDetails 
                  object={detailsObject} 
                  onClose={handleCloseDetails}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
