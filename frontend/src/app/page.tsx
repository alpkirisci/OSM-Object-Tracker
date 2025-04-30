'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import MainLayout from '@/components/common/MainLayout';
import MapContainer from '@/components/Map/MapContainer';
import FilterPanel from '@/components/Map/FilterPanel';
import ObjectDetails from '@/components/Map/ObjectDetails';
import { OSMObject, Filter } from '@/types';
import api from '@/services/api';

export default function HomePage() {
  const [objects, setObjects] = useState<OSMObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<OSMObject | null>(null);
  const [filter, setFilter] = useState<Filter>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchObjects = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await api.osmObjects.getObjects(filter);
        setObjects(data);
      } catch (err) {
        console.error('Failed to load objects:', err);
        setError('Failed to load objects. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchObjects();
  }, [filter]);

  const handleObjectClick = (object: OSMObject) => {
    setSelectedObject(object);
  };

  const handleCloseDetails = () => {
    setSelectedObject(null);
  };

  const handleFilterChange = (newFilter: Filter) => {
    setFilter(newFilter);
  };

  return (
    <MainLayout>
      <div className={styles.mapPageContainer}>
        <h1 className={styles.pageTitle}>OSM Object Tracker</h1>
        
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
        
        <div className={styles.mapContainer}>
          {isLoading && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner}></div>
              <p>Loading objects...</p>
            </div>
          )}
          
          <MapContainer 
            objects={objects} 
            onObjectClick={handleObjectClick}
          />
          
          <FilterPanel 
            onFilterChange={handleFilterChange}
            initialFilter={filter}
          />
          
          {selectedObject && (
            <ObjectDetails 
              object={selectedObject} 
              onClose={handleCloseDetails}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
