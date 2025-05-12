'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './ObjectList.module.css';
import { TrackedObject, ObjectType, Filter } from '@/types';
import { FiMap, FiUser, FiTag, FiInfo, FiFilter, FiX, FiRefreshCw, FiArrowDown, FiArrowUp, FiEye } from 'react-icons/fi';
import api from '@/services/api';
import { getIconForObjectType } from '@/utils/iconUtils';

interface ObjectListProps {
  objects: TrackedObject[];
  totalObjectCount?: number;
  onSelectObject: (object: TrackedObject) => void;
  onViewObjectDetails?: (object: TrackedObject) => void;
  selectedObjectId: string | null;
  isLoading: boolean;
  objectTypes: string[];
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
}

const ObjectList: React.FC<ObjectListProps> = ({
  objects,
  totalObjectCount,
  onSelectObject,
  onViewObjectDetails,
  selectedObjectId,
  isLoading,
  objectTypes,
  filter,
  onFilterChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [dataSources, setDataSources] = useState<{id: string, name: string}[]>([]);
  // Create a container ref for scrolling
  const objectListRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);
  
  // Fetch data sources for filter dropdown
  useEffect(() => {
    const fetchDataSources = async () => {
      try {
        const sources = await api.dataSources.getSources();
        setDataSources(sources.map(s => ({ id: s.id, name: s.name })));
      } catch (error) {
        console.error('Failed to fetch data sources:', error);
      }
    };
    
    fetchDataSources();
  }, []);
  
  const filteredObjects = searchTerm 
    ? objects.filter(obj => 
        obj.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        obj.object_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : objects;

  const getIconForType = (type: string) => {
    return getIconForObjectType(type);
  };

  const handleFilterChange = (key: keyof Filter, value: string | undefined) => {
    const newFilter = { ...filter };
    
    if (!value || value === '') {
      delete newFilter[key];
    } else if (key === 'type') {
      // String type identifiers now
      newFilter.type = value;
    } else if (key === 'last_updated') {
      newFilter.last_updated = value as 'today' | '3days' | 'week' | 'month' | 'all';
    } else if (key === 'sort_by') {
      newFilter.sort_by = value as 'name' | 'type' | 'updated' | 'created';
    } else if (key === 'sort_direction') {
      newFilter.sort_direction = value as 'asc' | 'desc';
    } else {
      // For other filter properties
      newFilter[key] = value;
    }
    
    onFilterChange(newFilter);
  };

  const resetFilter = () => {
    onFilterChange({});
  };

  const toggleSortDirection = () => {
    const direction = filter.sort_direction === 'asc' ? 'desc' : 'asc';
    handleFilterChange('sort_direction', direction);
  };

  // Function to handle viewing object details without affecting following state
  const handleViewDetails = (e: React.MouseEvent, object: TrackedObject) => {
    e.stopPropagation(); // Prevent the card click event from firing
    if (onViewObjectDetails) {
      onViewObjectDetails(object);
    }
  };

  // Scroll to selected object when it changes
  useEffect(() => {
    if (selectedObjectId && selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedObjectId]);

  return (
    <div className={styles.objectListContainer}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <h3 className={styles.title}>Objects</h3>
          <button 
            className={styles.filterToggle}
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            aria-label={isFilterExpanded ? "Hide filters" : "Show filters"}
          >
            {isFilterExpanded ? <FiX /> : <FiFilter />}
            <span className={styles.filterText}>Filter</span>
          </button>
        </div>
        
        {isFilterExpanded && (
          <div className={styles.filterPanel}>
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
            
            <div className={styles.filterGroup}>
              <label htmlFor="time-filter" className={styles.filterLabel}>Last Updated</label>
              <select 
                id="time-filter"
                className={styles.filterSelect}
                value={filter.last_updated || 'all'}
                onChange={(e) => handleFilterChange('last_updated', e.target.value || undefined)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="3days">Last 3 Days</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label htmlFor="sort-filter" className={styles.filterLabel}>Sort By</label>
              <div className={styles.sortContainer}>
                <select 
                  id="sort-filter"
                  className={styles.sortSelect}
                  value={filter.sort_by || 'updated'}
                  onChange={(e) => handleFilterChange('sort_by', e.target.value || undefined)}
                >
                  <option value="updated">Last Updated</option>
                  <option value="created">Creation Date</option>
                  <option value="name">Name</option>
                  <option value="type">Type</option>
                </select>
                <button 
                  className={styles.sortDirectionToggle}
                  onClick={toggleSortDirection}
                  aria-label={`Sort ${filter.sort_direction === 'asc' ? 'Ascending' : 'Descending'}`}
                >
                  {filter.sort_direction === 'asc' ? <FiArrowUp /> : <FiArrowDown />}
                </button>
              </div>
            </div>
            
            <div className={styles.filterActions}>
              <button 
                className={`${styles.filterButton} ${styles.resetButton}`}
                onClick={resetFilter}
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
        
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search objects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        {totalObjectCount && totalObjectCount > objects.length && !isLoading && (
          <div className={styles.filterMessage}>
            <FiEye className={styles.filterIcon} />
            <span>{totalObjectCount - objects.length} object{totalObjectCount - objects.length !== 1 ? 's' : ''} hidden by type filter. Toggle object types on the right panel to show them.</span>
          </div>
        )}
      </div>

      <div className={styles.objectList} ref={objectListRef}>
        {isLoading ? (
          <div className={styles.loading}>
            <FiRefreshCw className={styles.loadingIcon} />
            <span>Loading objects...</span>
          </div>
        ) : filteredObjects.length === 0 ? (
          <div className={styles.noObjects}>
            {searchTerm ? "No objects match your search" : "No objects available"}
          </div>
        ) : (
          filteredObjects.map((object) => (
            <div 
              key={object.id} 
              ref={selectedObjectId === object.id ? selectedRef : null}
              className={`${styles.objectCard} ${selectedObjectId === object.id ? styles.selected : ''}`}
              onClick={() => onSelectObject(object)}
            >
              <div className={styles.objectIcon}>
                {getIconForType(object.type)}
              </div>
              <div className={styles.objectInfo}>
                <div className={styles.objectName}>
                  {object.name || `Object #${object.object_id.slice(0, 8)}`}
                </div>
                <div className={styles.objectType}>
                  {object.type}
                </div>
                <div className={styles.objectMeta}>
                  Last update: {new Date(object.updated_at).toLocaleTimeString()}
                </div>
              </div>
              {onViewObjectDetails && (
                <button 
                  className={styles.viewDetailsButton}
                  onClick={(e) => handleViewDetails(e, object)}
                  aria-label="View details"
                >
                  <FiEye /> Details
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ObjectList;