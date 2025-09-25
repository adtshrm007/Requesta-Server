import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const adminRegister = new Schema(
  {
    adminID: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Super Admin", "Departmental Admin", "Faculty"],
    },
    pendingLeaveRequests: { type: Number, default: 0 },
    acceptedLeaveRequests: { type: Number, default: 0 },
    rejectedLeaveRequests: { type: Number, default: 0 },
    pendingCertificateRequests: { type: Number, default: 0 },
    acceptedCertificateRequests: { type: Number, default: 0 },
    rejectedCertificateRequests: { type: Number, default: 0 },
    totalLeaves: {
      type: Number,
      default: 15,
    },
    totalLeavesTaken: {
      type: Number,
      default: 0,
    },
    totalLeavesLeft: {
      type: Number,
      default: 15,
    },
    officialLeave: {
      type: Number,
      default: 5,
    },
    officialLeaveTaken: {
      type: Number,
      default: 0,
    },
    officialLeaveLeft: {
      type: Number,
      default: 5,
    },
    medicalLeave: {
      type: Number,
      default: 5,
    },
    medicalLeaveTaken: {
      type: Number,
      default: 0,
    },
    medicalLeaveLeft: {
      type: Number,
      default: 5,
    },
    casualLeave: {
      type: Number,
      default: 5,
    },
    casualLeaveTaken: {
      type: Number,
      default: 0,
    },
    casualLeaveLeft: {
      type: Number,
      default: 5,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

adminRegister.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});
adminRegister.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

adminRegister.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      adminID: this.adminID,
      name: this.name,
      email: this.email,
      department: this.department,
      role: this.role,
      pendingLeaveRequests: this.pendingLeaveRequests,
      acceptedLeaveRequets: this.acceptedLeaveRequests,
      rejectedLeaveRequets: this.rejectedLeaveRequests,
      pendingCertificateRequets: this.pendingCertificateRequests,
      acceptedCertificateRequets: this.acceptedCertificateRequests,
      rejectedCertificateRequets: this.rejectedCertificateRequests,
      totalLeaves: this.totalLeaves,
      totalLeavesLeft: this.totalLeavesLeft,
      totalLeavesTaken: this.totalLeavesTaken,
      officialLeave:this.officialLeave,
      officialLeaveLeft:this.officialLeaveLeft,
      officialLeaveTaken:this.officialLeaveTaken,
      casualLeave:this.casualLeave,
      casualLeaveLeft:this.casualLeaveLeft,
      casualLeaveTaken:this.casualLeaveTaken,
      medicalLeave:this.medicalLeave,
      medicalLeaveLeft:this.medicalLeaveLeft,
      medicalLeaveTaken:this.medicalLeaveTaken,
      refreshToken: this.refreshToken,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
adminRegister.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

const AdminRegister = mongoose.model("AdminRegister", adminRegister);

export default AdminRegister;
