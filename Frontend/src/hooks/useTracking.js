/**
 * ============================================================
 * FinovaWealth — Tracking Hooks (Backend-Integrated)
 * File: Frontend/src/hooks/useTracking.js
 * ============================================================
 * Dual-write: events go to both Zustand (for local UI) AND
 * the backend event queue (for MongoDB persistence).
 * ============================================================
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import useStore from '../store/useStore';
import { queueEvent } from '../api/eventService';

/**
 * Get the current sessionId from sessionStorage.
 * Set by the session init logic in AuthContext or App.
 */
const getSessionId = () => sessionStorage.getItem('fw_sessionId') || null;

const markInteraction = (amount = 1) => {
  const current = Number(sessionStorage.getItem('fw_interactionCount') || 0);
  sessionStorage.setItem('fw_interactionCount', String(current + amount));
};

const incrementPageVisit = (pageName) => {
  const visits = JSON.parse(localStorage.getItem('fw_pageVisitCounts') || '{}');
  const previousVisits = visits[pageName] || 0;
  visits[pageName] = previousVisits + 1;
  localStorage.setItem('fw_pageVisitCounts', JSON.stringify(visits));

  const pageCount = Number(sessionStorage.getItem('fw_pageCount') || 0);
  sessionStorage.setItem('fw_pageCount', String(pageCount + 1));

  return { previousVisits, currentVisits: visits[pageName] };
};

// Track page visits
export const usePageTracking = (pageName) => {
  const addEvent = useStore((s) => s.addEvent);

  useEffect(() => {
    if (!sessionStorage.getItem('fw_sessionStartedAt')) {
      sessionStorage.setItem('fw_sessionStartedAt', String(Date.now()));
      sessionStorage.setItem('fw_interactionCount', '0');
      sessionStorage.setItem('fw_pageCount', '0');
      sessionStorage.removeItem('fw_bounceSent');

      queueEvent({
        eventType: 'session_start',
        page: pageName,
        sessionId: getSessionId(),
      });
    }

    const pageStartedAt = Date.now();
    const { previousVisits, currentVisits } = incrementPageVisit(pageName);
    const isRepeatedVisit = previousVisits > 0;
    const isReturnVisit = localStorage.getItem('fw_hasVisitedBefore') === 'true'
      && sessionStorage.getItem('fw_returnVisitSent') !== 'true';

    const event = {
      type: 'page_view',
      page: pageName,
      timestamp: new Date().toISOString(),
      id: Date.now(),
    };
    addEvent(event);

    // Send to backend
    queueEvent({
      eventType: 'page_view',
      page: pageName,
      sessionId: getSessionId(),
      metadata: {
        visitCount: currentVisits,
        repeatedVisit: isRepeatedVisit,
      },
    });

    if (isRepeatedVisit) {
      queueEvent({
        eventType: 'repeated_page_visit',
        page: pageName,
        sessionId: getSessionId(),
        metadata: { visitCount: currentVisits },
      });
    }

    if (isReturnVisit) {
      sessionStorage.setItem('fw_returnVisitSent', 'true');
      queueEvent({
        eventType: 'return_visit',
        page: pageName,
        sessionId: getSessionId(),
        metadata: { lastSeenAt: localStorage.getItem('fw_lastSeenAt') },
      });
    }

    localStorage.setItem('fw_hasVisitedBefore', 'true');
    localStorage.setItem('fw_lastSeenAt', new Date().toISOString());

    return () => {
      const duration = Math.round((Date.now() - pageStartedAt) / 1000);
      if (duration > 1) {
        queueEvent({
          eventType: 'time_spent',
          page: pageName,
          sessionId: getSessionId(),
          duration,
          metadata: { duration },
        });
      }
    };
  }, [pageName, addEvent]);
};

// Track button clicks
export const useClickTracking = () => {
  const addEvent = useStore((s) => s.addEvent);

  const trackClick = useCallback((element, metadata = {}) => {
    markInteraction();

    const event = {
      type: 'button_click',
      element,
      timestamp: new Date().toISOString(),
      id: Date.now(),
      ...metadata,
    };
    addEvent(event);

    // Send to backend
    queueEvent({
      eventType: 'button_click',
      element,
      page: metadata.page || null,
      sessionId: getSessionId(),
      metadata,
    });
  }, [addEvent]);

  return trackClick;
};

