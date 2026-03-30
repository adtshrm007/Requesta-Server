export const leaveSubmissionTemplate = (userName) => ({
  subject: "📩 Leave Application Logged – Requesta Portal",
  text: `Hello ${userName}, your leave request has been successfully submitted and is now in the administrative triage queue.`,
  html: `
    <div style="background-color: #0B0F19; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #111827; border: 1px solid #1E293B; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        <div style="background-color: #6366F1; padding: 30px 20px;">
          <h1 style="margin: 0; font-size: 24px; color: #FFFFFF; font-weight: 800; letter-spacing: -0.02em;">Requesta</h1>
        </div>
        <div style="padding: 40px 30px;">
          <div style="width: 56px; h-56px; background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; padding: 12px;">
             <span style="font-size: 24px;">📝</span>
          </div>
          <h2 style="margin: 0 0 12px; font-size: 20px; color: #F8FAFC; font-weight: 700;">Submission Confirmed</h2>
          <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #94A3B8;">
            Hello <strong>${userName}</strong>, your leave application has been successfully logged. It is now being reviewed by the administrative team.
          </p>
          <p style="margin: 0 0 32px; font-size: 13px; color: #64748B; font-style: italic;">
            You will receive another update once the status changes or further action is required.
          </p>
          <a href="https://requesta-portal.vercel.app/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px;">Track Progress</a>
        </div>
        <div style="background-color: #0F172A; padding: 16px; border-top: 1px solid #1E293B;">
          <p style="margin: 0; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.1em;">Institutional Workflow System</p>
        </div>
      </div>
    </div>
  `,
});

