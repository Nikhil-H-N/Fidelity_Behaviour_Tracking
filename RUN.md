# 🚀 Running the Behavioral Intelligence Platform

Follow these steps to start the complete system: the Intelligence Engine, the Core API, the Monitored Website, and the Master Admin Console.

---

## Prerequisites
- **Python 3.9+**
- **Node.js 18+**
- **MongoDB Atlas** (or local instance)

---

## 1️⃣ Start the Intelligence Engine (Python)

The "Brain" that processes all behavioral events and generates real-time intelligence.

1. Open a terminal in the project root.
2. Create/Activate venv:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r engine/requirements.txt
   ```
3. Run: `python -m engine.main`
   *Starts on `http://localhost:8000`*

---

## 2️⃣ Start the Core API (Node.js Backend)

The bridge that handles authentication, database persistence, and forwards events to the Python Engine.

1. Open a second terminal.
2. `cd Backend`
3. `npm install`
4. Configure `.env` (ensure MongoDB connection string is set)
5. `npm run dev`
   *Starts on `http://localhost:5000`*

---

## 3️⃣ Start the Monitored Website (Finova Wealth)

The high-fidelity fintech site where user behavior is tracked and engine interventions are displayed.

1. Open a third terminal.
2. `cd Frontend`
3. `npm install`
4. `npm run dev`
   *Starts on `http://localhost:5173`*

---

## 4️⃣ Start the Master Console (Admin Portal)

The standalone command center for intelligence oversight and manual behavioral interventions.

1. Open a fourth terminal.
2. `cd admin-portal`
3. `npm install`
4. `npm run dev`
   *Starts on `http://localhost:5174`*

---

## 🧪 How to Demo the Monitoring

1. **Open the Admin Portal**: Go to `http://localhost:5174`.
2. **Open the Website**: Go to `http://localhost:5173`.
3. **Simulate a User**: In a **New Incognito Window**, go to the website (`http://localhost:5173`) and sign up/login.
4. **Interact**: Click buttons, scroll deeply on the SIP Plans page, and hover over CTAs.
5. **Watch the Intelligence**: 
   - Switch to the **Admin Portal**. You will see every interaction from the Incognito window appearing live in the **Live Behavioral Stream**.
   - Check the **Session Intelligence** for the user's "behavioral narrative" and persona classification.
6. **Trigger an Intervention**: In the Admin Portal, find the active session and click **"Send Custom Message"**. Watch it appear instantly on the Website (Incognito window).

---

## 📂 Key Context Files
- `PLATFORM_MANIFESTO.md`: The deep-dive into our behavioral intelligence philosophy.
- `ML_ARCHITECTURE.md`: Details on our ML feature engineering and predictive models.
- `LOGIC.md`: Comprehensive mapping of behavioral heuristics.
- `INTEGRATION.md`: Guide for connecting more frontends to the engine.
