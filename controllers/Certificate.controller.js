import Certificate from "../models/Certificate.model.js";
import Student from "../models/studentRegister.model.js";
import cloudinary from "../config/cloudinary.js";
import { transport } from "../config/nodemailer.js";
import { certificateSubmissionTemplate } from "../templates/CertificateSubmission.template.js";
import { certificateUpdateTemplate } from "../templates/CertificateUpdate.template.js";
import fs from "fs";
import mime from "mime-types";
export const handleCertificateRequests = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    let supportingDocumentUrl = null;
    if (req.file) {
      const fileType = mime.lookup(req.file.originalname);
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "raw",
        folder: "uploads",
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
    const newCertificate = new Certificate({
      student: student._id,
      purpose: req.body.purpose,
      CertificateType: req.body.CertificateType,
      supportingDocument: supportingDocumentUrl,
    });
    await newCertificate.save();
    (async () => {
      try {
        const { subject, text, html } = certificateSubmissionTemplate(
          student.name
        );
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
    return res.status(201).json({
      message: "Certificate request submitted successfully",
      data: newCertificate,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAllCertificates = async (req, res) => {
  try {
    const dept = req.user.department;
    const certificate = await Certificate.find()
      .populate({ path: "student", match: { branch: dept } })
      .then((certificate) =>
        certificate.filter((cert) => cert.student !== null)
      );
    res.json(certificate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const UpdateCertificates = async (req, res) => {
  try {
    const { certId, status, remark } = req.body;
    const validStatus = ["approved", "rejected", "pending"];

    if (!certId)
      return res.status(400).json({ message: "Certificate ID is required" });
    if (!validStatus.includes(status))
      return res.status(400).json({ message: "Invalid status value" });
    let addCertificateURL = null;

    if (req.file) {
      const fileType = mime.lookup(req.file.originalname);
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "raw",
        folder: "uploads",
        type: "upload",
        use_filename: true,
        unique_filename: false,
      });

      addCertificateURL = result.secure_url;

      if (
        fileType === "application/pdf" ||
        fileType === "application/msword" ||
        fileType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileType ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      ) {
        addCertificateURL = `https://docs.google.com/gview?url=${addCertificateURL}&embedded=true`;
      }

      fs.unlinkSync(req.file.path);
    }

    const updateStatus = await Certificate.findByIdAndUpdate(
      certId,
      { status, remark, addCertificate: addCertificateURL },
      { new: true }
    ).populate("student");

    if (status === "rejected") {
      await AdminRegister.findByIdAndUpdate(req.user.adminID, {
        $inc: { rejectedLeaveRequests: 1 },
      });
    } else if (status === "approved") {
      await AdminRegister.findByIdAndUpdate(req.user.id, {
        $inc: { acceptedLeaveRequests: 1 },
      });
    }

    if (!updateStatus)
      return res.status(404).json({ message: "Certificate not found" });

    (async () => {
      try {
        const { subject, text, html } = certificateUpdateTemplate(
          updateStatus.student.name,
          updateStatus.purpose,
          updateStatus.status
        );
        await transport.sendMail({
          from: '"Requesta  Portal" <adtshrm1@gmail.com>',
          to: updateStatus.student.email,
          subject,
          text,
          html,
        });
      } catch (emailErr) {
        console.error("Error sending registration email:", emailErr);
      }
    })();

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
