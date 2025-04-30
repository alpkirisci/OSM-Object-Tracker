'use client';

import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  elevated = false
}) => {
  const cardClass = elevated ? 'card-elevated' : 'card';
  
  return (
    <div className={`${cardClass} ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`card-header ${className}`}>
    {children}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`card-content ${className}`}>
    {children}
  </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`card-footer ${className}`}>
    {children}
  </div>
);

export default Card; 