import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const OTPAdminSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AdminRegister",
    required: true,
  },
  otp: {
    type: String,
  },
},{timestamps:true});

OTPAdminSchema.pre("save", async function (next) {
  if (!this.isModified("otp")) {
    return next();
  }

  this.otp = await bcrypt.hash(this.otp, 10);
  next();
});

OTPAdminSchema.methods.isOTPCorrect = async function(otp){
  return await bcrypt.compare(otp, this.otp);
};

const OTPAdmin = mongoose.model("OTPAdmin", OTPAdminSchema);
export default OTPAdmin;
