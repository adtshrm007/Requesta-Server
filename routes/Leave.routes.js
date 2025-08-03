import express from "express"

import { handleLeaves,getAllLeaves } from "../controllers/Leave.controller.js"; 

const router=express.Router();

router.post("/leaves",handleLeaves);
router.get("/",getAllLeaves);

export default router;