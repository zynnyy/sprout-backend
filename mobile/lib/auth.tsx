import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { getToken, setToken, removeToken } from './api';
import { initPurchases, identifyUser, checkProStatus, logoutPurchases } from './revenuecat';

interface User {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync RevenueCat Pro status and update user state
  const syncProStatus = async (currentUser: User): Promise<User> => {
    const rcPro = await checkProStatus();
    // RC is source of truth for native; backend is fallback for web
    const isPro = rcPro || currentUser.isPro;
    return { ...currentUser, isPro };
  };

  useEffect(() => {
    (async () => {
      await initPurchases();
      const token = await getToken();
      if (token) {
        try {
          const { data } = await api.get('/api/auth/me');
          await identifyUser(data.id);
          const synced = await syncProStatus(data);
          setUser(synced);
        } catch {
          await removeToken();
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    await setToken(data.token);
    await identifyUser(data.user.id);
    const synced = await syncProStatus(data.user);
    setUser(synced);
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post('/api/auth/register', { name, email, password });
    await setToken(data.token);
    await identifyUser(data.user.id);
    const synced = await syncProStatus(data.user);
    setUser(synced);
  };

  const logout = async () => {
    await removeToken();
    await logoutPurchases();
    setUser(null);
  };

  const refreshProStatus = async () => {
    if (!user) return;
    const synced = await syncProStatus(user);
    setUser(synced);
    // Also sync to backend
    try {
      const { data } = await api.get('/api/auth/me');
      setUser({ ...synced, ...data, isPro: synced.isPro });
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
