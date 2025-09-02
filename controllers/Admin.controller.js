import AdminRegister from "../models/adminRegister.model.js";
import LeaveModel from "../models/Leave.model.js";
import Student from "../models/studentRegister.model.js";
import { transport } from "../config/nodemailer.js";
import { registrationAdminTemplate } from "../templates/RegistrationAdmin.template.js";
import Certificate from "../models/Certificate.model.js";
import OTPAdmin from "../models/OTPAdmin.model.js";
import { mailTemplate } from "../templates/ForgotPassword.template.js";
import { VerifyRole } from "../middleware/VerifyRole.js";
export const registerAdmin = async (req, res) => {
  try {
    const { adminID, password, name, email, department ,role} = req.body;
    const existing = await AdminRegister.findOne({
      $or: [{ adminID: req.body.adminID }, { email: req.body.email }],
    });
    if (existing) {
      return res.status(400).json({
        message: "Admin already registered with this ID or email",
      });
    }
    const newAdmin = new AdminRegister({
      adminID,
      password,
      name,
      email,
      department,
      role
    });
    await newAdmin.save();
    (async () => {
      try {
        const { subject, text, html } = registrationAdminTemplate(name, email,role);
        await transport.sendMail({
          from: '"Requesta Portal" <adtshrm1@gmail.com>',
          to: email,
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
      .json({ message: "Admin registered succesfully", data: newAdmin });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAdminById = async (req, res) => {
  try {
    const { adminID, password } = req.body;
    const admin = await AdminRegister.findOne({ adminID });
    if (admin) {
      const isMatch = await admin.isPasswordCorrect(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid Credentials" });
      }
      const accessToken = admin.generateAccessToken();
      const refreshToken = admin.generateRefreshToken();
      admin.refreshToken = refreshToken;
      await admin.save();
      return res
        .status(200)
        .json({ message: "Admin Found", data: admin, accessToken });
    }
    return res
      .status(404)
      .json({ message: "Admin not Found.Please check the ID" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
export const getOtherAdminData=async(req,res)=>{
  try{
    const admin=await AdminRegister.findOne({
      adminID:req.user.adminID,
    })
    if(!admin){
      return res.status(404).json({message:"Admin not found"});
    }

    const admins=await AdminRegister.find({role:"Departmental Admin"});
    return res.status(200).json({data:admins})

  }
  catch(err){
    return res.status(500).json({message:"Server error"});
  }
}
export const sendOTP = async (req, res) => {
  const { adminID, email } = req.body;
  try {
    const admin = await AdminRegister.findOne({
      adminID,
      email,
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const otpCode = Math.floor(Math.random() * 1000000);
    const newOTP = new OTPAdmin({
      admin: admin._id,
      otp: otpCode,
    });
    await newOTP.save();
    (async () => {
      try {
        const { subject, text } = mailTemplate(admin.name, otpCode);
        await transport.sendMail({
          from: '"Requesta Portal" <adtshrm1@gmail.com>',
          to: email,
          subject,
          text,
        });
      } catch (emailErr) {
        console.error("Error sending registration email:", emailErr);
      }
    })();
    return res
      .status(200)
      .json({ message: "OTP sent successfully", data: newOTP });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: "Server error" });
  }
};
export const handlePasswordChange = async (req, res) => {
  const { otp: enteredOTP, password } = req.body;
  try {
    const admin = await AdminRegister.findOne({
      adminID: req.user.adminID,
      email: req.user.email,
    });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const otpRecord = await OTPAdmin
      .findOne({ admin: admin._id })
      .sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ message: "No OTP found" });
    }
    const isMatch = await otpRecord.isOTPCorrect(enteredOTP);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong OTP" });
    }

    admin.password = password;
    await admin.save();

    res.status(200).json({
      message: "Password updated Successfully",
    });
  } catch (err) {
    return err;
  }
};
export const loginAdminUsingEmail = async (req, res) => {
  const { adminID, email, otp: enteredOTP } = req.body;
  try {
    const admin = await AdminRegister.findOne({
      adminID,
      email,
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const otpRecord = await OTPAdmin
      .findOne({ admin: admin._id })
      .sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ message: "No OTP found" });
    }
    const isMatch = await otpRecord.isOTPCorrect(enteredOTP);
    if (!isMatch) {
      return res.status(201).json({ message: "Wrong OTP" });
    }
    const refreshToken = admin.generateRefreshToken();
    const accessToken = admin.generateAccessToken();
    admin.refreshToken = refreshToken;
    await admin.save();
    res.json({
      message: "Admin Found",
      data: admin,
      accessToken,
    });
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" });
  }
};


export const updateAdmin = async (req, res) => {
  try {
    const { name, email, department } = req.body;
    const checkPreExisting=await AdminRegister.findOne({
      email,
      adminID:{$ne:req.user.adminID}
    })
    if(checkPreExisting){
      return  res.status(400).json({message:"This email is already registered"})
    }
    const updatedAdmin = await AdminRegister.findOneAndUpdate(
      {
        adminID: req.body.adminID,
      },
      { name, email, department },
      { new: true }
    );
    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    return res
      .status(200)
      .json({ message: "Admin updated successfully", data: updatedAdmin });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAllStudentsDataForAdmin = async (req, res) => {
  try {
    const dept = req.user.department;

    const allStudents = await Student.find({ branch: dept })
      .select("registrationNumber name mobileNumber branch year")
      .sort({ name: 1 });

    return res.status(200).json(allStudents);
  } catch (error) {
    console.error("Error occurred while fetching students data:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching the data" });
  }
};
export const getRequetsOfAStudentForAdmin = async (req, res) => {
  try {
    const { studentId } = req.query;
    const leaves = await LeaveModel.find({ studentId })
      .populate("studentId")
      .sort({ createdAt: -1 });
    if (!leaves || leaves.length === 0) {
      return res
        .status(404)
        .json({ message: "No leaves found for this student" });
    }
    return res.status(200).json(leaves);
  } catch (err) {
    console.error("Error fetching leaves:", err);
    res.status(500).json({ error: "Server error while fetching leaves" });
  }
};
export const getCertificateRequetsOfAStudentForAdmin = async (req, res) => {
  try {
    const { student } = req.query;
    const leaves = await Certificate.find({ student })
      .populate("student")
      .sort({ createdAt: -1 });
    if (!leaves || leaves.length === 0) {
      return res
        .status(404)
        .json({ message: "No Certificates found for this student" });
    }
    return res.status(200).json(leaves);
  } catch (err) {
    console.error("Error fetching leaves:", err);
    res.status(500).json({ error: "Server error while fetching leaves" });
  }
};
