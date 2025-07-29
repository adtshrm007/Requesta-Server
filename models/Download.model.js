import mongoose, { Schema } from "mongoose";

const DownloadSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  certificate: {
    type: Schema.Types.ObjectId,
    ref: "Certificate",
    required: true,
  },
  downloadLink: {
    type: String, // URL or path to PDF
    required: true,
  },
  downloadedAt: {
    type: Date,
    default: Date.now,
  }
});

const Download = mongoose.model("Download", DownloadSchema);
export default Download;
