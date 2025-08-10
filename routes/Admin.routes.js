import express from "express";

import { registerAdmin,updateAdmin,getAdminById } from "../controllers/Admin.controller.js";
import { verifyAccessToken } from "../middleware/authAdmin.middleware.js";

const router=express.Router();

router.post("/register",registerAdmin)
router.get("/get",getAdminById);
router.get("/dashboard",verifyAccessToken,(req,res)=>{
    res.json({ data:req.user });
})
router.put("/update",verifyAccessToken,updateAdmin)

export default router;