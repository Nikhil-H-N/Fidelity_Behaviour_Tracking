/**
 * ============================================================
 * FinovaWealth — Trigger Model
 * File: models/Trigger.js
 * ============================================================
 * Represents automated triggers fired by the analytics engine
 * when specific behavioural conditions are met (e.g. a user
 * abandons a form, or intent score crosses a threshold).
 *
 * Indexes:
 *   • userId      — triggers for a specific user
 *   • triggerType — filter by trigger category
 *   • status      — filter active / resolved / dismissed
 *   • createdAt   — chronological queries
 * ============================================================
 */

const mongoose = require("mongoose");

const triggerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },

    triggerType: {
      type: String,
      enum: [
        "form_abandon",
        "high_intent",
        "drop_off",
        "return_visit",
        "inactivity",
        "conversion",
        "custom",
      ],
      required: [true, "triggerType is required"],
      index: true,
    },

    /** Human-readable reason the trigger was fired */
    reason: {
      type: String,
      required: [true, "Trigger reason is required"],
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["active", "resolved", "dismissed"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

/* ── Compound Indexes ─────────────────────────────────────── */
triggerSchema.index({ userId: 1, createdAt: -1 });
triggerSchema.index({ triggerType: 1, status: 1 });

const Trigger = mongoose.model("Trigger", triggerSchema);

module.exports = Trigger;
