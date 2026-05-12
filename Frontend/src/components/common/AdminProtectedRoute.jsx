/**
 * ============================================================
 * FinovaWealth — Admin Protected Route
 * File: Frontend/src/components/common/AdminProtectedRoute.jsx
 * ============================================================
 * Wraps admin-only routes. Requires authentication AND
 * user.role === "admin". Redirects to /admin-login otherwise.
 * ============================================================
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-surface-500">Verifying admin session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}
