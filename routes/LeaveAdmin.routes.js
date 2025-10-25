import express from "express";
import { verifyAccessToken1 } from "../middleware/authAdmin.middleware.js";
import {
  submitLeaves,
  getAdminLeaves,
  getAllAdminLeaves,
  showFacultyLeave,
  showDepartemntalAdminLeave,
  UpdateLeaves
} from "../controllers/LeaveAdmin.controller.js";
import { upload } from "../middleware/multer.js";
import {VerifyRole} from "../middleware/VerifyRole.js"
const router = express.Router();

router.post(
  "/leave",
  verifyAccessToken1,
  upload,
  submitLeaves
);
router.get("/getLeave", verifyAccessToken1, getAdminLeaves);
router.get("/getAllLeave", verifyAccessToken1, getAllAdminLeaves);
router.get("/getFacultyLeave",verifyAccessToken1,VerifyRole("Departmental Admin"),showFacultyLeave);
router.get("/getDepartmentalAdminLeave",verifyAccessToken1,VerifyRole("Super Admin"),showDepartemntalAdminLeave);
router.put("/updateAdminLeaves", verifyAccessToken1, UpdateLeaves);
export default router;
