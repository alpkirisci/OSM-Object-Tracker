'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './BackButton.module.css';

interface BackButtonProps {
  onClick?: () => void;
  destination?: string;
  className?: string;
}

export default function BackButton({ 
  onClick, 
  destination, 
  className = '' 
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (destination) {
      router.push(destination);
    } else {
      router.back();
    }
  };

  return (
    <div className={`${styles.backButtonContainer} ${className}`}>
      <button 
        onClick={handleClick}
        className={styles.backButton}
        aria-label="Go back"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={styles.backIcon}
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
} 