import AdminRegister from "../models/adminRegister.model.js";
import Student from "../models/studentRegister.model.js"; // <-- This import was missing

// Register a new admin
export const registerAdmin = async (req, res) => {
  try {
    const { adminId, name, mobile, dept } = req.body;

    const existing = await AdminRegister.findOne({ adminId }); // FIX: Was incorrectly checking Student
    if (existing)
      return res.status(400).json({ message: "Admin already registered" });

    const newAdmin = new AdminRegister({ adminId, name, mobile, dept });
    await newAdmin.save();

    res.status(201).json({ message: "Admin registered", data: newAdmin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all registered students
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
