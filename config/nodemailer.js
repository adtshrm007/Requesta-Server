import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ── Debug: print env values the moment this file loads ───────────────────────
// This tells you immediately if APP_PASSWORD is undefined (ESM hoisting issue).
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("[Email] USER_EMAIL   →", process.env.USER_EMAIL || "❌ NOT SET");
console.log(
  "[Email] APP_PASSWORD →",
  process.env.APP_PASSWORD
    ? `✅ loaded (${process.env.APP_PASSWORD.length} chars)`
    : "❌ NOT SET"
);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// ── Create transporter ────────────────────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS — correct for port 587
    auth: {
      user: "adtshrm1@gmail.com",
      pass: process.env.APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

// ── Verify on startup — async/await so it CANNOT be silently swallowed ────────
(async () => {
  try {
    const t = createTransporter();
    await t.verify();
    console.log("✅ [Email] SMTP verified — Gmail is connected and ready.");
  } catch (err) {
    console.error("❌ [Email] SMTP FAILED:", err.message);
    console.error(
      "   Fix 1 → Regenerate App Password at: https://myaccount.google.com/apppasswords"
    );
    console.error(
      "   Fix 2 → Confirm 2-Step Verification is ON for adtshrm1@gmail.com"
    );
    console.error(
      "   Fix 3 → If this is a college/workspace Google account, App Passwords may be disabled"
    );
  }
})();

// ── Exported transport ────────────────────────────────────────────────────────
export const transport = {
  sendMail: async ({ from, to, subject, text, html }) => {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: from || `"Requesta Portal" <adtshrm1@gmail.com>`,
      to,
      subject,
      ...(text && { text }),
      ...(html && { html }),
    });

    console.log(
      `✅ [Email] Sent | To: ${to} | Subject: "${subject}" | ID: ${info.messageId}`
    );
    return { messageId: info.messageId };
  },
};
