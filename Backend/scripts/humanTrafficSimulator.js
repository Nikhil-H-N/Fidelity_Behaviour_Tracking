/**
 * ============================================================
 * FinovaWealth - Human Traffic Simulator
 * File: Backend/scripts/humanTrafficSimulator.js
 * ============================================================
 * Creates dummy users with realistic emails, browsing sessions,
 * clicks, hovers, scrolls, form activity, and heatmap coordinates.
 *
 * Default behavior is safe and additive: it does not delete data.
 *
 * Examples:
 *   npm run simulate:humans
 *   npm run simulate:humans -- --users=25 --sessions=3 --days=7
 *   npm run simulate:humans -- --mode=engine --users=8
 *   npm run simulate:humans -- --email-domain=demo.local
 *   npm run simulate:humans -- --dry-run
 * ============================================================
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("dns");
const path = require("path");
const User = require("../models/User");
const Session = require("../models/Session");
const Event = require("../models/Event");

dns.setDefaultResultOrder("ipv4first");
dotenv.config({ path: path.join(__dirname, "../.env") });

const DEFAULTS = {
  users: 15,
  sessions: 2,
  days: 3,
  mode: "both",
  engineUrl: process.env.ENGINE_URL || "http://127.0.0.1:8000/analyze",
  emailDomain: "example.test",
  dryRun: false,
};

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
};

const BROWSERS = ["Chrome 125", "Chrome 126", "Edge 125", "Safari 17", "Firefox 126"];
const LOCATIONS = ["Mumbai, IN", "Delhi, IN", "Bengaluru, IN", "Hyderabad, IN", "Pune, IN", "New York, US"];
const SOURCES = ["direct", "organic", "email_campaign", "referral", "social"];
const RISK_PROFILES = ["conservative", "moderate", "aggressive"];

const FIRST_NAMES = [
  "Aarav", "Aditi", "Ananya", "Arjun", "Dev", "Diya", "Ishani", "Kabir",
  "Krishna", "Meera", "Myra", "Neha", "Rahul", "Reyansh", "Riya", "Saanvi",
  "Tara", "Vihaan", "Zara", "Zoya",
];

const LAST_NAMES = [
  "Bose", "Gupta", "Iyer", "Jain", "Kapoor", "Khan", "Malhotra", "Nair",
  "Patel", "Rao", "Reddy", "Shah", "Sharma", "Singh", "Verma",
];

const GOALS = [
  "retirement", "tax_saving", "wealth_creation", "child_education",
  "emergency_fund", "home_purchase", "vacation",
];

const PAGE_DEFS = {
  landing: {
    path: "landing",
    next: ["investment-plans", "mutual-funds", "sip-plans", "insurance-plans", "faq"],
    elements: [
      { id: "hero-start-investing", label: "Start Investing", x: 735, y: 465, radius: 70 },
      { id: "nav-investment-plans", label: "Investment Plans", x: 550, y: 72, radius: 50 },
      { id: "nav-login", label: "Login", x: 1260, y: 72, radius: 45 },
      { id: "learn-more", label: "Learn More", x: 610, y: 465, radius: 65 },
      { id: "success-card", label: "Success Story", x: 1040, y: 690, radius: 90 },
    ],
  },
  "investment-plans": {
    path: "investment-plans",
    next: ["plan-comparison", "product-details/term-life", "application-form", "investment-calculator"],
    elements: [
      { id: "plan-card-growth", label: "Growth Plan", x: 365, y: 520, radius: 90 },
      { id: "compare-plans", label: "Compare Plans", x: 725, y: 760, radius: 80 },
      { id: "invest-now", label: "Invest Now", x: 1050, y: 520, radius: 80 },
      { id: "filter-risk", label: "Risk Filter", x: 240, y: 260, radius: 60 },
    ],
  },
  "mutual-funds": {
    path: "mutual-funds",
    next: ["product-details/bluechip-fund", "sip-plans", "plan-comparison", "application-form"],
    elements: [
      { id: "fund-card-bluechip", label: "Bluechip Fund", x: 345, y: 495, radius: 85 },
      { id: "fund-card-elss", label: "ELSS Fund", x: 720, y: 495, radius: 85 },
      { id: "start-sip", label: "Start SIP", x: 1050, y: 715, radius: 80 },
      { id: "download-factsheet", label: "Download Factsheet", x: 1110, y: 335, radius: 70 },
    ],
  },
  "sip-plans": {
    path: "sip-plans",
    next: ["investment-calculator", "application-form", "dashboard"],
    elements: [
      { id: "sip-amount-input", label: "SIP Amount", x: 460, y: 360, radius: 65 },
      { id: "sip-duration-slider", label: "Duration Slider", x: 630, y: 520, radius: 75 },
      { id: "create-sip", label: "Create SIP", x: 970, y: 690, radius: 90 },
      { id: "view-projection", label: "View Projection", x: 1010, y: 430, radius: 85 },
    ],
  },
  "investment-calculator": {
    path: "investment-calculator",
    next: ["sip-plans", "plan-comparison", "application-form"],
    elements: [
      { id: "monthly-investment", label: "Monthly Investment", x: 455, y: 345, radius: 70 },
      { id: "expected-return", label: "Expected Return", x: 455, y: 475, radius: 70 },
      { id: "calculate-returns", label: "Calculate Returns", x: 740, y: 650, radius: 95 },
      { id: "save-calculation", label: "Save Calculation", x: 1010, y: 650, radius: 75 },
    ],
  },
  "plan-comparison": {
    path: "plan-comparison",
    next: ["product-details/term-life", "application-form", "contact"],
    elements: [
      { id: "comparison-table", label: "Comparison Table", x: 720, y: 520, radius: 180 },
      { id: "select-plan-a", label: "Select Plan A", x: 410, y: 725, radius: 60 },
      { id: "select-plan-b", label: "Select Plan B", x: 735, y: 725, radius: 60 },
      { id: "talk-to-advisor", label: "Talk To Advisor", x: 1070, y: 725, radius: 75 },
    ],
  },
  "product-details/term-life": {
    path: "product-details/term-life",
    next: ["application-form", "contact", "faq"],
    elements: [
      { id: "benefits-tab", label: "Benefits Tab", x: 315, y: 260, radius: 55 },
      { id: "premium-breakdown", label: "Premium Breakdown", x: 965, y: 430, radius: 110 },
      { id: "apply-now", label: "Apply Now", x: 1050, y: 690, radius: 85 },
      { id: "download-brochure", label: "Download Brochure", x: 840, y: 690, radius: 75 },
    ],
  },
  "insurance-plans": {
    path: "insurance-plans",
    next: ["product-details/term-life", "plan-comparison", "application-form"],
    elements: [
      { id: "term-life-card", label: "Term Life", x: 385, y: 510, radius: 95 },
      { id: "health-insurance-card", label: "Health Insurance", x: 720, y: 510, radius: 95 },
      { id: "compare-insurance", label: "Compare Insurance", x: 1035, y: 710, radius: 80 },
    ],
  },
  faq: {
    path: "faq",
    next: ["beginner-guides", "contact", "landing"],
    elements: [
      { id: "faq-tax-saving", label: "Tax Saving FAQ", x: 440, y: 350, radius: 80 },
      { id: "faq-sip-risk", label: "SIP Risk FAQ", x: 440, y: 495, radius: 80 },
      { id: "faq-contact", label: "Contact Support", x: 980, y: 700, radius: 75 },
    ],
  },
  "application-form": {
    path: "application-form",
    next: ["confirmation", "dashboard"],
    elements: [
      { id: "full-name", label: "Full Name", x: 465, y: 255, radius: 55 },
      { id: "pan-number", label: "PAN Number", x: 465, y: 390, radius: 55 },
      { id: "investment-amount", label: "Investment Amount", x: 465, y: 525, radius: 55 },
      { id: "submit-application", label: "Submit Application", x: 795, y: 720, radius: 85 },
    ],
  },
  contact: {
    path: "contact",
    next: ["landing", "dashboard"],
    elements: [
      { id: "message-field", label: "Message Field", x: 520, y: 480, radius: 80 },
      { id: "request-callback", label: "Request Callback", x: 795, y: 695, radius: 85 },
      { id: "chatbot-open", label: "Chatbot", x: 1260, y: 765, radius: 60 },
    ],
  },
  dashboard: {
    path: "dashboard",
    next: ["portfolio", "transactions", "profile-settings"],
    elements: [
      { id: "portfolio-card", label: "Portfolio Card", x: 380, y: 320, radius: 100 },
      { id: "recommended-plan", label: "Recommended Plan", x: 920, y: 420, radius: 110 },
      { id: "add-investment", label: "Add Investment", x: 1120, y: 680, radius: 75 },
    ],
  },
};

const PERSONAS = {
  CONVERTER: ["landing", "investment-plans", "investment-calculator", "sip-plans", "application-form", "confirmation"],
  RESEARCHER: ["landing", "faq", "beginner-guides", "plan-comparison", "mutual-funds", "landing"],
  TAX_SAVER: ["landing", "mutual-funds", "plan-comparison", "product-details/term-life", "application-form"],
  HESITANT: ["landing", "insurance-plans", "product-details/term-life", "faq", "product-details/term-life", "contact"],
  CHECKOUT_ABANDONER: ["landing", "mutual-funds", "investment-calculator", "application-form"],
  FRUSTRATED: ["landing", "insurance-plans", "faq", "insurance-plans", "application-form"],
  DASHBOARD_RETURNER: ["landing", "dashboard", "portfolio", "transactions", "dashboard"],
  BOUNCER: ["landing"],
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (items) => items[randomInt(0, items.length - 1)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseArgs = () => {
  const args = { ...DEFAULTS };

  for (const arg of process.argv.slice(2)) {
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    const [key, rawValue] = arg.replace(/^--/, "").split("=");
    if (!key || rawValue === undefined) continue;

    if (["users", "sessions", "days"].includes(key)) {
      args[key] = Math.max(1, Number.parseInt(rawValue, 10) || DEFAULTS[key]);
    } else if (key === "mode") {
      args.mode = ["both", "db", "engine"].includes(rawValue) ? rawValue : DEFAULTS.mode;
    } else if (key === "engine-url") {
      args.engineUrl = rawValue;
    } else if (key === "email-domain") {
      args.emailDomain = rawValue.replace(/^@/, "") || DEFAULTS.emailDomain;
    }
  }

  return args;
};

const buildFallbackUri = (mongoUri) => {
  if (!mongoUri) return null;
  const match = mongoUri.match(/mongodb\+srv:\/\/([^@]+)@[^/]+\/([^?]+)\??(.*)/);
  if (!match) return null;

  const [, credentials, dbName, params] = match;
  const shards = [
    "ac-rnosrti-shard-00-00.f2gv7j5.mongodb.net:27017",
    "ac-rnosrti-shard-00-01.f2gv7j5.mongodb.net:27017",
    "ac-rnosrti-shard-00-02.f2gv7j5.mongodb.net:27017",
  ].join(",");

  return `mongodb://${credentials}@${shards}/${dbName}?ssl=true&authSource=admin&${params}`;
};

const connectMongo = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing. Add it to Backend/.env or use --mode=engine.");
  }

  const options = { family: 4, serverSelectionTimeoutMS: 10000 };
  try {
    await mongoose.connect(mongoUri, options);
  } catch (error) {
    const fallback = buildFallbackUri(mongoUri);
    if (!fallback) throw error;
    await mongoose.connect(fallback, options);
  }
};

const makeRunId = () => new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);

const makeDummyUserData = (runId, index, emailDomain) => {
  const fullName = `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
  const localPart = fullName.toLowerCase().replace(/[^a-z]+/g, ".");

  return {
    fullName,
    email: `${localPart}.${runId}.${index}@${emailDomain}`,
    phone: `9${randomInt(100000000, 999999999)}`,
    passwordHash: "DummyUser@123",
    authProvider: "email",
    role: "user",
    isVerified: true,
    riskProfile: randomChoice(RISK_PROFILES),
    investmentGoals: [randomChoice(GOALS), randomChoice(GOALS)].filter((goal, i, arr) => arr.indexOf(goal) === i),
    monthlyInvestment: randomInt(3000, 75000),
    preferredInvestments: [randomChoice(["SIP", "Mutual Funds", "ELSS", "Insurance", "Retirement"])],
    intentScore: randomInt(12, 88),
  };
};

const createDummyUser = async (userData, persist) => {
  if (!persist) {
    return {
      _id: `dummy_${userData.email.split("@")[0].replace(/\./g, "_")}`,
      ...userData,
    };
  }

  return User.create(userData);
};

const scalePoint = (point, viewport) => ({
  x: Math.round((point.x / VIEWPORTS.desktop.width) * viewport.width),
  y: Math.round((point.y / VIEWPORTS.desktop.height) * viewport.height),
});

const jitterPoint = (element, viewport) => {
  const native = {
    x: element.x + randomInt(-element.radius, element.radius),
    y: element.y + randomInt(-element.radius, element.radius),
  };
  const scaled = scalePoint(native, viewport);

  return {
    x: clamp(scaled.x, 8, viewport.width - 8),
    y: clamp(scaled.y, 8, viewport.height - 8),
  };
};

const normalizePageForEngine = (page) => String(page || "unknown").replace(/^\//, "").replace(/-/g, "_");

const pickPersona = () => {
  const weighted = [
    "CONVERTER", "CONVERTER", "RESEARCHER", "RESEARCHER",
    "TAX_SAVER", "HESITANT", "CHECKOUT_ABANDONER", "FRUSTRATED",
    "DASHBOARD_RETURNER", "BOUNCER",
  ];
  return randomChoice(weighted);
};

const makeJourney = (persona) => {
  const template = PERSONAS[persona] || PERSONAS.RESEARCHER;
  if (persona === "BOUNCER") return template;

  const journey = [...template];
  if (Math.random() > 0.65) {
    const lastKnownPage = PAGE_DEFS[journey[journey.length - 1]] || PAGE_DEFS.landing;
    journey.push(randomChoice(lastKnownPage.next));
  }

  return journey.filter((page) => page !== "confirmation" || Math.random() > 0.15);
};

const makeTimestamp = (daysBack) => {
  const date = new Date();
  const actualDaysBack = randomInt(0, daysBack);

  if (actualDaysBack === 0) {
    date.setMinutes(date.getMinutes() - randomInt(90, 150));
    date.setSeconds(randomInt(0, 59), 0);
    return date;
  }

  date.setDate(date.getDate() - actualDaysBack);
  date.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59), 0);
  return date;
};

const addEvent = (events, base) => {
  events.push({
    ...base,
    metadata: {
      ...(base.metadata || {}),
      screenWidth: base.metadata?.screenWidth,
      screenHeight: base.metadata?.screenHeight,
    },
  });
};

const buildSessionEvents = ({ user, sessionId, persona, device, browser, source, startTime, daysBack }) => {
  const viewport = VIEWPORTS[device];
  const events = [];
  const journey = makeJourney(persona);
  const visitedPages = [];
  let current = new Date(startTime);
  let lastScrollDepth = 0;
  const clientSessionId = `sim_${sessionId}_${randomInt(1000, 9999)}`;

  const baseMetadata = {
    simulated: true,
    persona,
    userEmail: user.email,
    userName: user.fullName,
    trackingUserId: String(user._id),
    clientSessionId,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
    connectionOrigin: "simulated",
  };

  addEvent(events, {
    eventType: "session_start",
    page: journey[0],
    source,
    timestamp: new Date(current),
    metadata: baseMetadata,
  });

  journey.forEach((page, pageIndex) => {
    const def = PAGE_DEFS[page] || PAGE_DEFS.landing;
    const pageEntry = new Date(current);
    visitedPages.push(page);

    addEvent(events, {
      eventType: pageIndex > 0 && journey.indexOf(page) !== pageIndex ? "repeated_page_visit" : "page_view",
      page,
      source,
      timestamp: new Date(current),
      device,
      browser,
      metadata: { ...baseMetadata, pageIndex },
    });

    if (pageIndex > 0 && Math.random() > 0.8) {
      current.setSeconds(current.getSeconds() + randomInt(1, 4));
      addEvent(events, {
        eventType: "return_visit",
        page,
        source,
        timestamp: new Date(current),
        device,
        browser,
        metadata: { ...baseMetadata, previousPage: journey[pageIndex - 1] },
      });
    }

    const interactions = persona === "BOUNCER" ? randomInt(1, 3) : randomInt(7, 16);

    for (let i = 0; i < interactions; i++) {
      current.setSeconds(current.getSeconds() + randomInt(2, 12));
      const element = randomChoice(def.elements);
      const point = jitterPoint(element, viewport);
      const roll = Math.random();

      if (roll < 0.22) {
        lastScrollDepth = Math.max(lastScrollDepth, randomChoice([25, 50, 75, 100]));
        addEvent(events, {
          eventType: "scroll_depth",
          page,
          scrollDepth: lastScrollDepth,
          duration: randomInt(2, 9),
          timestamp: new Date(current),
          device,
          browser,
          metadata: { ...baseMetadata, depth: lastScrollDepth },
        });
      } else if (roll < 0.38) {
        addEvent(events, {
          eventType: "hover",
          page,
          element: element.id,
          duration: randomInt(1, 6),
          x: point.x,
          y: point.y,
          timestamp: new Date(current),
          device,
          browser,
          metadata: { ...baseMetadata, element: element.id, label: element.label, x: point.x, y: point.y },
        });
      } else if (roll < 0.48) {
        addEvent(events, {
          eventType: "mouse_movement",
          page,
          x: point.x,
          y: point.y,
          timestamp: new Date(current),
          device,
          browser,
          metadata: { ...baseMetadata, moveCount: randomInt(15, 130), x: point.x, y: point.y },
        });
      } else {
        const clickType = Math.random() > 0.9 ? "cta_click" : "button_click";
        addEvent(events, {
          eventType: clickType,
          page,
          element: element.id,
          buttonName: element.label,
          x: point.x,
          y: point.y,
          timestamp: new Date(current),
          device,
          browser,
          metadata: {
            ...baseMetadata,
            element: element.id,
            label: element.label,
            x: point.x,
            y: point.y,
            globalClick: true,
          },
        });
      }

      if (page === "investment-calculator" && Math.random() > 0.72) {
        current.setSeconds(current.getSeconds() + randomInt(3, 8));
        addEvent(events, {
          eventType: "calculator_usage",
          page,
          element: "calculate-returns",
          duration: randomInt(10, 45),
          timestamp: new Date(current),
          device,
          browser,
          metadata: {
            ...baseMetadata,
            monthlyAmount: randomInt(5000, 50000),
            years: randomInt(5, 25),
            expectedReturn: randomInt(8, 15),
          },
        });
      }

      if (page === "plan-comparison" && Math.random() > 0.72) {
        current.setSeconds(current.getSeconds() + randomInt(3, 8));
        addEvent(events, {
          eventType: "comparison",
          page,
          element: "comparison-table",
          duration: randomInt(8, 35),
          timestamp: new Date(current),
          device,
          browser,
          metadata: { ...baseMetadata, productsCompared: randomInt(2, 4) },
        });
      }
    }

    if (page.includes("product-details") && Math.random() > 0.35) {
      current.setSeconds(current.getSeconds() + randomInt(5, 18));
      addEvent(events, {
        eventType: "product_view",
        page,
        element: "premium-breakdown",
        duration: randomInt(15, 90),
        timestamp: new Date(current),
        device,
        browser,
        metadata: { ...baseMetadata, product: page.split("/").pop() },
      });
    }

    if (page === "application-form") {
      current.setSeconds(current.getSeconds() + randomInt(4, 10));
      addEvent(events, {
        eventType: "form_start",
        page,
        formType: "investment_application",
        timestamp: new Date(current),
        device,
        browser,
        metadata: { ...baseMetadata, form: "investment_application" },
      });

      for (const field of ["fullName", "panNumber", "investmentAmount"]) {
        current.setSeconds(current.getSeconds() + randomInt(3, 10));
        addEvent(events, {
          eventType: "field_focus",
          page,
          fieldName: field,
          formType: "investment_application",
          timestamp: new Date(current),
          device,
          browser,
          metadata: { ...baseMetadata, field },
        });

        if (field === "panNumber" && Math.random() > 0.76) {
          current.setSeconds(current.getSeconds() + randomInt(2, 6));
          addEvent(events, {
            eventType: "form_validation_error",
            page,
            fieldName: field,
            formType: "investment_application",
            timestamp: new Date(current),
            device,
            browser,
            metadata: { ...baseMetadata, field, error: "invalid_format" },
          });
        }
      }

      current.setSeconds(current.getSeconds() + randomInt(8, 25));
      const forcedAbandon = ["CHECKOUT_ABANDONER", "FRUSTRATED"].includes(persona);
      const completes = !forcedAbandon && (persona === "CONVERTER" || Math.random() > 0.45);
      addEvent(events, {
        eventType: completes ? "form_submit" : "form_abandon",
        page,
        formType: "investment_application",
        duration: Math.max(1, Math.round((current - pageEntry) / 1000)),
        timestamp: new Date(current),
        device,
        browser,
        metadata: {
          ...baseMetadata,
          form: "investment_application",
          completionPercent: completes ? 100 : randomChoice([40, 60, 80]),
        },
      });

      if (completes) {
        current.setSeconds(current.getSeconds() + randomInt(2, 6));
        addEvent(events, {
          eventType: "investment_intent",
          page,
          element: "submit-application",
          formType: "investment_application",
          timestamp: new Date(current),
          device,
          browser,
          metadata: {
            ...baseMetadata,
            form: "investment_application",
            signal: "completed_application",
          },
        });
      } else if (persona === "CHECKOUT_ABANDONER") {
        current.setSeconds(current.getSeconds() + randomInt(2, 6));
        addEvent(events, {
          eventType: "checkout_abandon",
          page,
          element: "submit-application",
          formType: "investment_application",
          timestamp: new Date(current),
          device,
          browser,
          metadata: {
            ...baseMetadata,
            form: "investment_application",
            completionPercent: randomChoice([70, 80, 90]),
          },
        });
      }
    }

    if (page === "contact" && Math.random() > 0.55) {
      current.setSeconds(current.getSeconds() + randomInt(4, 12));
      addEvent(events, {
        eventType: "contact_advisor",
        page,
        element: "request-callback",
        timestamp: new Date(current),
        device,
        browser,
        metadata: { ...baseMetadata, channel: "callback" },
      });
    }

    const pageDuration = Math.max(5, Math.round((current - pageEntry) / 1000) + randomInt(12, 55));
    current.setSeconds(current.getSeconds() + pageDuration);
    addEvent(events, {
      eventType: "time_spent",
      page,
      duration: pageDuration,
      timestamp: new Date(current),
      device,
      browser,
      metadata: { ...baseMetadata, duration: pageDuration },
    });

    if (persona === "FRUSTRATED" && page === "application-form") {
      const element = def.elements.find((item) => item.id === "submit-application") || randomChoice(def.elements);
      const point = jitterPoint(element, viewport);
      for (let clickIndex = 0; clickIndex < 5; clickIndex += 1) {
        current.setMilliseconds(current.getMilliseconds() + 250);
        addEvent(events, {
          eventType: clickIndex === 4 ? "rage_click" : "rapid_click",
          page,
          element: element.id,
          buttonName: element.label,
          x: point.x,
          y: point.y,
          timestamp: new Date(current),
          device,
          browser,
          metadata: {
            ...baseMetadata,
            element: element.id,
            label: element.label,
            x: point.x,
            y: point.y,
            clickBurst: true,
          },
        });
      }
    }

    if ((persona === "HESITANT" || persona === "CHECKOUT_ABANDONER") && Math.random() > 0.35) {
      current.setSeconds(current.getSeconds() + randomInt(31, 65));
      addEvent(events, {
        eventType: "inactive_session",
        page,
        duration: randomInt(31, 65),
        timestamp: new Date(current),
        device,
        browser,
        metadata: { ...baseMetadata, idleTime: randomInt(31, 65) },
      });
    }
  });

  if (persona === "BOUNCER") {
    addEvent(events, {
      eventType: "bounce",
      page: journey[0],
      duration: randomInt(8, 25),
      timestamp: new Date(current),
      device,
      browser,
      metadata: baseMetadata,
    });
  }

  addEvent(events, {
    eventType: "session_end",
    page: visitedPages[visitedPages.length - 1] || journey[0],
    duration: Math.max(1, Math.round((current - startTime) / 1000)),
    timestamp: new Date(current),
    device,
    browser,
    metadata: baseMetadata,
  });

  return {
    events,
    visitedPages,
    sessionStart: startTime,
    sessionEnd: current,
    duration: Math.max(1, Math.round((current - startTime) / 1000)),
    conversion: events.some((event) => ["form_submit", "checkout_complete", "investment_intent", "contact_advisor"].includes(event.eventType)),
    bounce: persona === "BOUNCER",
    daysBack,
  };
};

const persistSession = async ({ user, sessionBlueprint, device, browser, location, source }) => {
  const session = await Session.create({
    userId: user._id,
    sessionStart: sessionBlueprint.sessionStart,
    sessionEnd: sessionBlueprint.sessionEnd,
    duration: sessionBlueprint.duration,
    pagesVisited: [...new Set(sessionBlueprint.visitedPages)],
    device,
    browser,
    location,
    entrySource: source,
    connectionOrigin: "internal",
    bounce: sessionBlueprint.bounce,
    returningUser: sessionBlueprint.daysBack > 0,
    conversion: sessionBlueprint.conversion,
    status: sessionBlueprint.bounce ? "abandoned" : "completed",
    lastActive: sessionBlueprint.sessionEnd,
    eventCount: sessionBlueprint.events.length,
    rapidClickCount: sessionBlueprint.events.filter((event) => event.eventType === "rapid_click").length,
    inactiveDetected: sessionBlueprint.events.some((event) => event.eventType === "inactive_session"),
    lastPage: sessionBlueprint.visitedPages[sessionBlueprint.visitedPages.length - 1] || null,
    navigationPath: sessionBlueprint.visitedPages.map((page) => ({ page, timestamp: sessionBlueprint.sessionStart })),
  });

  const docs = sessionBlueprint.events.map((event) => ({
    userId: user._id,
    sessionId: session._id,
    eventType: event.eventType,
    page: event.page,
    element: event.element || null,
    source: event.source || source,
    buttonName: event.buttonName || null,
    formType: event.formType || null,
    fieldName: event.fieldName || null,
    duration: event.duration || null,
    scrollDepth: event.scrollDepth || null,
    intentScore: event.intentScore || null,
    x: event.x ?? null,
    y: event.y ?? null,
    device,
    browser,
    metadata: event.metadata || {},
    timestamp: event.timestamp,
  }));

  await Event.insertMany(docs, { ordered: false });
  return { session, insertedEvents: docs.length };
};

const postToEngine = async ({ user, sessionBlueprint, engineUrl, delayMs = 15 }) => {
  let sent = 0;
  let failed = 0;

  for (const event of sessionBlueprint.events) {
    const metadata = event.metadata || {};
    const payload = {
      user_id: String(user._id),
      event_type: event.eventType,
      page_id: normalizePageForEngine(event.page),
      element_id: event.element || event.buttonName || event.fieldName || null,
      dwell_time: event.duration || metadata.duration || 0,
      scroll_depth: event.scrollDepth || metadata.depth || 0,
      idle_time: metadata.idleTime || (event.eventType === "inactive_session" ? event.duration || 0 : 0),
      mouse_move_count: metadata.moveCount || 0,
      x: event.x ?? metadata.x ?? null,
      y: event.y ?? metadata.y ?? null,
      metadata: {
        ...metadata,
        userEmail: user.email,
        userName: user.fullName,
        fullName: user.fullName,
        email: user.email,
        rawEventType: event.eventType,
      },
      timestamp: new Date(event.timestamp).getTime() / 1000,
    };

    try {
      const response = await fetch(engineUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        failed += 1;
      } else {
        sent += 1;
      }
    } catch {
      failed += 1;
    }

    if (delayMs > 0) await sleep(delayMs);
  }

  return { sent, failed };
};

const summarize = (summary) => {
  console.log("\nHuman traffic simulation complete");
  console.log("---------------------------------");
  console.log(`Run ID: ${summary.runId}`);
  console.log(`Dummy users: ${summary.users}`);
  console.log(`Sessions: ${summary.sessions}`);
  console.log(`Mongo events: ${summary.mongoEvents}`);
  console.log(`Engine events sent: ${summary.engineEvents}`);
  console.log(`Engine failures: ${summary.engineFailures}`);
  console.log(`Dummy email domain: ${summary.emailDomain}`);
};

const main = async () => {
  const args = parseArgs();
  const persistToDb = ["both", "db"].includes(args.mode);
  const pushToEngine = ["both", "engine"].includes(args.mode);
  const runId = makeRunId();

  if (args.dryRun) {
    console.log("Dry run enabled. No database writes or engine posts will be made.");
  }

  if (persistToDb && !args.dryRun) {
    console.log("Connecting to MongoDB...");
    await connectMongo();
  }

  const summary = {
    runId,
    users: 0,
    sessions: 0,
    mongoEvents: 0,
    engineEvents: 0,
    engineFailures: 0,
    emailDomain: args.emailDomain,
  };

  for (let userIndex = 1; userIndex <= args.users; userIndex += 1) {
    const userData = makeDummyUserData(runId, userIndex, args.emailDomain);
    const user = args.dryRun
      ? { _id: `dry_${runId}_${userIndex}`, ...userData }
      : await createDummyUser(userData, persistToDb);
    const persona = pickPersona();

    summary.users += 1;
    console.log(`\n[${userIndex}/${args.users}] ${user.fullName} <${user.email}> (${persona})`);

    for (let sessionIndex = 1; sessionIndex <= args.sessions; sessionIndex += 1) {
      const device = randomChoice(["desktop", "desktop", "desktop", "mobile", "tablet"]);
      const browser = randomChoice(BROWSERS);
      const location = randomChoice(LOCATIONS);
      const source = randomChoice(SOURCES);
      const daysBack = randomInt(0, args.days);
      const startTime = makeTimestamp(daysBack);

      const sessionBlueprint = buildSessionEvents({
        user,
        sessionId: `${runId}_${userIndex}_${sessionIndex}`,
        persona,
        device,
        browser,
        source,
        startTime,
        daysBack,
      });

      summary.sessions += 1;

      if (args.dryRun) {
        console.log(`  session ${sessionIndex}: ${sessionBlueprint.events.length} events, ${sessionBlueprint.visitedPages.join(" -> ")}`);
        continue;
      }

      if (persistToDb) {
        const persisted = await persistSession({ user, sessionBlueprint, device, browser, location, source });
        summary.mongoEvents += persisted.insertedEvents;
      }

      if (pushToEngine) {
        const result = await postToEngine({ user, sessionBlueprint, engineUrl: args.engineUrl });
        summary.engineEvents += result.sent;
        summary.engineFailures += result.failed;
      }

      console.log(`  session ${sessionIndex}: ${sessionBlueprint.events.length} events, ${sessionBlueprint.visitedPages.join(" -> ")}`);
    }
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  summarize(summary);

  if (pushToEngine && summary.engineFailures > 0) {
    console.log(`\nNote: ${summary.engineFailures} engine event(s) failed. Start the engine or use --mode=db if you only need Mongo seed data.`);
  }
};

main().catch(async (error) => {
  console.error("\nHuman traffic simulation failed:");
  console.error(error.message);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  process.exit(1);
});
