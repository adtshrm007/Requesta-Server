// config/upload.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",      // folder in Cloudinary
    resource_type: "raw",   // allows pdf, doc, docx, pptx
    allowed_formats: ["pdf", "doc", "docx", "pptx"],
    use_filename: true,
    unique_filename: false,
  },
});

export const upload = multer({ storage });
