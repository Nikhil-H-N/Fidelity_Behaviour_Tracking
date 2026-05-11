# Integration Guide for Teammates

## 1. Frontend Integration (User Website)

The Decision Engine expects a POST request for every interaction.

**Endpoint:** `POST /analyze`

### Example JavaScript Tracker:
```javascript
const trackEvent = async (userId, eventType, pageId, elementId = null) => {
  const response = await fetch('http://your-engine-url/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      event_type: eventType, // 'view', 'click', 'form_start'
      page_id: pageId,       // 'sip_plans', 'dashboard', etc.
      element_id: elementId, // ID of the button clicked (optional)
      timestamp: Date.now() / 1000
    })
  });
  
  const data = await response.json();
  
  // Handle interventions
  if (data.interventions.length > 0) {
    data.interventions.forEach(trigger => {
      console.log(`Triggering ${trigger.type}: ${trigger.payload.message}`);
      // Show your UI components (popups, tooltips) here
    });
  }
};
```

---

## 2. Frontend Integration (Admin Dashboard) - MASTER CONTROL

The Admin Panel has full control over the engine logic and live users.

### A. Engine Configuration
Admins can dynamically adjust weights and toggle detectors without restarting.

**Endpoint:** `POST /admin/config/update`
```json
{
  "page_weights": { "sip_plans": 15.0 },
  "detectors_enabled": { "ml_intent": false },
  "score_thresholds": { "high_intent": 100 }
}
```

### B. Manual Interventions
Admins can force-trigger a specific message to a live user.

**Endpoint:** `POST /admin/manual-intervention`
```json
{
  "user_id": "user123",
  "type": "POPUP",
  "message": "Special 1-on-1 consultation offer for you!",
  "reason": "Admin manually nudging high-value lead"
}
```

### C. Live Monitoring & Management
- `GET /admin/active-users`: Get live users with **Persona** and **ML Conversion Probability**.
- `DELETE /admin/session/{user_id}`: Kick a user and clear their state.
- `POST /admin/reset-all-sessions`: Complete engine wipe.
- `POST /admin/train-global-model`: Trigger the global ML learning cycle.

---

## 3. Database Schema Recommendations

If storing events in the DB, use the following structure:

### Events Table
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| user_id | String | User Identifier |
| page_id | String | Page visited |
| action | String | Click, View, etc. |
| timestamp | DateTime | When it happened |

### Behavioral_Insights Table
| Field | Type | Description |
|-------|------|-------------|
| user_id | String | Reference |
| current_state | String | HIGH_INTENT, HESITATING, etc. |
| score | Float | Cumulative interest score |
| last_intervention | String | Name of the last trigger shown |
