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
