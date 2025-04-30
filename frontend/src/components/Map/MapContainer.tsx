'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapContainer.module.css';
import { OSMObject } from '@/types';
import api from '@/services/api';

interface MapContainerProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  objects?: OSMObject[];
  onObjectClick?: (object: OSMObject) => void;
}

const MapContainer: React.FC<MapContainerProps> = ({
  initialCenter = [51.505, -0.09], // Default to London
  initialZoom = 13,
  objects = [],
  onObjectClick
}) => {
  // Fix for Leaflet icon issue in Next.js
  useEffect(() => {
    // Fix Leaflet icon issues with webpack
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  }, []);

  return (
    <div className={styles.mapContainer}>
      <LeafletMapContainer 
        center={initialCenter} 
        zoom={initialZoom} 
        className={styles.map}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {objects.map(object => {
          // Parse the geometry to get coordinates
          // This is a simplification - you might need more complex parsing based on your actual data
          let coordinates: [number, number] | null = null;
          
          try {
            // Assuming geom is a GeoJSON string
            const geom = JSON.parse(object.geom);
            
            if (geom.type === 'Point') {
              coordinates = [geom.coordinates[1], geom.coordinates[0]]; // [lat, lng] for Leaflet
            }
            // Add handling for other geometry types if needed
          } catch (error) {
            console.error('Failed to parse object geometry', error);
          }
          
          if (coordinates) {
            return (
              <Marker 
                key={object.id} 
                position={coordinates}
                eventHandlers={{
                  click: () => onObjectClick && onObjectClick(object)
                }}
              >
                <Popup>
                  <div>
                    <h3 className={styles.popupTitle}>
                      {object.tags.name || `${object.type} #${object.osm_id}`}
                    </h3>
                    <p className={styles.popupType}>Type: {object.type}</p>
                    {object.tags.description && (
                      <p className={styles.popupDescription}>{object.tags.description}</p>
                    )}
                    <button 
                      className={styles.popupDetailsButton}
                      onClick={() => onObjectClick && onObjectClick(object)}
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          }
          
          return null;
        })}
      </LeafletMapContainer>
    </div>
  );
};

export default MapContainer; 