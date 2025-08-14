import express from "express"

import {registerStudent,getAllStudents,updateStudent,getLeaves} from "../controllers/Student.controller.js";
import { verifyAccessToken } from "../middleware/authStudent.middleware.js";


const router = express.Router();

router.post("/register", registerStudent);
router.get("/", getAllStudents);

router.get("/dashboard",verifyAccessToken,(req,res)=>{
    res.json({ data:req.user });

})
router.put("/update",verifyAccessToken,updateStudent)
router.get("/getLeaves",verifyAccessToken,getLeaves)


export default router;

