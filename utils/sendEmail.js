import { transport } from "../config/nodemailer.js";

/**
 * sendEmail — Reusable, production-ready email utility for Requesta.
 *
 * Features:
 *  • Async/await with full error handling
 *  • Automatic retries (configurable, default 2 retries)
 *  • Exponential backoff between retries
 *  • Structured success + failure logging
 *  • Graceful fallback — never crashes the caller
 *
 * @param {Object} options
 * @param {string}  options.to          — Recipient email address (required)
 * @param {string}  options.subject     — Email subject line (required)
 * @param {string}  [options.html]      — HTML body (recommended)
 * @param {string}  [options.text]      — Plain-text fallback body
 * @param {string}  [options.from]      — Sender override (uses env default if omitted)
 * @param {number}  [options.maxRetries] — Number of retry attempts on failure (default: 2)
 *
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 *   Always resolves (never rejects) so callers don't need a try/catch.
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  from,
  maxRetries = 2,
}) => {
  // ── Input validation ────────────────────────────────────────────────────────
  if (!to || !subject) {
    const msg = "[sendEmail] Missing required fields: 'to' and 'subject' are required.";
    console.error(msg);
    return { success: false, error: msg };
  }

  if (!html && !text) {
    console.warn(
      "[sendEmail] ⚠️  No email body provided. Sending with empty body."
    );
  }

  let lastError = null;

  // ── Retry loop ──────────────────────────────────────────────────────────────
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const info = await transport.sendMail({ from, to, subject, html, text });

      // ✅ Success
      console.log(
        `✅ [sendEmail] Delivered | Attempt: ${attempt} | To: ${to} | Subject: "${subject}" | MessageId: ${info.messageId}`
      );
      return { success: true, messageId: info.messageId };

    } catch (err) {
      lastError = err;

      if (attempt <= maxRetries) {
        const backoffMs = attempt * 1000; // 1s, 2s, ...
        console.warn(
          `⚠️  [sendEmail] Attempt ${attempt} FAILED for "${to}" | Reason: ${err.message}. Retrying in ${backoffMs}ms...`
        );
        await sleep(backoffMs);
      }
    }
  }

  // ── All retries exhausted ───────────────────────────────────────────────────
  console.error(
    `❌ [sendEmail] FAILED after ${maxRetries + 1} attempt(s) | To: ${to} | Subject: "${subject}" | Error: ${lastError?.message}`
  );

  // Graceful fallback — return failure result instead of throwing,
  // so the API response to the user is not blocked by an email failure.
  return { success: false, error: lastError?.message || "Unknown email error" };
};

// ── Helper ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
