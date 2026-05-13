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
import toast from "react-hot-toast";
import { getBrowserInfo, getDeviceType } from "../utils/tracker";

/** In-memory queue — flushed every FLUSH_INTERVAL ms */
let eventQueue = [];
let flushTimer = null;
const FLUSH_INTERVAL = 3000; // 3 seconds
const MAX_BATCH_SIZE = 20;

const getGuestId = () => {
  let gid = localStorage.getItem('fw_guestId');
  if (!gid) {
    gid = 'guest_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('fw_guestId', gid);
  }
  return gid;
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('fw_user') || 'null');
  } catch {
    return null;
  }
};

export const getTrackingUserId = () => {
  const user = getStoredUser();
  return user?.id || user?._id || getGuestId();
};

const getSessionId = () => {
  let sessionId = sessionStorage.getItem('fw_sessionId');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).slice(2, 11);
    sessionStorage.setItem('fw_sessionId', sessionId);
  }
  return sessionId;
};

const getSessionDuration = () => {
  const startedAt = Number(sessionStorage.getItem('fw_sessionStartedAt') || Date.now());
  return Math.max(0, Math.round((Date.now() - startedAt) / 1000));
};

const buildEvent = (event) => {
  const sessionId = getSessionId();
  const metadata = event.metadata || {};
  const user = getStoredUser();

  return {
    page: event.page || window.location.pathname,
    sessionId,
    device: event.device || getDeviceType(),
    browser: event.browser || getBrowserInfo(),
    ...event,
    metadata: {
      ...metadata,
      page: event.page || metadata.page || window.location.pathname,
      clientSessionId: sessionId,
      trackingUserId: getTrackingUserId(),
      userEmail: user?.email || metadata.userEmail || null,
      userName: user?.fullName || metadata.userName || null,
    },
    timestamp: event.timestamp || new Date().toISOString(),
  };
};

/**
 * Queue a single event for batch dispatch.
 * @param {Object} event
 */
export const queueEvent = (event) => {
  eventQueue.push(buildEvent(event));

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
    const sessionId = sessionStorage.getItem('fw_sessionId');
    const guestId = getGuestId();
    const res = await apiClient.post("/events", { 
      events: batch,
      sessionId,
      guestId
    });

    // Handle real-time interventions from Python Engine
    const intelligence = res.data?.data?.intelligence || [];
    intelligence.forEach(intel => {
      if (intel.interventions && intel.interventions.length > 0) {
        intel.interventions.forEach(iv => {
          // Display the intervention as a cinematic nudge
          toast(iv.payload.message, {
            icon: iv.type === 'nudge' ? '🔔' : '🚀',
            duration: 6000,
            style: {
              border: '2px solid #6366f1',
              padding: '20px',
              color: '#1e293b',
              fontWeight: 'bold',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
            },
          });
        });
      }
    });

  } catch (error) {
    // On failure, push events back to queue for retry
    console.warn("Event flush failed — re-queuing", error.message);
    eventQueue = [...batch, ...eventQueue];
  }
};

const appendExitEvents = () => {
  const duration = getSessionDuration();
  const pageCount = Number(sessionStorage.getItem('fw_pageCount') || 0);
  const interactionCount = Number(sessionStorage.getItem('fw_interactionCount') || 0);
  const bounceSent = sessionStorage.getItem('fw_bounceSent') === 'true';

  eventQueue.push(buildEvent({
    eventType: 'session_end',
    duration,
    metadata: {
      duration,
      pageCount,
      interactionCount,
      reason: 'page_unload',
    },
  }));

  if (!bounceSent && pageCount <= 1 && interactionCount <= 1 && duration <= 30) {
    sessionStorage.setItem('fw_bounceSent', 'true');
    eventQueue.push(buildEvent({
      eventType: 'bounce',
      duration,
      metadata: {
        duration,
        pageCount,
        interactionCount,
      },
    }));
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
    appendExitEvents();

    if (eventQueue.length > 0) {
      // Use sendBeacon for reliability during unload
      const token = localStorage.getItem("fw_token");
      const url = (import.meta.env.VITE_API_URL || "http://localhost:5000/api") + "/events";
      const sessionId = getSessionId();
      const guestId = getGuestId();
      const blob = new Blob(
        [JSON.stringify({ events: eventQueue, sessionId, guestId })],
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
