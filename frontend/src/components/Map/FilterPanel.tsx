'use client';

import React, { useState, useEffect } from 'react';
import styles from './FilterPanel.module.css';
import Card, { CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Filter, DataSource } from '@/types';
import api from '@/services/api';
import { FiFilter, FiX } from 'react-icons/fi';

interface FilterPanelProps {
  onFilterChange: (filter: Filter) => void;
  initialFilter?: Filter;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  onFilterChange,
  initialFilter = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [objectTypes, setObjectTypes] = useState<string[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [availableTags, setAvailableTags] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsLoading(true);
      try {
        const [types, sources, tags] = await Promise.all([
          api.osmObjects.getObjectTypes(),
          api.dataSources.getSources(),
          api.osmObjects.getObjectTags()
        ]);
        
        setObjectTypes(types);
        setDataSources(sources);
        setAvailableTags(tags);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFilterOptions();
  }, []);

  const handleFilterChange = (key: keyof Filter, value: string | undefined) => {
    const newFilter = { ...filter, [key]: value };
    
    // If the value is empty, remove the property from the filter
    if (!value) {
      delete newFilter[key];
    }
    
    setFilter(newFilter);
  };

  const applyFilter = () => {
    onFilterChange(filter);
  };

  const resetFilter = () => {
    setFilter({});
    onFilterChange({});
  };

  const togglePanel = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.filterPanelContainer}>
      <button 
        className={styles.expandButton}
        onClick={togglePanel}
        aria-label={isExpanded ? 'Close filters' : 'Open filters'}
      >
        {isExpanded ? <FiX /> : <FiFilter />}
      </button>
      
      <div className={`${styles.panel} ${isExpanded ? styles.expanded : ''}`}>
        <Card className={styles.card}>
          <CardHeader className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Filter Objects</h3>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            {isLoading ? (
              <div className={styles.loadingState}>Loading filter options...</div>
            ) : (
              <form className={styles.filterForm}>
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
                  <label htmlFor="tag-filter" className={styles.filterLabel}>Tag</label>
                  <select 
                    id="tag-filter"
                    className={styles.filterSelect}
                    value={filter.tag || ''}
                    onChange={(e) => handleFilterChange('tag', e.target.value || undefined)}
                  >
                    <option value="">All Tags</option>
                    {Object.keys(availableTags).map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.buttonGroup}>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={applyFilter}
                  >
                    Apply Filters
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={resetFilter}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FilterPanel; 