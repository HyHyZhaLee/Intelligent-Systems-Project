import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, getAuthToken, removeAuthToken } from '../services/api';
import type { UserInfo, LoginRequest } from '../types/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          if (response.success) {
            setUser(response.data);
          } else {
            removeAuthToken();
          }
        } catch (error) {
          console.error('Failed to get current user:', error);
          removeAuthToken();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(email, password);
      if (response.success) {
        setUser(response.data.user);
        toast.success('Login successful');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      removeAuthToken();
      toast.success('Logged out successfully');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.success) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
      removeAuthToken();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
