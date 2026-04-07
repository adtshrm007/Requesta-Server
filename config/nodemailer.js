import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ── Debug: print env values the moment this file loads ───────────────────────
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("[Email] USER_EMAIL   →", process.env.USER_EMAIL || "❌ NOT SET");
console.log(
  "[Email] APP_PASSWORD →",
  process.env.APP_PASSWORD
    ? `✅ loaded (${process.env.APP_PASSWORD.length} chars)`
    : "❌ NOT SET"
);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// ── Create a single persistent transporter with connection pooling ──────────────
const transporter = nodemailer.createTransport({
  pool: true, // Use pooled connections for production efficiency
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Implicit SSL — highly recommended for production
  auth: {
    user: process.env.USER_EMAIL || "adtshrm1@gmail.com",
    pass: process.env.APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ── Verify on startup ─────────────────────────────────────────────────────────
// Note: We don't block exports, but we log connection status
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ [Email] SMTP FAILED:", err.message);
    console.error(
      "   Fix 1 → Check if environment variables are injected correctly in your production host."
    );
    console.error(
      "   Fix 2 → Regenerate App Password at: https://myaccount.google.com/apppasswords"
    );
  } else {
    console.log("✅ [Email] SMTP verified — Gmail is connected and ready.");
  }
});

// ── Exported transport wrapper ────────────────────────────────────────────────
export const transport = {
  sendMail: async ({ from, to, subject, text, html }) => {
    const info = await transporter.sendMail({
      from: from || `"Requesta Portal" <${process.env.USER_EMAIL || "adtshrm1@gmail.com"}>`,
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
