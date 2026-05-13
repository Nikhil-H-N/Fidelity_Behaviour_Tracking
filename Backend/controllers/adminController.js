/**
 * ============================================================
 * FinovaWealth — Admin Controller
 * File: controllers/adminController.js
 * ============================================================
 * Admin-only endpoints for monitoring users, events, sessions,
 * and behavioral analytics data.
 * ============================================================
 */

const User = require("../models/User");
const Event = require("../models/Event");
const Session = require("../models/Session");
const generateToken = require("../utils/generateToken");

const ENGINE_ANALYTICS_URL = process.env.ENGINE_ANALYTICS_URL || "http://localhost:8000/admin/analytics/summary";

/* ═══════════════════════════════════════════════════════════
 * ADMIN LOGIN
 * ═══════════════════════════════════════════════════════════ */

/**
 * POST /api/auth/admin-login
 * Validates credentials AND checks role === "admin".
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findByEmailWithPassword(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    // Must be admin role
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied — admin privileges required",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Admin account is not verified",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          authProvider: user.authProvider,
        },
      },
    });
  } catch (error) {
    console.error("Admin login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during admin login",
    });
  }
};

/* ═══════════════════════════════════════════════════════════
 * ADMIN DATA ENDPOINTS
 * ═══════════════════════════════════════════════════════════ */

/**
 * GET /api/admin/users
 * Returns all users (paginated).
 */
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Get all users error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

/**
 * GET /api/admin/events
 * Returns all events with optional userId filter.
 */
const getAllEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.eventType) filter.eventType = req.query.eventType;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "fullName email")
        .lean(),
      Event.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        events,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Get all events error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch events" });
  }
};

/**
 * GET /api/admin/sessions
 * Returns all sessions with optional userId filter.
 */
const getAllSessions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.status) filter.status = req.query.status;

    const [sessions, total] = await Promise.all([
      Session.find(filter)
        .sort({ sessionStart: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "fullName email")
        .lean(),
      Session.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Get all sessions error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch sessions" });
  }
};

/**
 * GET /api/admin/analytics
 * Returns aggregated analytics data for the admin dashboard.
 */
const getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersToday,
      newUsersWeek,
      totalEvents,
      eventsToday,
      totalSessions,
      activeSessions,
      eventsByType,
      usersByProvider,
      dailySignups,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: last24h } }),
      User.countDocuments({ createdAt: { $gte: last7d } }),
      Event.countDocuments(),
      Event.countDocuments({ timestamp: { $gte: last24h } }),
      Session.countDocuments(),
      Session.countDocuments({ status: "active" }),
      Event.aggregate([
        { $group: { _id: "$eventType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      User.aggregate([
        { $group: { _id: "$authProvider", count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: last30d } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Fetch engine-level behavioral summary
    let engineSummary = null;
    try {
      const engineRes = await fetch(ENGINE_ANALYTICS_URL);
      if (engineRes.ok) {
        engineSummary = await engineRes.json();
      }
    } catch (e) {
      console.warn("Engine analytics fetch failed:", e.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          newUsersToday,
          newUsersWeek,
          totalEvents,
          eventsToday,
          totalSessions,
          activeSessions,
          engineStatus: engineSummary ? "active" : "offline",
        },
        eventsByType,
        usersByProvider,
        dailySignups,
        behavioralSummary: engineSummary,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
};

module.exports = {
  adminLogin,
  getAllUsers,
  getAllEvents,
  getAllSessions,
  getAnalytics,
};
