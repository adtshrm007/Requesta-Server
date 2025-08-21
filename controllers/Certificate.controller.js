import Certificate from "../models/Certificate.model.js";
import Student from "../models/studentRegister.model.js";
import cloudinary from "../config/cloudinary.js"
import fs from "fs"
export const handleCertificateRequests = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    let supportingDocumentUrl=null;
    if(req.file){
      const result=await cloudinary.uploader.upload(req.file.path,{
        resource_type:"auto"
      })
      supportingDocumentUrl=result.secure_url;

      fs.unlinkSync(req.file.path)

    }
    const newCertificate = new Certificate({
      student: student._id,
      purpose: req.body.purpose,
      CertificateType: req.body.CertificateType,
      supportingDocument:supportingDocumentUrl
    });
    await newCertificate.save();
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
    const { certId, status } = req.body;
    const validStatus = ["approved", "rejected", "pending"];

    if (!certId)
      return res.status(400).json({ message: "Certificate ID is required" });
    if (!validStatus.includes(status))
      return res.status(400).json({ message: "Invalid status value" });

    const updateStatus = await Certificate.findByIdAndUpdate(
      certId,
      { status },
      { new: true }
    ).populate("student");

    if (!updateStatus)
      return res.status(404).json({ message: "Certificate not found" });

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
