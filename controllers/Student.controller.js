// Student.controller.js
import Student from "../models/studentRegister.model.js";
import LeaveModel from "../models/Leave.model.js";
import Certificate from "../models/Certificate.model.js";
import { transport } from "../config/nodemailer.js";
import { registrationTemplate } from "../templates/Registration.template.js";
export const registerStudent = async (req, res) => {
  try {
    const { registrationNumber, name, email, password, branch, year } =
      req.body;
    const existing = await Student.findOne({
      $or: [
        { registrationNumber: req.body.registrationNumber },
        { email: req.body.email },
      ],
    });

    if (existing) {
      return res.status(400).json({
        message: "Student already registered with this reg. no or email",
      });
    }

    const newStudent = new Student({
      registrationNumber,
      name,
      email,
      password,
      branch,
      year,
    });
    await newStudent.save();
    (async () => {
      try {
        const { subject, text, html } = registrationTemplate(name, email);
        await transport.sendMail({
          from: '"Requesta Portal" <adtshrm1@gmail.com>',
          to: email,
          subject,
          text,
          html,
        });
      } catch (emailErr) {
        console.error("Error sending registration email:", emailErr);
      }
    })();

    res.status(201).json({ message: "Student registered", data: newStudent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const loginStudent = async (req, res) => {
  const { registrationNumber, password } = req.body;
  try {
    const student = await Student.findOne({ registrationNumber });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    const isMatch = await student.isPasswordCorrect(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const accessToken = student.generateAccessToken();
    const refreshToken = student.generateRefreshToken();
    student.refreshToken = refreshToken;
    await student.save();
    res.json({
      message: "Student Found",
      data: student,
      accessToken,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { name, email, password, branch, year } = req.body;

    const updatedStudent = await Student.findOneAndUpdate(
      { registrationNumber: req.user.registrationNumber }, // or use _id: req.user.id
      { name, email, password, branch, year },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      data: updatedStudent,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
export const getLeaves = async (req, res) => {
  try {
    const leaves = await LeaveModel.find({ studentId: req.user.id })
      .populate("studentId")
      .sort({ createdAt: -1 });

    res.status(200).json(leaves);
  } catch (err) {
    console.error("Error fetching leaves:", err);
    res.status(500).json({ error: "Server error while fetching leaves" });
  }
};
export const getCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.user.id })
      .populate("student")
      .sort({ createdAt: -1 });

    res.status(200).json(certificates);
  } catch (err) {
    console.error("Error fetching certificates:", err);
    res.status(500).json({ error: "Server error while fetching certificates" });
  }
};
