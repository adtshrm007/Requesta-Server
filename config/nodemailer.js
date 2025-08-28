import nodemaier from "nodemailer";

export const transport = nodemaier.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});
