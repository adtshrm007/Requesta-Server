import express from "express";

import {
  registerAdmin,
  updateAdmin,
  getAdminById,
  getAllStudentsDataForAdmin,
  getRequetsOfAStudentForAdmin,
  getCertificateRequetsOfAStudentForAdmin,
  sendOTP,
  handlePasswordChange,
  loginAdminUsingEmail,
  getOtherAdminData
} from "../controllers/Admin.controller.js";
import { verifyAccessToken1 } from "../middleware/authAdmin.middleware.js";
import { VerifyRole } from "../middleware/VerifyRole.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/get", getAdminById);
router.post("/otp", sendOTP);
router.post("/email", loginAdminUsingEmail);
router.put("/changepassword", verifyAccessToken1, handlePasswordChange);
router.get("/dashboard", verifyAccessToken1, (req, res) => {
  res.json({ data: req.user });
});
router.put("/update", verifyAccessToken1, updateAdmin);
router.get("/students", verifyAccessToken1, getAllStudentsDataForAdmin);
router.get("/admins",verifyAccessToken1,VerifyRole("Super Admin"),getOtherAdminData);
router.get(
  "/studentRequests",
  verifyAccessToken1,
  getRequetsOfAStudentForAdmin
);
router.get(
  "/certificateRequests",
  verifyAccessToken1,
  getCertificateRequetsOfAStudentForAdmin
);

export default router;
