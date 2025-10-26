import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
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
        resource_type: "raw", // important for PDF/Word/PPT
        use_filename: true,
        unique_filename: false,
        filename_override: filename, // optional, keeps original file name
        overwrite:true,
        type:"upload"
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};
