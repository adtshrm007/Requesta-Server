export const registrationAdminTemplate = (name, email) => ({
  subject: "🎉 Welcome to Requesta – Registration Successful",
  text: `Hello ${name},

Welcome to Requesta! 🎉  
Your account has been successfully registered as an admin. You can now log in and start using the portal to apply for leaves, request certificates, and track your applications.

🔑 Registered Email: ${email}

Best regards,
The Requesta Team
`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
      <h2 style="color:#4CAF50;">🎉 Welcome to Requesta!</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your account has been successfully registered as an admin on the <strong>Requesta Portal</strong>.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p>We’re excited to have you onboard!</p>
      <p style="margin-top:30px;">Best regards,<br/><strong>The Requesta Team</strong></p>
    </div>
  `,
});
