from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .core.session_manager import SessionManager, Event
from .core.brain import DecisionBrain
from .admin.api import create_admin_router
import uvicorn

app = FastAPI(
    title="Smart Behavioral Tracking Engine (SBTE)",
    description="Enterprise-grade behavioral intelligence for fintech platforms.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Components
session_manager = SessionManager()
brain = DecisionBrain(session_manager.config)

# Include Admin Routes
app.include_router(create_admin_router(session_manager))

@app.get("/")
async def health_check():
    return {
        "status": "online",
        "engine": "Behavioral Intelligence v1.0",
        "active_sessions": len(session_manager.sessions)
    }

from .core.pipeline import EventValidator, EventNormalizer
# ... existing code ...

@app.post("/analyze")
async def analyze_interaction(event: Event):
    """
    Primary endpoint for real-time interaction tracking.
    Teammates: Ping this endpoint for every user interaction.
    """
    try:
        event_dict = event.dict()
        
        # 0. Normalization (Section 42)
        event_dict = EventNormalizer.normalize(event_dict)
        
        # 1. Store event in session with validation (Section 41)
        session = session_manager.get_or_create_session(event_dict['user_id'])
        if not EventValidator.is_valid(event_dict, session.events):
            # If invalid/bot, return intelligence based on history only
            intelligence = brain.process_new_event(session, session.events[-1] if session.events else event_dict)
            intelligence["status"] = "REJECTED_BOT_OR_NOISE"
            return intelligence

        session = session_manager.add_event(Event(**event_dict))
        
        # 2. Process with Decision Brain
        intelligence = brain.process_new_event(session, event_dict)
        
        # 3. Handle manual interventions (Section 11, 25, 37)
        # Pull interventions from session and attach to response
        intelligence["interventions"] = session.pop_interventions()
        
        # Flatten for standard response
        return intelligence
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
