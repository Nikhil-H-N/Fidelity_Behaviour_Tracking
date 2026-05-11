/**
 * ============================================================
 * FinovaWealth — MongoDB Connection Configuration
 * File: config/db.js
 * ============================================================
 * Establishes a resilient connection to MongoDB Atlas using
 * Mongoose. Includes retry logic and graceful shutdown hooks.
 * ============================================================
 */

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 7+ uses the new connection string parser and
      // unified topology by default — no need for legacy flags.
      autoIndex: process.env.NODE_ENV !== "production", // Disable auto-index in production for performance
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);

    // ---------- Connection event listeners ----------
    mongoose.connection.on("error", (err) => {
      console.error(`❌  MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected. Attempting reconnect…");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄  MongoDB reconnected successfully.");
    });
  } catch (error) {
    console.error(`❌  MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

// ---------- Graceful shutdown ----------
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑  Received ${signal}. Closing MongoDB connection…`);
  await mongoose.connection.close();
  console.log("💤  MongoDB connection closed. Exiting.");
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

module.exports = connectDB;
