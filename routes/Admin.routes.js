import express from "express";

import { registerAdmin,getAdminById,updateAdmin } from "../controllers/Admin.controller";
import { verifyAccessToken } from "../middleware/authAdmin.middleware.js";

const router=express.Router();

router.post("/register",registerAdmin)
router.get("/",getAdminById);
router.get("/dashboard",verifyAccessToken,(req,res)=>{
    res.json({ data:req.user });
})
router.put("/update",verifyAccessToken,updateAdmin)