import mongoose, { Schema } from "mongoose";

const LeaveModelSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    studentName: { type: String, required: true },
    studentRegNumber: { type: String, required: true },
    subject: { type: String, required: true },
    Reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    supportingDocument:{
      type:String,
      required:false
    }
  },
  { timestamps: true }
);

const LeaveModel = mongoose.model("Leave", LeaveModelSchema);
export default LeaveModel;
