export const mailTemplate = (userName,otp) => ({
  subject: "📩 Certificate Request Reviewed – Requesta Portal",
  text: `Hello ${userName},

Your otp to change password is ${otp}. 

Thank you,
The Requesta Team
`,
});
