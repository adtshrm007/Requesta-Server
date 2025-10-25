import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const storage = multer.memoryStorage();
export const upload = multer({ storage }).single("supportingDocument");

export const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "uploads", resource_type: "raw" },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};
