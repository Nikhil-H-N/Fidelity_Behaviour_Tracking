/**
 * ============================================================
 * FinovaWealth — Intent Scoring Engine
 * File: services/intentEngine.js
 * ============================================================
 * Rule-based behavioral intelligence engine that computes
 * investment intent scores from user interactions.
 * ============================================================
 */

const Event = require("../models/Event");
const User = require("../models/User");

/** Intent signal weights */
const SIGNAL_WEIGHTS = {
  page_view: 2,
  button_click: 5,
  form_start: 10,
  form_submit: 25,
  form_abandon: -5,
  checkout_start: 18,
  checkout_complete: 35,
  checkout_abandon: -8,
  product_view: 8,
  comparison: 12,
  calculator_usage: 14,
  download_brochure: 10,
  contact_advisor: 18,
  chatbot_message: 7,
  scroll: 1,
  modal_open: 8,
  investment_intent: 15,
  field_focus: 3,
  field_change: 4,
  return_visit: 10,
};

/** High-value pages that indicate investment intent */
const HIGH_INTENT_PAGES = [
  "/mutual-funds",
  "/sip-plans",
  "/investment-plans",
  "/insurance-plans",
  "/tax-saving",
  "/tax-saving-plans",
  "/wealth-management",
  "/plan-comparison",
  "/checkout",
  "/goal-planning",
  "/retirement-planning",
];

/**
 * Calculate intent score for a user based on recent events.
 * @param {string} userId
 * @param {number} windowHours — How far back to look (default: 24h)
 * @returns {Promise<{ score: number, signals: string[], tier: string }>}
 */
const calculateIntentScore = async (userId, windowHours = 24) => {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const events = await Event.find({
    userId,
    timestamp: { $gte: since },
  }).sort({ timestamp: -1 });

  if (events.length === 0) {
    return { score: 0, signals: [], tier: "Cold" };
  }

  let rawScore = 0;
  const signals = [];

  // Score each event
  events.forEach((evt) => {
    const weight = SIGNAL_WEIGHTS[evt.eventType] || 1;
    let multiplier = 1;

    // Boost for high-intent pages
    if (HIGH_INTENT_PAGES.includes(evt.page)) {
      multiplier = 1.5;
    }

    // Boost for long time-spent
    if (evt.duration && evt.duration > 120) {
      multiplier *= 1.3;
    }

    // Boost for deep scroll
    if (evt.scrollDepth && evt.scrollDepth > 70) {
      multiplier *= 1.2;
    }

    rawScore += weight * multiplier;
  });

  // --- Build signal descriptions ---
  const investClicks = events.filter(
    (e) => e.eventType === "button_click" && e.buttonName?.includes("Invest")
  ).length;
  if (investClicks >= 2) signals.push(`Clicked Invest ${investClicks}x`);

  const formStarts = events.filter((e) => e.eventType === "form_start").length;
  if (formStarts > 0) signals.push(`Started ${formStarts} form(s)`);

  const formAbandons = events.filter((e) => e.eventType === "form_abandon").length;
  if (formAbandons > 0) signals.push(`Abandoned ${formAbandons} form(s)`);

  const checkoutSignals = events.filter((e) => ["checkout_start", "checkout_abandon", "checkout_complete"].includes(e.eventType)).length;
  if (checkoutSignals > 0) signals.push(`${checkoutSignals} checkout signal(s)`);

  const productViews = events.filter((e) => e.eventType === "product_view").length;
  if (productViews >= 2) signals.push(`Viewed ${productViews} product details`);

  const deepScrolls = events.filter(
    (e) => e.scrollDepth && e.scrollDepth > 70
  ).length;
  if (deepScrolls > 0) signals.push(`Deep scroll on ${deepScrolls} page(s)`);

  const uniquePages = [...new Set(events.map((e) => e.page).filter(Boolean))];
  if (uniquePages.length > 3) signals.push(`Visited ${uniquePages.length} pages`);

  const longSessions = events.filter(
    (e) => e.duration && e.duration > 180
  ).length;
  if (longSessions > 0) signals.push(`${longSessions} extended session(s)`);

  // Normalize to 0-100
  const score = Math.min(100, Math.round(rawScore));

  // Tier assignment
  let tier = "Cold";
  if (score >= 80) tier = "Hot";
  else if (score >= 55) tier = "Warm";
  else if (score >= 30) tier = "Engaged";
  else if (score >= 10) tier = "Browsing";

  return { score, signals, tier };
};

