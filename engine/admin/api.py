from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from ..core.session_manager import SessionManager
from ..core.ml_model import GlobalIntentModel, GlobalSegmentationModel
from typing import Dict, List, Any, Optional
import random
import asyncio
import os
import smtplib
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path

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
    title: str = "FinovaWealth"
    channel: str = "popup"

class NotificationDispatch(BaseModel):
    user_id: str
    message: str
    title: str = "FinovaWealth"
    type: str = "INFO"
    channels: List[str] = Field(default_factory=lambda: ["popup"])
    reason: str = "Admin Notification Engine"
    template: Optional[str] = None
    email_to: Optional[str] = None
    email_subject: Optional[str] = None
    schedule_at: Optional[str] = None

def _read_backend_env() -> Dict[str, str]:
    env_path = Path(__file__).resolve().parents[2] / "Backend" / ".env"
    values: Dict[str, str] = {}
    if not env_path.exists():
        return values

    for line in env_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if not line or line.strip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values

def _email_env(name: str, fallback: Optional[str] = None) -> Optional[str]:
    return os.getenv(name) or _read_backend_env().get(name) or fallback

def _send_email(to: str, subject: str, title: str, message: str) -> Dict[str, Any]:
    user = _email_env("EMAIL_USER")
    password = _email_env("EMAIL_PASS")
    host = _email_env("EMAIL_HOST", "smtp.gmail.com")
    port = int(_email_env("EMAIL_PORT", "587") or 587)

    if not user or not password:
        return {
            "status": "not_configured",
            "message": "EMAIL_USER and EMAIL_PASS are required for email delivery."
        }

    email = EmailMessage()
    email["From"] = f"FinovaWealth <{user}>"
    email["To"] = to
    email["Subject"] = subject
    email.set_content(message)
    email.add_alternative(f"""
    <html>
      <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <tr><td style="background:#0f172a;color:#ffffff;padding:28px 32px;">
                <h1 style="margin:0;font-size:22px;">{title}</h1>
                <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">FinovaWealth personalized update</p>
              </td></tr>
              <tr><td style="padding:32px;color:#334155;font-size:15px;line-height:1.7;">
                {message}
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>
    """, subtype="html")

    with smtplib.SMTP(host, port, timeout=20) as smtp:
        smtp.starttls()
        smtp.login(user, password)
        smtp.send_message(email)

    return {"status": "sent", "to": to}

def _queue_popup(session_manager: SessionManager, payload: Dict[str, Any]) -> Dict[str, Any]:
    user_id = payload["user_id"]
    if user_id not in session_manager.sessions:
        raise HTTPException(status_code=404, detail="User session not found")

    session = session_manager.sessions[user_id]
    session.manual_interventions.append({
        "id": f"notif_{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "type": payload.get("type", "INFO"),
        "title": payload.get("title", "FinovaWealth"),
        "reason": payload.get("reason", "Admin Notification Engine"),
        "channel": payload.get("channel", "popup"),
        "template": payload.get("template"),
        "payload": {"message": payload["message"]}
    })
    return {"status": "queued", "user_id": user_id}

