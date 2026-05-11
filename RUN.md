# 🚀 Running the Behavioral Intelligence Platform

Follow these steps to start the complete system: the Intelligence Engine, the Monitored Website, and the Master Admin Console.

---

## Prerequisites
- **Python 3.9+**
- **Node.js 18+**

---

## 1️⃣ Start the Intelligence Engine (Backend)

The "Brain" that processes all behavioral events.

1. Open a terminal in the project root.(And type `python -m venv venv` if you haven't already)
2. Activate venv: `.\venv\Scripts\activate`
3. Run: `python -m engine.main`
   *Starts on `http://localhost:8000`*

---

## 2️⃣ Start the Monitored Website (Finova Wealth)

The high-fidelity fintech site where user behavior is tracked.

1. Open a second terminal.
2. `cd finova-wealth`
3. `npm install` (if first time)
4. `npm run dev`
   *Starts on `http://localhost:5173`*

---

## 3️⃣ Start the Master Console (Admin Portal)

The standalone command center for intelligence oversight.

1. Open a third terminal.
2. `cd admin-portal`
3. `npm install`
4. `npm run dev`
   *Starts on `http://localhost:5174`*

---

## 🧪 How to Demo the Monitoring

1. **Open the Admin Portal**: Go to `http://localhost:5174`. You will see the "Global Behavioral Stream" waiting for data.
2. **Open the Website**: Go to `http://localhost:5173`.
3. **Simulate a User**: In a **New Incognito Window**, go to the website (`http://localhost:5173`).
4. **Interact**: Click buttons, scroll deeply on the SIP Plans page, and hover over CTAs.
5. **Watch the Magic**: Switch back to the **Admin Portal** tab. You will see every interaction from the Incognito window appearing live in the stream, with real-time intent scoring and persona classification.

---

## 📂 Key Context Files
- `PLATFORM_MANIFESTO.md`: The deep-dive into our behavioral intelligence philosophy.
- `ML_ARCHITECTURE.md`: Details on our ML feature engineering and predictive models.
- `INTEGRATION.md`: Guide for connecting more frontends to the engine.
