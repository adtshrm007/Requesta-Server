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

// ── Create a single persistent transporter ──────────────
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  family: 4, // Force IPv4 to prevent ENETUNREACH IPv6 routing errors
  auth: {
    user: process.env.USER_EMAIL || "adtshrm1@gmail.com",
    pass: process.env.APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000, // 10 seconds max wait for connection
  socketTimeout: 15000,
});

// ── Verify on startup ─────────────────────────────────────────────────────────
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ [Email] SMTP FAILED:", err.message);
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
