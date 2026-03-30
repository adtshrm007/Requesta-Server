import express from "express";
import {
  generateRequest,
  validateRequest,
  approvalSuggestion,
  fraudDetection,
  systemInsights,
} from "../controllers/AI.controller.js";
import { verifyAccessToken } from "../middleware/authStudent.middleware.js";
import { verifyAccessToken1 } from "../middleware/authAdmin.middleware.js";

const router = express.Router();

/**
 * Dual-auth middleware: accepts both student and admin tokens.
 * Tries student first, then admin. Rejects if neither works.
 */
const dualAuth = (req, res, next) => {
  verifyAccessToken(req, res, (studentErr) => {
    if (!studentErr) return next();
    verifyAccessToken1(req, res, (adminErr) => {
      if (!adminErr) return next();
      return res.status(401).json({ message: "Authentication required" });
    });
  });
};

/**
 * Admin-only middleware.
 */
const adminOnly = (req, res, next) => {
  verifyAccessToken1(req, res, (err) => {
    if (err) return res.status(401).json({ message: "Admin authentication required" });
    next();
  });
};

// ── Module 1: Generate formal request text (student + admin) ──────────────────
router.post("/generate-request", dualAuth, generateRequest);

// ── Module 2: Validate request quality before submission (student + admin) ─────
router.post("/validate-request", dualAuth, validateRequest);

// ── Module 3: AI approval suggestion for a specific request (admin only) ───────
router.post("/approval-suggestion", adminOnly, approvalSuggestion);

// ── Module 4: Fraud / abuse detection for a student (admin only) ───────────────
router.get("/check-fraud", adminOnly, fraudDetection);

// ── Module 7: System-level AI insights (admin only) ───────────────────────────
router.get("/system-insights", adminOnly, systemInsights);

export default router;
