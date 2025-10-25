import express from "express";

const router = express.Router();
import {
  handleLeaves,
  getAllLeaves,
  UpdateLeaves,
  getLeavesForSuperAdmin,
  getLeavesForDepartmentalAdmin,
} from "../controllers/Leave.controller.js";
import { verifyAccessToken } from "../middleware/authStudent.middleware.js";
import { verifyAccessToken1 } from "../middleware/authAdmin.middleware.js";
import { upload } from "../middleware/multer.js";
router.post(
  "/submitLeaves",
  verifyAccessToken,
  upload,
  handleLeaves
);
router.get("/showLeaves", verifyAccessToken1, getAllLeaves);
router.put("/updateLeaves", verifyAccessToken1, UpdateLeaves);
router.get("/leavesForSuperAdmin", verifyAccessToken1, getLeavesForSuperAdmin);
router.get(
  "/leavesForDepartmentalAdmin",
  verifyAccessToken1,
  getLeavesForDepartmentalAdmin
);
export default router;
