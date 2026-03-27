import express from "express";

const router = express.Router();
import {
  handleLeaves,
  getAllLeaves,
  UpdateLeaves,
  getLeavesForSuperAdmin,
  getLeavesForDepartmentalAdmin,
  getLeaveAuditLogs,
} from "../controllers/Leave.controller.js";
import { verifyAccessToken } from "../middleware/authStudent.middleware.js";
import { verifyAccessToken1 } from "../middleware/authAdmin.middleware.js";
import { upload } from "../middleware/multer.js";
import { VerifyRole } from "../middleware/VerifyRole.js";

// Student: submit leave
router.post("/submitLeaves", verifyAccessToken, upload.single("supportingDocument"), handleLeaves);

// Faculty: see pending leaves in their dept
router.get(
  "/showLeaves",
  verifyAccessToken1,
  VerifyRole("Faculty"),
  getAllLeaves
);

// Dept Admin: see forwarded leaves
router.get(
  "/leavesForDepartmentalAdmin",
  verifyAccessToken1,
  VerifyRole("Departmental Admin"),
  getLeavesForDepartmentalAdmin
);

// Super Admin: view all student leaves (read-only)
router.get(
  "/leavesForSuperAdmin",
  verifyAccessToken1,
  VerifyRole("Super Admin"),
  getLeavesForSuperAdmin
);

// Faculty + Dept Admin: update leave status (RBAC enforced inside controller)
router.put("/updateLeaves", verifyAccessToken1, UpdateLeaves);

// Audit logs for a leave request
router.get("/requests/:id/logs", verifyAccessToken1, getLeaveAuditLogs);

export default router;
