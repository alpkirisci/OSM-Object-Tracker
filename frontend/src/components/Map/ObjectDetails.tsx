'use client';

import React, { useState, useEffect } from 'react';
import styles from './ObjectDetails.module.css';
import Card, { CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { OSMObject, ObjectLocation } from '@/types';
import api from '@/services/api';
import { FiX, FiMapPin, FiClock, FiInfo } from 'react-icons/fi';
import { format } from 'date-fns';

interface ObjectDetailsProps {
  object: OSMObject;
  onClose: () => void;
}

const ObjectDetails: React.FC<ObjectDetailsProps> = ({ object, onClose }) => {
  const [locations, setLocations] = useState<ObjectLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchObjectLocations = async () => {
      setIsLoading(true);
      try {
        const data = await api.osmObjects.getObjectLocations(object.id);
        setLocations(data);
      } catch (error) {
        console.error('Failed to load object locations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchObjectLocations();
  }, [object.id]);

  return (
    <div className={styles.objectDetailsContainer}>
      <Card className={styles.card}>
        <CardHeader className={styles.cardHeader}>
          <div className={styles.headerContent}>
            <h3 className={styles.cardTitle}>
              {object.tags.name || `${object.type} #${object.osm_id}`}
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
                OSM ID:
              </div>
              <div className={styles.infoValue}>{object.osm_id}</div>
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
          
          {Object.keys(object.tags).length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Tags</h4>
              <div className={styles.tagsList}>
                {Object.entries(object.tags).map(([key, value]) => (
                  <div key={key} className={styles.tag}>
                    <span className={styles.tagKey}>{key}:</span>
                    <span className={styles.tagValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Location History</h4>
            {isLoading ? (
              <div className={styles.loadingState}>Loading location history...</div>
            ) : locations.length > 0 ? (
              <div className={styles.locationsList}>
                {locations.map(location => (
                  <div key={location.id} className={styles.locationItem}>
                    <FiMapPin className={styles.locationIcon} />
                    <div className={styles.locationDetails}>
                      <div className={styles.locationCoords}>
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </div>
                      <div className={styles.locationTime}>
                        {format(new Date(location.timestamp), 'MMM d, yyyy HH:mm:ss')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No location history available</div>
            )}
          </div>
          
          <a 
            href={`https://www.openstreetmap.org/${object.type}/${object.osm_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.osmLink}
          >
            View on OpenStreetMap
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

export default ObjectDetails; 