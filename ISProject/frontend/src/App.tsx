import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WelcomeScreen from './components/WelcomeScreen';
import EndUserUpload from './components/EndUserUpload';
import DataScientistDashboard from './components/DataScientistDashboard';
import EnterprisePortal from './components/EnterprisePortal';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';

export type UserRole = 'guest' | 'data-scientist' | 'enterprise' | null;

export interface User {
  email: string;
  role: UserRole;
  name: string;
}

// Helper component to get user from auth context
function DashboardWrapper() {
  const { user: authUser } = useAuth();
  
  if (!authUser) {
    return <Navigate to="/" replace />;
  }

  // Map backend role to frontend role
  const role: UserRole = 
    authUser.role === 'data-scientist' || authUser.role === 'ml-engineer' 
      ? 'data-scientist' 
      : authUser.role === 'admin' 
      ? 'enterprise' 
      : 'guest';
  
  const user: User = {
    email: authUser.email,
    role,
    name: authUser.name,
  };

  return <DataScientistDashboard user={user} />;
}

function PortalWrapper() {
  const { user: authUser } = useAuth();
  
  if (!authUser) {
    return <Navigate to="/" replace />;
  }

  // Map backend role to frontend role
  const role: UserRole = 
    authUser.role === 'data-scientist' || authUser.role === 'ml-engineer' 
      ? 'data-scientist' 
      : authUser.role === 'admin' 
      ? 'enterprise' 
      : 'guest';
  
  const user: User = {
    email: authUser.email,
    role,
    name: authUser.name,
  };

  return <EnterprisePortal user={user} />;
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/upload" element={<EndUserUpload />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute children={<DashboardWrapper />} />
          }
        />
        <Route
          path="/portal"
          element={
            <ProtectedRoute children={<PortalWrapper />} />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
