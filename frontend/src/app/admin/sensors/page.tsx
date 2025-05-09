'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import MainLayout from '@/components/common/MainLayout';
import Card, { CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Sensor, SensorCreate, SensorUpdate } from '@/types';
import api from '@/services/api';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

export default function SensorsPage() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  
  const [newSensor, setNewSensor] = useState<SensorCreate>({
    sensor_id: '',
    name: '',
    type: '',
    description: ''
  });
  
  const fetchSensors = async () => {
    try {
      setLoading(true);
      const data = await api.sensors.getSensors();
      setSensors(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sensors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchSensors();
  }, []);
  
  const handleCreateSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSensor.sensor_id || !newSensor.name || !newSensor.type) {
      setError('Sensor ID, name, and type are required');
      return;
    }
    
    try {
      setLoading(true);
      await api.sensors.createSensor(newSensor);
      setNewSensor({ sensor_id: '', name: '', type: '', description: '' });
      setIsAddingNew(false);
      fetchSensors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sensor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSensor) return;
    
    try {
      setLoading(true);
      const updateData: SensorUpdate = {
        name: editingSensor.name,
        type: editingSensor.type,
        description: editingSensor.description,
        is_active: editingSensor.is_active
      };
      
      await api.sensors.updateSensor(editingSensor.id, updateData);
      setEditingSensor(null);
      fetchSensors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sensor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteSensor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sensor?')) return;
    
    try {
      setLoading(true);
      await api.sensors.deleteSensor(id);
      fetchSensors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sensor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <MainLayout>
      <div className={styles.sensorsPageContainer}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Sensor Management</h1>
          {!isAddingNew && (
            <Button
              variant="primary"
              onClick={() => setIsAddingNew(true)}
            >
              <FiPlus />
              <span>Add New Sensor</span>
            </Button>
          )}
        </div>
        
        {error && (
          <div className={styles.errorMessage}>
            {error}
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              style={{ marginLeft: 'auto' }}
            >
              <FiX />
            </Button>
          </div>
        )}
        
        {isAddingNew && (
          <div className={styles.formContainer}>
            <h2 className={styles.formTitle}>Add New Sensor</h2>
            <form onSubmit={handleCreateSensor}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Sensor ID*</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={newSensor.sensor_id}
                    onChange={(e) => setNewSensor({...newSensor, sensor_id: e.target.value})}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Name*</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={newSensor.name}
                    onChange={(e) => setNewSensor({...newSensor, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Type*</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={newSensor.type}
                    onChange={(e) => setNewSensor({...newSensor, type: e.target.value})}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={newSensor.description || ''}
                    onChange={(e) => setNewSensor({...newSensor, description: e.target.value})}
                  />
                </div>
              </div>
              
              <div className={styles.formActions}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAddingNew(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Sensor'}
                </Button>
              </div>
            </form>
          </div>
        )}
        
        {loading && !isAddingNew ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading sensors...</p>
          </div>
        ) : (
          <div className={styles.sensorsGrid}>
            {sensors.map((sensor) => (
              <Card key={sensor.id} className={styles.sensorCard}>
                <CardContent className={styles.sensorCardContent}>
                  <div className={styles.sensorHeader}>
                    <h3 className={styles.sensorName}>{sensor.name}</h3>
                    <Badge variant={sensor.is_active ? 'success' : 'secondary'}>
                      {sensor.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className={styles.sensorDetails}>
                    <p className={styles.sensorType}>
                      Type: <span>{sensor.type}</span>
                    </p>
                    
                    {sensor.description && (
                      <p className={styles.sensorDescription}>{sensor.description}</p>
                    )}
                    
                    <div className={styles.sensorId}>
                      Sensor ID: {sensor.sensor_id}
                    </div>
                  </div>
                  
                  <div className={styles.sensorActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingSensor(sensor)}
                      className={styles.actionButton}
                    >
                      <FiEdit2 />
                      <span>Edit</span>
                    </Button>
                    
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteSensor(sensor.id)}
                      className={styles.actionButton}
                    >
                      <FiTrash2 />
                      <span>Delete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {editingSensor && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Edit Sensor</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setEditingSensor(null)}
                >
                  <FiX />
                </Button>
              </div>
              
              <form onSubmit={handleUpdateSensor}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Sensor ID (read-only)</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={editingSensor.sensor_id}
                      disabled
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Name*</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={editingSensor.name}
                      onChange={(e) => setEditingSensor({...editingSensor, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Type*</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={editingSensor.type}
                      onChange={(e) => setEditingSensor({...editingSensor, type: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Description</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={editingSensor.description || ''}
                      onChange={(e) => setEditingSensor({...editingSensor, description: e.target.value})}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <input
                        type="checkbox"
                        checked={editingSensor.is_active}
                        onChange={(e) => setEditingSensor({...editingSensor, is_active: e.target.checked})}
                      />
                      <span style={{ marginLeft: '0.5rem' }}>Active</span>
                    </label>
                  </div>
                </div>
                
                <div className={styles.modalActions}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditingSensor(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Update Sensor'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 