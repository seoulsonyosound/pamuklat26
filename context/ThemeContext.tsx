'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    // Read saved theme preference from localStorage on mount
    const savedTheme = localStorage.getItem('ssite_theme');
    const isDark = savedTheme !== 'light'; // default to dark mode

    setIsDarkMode(isDark);
    applyTheme(isDark);
    setMounted(true);
  }, []);

  const applyTheme = (dark: boolean) => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  };

  const setTheme = (theme: 'dark' | 'light') => {
    const dark = theme === 'dark';
    setIsDarkMode(dark);
    localStorage.setItem('ssite_theme', theme);
    applyTheme(dark);
  };

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    const themeStr = nextDark ? 'dark' : 'light';
    localStorage.setItem('ssite_theme', themeStr);
    applyTheme(nextDark);
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        theme: isDarkMode ? 'dark' : 'light',
        toggleTheme,
        setTheme,
      }}
    >
      <div className="min-h-screen flex flex-col w-full">
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
