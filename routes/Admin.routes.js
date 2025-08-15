import express from "express";

import { registerAdmin,updateAdmin,getAdminById ,getAllStudentsDataForAdmin,getRequetsOfAStudentForAdmin} from "../controllers/Admin.controller.js";
import { verifyAccessToken1 } from "../middleware/authAdmin.middleware.js";

const router=express.Router();

router.post("/register",registerAdmin)
router.get("/get",getAdminById);
router.get("/dashboard",verifyAccessToken1,(req,res)=>{
    res.json({ data:req.user });
})
router.put("/update",verifyAccessToken1,updateAdmin)
router.get("/students",verifyAccessToken1,getAllStudentsDataForAdmin)
router.get("/studentRequests",verifyAccessToken1,getRequetsOfAStudentForAdmin)

export default router;