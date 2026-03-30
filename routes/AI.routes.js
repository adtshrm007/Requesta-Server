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

import jwt from "jsonwebtoken";
import Student from "../models/studentRegister.model.js";
import AdminRegister from "../models/adminRegister.model.js";

/**
 * Dual-auth middleware: accepts both student and admin tokens.
 */
const dualAuth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access token missing" });
  }
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decoded.registrationNumber) {
      const student = await Student.findOne({ registrationNumber: decoded.registrationNumber });
      if (student) {
        req.user = { id: student._id, role: "Student", department: student.branch };
        return next();
      }
    } else if (decoded.adminID) {
      const admin = await AdminRegister.findOne({ adminID: decoded.adminID });
      if (admin) {
        req.user = { id: admin._id, role: admin.role, department: admin.department };
        return next();
      }
    }
    return res.status(403).json({ message: "User not found", decoded });
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token", error: err.message, stack: err.stack });
  }
};

/**
 * Admin-only middleware.
 */
const adminOnly = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access token missing" });
  }
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decoded.adminID) {
      const admin = await AdminRegister.findOne({ adminID: decoded.adminID });
      if (admin) {
        req.user = { id: admin._id, role: admin.role, department: admin.department };
        return next();
      }
    }
    return res.status(403).json({ message: "Admin not found" });
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
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
