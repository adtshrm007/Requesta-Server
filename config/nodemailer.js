import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

// Lazy initialization — don't crash on startup if key is missing
let _resend = null;
const getResend = () => {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY environment variable is not set.");
    _resend = new Resend(key);
  }
  return _resend;
};

/**
 * Unified sendMail wrapper — drop-in replacement for nodemailer transport.sendMail()
 * Accepts the same { from, to, subject, text, html } shape.
 */
export const transport = {
  sendMail: async ({ from, to, subject, text, html }) => {
    const resend = getResend();
    const result = await resend.emails.send({
      from: from || `Requesta Portal <onboarding@resend.dev>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html,
    });

    if (result.error) {
      throw new Error(result.error.message || "Resend email failed");
    }

    console.log("[Email] Sent successfully | ID:", result.data?.id);
    return { messageId: result.data?.id };
  },
};

if (!process.env.RESEND_API_KEY) {
  console.warn("⚠️  Resend: RESEND_API_KEY not set — emails will fail until this is added to Render env vars");
} else {
  console.log("✅ Resend: API key loaded — email service ready");
}
