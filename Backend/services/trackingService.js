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

/**
 * Process and persist a batch of events.
 * Enriches each event with userId, computes intent, evaluates rules.
 * @param {string} userId
 * @param {Array} events
 * @returns {Promise<{ created: number, intentScore: number, triggers: Array }>}
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

  // Bulk insert (ordered: false for performance)
  const created = await Event.insertMany(enriched, { ordered: false });

  // Update user intent score asynchronously
  const intentScore = await updateUserIntentScore(userId);

  // Evaluate behavioral rules
  const triggers = await evaluateRules(userId);

  // Update session with page visits
  const sessionIds = [...new Set(enriched.map((e) => e.sessionId).filter(Boolean))];
  for (const sid of sessionIds) {
    const pages = enriched
      .filter((e) => e.sessionId?.toString() === sid.toString() && e.page)
      .map((e) => e.page);

    if (pages.length > 0) {
      await Session.findByIdAndUpdate(sid, {
        $addToSet: { pagesVisited: { $each: pages } },
        lastActive: new Date(),
      });
    }
  }

  return {
    created: created.length,
    intentScore,
    triggers,
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
