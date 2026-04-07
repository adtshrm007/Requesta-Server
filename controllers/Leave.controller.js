import LeaveModel from "../models/leave.model.js";
import studentRegister from "../models/studentRegister.model.js";
import AdminRegister from "../models/adminRegister.model.js";
import { uploadToCloudinary } from "../middleware/multer.js";
import { sendEmail } from "../utils/sendEmail.js";
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
      fromDate: new Date(req.body.fromDate),
      toDate: new Date(req.body.toDate),
      supportingDocument: supportingDocumentUrl,
      currentHandlerRole: "FACULTY",  // Always starts at Faculty
      createdBy: student._id,
      createdByRole: "STUDENT",
      type: "LEAVE",
    });

    await newLeave.save();

    createLog({
      requestId: newLeave._id,
      requestType: "LEAVE",
      action: "REQUEST_CREATED",
      performedBy: student._id,
      performedByName: student.name,
      role: "Student",
      remarks: `Leave application submitted for: ${req.body.subject}`,
    });

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

// ── Get Leaves for Faculty ────────────────────────────────────────────────────
// Faculty sees ALL student leave requests where they are the current handler.
// Visibility: only leaves with currentHandlerRole = "FACULTY" (pending, not yet forwarded/rejected)
export const getAllLeaves = async (req, res) => {
  try {
    // Faculty sees leaves that are still in their queue (pending, not yet acted on)
    const leaves = await LeaveModel.find({ currentHandlerRole: "FACULTY" })
      .populate("studentId")
      .sort({ createdAt: -1 });

    // Filter out null populates (shouldn't happen but safety net)
    return res.json(leaves.filter((l) => l.studentId !== null));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── Get Leaves for Departmental Admin ─────────────────────────────────────────
// DeptAdmin sees ALL student leave requests (any status, for full oversight).
// They can act on pending OR forwarded leaves (direct approval or post-faculty-forward).
export const getLeavesForDepartmentalAdmin = async (req, res) => {
  try {
    // DeptAdmin has full visibility into all student leave requests
    // No branch/dept filter — the route is already guarded by VerifyRole("Departmental Admin")
    const leaves = await LeaveModel.find({ createdByRole: "STUDENT" })
      .populate("studentId")
      .sort({ createdAt: -1 });

    return res.json(leaves.filter((l) => l.studentId !== null));
  } catch (err) {
    console.error("Error fetching leaves for DeptAdmin:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── Get ALL student leaves for Super Admin (read-only oversight) ──────────────
export const getLeavesForSuperAdmin = async (req, res) => {
  try {
    // Super Admin has full visibility — no dept/branch filter
    const leaves = await LeaveModel.find({ createdByRole: "STUDENT" })
      .populate("studentId")
      .sort({ createdAt: -1 });

    return res.json(leaves.filter((l) => l.studentId !== null));
  } catch (err) {
    console.error("Error fetching leaves for Super Admin:", err);
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

    // ── STRICT WORKFLOW CHECK (includes completed-request guard) ────────────
    const { allowed, reason } = canActOnStudentLeave(actorRole, status, leave.status);
    if (!allowed) {
      return res.status(403).json({ message: reason });
    }

    // Determine next handler role based on what action is taken
    let nextHandlerRole = leave.currentHandlerRole;
    if (status === "forwarded") {
      nextHandlerRole = "DEPT_ADMIN";
    } else if (status === "approved" || status === "rejected") {
      nextHandlerRole = null; // Request is done — remove from any queue
    }

    const updateStatus = await LeaveModel.findByIdAndUpdate(
      leaveId,
      {
        status,
        remark: remark || leave.remark,
        remarks: remark || leave.remarks,
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
    const admin = await AdminRegister.findById(req.user.id);
    if (admin) {
      if (status === "rejected") {
        await AdminRegister.findByIdAndUpdate(req.user.id, { $inc: { rejectedLeaveRequests: 1 } });
      } else if (status === "approved") {
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
          await sendEmail({
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
    const info = await sendEmail({
      from: '"Requesta Portal" <adtshrm1@gmail.com>',
      to: student.email,
      subject, text, html,
    });
    console.log("Leave email sent:", info.messageId);
  } catch (err) {
    console.error("Error sending leave submission email:", err);
  }
};
