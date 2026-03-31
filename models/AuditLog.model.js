import mongoose, { Schema } from "mongoose";

const AuditLogSchema = new Schema(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    requestType: {
      type: String,
      enum: ["LEAVE", "ADMIN_LEAVE", "CERTIFICATE"],
      required: true,
    },
    action: {
      type: String,
      enum: [
        "REQUEST_CREATED",
        "REQUEST_FORWARDED",
        "REQUEST_APPROVED",
        "REQUEST_REJECTED",
        "UNAUTHORIZED_ACCESS",
        "SYSTEM_DENIED",
      ],
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    performedByName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    remarks: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast lookup by requestId
AuditLogSchema.index({ requestId: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", AuditLogSchema);
export default AuditLog;
