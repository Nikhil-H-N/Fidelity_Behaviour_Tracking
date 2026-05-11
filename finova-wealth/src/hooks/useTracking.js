import { useEffect, useCallback, useRef, useState } from 'react';
import useStore from '../store/useStore';

// Track page visits
export const usePageTracking = (pageName) => {
  const addEvent = useStore((s) => s.addEvent);
  
  useEffect(() => {
    addEvent({
      type: 'page_view',
      page: pageName,
      timestamp: new Date().toISOString(),
      id: Date.now(),
    });
  }, [pageName, addEvent]);
};

// Track button clicks
export const useClickTracking = () => {
  const addEvent = useStore((s) => s.addEvent);
  
  const trackClick = useCallback((element, metadata = {}) => {
    addEvent({
      type: 'button_click',
      element,
      timestamp: new Date().toISOString(),
      id: Date.now(),
      ...metadata,
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
      
      if (scrollPercent > maxDepth.current && scrollPercent % 25 === 0) {
        maxDepth.current = scrollPercent;
        addEvent({
          type: 'scroll_depth',
          depth: `${scrollPercent}%`,
          timestamp: new Date().toISOString(),
          id: Date.now(),
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [addEvent]);
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
    }
  }, [formName, addEvent]);

  const trackFormComplete = useCallback(() => {
    addEvent({ type: 'form_complete', form: formName, timestamp: new Date().toISOString(), id: Date.now() });
  }, [formName, addEvent]);

  useEffect(() => {
    return () => {
      if (started.current) {
        addEvent({ type: 'form_abandon', form: formName, timestamp: new Date().toISOString(), id: Date.now() });
      }
    };
  }, [formName, addEvent]);

  return { trackFormStart, trackFormComplete };
};
