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
const Trigger = require("../models/Trigger");
const Notification = require("../models/Notification");
const generateToken = require("../utils/generateToken");

const ENGINE_ANALYTICS_URL = process.env.ENGINE_ANALYTICS_URL || "http://127.0.0.1:8000/admin/analytics/summary";

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id || ""));
const FORM_EVENT_TYPES = ["form_start", "form_submit", "form_abandon", "checkout_start", "checkout_complete", "checkout_abandon"];

const getEngineBaseUrl = () => {
  const configured = process.env.ENGINE_URL || "http://127.0.0.1:8000/analyze";
  return configured.replace(/\/analyze\/?$/, "").replace(/\/+$/, "");
};

const getFormAnalytics = async () => {
  const formMatch = { eventType: { $in: FORM_EVENT_TYPES } };
  const formTypeExpr = {
    $ifNull: [
      "$formType",
      {
        $ifNull: [
          "$metadata.form",
          { $ifNull: ["$metadata.formType", "unknown"] },
        ],
      },
    ],
  };

  const [totals, perUser] = await Promise.all([
    Event.aggregate([
      { $match: formMatch },
      {
        $group: {
          _id: null,
          started: {
            $sum: { $cond: [{ $in: ["$eventType", ["form_start", "checkout_start"]] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $in: ["$eventType", ["form_submit", "checkout_complete"]] }, 1, 0] },
          },
          discarded: {
            $sum: { $cond: [{ $in: ["$eventType", ["form_abandon", "checkout_abandon"]] }, 1, 0] },
          },
          users: { $addToSet: "$userId" },
        },
      },
    ]),
    Event.aggregate([
      { $match: formMatch },
      {
        $group: {
          _id: { userId: "$userId", formType: formTypeExpr },
          started: {
            $sum: { $cond: [{ $in: ["$eventType", ["form_start", "checkout_start"]] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $in: ["$eventType", ["form_submit", "checkout_complete"]] }, 1, 0] },
          },
          discarded: {
            $sum: { $cond: [{ $in: ["$eventType", ["form_abandon", "checkout_abandon"]] }, 1, 0] },
          },
          lastActivity: { $max: "$timestamp" },
          lastCompletionPercent: { $max: "$metadata.completionPercent" },
        },
      },
      {
        $group: {
          _id: "$_id.userId",
          forms: {
            $push: {
              formType: "$_id.formType",
              started: "$started",
              completed: "$completed",
              discarded: "$discarded",
              completionRate: {
                $cond: [{ $gt: ["$started", 0] }, { $multiply: [{ $divide: ["$completed", "$started"] }, 100] }, 0],
              },
              discardRate: {
                $cond: [{ $gt: ["$started", 0] }, { $multiply: [{ $divide: ["$discarded", "$started"] }, 100] }, 0],
              },
              lastCompletionPercent: { $ifNull: ["$lastCompletionPercent", null] },
            },
          },
          started: { $sum: "$started" },
          completed: { $sum: "$completed" },
          discarded: { $sum: "$discarded" },
          lastActivity: { $max: "$lastActivity" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          fullName: { $ifNull: ["$user.fullName", "Unknown user"] },
          email: { $ifNull: ["$user.email", null] },
          started: 1,
          completed: 1,
          discarded: 1,
          completionRate: {
            $cond: [{ $gt: ["$started", 0] }, { $multiply: [{ $divide: ["$completed", "$started"] }, 100] }, 0],
          },
          discardRate: {
            $cond: [{ $gt: ["$started", 0] }, { $multiply: [{ $divide: ["$discarded", "$started"] }, 100] }, 0],
          },
          forms: 1,
          lastActivity: 1,
        },
      },
      { $sort: { lastActivity: -1 } },
      { $limit: 25 },
    ]),
  ]);

  const total = totals[0] || { started: 0, completed: 0, discarded: 0, users: [] };
  const started = total.started || 0;

  return {
    summary: {
      started,
      completed: total.completed || 0,
      discarded: total.discarded || 0,
      users: total.users?.length || 0,
      completionRate: started > 0 ? Math.round(((total.completed || 0) / started) * 100) : 0,
      discardRate: started > 0 ? Math.round(((total.discarded || 0) / started) * 100) : 0,
    },
    users: perUser.map((entry) => ({
      ...entry,
      completionRate: Math.round(entry.completionRate || 0),
      discardRate: Math.round(entry.discardRate || 0),
      forms: (entry.forms || []).map((form) => ({
        ...form,
        completionRate: Math.round(form.completionRate || 0),
        discardRate: Math.round(form.discardRate || 0),
      })),
    })),
  };
};

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

    const allUsers = await User.find().sort({ createdAt: -1 }).lean();
    const uniqueByEmail = new Map();

    for (const user of allUsers) {
      const key = String(user.email || user._id).toLowerCase();
      if (!uniqueByEmail.has(key)) uniqueByEmail.set(key, user);
    }

    const dedupedUsers = [...uniqueByEmail.values()];
    const users = dedupedUsers.slice(skip, skip + limit);
    const total = dedupedUsers.length;

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
      formAnalytics,
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
      getFormAnalytics(),
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
        formAnalytics,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Deletes a user and their associated data.
 */
const deleteUser = async (req, res) => {
  try {
    const requestedId = req.params.id;
    const body = req.body || {};
    const identifiers = new Set(
      [requestedId, body.userId, body.engineUserId, body.trackingUserId, body.clientSessionId, body.guestId]
        .filter(Boolean)
        .map(String)
    );
    (Array.isArray(body.aliases) ? body.aliases : []).forEach((alias) => {
      if (alias) identifiers.add(String(alias));
    });

    const requestedEmail = body.email ? String(body.email).toLowerCase().trim() : null;
    let usersToDelete = [];

    if (isValidObjectId(requestedId)) {
      const user = await User.findById(requestedId).lean();
      if (user?.email) {
        usersToDelete = await User.find({ email: user.email }).lean();
      } else if (user) {
        usersToDelete = [user];
      }
    } else if (requestedEmail) {
      usersToDelete = await User.find({ email: requestedEmail }).lean();
    } else if (String(requestedId).includes("@")) {
      usersToDelete = await User.find({ email: String(requestedId).toLowerCase().trim() }).lean();
    }

    const userIds = usersToDelete.map((user) => user._id);
    usersToDelete.forEach((user) => {
      identifiers.add(String(user._id));
      if (user.email) identifiers.add(String(user.email).toLowerCase());
    });

    const [deletedUsers, deletedSessions, deletedEvents, deletedTriggers, deletedNotifications] = userIds.length > 0
      ? await Promise.all([
          User.deleteMany({ _id: { $in: userIds } }),
          Session.deleteMany({ userId: { $in: userIds } }),
          Event.deleteMany({ userId: { $in: userIds } }),
          Trigger.deleteMany({ userId: { $in: userIds } }),
          Notification.deleteMany({ userId: { $in: userIds } }),
        ])
      : [
          { deletedCount: 0 },
          { deletedCount: 0 },
          { deletedCount: 0 },
          { deletedCount: 0 },
          { deletedCount: 0 },
        ];

    let engineDeleted = [];
    try {
      const engineRes = await fetch(`${getEngineBaseUrl()}/admin/sessions/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifiers: [...identifiers] }),
      });
      if (engineRes.ok) {
        const engineData = await engineRes.json();
        engineDeleted = engineData.deleted || [];
      }
    } catch (e) {
      console.warn("Failed to notify engine of user deletion:", e.message);
    }

    const totalDeleted =
      deletedUsers.deletedCount +
      deletedSessions.deletedCount +
      deletedEvents.deletedCount +
      deletedTriggers.deletedCount +
      deletedNotifications.deletedCount +
      engineDeleted.length;

    if (totalDeleted === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching user, session, or engine identity was found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User identity deleted globally",
      data: {
        deletedUsers: deletedUsers.deletedCount,
        deletedSessions: deletedSessions.deletedCount,
        deletedEvents: deletedEvents.deletedCount,
        deletedTriggers: deletedTriggers.deletedCount,
        deletedNotifications: deletedNotifications.deletedCount,
        deletedEngineSessions: engineDeleted.length,
        engineDeleted,
      },
    });
  } catch (error) {
    console.error("Delete user error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

module.exports = {
  adminLogin,
  getAllUsers,
  getAllEvents,
  getAllSessions,
  getAnalytics,
  deleteUser,
};
