'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  size = 'md', 
  children 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle click outside of modal content
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Handle ESC key
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
      // Prevent scroll on body when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
      // Restore scroll on body
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Client-side only code using createPortal
  if (typeof window !== 'undefined') {
    return createPortal(
      <div className={styles.modalOverlay}>
        <div 
          className={`${styles.modalContainer} ${styles[`size${size.toUpperCase()}`]}`}
          ref={modalRef}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>,
      document.body
    );
  }

  return null;
};

export default Modal; 