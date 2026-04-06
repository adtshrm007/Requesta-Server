import express from "express";
import { getSummary, getAdvancedAnalytics, getDecisionIntelligence, getLeaveInsightsData } from "../controllers/Analytics.controller.js";
import { verifyAccessToken1 } from "../middleware/authAdmin.middleware.js";
import { VerifyRole } from "../middleware/VerifyRole.js";

const router = express.Router();

const anyAdmin = VerifyRole(["Departmental Admin", "Super Admin", "Faculty"]);
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

/**
 * GET /api/analytics/decision-intelligence
 * Production-ready data layer for Decision Intelligence
 */
router.get("/decision-intelligence", verifyAccessToken1, anyAdmin, getDecisionIntelligence);

/**
 * GET /api/analytics/leave-insights
 * Hard data for System Insights: reasons, monthly stats, peak days, status breakdown
 */
router.get("/leave-insights", verifyAccessToken1, anyAdmin, getLeaveInsightsData);

export default router;
