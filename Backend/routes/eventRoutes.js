/**
 * ============================================================
 * FinovaWealth — Event Routes
 * File: routes/eventRoutes.js
 * ============================================================
 */

const express = require("express");
const router = express.Router();
const { trackEvent, createSession, endSession, trackFormAbandonment } = require("../controllers/eventController");
const { protect } = require("../middleware/authMiddleware");

// All event routes require authentication
router.post("/", protect, trackEvent);
router.post("/session", protect, createSession);
router.post("/session/end", protect, endSession);
router.post("/form-abandon", protect, trackFormAbandonment);

module.exports = router;
