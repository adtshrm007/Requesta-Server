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
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
