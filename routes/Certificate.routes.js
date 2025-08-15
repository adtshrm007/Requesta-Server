import express from "express";
const router = express.Router();
import { handleCertificateRequests,getAllCertificates,UpdateCertificates } from "../controllers/Certificate.controller.js";
import { verifyAccessToken } from "../middleware/authStudent.middleware.js";
import { verifyAccessToken1 } from "../middleware/authAdmin.middleware.js";
router.post("/submitCertificate",verifyAccessToken,handleCertificateRequests);
router.get("/showCertificates",verifyAccessToken1,getAllCertificates);
router.put("/updateCertificates",verifyAccessToken1,UpdateCertificates);
export default router;