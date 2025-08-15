import mongoose, { Schema } from "mongoose";

const CertificateModel = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    CertificateType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Certificate = mongoose.model("Certificate", CertificateModel);
export default Certificate;
