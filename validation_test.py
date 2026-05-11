import requests
import uuid
import time
import json

ENGINE_URL = "http://localhost:8000"

def send_interaction(user_id, event_type, page_id, element_id=None, dwell_time=0, metadata=None):
    payload = {
        "user_id": user_id,
        "event_type": event_type,
        "page_id": page_id,
        "element_id": element_id,
        "dwell_time": dwell_time,
        "metadata": metadata or {},
        "timestamp": time.time()
    }
    response = requests.post(f"{ENGINE_URL}/analyze", json=payload)
    return response.json()

def test_scenario_1_curious_explorer():
    print("\n--- Scenario 1: Curious Explorer ---")
    uid = f"curious_{uuid.uuid4().hex[:4]}"
    send_interaction(uid, "page_visit", "landing")
    send_interaction(uid, "category_exploration", "sip_plans")
    send_interaction(uid, "multi_page_session", "insurance_plans")
    res = send_interaction(uid, "faq_open", "sip_plans")
    print(json.dumps(res, indent=2))
    assert "CURIOUS_EXPLORER" in res['behavior_states']

def test_scenario_2_research_user():
    print("\n--- Scenario 2: Research User ---")
    uid = f"research_{uuid.uuid4().hex[:4]}"
    send_interaction(uid, "page_visit", "landing")
    send_interaction(uid, "page_visit", "sip_plans")
    send_interaction(uid, "pricing_view", "sip_plans")
    send_interaction(uid, "page_visit", "insurance_plans")
    send_interaction(uid, "comparison_view", "insurance_plans")
    send_interaction(uid, "calculator_usage", "insurance_plans")
    send_interaction(uid, "faq_open", "insurance_plans")
    send_interaction(uid, "faq_repeat", "insurance_plans")
    send_interaction(uid, "faq_repeat", "insurance_plans")
    res = send_interaction(uid, "faq_repeat", "insurance_plans")
    print(json.dumps(res, indent=2))
    # Should be RESEARCH_ORIENTED_USER or higher, and have RESEARCH_USER pattern
    assert any(s in res['behavior_states'] for s in ["RESEARCH_ORIENTED_USER", "INTERESTED_USER", "HIGH_INTENT_USER"])
    assert "RESEARCH_USER" in res['patterns']
    assert "CONSERVATIVE_INVESTOR" in res['personas'] or "RESEARCH_USER" in res['patterns']

def test_scenario_3_high_intent_hesitation():
    print("\n--- Scenario 3: High Intent + Hesitation ---")
    uid = f"hesitant_{uuid.uuid4().hex[:4]}"
    send_interaction(uid, "pricing_view", "sip_plans")
    send_interaction(uid, "cta_hover", "sip_plans", "invest-now")
    send_interaction(uid, "cta_hover", "sip_plans", "invest-now")
    send_interaction(uid, "comparison_view", "sip_plans")
    send_interaction(uid, "cta_click", "sip_plans", "invest-now")
    # Simulate hesitation detector (3 visits to same page without conversion)
    send_interaction(uid, "page_visit", "sip_plans")
    send_interaction(uid, "page_visit", "sip_plans")
    res = send_interaction(uid, "page_visit", "sip_plans")
    print(json.dumps(res, indent=2))
    assert "HESITANT" in res['behavior_states']

def test_scenario_4_frustrated_user():
    print("\n--- Scenario 4: Frustrated User ---")
    uid = f"frustrated_{uuid.uuid4().hex[:4]}"
    for _ in range(5):
        send_interaction(uid, "rage_click", "checkout_form", "submit-btn")
    send_interaction(uid, "repeated_validation_failure", "checkout_form")
    res = send_interaction(uid, "excessive_back", "checkout_form")
    print(json.dumps(res, indent=2))
    assert "FRUSTRATED" in res['behavior_states']
    assert res['frustration_risk'] == "HIGH"

def test_scenario_5_almost_converted():
    print("\n--- Scenario 5: Almost Converted ---")
    uid = f"almost_{uuid.uuid4().hex[:4]}"
    send_interaction(uid, "otp_request", "checkout_form")
    send_interaction(uid, "form_progress", "checkout_form", metadata={"progress": 85})
    res = send_interaction(uid, "exit_near_conversion", "checkout_form")
    print(json.dumps(res, indent=2))
    assert "NEARLY_CONVERTED_USER" in res['behavior_states']
    assert "ALMOST_CONVERTED" in res['patterns']
    assert res['dropoff_risk'] in ["HIGH", "CRITICAL"]

if __name__ == "__main__":
    time.sleep(2) # Wait for engine to start
    try:
        test_scenario_1_curious_explorer()
        test_scenario_2_research_user()
        test_scenario_3_high_intent_hesitation()
        test_scenario_4_frustrated_user()
        test_scenario_5_almost_converted()
        print("\nALL SCENARIOS PASSED!")
    except Exception as e:
        print(f"\nTEST FAILED: {str(e)}")
