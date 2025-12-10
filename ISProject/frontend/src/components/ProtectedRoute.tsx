import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../App';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user: authUser, isLoading } = useAuth();

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

  if (!isAuthenticated || !authUser) {
    return <Navigate to="/" replace />;
  }

  // Map backend role to frontend role
  const role: UserRole = 
    authUser.role === 'data-scientist' || authUser.role === 'ml-engineer' 
      ? 'data-scientist' 
      : authUser.role === 'admin' 
      ? 'enterprise' 
      : 'guest';

  // Check if user has required role
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect based on user's actual role
    if (role === 'data-scientist') {
      return <Navigate to="/dashboard" replace />;
    } else if (role === 'enterprise') {
      return <Navigate to="/portal" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
