'use client';

import React, { useState, useEffect } from 'react';
import styles from './ObjectTypeForm.module.css';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CustomObjectType, CustomObjectTypeCreate, IconOption, ColorOption } from '@/types';
import api from '@/services/api';
import { FiX, FiCheck, FiInfo } from 'react-icons/fi';
import IconRenderer from '@/components/ui/IconRenderer';

interface ObjectTypeFormProps {
  onClose: () => void;
  onSuccess: () => void;
  objectType: CustomObjectType | null;
  availableIcons: IconOption[];
  availableColors: ColorOption[];
}

const ObjectTypeForm: React.FC<ObjectTypeFormProps> = ({
  onClose,
  onSuccess,
  objectType,
  availableIcons,
  availableColors
}) => {
  const [formData, setFormData] = useState<CustomObjectTypeCreate>({
    name: '',
    display_name: '',
    description: '',
    icon: 'FiTag',
    color: '#1890ff',
    is_active: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!objectType;

  useEffect(() => {
    if (objectType) {
      setFormData({
        name: objectType.name,
        display_name: objectType.display_name,
        description: objectType.description || '',
        icon: objectType.icon,
        color: objectType.color,
        is_active: objectType.is_active
      });
    }
  }, [objectType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleIconSelect = (iconValue: string) => {
    setFormData((prev) => ({ ...prev, icon: iconValue }));
  };

  const handleColorSelect = (colorValue: string) => {
    setFormData((prev) => ({ ...prev, color: colorValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    // Validate name format
    const nameValue = formData.name.trim().toLowerCase();
    if (!nameValue) {
      setError('Type ID is required');
      setIsSubmitting(false);
      return;
    }
    
    // Update name to be lowercase and trimmed
    const updatedData = {
      ...formData,
      name: nameValue
    };
    
    try {
      if (isEditing && objectType) {
        // Update existing object type
        const updateData = {
          display_name: updatedData.display_name,
          description: updatedData.description || undefined,
          icon: updatedData.icon,
          color: updatedData.color,
          is_active: updatedData.is_active
        };
        
        await api.objectTypes.updateType(objectType.id, updateData);
      } else {
        // Create new object type
        await api.objectTypes.createType(updatedData);
      }
      
      onSuccess();
    } catch (err: any) {
      console.error('Failed to save object type:', err);
      setError(err.message || 'Failed to save object type. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="md">
      <div className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            {isEditing ? 'Edit Object Type' : 'Add Object Type'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        {error && (
          <div className={styles.errorMessage}>
            <FiInfo className={styles.errorIcon} />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>Type ID</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={styles.input}
              disabled={isEditing}
              required
              placeholder="e.g. ship, car, drone"
            />
            {isEditing ? (
              <div className={styles.helpText}>Type ID cannot be changed after creation.</div>
            ) : (
              <div className={styles.helpText}>Enter a lowercase identifier for this type (e.g. "ship", "car", "drone").</div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="display_name" className={styles.label}>Display Name</label>
            <input
              type="text"
              id="display_name"
              name="display_name"
              value={formData.display_name}
              onChange={handleInputChange}
              className={styles.input}
              required
              placeholder="e.g. Military Ship"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={styles.textarea}
              rows={3}
              placeholder="Enter a description of this object type"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Icon</label>
            <div className={styles.iconGrid}>
              {availableIcons.map((icon) => (
                <div 
                  key={icon.name} 
                  className={`${styles.iconOption} ${formData.icon === icon.value ? styles.selected : ''}`}
                  onClick={() => handleIconSelect(icon.value)}
                  title={icon.displayName}
                >
                  <div className={styles.iconOptionIcon}>
                    <IconRenderer iconName={icon.value} />
                  </div>
                  <span className={styles.iconOptionLabel}>{icon.displayName}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Color</label>
            <div className={styles.colorGrid}>
              {availableColors.map((color) => (
                <div 
                  key={color.name} 
                  className={`${styles.colorOption} ${formData.color === color.value ? styles.selected : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleColorSelect(color.value)}
                  title={color.displayName}
                />
              ))}
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <div className={styles.checkboxContainer}>
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleCheckboxChange}
                className={styles.checkbox}
              />
              <label htmlFor="is_active" className={styles.checkboxLabel}>
                Active (available for new objects)
              </label>
            </div>
          </div>
          
          <div className={styles.iconPreview}>
            <div 
              className={styles.previewIcon} 
              style={{ backgroundColor: formData.color }}
            >
              <IconRenderer iconName={formData.icon} size={24} color="#fff" />
            </div>
            <span className={styles.previewLabel}>{formData.display_name || 'Preview'}</span>
          </div>
          
          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ObjectTypeForm; 