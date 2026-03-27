import AdminRegister from "../models/adminRegister.model.js";
import LeaveAdminModel from "../models/LeaveAdmins.model.js";
import { uploadToCloudinary } from "../middleware/multer.js";
import { canActOnAdminLeave } from "../services/workflow.service.js";
import { createLog, getLogsForRequest } from "../services/auditLog.service.js";
import { leaveUpdateTemplate } from "../templates/LeaveUpdate.template.js";
import { transport } from "../config/nodemailer.js";

// ── Submit Leave (Admin: Faculty or Departmental Admin) ───────────────────────
export const submitLeaves = async (req, res) => {
  try {
    const admin = await AdminRegister.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Balance checks
    if (admin.medicalLeaveLeft <= 0 && req.body.type === "Medical Leave") {
      return res.status(400).json({ message: "No Medical Leaves Left" });
    }
    if (admin.officialLeaveLeft <= 0 && req.body.type === "Official Leave") {
      return res.status(400).json({ message: "No Official Leaves Left" });
    }
    if (admin.casualLeaveLeft <= 0 && req.body.type === "Casual Leave") {
      return res.status(400).json({ message: "No Casual Leaves Left" });
    }

    // Determine handler based on submitter role
    // Faculty leave → Departmental Admin handles it
    // Departmental Admin leave → Super Admin handles it
    const handlerRole = admin.role === "Faculty" ? "DEPT_ADMIN" : "SUPER_ADMIN";

    let supportingDocumentUrl = null;
    if (req.file && req.file.buffer) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      supportingDocumentUrl = result.secure_url;
    }

    const newLeave = new LeaveAdminModel({
      admin: admin._id,
      supportingDocument: supportingDocumentUrl,
      type: req.body.type,
      remark: req.body.remark,
      reason: req.body.reason,
      fromDate: req.body.fromDate,
      toDate: req.body.toDate,
      currentHandlerRole: handlerRole,
      createdBy: admin._id,
      createdByRole: admin.role,
    });

    await newLeave.save();

    // Audit log
    createLog({
      requestId: newLeave._id,
      requestType: "ADMIN_LEAVE",
      action: "REQUEST_CREATED",
      performedBy: admin._id,
      performedByName: admin.name,
      role: admin.role,
      remarks: `${req.body.type} leave application submitted`,
    });

    return res.status(200).json({
      message: "Leave application submitted successfully",
      data: newLeave,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── Get own leaves (for the logged-in admin) ──────────────────────────────────
export const getAdminLeaves = async (req, res) => {
  try {
    const leave = await LeaveAdminModel.find({ admin: req.user.id })
      .populate({ path: "admin" })
      .sort({ createdAt: -1 });
    return res.status(200).json({ data: leave || [] });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ── Get ALL admin leaves (Super Admin sees everything) ────────────────────────
export const getAllAdminLeaves = async (req, res) => {
  try {
    const leave = await LeaveAdminModel.find()
      .populate({ path: "admin" })
      .sort({ createdAt: -1 });
    return res.status(200).json({ data: leave || [] });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ── Show Faculty Leaves (for Departmental Admin — leaves where it's their turn) ─
export const showFacultyLeave = async (req, res) => {
  try {
    const adminDepartment = req.user.department;
    if (!adminDepartment) return res.status(404).json({ message: "Admin not found" });

    // Dept Admin sees ALL faculty leaves assigned to their department
    const leaves = await LeaveAdminModel.find()
      .populate({
        path: "admin",
        match: { role: "Faculty", department: adminDepartment },
      })
      .sort({ createdAt: -1 })
      .then((leaves) => leaves.filter((leave) => leave.admin !== null));

    return res.json(leaves);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── Show Departmental Admin Leaves (for Super Admin) ─────────────────────────
export const showDepartemntalAdminLeave = async (req, res) => {
  try {
    // Super Admin oversees all departments, so no strict department match is required
    const leaves = await LeaveAdminModel.find({ currentHandlerRole: "SUPER_ADMIN" })
      .populate({
        path: "admin",
        match: { role: "Departmental Admin" },
      })
      .sort({ createdAt: -1 })
      .then((leaves) => leaves.filter((leave) => leave.admin !== null));

    return res.json(leaves);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── Update Admin Leave Status (RBAC enforced) ─────────────────────────────────
export const UpdateLeaves = async (req, res) => {
  try {
    const { leaveId, status, remark } = req.body;
    const actorRole = req.user.role;

    if (!leaveId) return res.status(400).json({ message: "Leave ID is required" });
    if (!status) return res.status(400).json({ message: "Status is required" });

    const leave = await LeaveAdminModel.findById(leaveId).populate("admin");
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    // ── STRICT WORKFLOW CHECK ───────────────────────────────────────────────
    const submitterRole = leave.admin?.role;
    const { allowed, reason } = canActOnAdminLeave(actorRole, submitterRole, status, leave.status);
    if (!allowed) {
      return res.status(403).json({ message: reason });
    }

    const updateStatus = await LeaveAdminModel.findByIdAndUpdate(
      leaveId,
      { 
        status, 
        remark: remark || leave.remark, 
        approvedBy: actorRole,
        currentHandlerRole: null // Clear handler queue 
      },
      { new: true }
    ).populate("admin");

    const applicant = updateStatus.admin;
    if (!applicant) return res.status(404).json({ message: "Applicant not found" });

    // Audit log
    const action = status === "approved" ? "REQUEST_APPROVED" : "REQUEST_REJECTED";
    createLog({
      requestId: leaveId,
      requestType: "ADMIN_LEAVE",
      action,
      performedBy: req.user.id,
      performedByName: req.user.name,
      role: actorRole,
      remarks: remark || null,
    });

    // Update leave balances on approval
    if (status === "approved") {
      const balanceUpdate = {
        $inc: {
          totalLeaves: -1,
          totalLeavesLeft: -1,
          totalLeavesTaken: 1,
        },
      };

      if (updateStatus.type === "Official Leave") {
        balanceUpdate.$inc.officialLeave = -1;
        balanceUpdate.$inc.officialLeaveLeft = -1;
        balanceUpdate.$inc.officialLeaveTaken = 1;
      } else if (updateStatus.type === "Medical Leave") {
        balanceUpdate.$inc.medicalLeave = -1;
        balanceUpdate.$inc.medicalLeaveLeft = -1;
        balanceUpdate.$inc.medicalLeaveTaken = 1;
      } else if (updateStatus.type === "Casual Leave") {
        balanceUpdate.$inc.casualLeave = -1;
        balanceUpdate.$inc.casualLeaveLeft = -1;
        balanceUpdate.$inc.casualLeaveTaken = 1;
      }

      await AdminRegister.findByIdAndUpdate(applicant._id, balanceUpdate);
    } else if (status === "rejected") {
      await AdminRegister.findByIdAndUpdate(applicant._id, { $inc: { rejectedLeaveRequests: 1 } });
    }

    // Email notification (non-blocking)
    if (applicant.email) {
      (async () => {
        try {
          const { subject, text, html } = leaveUpdateTemplate(
            applicant.name,
            updateStatus.type,
            updateStatus.status
          );
          await transport.sendMail({
            from: '"Requesta Portal" <adtshrm1@gmail.com>',
            to: applicant.email,
            subject, text, html,
          });
        } catch (emailErr) {
          console.error("Error sending admin leave update email:", emailErr);
        }
      })();
    }

    return res.status(200).json({ message: "Status updated successfully", data: updateStatus });
  } catch (err) {
    console.error("Error updating admin leaves:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── Get Audit Logs for an Admin Leave Request ─────────────────────────────────
export const getAdminLeaveAuditLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await getLogsForRequest(id);
    return res.status(200).json({ data: logs });
  } catch (err) {
    console.error("Error fetching admin leave audit logs:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
