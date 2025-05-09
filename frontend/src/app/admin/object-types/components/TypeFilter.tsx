'use client';

import React, { useState } from 'react';
import styles from './TypeFilter.module.css';
import Button from '@/components/ui/Button';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';

interface TypeFilterProps {
  onFilter: (filters: { search: string; showInactive: boolean }) => void;
}

const TypeFilter: React.FC<TypeFilterProps> = ({ onFilter }) => {
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter({ search, showInactive });
  };

  const handleReset = () => {
    setSearch('');
    setShowInactive(false);
    onFilter({ search: '', showInactive: false });
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterHeader}>
        <h3 className={styles.filterTitle}>Filters</h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={toggleExpand}
          className={styles.expandButton}
        >
          {isExpanded ? <FiX /> : <FiFilter />}
        </Button>
      </div>
      
      {isExpanded && (
        <form onSubmit={handleSubmit} className={styles.filterForm}>
          <div className={styles.formGroup}>
            <label htmlFor="search" className={styles.label}>Search</label>
            <div className={styles.searchInput}>
              <input
                type="text"
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or description"
                className={styles.input}
              />
              <FiSearch className={styles.searchIcon} />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <div className={styles.checkboxContainer}>
              <input
                type="checkbox"
                id="showInactive"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="showInactive" className={styles.checkboxLabel}>
                Show inactive types
              </label>
            </div>
          </div>
          
          <div className={styles.filterActions}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
            >
              Apply Filters
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TypeFilter; 