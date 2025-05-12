'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapContainer.module.css';
import { TrackedObject, ObjectType, SensorData } from '@/types';
import api from '@/services/api';
import ReactDOMServer from 'react-dom/server';
import * as FiIcons from 'react-icons/fi';
import { FiClock, FiEye, FiEyeOff } from 'react-icons/fi';

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

// Create a custom Leaflet icon using React Feather icons
const createIconFromReactComponent = (
  iconName: string, 
  iconColor: string = '#2563EB',
  size: number = 30, 
  isSelected: boolean = false
) => {
  // Handle case when icon name is not found
  // @ts-ignore - dynamically accessing icons
  const IconComponent = FiIcons[iconName] || FiIcons.FiMapPin;
  
  // Enhanced selection styling
  const circleSize = isSelected ? size * 1.5 : size;
  const padding = isSelected ? '8px' : '0';
  
  // Render the React component to HTML
  const iconHtml = ReactDOMServer.renderToString(
    <div style={{ 
      color: iconColor,
      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'transparent', 
      padding: padding,
      borderRadius: '50%',
      boxShadow: isSelected ? `0 0 0 3px ${iconColor}` : 'none',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: circleSize,
      height: circleSize
    }}>
      <IconComponent size={size} stroke={iconColor} strokeWidth={isSelected ? 3 : 2} />
    </div>
  );
  
  // Create the Leaflet icon
  return L.divIcon({
    html: iconHtml,
    className: 'react-icon-marker',
    iconSize: [circleSize, circleSize],
    iconAnchor: [circleSize/2, circleSize/2],
    popupAnchor: [0, -circleSize/2]
  });
};

// Map object types to icon names from react-icons/fi
const getIconNameForObjectType = (objectType: string, customType?: TrackedObject['custom_type']): string => {
  // If custom type is provided and has an icon, use it
  if (customType?.icon) {
    return customType.icon;
  }

  const iconMapping: Record<string, string> = {
    [ObjectType.SHIP]: 'FiAnchor',
    [ObjectType.CAR]: 'FiTruck',
    [ObjectType.AIRPLANE]: 'FiSend',
    [ObjectType.DRONE]: 'FiRadio',
    [ObjectType.OTHER]: 'FiTarget',
    // Add other mappings as needed
  };
  
  return iconMapping[objectType] || 'FiMapPin';
};

// Get color for object type
const getColorForObjectType = (objectType: string, customType?: TrackedObject['custom_type']): string => {
  // If custom type is provided and has a color, use it
  if (customType?.color) {
    return customType.color;
  }

  const colorMapping: Record<string, string> = {
    [ObjectType.SHIP]: '#3B82F6',     // Blue
    [ObjectType.CAR]: '#10B981',      // Green
    [ObjectType.AIRPLANE]: '#F59E0B', // Amber
    [ObjectType.DRONE]: '#6366F1',    // Indigo
    [ObjectType.OTHER]: '#8B5CF6',    // Violet
    // Add other mappings as needed
  };
  
  return colorMapping[objectType] || '#2563EB'; // Default blue
};

// Time range options in minutes (logarithmic scale with longer periods)
const timeRangeOptions = [
  { value: 5, label: '5m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1h' },
  { value: 360, label: '6h' },
  { value: 720, label: '12h' },
  { value: 1440, label: '1d' },
  { value: 14400, label: '10d' },
  { value: 43200, label: '1m' },
  { value: 259200, label: '6m' },
  { value: 525600, label: '1y' },
  { value: 2628000, label: '5y' }
];

