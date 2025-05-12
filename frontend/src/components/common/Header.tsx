'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';
import { FiMenu, FiX, FiMap, FiList, FiSettings } from 'react-icons/fi';

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;
  
  const toggleMenu = () => setMenuOpen(!menuOpen);
  
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logo}>
            OSM Tracker
          </Link>
          
          <button 
            className={styles.menuButton} 
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
        
        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          <Link 
            href="/" 
            className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FiMap className={styles.navIcon} />
            <span>Map</span>
          </Link>
        
          
          <Link 
            href="/admin" 
            className={`${styles.navLink} ${isActive('/admin') ? styles.active : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FiSettings className={styles.navIcon} />
            <span>Admin</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header; 