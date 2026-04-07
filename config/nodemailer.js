import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ── Validate required environment variables at startup ────────────────────────
const REQUIRED_ENV = ["USER_EMAIL", "APP_PASSWORD"];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(
    `❌ [Email] Missing required environment variables: ${missingEnv.join(", ")}`
  );
  console.error(
    "   → Add them to your .env file. Email service will fail until then."
  );
} else {
  console.log(
    `✅ [Email] Nodemailer ready — using Gmail SMTP as ${process.env.USER_EMAIL}`
  );
}

// ── Create Gmail SMTP transporter ─────────────────────────────────────────────
// Uses Gmail App Password (NOT your normal Gmail password).
// Generate one at: https://myaccount.google.com/apppasswords
const createTransporter = () => {
  if (missingEnv.length > 0) {
    throw new Error(
      `Cannot create email transporter: missing env vars [${missingEnv.join(", ")}]`
    );
  }

  return nodemailer.createTransport({
    service: "gmail",          // Resolves host/port automatically for Gmail
    auth: {
      user: process.env.USER_EMAIL,   // e.g. adtshrm1@gmail.com
      pass: process.env.APP_PASSWORD, // 16-char App Password (spaces are ignored)
    },
    // Explicit TLS options — belt-and-suspenders for localhost dev
    tls: {
      rejectUnauthorized: false, // Allow self-signed certs in dev; set true in prod
    },
  });
};

// ── Verify transporter on startup (non-blocking) ──────────────────────────────
// This pings Gmail's SMTP server to confirm credentials are valid.
if (missingEnv.length === 0) {
  const verifyTransporter = createTransporter();
  verifyTransporter.verify((err) => {
    if (err) {
      console.error("❌ [Email] SMTP verification FAILED:", err.message);
      console.error(
        "   → Check USER_EMAIL and APP_PASSWORD in your .env file."
      );
      console.error(
        "   → Make sure 2-Step Verification is ON and you used an App Password."
      );
    } else {
      console.log("✅ [Email] SMTP connection verified — ready to send emails.");
    }
  });
}

// ── Exported transport object ──────────────────────────────────────────────────
// This object mirrors the nodemailer transport interface so all existing
// controllers that call `transport.sendMail(...)` continue to work without
// any changes. Each call creates a fresh transporter to avoid stale connections.
export const transport = {
  sendMail: async ({ from, to, subject, text, html }) => {
    const transporter = createTransporter(); // Fresh instance per send

    const mailOptions = {
      from: from || `"Requesta Portal" <${process.env.USER_EMAIL}>`,
      to,
      subject,
      ...(text && { text }),
      ...(html && { html }),
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(
      `✅ [Email] Sent successfully | To: ${to} | Subject: "${subject}" | MessageId: ${info.messageId}`
    );

    return { messageId: info.messageId };
  },
};
