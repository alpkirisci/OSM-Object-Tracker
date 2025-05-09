'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import MainLayout from '@/components/common/MainLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { DataSource } from '@/types';
import api from '@/services/api';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiPower } from 'react-icons/fi';
import Link from 'next/link';
import DataSourceForm from '../components/DataSourceForm';

export default function DataSourcesAdminPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);

  const fetchDataSources = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const sources = await api.dataSources.getSources();
      setDataSources(sources);
    } catch (err) {
      console.error('Failed to load data sources:', err);
      setError('Failed to load data sources. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataSources();
  }, []);

  const handleAddSource = () => {
    setEditingSource(null);
    setIsFormOpen(true);
  };

  const handleEditSource = (source: DataSource) => {
    setEditingSource(source);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSource(null);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingSource(null);
    fetchDataSources();
  };

  const handleToggleActive = async (source: DataSource) => {
    try {
      await api.dataSources.updateSource(source.id, {
        is_active: !source.is_active
      });
      fetchDataSources();
    } catch (err) {
      console.error('Failed to toggle data source status:', err);
      setError('Failed to update data source status. Please try again.');
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!window.confirm('Are you sure you want to delete this data source? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.dataSources.deleteSource(sourceId);
      fetchDataSources();
    } catch (err) {
      console.error('Failed to delete data source:', err);
      setError('Failed to delete data source. Please try again.');
    }
  };

  return (
    <MainLayout>
      <div className={styles.adminPageContainer}>
        <div className={styles.pageHeader}>
          <div className={styles.headerTitleSection}>
            <Link href="/admin">
              <Button variant="ghost" className={styles.backButton}>
                <FiArrowLeft />
                <span>Back to Admin</span>
              </Button>
            </Link>
            <h1 className={styles.pageTitle}>Data Source Management</h1>
          </div>
          <Button 
            onClick={handleAddSource}
            variant="primary"
          >
            <FiPlus />
            <span>Add Data Source</span>
          </Button>
        </div>
        
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
        
        <section className={styles.dataSourcesSection}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading data sources...</p>
            </div>
          ) : dataSources.length > 0 ? (
            <div className={styles.dataSourcesGrid}>
              {dataSources.map(source => (
                <Card key={source.id} className={styles.dataSourceCard}>
                  <CardContent className={styles.dataSourceCardContent}>
                    <div className={styles.dataSourceHeader}>
                      <div>
                        <h3 className={styles.dataSourceName}>{source.name}</h3>
                        <div className={styles.dataSourceInfo}>
                          <Badge variant={source.is_active ? 'success' : 'secondary'}>
                            {source.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <span className={styles.dataSourceType}>{source.type}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.dataSourceDescription}>
                      {source.description || <span className={styles.noDescription}>No description</span>}
                    </div>
                    
                    <div className={styles.dataSourceDetails}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Type:</span>
                        <span className={styles.detailValue}>{source.type}</span>
                      </div>
                      {source.connection_info && Object.keys(source.connection_info).length > 0 && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Connection:</span>
                          <span className={styles.detailValue}>
                            {source.connection_info.url || 'Connection details available'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.dataSourceActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(source)}
                        className={styles.actionButton}
                      >
                        <FiPower className={styles.actionIcon} />
                        <span>{source.is_active ? 'Deactivate' : 'Activate'}</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSource(source)}
                        className={styles.actionButton}
                      >
                        <FiEdit2 className={styles.actionIcon} />
                        <span>Edit</span>
                      </Button>
                      
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteSource(source.id)}
                        className={styles.actionButton}
                      >
                        <FiTrash2 className={styles.actionIcon} />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No data sources found. Create a data source to connect to external data providers.</p>
              <Button 
                variant="primary" 
                onClick={handleAddSource}
              >
                <FiPlus />
                <span>Add Data Source</span>
              </Button>
            </div>
          )}
        </section>
      </div>
      
      {isFormOpen && (
        <DataSourceForm
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
          dataSource={editingSource}
        />
      )}
    </MainLayout>
  );
} 