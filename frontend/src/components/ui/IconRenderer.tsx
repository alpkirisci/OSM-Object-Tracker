'use client';

import React from 'react';
import * as FeatherIcons from 'react-icons/fi';
import { FiBox } from 'react-icons/fi';

interface IconRendererProps {
  iconName: string;
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Renders a Feather icon dynamically based on the icon name
 * 
 * Example usage:
 * <IconRenderer iconName="FiMap" />
 * <IconRenderer iconName="FiUser" size={24} color="blue" />
 */
const IconRenderer: React.FC<IconRendererProps> = ({ 
  iconName, 
  className = '', 
  size, 
  color 
}) => {
  // Check if the iconName already has the "Fi" prefix, if not, add it
  const normalizedIconName = iconName.startsWith('Fi') ? iconName : `Fi${iconName.charAt(0).toUpperCase()}${iconName.slice(1)}`;
  
  // Check if the icon name is a valid Feather icon
  const IconComponent = FeatherIcons[normalizedIconName as keyof typeof FeatherIcons];
  
  if (!IconComponent) {
    console.warn(`Icon "${normalizedIconName}" not found in Feather icons.`);
    // Return a default icon instead of text
    return <FiBox className={className} size={size} color={color} />;
  }
  
  return <IconComponent className={className} size={size} color={color} />;
};

export default IconRenderer; 