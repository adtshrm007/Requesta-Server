import Student from "../models/studentRegister.model.js";
import Notification from "../models/Notifications.model.js";
import nodemailer from "nodemailer";

export const sendNotification = async (req, res) => {
  const { type } = req.body; // "accept", "reject", "reminder"
  const student = await Student.findById(req.user.id);

  // Transporter
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "adtshrm1@gmail.com",
      pass: "your-app-password",
    },
  });

  // Define templates
  const templates = {
    accept: {
      subject: "Leave Request Approved ✅",
      html: `<p>Hi ${student.name},</p>
             <p>Your leave request has been <b style="color:green;">approved</b>.</p>`,
    },
    reject: {
      subject: "Leave Request Rejected ❌",
      html: `<p>Hi ${student.name},</p>
             <p>Unfortunately, your leave request has been <b style="color:red;">rejected</b>.</p>`,
    },
    reminder: {
      subject: "Reminder ⏰",
      html: `<p>Hi ${student.name},</p>
             <p>This is a friendly reminder regarding your pending request.</p>`,
    },
  };

  // Pick template based on type
  const mailOptions = {
    from: '"College Portal" <adtshrm1@gmail.com>',
    to: student.email,
    subject: templates[type].subject,
    html: templates[type].html,
  };

  // Send mail
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error:", error);
      return res.status(500).json({ message: "Mail not sent" });
    }
    console.log("Email sent:", info.response);
  });

  // Log to DB
  const notification = new Notification({
    studentID: student._id,
    mail_log: type,
  });
  await notification.save();

  res.json({ success: true, message: `Mail sent for ${type}` });
};
