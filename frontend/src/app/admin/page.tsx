'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import MainLayout from '@/components/common/MainLayout';
import Card, { CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { DataSource } from '@/types';
import api from '@/services/api';
import { FiPlus, FiEdit2, FiTrash2, FiPower, FiActivity, FiAlertCircle, FiDatabase, FiTag, FiServer, FiAlertTriangle } from 'react-icons/fi';
import DataSourceForm from './components/DataSourceForm';
import Link from 'next/link';

export default function AdminPage() {
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
      const updatedSource = await api.dataSources.updateSource(source.id, {
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

  const adminSections = [
    {
      title: 'Data Sources',
      description: 'Configure and manage data source connections',
      icon: <FiDatabase size={24} />,
      href: '/admin/data-sources',
      color: '#52c41a'
    },
    {
      title: 'Sensors',
      description: 'Manage sensors and sensor configurations',
      icon: <FiServer size={24} />,
      href: '/admin/sensors',
      color: '#722ed1'
    },
    {
      title: 'Object Types',
      description: 'Manage tracked object types, icons and colors',
      icon: <FiTag size={24} />,
      href: '/admin/object-types',
      color: '#eb2f96'
    },
    {
      title: 'Logs',
      description: 'View system logs and validation issues',
      icon: <FiAlertTriangle size={24} />,
      href: '/admin/logs',
      color: '#fa8c16'
    }
  ];

  return (
    <MainLayout>
      <div className={styles.adminContainer}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        
        <div className={styles.adminGrid}>
          {adminSections.map((section) => (
            <Link href={section.href} key={section.title} className={styles.cardLink}>
              <Card className={styles.adminCard}>
                <div className={styles.cardContent}>
                  <div 
                    className={styles.iconContainer}
                    style={{ backgroundColor: section.color }}
                  >
                    {section.icon}
                  </div>
                  <h2 className={styles.sectionTitle}>{section.title}</h2>
                  <p className={styles.sectionDescription}>{section.description}</p>
                  <Button variant="ghost" className={styles.cardButton}>
                    Manage
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
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