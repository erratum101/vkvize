'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { clearProfile, getStoredProfile, LocalProfile, saveProfile } from './local-profile';

interface AuthContextType {
  user: LocalProfile | null;
  loading: boolean;
  login: (name: string) => Promise<void>;
  register: (data: { name: string; avatarUrl?: string | null }) => Promise<void>;
  setProfile: (profile: Omit<LocalProfile, 'id'> & { id?: string }) => LocalProfile;
  logout: () => void;
  isOrganizer: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredProfile());
    setLoading(false);

    const onProfileUpdated = () => setUser(getStoredProfile());
    window.addEventListener('vkvize:profile-updated', onProfileUpdated);
    window.addEventListener('storage', onProfileUpdated);
    return () => {
      window.removeEventListener('vkvize:profile-updated', onProfileUpdated);
      window.removeEventListener('storage', onProfileUpdated);
    };
  }, []);

  const setProfile = (profile: Omit<LocalProfile, 'id'> & { id?: string }) => {
    const next = saveProfile(profile);
    setUser(next);
    return next;
  };

  const login = async (name: string) => {
    setProfile({ name, avatarUrl: null });
  };

  const register = async (data: { name: string; avatarUrl?: string | null }) => {
    setProfile(data);
  };

  const logout = () => {
    clearProfile();
    setUser(null);
  };

  const isOrganizer = Boolean(user);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, setProfile, logout, isOrganizer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
