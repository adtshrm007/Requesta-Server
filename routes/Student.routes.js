import express from "express"

import {registerStudent,getAllStudents} from "../controllers/Student.controller.js";
import { verifyAccessToken } from "../middleware/authStudent.middleware.js";

const router = express.Router();

router.post("/register", registerStudent);
router.get("/", getAllStudents);
router.get("/dashboard",verifyAccessToken,(req,res)=>{
    res.json({ data:req.user });

})

export default router;

