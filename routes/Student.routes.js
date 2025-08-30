import express from "express"

import {registerStudent,loginStudent,updateStudent,getLeaves,getCertificates,loginStudentUsingEmail,sendOTP,handlePasswordChange} from "../controllers/Student.controller.js";
import { verifyAccessToken } from "../middleware/authStudent.middleware.js";


const router = express.Router();

router.post("/register", registerStudent);
router.post("/", loginStudent);
router.post("/otp",sendOTP)
router.post("/emailLogin",loginStudentUsingEmail)
router.put("/changepassword",verifyAccessToken,handlePasswordChange)
router.get("/dashboard",verifyAccessToken,(req,res)=>{
    res.json({ data:req.user });

})
router.put("/update",verifyAccessToken,updateStudent)
router.get("/getLeaves",verifyAccessToken,getLeaves)
router.get("/getCertificates",verifyAccessToken,getCertificates);


export default router;

