import express from "express"
import handleLeaves from "../controllers/Leave.controller.js"

const router=express.Router();

router.post("/leaves",handleLeaves);

export default router;