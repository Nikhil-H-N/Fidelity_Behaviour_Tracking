from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from ..core.session_manager import SessionManager
from ..core.ml_model import GlobalIntentModel, GlobalSegmentationModel
from typing import Dict, List, Any, Optional
import random

class ConfigUpdate(BaseModel):
    page_weights: Optional[Dict[str, float]] = None
    action_weights: Optional[Dict[str, float]] = None
    detectors_enabled: Optional[Dict[str, bool]] = None
    score_thresholds: Optional[Dict[str, float]] = None

class ManualIntervention(BaseModel):
    user_id: str
    type: str
    message: str
    reason: str = "Admin Manual Trigger"

def create_admin_router(session_manager: SessionManager):
    router = APIRouter(prefix="/admin", tags=["Admin Control Panel"])
    global_model = GlobalIntentModel()
    seg_model = GlobalSegmentationModel()

    @router.get("/active-users")
    async def get_active_users():
        results = []
        # Sort sessions by last_active descending
        sorted_sessions = sorted(session_manager.sessions.items(), key=lambda x: x[1].last_active, reverse=True)
        for uid, session in sorted_sessions:
            data = session.to_dict()
            data['persona'] = seg_model.get_persona(session.events)
            data['metadata'] = session.metadata
            results.append(data)
        return results

    # --- NEW CONTROL ENDPOINTS ---

    @router.get("/config")
    async def get_config():
        """View current engine weights and detector settings."""
        return {
            "page_weights": session_manager.config.page_weights,
            "action_weights": session_manager.config.action_weights,
            "detectors_enabled": session_manager.config.detectors_enabled,
            "score_thresholds": session_manager.config.score_thresholds
        }

    @router.post("/config/update")
    async def update_config(update: ConfigUpdate):
        """Dynamically update engine parameters without restart."""
        session_manager.config.update(update.model_dump(exclude_none=True))
        return {"status": "success", "new_config": await get_config()}

    @router.post("/manual-intervention")
    async def trigger_manual_intervention(intervention: ManualIntervention):
        """Force a specific message/popup to a live user."""
        if intervention.user_id not in session_manager.sessions:
            raise HTTPException(status_code=404, detail="User session not found")
        
        session = session_manager.sessions[intervention.user_id]
        session.manual_interventions.append({
            "type": intervention.type,
            "reason": intervention.reason,
            "payload": {"message": intervention.message}
        })
        return {"status": "queued", "user_id": intervention.user_id}

    @router.delete("/session/{user_id}")
    async def delete_user_session(user_id: str):
        """Immediately clear a specific user's history and state."""
        session_manager.delete_session(user_id)
        return {"status": "deleted", "user_id": user_id}

    @router.post("/reset-all-sessions")
    async def reset_all_sessions():
        """Clear all active user data from the engine."""
        session_manager.sessions.clear()
        return {"status": "engine_reset_complete"}

    # --- ML & ANALYTICS ---

    @router.post("/train-global-model")
    async def train_global_model(background_tasks: BackgroundTasks):
        all_sessions = [s.events for s in session_manager.sessions.values()]
        if not all_sessions:
            return {"status": "error", "message": "No sessions available for training."}
        labels = [1 if random.random() > 0.7 else 0 for _ in range(len(all_sessions))]
        background_tasks.add_task(global_model.train_on_global_data, all_sessions, labels)
        background_tasks.add_task(seg_model.fit_segments, all_sessions)
        return {"status": "training_started", "session_count": len(all_sessions)}

    @router.get("/analytics/summary")
    async def get_analytics_summary():
        sessions = list(session_manager.sessions.values())
        if not sessions: return {"total_users": 0, "avg_score": 0, "states": {}}
        states_count = {}
        segment_count = {}
        total_score = 0
        total_conv_prob = 0
        for s in sessions:
            states_count[s.intent_state] = states_count.get(s.intent_state, 0) + 1
            persona = seg_model.get_persona(s.events)
            segment_count[persona] = segment_count.get(persona, 0) + 1
            total_score += s.total_score
            total_conv_prob += s.metadata.get('conversion_probability', 0)
        return {
            "total_users": len(sessions),
            "avg_score": total_score / len(sessions),
            "avg_conversion_probability": total_conv_prob / len(sessions),
            "behavioral_distribution": states_count,
            "clustering_segments": segment_count,
            "global_model_status": "active"
        }

    @router.get("/user-report/{user_id}")
    async def get_deep_user_report(user_id: str):
        """Generates an exhaustive, 'Google Hackathon' level behavioral dossier for a user."""
        if user_id not in session_manager.sessions:
            raise HTTPException(status_code=404, detail="User not found")
        
        session = session_manager.sessions[user_id]
        events = session.events
        
        # 1. Timeline Analysis
        total_time = events[-1]['timestamp'] - events[0]['timestamp'] if events else 0
        
        # 2. Page Affinity (Which pages did they love?)
        affinity = {}
        for e in events:
            if e['event_type'] == 'view':
                affinity[e['page_id']] = affinity.get(e['page_id'], 0) + 1
        
        # 3. Engagement Metrics
        avg_scroll = sum([e.get('scroll_depth', 0) for e in events]) / len(events) if events else 0
        total_idle = sum([e.get('idle_time', 0) for e in events])
        
        # 4. ML Intelligence & Narrative
        ml_data = global_model.predict_conversion_probability(events)
        
        return {
            "summary": {
                "user_id": user_id,
                "session_duration_sec": total_time,
                "overall_score": session.total_score,
                "final_intent": session.intent_state,
                "persona": seg_model.get_persona(events)
            },
            "engagement_metrics": {
                "avg_scroll_depth": f"{avg_scroll:.1f}%",
                "active_ratio": f"{((total_time - total_idle) / total_time * 100):.1f}%" if total_time > 0 else "0%",
                "total_idle_time_sec": total_idle,
                "navigation_entropy": len(affinity) / len(events) if events else 0
            },
            "top_pages": sorted(affinity.items(), key=lambda x: x[1], reverse=True),
            "psychological_flags": {
                "rage_click_detected": any(e['event_type'] == 'rage_click' for e in events),
                "high_hesitation": session.intent_state == "HESITATING",
                "churn_risk": ml_data['drop_off_prediction'] == "HIGH"
            },
            "ml_intelligence": ml_data,
            "narrative": session.metadata.get('last_narrative', "No narrative generated yet."),
            "recommendations": session.metadata.get('last_recommendations', []),
            "raw_timeline_event_count": len(events),
            "events": events[-100:] # Return last 100 events for detailed timeline
        }

    return router
