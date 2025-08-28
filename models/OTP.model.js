import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const OTPModel = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Student",
    },
    otp: {
      type: String,
    },
  },
  { timestamps: true }
);

OTPModel.pre("save", async function (next) {
  if (!this.isModified("otp")) {
    return next();
  }

  this.otp = await bcrypt.hash(this.otp, 10);
  next();
});

OTPModel.methods.isOTPCorrect=async function (otp) {
    return await bcrypt.compare(otp,this.otp)
    
}

const otp = mongoose.model("otp", OTPModel);
export default otp;
