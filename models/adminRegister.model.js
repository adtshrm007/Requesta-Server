import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";

const adminRegister = new Schema(
  {
    adminID: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      match: /^[6-9]\d{9}$/, // Optional: Validates Indian mobile numbers
    },
    department: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

adminRegister.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      adminID: this.admimID,
      name: this.name,
      mobileNumber: this.mobileNumber,
      department: this.department,
      refreshToken: this.refreshToken,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_SECRET,
    }
  );
};
adminRegister.methods.generateRefreshToken=function(){
  return jwt.sign(
    {
      _id:this._id

    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

const AdminRegister = mongoose.model("Admin Register", adminRegister);

export default AdminRegister;
