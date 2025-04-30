'use client';

import React from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  className = ''
}) => {
  const badgeClass = `badge badge-${variant} ${className}`;
  
  return (
    <span className={badgeClass}>
      {children}
    </span>
  );
};

export default Badge; 