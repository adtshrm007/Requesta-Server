import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
export const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.APP_PASSWORD,
  }
});

// Verify credentials on startup
transport.verify()
  .then(() => console.log("✅ Nodemailer: Gmail transport verified — ready to send emails"))
  .catch((err) => console.error("❌ Nodemailer: Gmail transport FAILED —", err.message));
