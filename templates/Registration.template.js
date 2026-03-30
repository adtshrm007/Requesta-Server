export const registrationTemplate = (name, email) => ({
  subject: "🚀 Welcome to Requesta – Your Journey Begins Here",
  text: `Hello ${name}, Welcome to Requesta! Your account is active under ${email}. Log in to start your requests.`,
  html: `
    <div style="background-color: #0B0F19; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #111827; border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);">
        <div style="background-color: #6366F1; padding: 30px 20px;">
          <h1 style="margin: 0; font-size: 24px; color: #FFFFFF; font-weight: 800; letter-spacing: -0.025em;">Requesta</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="margin: 0 0 16px; font-size: 20px; color: #F8FAFC; font-weight: 700;">Welcome Onboard, ${name}!</h2>
          <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #94A3B8;">
            Your account has been successfully registered on the <strong>Requesta Institutional Portal</strong>. You are now ready to streamline your academic requests.
          </p>
          <div style="background-color: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; color: #818CF8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Registered Email</p>
            <p style="margin: 4px 0 0; font-size: 15px; color: #F1F5F9; font-weight: 500;">${email}</p>
          </div>
          <a href="https://requesta-portal.vercel.app/login" style="display: inline-block; padding: 14px 32px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; transition: all 0.2s ease;">Launch Dashboard</a>
          <p style="margin: 32px 0 0; font-size: 12px; color: #64748B;">
            If you didn't create this account, please ignore this email.
          </p>
        </div>
        <div style="background-color: #0F172A; padding: 16px; border-top: 1px solid #1E293B;">
          <p style="margin: 0; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.1em;">© 2026 Requesta Institutional Portal</p>
        </div>
      </div>
    </div>
  `,
});

