'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import MainLayout from '@/components/common/MainLayout';
import Card, { CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { CustomObjectType, IconOption, ColorOption } from '@/types';
import api from '@/services/api';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiEye, FiEyeOff, FiAlertCircle, FiImage, FiPackage } from 'react-icons/fi';
import Link from 'next/link';
import ObjectTypeForm from './components/ObjectTypeForm';
import TypeFilter from './components/TypeFilter';
import { getIconComponent as renderIcon } from '@/utils/iconUtils';

export default function ObjectTypesAdminPage() {
  const [objectTypes, setObjectTypes] = useState<CustomObjectType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<CustomObjectType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<CustomObjectType | null>(null);
  const [availableIcons, setAvailableIcons] = useState<IconOption[]>([]);
  const [availableColors, setAvailableColors] = useState<ColorOption[]>([]);
  const [filters, setFilters] = useState({ search: '', showInactive: false });

  const fetchObjectTypes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Initialize types if there are none yet
      const types = await api.objectTypes.getTypes();
      if (types.length === 0) {
        await api.objectTypes.initializeDefaultTypes();
        const initializedTypes = await api.objectTypes.getTypes();
        setObjectTypes(initializedTypes);
        applyFilters(initializedTypes, filters);
      } else {
        setObjectTypes(types);
        applyFilters(types, filters);
      }
    } catch (err) {
      console.error('Failed to load object types:', err);
      setError('Failed to load object types. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIconsAndColors = async () => {
    try {
      const [icons, colors] = await Promise.all([
        api.objectTypes.getAvailableIcons(),
        api.objectTypes.getAvailableColors()
      ]);
      setAvailableIcons(icons);
      setAvailableColors(colors);
    } catch (err) {
      console.error('Failed to load icons and colors:', err);
      setError('Failed to load icons and colors. Some options may be unavailable.');
    }
  };

  useEffect(() => {
    fetchObjectTypes();
    fetchIconsAndColors();
  }, []);

  const handleAddType = () => {
    setEditingType(null);
    setIsFormOpen(true);
  };

  const handleEditType = (type: CustomObjectType) => {
    setEditingType(type);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingType(null);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingType(null);
    fetchObjectTypes();
  };

  const handleToggleActive = async (type: CustomObjectType) => {
    try {
      await api.objectTypes.updateType(type.id, {
        is_active: !type.is_active
      });
      fetchObjectTypes();
    } catch (err) {
      console.error('Failed to toggle object type status:', err);
      setError('Failed to update object type status. Please try again.');
    }
  };

  const handleDeleteType = async (typeId: string) => {
    if (!window.confirm('Are you sure you want to delete this object type? Objects using this type will not be affected, but the type will no longer be available for new objects.')) {
      return;
    }
    
    try {
      await api.objectTypes.deleteType(typeId);
      fetchObjectTypes();
    } catch (err) {
      console.error('Failed to delete object type:', err);
      setError('Failed to delete object type. Please try again.');
    }
  };

  const applyFilters = (types: CustomObjectType[], currentFilters: { search: string; showInactive: boolean }) => {
    let filtered = [...types];
    
    // Apply inactive filter
    if (!currentFilters.showInactive) {
      filtered = filtered.filter(type => type.is_active);
    }
    
    // Apply search filter
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      filtered = filtered.filter(type => 
        type.name.toLowerCase().includes(searchTerm) || 
        type.display_name.toLowerCase().includes(searchTerm) ||
        (type.description && type.description.toLowerCase().includes(searchTerm))
      );
    }
    
    setFilteredTypes(filtered);
  };

  const handleFilterChange = (newFilters: { search: string; showInactive: boolean }) => {
    setFilters(newFilters);
    applyFilters(objectTypes, newFilters);
  };

  // Helper function to get icon component
  const getIconComponent = (iconName: string) => {
    // Make sure we're returning the actual icon component, not text
    return renderIcon(iconName, 24, "#fff");
  };

  return (
    <MainLayout>
      <div className={styles.adminPageContainer}>
        <div className={styles.pageHeader}>
          <div className={styles.headerTitleSection}>
            <Link href="/admin">
              <Button variant="ghost" className={styles.backButton}>
                <FiArrowLeft />
                <span>Back to Admin</span>
              </Button>
            </Link>
            <h1 className={styles.pageTitle}>Object Type Management</h1>
          </div>
          <Button 
            onClick={handleAddType}
            variant="primary"
          >
            <FiPlus />
            <span>Add Object Type</span>
          </Button>
        </div>
        
        {error && (
          <div className={styles.errorMessage}>
            <FiAlertCircle className={styles.errorIcon} />
            <span>{error}</span>
          </div>
        )}
        
        <TypeFilter onFilter={handleFilterChange} />
        
        <section className={styles.typesSection}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading object types...</p>
            </div>
          ) : filteredTypes.length > 0 ? (
            <table className={styles.typesList}>
              <thead className={styles.typesListHeader}>
                <tr>
                  <th className={styles.typesListHeaderCell} style={{ width: "60px" }}>
                    <FiPackage className={styles.headerIconSvg} title="Icon" />
                  </th>
                  <th className={styles.typesListHeaderCell}>Name</th>
                  <th className={styles.typesListHeaderCell}>Description</th>
                  <th className={styles.typesListHeaderCell}>Color</th>
                  <th className={styles.typesListHeaderCell}>Status</th>
                  <th className={styles.typesListHeaderCell} style={{ width: "180px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTypes.map(type => (
                  <tr key={type.id} className={styles.typeRow}>
                    <td className={`${styles.typeCell} ${styles.typeIconCell}`} data-label="Icon">
                      <div 
                        className={styles.iconBox} 
                        style={{ backgroundColor: type.color }}
                      >
                        {getIconComponent(type.icon)}
                      </div>
                    </td>
                    <td className={`${styles.typeCell} ${styles.typeNameCell}`} data-label="Name">
                      <div>
                        <h3 className={styles.typeName}>{type.display_name}</h3>
                        <span className={styles.typeKey}>{type.name}</span>
                      </div>
                    </td>
                    <td className={styles.typeCell} data-label="Description">
                      <div className={styles.typeDescription}>
                        {type.description || <span className={styles.noDescription}>No description</span>}
                      </div>
                    </td>
                    <td className={styles.typeCell} data-label="Color">
                      <div 
                        className={styles.colorSwatch} 
                        style={{ backgroundColor: type.color }}
                        title={type.color}
                      ></div>
                    </td>
                    <td className={styles.typeCell} data-label="Status">
                      <Badge variant={type.is_active ? 'success' : 'secondary'}>
                        {type.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className={styles.typeCell} data-label="Actions">
                      <div className={styles.typeActions}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(type)}
                          className={styles.actionButton}
                          title={type.is_active ? "Deactivate" : "Activate"}
                        >
                          {type.is_active ? <FiEyeOff className={styles.actionIcon} /> : <FiEye className={styles.actionIcon} />}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditType(type)}
                          className={styles.actionButton}
                          title="Edit"
                        >
                          <FiEdit2 className={styles.actionIcon} />
                        </Button>
                        
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteType(type.id)}
                          className={styles.actionButton}
                          title="Delete"
                        >
                          <FiTrash2 className={styles.actionIcon} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              {objectTypes.length > 0 ? (
                <p>No object types match your filters. Try adjusting your search criteria.</p>
              ) : (
                <p>No object types found. Create an object type to categorize tracked objects.</p>
              )}
              <Button 
                variant="primary" 
                onClick={handleAddType}
              >
                <FiPlus />
                <span>Add Object Type</span>
              </Button>
            </div>
          )}
        </section>
      </div>
      
      {isFormOpen && (
        <ObjectTypeForm
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
          objectType={editingType}
          availableIcons={availableIcons}
          availableColors={availableColors}
        />
      )}
    </MainLayout>
  );
} 