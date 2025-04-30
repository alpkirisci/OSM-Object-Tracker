'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggle from '../ui/ThemeToggle';
import styles from './GlobalHeader.module.css';
import { useTheme } from '../ThemeProvider';

export default function GlobalHeader() {
  const pathname = usePathname();
  const { theme } = useTheme();
  
  // Check if we're on an edit-chapter page (keep this for compatibility)
  const isEditChapterPage = pathname?.includes('/edit-chapter/');
  
  return (
    <header className={`${styles.header} ${isEditChapterPage ? styles.editChapterHeader : ''}`}>
      <div className={styles.headerContent}>
        <div className={styles.userControls}>
          <ThemeToggle className={styles.themeToggle} />
        </div>
      </div>
    </header>
  );
} 