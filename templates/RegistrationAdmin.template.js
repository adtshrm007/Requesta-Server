export const registrationAdminTemplate = (name, email, role) => ({
  subject: "🛠️ Admin Onboarding – Welcome to Requesta",
  text: `Hello ${name}, your administrative account (${role}) has been successfully activated under ${email}. Login to access your command center.`,
  html: `
    <div style="background-color: #0B0F19; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0; text-align: center;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #111827; border: 1px solid #1E293B; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        <div style="background-color: #6366F1; padding: 30px 20px;">
          <h1 style="margin: 0; font-size: 24px; color: #FFFFFF; font-weight: 800; letter-spacing: -0.01em;">Requesta Admin</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="margin: 0 0 16px; font-size: 22px; color: #F8FAFC; font-weight: 700;">Personnel Activation</h2>
          <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #94A3B8;">
            Hello <strong>${name}</strong>, your institutional credentials have been verified. You have been assigned the following administrative role:
          </p>
          <div style="background-color: #0F172A; border: 1px solid #1E293B; border-radius: 16px; padding: 24px; margin-bottom: 32px; text-align: left;">
            <div style="margin-bottom: 16px;">
              <p style="margin: 0; font-size: 11px; color: #64748B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Assigned Role</p>
              <p style="margin: 4px 0 0; font-size: 18px; color: #6366F1; font-weight: 700;">${role}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 11px; color: #64748B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Email Address</p>
              <p style="margin: 4px 0 0; font-size: 15px; color: #F1F5F9;">${email}</p>
            </div>
          </div>
          <a href="https://requesta-portal.vercel.app/admin/login" style="display: inline-block; padding: 14px 34px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px;">Access Admin Console</a>
          <p style="margin: 32px 0 0; font-size: 12px; color: #475569;">
            Secure session authorized via institutional SMTP.
          </p>
        </div>
        <div style="background-color: #0F172A; padding: 16px; border-top: 1px solid #1E293B;">
          <p style="margin: 0; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.1em;">Institutional Management Suite</p>
        </div>
      </div>
    </div>
  `,
});

