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
    password:{
      type:String,
      required:true
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
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

adminRegister.pre("save",async function(next){
  if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next();

})
adminRegister.methods.isPasswordCorrect=async function(password){
  return await bcrypt.compare(password, this.password)
}

adminRegister.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      adminID: this.adminID,
      name: this.name,
      email: this.email,
      department: this.department,
      refreshToken: this.refreshToken,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
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

const AdminRegister = mongoose.model("AdminRegister", adminRegister);

export default AdminRegister;
