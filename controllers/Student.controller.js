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
    const student = await Student.findOne({ registrationNumber });
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

export const updateStudent = async (req, res) => {
  try {
    const { name, mobileNumber, branch, year } = req.body;

    const updatedStudent = await Student.findOneAndUpdate(
      { registrationNumber: req.user.registrationNumber }, // or use _id: req.user.id
      { name, mobileNumber, branch, year },
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



