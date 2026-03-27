import mongoose, { Schema } from "mongoose";

const CertificateModel = new Schema(
  {
    type: { type: String, default: "CERTIFICATE" },
    createdBy: { type: Schema.Types.ObjectId, ref: "studentRegister" },
    student: {
      type: Schema.Types.ObjectId,
      ref: "studentRegister",
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
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    currentHandlerRole: {
      type: String,
      enum: ["SUPER_ADMIN"],
      default: "SUPER_ADMIN",
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
      default: "No Remarks",
    },
    remarks: {
      type: String,
      default: "No Remarks",
    },
    addCertificate: {
      type: String,
      default: "",
    },
    approvedBy: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Certificate = mongoose.model("Certificate", CertificateModel);
export default Certificate;
