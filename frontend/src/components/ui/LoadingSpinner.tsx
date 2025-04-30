import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: styles.spinnerSmall,
    md: styles.spinnerMedium,
    lg: styles.spinnerLarge,
  };

  return (
    <div className={`${styles.spinner} ${sizeClasses[size]} ${className}`}>
      <span className={styles.srOnly}>Loading...</span>
    </div>
  );
};

export default LoadingSpinner;