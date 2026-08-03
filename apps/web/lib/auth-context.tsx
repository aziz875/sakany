'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, UserRole, AuthResponse } from '@sakany/shared';
import { getAuthToken, getAuthUser, saveAuthSession, clearAuthSession, getRefreshToken } from './auth';
import { apiFetch } from './api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: AuthResponse) => void;
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  refreshUser: () => void;
  isStudent: boolean;
  isLandlord: boolean;
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
  isStudent: false,
  isLandlord: false,
  isVerified: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hydrate from localStorage on mount
    const storedUser = getAuthUser();
    const storedToken = getAuthToken();
    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = useCallback((data: AuthResponse) => {
    saveAuthSession(data);
    setUser(data.user);
    setToken(data.accessToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {});
      }
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
        isStudent: user?.role === UserRole.STUDENT,
        isLandlord: user?.role === UserRole.LANDLORD,
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