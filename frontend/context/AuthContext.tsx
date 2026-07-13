'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '@/types';
import { saveAuth, clearAuth, getUser, getToken, isAuthenticated, isAdmin } from '@/lib/auth';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isAdminUser: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getUser());
      setToken(getToken());
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    const userData: User = {
      id: data.id,
      username: data.username,
      email: data.email,
      role: data.role,
    };
    saveAuth(data.token, userData);
    setUser(userData);
    setToken(data.token);
    router.push('/clients');
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoggedIn: !!user,
      isAdminUser: user?.role === 'ADMIN',
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
