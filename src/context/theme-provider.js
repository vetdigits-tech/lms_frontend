// File: src/context/theme-provider.jsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  // On initial load, adopt saved preference or system preference
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const startDark =
      saved === 'dark' ||
      (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);

    setIsDark(startDark);
  }, []);

  // Toggle sidebar-only dark mode (no global class toggle)
  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
