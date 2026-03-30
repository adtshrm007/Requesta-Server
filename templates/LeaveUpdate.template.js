export const leaveUpdateTemplate = (userName, subject, status, role) => {
  const statusColor = 
    status?.toLowerCase() === "approved" ? "#10B981" : 
    status?.toLowerCase() === "rejected" ? "#EF4444" : 
    status?.toLowerCase() === "forwarded" ? "#F59E0B" : "#6366F1";

  const statusIcon = 
    status?.toLowerCase() === "approved" ? "✅" : 
    status?.toLowerCase() === "rejected" ? "❌" : 
    status?.toLowerCase() === "forwarded" ? "⏩" : "📩";

  return {
    subject: `🔔 Update: Your Leave Request for "${subject}" has been ${status.toUpperCase()}`,
    text: `Hello ${userName}, your leave request for "${subject}" has been ${status} by ${role}. Check your dashboard for details.`,
    html: `
      <div style="background-color: #0B0F19; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #111827; border: 1px solid #1E293B; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <div style="background-color: #0F172A; padding: 20px; border-bottom: 1px solid #1E293B;">
            <p style="margin: 0; font-size: 11px; color: #6366F1; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em;">Requesta Status Update</p>
          </div>
          <div style="padding: 40px 30px;">
            <div style="display: inline-block; padding: 8px 16px; background-color: ${statusColor}20; border: 1px solid ${statusColor}40; border-radius: 100px; margin-bottom: 24px;">
              <span style="color: ${statusColor}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${statusIcon} ${status}</span>
            </div>
            <h2 style="margin: 0 0 16px; font-size: 20px; color: #F8FAFC; font-weight: 700;">Request Reviewed</h2>
            <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #94A3B8; text-align: left;">
              Hello <strong>${userName}</strong>, <br/><br/>
              The administrative review for your request <strong>"${subject}"</strong> is complete. Action taken by <strong>${role}</strong>.
            </p>
            <div style="background-color: #0F172A; border-radius: 12px; padding: 20px; text-align: left; border: 1px solid #1E293B; margin-bottom: 32px;">
              <p style="margin: 0; font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase;">Updated Status</p>
              <p style="margin: 4px 0 0; font-size: 16px; color: ${statusColor}; font-weight: 700;">${status.toUpperCase()}</p>
            </div>
            <a href="https://requesta-portal.vercel.app/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #6366F1; color: #FFFFFF; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px;">Review in Dashboard</a>
          </div>
          <div style="background-color: #0F172A; padding: 16px; border-top: 1px solid #1E293B;">
            <p style="margin: 0; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.1em;">Institutional Workflow Engine</p>
          </div>
        </div>
      </div>
    `,
  };
};

