import express from "express";
const router = express.Router();
import {
  handleCertificateRequests,
  getAllCertificates,
  UpdateCertificates,
  getCertificateForSuperAdmin,
  getCertificateAuditLogs,
} from "../controllers/Certificate.controller.js";
import { verifyAccessToken } from "../middleware/authStudent.middleware.js";
import { verifyAccessToken1 } from "../middleware/authAdmin.middleware.js";
import { upload } from "../middleware/multer.js";
import { VerifyRole } from "../middleware/VerifyRole.js";

// Student: submit certificate request
router.post(
  "/submitCertificate",
  verifyAccessToken,
  upload.single("supportingDocument"),
  handleCertificateRequests
);

// Super Admin ONLY: view all certificates (controller also enforces this)
router.get(
  "/showCertificates",
  verifyAccessToken1,
  VerifyRole("Super Admin"),
  getAllCertificates
);

// Super Admin ONLY: view all certificates (backward-compat)
router.get(
  "/certificateForSuperAdmin",
  verifyAccessToken1,
  VerifyRole("Super Admin"),
  getCertificateForSuperAdmin
);

// Super Admin ONLY: update certificate status
router.put(
  "/updateCertificates",
  verifyAccessToken1,
  VerifyRole("Super Admin"),
  upload.single("addCertificate"),
  UpdateCertificates
);

// Audit logs for a certificate request
router.get("/requests/cert/:id/logs", verifyAccessToken1, getCertificateAuditLogs);

export default router;