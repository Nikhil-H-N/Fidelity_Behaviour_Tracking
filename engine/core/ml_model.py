import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
import joblib
import os
from typing import List, Dict

class GlobalIntentModel:
    def __init__(self, model_path: str = "engine/utils/global_intent.joblib"):
        self.model_path = model_path
        self.model = self._load_model()
        
    def _load_model(self):
        if os.path.exists(self.model_path):
            return joblib.load(self.model_path)
        # Fallback: Simple initialized model if none exists
        return RandomForestClassifier(n_estimators=100)

    def extract_features(self, session_events: List[Dict]) -> Dict:
        """Section 64: Converts a user session into a feature vector for the ML model."""
        if not session_events:
            return {f: 0 for f in ["session_duration", "total_clicks", "cta_clicks", "faq_count", "pricing_views", "calculator_usage", "revisit_count", "hesitation_score", "frustration_score", "momentum_score", "navigation_depth", "avg_pause_time", "scroll_completion", "form_progress", "interaction_density", "conversion_distance"]}
            
        df = pd.DataFrame(session_events)
        
        # 15+ Advanced Features (Section 13, 64)
        duration = session_events[-1]['timestamp'] - session_events[0]['timestamp']
        total_clicks = len(df[df['event_type'].isin(['click', 'cta_click', 'rage_click'])])
        cta_clicks = len(df[df['event_type'] == 'cta_click'])
        faq_count = len(df[df['event_type'] == 'faq_open'])
        pricing_views = len(df[df['event_type'] == 'pricing_view'])
        calculator_usage = 1 if any(e['event_type'] == 'calculator_usage' for e in session_events) else 0
        revisit_count = len(df[df['event_type'] == 'section_revisit'])
        
        # Scoring proxies
        hesitation_score = len(df[df['event_type'] == 'cta_hover']) / (total_clicks + 1)
        frustration_score = len(df[df['event_type'] == 'rage_click']) / (len(df) + 1)
        
        navigation_depth = df['page_id'].nunique()
        scroll_completion = df['scroll_depth'].max() if 'scroll_depth' in df else 0
        
        form_progress = 0
        if 'metadata' in df and not df[df['event_type'] == 'form_progress'].empty:
            form_progress = df[df['event_type'] == 'form_progress']['metadata'].apply(lambda x: x.get('progress', 0) if isinstance(x, dict) else 0).max()
        
        # New Section 13 features
        interaction_density = len(session_events) / max(0.1, duration / 60.0)
        time_between_clicks = duration / max(1, total_clicks)
        
        # Conversion Distance (Events since form_start)
        conversion_distance = 0
        if any(e['event_type'] == 'form_start' for e in session_events):
            start_idx = next(i for i, e in enumerate(session_events) if e['event_type'] == 'form_start')
            conversion_distance = len(session_events) - start_idx
            
        return {
            "session_duration": duration,
            "total_clicks": total_clicks,
            "cta_clicks": cta_clicks,
            "faq_count": faq_count,
            "pricing_views": pricing_views,
            "calculator_usage": calculator_usage,
            "revisit_count": revisit_count,
            "hesitation_score": hesitation_score,
            "frustration_score": frustration_score,
            "navigation_depth": navigation_depth,
            "scroll_completion": scroll_completion,
            "form_progress": form_progress,
            "interaction_density": interaction_density,
            "time_between_clicks": time_between_clicks,
            "conversion_distance": conversion_distance
        }

    def predict_conversion_probability(self, session_events: List[Dict]) -> Dict:
        """Section 65, 69: Predicts conversion probability with explainability."""
        features = self.extract_features(session_events)
        
        # Mock ML Model logic based on Feature Importance (Section 70)
        prob = 0.1
        reasons = []
        
        if features['calculator_usage'] > 0: 
            prob += 0.25
            reasons.append("calculator_usage = strong signal")
        if features['pricing_views'] > 0: 
            prob += 0.2
            reasons.append("pricing_page = strong signal")
        if features['cta_clicks'] >= 2: 
            prob += 0.15
            reasons.append("multiple_cta = strong signal")
        if features['form_progress'] > 50: 
            prob += 0.3
            reasons.append("form_progress = medium signal")
            
        prob = min(0.99, prob)
        
        # Section 65 Predictions
        drop_off_prediction = "HIGH" if features['frustration_score'] > 0.3 or features['interaction_density'] < 1 else "LOW"
        re_engagement_need = "YES" if prob > 0.5 and any(e['event_type'] in ['form_abandonment', 'exit_near_conversion'] for e in session_events) else "NO"
        churn_prediction = features['frustration_score'] * 0.8 + (1 - prob) * 0.2
        next_action = self.predict_next_action(session_events, features, prob)
        
        return {
            "conversion_probability": prob,
            "drop_off_prediction": drop_off_prediction,
            "re_engagement_need": re_engagement_need,
            "churn_prediction": min(1.0, churn_prediction),
            "next_action_prediction": next_action,
            "reasons": reasons,
            "top_features": sorted(features.items(), key=lambda x: x[1], reverse=True)[:5]
        }

    def predict_next_action(self, session_events: List[Dict], features: Dict = None, conversion_probability: float = 0.0) -> Dict:
        """Predicts the user's likely next action from recent sequence + intent features."""
        if not session_events:
            return {
                "action": "page_view",
                "label": "Continue browsing",
                "probability": 0.35,
                "reasons": ["no_session_history"],
                "alternatives": ["compare_plans", "open_calculator"],
            }

        features = features or self.extract_features(session_events)
        recent = session_events[-8:]
        recent_types = [event.get("event_type") for event in recent]
        recent_pages = [event.get("page_id") for event in recent if event.get("page_id")]
        last_type = recent_types[-1]
        last_page = recent_pages[-1] if recent_pages else "unknown"
        reasons = []

        if last_type in {"form_abandonment", "checkout_abandon", "idle_timeout"}:
            reasons.append("recent_form_or_idle_dropoff")
            return {
                "action": "return_to_form",
                "label": "Return to application form",
                "probability": 0.78,
                "reasons": reasons,
                "alternatives": ["request_advisor", "compare_plans"],
            }

        if last_type in {"form_start", "form_progress"} or features.get("form_progress", 0) >= 50:
            reasons.append("active_form_progress")
            return {
                "action": "form_submit",
                "label": "Complete form",
                "probability": min(0.88, max(0.55, conversion_probability + 0.25)),
                "reasons": reasons,
                "alternatives": ["save_draft", "request_advisor"],
            }

        if features.get("calculator_usage", 0) and features.get("pricing_views", 0):
            reasons.extend(["calculator_usage", "product_pricing_view"])
            return {
                "action": "checkout_start",
                "label": "Start application",
                "probability": min(0.82, conversion_probability + 0.2),
                "reasons": reasons,
                "alternatives": ["compare_plans", "download_brochure"],
            }

        if recent_types.count("comparison_view") >= 1 or "plan_comparison" in last_page:
            reasons.append("comparison_behavior")
            return {
                "action": "product_view",
                "label": "Open product details",
                "probability": 0.62,
                "reasons": reasons,
                "alternatives": ["open_calculator", "request_advisor"],
            }

        if recent_types.count("faq_open") >= 2 or features.get("faq_count", 0) >= 3:
            reasons.append("faq_research_pattern")
            return {
                "action": "request_advisor",
                "label": "Ask for advisor help",
                "probability": 0.58,
                "reasons": reasons,
                "alternatives": ["compare_plans", "open_calculator"],
            }

        if features.get("navigation_depth", 0) >= 3:
            reasons.append("multi_page_research")
            return {
                "action": "compare_plans",
                "label": "Compare plans",
                "probability": 0.56,
                "reasons": reasons,
                "alternatives": ["product_view", "open_calculator"],
            }

        reasons.append("early_exploration")
        return {
            "action": "page_view",
            "label": "Continue browsing",
            "probability": 0.42,
            "reasons": reasons,
            "alternatives": ["compare_plans", "open_calculator"],
        }

    def train_on_global_data(self, all_sessions: List[List[Dict]], labels: List[int]):
        """Trains the model on all historical user data."""
        if not all_sessions: return
        
        X = np.vstack([self.extract_features(s) for s in all_sessions])
        y = np.array(labels)
        
        self.model.fit(X, y)
        joblib.dump(self.model, self.model_path)
        print(f"Global model trained on {len(all_sessions)} sessions.")

