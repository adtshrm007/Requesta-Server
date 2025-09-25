import mongoose, { Schema } from "mongoose";

const LeaveModelSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "studentRegister",
      required: true,
    },
    studentName: { type: String, required: true },
    studentRegNumber: { type: String, required: true },
    subject: { type: String, required: true },
    Reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "forwarded", "accepted", "rejected"],
      default: "pending",
    },
    supportingDocument: {
      type: String,
      required: false,
    },
    remark: {
      type: String,
      required: false,
      default: "No Remarks",
    },
    approvedBy: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const LeaveModel = mongoose.model("Leave", LeaveModelSchema);
export default LeaveModel;
