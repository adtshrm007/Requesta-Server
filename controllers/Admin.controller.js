import AdminRegister from "../models/adminRegister.model.js";
import LeaveModel from "../models/Leave.model.js";
import Student from "../models/studentRegister.model.js";
import Certificate from "../models/Certificate.model.js";
export const registerAdmin = async (req, res) => {
  try {
    const { adminID, name, mobileNumber, department } = req.body;
    const existing = await AdminRegister.findOne({
      $or: [
        { adminID: req.body.adminID },
        { mobileNumber: req.body.mobileNumber },
      ],
    });
    if (existing) {
      return res.status(400).json({
        message: "Admin already registered with this ID or mobile number",
      });
    }
    const newAdmin = new AdminRegister({
      adminID,
      name,
      mobileNumber,
      department,
    });
    await newAdmin.save();
    return res
      .status(200)
      .json({ message: "Admin registered succesfully", data: newAdmin });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAdminById = async (req, res) => {
  try {
    const { adminID } = req.query;
    const admin = await AdminRegister.findOne({ adminID });
    if (admin) {
      const accessToken = admin.generateAccessToken();
      const refreshToken = admin.generateRefreshToken();
      admin.refreshToken = refreshToken;
      await admin.save();
      return res.status(200).json({ message: "Admin Found", data: admin,accessToken });
    }
    return res.status(404).json({message:"Admin not Found.Please check the ID"})

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateAdmin=async(req,res)=>{
  try{
    const {name,mobileNumber,department}=req.body;
    const updatedAdmin=await AdminRegister.findOneAndUpdate(
      {
        adminID:req.body.adminID
      },
      {name,mobileNumber,department},
      {new:true}

    )
    if(!updatedAdmin){
      return res.status(404).json({message:"Admin not found"})

    }
    return res.status(200).json({message:"Admin updated successfully",data:updatedAdmin})
    
  }
  catch(err){
    return res.status(500).json({ error: err.message });
  }
}

export const getAllStudentsDataForAdmin = async (req, res) => {
  try {
    const dept= req.user.department;

    const allStudents = await Student.find({branch: dept})
      .select("registrationNumber name mobileNumber branch year")
      .sort({ name: 1 });

    return res.status(200).json(allStudents);
  } catch (error) {
    console.error("Error occurred while fetching students data:", error);
    return res.status(500).json({ message: "An error occurred while fetching the data" });
  }
};
export const getRequetsOfAStudentForAdmin=async(req,res)=>{
  try{
    const { studentId } = req.query;
    const leaves=await LeaveModel.find({studentId})
    .populate("studentId")
    .sort({ createdAt: -1 });
    if(!leaves || leaves.length===0){
      return res.status(404).json({message:"No leaves found for this student"})
    }
    return res.status(200).json(leaves);
  }
  catch(err){
    console.error("Error fetching leaves:", err);
    res.status(500).json({ error: "Server error while fetching leaves" });
  }
}
export const getCertificateRequetsOfAStudentForAdmin=async(req,res)=>{
  try{
    const { student } = req.query;
    const leaves=await Certificate.find({student})
    .populate("student")
    .sort({ createdAt: -1 });
    if(!leaves || leaves.length===0){
      return res.status(404).json({message:"No Certificates found for this student"})
    }
    return res.status(200).json(leaves);
  }
  catch(err){
    console.error("Error fetching leaves:", err);
    res.status(500).json({ error: "Server error while fetching leaves" });
  }
}