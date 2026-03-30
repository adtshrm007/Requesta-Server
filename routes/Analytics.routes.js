import express from "express";
import { getSummary, getAdvancedAnalytics } from "../controllers/Analytics.controller.js";
import { verifyAccessToken1 } from "../middleware/authAdmin.middleware.js";
import { VerifyRole } from "../middleware/VerifyRole.js";

const router = express.Router();

const deptAndSuperAdmin = VerifyRole(["Departmental Admin", "Super Admin"]);

/**
 * GET /api/analytics/summary
 * Basic stats: totals, approval/rejection rates, 30-day time series
 */
router.get("/summary", verifyAccessToken1, deptAndSuperAdmin, getSummary);

/**
 * GET /api/analytics/advanced
 * Extended stats: frequent applicants, reason categories, monthly trends, dept breakdown
 */
router.get("/advanced", verifyAccessToken1, deptAndSuperAdmin, getAdvancedAnalytics);

export default router;
