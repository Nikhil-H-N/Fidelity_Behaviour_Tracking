import time
from typing import Dict, List, Optional
from pydantic import BaseModel

class Event(BaseModel):
    user_id: str
    event_type: str  # click, view, form_start, form_complete, hover, scroll, blur, focus
    page_id: str
    element_id: Optional[str] = None
    dwell_time: float = 0.0
    scroll_depth: Optional[float] = 0.0 # % of page scrolled
    idle_time: Optional[float] = 0.0   # seconds spent idle
    mouse_move_count: Optional[int] = 0
    metadata: Dict = {}
    timestamp: float = time.time()

class GlobalConfig:
    def __init__(self):
        self.page_weights = {
            "landing": 1, "dashboard": 2, "sip_plans": 10,
            "insurance_plans": 10, "retirement_plans": 10,
            "checkout_form": 20, "kyc_upload": 15
        }
        self.action_weights = {
            "view": 1, "click": 2, "hover": 0.5,
            "form_start": 5, "form_complete": 50, "know_more_click": 5
        }
        self.detectors_enabled = {
            "rage_clicks": True, "circular_nav": True, "backtracking": True,
            "product_comparison": True, "onboarding_friction": True, "ml_intent": True
        }
        self.score_thresholds = {
            "high_intent": 75,
            "hesitation_visits": 3
        }

    def update(self, new_config: Dict):
        if "page_weights" in new_config: self.page_weights.update(new_config["page_weights"])
        if "action_weights" in new_config: self.action_weights.update(new_config["action_weights"])
        if "detectors_enabled" in new_config: self.detectors_enabled.update(new_config["detectors_enabled"])
        if "score_thresholds" in new_config: self.score_thresholds.update(new_config["score_thresholds"])

class SessionState:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.events: List[Dict] = []
        self.total_score: float = 0.0
        self.intent_state: str = "EXPLORING"
        self.last_active: float = time.time()
        self.metadata: Dict = {}
        self.manual_interventions: List[Dict] = [] # Interventions forced by Admin
        
    def to_dict(self):
        return {
            "user_id": self.user_id,
            "total_score": self.total_score,
            "intent_state": self.intent_state,
            "event_count": len(self.events),
            "events": self.events,
            "last_active": self.last_active,
            "manual_interventions_pending": len(self.manual_interventions)
        }

    def pop_interventions(self) -> List[Dict]:
        """Returns and clears all pending manual interventions."""
        interventions = self.manual_interventions.copy()
        self.manual_interventions = []
        return interventions

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, SessionState] = {}
        self.config = GlobalConfig()

    def get_or_create_session(self, user_id: str) -> SessionState:
        if user_id not in self.sessions:
            self.sessions[user_id] = SessionState(user_id)
        return self.sessions[user_id]

    def add_event(self, event: Event):
        session = self.get_or_create_session(event.user_id)
        session.events.append(event.model_dump())
        session.last_active = time.time()
        return session

    def delete_session(self, user_id: str):
        if user_id in self.sessions:
            del self.sessions[user_id]

    def get_all_sessions(self) -> List[Dict]:
        return [s.to_dict() for s in self.sessions.values()]

    def get_session_history(self, user_id: str) -> List[Dict]:
        if user_id in self.sessions:
            return self.sessions[user_id].events
        return []
