import express from "express";
import { getSummary } from "../controllers/Analytics.controller.js";
import { verifyAccessToken1 } from "../middleware/authAdmin.middleware.js";
import { VerifyRole } from "../middleware/VerifyRole.js";

const router = express.Router();

/**
 * GET /api/analytics/summary
 * Accessible by Departmental Admin and Super Admin only
 */
router.get(
  "/summary",
  verifyAccessToken1,
  VerifyRole(["Departmental Admin", "Super Admin"]),
  getSummary
);

export default router;
