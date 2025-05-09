'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapContainer.module.css';
import { TrackedObject, ObjectType, SensorData } from '@/types';
import api from '@/services/api';

// Helper component to handle map centering on selected object
const MapController: React.FC<{ 
  center?: [number, number]; 
  selectedObject: TrackedObject | null; 
  latestPositions: Map<string, [number, number]>;
  shouldResetView: boolean;
}> = ({ 
  center, 
  selectedObject,
  latestPositions,
  shouldResetView
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedObject && latestPositions.has(selectedObject.id)) {
      map.panTo(latestPositions.get(selectedObject.id)!);
    } else if (center && shouldResetView) {
      map.panTo(center);
    }
  }, [map, selectedObject, center, latestPositions, shouldResetView]);
  
  return null;
};

// Helper component to detect map interactions
const MapInteractionDetector: React.FC<{ onMapInteraction?: () => void }> = ({ onMapInteraction }) => {
  useMapEvents({
    drag: () => onMapInteraction && onMapInteraction(),
    zoom: () => onMapInteraction && onMapInteraction(),
    move: () => onMapInteraction && onMapInteraction()
  });
  
  return null;
};

interface MapContainerProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  objects?: TrackedObject[];
  visibleTypes?: Set<string>;
  onObjectClick?: (object: TrackedObject) => void;
  selectedObject?: TrackedObject | null;
  shouldResetView?: boolean;
  onMapInteraction?: () => void;
}

const MapContainer: React.FC<MapContainerProps> = ({
  initialCenter = [51.505, -0.09], // Default to London
  initialZoom = 13,
  objects = [],
  visibleTypes = new Set(Object.values(ObjectType)),
  onObjectClick,
  selectedObject,
  shouldResetView = true,
  onMapInteraction
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const [objectPositions, setObjectPositions] = useState<Map<string, [number, number]>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  // Fetch the latest positions for each object
  useEffect(() => {
    const fetchPositions = async () => {
      const positions = new Map<string, [number, number]>();
      
      for (const object of objects) {
        try {
          // Get the sensor data for this object
          const sensorData = await api.trackedObjects.getObjectSensorData(object.id);
          
          if (sensorData && sensorData.length > 0) {
            // Get the latest sensor data (assuming the API returns them sorted by timestamp)
            const latestData = sensorData[0];
            if (latestData.latitude && latestData.longitude) {
              positions.set(object.id, [latestData.latitude, latestData.longitude]);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch position for object ${object.id}:`, error);
        }
      }
      
      setObjectPositions(positions);
    };
    
    if (mapLoaded) {
      fetchPositions();
    }
  }, [objects, mapLoaded]);

  // Fix for Leaflet icon issue in Next.js
  useEffect(() => {
    // Only run this when window is defined (client-side)
    if (typeof window !== 'undefined') {
      // This is needed to make Leaflet icons work with webpack
      // delete (L.Icon.Default.prototype as any)._getIconUrl;
    
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });
      
      // Indicate that the map is loaded and ready for data fetching
      setMapLoaded(true);
    }
  }, []);

  // Filter objects by visible types
  const visibleObjects = objects.filter(obj => visibleTypes.has(obj.type));

  if (typeof window === 'undefined') {
    return <div className={styles.mapContainer}>Loading map...</div>;
  }

  return (
    <div className={styles.mapContainer}>
      <LeafletMapContainer 
        center={initialCenter} 
        zoom={initialZoom} 
        className={styles.map}
        ref={mapRef}
      >
        <MapController 
          center={initialCenter} 
          selectedObject={selectedObject || null} 
          latestPositions={objectPositions}
          shouldResetView={shouldResetView}
        />
        
        {onMapInteraction && <MapInteractionDetector onMapInteraction={onMapInteraction} />}
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {mapLoaded && visibleObjects.map(object => {
          const position = objectPositions.get(object.id);
          
          if (position) {
            const isSelected = selectedObject && selectedObject.id === object.id;
            
            return (
              <Marker 
                key={object.id} 
                position={position}
                eventHandlers={{
                  click: () => onObjectClick && onObjectClick(object)
                }}
                icon={isSelected ? new L.Icon({
                  iconUrl: '/leaflet/marker-icon.png',
                  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowUrl: '/leaflet/marker-shadow.png',
                  shadowSize: [41, 41],
                  className: 'selected-marker'
                }) : new L.Icon.Default()}
              >
                <Popup>
                  <div>
                    <h3 className={styles.popupTitle}>
                      {object.name || `Object #${object.object_id.slice(0, 8)}`}
                    </h3>
                    <p className={styles.popupType}>Type: {object.type}</p>
                    {object.additional_info && object.additional_info.description && (
                      <p className={styles.popupDescription}>{object.additional_info.description}</p>
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