async def _dispatch_notification(session_manager: SessionManager, payload: Dict[str, Any]) -> Dict[str, Any]:
    channels = set(payload.get("channels") or ["popup"])
    results: Dict[str, Any] = {}

    if "popup" in channels or "push" in channels or "in_app" in channels:
        results["popup"] = _queue_popup(session_manager, {**payload, "channel": "popup"})

    if "email" in channels:
        email_to = payload.get("email_to")
        if not email_to:
            results["email"] = {"status": "skipped", "message": "No recipient email supplied."}
        else:
            try:
                results["email"] = _send_email(
                    email_to,
                    payload.get("email_subject") or payload.get("title") or "FinovaWealth update",
                    payload.get("title") or "FinovaWealth",
                    payload["message"],
                )
            except Exception as exc:
                results["email"] = {"status": "failed", "message": str(exc)}

    return results

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
        return _queue_popup(session_manager, intervention.model_dump())

    @router.post("/notification/dispatch")
    async def dispatch_notification(notification: NotificationDispatch):
        """Send a targeted popup/push/email to one selected user session."""
        payload = notification.model_dump()

        if payload["user_id"] not in session_manager.sessions:
            raise HTTPException(status_code=404, detail="User session not found")

        if payload.get("schedule_at"):
            try:
                schedule_at = datetime.fromisoformat(payload["schedule_at"].replace("Z", "+00:00"))
                if schedule_at.tzinfo is None:
                    schedule_at = schedule_at.replace(tzinfo=timezone.utc)
                delay = max(0, (schedule_at - datetime.now(timezone.utc)).total_seconds())
            except ValueError:
                raise HTTPException(status_code=400, detail="schedule_at must be an ISO datetime")

            async def scheduled_dispatch():
                await asyncio.sleep(delay)
                await _dispatch_notification(session_manager, payload)

            asyncio.create_task(scheduled_dispatch())
            return {
                "status": "scheduled",
                "user_id": payload["user_id"],
                "channels": payload["channels"],
                "schedule_at": payload["schedule_at"],
            }

        return {
            "status": "dispatched",
            "user_id": payload["user_id"],
            "channels": payload["channels"],
            "results": await _dispatch_notification(session_manager, payload),
        }

    @router.get("/interventions/{user_id}")
    async def poll_interventions(user_id: str):
        """Frontend polling endpoint for targeted in-app popups."""
        if user_id not in session_manager.sessions:
            return {"user_id": user_id, "interventions": []}

        session = session_manager.sessions[user_id]
        return {"user_id": user_id, "interventions": session.pop_interventions()}

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
        if not sessions:
            return {
                "total_users": 0,
                "total_events": 0,
                "avg_score": 0,
                "avg_session_duration": 0,
                "bounce_rate": 0,
                "returning_users": 0,
                "event_counts": {},
                "behavioral_distribution": {},
                "clustering_segments": {},
                "rapid_clicks": 0,
                "inactive_sessions": 0,
                "mouse_movement_events": 0,
                "repeated_page_visits": 0,
                "global_model_status": "active"
            }
        states_count = {}
        segment_count = {}
        event_counts = {}
        total_score = 0
        total_conv_prob = 0
        total_events = 0
        total_duration = 0
        bounced_sessions = 0
        returning_users = 0
        inactive_sessions = 0
        rapid_clicks = 0
        mouse_movement_events = 0
        repeated_page_visits = 0

        for s in sessions:
            metrics = s.session_metrics()
            states_count[s.intent_state] = states_count.get(s.intent_state, 0) + 1
            persona = seg_model.get_persona(s.events)
            segment_count[persona] = segment_count.get(persona, 0) + 1
            total_score += s.total_score
            total_conv_prob += s.metadata.get('conversion_probability', 0)
            total_events += len(s.events)
            total_duration += metrics['total_duration']
            bounced_sessions += 1 if metrics['bounce'] else 0
            returning_users += 1 if metrics['returning_user'] else 0
            inactive_sessions += 1 if metrics['inactive_detected'] else 0
            rapid_clicks += metrics['rapid_clicks']
            mouse_movement_events += metrics['event_counts'].get('mouse_movement', 0)
            repeated_page_visits += metrics['repeated_page_visits']
            for event_type, count in metrics['event_counts'].items():
                event_counts[event_type] = event_counts.get(event_type, 0) + count

        return {
            "total_users": len(sessions),
            "total_events": total_events,
            "avg_score": total_score / len(sessions),
            "avg_session_duration": total_duration / len(sessions),
            "avg_conversion_probability": total_conv_prob / len(sessions),
            "bounce_rate": (bounced_sessions / len(sessions)) * 100,
            "returning_users": returning_users,
            "event_counts": event_counts,
            "rapid_clicks": rapid_clicks,
            "inactive_sessions": inactive_sessions,
            "mouse_movement_events": mouse_movement_events,
            "repeated_page_visits": repeated_page_visits,
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
        metrics = session.session_metrics()
        
        # 1. Timeline Analysis
        total_time = metrics['total_duration']
        
        # 2. Page Affinity (Which pages did they love?)
        affinity = {}
        for e in events:
            if e['event_type'] in ['page_visit', 'pricing_view', 'comparison_view', 'category_exploration']:
                affinity[e['page_id']] = affinity.get(e['page_id'], 0) + 1
        
        # 3. Engagement Metrics
        avg_scroll = sum([(e.get('scroll_depth') or 0) for e in events]) / len(events) if events else 0
        total_idle = sum([(e.get('idle_time') or 0) for e in events])
        
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
                "navigation_entropy": len(affinity) / len(events) if events else 0,
                "pages_visited": len(metrics['pages_visited']),
                "navigation_steps": len(metrics['navigation_flow']),
                "bounce": metrics['bounce'],
                "returning_user": metrics['returning_user']
            },
            "top_pages": sorted(affinity.items(), key=lambda x: x[1], reverse=True),
            "psychological_flags": {
                "rage_click_detected": any(e['event_type'] == 'rage_click' for e in events),
                "high_hesitation": session.intent_state == "HESITATING",
                "churn_risk": ml_data['drop_off_prediction'] == "HIGH",
                "inactive_session": metrics['inactive_detected'],
                "bounce_detected": metrics['bounce']
            },
            "ml_intelligence": ml_data,
            "narrative": session.metadata.get('last_narrative', "No narrative generated yet."),
            "recommendations": session.metadata.get('last_recommendations', []),
            "raw_timeline_event_count": len(events),
            "events": events[-100:], # Return last 100 events for detailed timeline
            "session": {
                "session_start": metrics['session_start'],
                "session_end": metrics['session_end'],
                "total_duration": metrics['total_duration'],
                "pages_visited": metrics['pages_visited'],
                "navigation_flow": metrics['navigation_flow'],
                "event_counts": metrics['event_counts'],
                "bounce": metrics['bounce'],
                "returning_user": metrics['returning_user'],
                "rapid_clicks": metrics['rapid_clicks'],
                "inactive_detected": metrics['inactive_detected'],
                "mouse_movement_count": metrics['mouse_movement_count'],
                "repeated_page_visits": metrics['repeated_page_visits'],
            },
            "replay_timeline": metrics['replay_timeline']
        }

    return router
