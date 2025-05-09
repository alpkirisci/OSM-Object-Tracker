import React from 'react';
import IconRenderer from '@/components/ui/IconRenderer';

/**
 * Get an icon component by name
 * 
 * @param iconName The name of the icon to render (e.g., "FiMap")
 * @param size Optional size for the icon
 * @param color Optional color for the icon
 */
export const getIconComponent = (iconName: string, size?: number, color?: string) => {
  return <IconRenderer iconName={iconName} size={size} color={color} />;
};

/**
 * Get an icon component by object type
 * 
 * @param objectType The type of object to get an icon for
 * @param size Optional size for the icon
 * @param color Optional color for the icon
 */
export const getIconForObjectType = (objectType: string, size?: number, color?: string) => {
  let iconName = 'FiTag'; // Default icon

  // Map object types to appropriate icons
  switch (objectType.toLowerCase()) {
    case 'ship':
      iconName = 'FiAnchor';
      break;
    case 'car':
      iconName = 'FiTruck';
      break;
    case 'airplane':
      iconName = 'FiSend';
      break;
    case 'drone':
      iconName = 'FiRadio';
      break;
    case 'truck':
      iconName = 'FiPackage';
      break;
    case 'navigation':
      iconName = 'FiNavigation';
      break;
    case 'person':
      iconName = 'FiUser';
      break;
    default:
      iconName = 'FiTag';
  }

  return <IconRenderer iconName={iconName} size={size} color={color} />;
}; 