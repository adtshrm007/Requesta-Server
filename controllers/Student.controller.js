// Student.controller.js
import Student from "../models/studentRegister.model.js";

export const registerStudent = async (req, res) => {
  try {
    const { registrationNumber, name, mobileNumber, branch, year } = req.body;

    const existing = await Student.findOne({ registrationNumber });
    if (existing)
      return res.status(400).json({ message: "Already registered" });

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
      res.json(student);
    } else {
      res.status(404).json({ message: "Student not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
