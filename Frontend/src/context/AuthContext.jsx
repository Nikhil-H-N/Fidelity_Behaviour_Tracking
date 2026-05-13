/**
 * ============================================================
 * FinovaWealth — Auth Context Provider
 * File: Frontend/src/context/AuthContext.jsx
 * ============================================================
 * Provides authentication state to the entire app:
 *   • Persists token + user in localStorage
 *   • Auto-restores session on mount via GET /auth/me
 *   • Exposes login, logout, setAuthData helpers
 *   • Syncs with the existing Zustand store
 *
 * IMPORTANT: This context NEVER redirects the user.
 * Redirection is handled ONLY by <ProtectedRoute>.
 * ============================================================
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe } from "../api/authService";
import useStore from "../store/useStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("fw_token"));
  const [loading, setLoading] = useState(true);

  // Zustand sync
  const zustandSetAuth = useStore((s) => s.setAuth);
  const zustandLogout = useStore((s) => s.logout);

  /**
   * Save auth data to state + localStorage + Zustand.
   */
  const setAuthData = useCallback(
    (newToken, newUser) => {
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem("fw_token", newToken);
      localStorage.setItem("fw_user", JSON.stringify(newUser));
      zustandSetAuth(newUser);
    },
    [zustandSetAuth]
  );

  /**
   * Clear all auth state. Does NOT navigate — that's ProtectedRoute's job.
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("fw_token");
    localStorage.removeItem("fw_user");
    sessionStorage.removeItem("fw_sessionId");
    zustandLogout();
  }, [zustandLogout]);

  /**
   * On mount — if a token exists, verify it via GET /auth/me.
   * Also ensure a sessionId exists for tracking.
   */
  useEffect(() => {
    // Session ID initialization
    if (!sessionStorage.getItem('fw_sessionId')) {
      sessionStorage.setItem('fw_sessionId', 'sess_' + Math.random().toString(36).substr(2, 9));
    }

    const restoreSession = async () => {
      const savedToken = localStorage.getItem("fw_token");

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await getMe();
        if (res.success && res.data?.user) {
          setUser(res.data.user);
          zustandSetAuth(res.data.user);
        } else {
          // Token invalid — clear silently, don't redirect
          logout();
        }
      } catch {
        // Network error or 401 — clear silently, don't redirect
        logout();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    setAuthData,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context.
 * @returns {{ user, token, loading, isAuthenticated, setAuthData, logout }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
