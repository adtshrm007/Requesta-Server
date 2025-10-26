// controller.js
import LeaveModel from "../models/leave.model.js";
import studentRegister from "../models/studentRegister.model.js";
import cloudinary from "../config/cloudinary.js";
import { leaveSubmissionTemplate } from "../templates/LeaveSubmission.template.js";
import { transport } from "../config/nodemailer.js";
import { leaveUpdateTemplate } from "../templates/LeaveUpdate.template.js";
import fs from "fs";
import mime from "mime-types";
import AdminRegister from "../models/adminRegister.model.js";
import { uploadToCloudinary } from "../middleware/multer.js";
export const handleLeaves = async (req, res) => {
  try {
    const student = await studentRegister.findById(req.user.id);

    let supportingDocumentUrl = null;

    if (req.file && req.file.buffer) {
      const fileType = req.file.mimetype;

      const result = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname
      );
      supportingDocumentUrl = result.secure_url;

      if (
        [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ].includes(fileType)
      ) {
        supportingDocumentUrl = `https://docs.google.com/gview?url=${supportingDocumentUrl}&embedded=true`;
      }
    }

    const newLeave = new LeaveModel({
      studentId: student._id,
      studentName: student.name,
      studentRegNumber: student.registrationNumber,
      subject: req.body.subject,
      Reason: req.body.Reason,
      supportingDocument: supportingDocumentUrl,
    });

    await newLeave.save();
    await sendLeaveEmail(student);

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
export const getLeavesForSuperAdmin = async (req, res) => {
  try {
    const dept = req.user.department;
    const leaves = await LeaveModel.find({ status: "approved" })
      .populate({
        path: "studentId",
        match: { branch: dept },
      })
      .then((leaves) => leaves.filter((leave) => leave.studentId !== null));
    res.json(leaves);
  } catch (err) {
    console.error("Error fetching leaves:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getLeavesForDepartmentalAdmin = async (req, res) => {
  try {
    const dept = req.user.department;
    const leaves = await LeaveModel.find({ status: "forwarded" })
      .populate({
        path: "studentId",
        match: { branch: dept },
      })
      .then((leaves) => leaves.filter((leave) => leave.studentId !== null));
    res.json(leaves);
  } catch (err) {
    console.error("Error fetching leaves:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const UpdateLeaves = async (req, res) => {
  try {
    const { leaveId, status, remark } = req.body;
    const validStatus = ["approved", "forwarded", "rejected", "pending"];

    if (!leaveId)
      return res.status(400).json({ message: "Leave ID is required" });
    if (!validStatus.includes(status))
      return res.status(400).json({ message: "Invalid status value" });

    const admin = await AdminRegister.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const updateStatus = await LeaveModel.findByIdAndUpdate(
      leaveId,
      { status, remark, approvedBy: admin.role },
      { new: true }
    ).populate("studentId");
    if (status === "rejected") {
      await AdminRegister.findByIdAndUpdate(req.user.id, {
        $inc: { rejectedLeaveRequests: 1 },
      });
    } else if (status === "approved" || status === "forwarded") {
      await AdminRegister.findByIdAndUpdate(req.user.id, {
        $inc: { acceptedLeaveRequests: 1 },
      });
    }
    (async () => {
      try {
        const { subject, text, html } = leaveUpdateTemplate(
          updateStatus.studentName,
          updateStatus.subject,
          updateStatus.status,
          updateStatus.approvedBy
        );
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

const sendLeaveEmail = async (student) => {
  try {
    const { subject, text, html } = leaveSubmissionTemplate(student.name);
    const info = await transport.sendMail({
      from: '"Requesta Portal" <adtshrm1@gmail.com>',
      to: student.email,
      subject,
      text,
      html,
    });
    console.log("Email sent: ", info);
  } catch (err) {
    console.error("Error sending leave submission email:", err);
  }
};
