export const certificateSubmissionTemplate = (userName) => ({
  subject: "📩 Certificate Request Submitted – Requesta Portal",
  text: `Hello ${userName},

Your certificate request has been successfully submitted.  
Our admin team will review it and update you on the status.

You can log in to your Requesta dashboard anytime to track the progress.

Thank you,
The Requesta Team
`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
      <h2 style="color:#2196F3;">📩 Certificate Request Submitted</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Your certificate request has been successfully submitted. Our admin team will review it and notify you once it is approved or requires further action.</p>
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