/**
 * Update user's intent score in the database.
 * @param {string} userId
 */
const updateUserIntentScore = async (userId) => {
  try {
    const { score } = await calculateIntentScore(userId);
    await User.findByIdAndUpdate(userId, { intentScore: score });
    return score;
  } catch (error) {
    console.error(`Intent score update failed for ${userId}:`, error.message);
    return null;
  }
};

/**
 * Evaluate behavioral rules and return triggered actions.
 * @param {string} userId
 * @returns {Promise<Array<{ rule: string, action: string, reason: string }>>}
 */
const evaluateRules = async (userId) => {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const events = await Event.find({
    userId,
    timestamp: { $gte: since24h },
  });

  const triggered = [];

  // Rule 1: High intent — >180s + >2 invest clicks + form abandon
  const totalDuration = events
    .filter((e) => e.duration)
    .reduce((sum, e) => sum + e.duration, 0);
  const investClicks = events.filter(
    (e) => e.eventType === "button_click" && e.buttonName?.includes("Invest")
  ).length;
  const hasAbandon = events.some((e) => e.eventType === "form_abandon");
  const checkoutAbandons = events.filter((e) => e.eventType === "checkout_abandon").length;
  const productViews = events.filter((e) => e.eventType === "product_view").length;
  const comparisons = events.filter((e) => e.eventType === "comparison").length;

  if (totalDuration > 180 && investClicks >= 2 && hasAbandon) {
    triggered.push({
      rule: "high_intent_abandoner",
      action: "email",
      reason: `User spent ${Math.round(totalDuration)}s, clicked Invest ${investClicks}x, and abandoned a form`,
    });
  }

  // Rule 2: Repeat visitor with deep engagement
  const sipPageVisits = events.filter(
    (e) => e.eventType === "page_view" && e.page?.includes("sip")
  ).length;
  const deepScrolls = events.filter(
    (e) => e.scrollDepth && e.scrollDepth > 70
  ).length;
  const formOpens = events.filter((e) => e.eventType === "modal_open").length;

  if (sipPageVisits >= 3 && deepScrolls >= 2 && formOpens >= 2) {
    triggered.push({
      rule: "likely_converter",
      action: "flag",
      reason: `Visited SIP page ${sipPageVisits}x, deep scroll ${deepScrolls}x, opened forms ${formOpens}x`,
    });
  }

  // Rule 3: Form abandonment re-engagement
  const recentAbandons = events.filter(
    (e) => e.eventType === "form_abandon" &&
    new Date(e.timestamp) > new Date(Date.now() - 2 * 60 * 60 * 1000)
  );
  if (recentAbandons.length >= 1) {
    triggered.push({
      rule: "form_abandon_nudge",
      action: "in_app",
      reason: `User abandoned ${recentAbandons.length} form(s) in the last 2 hours`,
    });
  }

  // Rule 4: Product comparison but no checkout completion
  const hasCheckoutComplete = events.some((e) => e.eventType === "checkout_complete" || e.eventType === "form_submit");
  if ((comparisons >= 2 || productViews >= 3) && !hasCheckoutComplete) {
    triggered.push({
      rule: "comparison_without_conversion",
      action: "in_app",
      reason: `User compared/viewed products ${comparisons + productViews} times without completing checkout`,
    });
  }

  // Rule 5: Checkout recovery
  if (checkoutAbandons >= 1) {
    triggered.push({
      rule: "checkout_recovery",
      action: "email",
      reason: `User abandoned checkout ${checkoutAbandons} time(s) after showing application intent`,
    });
  }

  return triggered;
};

module.exports = {
  calculateIntentScore,
  updateUserIntentScore,
  evaluateRules,
};
