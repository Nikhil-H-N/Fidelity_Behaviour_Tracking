/**
 * ============================================================
 * FinovaWealth — Event Tracking API Service
 * File: Frontend/src/api/eventService.js
 * ============================================================
 * Sends behavioural events to POST /api/events.
 * Uses a debounced batch queue to avoid flooding the backend.
 * ============================================================
 */

import apiClient from "./client";

/** In-memory queue — flushed every FLUSH_INTERVAL ms */
let eventQueue = [];
let flushTimer = null;
const FLUSH_INTERVAL = 3000; // 3 seconds
const MAX_BATCH_SIZE = 20;

/**
 * Queue a single event for batch dispatch.
 * @param {Object} event
 */
export const queueEvent = (event) => {
  eventQueue.push({
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  });

  // Flush immediately if batch is full
  if (eventQueue.length >= MAX_BATCH_SIZE) {
    flushEvents();
    return;
  }

  // Otherwise schedule a flush
  if (!flushTimer) {
    flushTimer = setTimeout(flushEvents, FLUSH_INTERVAL);
  }
};

/**
 * Flush the event queue to the backend.
 */
export const flushEvents = async () => {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (eventQueue.length === 0) return;

  const batch = [...eventQueue];
  eventQueue = [];

  try {
    await apiClient.post("/events", { events: batch });
  } catch (error) {
    // On failure, push events back to queue for retry
    console.warn("Event flush failed — re-queuing", error.message);
    eventQueue = [...batch, ...eventQueue];
  }
};

/**
 * Create a new tracking session.
 * @param {{ device?: string, browser?: string, location?: string }} meta
 * @returns {Promise<string>} sessionId
 */
export const createTrackingSession = async (meta = {}) => {
  try {
    const res = await apiClient.post("/events/session", meta);
    return res.data?.data?.sessionId;
  } catch (error) {
    console.warn("Failed to create tracking session", error.message);
    return null;
  }
};

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (eventQueue.length > 0) {
      // Use sendBeacon for reliability during unload
      const token = localStorage.getItem("fw_token");
      const url = (import.meta.env.VITE_API_URL || "http://localhost:5000/api") + "/events";
      const blob = new Blob(
        [JSON.stringify({ events: eventQueue })],
        { type: "application/json" }
      );
      // sendBeacon doesn't support custom headers, so fall back to fetch with keepalive
      fetch(url, {
        method: "POST",
        body: blob,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        keepalive: true,
      }).catch(() => {});
    }
  });
}
