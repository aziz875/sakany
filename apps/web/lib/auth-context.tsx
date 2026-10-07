'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, UserRole, AuthResponse } from '@sakany/shared';
import { getAuthToken, getAuthUser, saveAuthSession, clearAuthSession, updateStoredUser } from './auth';
import { apiFetch, refreshAuthSession } from './api';
import { syncFavoritesToServer } from './favorites';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: AuthResponse) => void;
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  refreshUser: () => void;
  updateUser: (user: User) => void;
  isStudent: boolean;
  isLandlord: boolean;
  isAdmin: boolean;
  isVerified: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  logoutAllDevices: async () => {},
  refreshUser: () => {},
  updateUser: () => {},
  isStudent: false,
  isLandlord: false,
  isAdmin: false,
  isVerified: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeAuth() {
      const storedUser = getAuthUser();
      const storedToken = getAuthToken();
      if (storedUser) setUser(storedUser);
      if (storedToken) setToken(storedToken);

      // Only hit /auth/refresh when a storedUser exists but no token, or on initial load to ensure token is valid.
      // A 401 here is normal after DB resets or expired sessions.
      if (storedUser) {
        const refreshed = await refreshAuthSession();
        if (refreshed) {
          setToken(getAuthToken());
        } else {
          clearAuthSession();
          setUser(null);
          setToken(null);
        }
      } else if (!storedToken) {
        clearAuthSession();
        setUser(null);
        setToken(null);
      }

      setLoading(false);
    }

    initializeAuth();
  }, []);

  const login = useCallback((data: AuthResponse) => {
    saveAuthSession(data);
    setUser(data.user);
    setToken(data.accessToken);
    
    // Sync local favorites to server asynchronously
    syncFavoritesToServer(data.accessToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
      }).catch(() => {});
    } finally {
      clearAuthSession();
      setUser(null);
      setToken(null);
    }
  }, []);

  const logoutAllDevices = useCallback(async () => {
    try {
      await apiFetch('/auth/logout-all', {
        method: 'POST',
      }).catch(() => {});
    } finally {
      clearAuthSession();
      setUser(null);
      setToken(null);
    }
  }, []);

  const refreshUser = useCallback(() => {
    const storedUser = getAuthUser();
    const storedToken = getAuthToken();
    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
    } else {
      setUser(null);
      setToken(null);
    }
  }, []);

  const updateUser = useCallback((updated: User) => {
    updateStoredUser(updated);
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        logoutAllDevices,
        refreshUser,
        updateUser,
        isStudent: user?.role === UserRole.STUDENT,
        isLandlord: user?.role === UserRole.LANDLORD,
        isAdmin: user?.role === UserRole.ADMIN,
        isVerified: user?.schoolVerified ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}