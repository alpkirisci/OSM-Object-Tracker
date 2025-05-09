'use client';

import React from 'react';
import styles from './TypeList.module.css';
import { ObjectType } from '@/types';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { getIconForObjectType } from '@/utils/iconUtils';

interface TypeListProps {
  objectTypes: string[];
  visibleTypes: Set<string>;
  onToggleType: (type: string) => void;
  typeCounts: Record<string, number>;
}

const TypeList: React.FC<TypeListProps> = ({
  objectTypes,
  visibleTypes,
  onToggleType,
  typeCounts
}) => {
  const getIconForType = (type: string) => {
    return getIconForObjectType(type);
  };

  const getTypeLabel = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Filter out types with no objects
  const typesWithObjects = objectTypes.filter(type => typeCounts[type] && typeCounts[type] > 0);

  return (
    <div className={styles.typeListContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>Object Types</h3>
      </div>

      <div className={styles.typeList}>
        {typesWithObjects.map((type) => (
          <div key={type} className={styles.typeCard}>
            <div className={styles.typeIcon}>
              {getIconForType(type)}
            </div>
            <div className={styles.typeInfo}>
              <div className={styles.typeName}>
                {getTypeLabel(type)}
              </div>
              <div className={styles.typeCount}>
                {typeCounts[type] || 0} objects
              </div>
            </div>
            <button
              className={`${styles.toggleButton} ${visibleTypes.has(type) ? styles.visible : styles.hidden}`}
              onClick={() => onToggleType(type)}
              aria-label={visibleTypes.has(type) ? `Hide ${type}` : `Show ${type}`}
            >
              {visibleTypes.has(type) ? <FiEye /> : <FiEyeOff />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TypeList; 