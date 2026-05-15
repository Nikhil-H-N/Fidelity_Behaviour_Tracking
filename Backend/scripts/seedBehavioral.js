/**
 * ============================================================
 * FinovaWealth — High-Fidelity Behavioral Seeder
 * File: Backend/scripts/seedBehavioral.js
 * ============================================================
 * Simulates realistic user journeys with clicks, hovers,
 * scroll milestones, and heatmap coordinates.
 * ============================================================
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("dns");
const User = require("../models/User");
const Session = require("../models/Session");
const Event = require("../models/Event");
const path = require("path");

// Fix DNS for MongoDB Atlas on Windows/certain ISPs
dns.setDefaultResultOrder("ipv4first");

// Load config
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

const buildFallbackUri = () => {
  const primary = MONGO_URI;
  if (!primary) return null;
  const match = primary.match(/mongodb\+srv:\/\/([^@]+)@[^/]+\/([^?]+)\??(.*)/);
  if (!match) return null;
  const [, credentials, dbName, params] = match;
  const shards = [
    "ac-rnosrti-shard-00-00.f2gv7j5.mongodb.net:27017",
    "ac-rnosrti-shard-00-01.f2gv7j5.mongodb.net:27017",
    "ac-rnosrti-shard-00-02.f2gv7j5.mongodb.net:27017",
  ].join(",");
  return `mongodb://${credentials}@${shards}/${dbName}?ssl=true&authSource=admin&${params}`;
};

const PAGES = [
  "landing",
  "investment-plans",
  "insurance-plans",
  "tax-saving-plans",
  "wealth-management",
  "mutual-funds",
  "sip-plans",
  "faq",
  "beginner-guides",
  "success-stories",
  "investment-calculator",
  "dashboard"
];

const DEVICES = ["desktop", "mobile", "tablet"];
const BROWSERS = ["Chrome", "Safari", "Firefox", "Edge"];

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Simulate coordinate distribution (clusters around buttons)
const getCoordinate = (page) => {
  // Common button areas in a 1920x1080 canvas
  const clusters = [
    { x: 960, y: 500, r: 100 }, // Center CTA
    { x: 200, y: 50, r: 50 },   // Logo/Nav
    { x: 1700, y: 50, r: 50 },  // Profile/Login
    { x: 500, y: 800, r: 150 }, // Content cards
    { x: 1400, y: 800, r: 150 } // Content cards
  ];
  const cluster = randomChoice(clusters);
  return {
    x: cluster.x + (Math.random() - 0.5) * cluster.r * 2,
    y: cluster.y + (Math.random() - 0.5) * cluster.r * 2
  };
};

async function simulateSession(user, startTime) {
  const device = randomChoice(DEVICES);
  const browser = randomChoice(BROWSERS);
  
  const session = await Session.create({
    userId: user._id,
    sessionStart: startTime,
    device,
    browser,
    status: "completed",
    entrySource: randomChoice(["organic", "direct", "email_campaign", "referral"]),
    location: randomChoice(["Mumbai, IN", "Delhi, IN", "Bengaluru, IN", "New York, US", "London, UK"])
  });

  let currentTime = new Date(startTime);
  const visitedPages = [];
  const numPages = randomInt(3, 8);
  
  for (let i = 0; i < numPages; i++) {
    const page = PAGES[i % PAGES.length];
    visitedPages.push(page);
    
    // 1. Page Visit
    await Event.create({
      userId: user._id,
      sessionId: session._id,
      eventType: "page_view",
      page,
      device,
      browser,
      timestamp: new Date(currentTime)
    });

    // 2. Interaction Loop
    const numInteractions = randomInt(5, 15);
    for (let j = 0; j < numInteractions; j++) {
      currentTime.setSeconds(currentTime.getSeconds() + randomInt(2, 10));
      
      const eventType = randomChoice([
        "button_click", "button_click", "button_click", // Higher weight
        "hover", "hover", 
        "scroll_depth", 
        "mouse_movement"
      ]);

      const coords = getCoordinate(page);
      
      const eventData = {
        userId: user._id,
        sessionId: session._id,
        eventType,
        page,
        device,
        browser,
        timestamp: new Date(currentTime),
        x: coords.x,
        y: coords.y,
        metadata: {}
      };

      if (eventType === "button_click") {
        eventData.element = randomChoice(["invest-now", "learn-more", "calculate", "apply-btn", "nav-link"]);
        eventData.metadata.globalClick = true;
      } else if (eventType === "scroll_depth") {
        eventData.scrollDepth = randomChoice([25, 50, 75, 100]);
      } else if (eventType === "hover") {
        eventData.element = "info-icon";
        eventData.duration = randomInt(1, 4);
      }

      await Event.create(eventData);
    }

    // Time spent on page
    currentTime.setSeconds(currentTime.getSeconds() + randomInt(10, 60));
  }

  session.sessionEnd = new Date(currentTime);
  session.duration = Math.round((session.sessionEnd - session.sessionStart) / 1000);
  session.pagesVisited = visitedPages;
  session.eventCount = numPages * 10; // Approx
  session.conversion = Math.random() > 0.7;
  await session.save();

  console.log(`Generated session for ${user.email}: ${visitedPages.length} pages, ${session.duration}s`);
}

async function seed() {
  try {
    const mongoOptions = { family: 4, serverSelectionTimeoutMS: 10000 };
    try {
      console.log("Connecting to MongoDB (SRV)...");
      await mongoose.connect(MONGO_URI, mongoOptions);
    } catch (err) {
      console.log("SRV failed, trying fallback URI...");
      const fallback = buildFallbackUri();
      await mongoose.connect(fallback, mongoOptions);
    }
    console.log("Connected to MongoDB for behavioral seeding...");

    const users = await User.find({ role: "user" }).limit(5);
    if (users.length === 0) {
      console.log("No users found. Please seed users first.");
      process.exit(1);
    }

    console.log(`Seeding behavioral data for ${users.length} users...`);

    for (const user of users) {
      const numSessions = randomInt(3, 5);
      for (let s = 0; s < numSessions; s++) {
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - randomInt(0, 2));
        startTime.setHours(randomInt(0, 23), randomInt(0, 59));
        
        await simulateSession(user, startTime);
      }
    }

    console.log("Behavioral seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
