from typing import Dict, List
import time

# GEMINI.md Standard Weights
POSITIVE_SIGNALS = {
    "page_visit": 2,
    "repeat_page_visit": 8,
    "deep_navigation": 10,
    "category_exploration": 6,
    "multi_page_session": 7,
    "return_session": 25,
    "long_dwell_time": 12,
    "very_long_dwell_time": 20,
    "cta_click": 15,
    "multiple_cta_click": 22,
    "cta_hover": 4,
    "faq_open": 5,
    "faq_repeat": 8,
    "content_expansion": 4,
    "section_revisit": 6,
    "comparison_view": 12,
    "pricing_view": 15,
    "calculator_usage": 18,
    "search_usage": 8,
    "filter_usage": 4,
    "download_resource": 15,
    "bookmark_action": 12,
    "video_completion": 10,
    "scroll_completion": 8,
    "form_start": 20,
    "form_progress": 10,
    "otp_request": 30,
    "plan_selection": 25,
    "save_progress": 15,
    "form_completion": 40,
    "security_page_view": 10  # Trust signal
}

NEGATIVE_SIGNALS = {
    "quick_exit": -20,
    "no_interaction_session": -25,
    "single_page_bounce": -18,
    "cta_hover_no_click": -6,
    "long_pause_before_cta": -5,
    "revisit_without_action": -10,
    "form_pause": -12,
    "rage_click": -18,
    "spam_click": -12,
    "dead_click": -8,
    "repeated_validation_failure": -15,
    "navigation_loop": -14,
    "excessive_back": -10,
    "scroll_oscillation": -8,
    "tab_switch_abandonment": -12,
    "idle_timeout": -20,
    "form_abandonment": -25,
    "exit_near_conversion": -30,
    "pricing_exit": -15
}

class BehaviorScorer:
    def __init__(self, config):
        self.config = config

    def calculate_intent_score(self, events: List[Dict]) -> float:
        """
        Formula:
        Final Intent Score = Positive Signals + Momentum Score + Session Continuity Bonus 
                           + Recency Weight - Friction Penalty - Dropoff Penalty - Frustration Penalty
        Clamped 0-100.
        """
        if not events:
            return 0.0

        now = time.time()
        pos_score = 0.0
        neg_score = 0.0
        friction_penalty = 0.0
        
        for e in events:
            etype = e.get('event_type')
            timestamp = e.get('timestamp', now)
            
            # 1. Behavior Decay System (Section 50, 76)
            # Fresh behavior matters more.
            age_seconds = now - timestamp
            decay_factor = 1.0
            if age_seconds > 86400 * 30: # 30 days
                decay_factor = 0.2
            elif age_seconds > 86400 * 7: # 7 days
                decay_factor = 0.7
            elif age_seconds > 86400: # 1 day
                decay_factor = 0.95
            
            p_val = POSITIVE_SIGNALS.get(etype, 0)
            n_val = NEGATIVE_SIGNALS.get(etype, 0)
            
            pos_score += p_val * decay_factor
            neg_score += abs(n_val) * decay_factor

            # 2. Friction Penalty Engine (Section 53)
            if etype in ["rage_click", "repeated_validation_failure", "dead_click"]:
                friction_penalty += 5.0 # Additional penalty for friction events

        # 3. Momentum Score (Section 32, 48)
        momentum = self.calculate_momentum(events)
        momentum_bonus = momentum * 15.0

        # 4. Session Continuity Bonus (Section 51)
        # If they returned in a new session (detected via some logic, for now simple return_session event)
        continuity_bonus = sum([POSITIVE_SIGNALS.get("return_session") for e in events if e.get('event_type') == "return_session"])

        # 6. Persistence Bonus (Section 102)
        # Check if events span multiple days
        persistence_bonus = 0
        if len(events) > 1:
            first_time = events[0]['timestamp']
            last_time = events[-1]['timestamp']
            days_diff = (last_time - first_time) / 86400
            if days_diff > 1:
                persistence_bonus = min(20, days_diff * 5) # Persistence bonus

        final_score = (pos_score - neg_score) + momentum_bonus + continuity_bonus + persistence_bonus - friction_penalty
        
        # 5. Score Multipliers (Section 52)
        # 3+ aligned behaviors (e.g., calculator + pricing + cta)
        has_calculator = any(e['event_type'] == 'calculator_usage' for e in events)
        has_pricing = any(e['event_type'] == 'pricing_view' for e in events)
        has_cta = any(e['event_type'] == 'cta_click' for e in events)
        
        if has_calculator and has_pricing and has_cta:
            final_score *= 1.4
        elif (has_calculator and has_pricing) or (has_pricing and has_cta):
            final_score *= 1.2

        return max(0, min(100, final_score))

    def calculate_momentum(self, events: List[Dict]) -> float:
        """Measure if engagement is increasing or decreasing."""
        if len(events) < 5: return 0.0
        
        recent = events[-5:]
        older = events[:-5][-10:] # last 10 before recent
        
        def get_avg_signal(evs):
            if not evs: return 0.0
            signals = [POSITIVE_SIGNALS.get(e['event_type'], 0) for e in evs]
            return sum(signals) / len(evs)
            
        recent_val = get_avg_signal(recent)
        older_val = get_avg_signal(older)
        
        # Momentum = recent_positive - recent_negative (simplified here as diff in avg positive signals)
        return (recent_val - older_val) / 20.0 # Normalized

    def calculate_trust_score(self, events: List[Dict]) -> str:
        """Detects trust barriers based on research behavior (Section 99)."""
        trust_signals = ["faq_open", "security_page_view", "scroll_completion", "return_session", "long_dwell_time"]
        distrust_signals = ["pricing_exit", "quick_exit", "rage_click", "long_pause_before_cta"]
        
        score = sum([1 for e in events if e['event_type'] in trust_signals])
        penalty = sum([1 for e in events if e['event_type'] in distrust_signals])
        
        total = score - penalty
        if total >= 5: return "HIGH"
        if total >= 2: return "MEDIUM"
        if total <= -2: return "DISTYUSTED" # Section 99 mentions negative trust
        return "LOW"
