import mongoose from "mongoose";
const { Schema } = mongoose;
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
const studentRegisterSchema = new Schema({
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^[6-9]\d{9}$/  // Optional: Validates Indian mobile numbers
  },
  password:{
    type:String,
    required:true,
  },
  branch: {
    type: String,
    required: true
  },
  year: {
    type: Number, // or use enum if it's fixed
    required: true,
  },
  refreshToken:{
    type:String

  }
}, { timestamps: true }); // Adds createdAt and updatedAt fields

studentRegisterSchema.pre("save",async function(next){
  if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next();

})
studentRegisterSchema.methods.isPasswordCorrect=async function(password){
  return await bcrypt.compare(password, this.password)
}
studentRegisterSchema.methods.generateAccessToken=function(){
  return jwt.sign({
     _id:this._id,
     registrationNumber:this.registrationNumber,
     name:this.name,
     mobileNumber:this.mobileNumber,
     branch:this.branch,
     year:this.year

  },
process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    })
    
  
}

studentRegisterSchema.methods.generateRefreshToken=function(){
  return jwt.sign({
    _id:this._id
  },
  process.env.REFRESH_TOKEN_SECRET,
  {
     expiresIn:process.env.REFRESH_TOKEN_EXPIRY
  }
)
}


const Student = mongoose.model("Student", studentRegisterSchema);

export default Student;
