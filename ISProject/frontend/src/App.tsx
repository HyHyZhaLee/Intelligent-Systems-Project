import React, { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import EndUserUpload from './components/EndUserUpload';
import DataScientistDashboard from './components/DataScientistDashboard';
import EnterprisePortal from './components/EnterprisePortal';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';

export type UserRole = 'guest' | 'data-scientist' | 'enterprise' | null;

export interface User {
  email: string;
  role: UserRole;
  name: string;
}

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'upload' | 'dashboard' | 'portal'>('welcome');
  const [user, setUser] = useState<User | null>(null);
  const { isAuthenticated, user: authUser, logout: authLogout, isLoading } = useAuth();

  // Check if user is authenticated and redirect accordingly
  useEffect(() => {
    if (!isLoading && authUser) {
      // Map backend role to frontend role
      const role: UserRole = 
        authUser.role === 'data-scientist' || authUser.role === 'ml-engineer' 
          ? 'data-scientist' 
          : authUser.role === 'admin' 
          ? 'enterprise' 
          : 'guest';
      
      setUser({
        email: authUser.email,
        role,
        name: authUser.name,
      });

      // Redirect based on role
      if (role === 'data-scientist') {
        setCurrentScreen('dashboard');
      } else if (role === 'enterprise') {
        setCurrentScreen('portal');
      }
    } else if (!isLoading && !isAuthenticated && currentScreen !== 'welcome' && currentScreen !== 'upload') {
      // If not authenticated and not on welcome/upload, redirect to welcome
      setCurrentScreen('welcome');
      setUser(null);
    }
  }, [isAuthenticated, authUser, isLoading, currentScreen]);

  const handleRoleSelect = (role: UserRole) => {
    if (role === 'guest') {
      setUser({ email: 'guest', role: 'guest', name: 'Guest User' });
      setCurrentScreen('upload');
    }
  };

  const handleLogin = async (email: string, password: string, role: UserRole) => {
    // Login is handled by WelcomeScreen via AuthContext
    // This function is called after successful login
    if (role === 'data-scientist') {
      setCurrentScreen('dashboard');
    } else if (role === 'enterprise') {
      setCurrentScreen('portal');
    }
  };

  const handleLogout = async () => {
    await authLogout();
    setUser(null);
    setCurrentScreen('welcome');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {currentScreen === 'welcome' && (
        <WelcomeScreen
          onRoleSelect={handleRoleSelect}
          onLogin={handleLogin}
        />
      )}
      {currentScreen === 'upload' && (
        <EndUserUpload
          onBack={handleLogout}
        />
      )}
      {currentScreen === 'dashboard' && user && (
        <DataScientistDashboard
          user={user}
          onLogout={handleLogout}
        />
      )}
      {currentScreen === 'portal' && user && (
        <EnterprisePortal
          user={user}
          onLogout={handleLogout}
        />
      )}
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
