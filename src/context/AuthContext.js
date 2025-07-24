'use client';

import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';

// Helper to read a named cookie
function getCookie(name) {
  const match = document.cookie.match(
    new RegExp('(^|; )' + name + '=([^;]+)')
  );
  return match ? decodeURIComponent(match[2]) : null;
}

const AuthContext = createContext({
  user: null,
  loading: true,
  logout: async () => {},
  fetchUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Memoized fetchUser to satisfy useEffect dependency
  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/sanctum/csrf-cookie`, {
        credentials: 'include',
      });

      const res = await fetch(`${API_URL}/api/user`, {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 401) {
        setUser(null);
        return;
      }

      if (!res.ok) {
        throw new Error('Not authenticated');
      }

      const data = await res.json();
      setUser(data);
    } catch (err) {
      if (err.message !== 'Not authenticated') {
        console.error('fetchUser error:', err.message);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Load user on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Logout logic
  const logout = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/sanctum/csrf-cookie`, {
        credentials: 'include',
      });

      await fetch(`${API_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
        },
      });
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
