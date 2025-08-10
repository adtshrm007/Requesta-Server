import AdminRegister from "../models/adminRegister.model.js";

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
