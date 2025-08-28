export const leaveUpdateTemplate = (userName, subject, status) => ({
  subject: "📩 Leave Request Reviewed – Requesta Portal",
  text: `Hello ${userName},

Your leave request has been successfully reviewed.  



Thank you,
The Requesta Team
`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
      <h2 style="color:#2196F3;">📩 Leave Request Updated</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Your leave request has been successfully reviewed.Your leave requests for <b>${subject}</b> has been <b>${status}</b></p>
      <p><a href="http://your-frontend-url/dashboard" 
            style="display:inline-block; margin:15px 0; padding:12px 20px; background:#2196F3; color:#fff; text-decoration:none; border-radius:6px;">
            View Dashboard
          </a>
      </p>
      <p>Thank you for using Requesta!</p>
      <p style="margin-top:30px;">Best regards,<br/><strong>The Requesta Team</strong></p>
    </div>
  `,
});
