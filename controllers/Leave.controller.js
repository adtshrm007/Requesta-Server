// controller.js
import LeaveModel from "../models/Leave.model.js";
import Student from "../models/studentRegister.model.js";

export const handleLeaves = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);

    const newLeave = new LeaveModel({
      studentId: student._id,
      studentName: student.name,
      studentRegNumber: student.registrationNumber,
      subject:req.body.subject,
      Reason: req.body.Reason,
    });

    await newLeave.save();

    res.status(201).json({
      message: "Leave Application Sent",
      data: newLeave,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await LeaveModel.find().populate("studentId");
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
