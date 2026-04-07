import mongoose, { Schema } from "mongoose";

const LeaveModelSchema = new Schema(
  {
    type: { type: String, default: "LEAVE" },
    createdBy: { type: Schema.Types.ObjectId, ref: "studentRegister" },
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
      enum: ["pending", "forwarded", "approved", "rejected"],
      default: "pending",
    },
    currentHandlerRole: {
      type: String,
      enum: ["FACULTY", "DEPT_ADMIN", "SUPER_ADMIN"],
      default: "FACULTY",
    },
    createdByRole: {
      type: String,
      default: "STUDENT",
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
    remarks: {
      type: String,
      default: "No Remarks",
    },
    approvedBy: {
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

const LeaveModel = mongoose.model("Leave", LeaveModelSchema);
export default LeaveModel;
