import mongoose, { Schema } from "mongoose";

const CertificateModel = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    CertificateType: {
      type: String,
      enum: ["Bonafide", "Others"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
    },
    RequiredDocument: {
        type:String,
        required:true
    },
  },
  { timestamps: true }
);

const Certificate=mongoose.model("Certificate",CertificateModel)
export default Certificate