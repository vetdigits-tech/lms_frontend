// File: src/app/client-layout.jsx
'use client';

import { usePathname } from 'next/navigation';
import { useMemo, useEffect } from 'react';
import { ThemeProvider } from '@/context/theme-provider';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  // Determine if we should apply the themed dark mode layouts
  const showTheme = useMemo(
    () =>
      pathname?.startsWith('/dashboard') ||
      pathname?.startsWith('/admin') ||
      pathname?.startsWith('/courses'),
    [pathname]
  );

  // Remove dark class if not in a themed route
  useEffect(() => {
    if (!showTheme) {
      document.documentElement.classList.remove('dark');
    }
  }, [showTheme]);

  // Wrap children with AuthProvider and Toaster
  const content = (
    <AuthProvider>
      <Toaster position="top-right" />
      {children}
    </AuthProvider>
  );

  // Conditionally wrap with ThemeProvider for dark mode support
  return showTheme ? <ThemeProvider>{content}</ThemeProvider> : content;
}
