// controller.js
import LeaveModel from "../models/Leave.model.js";
import Student from "../models/studentRegister.model.js";
import cloudinary from "../config/cloudinary.js"
import fs from "fs";
import mime from "mime-types";
export const handleLeaves = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);

    let supportingDocumentUrl = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "auto", // handles pdf, image, etc.
      });

      supportingDocumentUrl = result.secure_url;

      // delete local file
      fs.unlinkSync(req.file.path);
    }

    const newLeave = new LeaveModel({
      studentId: student._id,
      studentName: student.name,
      studentRegNumber: student.registrationNumber,
      subject: req.body.subject,
      Reason: req.body.Reason, // make sure your frontend also sends lowercase "reason"
      supportingDocument: supportingDocumentUrl,
    });

    await newLeave.save();

    res.status(201).json({
      message: "Leave Application Sent",
      data: newLeave,
    });
  } catch (err) {
    console.error("Leave submission error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllLeaves = async (req, res) => {
  try {
    const dept = req.user.department;
    const leaves = await LeaveModel.find()
      .populate({ path: "studentId", match: { branch: dept } })
      .then((leaves) => leaves.filter((leave) => leave.studentId !== null));
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const UpdateLeaves = async (req, res) => {
  try {
    const { leaveId, status } = req.body;
    const validStatus = ["approved", "rejected", "pending"];

    if (!leaveId)
      return res.status(400).json({ message: "Leave ID is required" });
    if (!validStatus.includes(status))
      return res.status(400).json({ message: "Invalid status value" });

    const updateStatus = await LeaveModel.findByIdAndUpdate(
      leaveId,
      { status },
      { new: true }
    ).populate("studentId");

    if (!updateStatus)
      return res.status(404).json({ message: "Leave not found" });

    return res
      .status(200)
      .json({ message: "Status updated successfully", data: updateStatus });
  } catch (err) {
    console.error("Error updating leaves:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
