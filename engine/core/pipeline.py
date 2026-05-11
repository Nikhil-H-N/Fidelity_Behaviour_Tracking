from typing import Dict, List, Optional
import time

class EventValidator:
    """Section 41: Prevent noisy data and bot-like spam."""
    @staticmethod
    def is_valid(event: Dict, session_events: List[Dict]) -> bool:
        # Reject corrupted payloads (simplified)
        if not event.get('event_type') or not event.get('page_id'):
            return False
            
        # Reject impossible timestamps
        if event.get('timestamp', 0) > time.time() + 60:
            return False

        # Duplicate event bursts (Section 41)
        if session_events:
            last_event = session_events[-1]
            if (event['event_type'] == last_event['event_type'] and 
                event['page_id'] == last_event['page_id'] and 
                event.get('element_id') == last_event.get('element_id') and
                event['timestamp'] - last_event['timestamp'] < 0.1): # 100ms
                return False

        # Bot-like spam (Section 41, 35)
        # 50 clicks in 1 second
        recent_clicks = [e for e in session_events if e['event_type'] == 'click' and event['timestamp'] - e['timestamp'] < 1.0]
        if len(recent_clicks) > 50:
            return False

        return True

class EventNormalizer:
    """Section 42: Consistent intelligence across different frontends."""
    TAXONOMY_MAP = {
        "button_click": "cta_click",
        "cta_pressed": "cta_click",
        "view": "page_visit",
        "visit": "page_visit",
        "opened_faq": "faq_open",
        "faq_click": "faq_open",
        "price_check": "pricing_view",
        "form_initiated": "form_start",
        "progress": "form_progress"
    }

    @staticmethod
    def normalize(event: Dict) -> Dict:
        etype = event.get('event_type', '').lower()
        if etype in EventNormalizer.TAXONOMY_MAP:
            event['event_type'] = EventNormalizer.TAXONOMY_MAP[etype]
        return event

class EventPrioritySystem:
    """Section 43: Not all events matter equally."""
    PRIORITY_LEVELS = {
        "page_visit": "LOW",
        "scroll": "LOW",
        "faq_open": "MEDIUM",
        "calculator_usage": "HIGH",
        "cta_click": "HIGH",
        "otp_request": "CRITICAL",
        "form_completion": "CRITICAL"
    }

    @staticmethod
    def get_priority(event_type: str) -> str:
        return EventPrioritySystem.PRIORITY_LEVELS.get(event_type, "LOW")

class ContextEnricher:
    """Section 44: Understand event meaning in context."""
    @staticmethod
    def enrich(event: Dict, session_history: List[Dict]) -> Dict:
        # Add context flags
        event['context'] = {
            "is_return_visit": any(e['event_type'] == 'return_session' for e in session_history),
            "prior_frustration": any(e['event_type'] == 'rage_click' for e in session_history),
            "session_depth": len([e for e in session_history if e['event_type'] == 'page_visit']),
            "has_pricing_context": any(e['event_type'] == 'pricing_view' for e in session_history)
        }
        return event
