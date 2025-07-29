import express from "express"
import handleLeaves from "../controllers/Leave.controller"

const router=express.Router();

router.post("/leaves",handleLeaves);

export default router;