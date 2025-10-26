import nodemailer from "nodemailer";

export const transport = nodemailer.createTransport({
  service: "gmail",
  port:587,
  secure:true,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.APP_PASSWORD,
  },
  logger: true,
  debug: true,
});
