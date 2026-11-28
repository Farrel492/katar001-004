import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminMe, logoutAdmin, type AdminUser } from '@/lib/api';

export interface AdminAuthContextType {
  currentUser: AdminUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
      const user = await getAdminMe();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
      navigate('/loginadminkatar', { replace: true });
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    try {
      await logoutAdmin();
    } catch {
      // Abaikan error saat keluar
    } finally {
      setCurrentUser(null);
      navigate('/loginadminkatar', { replace: true });
    }
  };

  return (
    <AdminAuthContext.Provider value={{ currentUser, isLoading, logout, refreshUser: fetchUser }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
