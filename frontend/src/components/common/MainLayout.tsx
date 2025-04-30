'use client';

import React from 'react';
import Header from './Header';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>&copy; {new Date().getFullYear()} OSM Tracker</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout; 