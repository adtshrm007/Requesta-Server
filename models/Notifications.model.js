import mongoose, { Schema } from "mongoose";

const NotificationsModelSchema = new Schema(
  {
    RegistrationNumber: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["leave", "certificate", "general"],
      default: "general",
    },
  },
  { timestamps: true }
);


const NotificationsModel=mongoose.model("Notifications",NotificationsModelSchema)
export default NotificationsModel