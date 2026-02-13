'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

const STORAGE_KEY = 'vowly_auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  // Load auth from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { user: storedUser, token: storedToken } = JSON.parse(stored);
        setUser(storedUser);
        setToken(storedToken);
        // Validate token
        validateToken(storedToken);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const validateToken = async (authToken) => {
    try {
      const response = await fetch(`${backendUrl}/api/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      if (!data.valid) {
        logout();
      } else if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Token validation failed:', error);
    }
  };

  const saveAuth = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData, token: authToken }));
  };

  const login = async (email, password, role) => {
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'Login failed');
    }

    saveAuth(data.user, data.token);
    return data;
  };

  const signup = async (email, password, name, role) => {
    const response = await fetch(`${backendUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'Signup failed');
    }

    saveAuth(data.user, data.token);
    return data;
  };

  const logout = useCallback(() => {
    if (token) {
      fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    router.push('/');
  }, [token, backendUrl, router]);

  const updateWeddingId = async (weddingId) => {
    if (!token) return;
    try {
      await fetch(`${backendUrl}/api/auth/update-wedding?wedding_id=${weddingId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setUser(prev => prev ? { ...prev, weddingId } : null);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.user.weddingId = weddingId;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('Failed to update wedding ID:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isOrganizer: user?.role === 'organizer',
    isGuest: user?.role === 'guest',
    login,
    signup,
    logout,
    updateWeddingId,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Route protection hook
export function useRequireAuth(requiredRole) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      // Redirect to appropriate auth page
      if (requiredRole === 'organizer') {
        router.push('/auth/organizer');
      } else if (requiredRole === 'guest') {
        router.push('/auth/guest');
      } else {
        router.push('/');
      }
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      // Wrong role - redirect to correct dashboard
      if (user?.role === 'organizer') {
        router.push('/dashboard');
      } else if (user?.role === 'guest') {
        router.push('/guestdashboard');
      } else {
        router.push('/');
      }
    }
  }, [loading, isAuthenticated, user, requiredRole, router, pathname]);

  return { user, loading, isAuthenticated };
}
