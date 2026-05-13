/**
 * ============================================================
 * FinovaWealth — Admin API Service
 * File: Frontend/src/api/adminService.js
 * ============================================================
 */

import apiClient from "./client";

/** Admin Login */
export const adminLogin = (data) =>
  apiClient.post("/auth/admin-login", data).then((r) => r.data);

/** Get all users */
export const getAdminUsers = (params) =>
  apiClient.get("/admin/users", { params }).then((r) => r.data);

/** Get all events */
export const getAdminEvents = (params) =>
  apiClient.get("/admin/events", { params }).then((r) => r.data);

/** Get all sessions */
export const getAdminSessions = (params) =>
  apiClient.get("/admin/sessions", { params }).then((r) => r.data);

/** Get analytics overview */
export const getAdminAnalytics = () =>
  apiClient.get("/admin/analytics").then((r) => r.data);

/** Get real-time active sessions from Python Engine (via Proxy or Direct) */
export const getActiveEngineUsers = () =>
  fetch("http://localhost:8000/admin/active-users").then((r) => r.json());

/** Send a manual intervention/nudge to a specific user */
export const triggerManualIntervention = (data) =>
  fetch("http://localhost:8000/admin/manual-intervention", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());
