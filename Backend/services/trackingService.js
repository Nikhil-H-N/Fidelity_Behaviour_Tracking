/**
 * ============================================================
 * FinovaWealth — Tracking Service
 * File: services/trackingService.js
 * ============================================================
 * Centralized service for processing and enriching tracked
 * events before persistence.
 * ============================================================
 */

const Event = require("../models/Event");
const Session = require("../models/Session");
const { updateUserIntentScore, evaluateRules } = require("./intentEngine");

const ENGINE_URL = process.env.ENGINE_URL || "http://localhost:8000/analyze";

/**
 * Process and persist a batch of events.
 * Enriches each event with userId, computes intent, evaluates rules.
 * @param {string} userId
 * @param {Array} events
 * @returns {Promise<{ created: number, intentScore: number, triggers: Array, intelligence: Array }>}
 */
const processBatchEvents = async (userId, events) => {
  // Enrich events
  const enriched = events.map((e) => ({
    userId,
    sessionId: e.sessionId || null,
    eventType: e.eventType,
    page: e.page || null,
    element: e.element || null,
    source: e.source || null,
    buttonName: e.buttonName || null,
    formType: e.formType || null,
    fieldName: e.fieldName || null,
    duration: e.duration || null,
    scrollDepth: e.scrollDepth || null,
    intentScore: e.intentScore || null,
    device: e.device || null,
    browser: e.browser || null,
    metadata: e.metadata || {},
    timestamp: e.timestamp || new Date(),
  }));

  // Bulk insert to MongoDB only if we have a valid ObjectId for userId
  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
  
  let createdCount = 0;
  if (isValidObjectId(userId)) {
    try {
      const created = await Event.insertMany(enriched, { ordered: false });
      createdCount = created.length;

      // Update user intent score and evaluate rules (Mongo-based)
      await updateUserIntentScore(userId);
      await evaluateRules(userId);
    } catch (mongoError) {
      console.warn(`MongoDB persistence failed: ${mongoError.message}`);
    }
  }

  // --- Forward to Python Engine (ALWAYS) ---
  const intelligence = [];
  for (const event of enriched) {
    try {
      const response = await fetch(ENGINE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId.toString(),
          event_type: event.eventType,
          page_id: event.page || "unknown",
          element_id: event.element || event.buttonName || null,
          timestamp: new Date(event.timestamp).getTime() / 1000,
          scroll_depth: event.scrollDepth || 0,
          metadata: event.metadata || {},
        }),
      });
      if (response.ok) {
        const data = await response.json();
        intelligence.push(data);
      }
    } catch (error) {
      console.warn(`Engine forwarding failed: ${error.message}`);
    }
  }

  // Update session with page visits in MongoDB only if valid
  const sessionIds = [...new Set(enriched.map((e) => e.sessionId).filter(Boolean))];
  for (const sid of sessionIds) {
    if (isValidObjectId(sid)) {
      const pages = enriched
        .filter((e) => e.sessionId?.toString() === sid.toString() && e.page)
        .map((e) => e.page);

      if (pages.length > 0) {
        await Session.findByIdAndUpdate(sid, {
          $addToSet: { pagesVisited: { $each: pages } },
          lastActive: new Date(),
        }).catch(() => {});
      }
    }
  }

  return {
    created: createdCount,
    intentScore: 0, // Guest scores handled by engine
    triggers: [],
    intelligence,
  };
};

/**
 * Record a form abandonment event with context.
 * @param {string} userId
 * @param {Object} abandonData
 */
const recordFormAbandonment = async (userId, abandonData) => {
  const event = await Event.create({
    userId,
    sessionId: abandonData.sessionId || null,
    eventType: "form_abandon",
    page: abandonData.page || null,
    formType: abandonData.formType || null,
    metadata: {
      filledFields: abandonData.filledFields || [],
      totalFields: abandonData.totalFields || 0,
      completionPercent: abandonData.completionPercent || 0,
      timeSpent: abandonData.timeSpent || 0,
      lastFieldFocused: abandonData.lastFieldFocused || null,
    },
    duration: abandonData.timeSpent || null,
    timestamp: new Date(),
  });

  // Update intent score
  await updateUserIntentScore(userId);

  return event;
};

module.exports = {
  processBatchEvents,
  recordFormAbandonment,
};
