import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

/**
 * Enhanced Protected Route Component
 * 
 * Supports:
 * - Authentication requirement
 * - Email verification requirement
 * - Role-based authorization (e.g., requiredRole = 'admin')
 */
export function ProtectedRoute({
  children,
  requireVerifiedEmail = false,
  requiredRole = null,
}) {
  const { user, profile, loading, isAuthenticated, isEmailConfirmed } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-400 font-mono">Verifying secure credentials...</p>
      </div>
    );
  }

  // 1. Authentication check
  if (!isAuthenticated) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?redirect_url=${redirectUrl}`} replace />;
  }

  // 2. Email verification check
  if (requireVerifiedEmail && !isEmailConfirmed) {
    return <Navigate to="/verify-email" replace />;
  }

  // 3. Role-based authorization check
  if (requiredRole) {
    const userRole =
      user?.app_metadata?.role ||
      user?.user_metadata?.role ||
      profile?.role ||
      user?.role ||
      'user';

    if (userRole !== requiredRole) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 mb-4 text-red-500">
            <ShieldAlert className="w-10 h-10 mx-auto" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">Access Restricted</h1>
          <p className="text-xs text-zinc-400 max-w-md mt-2">
            You do not have the required administrative role (<span className="text-red-400 font-mono">{requiredRole}</span>) to view this resource.
          </p>
          <a
            href="/"
            className="mt-6 px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white transition-colors"
          >
            Return to Home
          </a>
        </div>
      );
    }
  }

  return children;
}

export default ProtectedRoute;
