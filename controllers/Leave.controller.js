// controller.js
import LeaveModel from "../models/Leave.model.js";
import studentRegister from "../models/studentRegister.model.js";
import cloudinary from "../config/cloudinary.js";
import { leaveSubmissionTemplate } from "../templates/LeaveSubmission.template.js";
import { transport } from "../config/nodemailer.js";
import { leaveUpdateTemplate } from "../templates/LeaveUpdate.template.js";
import fs from "fs";
import mime from "mime-types";
export const handleLeaves = async (req, res) => {
  try {
    const student = await studentRegister.findById(req.user.id);

    let supportingDocumentUrl = null;

    if (req.file) {
      const fileType = mime.lookup(req.file.originalname);
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "raw", // handles pdf, image, etc.
        folder: "uploads",
        type: "upload",
        use_filename: true,
        unique_filename: false,
      });

      supportingDocumentUrl = result.secure_url;

      if (
        fileType === "application/pdf" ||
        fileType === "application/msword" ||
        fileType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileType ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      ) {
        supportingDocumentUrl = `https://docs.google.com/gview?url=${supportingDocumentUrl}&embedded=true`;
      }

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
    (async () => {
      try {
        const { subject, text, html } = leaveSubmissionTemplate(student.name);
        await transport.sendMail({
          from: '"Requesta  Portal" <adtshrm1@gmail.com>',
          to: student.email,
          subject,
          text,
          html,
        });
      } catch (emailErr) {
        console.error("Error sending registration email:", emailErr);
      }
    })();

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
    const { leaveId, status, remark } = req.body;
    const validStatus = ["approved", "rejected", "pending"];

    if (!leaveId)
      return res.status(400).json({ message: "Leave ID is required" });
    if (!validStatus.includes(status))
      return res.status(400).json({ message: "Invalid status value" });

    const updateStatus = await LeaveModel.findByIdAndUpdate(
      leaveId,
      { status, remark },
      { new: true }
    ).populate("studentId");
    (async () => {
      try {
        const { subject, text, html } = leaveUpdateTemplate(updateStatus.studentName,updateStatus.subject,updateStatus.status);
        await transport.sendMail({
          from: '"Requesta  Portal" <adtshrm1@gmail.com>',
          to: updateStatus.studentId.email,
          subject,
          text,
          html,
        });
      } catch (emailErr) {
        console.error("Error sending registration email:", emailErr);
      }
    })();

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
