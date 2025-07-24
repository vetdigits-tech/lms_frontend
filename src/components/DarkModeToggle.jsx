'use client';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/theme-provider';

export default function DarkModeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className={`flex items-center gap-1 rounded px-2 py-1 text-sm font-medium
                  hover:bg-gray-200 dark:hover:bg-gray-700 ${className}`}
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4" /> Light
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" /> Dark
        </>
      )}
    </button>
  );
}
