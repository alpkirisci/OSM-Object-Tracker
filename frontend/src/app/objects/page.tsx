'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import MainLayout from '@/components/common/MainLayout';
import Card, { CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { TrackedObject, Filter, DataSource } from '@/types';
import api from '@/services/api';
import { FiFilter, FiX, FiExternalLink } from 'react-icons/fi';
import { format } from 'date-fns';

export default function ObjectsPage() {
  const [objects, setObjects] = useState<TrackedObject[]>([]);
  const [objectTypes, setObjectTypes] = useState<string[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [filter, setFilter] = useState<Filter>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [types, sources] = await Promise.all([
          api.trackedObjects.getObjectTypes(),
          api.dataSources.getSources(),
        ]);
        
        setObjectTypes(types);
        setDataSources(sources);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    
    fetchFilterOptions();
  }, []);
  
  useEffect(() => {
    const fetchObjects = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await api.trackedObjects.getObjects(filter);
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
  
  const handleFilterChange = (key: keyof Filter, value: string | undefined) => {
    const newFilter = { ...filter, [key]: value };
    
    // If the value is empty, remove the property from the filter
    if (!value) {
      delete newFilter[key];
    }
    
    setFilter(newFilter);
  };
  
  const resetFilters = () => {
    setFilter({});
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const getObjectName = (object: TrackedObject) => {
    return object.name || `${object.type} #${object.object_id}`;
  };
  
  return (
    <MainLayout>
      <div className={styles.objectsPageContainer}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Tracked Objects</h1>
          <Button 
            onClick={toggleFilters}
            variant="secondary"
            className={styles.filterToggleButton}
          >
            {showFilters ? <><FiX /> Hide Filters</> : <><FiFilter /> Show Filters</>}
          </Button>
        </div>
        
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
        
        <div className={styles.contentContainer}>
          {showFilters && (
            <div className={styles.filtersContainer}>
              <Card>
                <CardHeader className={styles.filtersHeader}>
                  <h2 className={styles.filtersTitle}>Filters</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetFilters}
                  >
                    Reset All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className={styles.filtersList}>
                    <div className={styles.filterGroup}>
                      <label htmlFor="type-filter" className={styles.filterLabel}>Object Type</label>
                      <select 
                        id="type-filter"
                        className={styles.filterSelect}
                        value={filter.type || ''}
                        onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                      >
                        <option value="">All Types</option>
                        {objectTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className={styles.filterGroup}>
                      <label htmlFor="source-filter" className={styles.filterLabel}>Data Source</label>
                      <select 
                        id="source-filter"
                        className={styles.filterSelect}
                        value={filter.source_id || ''}
                        onChange={(e) => handleFilterChange('source_id', e.target.value || undefined)}
                      >
                        <option value="">All Sources</option>
                        {dataSources.map(source => (
                          <option key={source.id} value={source.id}>{source.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className={styles.objectsContainer}>
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading objects...</p>
              </div>
            ) : objects.length > 0 ? (
              <div className={styles.objectsList}>
                {objects.map(object => (
                  <Card key={object.id} className={styles.objectCard}>
                    <CardContent className={styles.objectCardContent}>
                      <div className={styles.objectHeader}>
                        <h3 className={styles.objectName}>
                          {getObjectName(object)}
                        </h3>
                        <Badge variant="primary">{object.type}</Badge>
                      </div>
                      
                      <div className={styles.objectDetails}>
                        <div className={styles.objectDetail}>
                          <span className={styles.detailLabel}>Object ID:</span>
                          <span className={styles.detailValue}>{object.object_id}</span>
                        </div>
                        
                        {object.source_id && (
                          <div className={styles.objectDetail}>
                            <span className={styles.detailLabel}>Source:</span>
                            <span className={styles.detailValue}>
                              {dataSources.find(s => s.id === object.source_id)?.name || object.source_id}
                            </span>
                          </div>
                        )}
                        
                        {object.created_at && (
                          <div className={styles.objectDetail}>
                            <span className={styles.detailLabel}>Added:</span>
                            <span className={styles.detailValue}>
                              {format(new Date(object.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {object.additional_info && Object.keys(object.additional_info).length > 0 && (
                        <div className={styles.objectTags}>
                          {Object.entries(object.additional_info)
                            .slice(0, 3) // Show only first 3 entries
                            .map(([key, value]) => (
                              <div key={key} className={styles.objectTag}>
                                <span className={styles.tagKey}>{key}:</span>
                                <span className={styles.tagValue}>{String(value)}</span>
                              </div>
                            ))}
                          {Object.keys(object.additional_info).length > 3 && (
                            <div className={styles.moreTags}>
                              +{Object.keys(object.additional_info).length - 3} more
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className={styles.objectActions}>
                        <a 
                          href={`/objects/${object.id}`}
                          className={styles.viewLink}
                        >
                          <FiExternalLink />
                          <span>View Details</span>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No objects found matching your filters.</p>
                {Object.keys(filter).length > 0 && (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={resetFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 