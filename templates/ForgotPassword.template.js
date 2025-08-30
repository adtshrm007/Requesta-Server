export const mailTemplate = (userName, otp) => ({
  subject: "📩 Login using Email – Requesta Portal",
  text: `Hello ${userName},

Your otp is ${otp}. 

Thank you,
The Requesta Team
`,
});
