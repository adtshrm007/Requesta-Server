// Student.controller.js
import Student from "../models/studentRegister.model.js";

export const registerStudent = async (req, res) => {
  try {
    const { registrationNumber, name, mobileNumber, branch, year } = req.body;
    const existing = await Student.findOne({
      $or: [
        { registrationNumber: req.body.registrationNumber },
        { mobileNumber: req.body.mobileNumber },
      ],
    });

    if (existing) {
      return res.status(400).json({
        message: "Student already registered with this reg. no or mobile no",
      });
    }

    const newStudent = new Student({
      registrationNumber,
      name,
      mobileNumber,
      branch,
      year,
    });
    await newStudent.save();

    res.status(201).json({ message: "Student registered", data: newStudent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllStudents = async (req, res) => {
  const { registrationNumber } = req.query;
  try {
    const student = await Student.findOne({ registrationNumber }); // Assuming MongoDB
    if (student) {
      const accessToken = student.generateAccessToken();
      const refreshToken = student.generateRefreshToken();
      student.refreshToken = refreshToken;
      await student.save();
      res.json({
        message: "Student Found",
        data: student,
        accessToken,
      });
    } else {
      res.status(404).json({ message: "Student not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
