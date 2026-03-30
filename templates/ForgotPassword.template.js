export const mailTemplate = (userName, otp) => ({
  subject: "🔐 Secure Verification Code – Requesta Portal",
  text: `Hello ${userName}, your verification code is ${otp}. This code will expire shortly.`,
  html: `
    <div style="background-color: #0B0F19; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0; text-align: center;">
      <div style="max-width: 460px; margin: 0 auto; background-color: #111827; border: 1px solid #1E293B; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        <div style="background-color: #0F172A; padding: 20px; border-bottom: 1px solid #1E293B;">
          <p style="margin: 0; font-size: 11px; color: #6366F1; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em;">Security Verification</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="margin: 0 0 12px; font-size: 20px; color: #F8FAFC; font-weight: 700;">Identity Verification</h2>
          <p style="margin: 0 0 32px; font-size: 14px; line-height: 1.6; color: #94A3B8;">
            Hello <strong>${userName}</strong>, use the secure code below to complete your sign-in or password reset.
          </p>
          <div style="background-color: rgba(99, 102, 241, 0.1); border: 2px dashed rgba(99, 102, 241, 0.3); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
            <p style="margin: 0 0 8px; font-size: 11px; color: #818CF8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Verification Code</p>
            <h1 style="margin: 0; font-size: 42px; color: #FFFFFF; font-weight: 800; letter-spacing: 0.2em;">${otp}</h1>
          </div>
          <p style="margin: 0 0 8px; font-size: 13px; color: #64748B;">This code is valid for a limited time.</p>
          <p style="margin: 0; font-size: 11px; color: #475569;">If you did not request this code, please secure your account immediately.</p>
        </div>
        <div style="background-color: #0F172A; padding: 16px; border-top: 1px solid #1E293B;">
          <p style="margin: 0; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.1em;">Requesta Security Shield</p>
        </div>
      </div>
    </div>
  `,
});

