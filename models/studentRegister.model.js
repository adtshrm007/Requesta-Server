import mongoose from "mongoose";
const { Schema } = mongoose;

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
  branch: {
    type: String,
    required: true
  },
  year: {
    type: Number, // or use enum if it's fixed
    required: true,
    min: 1,
    max: 4
  }
}, { timestamps: true }); // Adds createdAt and updatedAt fields

const Student = mongoose.model("Student", studentRegisterSchema);

export default Student;
