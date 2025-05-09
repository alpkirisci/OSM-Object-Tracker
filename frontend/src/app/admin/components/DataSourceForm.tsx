'use client';

import React, { useState, useEffect } from 'react';
import styles from './DataSourceForm.module.css';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { DataSource } from '@/types';
import api from '@/services/api';
import { FiX, FiInfo } from 'react-icons/fi';

interface DataSourceFormProps {
  onClose: () => void;
  onSuccess: () => void;
  dataSource: DataSource | null;
}

const DataSourceForm: React.FC<DataSourceFormProps> = ({
  onClose,
  onSuccess,
  dataSource
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'websocket',
    connection_info: JSON.stringify({ url: '' }, null, 2),
    is_active: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!dataSource;

  useEffect(() => {
    if (dataSource) {
      setFormData({
        name: dataSource.name,
        description: dataSource.description || '',
        type: dataSource.type,
        connection_info: JSON.stringify(dataSource.connection_info, null, 2),
        is_active: dataSource.is_active
      });
    }
  }, [dataSource]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    // Validate
    if (!formData.name.trim()) {
      setError('Name is required');
      setIsSubmitting(false);
      return;
    }
    
    // Parse connection info
    let parsedConnectionInfo: Record<string, any>;
    try {
      parsedConnectionInfo = JSON.parse(formData.connection_info);
    } catch (err) {
      setError('Invalid connection info JSON');
      setIsSubmitting(false);
      return;
    }
    
    try {
      if (isEditing && dataSource) {
        // Update existing data source
        await api.dataSources.updateSource(dataSource.id, {
          name: formData.name,
          description: formData.description || undefined,
          type: formData.type as 'websocket' | 'rest',
          connection_info: parsedConnectionInfo,
          is_active: formData.is_active
        });
      } else {
        // Create new data source
        await api.dataSources.createSource({
          name: formData.name,
          description: formData.description || undefined,
          type: formData.type as 'websocket' | 'rest',
          connection_info: parsedConnectionInfo,
          is_active: formData.is_active
        });
      }
      
      onSuccess();
    } catch (err: any) {
      console.error('Failed to save data source:', err);
      setError(err.message || 'Failed to save data source. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="md">
      <div className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            {isEditing ? 'Edit Data Source' : 'Add Data Source'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        {error && (
          <div className={styles.errorMessage}>
            <FiInfo className={styles.errorIcon} />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={styles.input}
              required
              placeholder="Enter data source name"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={styles.textarea}
              rows={3}
              placeholder="Enter a description of this data source"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="type" className={styles.label}>Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="websocket">WebSocket</option>
              <option value="rest">REST API</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="connection_info" className={styles.label}>Connection Info (JSON)</label>
            <textarea
              id="connection_info"
              name="connection_info"
              value={formData.connection_info}
              onChange={handleInputChange}
              className={`${styles.textarea} ${styles.codeInput}`}
              rows={6}
              required
              placeholder={`{\n  "url": "wss://example.com/ws",\n  "auth_token": "your-token-here"\n}`}
            />
            <div className={styles.helpText}>
              {formData.type === 'websocket' 
                ? 'For WebSockets, include URL and any authentication details.' 
                : 'For REST, include base URL, endpoints, and authentication details.'}
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <div className={styles.checkboxContainer}>
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleCheckboxChange}
                className={styles.checkbox}
              />
              <label htmlFor="is_active" className={styles.checkboxLabel}>
                Active (source will receive and process data)
              </label>
            </div>
          </div>
          
          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default DataSourceForm; 