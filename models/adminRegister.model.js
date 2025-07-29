import { Schema } from "mongoose";

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
  },
  { timestamps: true }
);

const AdminRegister = mongoose.model("Admin Register", adminRegister);

export default AdminRegister;
