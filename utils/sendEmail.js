/**
 * sendEmail — Dummy placeholder function
 * Nodemailer and the email transport config were completely removed from the project.
 * This file remains so that controller imports don't crash the server.
 */
export const sendEmail = async (options) => {
  // Doing nothing, mock success to gracefully handle internal codebase logic
  console.log(`[Email System Removed] Ignored email meant for: ${options?.to}`);
  return { success: true, messageId: "email-system-removed" };
};
