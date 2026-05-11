/**
 * ============================================================
 * FinovaWealth — Event Routes
 * File: routes/eventRoutes.js
 * ============================================================
 */

const express = require("express");
const router = express.Router();
const { trackEvent, createSession } = require("../controllers/eventController");
const { protect } = require("../middleware/authMiddleware");

// All event routes require authentication
router.post("/", protect, trackEvent);
router.post("/session", protect, createSession);

module.exports = router;