// Track scroll depth
export const useScrollDepth = () => {
  const addEvent = useStore((s) => s.addEvent);
  const maxDepth = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;

      const scrollPercent = Math.min(100, Math.round((window.scrollY / scrollableHeight) * 100));
      const crossedMilestone = [25, 50, 75, 100].find(
        (milestone) => scrollPercent >= milestone && maxDepth.current < milestone
      );

      if (crossedMilestone) {
        maxDepth.current = crossedMilestone;
        markInteraction();
        addEvent({
          type: 'scroll_depth',
          depth: `${crossedMilestone}%`,
          timestamp: new Date().toISOString(),
          id: Date.now(),
        });

        // Send to backend
        queueEvent({
          eventType: 'scroll_depth',
          sessionId: getSessionId(),
          scrollDepth: crossedMilestone,
          metadata: { depth: crossedMilestone },
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [addEvent]);
};

// Advanced Interaction Tracking (Hover, Focus, Idle, Mouse)
export const useInteractionTracking = () => {
  const addEvent = useStore((s) => s.addEvent);
  const lastActivity = useRef(Date.now());
  const mouseMoves = useRef(0);
  const clickHistory = useRef([]);
  const idleReported = useRef(false);
  const idleTimer = useRef(null);

  const markActive = useCallback(() => {
    lastActivity.current = Date.now();
    idleReported.current = false;
  }, []);

  const reportIdle = useCallback(() => {
    const idleTime = Math.round((Date.now() - lastActivity.current) / 1000);
    if (idleTime >= 30 && !idleReported.current) {
      idleReported.current = true;
      queueEvent({
        eventType: 'inactive_session',
        sessionId: getSessionId(),
        duration: idleTime,
        metadata: { idleTime, threshold: 30 },
      });
    }
  }, []);

  useEffect(() => {
    let mouseTimeout;
    const handleMouseMove = () => {
      markActive();
      mouseMoves.current += 1;
      
      if (!mouseTimeout) {
        mouseTimeout = setTimeout(() => {
          if (mouseMoves.current % 75 === 0) {
            queueEvent({
              eventType: 'mouse_movement',
              sessionId: getSessionId(),
              metadata: { moveCount: mouseMoves.current },
            });
          }
          mouseTimeout = null;
        }, 2000);
      }
    };

    const getTargetName = (target) => {
      const element = target.closest('button, a, [role="button"], input, select, textarea');
      if (!element) return null;
      return element.id || element.name || element.getAttribute('aria-label') || element.innerText || element.tagName;
    };

    const handleClick = (e) => {
      markActive();
      markInteraction();

      const targetName = getTargetName(e.target);
      if (!targetName) return;

      const now = Date.now();
      clickHistory.current = [
        ...clickHistory.current.filter((entry) => now - entry.timestamp <= 1500),
        { targetName, timestamp: now },
      ];

      const rapidClicks = clickHistory.current.filter((entry) => entry.targetName === targetName);
      if (rapidClicks.length >= 4) {
        addEvent({
          type: 'rapid_click',
          element: targetName,
          timestamp: new Date().toISOString(),
          id: now,
        });

        queueEvent({
          eventType: 'rapid_click',
          element: targetName,
          sessionId: getSessionId(),
          metadata: { clickCount: rapidClicks.length, windowMs: 1500 },
        });

        clickHistory.current = [];
      }
    };

    const handleHover = (e) => {
      const target = e.target.closest('button, a, input, select');
      if (target) {
        markActive();
        queueEvent({
          eventType: 'hover',
          sessionId: getSessionId(),
          metadata: { element: target.innerText || target.name || target.id, tag: target.tagName },
        });
      }
    };

    const handleFocus = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        markActive();
        markInteraction();
        queueEvent({
          eventType: 'field_focus',
          sessionId: getSessionId(),
          metadata: { element: e.target.name || e.target.id, tag: e.target.tagName },
        });
      }
    };

    const handleBlur = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        markActive();
        queueEvent({
          eventType: 'field_blur',
          sessionId: getSessionId(),
          metadata: { element: e.target.name || e.target.id },
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick, true);
    window.addEventListener('mouseover', handleHover, { passive: true });
    window.addEventListener('focusin', handleFocus, { passive: true });
    window.addEventListener('focusout', handleBlur, { passive: true });

    idleTimer.current = setInterval(reportIdle, 10000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('mouseover', handleHover);
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
      if (mouseTimeout) clearTimeout(mouseTimeout);
      clearInterval(idleTimer.current);
    };
  }, [addEvent, markActive, reportIdle]);
};

// Track session duration
export const useSessionTimer = () => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return { duration, formatted: formatDuration(duration) };
};

// Track form abandonment
export const useFormTracking = (formName) => {
  const addEvent = useStore((s) => s.addEvent);
  const started = useRef(false);

  const trackFormStart = useCallback(() => {
    if (!started.current) {
      started.current = true;
      markInteraction();
      addEvent({ type: 'form_start', form: formName, timestamp: new Date().toISOString(), id: Date.now() });

      queueEvent({
        eventType: 'form_start',
        sessionId: getSessionId(),
        metadata: { form: formName },
      });
    }
  }, [formName, addEvent]);

  const trackFormComplete = useCallback(() => {
    started.current = false; // Prevent abandon event on unmount
    markInteraction();
    addEvent({ type: 'form_complete', form: formName, timestamp: new Date().toISOString(), id: Date.now() });

    queueEvent({
      eventType: 'form_submit',
      sessionId: getSessionId(),
      metadata: { form: formName },
    });
  }, [formName, addEvent]);

  useEffect(() => {
    return () => {
      if (started.current) {
        markInteraction();
        addEvent({ type: 'form_abandon', form: formName, timestamp: new Date().toISOString(), id: Date.now() });

        queueEvent({
          eventType: 'form_abandon',
          sessionId: getSessionId(),
          metadata: { form: formName },
        });
      }
    };
  }, [formName, addEvent]);

  return { trackFormStart, trackFormComplete };
};
