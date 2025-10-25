import express from "express";
const router = express.Router();
import { handleCertificateRequests,getAllCertificates,UpdateCertificates,getCertificateForSuperAdmin } from "../controllers/Certificate.controller.js";
import { verifyAccessToken } from "../middleware/authStudent.middleware.js";
import { verifyAccessToken1 } from "../middleware/authAdmin.middleware.js";
import { upload } from "../middleware/multer.js";
router.post("/submitCertificate",verifyAccessToken,upload,handleCertificateRequests);
router.get("/showCertificates",verifyAccessToken1,getAllCertificates);
router.get("/certificateForSuperAdmin",verifyAccessToken1,getCertificateForSuperAdmin)
router.put("/updateCertificates",verifyAccessToken1,upload,UpdateCertificates);
export default router;