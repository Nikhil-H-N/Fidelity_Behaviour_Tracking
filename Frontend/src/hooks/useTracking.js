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

// Track page visits
export const usePageTracking = (pageName) => {
  const addEvent = useStore((s) => s.addEvent);

  useEffect(() => {
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
    });
  }, [pageName, addEvent]);
};

// Track button clicks
export const useClickTracking = () => {
  const addEvent = useStore((s) => s.addEvent);

  const trackClick = useCallback((element, metadata = {}) => {
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
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollPercent > maxDepth.current && (scrollPercent % 10 === 0 || scrollPercent === 100)) {
        maxDepth.current = scrollPercent;
        addEvent({
          type: 'scroll_depth',
          depth: `${scrollPercent}%`,
          timestamp: new Date().toISOString(),
          id: Date.now(),
        });

        // Send to backend
        queueEvent({
          eventType: 'scroll',
          sessionId: getSessionId(),
          metadata: { depth: scrollPercent },
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
  const idleTimer = useRef(null);

  const reportIdle = useCallback(() => {
    const idleTime = Math.round((Date.now() - lastActivity.current) / 1000);
    if (idleTime > 15) { // 15s idle
      queueEvent({
        eventType: 'idle_timeout',
        sessionId: getSessionId(),
        metadata: { idle_time: idleTime },
      });
    }
  }, []);

  useEffect(() => {
    // Local debounce to avoid any scope issues
    let mouseTimeout;
    const handleMouseMove = () => {
      lastActivity.current = Date.now();
      mouseMoves.current += 1;
      
      if (!mouseTimeout) {
        mouseTimeout = setTimeout(() => {
          if (mouseMoves.current % 100 === 0) {
            queueEvent({
              eventType: 'mouse_activity',
              sessionId: getSessionId(),
              metadata: { move_count: mouseMoves.current },
            });
          }
          mouseTimeout = null;
        }, 2000);
      }
    };

    const handleHover = (e) => {
      const target = e.target.closest('button, a, input, select');
      if (target) {
        queueEvent({
          eventType: 'hover',
          sessionId: getSessionId(),
          metadata: { element: target.innerText || target.name || target.id, tag: target.tagName },
        });
      }
    };

    const handleFocus = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        queueEvent({
          eventType: 'field_focus',
          sessionId: getSessionId(),
          metadata: { element: e.target.name || e.target.id, tag: e.target.tagName },
        });
      }
    };

    const handleBlur = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        queueEvent({
          eventType: 'field_blur',
          sessionId: getSessionId(),
          metadata: { element: e.target.name || e.target.id },
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseover', handleHover, { passive: true });
    window.addEventListener('focusin', handleFocus, { passive: true });
    window.addEventListener('focusout', handleBlur, { passive: true });

    idleTimer.current = setInterval(reportIdle, 30000); // Check idle every 30s

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleHover);
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
      if (mouseTimeout) clearTimeout(mouseTimeout);
      clearInterval(idleTimer.current);
    };
  }, [reportIdle]);
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
