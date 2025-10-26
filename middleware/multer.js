import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// Memory storage keeps the file in RAM
const storage = multer.memoryStorage();
export const upload = multer({ storage }).single("supportingDocument");

// Upload buffer to Cloudinary
export const uploadToCloudinary = (fileBuffer, filename = "file") => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) return reject(new Error("No file buffer provided"));

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "uploads",
        resource_type: "auto", // important for PDF/Word/PPT
        use_filename: true,
        unique_filename: false,
        filename_override: filename, // optional, keeps original file name
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};
