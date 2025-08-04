import AdminRegister from "../models/adminRegister.model.js";
import Student from "../models/studentRegister.model.js"; // <-- This import was missing

// Register a new admin
export const registerAdmin = async (req, res) => {
  try {
    const { adminID, name, mobileNumber, department } = req.body;

    const existing = await AdminRegister.findOne({ adminID }); // FIX: Was incorrectly checking Student
    if (existing)
      return res.status(400).json({ message: "Admin already registered" });

    const newAdmin = new AdminRegister({ adminID, name, mobileNumber, department });
    await newAdmin.save();

    res.status(201).json({ message: "Admin registered", data: newAdmin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all registered students
export const getAdmin = async (req, res) => {
  const {adminID}=req.query;
  try {
    const admin = await AdminRegister.findOne({adminID});
    if (admin) {
      res.json(admin);
    } else {
      res.status(404).json({ message: "Admin not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


