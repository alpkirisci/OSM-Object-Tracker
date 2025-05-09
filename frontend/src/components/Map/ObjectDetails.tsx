'use client';

import React, { useState, useEffect } from 'react';
import styles from './ObjectDetails.module.css';
import Card, { CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { TrackedObject, SensorData } from '@/types';
import api from '@/services/api';
import { FiX, FiMapPin, FiClock, FiInfo, FiRadio } from 'react-icons/fi';
import { format } from 'date-fns';

interface ObjectDetailsProps {
  object: TrackedObject;
  onClose: () => void;
}

const ObjectDetails: React.FC<ObjectDetailsProps> = ({ object, onClose }) => {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchObjectSensorData = async () => {
      setIsLoading(true);
      try {
        const data = await api.trackedObjects.getObjectSensorData(object.id);
        setSensorData(data);
      } catch (error) {
        console.error('Failed to load object sensor data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchObjectSensorData();
  }, [object.id]);

  return (
    <div className={styles.objectDetailsContainer}>
      <Card className={styles.card}>
        <CardHeader className={styles.cardHeader}>
          <div className={styles.headerContent}>
            <h3 className={styles.cardTitle}>
              {object.name || `${object.type} #${object.object_id}`}
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Close details"
            >
              <FiX />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className={styles.cardContent}>
          <div className={styles.objectInfo}>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>
                <FiInfo className={styles.infoIcon} />
                Type:
              </div>
              <div className={styles.infoValue}>
                <Badge variant="primary">{object.type}</Badge>
              </div>
            </div>
            
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>
                <FiMapPin className={styles.infoIcon} />
                Object ID:
              </div>
              <div className={styles.infoValue}>{object.object_id}</div>
            </div>
            
            {object.created_at && (
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>
                  <FiClock className={styles.infoIcon} />
                  Added:
                </div>
                <div className={styles.infoValue}>
                  {format(new Date(object.created_at), 'MMM d, yyyy HH:mm')}
                </div>
              </div>
            )}
          </div>
          
          {object.additional_info && Object.keys(object.additional_info).length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Additional Information</h4>
              <div className={styles.tagsList}>
                {Object.entries(object.additional_info).map(([key, value]) => (
                  <div key={key} className={styles.tag}>
                    <span className={styles.tagKey}>{key}:</span>
                    <span className={styles.tagValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Sensor Data History</h4>
            {isLoading ? (
              <div className={styles.loadingState}>Loading sensor data...</div>
            ) : sensorData.length > 0 ? (
              <div className={styles.locationsList}>
                {sensorData.map(data => (
                  <div key={data.id} className={styles.locationItem}>
                    <FiRadio className={styles.locationIcon} />
                    <div className={styles.locationDetails}>
                      <div className={styles.locationCoords}>
                        {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
                        {data.altitude ? `, alt: ${data.altitude.toFixed(2)}m` : ''}
                      </div>
                      <div className={styles.sensorInfo}>
                        Sensor ID: {data.raw_sensor_id}
                      </div>
                      <div className={styles.locationTime}>
                        {format(new Date(data.timestamp), 'MMM d, yyyy HH:mm:ss')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No sensor data available</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ObjectDetails; 