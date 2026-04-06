import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Unified sendMail wrapper — drop-in replacement for nodemailer transport.sendMail()
 * Accepts the same { from, to, subject, text, html } shape.
 */
export const transport = {
  sendMail: async ({ from, to, subject, text, html }) => {
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

console.log(
  process.env.RESEND_API_KEY
    ? "✅ Resend: API key loaded — email service ready"
    : "❌ Resend: RESEND_API_KEY missing — emails will fail"
);
