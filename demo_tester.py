import requests
import uuid
import time
import os

# Configuration
ENGINE_URL = "http://localhost:8000"
USER_ID = f"demo_user_{uuid.uuid4().hex[:6]}"

def clear_console():
    os.system('cls' if os.name == 'nt' else 'clear')

def send_interaction(event_type, page_id, element_id=None, dwell_time=0):
    payload = {
        "user_id": USER_ID,
        "event_type": event_type,
        "page_id": page_id,
        "element_id": element_id,
        "dwell_time": dwell_time,
        "timestamp": time.time()
    }
    try:
        response = requests.post(f"{ENGINE_URL}/analyze", json=payload)
        return response.json()
    except Exception as e:
        return {"error": str(e)}

def print_engine_status(data):
    print(f"\n{'='*60}")
    print(f" SBTE REAL-TIME INTELLIGENCE FEEDBACK")
    print(f"{'='*60}")
    print(f" User ID:    {data.get('user_id')}")
    print(f" State:      {', '.join(data.get('behavior_state', []))}")
    print(f" Intent:     {data.get('intent_score')} / 100")
    print(f" Momentum:   {data.get('momentum')}")
    print(f" Persona:    {', '.join(data.get('personas', ['Passive Browser']))}")
    
    print(f"\n JOURNEY NARRATIVE:")
    print(f" \"{data.get('narrative')}\"")
    
    interventions = data.get('interventions', [])
    if interventions:
        print(f"\n [!] TRIGGERED INTERVENTION:")
        for i in interventions:
            print(f"  - {i['type']}: {i['payload']['message']} (Reason: {i['reason']})")
            
    print(f"{'='*60}\n")

def main():
    clear_console()
    print("Welcome to the SBTE Behavioral Demo!")
    print("We are simulating a user browsing a Fidelity-like Finance Site.")
    print(f"Your Session ID: {USER_ID}\n")
    
    pages = {
        "1": ("page_visit", "landing", None, "Visit Landing Page"),
        "2": ("page_visit", "sip_plans", None, "Explore SIP Investment Plans"),
        "3": ("pricing_view", "sip_plans", None, "View SIP Pricing (High Intent)"),
        "4": ("calculator_usage", "sip_plans", None, "Use SIP Calculator (Section 52 Multiplier)"),
        "5": ("faq_open", "sip_plans", None, "Read FAQ (Research)"),
        "6": ("cta_click", "sip_plans", "invest-btn", "Click 'Invest Now' CTA"),
        "7": ("view", "checkout_form", None, "Go to Checkout / Onboarding"),
        "8": ("rage_click", "checkout_form", "submit-btn", "Rage Click Submit (Simulate Friction)"),
        "9": ("otp_request", "checkout_form", None, "Request OTP (Critical Stage)"),
        "q": (None, None, None, "Quit Demo")
    }

    while True:
        print("What would you like to do?")
        for k, v in pages.items():
            print(f" [{k}] {v[3]}")
        
        choice = input("\nSelect an action: ").lower()
        
        if choice == 'q':
            break
        
        if choice in pages:
            etype, pid, eid, desc = pages[choice]
            
            # Special case for rage clicking simulation
            count = 5 if choice == '6' else 1
            
            print(f"\n>>> Simulating: {desc}...")
            
            for _ in range(count):
                res = send_interaction(etype, pid, eid)
                if count > 1: time.sleep(0.1) # Rapid clicks
            
            if "error" in res:
                print(f"Error connecting to engine: {res['error']}")
                print("Make sure you ran 'python -m engine.main' in another terminal!")
                break
            
            print_engine_status(res)
        else:
            print("Invalid choice.")

if __name__ == "__main__":
    main()