// Helper component to display path on the map
const ObjectPath: React.FC<{ 
  positions: [number, number][]; 
  color: string;
}> = ({ positions, color }) => {
  if (!positions || positions.length < 2) return null;
  
  return (
    <Polyline
      positions={positions}
      pathOptions={{ 
        color, 
        weight: 3, 
        opacity: 0.7,
        lineCap: 'round',
        lineJoin: 'round'
      }}
    />
  );
};

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
  const [showPath, setShowPath] = useState(false);
  const [timeRange, setTimeRange] = useState(60); // Default to 1 hour
  const [pathPositions, setPathPositions] = useState<[number, number][]>([]);
  const [historicalData, setHistoricalData] = useState<SensorData[]>([]);

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

  // Fetch the historical path data when needed
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!showPath || !selectedObject) return;
      
      try {
        const data = await api.trackedObjects.getObjectSensorDataWithTimeLimit(
          selectedObject.id, 
          timeRange
        );
        
        // Sort by timestamp (oldest first to draw the path correctly)
        const sortedData = [...data].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        setHistoricalData(sortedData);
        
        // Sample data for very long time periods to avoid performance issues
        let positions: [number, number][] = [];
        
        if (timeRange > 43200 && sortedData.length > 1000) {
          // For long periods (more than a month), sample the data
          const sampleInterval = Math.ceil(sortedData.length / 1000);
          positions = sortedData
            .filter((_, i) => i % sampleInterval === 0 || i === sortedData.length - 1)
            .filter(point => point.latitude && point.longitude)
            .map(point => [point.latitude, point.longitude] as [number, number]);
        } else {
          // For regular time periods, use all data points
          positions = sortedData
            .filter(point => point.latitude && point.longitude)
            .map(point => [point.latitude, point.longitude] as [number, number]);
        }
        
        setPathPositions(positions);
      } catch (error) {
        console.error('Failed to fetch historical data:', error);
        setPathPositions([]);
      }
    };
    
    fetchHistoricalData();
  }, [selectedObject, showPath, timeRange]);

  // Fix for Leaflet icon issue in Next.js
  useEffect(() => {
    // Only run this when window is defined (client-side)
    if (typeof window !== 'undefined') {
      // Default icon setup (fallback if custom icons fail)
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });
      
      // Indicate that the map is loaded and ready for data fetching
      setMapLoaded(true);
    }
  }, []);

  // Create custom icon based on object type
  const getCustomIcon = (object: TrackedObject, isSelected: boolean) => {
    const iconName = getIconNameForObjectType(object.type, object.custom_type);
    const iconColor = getColorForObjectType(object.type, object.custom_type);
    
    return createIconFromReactComponent(iconName, iconColor, 30, isSelected);
  };

  // Filter objects by visible types
  const visibleObjects = objects.filter(obj => visibleTypes.has(obj.type));

  // Toggle path visibility
  const handleTogglePath = useCallback(() => {
    setShowPath(prev => !prev);
  }, []);

  // Handle time range change
  const handleTimeRangeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setTimeRange(timeRangeOptions[value].value);
  }, []);

  // Format time display
  const formatTimeDisplay = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes === 60) {
      return '1 hour';
    } else if (minutes < 1440) {
      return `${minutes / 60} hours`;
    } else if (minutes === 1440) {
      return '1 day';
    } else if (minutes < 43200) { // Less than a month
      return `${Math.round(minutes / 1440)} days`;
    } else if (minutes < 525600) { // Less than a year
      return `${Math.round(minutes / 43200)} months`;
    } else {
      return `${Math.round(minutes / 525600)} years`;
    }
  };

  // Get color for selected object (for path)
  const getSelectedObjectColor = (): string => {
    if (!selectedObject) return '#2563EB'; // Default blue
    return getColorForObjectType(selectedObject.type, selectedObject.custom_type);
  };

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
        {/* CSS to style the React icon markers */}
        <style jsx global>{`
          .react-icon-marker {
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: transparent !important;
            transition: all 0.2s ease-in-out;
          }
        `}</style>
        
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
        
        {/* Draw the historical path if enabled */}
        {showPath && selectedObject && pathPositions.length > 1 && (
          <ObjectPath 
            positions={pathPositions} 
            color={getSelectedObjectColor()} 
          />
        )}
        
        {mapLoaded && visibleObjects.map(object => {
          const position = objectPositions.get(object.id);
          
          if (position) {
            const isSelected = selectedObject && selectedObject.id === object.id ? true : false;
            
            return (
              <Marker 
                key={object.id} 
                position={position}
                eventHandlers={{
                  click: () => {
                    // When marker is clicked:
                    // First check if it's not already selected
                    if (!isSelected) {
                      // 1. Center the map on this object with animation
                      if (mapRef.current) {
                        mapRef.current.flyTo(position, mapRef.current.getZoom(), {
                          animate: true,
                          duration: 0.5
                        });
                      }
                      
                      // 2. Call onObjectClick to select this object in the UI
                      // This will also scroll the object into view in the list
                      if (onObjectClick) {
                        onObjectClick(object);
                      }
                    }
                  }
                }}
                icon={getCustomIcon(object, isSelected)}
              >
                <Popup>
                  <div>
                    <h3>{object.name || object.object_id}</h3>
                    <p>Type: {object.type}</p>
                    <p>
                      Position: {position[0].toFixed(5)}, {position[1].toFixed(5)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          }
          
          return null;
        })}
      </LeafletMapContainer>
      
      {/* Path controls */}
      <div className={styles.pathControls}>
        <button 
          className={`${styles.showPathButton} ${showPath ? styles.active : ''}`} 
          onClick={handleTogglePath}
          disabled={!selectedObject}
        >
          {showPath ? <FiEyeOff size={14} /> : <FiEye size={14} />}
          {showPath ? 'Hide Path' : 'Show Path'}
        </button>
        
        <div className={`${styles.sliderContainer} ${showPath ? styles.active : ''}`}>
          <div className={styles.sliderValue}>
            <FiClock size={12} style={{ marginRight: '4px' }} />
            {formatTimeDisplay(timeRange)}
          </div>
          
          <input
            type="range"
            min="0"
            max={timeRangeOptions.length - 1}
            value={timeRangeOptions.findIndex(option => option.value === timeRange)}
            onChange={handleTimeRangeChange}
            className={styles.slider}
            disabled={!showPath}
          />
          
          <div className={styles.sliderLabels}>
            {timeRangeOptions.map(option => (
              <span key={option.value}>{option.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapContainer; 