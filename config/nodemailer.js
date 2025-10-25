import nodemailer from "nodemailer";

export const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.APP_PASSWORD,
  },
  logger: true,
  debug: true,
});
