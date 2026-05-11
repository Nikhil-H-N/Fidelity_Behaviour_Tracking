# Behavioral Intelligence Logic (SBTE) - Enterprise Edition

The engine is built strictly according to the **CLAUDE.md** specification for the Fidelity Hackathon, implementing a full **Research -> Strategy -> Execution** lifecycle for user behavior understanding.

## 1. Intent Scoring Formula (Section 10, 51)
The engine calculates a dynamic **Intent Score** (clamped 0-100) using a multi-factor formula:
`Final Intent Score = (Positive Signals - Negative Signals) + Momentum Bonus + Continuity Bonus + Persistence Bonus - Friction Penalty`

### Multipliers (Section 52, 97)
- **High Intensity Interaction:** +1.4x if (Calculator + Pricing + CTA) detected.
- **Logical Sequence:** +1.3x confidence if (Awareness -> Research -> Trust -> Decision) pattern found.

---

## 2. Advanced Taxonomy (Section 9, 73, 95)
The engine classifies users across three intelligent dimensions:

### A. Behavioral States
- **PASSIVE_BROWSER:** Initial landing, scanning behavior.
- **RESEARCH_USER:** Deep reading, comparison switching.
- **HIGH_INTENT_USER:** Consistent product intent, conversion ready.
- **NEARLY_CONVERTED:** Abandoned at late-stage (OTP/Form 70%+).

### B. Financial Personas (Section 95)
- **Conservative Researcher:** FAQ-heavy, slow deliberate movement.
- **Aggressive Investor:** Fast progression, pricing-focused.
- **Trust-Seeking User:** Explores security and 'About' pages before CTA.
- **Overthinker:** Caught in decision paralysis/comparison loops.

### C. Risk Assessment (Section 26, 79)
- **Drop-off Risk:** High probability of session exit.
- **Frustration Risk:** Detected via Rage Clicks or validation failures.
- **Trust Risk:** Detected via sudden pricing exits.

---

## 3. Sequential Intelligence (Section 96, 97)
The system doesn't just look at clicks; it understands **User Stories**:
- **LOGICAL_CONVERSION_PATH:** Follows a natural educational funnel.
- **SERIOUS_PROSPECT_PATH:** Repeated high-value actions (Calculator -> Pricing).

---

## 4. Machine Learning Intelligence (Section 61-70)
- **Feature Vector:** 15+ normalized metrics (dwell, clicks, density, distance).
- **Predictive Layer:** Random Forest estimator for conversion probability (0-100%).
- **Clustering:** K-Means unsupervised learning for real-time behavioral segmentation.
- **Explainable AI (XAI):** Every ML prediction includes the top influencing features (e.g., "calculator_usage = strong signal").
