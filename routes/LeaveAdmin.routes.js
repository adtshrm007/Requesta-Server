import express from "express";
import { verifyAccessToken1 } from "../middleware/authAdmin.middleware.js";
import {
  submitLeaves,
  getAdminLeaves,
  getAllAdminLeaves,
  showFacultyLeave,
  showDepartemntalAdminLeave,
  UpdateLeaves,
  getAdminLeaveAuditLogs,
} from "../controllers/LeaveAdmin.controller.js";
import { upload } from "../middleware/multer.js";
import { VerifyRole } from "../middleware/VerifyRole.js";

const router = express.Router();

// Submit leave (Faculty or Departmental Admin)
router.post(
  "/leave",
  verifyAccessToken1,
  upload.single("supportingDocument"),
  submitLeaves
);

// Get own leave history
router.get("/getLeave", verifyAccessToken1, getAdminLeaves);

// Get all admin leaves (Super Admin: full view)
router.get(
  "/getAllLeave",
  verifyAccessToken1,
  VerifyRole(["Departmental Admin", "Super Admin"]),
  getAllAdminLeaves
);

// Dept Admin: see Faculty leaves pending their action
router.get(
  "/getFacultyLeave",
  verifyAccessToken1,
  VerifyRole("Departmental Admin"),
  showFacultyLeave
);

// Super Admin: see Departmental Admin leaves pending their action
router.get(
  "/getDepartmentalAdminLeave",
  verifyAccessToken1,
  VerifyRole("Super Admin"),
  showDepartemntalAdminLeave
);

// Update admin leave status (RBAC enforced inside controller)
router.put("/updateAdminLeaves", verifyAccessToken1, UpdateLeaves);

// Audit logs for an admin leave request
router.get("/requests/admin/:id/logs", verifyAccessToken1, getAdminLeaveAuditLogs);

export default router;
