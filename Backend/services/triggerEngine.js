/**
 * ============================================================
 * FinovaWealth — Trigger Engine
 * File: services/triggerEngine.js
 * ============================================================
 * Processes behavioral triggers and dispatches actions
 * (email, in-app notification, flagging).
 * ============================================================
 */

const Trigger = require("../models/Trigger");
const Notification = require("../models/Notification");
const { sendEmail } = require("./emailService");

/**
 * Process triggered rules and create appropriate actions.
 * @param {string} userId
 * @param {Array<{ rule: string, action: string, reason: string }>} triggers
 */
const processTriggeredRules = async (userId, triggers) => {
  const results = [];

  for (const trigger of triggers) {
    // Check cooldown — don't re-fire same rule within cooldown period
    const recent = await Trigger.findOne({
      userId,
      triggerType: mapRuleToType(trigger.rule),
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // 1hr cooldown
    });

    if (recent) continue;

    // Create trigger record
    const triggerDoc = await Trigger.create({
      userId,
      triggerType: mapRuleToType(trigger.rule),
      reason: trigger.reason,
      status: "active",
      triggerAction: trigger.action,
      triggerCondition: { rule: trigger.rule },
      lastFiredAt: new Date(),
    });

    // Dispatch action
    if (trigger.action === "in_app") {
      await Notification.create({
        userId,
        type: "in_app",
        title: getTriggerTitle(trigger.rule),
        message: trigger.reason,
        notificationType: "nudge",
        triggerReason: trigger.rule,
        status: "sent",
        sentAt: new Date(),
      });
    }

    results.push(triggerDoc);
  }

  return results;
};

/** Map rule names to trigger types */
const mapRuleToType = (rule) => {
  const map = {
    high_intent_abandoner: "high_intent",
    likely_converter: "conversion",
    form_abandon_nudge: "form_abandon",
    comparison_without_conversion: "drop_off",
    checkout_recovery: "form_abandon",
  };
  return map[rule] || "custom";
};

/** Human-readable trigger titles */
const getTriggerTitle = (rule) => {
  const titles = {
    high_intent_abandoner: "Complete Your Investment",
    likely_converter: "You're Almost There!",
    form_abandon_nudge: "Pick Up Where You Left Off",
    comparison_without_conversion: "Need Help Choosing?",
    checkout_recovery: "Finish Your Application",
  };
  return titles[rule] || "Action Required";
};

/**
 * Send re-engagement email for form abandonment.
 * @param {string} email
 * @param {Object} context
 */
const sendAbandonmentEmail = async (email, context = {}) => {
  const subject = "FinovaWealth — Complete Your Investment";
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8" /></head>
    <body style="margin:0; padding:0; background-color:#f4f4f7; font-family:'Segoe UI',Roboto,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0"
              style="background:#ffffff; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.08); overflow:hidden;">
              <tr>
                <td style="background:linear-gradient(135deg,#0f172a,#1e293b); padding:32px 40px; text-align:center;">
                  <h1 style="margin:0; color:#ffffff; font-size:24px;">FinovaWealth</h1>
                  <p style="margin:6px 0 0; color:#94a3b8; font-size:13px;">Smart Investing Starts Here</p>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 40px;">
                  <h2 style="margin:0 0 12px; color:#1e293b; font-size:20px;">
                    Your Investment Is Waiting
                  </h2>
                  <p style="margin:0 0 24px; color:#64748b; font-size:15px; line-height:1.6;">
                    We noticed you were exploring ${context.formType || "investment options"} on FinovaWealth.
                    You were <strong>${context.completionPercent || 0}% complete</strong> — just a few more steps!
                  </p>
                  <div style="text-align:center; margin:0 0 28px;">
                    <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/mutual-funds"
                      style="display:inline-block; background:linear-gradient(135deg,#2E51F5,#1A36EB);
                      color:#ffffff; padding:14px 32px; border-radius:8px; font-weight:600;
                      text-decoration:none; font-size:15px;">
                      Continue Investing →
                    </a>
                  </div>
                  <p style="margin:0; color:#94a3b8; font-size:13px;">
                    If you need help, our advisory team is just a click away.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#f8fafc; padding:20px 40px; text-align:center; border-top:1px solid #e2e8f0;">
                  <p style="margin:0; color:#94a3b8; font-size:12px;">
                    &copy; ${new Date().getFullYear()} FinovaWealth. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await sendEmail(email, subject, html);
    return true;
  } catch (error) {
    console.error("Abandonment email failed:", error.message);
    return false;
  }
};

module.exports = {
  processTriggeredRules,
  sendAbandonmentEmail,
};
