/**
 * ============================================================
 * FinovaWealth — Express Server Entry Point
 * File: server.js
 * ============================================================
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// ── Connect to MongoDB Atlas ──
connectDB();

// ── Global Middleware ──
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
  ],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Request Logger (dev) ──
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// ── Health Check ──
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "FinovaWealth API is running",
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ──
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// ── 404 Handler ──
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global Error Handler ──
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
  });
});

// ── Start Server ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  FinovaWealth API running on port ${PORT}`);
  console.log(`📍  Environment: ${process.env.NODE_ENV || "development"}\n`);
});

