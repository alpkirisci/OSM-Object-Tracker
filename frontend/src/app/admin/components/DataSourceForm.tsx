'use client';

import React, { useState } from 'react';
import styles from './DataSourceForm.module.css';
import Card, { CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { DataSource, DataSourceCreate, DataSourceUpdate } from '@/types';
import api from '@/services/api';
import { FiX } from 'react-icons/fi';

interface DataSourceFormProps {
  dataSource?: DataSource | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DataSourceForm: React.FC<DataSourceFormProps> = ({
  dataSource,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<DataSourceCreate | DataSourceUpdate>({
    name: dataSource?.name || '',
    description: dataSource?.description || '',
    type: dataSource?.type || 'rest',
    connection_info: dataSource?.connection_info || {},
    is_active: dataSource?.is_active !== undefined ? dataSource.is_active : true
  });
  
  const [connectionInfoText, setConnectionInfoText] = useState(
    JSON.stringify(dataSource?.connection_info || {}, null, 2)
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionInfoError, setConnectionInfoError] = useState<string | null>(null);
  
  const isEditing = !!dataSource;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox for is_active
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleConnectionInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConnectionInfoText(e.target.value);
    setConnectionInfoError(null);
    
    try {
      const parsed = JSON.parse(e.target.value);
      setFormData(prev => ({ ...prev, connection_info: parsed }));
    } catch (err) {
      setConnectionInfoError('Invalid JSON format');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate connection info
    if (connectionInfoError) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (isEditing && dataSource) {
        await api.dataSources.updateSource(dataSource.id, formData as DataSourceUpdate);
      } else {
        await api.dataSources.createSource(formData as DataSourceCreate);
      }
      
      onSuccess();
    } catch (err) {
      console.error('Failed to save data source:', err);
      setError(err instanceof Error ? err.message : 'Failed to save data source.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className={styles.overlay}>
      <div className={styles.formContainer}>
        <Card className={styles.formCard}>
          <CardHeader className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              {isEditing ? 'Edit Data Source' : 'Add Data Source'}
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Close form"
            >
              <FiX />
            </Button>
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.formLabel}>Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="Enter data source name"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.formLabel}>Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  className={styles.formTextarea}
                  placeholder="Enter data source description"
                  rows={3}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="type" className={styles.formLabel}>Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={styles.formSelect}
                  required
                >
                  <option value="rest">REST API</option>
                  <option value="websocket">WebSocket</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="connection_info" className={styles.formLabel}>
                  Connection Info (JSON) *
                </label>
                <textarea
                  id="connection_info"
                  name="connection_info"
                  value={connectionInfoText}
                  onChange={handleConnectionInfoChange}
                  className={`${styles.formTextarea} ${styles.jsonInput} ${connectionInfoError ? styles.inputError : ''}`}
                  placeholder='{"url": "https://example.com/api", "api_key": "your-api-key"}'
                  rows={6}
                  required
                />
                {connectionInfoError && (
                  <p className={styles.errorText}>{connectionInfoError}</p>
                )}
                <p className={styles.formHint}>
                  Example: {formData.type === 'rest' 
                    ? '{"url": "https://example.com/api", "api_key": "your-api-key"}'
                    : '{"url": "wss://example.com/ws", "auth_token": "your-token"}'
                  }
                </p>
              </div>
              
              <div className={styles.formGroup}>
                <div className={styles.checkboxContainer}>
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className={styles.formCheckbox}
                  />
                  <label htmlFor="is_active" className={styles.checkboxLabel}>
                    Active
                  </label>
                </div>
              </div>
            </form>
          </CardContent>
          
          <CardFooter className={styles.formFooter}>
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default DataSourceForm; 