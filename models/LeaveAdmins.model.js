import mongoose from "mongoose";

const LeaveAdminSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminRegister",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    supportingDocument: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    remark: {
      type: String,
      default: null,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const LeaveAdminModel = mongoose.model("LeaveAdmin", LeaveAdminSchema);
export default LeaveAdminModel;
