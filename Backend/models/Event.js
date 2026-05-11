/**
 * ============================================================
 * FinovaWealth — Event Model  (MOST IMPORTANT)
 * File: models/Event.js
 * ============================================================
 * Captures every granular user interaction on the platform.
 * This is the backbone of the behavioural analytics engine.
 *
 * Supported event types:
 *   page_view, button_click, scroll, form_start, form_submit,
 *   form_abandon, session_start, session_end,
 *   notification_open, return_visit
 *
 * Indexes (critical for query performance at scale):
 *   • userId    — all events for a specific user
 *   • sessionId — all events within a session
 *   • timestamp — time-range & chronological queries
 *   • eventType — filter by interaction category
 *   • Compound  — userId + timestamp (recent user activity)
 *   • Compound  — eventType + timestamp (activity heatmaps)
 * ============================================================
 */

const mongoose = require("mongoose");

/** Whitelist of allowed event types */
const EVENT_TYPES = [
  "page_view",
  "button_click",
  "scroll",
  "form_start",
  "form_submit",
  "form_abandon",
  "session_start",
  "session_end",
  "notification_open",
  "return_visit",
];

const eventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: [true, "sessionId is required"],
      index: true,
    },

    eventType: {
      type: String,
      required: [true, "eventType is required"],
      enum: {
        values: EVENT_TYPES,
        message: `eventType must be one of: ${EVENT_TYPES.join(", ")}`,
      },
      index: true,
    },

    /** Page / route where the event occurred, e.g. "/dashboard" */
    page: {
      type: String,
      trim: true,
      default: null,
    },

    /** DOM element identifier, e.g. "cta-invest-now" */
    element: {
      type: String,
      trim: true,
      default: null,
    },

    /** Traffic source, e.g. "organic", "email_campaign", "direct" */
    source: {
      type: String,
      trim: true,
      default: null,
    },

    /** Flexible key-value bag for event-specific data */
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // We use our own `timestamp` field
  }
);

/* ── Compound Indexes ─────────────────────────────────────── */
eventSchema.index({ userId: 1, timestamp: -1 });    // User's recent activity
eventSchema.index({ eventType: 1, timestamp: -1 });  // Activity heatmaps
eventSchema.index({ sessionId: 1, timestamp: 1 });   // Chronological session replay

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
