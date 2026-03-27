import Certificate from "../models/certificate.model.js";
import Student from "../models/studentRegister.model.js";
import AdminRegister from "../models/adminRegister.model.js";
import { transport } from "../config/nodemailer.js";
import { certificateSubmissionTemplate } from "../templates/CertificateSubmission.template.js";
import { certificateUpdateTemplate } from "../templates/CertificateUpdate.template.js";
import { uploadToCloudinary } from "../middleware/multer.js";
import { canActOnCertificate, canViewCertificates } from "../services/workflow.service.js";
import { createLog, getLogsForRequest } from "../services/auditLog.service.js";

// ── Submit Certificate Request (Student) ────────────────────────────────────
export const handleCertificateRequests = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    let supportingDocumentUrl = null;
    if (req.file && req.file.buffer) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      supportingDocumentUrl = result.secure_url;
    }

    const newCertificate = new Certificate({
      student: student._id,
      purpose: req.body.purpose,
      CertificateType: req.body.CertificateType,
      supportingDocument: supportingDocumentUrl,
      currentHandlerRole: "SUPER_ADMIN",
      createdBy: student._id,
      createdByRole: "STUDENT",
    });

    await newCertificate.save();

    // Audit log
    createLog({
      requestId: newCertificate._id,
      requestType: "CERTIFICATE",
      action: "REQUEST_CREATED",
      performedBy: student._id,
      performedByName: student.name,
      role: "Student",
      remarks: `Certificate request for: ${req.body.CertificateType} — ${req.body.purpose}`,
    });

    // Email (non-blocking)
    (async () => {
      try {
        const { subject, text, html } = certificateSubmissionTemplate(student.name);
        await transport.sendMail({
          from: '"Requesta Portal" <adtshrm1@gmail.com>',
          to: student.email,
          subject, text, html,
        });
      } catch (emailErr) {
        console.error("Error sending certificate submission email:", emailErr);
      }
    })();

    return res.status(201).json({
      message: "Certificate request submitted successfully",
      data: newCertificate,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── Get All Certificates (Super Admin ONLY) ──────────────────────────────────
export const getAllCertificates = async (req, res) => {
  try {
    // RBAC: ONLY Super Admin can view certificates
    const { allowed, reason } = canViewCertificates(req.user.role);
    if (!allowed) {
      return res.status(403).json({ message: reason });
    }

    const dept = req.user.department;
    const certificates = await Certificate.find()
      .populate({ path: "student", match: { branch: dept } })
      .sort({ createdAt: -1 })
      .then((certs) => certs.filter((cert) => cert.student !== null));

    return res.json(certificates);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── Update Certificate Status (Super Admin ONLY) ────────────────────────────
export const UpdateCertificates = async (req, res) => {
  try {
    const { certId, status, remark } = req.body;
    const actorRole = req.user.role;

    if (!certId) return res.status(400).json({ message: "Certificate ID is required" });
    if (!status) return res.status(400).json({ message: "Status is required" });

    const cert = await Certificate.findById(certId);
    if (!cert) return res.status(404).json({ message: "Certificate not found" });

    // RBAC: only Super Admin can act
    const { allowed, reason } = canActOnCertificate(actorRole, cert.status);
    if (!allowed) {
      return res.status(403).json({ message: reason });
    }

    const validStatus = ["approved", "rejected", "pending"];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    let addCertificateURL = null;
    if (req.file && req.file.buffer) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      addCertificateURL = result.secure_url;
    }

    const admin = await AdminRegister.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const updateStatus = await Certificate.findByIdAndUpdate(
      certId,
      {
        status,
        remark,
        addCertificate: addCertificateURL,
        approvedBy: actorRole,
      },
      { new: true }
    ).populate("student");

    if (!updateStatus) return res.status(404).json({ message: "Certificate not found" });

    // Audit log
    const action = status === "approved" ? "REQUEST_APPROVED" : "REQUEST_REJECTED";
    createLog({
      requestId: certId,
      requestType: "CERTIFICATE",
      action,
      performedBy: req.user.id,
      performedByName: req.user.name,
      role: actorRole,
      remarks: remark || null,
    });

    // Update admin stats
    if (status === "rejected") {
      await AdminRegister.findByIdAndUpdate(req.user.id, { $inc: { rejectedCertificateRequests: 1 } });
    } else if (status === "approved") {
      await AdminRegister.findByIdAndUpdate(req.user.id, { $inc: { acceptedCertificateRequests: 1 } });
    }

    // Email (non-blocking)
    if (updateStatus.student?.email) {
      (async () => {
        try {
          const { subject, text, html } = certificateUpdateTemplate(
            updateStatus.student.name,
            updateStatus.purpose,
            updateStatus.status
          );
          await transport.sendMail({
            from: '"Requesta Portal" <adtshrm1@gmail.com>',
            to: updateStatus.student.email,
            subject, text, html,
          });
        } catch (emailErr) {
          console.error("Error sending certificate update email:", emailErr);
        }
      })();
    }

    return res.status(200).json({ message: "Status updated successfully", data: updateStatus });
  } catch (err) {
    console.error("Error updating certificate:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── Get Certificate Audit Logs ───────────────────────────────────────────────
export const getCertificateAuditLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await getLogsForRequest(id);
    return res.status(200).json({ data: logs });
  } catch (err) {
    console.error("Error fetching certificate audit logs:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── Kept for backward compatibility ─────────────────────────────────────────
export const getCertificateForSuperAdmin = async (req, res) => {
  // Redirect to getAllCertificates — same logic, super admin check included
  return getAllCertificates(req, res);
};
