import express from "express"

const router=express.Router();
import { handleLeaves,getAllLeaves } from "../controllers/Leave.controller.js";
import { verifyAccessToken } from "../middleware/authStudent.middleware.js";
router.post("/submitLeaves",verifyAccessToken,handleLeaves);
router.get("/showLeaves",getAllLeaves)

export default router;