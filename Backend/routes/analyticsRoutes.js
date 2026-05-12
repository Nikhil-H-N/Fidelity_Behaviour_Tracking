/**
 * ============================================================
 * FinovaWealth — Analytics Routes
 * File: routes/analyticsRoutes.js
 * ============================================================
 * API routes for the behavioral analytics dashboard.
 * All routes require authentication.
 * ============================================================
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  dashboardAnalytics,
  recentEvents,
  highIntentUsers,
  sessionAnalytics,
  funnelAnalytics,
  topClicked,
  userIntent,
} = require("../controllers/analyticsController");

// All analytics routes require authentication
router.get("/dashboard", protect, dashboardAnalytics);
router.get("/events", protect, recentEvents);
router.get("/high-intent", protect, highIntentUsers);
router.get("/sessions", protect, sessionAnalytics);
router.get("/funnel", protect, funnelAnalytics);
router.get("/top-clicked", protect, topClicked);
router.get("/intent/:userId", protect, userIntent);

module.exports = router;
