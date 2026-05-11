/**
 * ============================================================
 * FinovaWealth — Event Controller
 * File: controllers/eventController.js
 * ============================================================
 * Handles behavioural event ingestion from the frontend
 * tracking layer. Supports single and batch event creation.
 * ============================================================
 */

const Event = require("../models/Event");
const Session = require("../models/Session");

/**
 * POST /api/events
 * Accepts a single event or an array of events.
 * Body: { event: {...} } or { events: [{...}, ...] }
 */
const trackEvent = async (req, res) => {
  try {
    const { event, events } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User must be authenticated to track events",
      });
    }

    // Normalize to array
    const payload = events || (event ? [event] : []);

    if (payload.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one event is required",
      });
    }

    // Attach userId and defaults
    const enriched = payload.map((e) => ({
      userId,
      sessionId: e.sessionId,
      eventType: e.eventType,
      page: e.page || null,
      element: e.element || null,
      source: e.source || null,
      metadata: e.metadata || {},
      timestamp: e.timestamp || new Date(),
    }));

    const created = await Event.insertMany(enriched, { ordered: false });

    return res.status(201).json({
      success: true,
      message: `${created.length} event(s) tracked`,
      data: { count: created.length },
    });
  } catch (error) {
    console.error(`❌  Event tracking error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to track event(s)",
    });
  }
};

/**
 * POST /api/events/session
 * Creates a new session and returns the sessionId.
 */
const createSession = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { device, browser, location } = req.body;

    const session = await Session.create({
      userId,
      device: device || "unknown",
      browser: browser || "unknown",
      location: location || "unknown",
      sessionStart: new Date(),
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Session created",
      data: { sessionId: session._id },
    });
  } catch (error) {
    console.error(`❌  Session creation error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to create session",
    });
  }
};

module.exports = { trackEvent, createSession };
