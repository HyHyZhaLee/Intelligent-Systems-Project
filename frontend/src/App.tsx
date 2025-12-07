import React, { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import EndUserUpload from './components/EndUserUpload';
import DataScientistDashboard from './components/DataScientistDashboard';
import EnterprisePortal from './components/EnterprisePortal';
import { Toaster } from './components/ui/sonner';

export type UserRole = 'guest' | 'data-scientist' | 'enterprise' | null;

export interface User {
  email: string;
  role: UserRole;
  name: string;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'upload' | 'dashboard' | 'portal'>('welcome');
  const [user, setUser] = useState<User | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    if (role === 'guest') {
      setUser({ email: 'guest', role: 'guest', name: 'Guest User' });
      setCurrentScreen('upload');
    }
  };

  const handleLogin = (email: string, password: string, role: UserRole) => {
    // Mock login logic based on selected role
    if (role === 'data-scientist') {
      setUser({ email, role: 'data-scientist', name: 'ML Engineer' });
      setCurrentScreen('dashboard');
    } else if (role === 'enterprise') {
      setUser({ email, role: 'enterprise', name: 'Admin User' });
      setCurrentScreen('portal');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('welcome');
  };

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

export default App;
