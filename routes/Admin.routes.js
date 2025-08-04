import express from "express";

import {registerAdmin,getAdmin} from "../controllers/Admin.controller.js";

const router=express.Router();

router.post("/register", registerAdmin);
router.get("/",getAdmin);
export default router
