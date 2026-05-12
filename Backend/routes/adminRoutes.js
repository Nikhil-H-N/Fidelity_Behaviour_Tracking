/**
 * ============================================================
 * FinovaWealth — Admin Routes
 * File: routes/adminRoutes.js
 * ============================================================
 * All routes require authentication + admin role.
 * ============================================================
 */

const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getAllUsers,
  getAllEvents,
  getAllSessions,
  getAnalytics,
} = require("../controllers/adminController");

// Every route below requires admin access
router.use(protect, authorize("admin"));

router.get("/users", getAllUsers);
router.get("/events", getAllEvents);
router.get("/sessions", getAllSessions);
router.get("/analytics", getAnalytics);

module.exports = router;