class GlobalSegmentationModel:
    """Uses Unsupervised Learning to cluster users into behavioral personas (Section 95)."""
    def __init__(self, n_clusters=4):
        self.kmeans = KMeans(n_clusters=n_clusters, n_init=10)
        self.is_fitted = False
        
    def fit_segments(self, all_sessions: List[List[Dict]]):
        """Fits KMeans on the provided sessions (Section 61-70)."""
        if len(all_sessions) < 4: return
        
        # Extract features for all sessions
        X = np.array([list(GlobalIntentModel().extract_features(s).values()) for s in all_sessions])
        self.kmeans.fit(X)
        self.is_fitted = True
        
    def get_persona(self, session_events: List[Dict]) -> str:
        """Returns a human-readable segment name based on clustering or heuristic fallback."""
        features_dict = GlobalIntentModel().extract_features(session_events)
        features_vec = np.array(list(features_dict.values())).reshape(1, -1)
        
        if self.is_fitted:
            try:
                cluster = self.kmeans.predict(features_vec)[0]
                # Map clusters to personas based on characteristic features (simplified for demo)
                personas = {0: "Conservative Researcher", 1: "Comparison Shopper", 2: "High-Velocity Scanner", 3: "Intentional Investor"}
                return personas.get(cluster, "Standard User")
            except:
                pass
                
        # Heuristic Fallback (Section 95)
        if features_dict['calculator_usage'] > 0 and features_dict['pricing_views'] > 0:
            return "Intentional Investor"
        if features_dict['faq_count'] > 3:
            return "Conservative Researcher"
        if features_dict['interaction_density'] > 10:
            return "High-Velocity Scanner"
        if features_dict['navigation_depth'] > 4:
            return "Comparison Shopper"
            
        return "Passive Explorer"
