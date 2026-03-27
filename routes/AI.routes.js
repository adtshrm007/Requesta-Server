import express from "express";
import { generateRequest } from "../controllers/AI.controller.js";
import { verifyAccessToken } from "../middleware/authStudent.middleware.js";
import { verifyAccessToken1 } from "../middleware/authAdmin.middleware.js";

const router = express.Router();

/**
 * POST /api/ai/generate-request
 * Accessible by students AND admins
 */
router.post("/generate-request", (req, res, next) => {
  // Try student token first, then admin token
  verifyAccessToken(req, res, (err) => {
    if (!err) return generateRequest(req, res);
    verifyAccessToken1(req, res, (err2) => {
      if (!err2) return generateRequest(req, res);
      return res.status(401).json({ message: "Authentication required" });
    });
  });
});

export default router;
