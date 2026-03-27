import LeaveModel from "../models/leave.model.js";
import studentRegister from "../models/studentRegister.model.js";
import AdminRegister from "../models/adminRegister.model.js";
import { uploadToCloudinary } from "../middleware/multer.js";
import { transport } from "../config/nodemailer.js";
import { leaveSubmissionTemplate } from "../templates/LeaveSubmission.template.js";
import { leaveUpdateTemplate } from "../templates/LeaveUpdate.template.js";
import { canActOnStudentLeave } from "../services/workflow.service.js";
import { createLog, getLogsForRequest } from "../services/auditLog.service.js";
import { validateStudentLeaveSubmission } from "../services/validation.service.js";
import fs from "fs";

// ── Submit Leave (Student) ────────────────────────────────────────────────────
export const handleLeaves = async (req, res) => {
  try {
    const student = await studentRegister.findById(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Smart validation
    const { errors, warnings } = await validateStudentLeaveSubmission({
      studentId: student._id,
      subject: req.body.subject,
      Reason: req.body.Reason,
    });

    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors, warnings });
    }

    let supportingDocumentUrl = null;
    if (req.file && req.file.buffer) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      supportingDocumentUrl = result.secure_url;
    }

    const newLeave = new LeaveModel({
      studentId: student._id,
      studentName: student.name,
      studentRegNumber: student.registrationNumber,
      subject: req.body.subject,
      Reason: req.body.Reason,
      supportingDocument: supportingDocumentUrl,
      currentHandlerRole: "FACULTY",
      createdByRole: "STUDENT",
    });

    await newLeave.save();

    // Audit log
    createLog({
      requestId: newLeave._id,
      requestType: "LEAVE",
      action: "REQUEST_CREATED",
      performedBy: student._id,
      performedByName: student.name,
      role: "Student",
      remarks: `Leave application submitted for: ${req.body.subject}`,
    });

    // Email (non-blocking)
    sendLeaveEmail(student).catch((err) => console.error("Error sending leave email:", err));

    return res.status(201).json({
      message: "Leave Application Sent",
      data: newLeave,
      warnings,
    });
  } catch (err) {
    console.error("Leave submission error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ── Get Leaves for Faculty (pending, their dept) ──────────────────────────────
export const getAllLeaves = async (req, res) => {
  try {
    const dept = req.user.department;
    // Faculty sees only leaves where it's their turn
    const leaves = await LeaveModel.find({ currentHandlerRole: "FACULTY" })
      .populate({ path: "studentId", match: { branch: dept } })
      .sort({ createdAt: -1 })
      .then((leaves) => leaves.filter((leave) => leave.studentId !== null));
    return res.json(leaves);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── Get Leaves for Departmental Admin (forwarded leaves, their dept) ──────────
export const getLeavesForDepartmentalAdmin = async (req, res) => {
  try {
    const dept = req.user.department;
    const leaves = await LeaveModel.find({ currentHandlerRole: "DEPT_ADMIN" })
      .populate({ path: "studentId", match: { branch: dept } })
      .sort({ createdAt: -1 })
      .then((leaves) => leaves.filter((leave) => leave.studentId !== null));
    return res.json(leaves);
  } catch (err) {
    console.error("Error fetching leaves:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── Get ALL leaves for Super Admin to VIEW (read-only) ────────────────────────
export const getLeavesForSuperAdmin = async (req, res) => {
  try {
    const dept = req.user.department;
    // Super Admin can VIEW all leaves (all statuses) but cannot act on them
    const leaves = await LeaveModel.find()
      .populate({ path: "studentId", match: { branch: dept } })
      .sort({ createdAt: -1 })
      .then((leaves) => leaves.filter((leave) => leave.studentId !== null));
    return res.json(leaves);
  } catch (err) {
    console.error("Error fetching leaves:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── Update Leave Status (RBAC enforced) ───────────────────────────────────────
export const UpdateLeaves = async (req, res) => {
  try {
    const { leaveId, status, remark } = req.body;
    const actorRole = req.user.role;

    if (!leaveId) return res.status(400).json({ message: "Leave ID is required" });
    if (!status) return res.status(400).json({ message: "Status is required" });

    const leave = await LeaveModel.findById(leaveId).populate("studentId");
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    // ── STRICT WORKFLOW CHECK ───────────────────────────────────────────────
    const { allowed, reason } = canActOnStudentLeave(actorRole, status, leave.status);
    if (!allowed) {
      return res.status(403).json({ message: reason });
    }

    // Determine next handler role
    let nextHandlerRole = leave.currentHandlerRole;
    if (status === "forwarded") {
      nextHandlerRole = "DEPT_ADMIN";
    }

    // Update the leave
    const updateStatus = await LeaveModel.findByIdAndUpdate(
      leaveId,
      {
        status,
        remark: remark || leave.remark,
        approvedBy: actorRole,
        currentHandlerRole: nextHandlerRole,
      },
      { new: true }
    ).populate("studentId");

    // Audit log
    const action =
      status === "forwarded"
        ? "REQUEST_FORWARDED"
        : status === "approved"
        ? "REQUEST_APPROVED"
        : "REQUEST_REJECTED";

    const admin = await AdminRegister.findById(req.user.id);
    createLog({
      requestId: leaveId,
      requestType: "LEAVE",
      action,
      performedBy: req.user.id,
      performedByName: req.user.name,
      role: actorRole,
      remarks: remark || null,
    });

    // Update admin stats
    if (admin) {
      if (status === "rejected") {
        await AdminRegister.findByIdAndUpdate(req.user.id, { $inc: { rejectedLeaveRequests: 1 } });
      } else if (status === "approved" || status === "forwarded") {
        await AdminRegister.findByIdAndUpdate(req.user.id, { $inc: { acceptedLeaveRequests: 1 } });
      }
    }

    // Email notification (non-blocking)
    if (updateStatus.studentId?.email) {
      (async () => {
        try {
          const { subject, text, html } = leaveUpdateTemplate(
            updateStatus.studentName,
            updateStatus.subject,
            updateStatus.status,
            actorRole
          );
          await transport.sendMail({
            from: '"Requesta Portal" <adtshrm1@gmail.com>',
            to: updateStatus.studentId.email,
            subject, text, html,
          });
        } catch (emailErr) {
          console.error("Error sending leave update email:", emailErr);
        }
      })();
    }

    return res.status(200).json({ message: "Status updated successfully", data: updateStatus });
  } catch (err) {
    console.error("Error updating leaves:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── Get Audit Logs for a Leave Request ───────────────────────────────────────
export const getLeaveAuditLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await getLogsForRequest(id);
    return res.status(200).json({ data: logs });
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── Internal: send leave submission email ─────────────────────────────────────
const sendLeaveEmail = async (student) => {
  try {
    const { subject, text, html } = leaveSubmissionTemplate(student.name);
    const info = await transport.sendMail({
      from: '"Requesta Portal" <adtshrm1@gmail.com>',
      to: student.email,
      subject, text, html,
    });
    console.log("Leave email sent:", info.messageId);
  } catch (err) {
    console.error("Error sending leave submission email:", err);
  }
};
