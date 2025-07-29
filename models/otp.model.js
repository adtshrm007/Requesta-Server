import mongoose, { Schema } from "mongoose";

const OTPModelSchema=new Schema({
    registrationNumber: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Document expires after 5 minutes (300 seconds)
  }
},{timestamps:true})

const OTPModel=mongoose.model("OTP",OTPModelSchema)
export default OTPModel