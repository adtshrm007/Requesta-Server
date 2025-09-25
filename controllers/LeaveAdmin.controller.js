import AdminRegister from "../models/adminRegister.model.js";
import LeaveAdminModel from "../models/LeaveAdmins.model.js";
import fs from "fs";
import mime from "mime-types";
import cloudinary from "../config/cloudinary.js";
export const submitLeaves = async (req, res) => {
  try {
    const admin = await AdminRegister.findById(req.user.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if(admin.medicalLeaveLeft<=0 && req.body.type==="Medical Leave"){
      return res.status(400).json({ message: "No Medical Leaves Left" });
    }
    if(admin.officialLeaveLeft<=0 && req.body.type==="Official Leave"){
      return res.status(400).json({ message: "No Official Leaves Left" });
    }
    if(admin.casualLeaveLeft<=0 && req.body.type==="Casual Leave"){
      return res.status(400).json({ message: "No Casual Leaves Left" });
    }
    
    let supportingDocumentUrl = null;

    if (req.file) {
      const fileType = mime.lookup(req.file.originalname);
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "raw",
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

    const newLeave = new LeaveAdminModel({
      admin: admin._id,
      supportingDocument: supportingDocumentUrl,
      type: req.body.type,
      remark: req.body.remark,
      reason: req.body.reason,
      fromDate: req.body.fromDate,
      toDate: req.body.toDate,
    });

    

    await newLeave.save();
    return res.status(200).json({
      message: "Leave application submitted successfully",
      data: newLeave,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};
export const getAdminLeaves = async (req, res) => {
  try {
    const leave = await LeaveAdminModel.find({ admin: req.user.id })
      .populate({ path: "admin" })
      .sort({ createdAt: -1 });
    if (!leave) {
      return res.status(404).json({ message: "No leave application found" });
    }
    return res.status(200).json({ data: leave });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllAdminLeaves = async (req, res) => {
  try {
    const leave = await LeaveAdminModel.find(req.user.id)
      .populate({ path: "admin" })
      .sort({ createdAt: -1 });
    if (!leave) {
      return res.status(404).json({ message: "No leave application found" });
    }
    return res.status(200).json({ data: leave });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const showFacultyLeave = async (req, res) => {
  try {
    const adminDepartment = req.user.department;

    if (!adminDepartment) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const leaves = await LeaveAdminModel.find()
      .populate({
        path: "admin",
        match: { role: "Faculty", department: adminDepartment },
      })
      .then((leaves) => leaves.filter((leave) => leave.admin !== null));

    res.json(leaves);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
export const showDepartemntalAdminLeave=async(req,res)=>{
  try {
    const adminDepartment = req.user.department;

    if (!adminDepartment) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const leaves = await LeaveAdminModel.find()
      .populate({
        path: "admin",
        match: { role: "Departmental Admin", department: adminDepartment },
      })
      .then((leaves) => leaves.filter((leave) => leave.admin !== null));

    res.json(leaves);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}



export const UpdateLeaves = async (req, res) => {
  try {
    const { leaveId, status, remark } = req.body;
    const validStatus = ["approved","forwarded", "rejected", "pending"];

    if (!leaveId)
      return res.status(400).json({ message: "Leave ID is required" });
    if (!validStatus.includes(status))
      return res.status(400).json({ message: "Invalid status value" });

    const admin = await AdminRegister.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const updateStatus = await LeaveAdminModel.findByIdAndUpdate(
      leaveId,
      { status, remark},
      { new: true }
    ).populate("admin");

    const applicant = updateStatus.admin;
    if (!applicant) {
      return res.status(404).json({ success: false, message: "Applicant not found" });
    }
    if (status === "rejected") {
      await AdminRegister.findByIdAndUpdate(applicant._id, {
        $inc: { rejectedLeaveRequests: 1 },
      });
    } else if (status === "approved") {
      if (updateStatus.type === "Official Leave") {
      await AdminRegister.findByIdAndUpdate(applicant._id, {
        $inc: {
          totalLeaves: -1,
          totalLeavesLeft: -1,
          totalLeavesTaken: 1,
          officialLeave: -1,
          officialLeaveLeft: -1,
          officialLeaveTaken: 1,
        },
      });
    }
    if (updateStatus.type === "Medical Leave") {
      await AdminRegister.findByIdAndUpdate(applicant._id, {
        $inc: {
          totalLeaves: -1,
          totalLeavesLeft: -1,
          totalLeavesTaken: 1,
          medicalLeave: -1,
          medicalLeaveLeft: -1,
          medicalLeaveTaken: 1,
        },
      });
    }
    if (updateStatus.type === "Casual Leave") {
      await AdminRegister.findByIdAndUpdate(applicant.id, {
        $inc: {
          totalLeaves: -1,
          totalLeavesLeft: -1,
          totalLeavesTaken: 1,
          casualLeave: -1,
          casualLeaveLeft: -1,
          casualLeaveTaken: 1,
        },
      });
    }
    }
    (async () => {
      try {
        const { subject, text, html } = leaveUpdateTemplate(
          updateStatus.admin.name,
          updateStatus.type,
          updateStatus.status,
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
    await updateStatus.save();

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