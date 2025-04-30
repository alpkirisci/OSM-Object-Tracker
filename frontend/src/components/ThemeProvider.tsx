'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);
  
  // Get and set the initial theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
    
    setMounted(true);
  }, []);

  // Handle theme changes
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update document classes for theme
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.style.colorScheme = 'light';
    }
  };

  // Apply theme class when theme changes
  useEffect(() => {
    if (mounted) {
      handleThemeChange(theme);
    }
  }, [theme, mounted]);

  // Avoid theme flash by hiding content until mounted
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleThemeChange }}>
      {children}
    </ThemeContext.Provider>
  );
} 