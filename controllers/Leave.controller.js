// controller.js
import LeaveModel from "../models/Leave.model.js";

export const handleLeaves = async (req, res) => {
  try {
    const { student, Reason, status, SupportingDocuments } = req.body;

    const newLeaveApplication = new LeaveModel({
      student,
      Reason,
      status,
      SupportingDocuments, // fixed field name
    });

    await newLeaveApplication.save();

    res.status(201).json({
      message: "Leave Application Sent",
      data: newLeaveApplication,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllLeaves = async (req, res) => {
  try {
    const leavemodels = await LeaveModel.find().populate(
      "student",
      "name registrationNumber" // fixed spelling
    );
    res.status(200).json(leavemodels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
